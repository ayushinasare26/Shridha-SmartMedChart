import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import patientRoutes from './routes/patient.routes';
import prescriptionRoutes from './routes/prescription.routes';
import scheduleRoutes from './routes/schedule.routes';
import alertRoutes from './routes/alert.routes';
import auditRoutes from './routes/audit.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import wardRoutes from './routes/ward.routes';
import administrationRoutes from './routes/administration.routes';
import verificationRoutes from './routes/verification.routes';
import noteRoutes from './routes/note.routes';

import { errorHandler } from './middleware/error.middleware';
import { prisma } from './config/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workstation', 'X-Workstation', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['*'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting (disabled on Vercel to prevent proxy validation exceptions)
const isVercel = !!process.env.VERCEL;
const noopMiddleware = (_req: any, _res: any, next: any) => next();

const limiter = isVercel
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'development' ? 5000 : 500,
      standardHeaders: true,
      legacyHeaders: false,
      validate: false,
    });
app.use('/api/', limiter);

const authLimiter = isVercel
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'development' ? 1000 : 20,
      standardHeaders: true,
      legacyHeaders: false,
      validate: false,
    });

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (supports both /api/health and /health)
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', service: 'SmartMedChart API', version: '2.4.1', timestamp: new Date().toISOString() });
});

// Routes — mounted on both /api/* and /* so any Vercel URL rewrite works
const routes: Array<[string, any, any]> = [
  ['/auth', authLimiter, authRoutes],
  ['/users', null, userRoutes],
  ['/patients', null, patientRoutes],
  ['/prescriptions', null, prescriptionRoutes],
  ['/schedules', null, scheduleRoutes],
  ['/administrations', null, administrationRoutes],
  ['/alerts', null, alertRoutes],
  ['/audit', null, auditRoutes],
  ['/notifications', null, notificationRoutes],
  ['/dashboard', null, dashboardRoutes],
  ['/reports', null, reportRoutes],
  ['/wards', null, wardRoutes],
  ['/verify', null, verificationRoutes],
  ['/notes', null, noteRoutes],
];

for (const [prefix, routeLimiter, router] of routes) {
  if (routeLimiter && routeLimiter !== noopMiddleware) {
    app.use(`/api${prefix}`, routeLimiter, router);
    app.use(prefix, routeLimiter, router);
  } else {
    app.use(`/api${prefix}`, router);
    app.use(prefix, router);
  }
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler
app.use(errorHandler);

// Export express application
export default app;
