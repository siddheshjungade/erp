import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env';
import authRoutes from './routes/auth.routes';
import procurementRoutes from './routes/procurement.routes';
import projectRoutes from './routes/project.routes';
import supplierRoutes from './routes/supplier.routes';
import purchaseRoutes from './routes/purchase.routes';
import inventoryRoutes from './routes/inventory.routes';
import leadsRoutes from './routes/leads.routes';

const app = express();
const port = parseInt(config.PORT, 10);

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsers
app.use(express.json());
app.use(cookieParser());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/leads', leadsRoutes);

// Health check endpoint
app.get('/api/status', (req, res) => {
  return res.json({
    status: 'online',
    message: 'Solar ERP API is up and running!',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`  Solar ERP API Server Active!               `);
  console.log(`  Port: ${port}                              `);
  console.log(`  Environment: ${config.NODE_ENV}            `);
  console.log(`  Allowed CORS Origin: ${config.FRONTEND_URL}`);
  console.log(`=============================================`);
});
