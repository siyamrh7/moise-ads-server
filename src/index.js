import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import adsRoutes from './routes/ads.js';
import contactsRoutes from './routes/contacts.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

const app = express();

// Security & logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin: origins,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/contacts', contactsRoutes);

// 404 + error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server after DB connection
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server listening on port ${PORT}`);
    console.log(`  Allowed origins: ${origins.join(', ')}`);
  });
});
