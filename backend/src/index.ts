import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getEnv } from './config/env';
import { Env } from './middleware/auth.middleware';

import authRoutes from './routes/auth.routes';
import procurementRoutes from './routes/procurement.routes';
import projectRoutes from './routes/project.routes';
import supplierRoutes from './routes/supplier.routes';
import purchaseRoutes from './routes/purchase.routes';
import inventoryRoutes from './routes/inventory.routes';
import leadsRoutes from './routes/leads.routes';

const app = new Hono<Env>();

// Global CORS Middleware
app.use('*', async (c, next) => {
  const envVars = getEnv(c);
  const corsMiddleware = cors({
    origin: (origin) => {
      // Allow exact FRONTEND_URL, localhost origins, or Cloudflare Pages (.pages.dev)
      if (!origin || origin === envVars.FRONTEND_URL || origin.startsWith('http://localhost:') || origin.endsWith('.pages.dev')) {
        return origin || envVars.FRONTEND_URL;
      }
      return envVars.FRONTEND_URL;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });
  return corsMiddleware(c, next);
});

// Debug Logging Middleware
app.use('*', async (c, next) => {
  console.log(`[HTTP] ${c.req.method} ${c.req.path}`);
  await next();
});

// Mount API Routes
app.route('/api/auth', authRoutes);
app.route('/api/procurement', procurementRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/suppliers', supplierRoutes);
app.route('/api/purchases', purchaseRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/leads', leadsRoutes);

// Health check endpoint
app.get('/api/status', (c) => {
  const envVars = getEnv(c);
  return c.json({
    status: 'online',
    message: 'Solar ERP API is up and running on Cloudflare Workers!',
    timestamp: new Date().toISOString(),
    environment: envVars.NODE_ENV,
  });
});

export default app;
