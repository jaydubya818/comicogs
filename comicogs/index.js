const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('./db');
const authRoutes = require('./routes/auth');
const comicsRoutes = require('./routes/comics');
const collectionsRoutes = require('./routes/collections');
const wantlistsRoutes = require('./routes/wantlists');
const aiRoutes = require('./routes/ai');
const marketplaceRoutes = require('./routes/marketplace');
const pricingRoutes = require('./routes/pricing-simple');
const monitoringRoutes = require('./routes/monitoring');
// const sellerActionsRoutes = require('./routes/sellerActions');
// const comiccompRoutes = require('./routes/comiccomp');
// const profileRoutes = require('./routes/profile');
require('dotenv').config(); // Load environment variables

const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// CORS middleware for frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user;
    next();
  });
};

// Initialize monitoring services
const monitoringService = monitoringRoutes.healthMonitor;
const analyticsService = monitoringRoutes.analytics;

// API performance tracking middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        const endpoint = req.route ? req.route.path : req.path;
        
        // Track API performance
        if (monitoringService && monitoringService.recordApiRequest) {
            monitoringService.recordApiRequest(endpoint, responseTime, res.statusCode);
        }
        if (analyticsService && analyticsService.trackApiPerformance) {
            analyticsService.trackApiPerformance(endpoint, req.method, res.statusCode, responseTime, req.user?.id);
        }
        
        originalEnd.apply(this, args);
    };
    
    next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Comicogs API', 
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/auth',
      comics: '/api/comics',
      collections: '/api/collections',
      wantlists: '/api/wantlists',
      ai: '/api/ai',
      marketplace: '/api/marketplace',
      pricing: '/api/pricing',
      monitoring: '/api/monitoring'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/comics', comicsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/wantlists', wantlistsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/monitoring', monitoringRoutes);
// app.use('/api/seller-actions', sellerActionsRoutes);
// app.use('/api/comiccomp', comiccompRoutes);
// app.use('/api/profile', profileRoutes); 