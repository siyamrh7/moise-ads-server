import express from 'express';
import Ad from '../models/Ad.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/ads — list all ads (populated with creator name)
router.get('/', async (req, res, next) => {
  try {
    const ads = await Ad.find()
      .populate('creator', 'name')
      .sort('-updatedAt');
    res.json({ ads });
  } catch (err) { next(err); }
});

// GET /api/ads/:id — single ad
router.get('/:id', async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('creator', 'name');
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ ad });
  } catch (err) { next(err); }
});

// POST /api/ads — create new ad (always starts as 'idea')
router.post('/', async (req, res, next) => {
  try {
    const data = sanitize(req.body);
    const ad = await Ad.create({
      ...data,
      status: data.status || 'idea',
      createdBy: req.user.role
    });
    res.status(201).json({ ad });
  } catch (err) { next(err); }
});

// PATCH /api/ads/:id — update fields
router.patch('/:id', async (req, res, next) => {
  try {
    const data = sanitize(req.body);
    const ad = await Ad.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('creator', 'name');
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ ad });
  } catch (err) { next(err); }
});

// POST /api/ads/:id/transition — move to new status
router.post('/:id/transition', async (req, res, next) => {
  try {
    const { newStatus, systemMessage } = req.body;
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    // Validate the transition is allowed for this user
    if (!isTransitionAllowed(ad, newStatus, req.user.role)) {
      return res.status(403).json({ error: 'Transition not allowed' });
    }

    // Drive link required when marking as ready
    if (newStatus === 'ready' && !ad.driveLink) {
      return res.status(400).json({ error: 'Drive link required before marking as ready' });
    }

    ad.status = newStatus;
    if (systemMessage) {
      ad.comments.push({ author: 'system', body: systemMessage });
    }
    await ad.save();
    await ad.populate('creator', 'name');
    res.json({ ad });
  } catch (err) { next(err); }
});

// POST /api/ads/:id/comments — add a comment
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body required' });
    }
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    ad.comments.push({ author: req.user.role, body: body.trim() });
    await ad.save();
    await ad.populate('creator', 'name');
    res.json({ ad });
  } catch (err) { next(err); }
});

// DELETE /api/ads/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    // Unlink iteration children
    await Ad.updateMany({ parentAdId: ad._id }, { parentAdId: null });
    await ad.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// --- helpers ---

function sanitize(body) {
  const allowed = [
    'title', 'phase', 'format', 'icp', 'media', 'contentType',
    'creator', 'status', 'hook', 'concept', 'script', 'shotlist',
    'visualRef', 'visualDesc', 'driveLink', 'notes', 'parentAdId'
  ];
  const out = {};
  for (const key of allowed) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  // Convert empty string creator/parent to null
  if (out.creator === '') out.creator = null;
  if (out.parentAdId === '') out.parentAdId = null;
  return out;
}

// Mirrors the getAvailableActions logic in the frontend.
// Defines which status transitions are allowed for which role.
function isTransitionAllowed(ad, newStatus, userRole) {
  const transitions = {
    idea:       { ray: ['review', 'live'],      agency: ['review'] }, // 'live' for Ray's deploy-directly
    review:     { ray: ['production', 'feedback', 'archive'], agency: ['production', 'feedback', 'archive'] },
    feedback:   { ray: ['review'],               agency: ['review'] },
    production: { ray: [],                       agency: ['ready'] },
    ready:      { ray: ['live', 'production'],   agency: [] },
    live:       { ray: ['paused'],               agency: [] },
    paused:     { ray: ['live', 'archive'],      agency: [] },
    archive:    { ray: ['idea'],                 agency: [] }
  };

  // Reviewer is the opposite of creator
  if (ad.status === 'review') {
    const reviewer = ad.createdBy === 'ray' ? 'agency' : 'ray';
    if (userRole !== reviewer) return false;
  }
  // Feedback resubmit only by original creator
  if (ad.status === 'feedback' && userRole !== ad.createdBy) return false;

  const allowed = transitions[ad.status]?.[userRole] || [];
  return allowed.includes(newStatus);
}

export default router;
