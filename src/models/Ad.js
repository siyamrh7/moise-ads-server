import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: { type: String, enum: ['ray', 'agency', 'system'], required: true },
  body:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const adSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  phase: {
    type: String,
    enum: ['', 'unaware', 'problem', 'solution', 'product', 'most', 'caring'],
    default: ''
  },
  format:      { type: String, default: '' },
  icp: {
    type: String,
    enum: ['', 'emma', 'sophie', 'lisa', 'noor', 'mila'],
    default: ''
  },
  media: {
    type: String,
    enum: ['', 'static', 'video'],
    default: ''
  },
  contentType: {
    type: String,
    enum: ['', 'ugc', 'studio', 'animation', 'founder', 'infographic', 'testimonial'],
    default: ''
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
  status: {
    type: String,
    enum: ['idea', 'review', 'feedback', 'production', 'ready', 'live', 'paused', 'archive'],
    default: 'idea',
    index: true
  },
  hook:        { type: String, default: '' },
  concept:     { type: String, default: '' },
  script:      { type: String, default: '' },
  shotlist:    { type: [String], default: [] },
  visualRef:   { type: String, default: '' },
  visualDesc:  { type: String, default: '' },
  driveLink:   { type: String, default: '' },
  notes:       { type: String, default: '' },
  parentAdId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', default: null },
  comments:    { type: [commentSchema], default: [] },
  createdBy:   { type: String, enum: ['ray', 'agency'], required: true }
}, { timestamps: true });

adSchema.index({ title: 'text', notes: 'text', concept: 'text', hook: 'text' });
adSchema.index({ phase: 1, icp: 1, status: 1 });

export default mongoose.model('Ad', adSchema);
