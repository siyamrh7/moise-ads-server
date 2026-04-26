import express from 'express';
import Contact from '../models/Contact.js';
import Ad from '../models/Ad.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort('name');
    // Attach ads count per contact
    const counts = await Ad.aggregate([
      { $match: { creator: { $ne: null } } },
      { $group: { _id: '$creator', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
    const enriched = contacts.map(c => ({
      ...c.toObject(),
      adsCount: countMap.get(c._id.toString()) || 0
    }));
    res.json({ contacts: enriched });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = sanitize(req.body);
    const contact = await Contact.create(data);
    res.status(201).json({ contact });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const data = sanitize(req.body);
    const contact = await Contact.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    // Unlink from ads but don't delete them
    await Ad.updateMany({ creator: contact._id }, { creator: null });
    await contact.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

function sanitize(body) {
  const allowed = [
    'name', 'type', 'instagram', 'tiktok', 'email',
    'phone', 'whatsapp', 'preferredChannel', 'notes'
  ];
  const out = {};
  for (const key of allowed) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  // Strip leading @ from handles
  if (out.instagram) out.instagram = out.instagram.replace(/^@/, '');
  if (out.tiktok) out.tiktok = out.tiktok.replace(/^@/, '');
  out.type = 'creator'; // always
  return out;
}

export default router;
