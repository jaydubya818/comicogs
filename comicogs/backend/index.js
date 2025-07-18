const express = require('express');
const bodyParser = require('body-parser');

const db = require('./db');
const authRoutes = require('./routes/enhancedAuth');
const comicsRoutes = require('./routes/comics');
const collectionsRoutes = require('./routes/collections');
const wantlistsRoutes = require('./routes/wantlists');
const aiRoutes = require('./routes/ai');
const marketplaceRoutes = require('./routes/marketplace');
const pricingRoutes = require('./routes/pricing-simple');
const MonitoringService = require('./services/MonitoringService');
const { authenticateToken } = require('./middleware/authMiddleware');
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

// Routes
const monitoringService = new MonitoringService();

app.get('/api/monitoring', authenticateToken, (req, res) => {
  res.json(monitoringService.getMetrics());
});

// Start monitoring when the app starts
monitoringService.start().catch(console.error);

// Stop monitoring when the app closes
process.on('SIGINT', async () => {
  await monitoringService.stop();
  process.exit();
});
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Comicogs API', 
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      comics: '/api/comics',
      collections: '/api/collections',
      wantlists: '/api/wantlists',
      ai: '/api/ai',
      marketplace: '/api/marketplace',
      pricing: '/api/pricing',
      comiccomp: '/api/comiccomp'
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
// app.use('/api/seller-actions', sellerActionsRoutes);
// app.use('/api/comiccomp', comiccompRoutes);
// app.use('/api/profile', profileRoutes);

// Legacy route for backward compatibility
app.post('/issues', async (req, res) => {
  const { title, issue_number, publisher, publication_date, cover_image_url } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO issues (title, issue_number, publisher, publication_date, cover_image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, issue_number, publisher, publication_date, cover_image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Example of a protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// API Status endpoint
app.get('/api/status', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await db.query('SELECT COUNT(*) as total_comics FROM comics');
    const totalComics = dbResult.rows[0].total_comics;

    const usersResult = await db.query('SELECT COUNT(*) as total_users FROM users');
    const totalUsers = usersResult.rows[0].total_users;

    const collectionsResult = await db.query('SELECT COUNT(*) as total_collections FROM collections');
    const totalCollections = collectionsResult.rows[0].total_collections;

    res.json({
      status: 'healthy',
      database: 'connected',
      stats: {
        total_comics: parseInt(totalComics),
        total_users: parseInt(totalUsers),
        total_collections: parseInt(totalCollections)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    available_endpoints: {
      auth: '/api/auth',
      comics: '/api/comics',
      collections: '/api/collections',
      wantlists: '/api/wantlists',
      ai: '/api/ai',
      marketplace: '/api/marketplace',
      pricing: '/api/pricing',
      status: '/api/status'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Comicogs API listening at http://localhost:${port}`);
  console.log(`📚 Comics API: http://localhost:${port}/api/comics`);
  console.log(`📖 Collections API: http://localhost:${port}/api/collections`);
  console.log(`⭐ Wantlists API: http://localhost:${port}/api/wantlists`);
  console.log(`🤖 AI API: http://localhost:${port}/api/ai`);
  console.log(`🛒 Marketplace API: http://localhost:${port}/api/marketplace`);
  console.log(`💰 Pricing API: http://localhost:${port}/api/pricing`);
  console.log(`🔒 Auth API: http://localhost:${port}/api/auth`);
  console.log(`📊 Status: http://localhost:${port}/api/status`);
  console.log(`📈 Monitoring: http://localhost:${port}/api/monitoring`);
});