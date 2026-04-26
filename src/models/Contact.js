import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, default: 'creator' },
  instagram: { type: String, default: '', trim: true },
  tiktok:    { type: String, default: '', trim: true },
  email:     { type: String, default: '', trim: true },
  phone:     { type: String, default: '', trim: true },
  whatsapp:  { type: String, default: '', trim: true },
  preferredChannel: {
    type: String,
    enum: ['', 'whatsapp', 'email', 'instagram', 'tiktok', 'phone'],
    default: ''
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

contactSchema.index({ name: 'text', notes: 'text' });

export default mongoose.model('Contact', contactSchema);
