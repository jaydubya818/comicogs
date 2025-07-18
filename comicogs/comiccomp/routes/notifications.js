/**
 * notifications.js
 * API routes for notification management
 * 
 * Handles:
 * - User notification preferences
 * - Alert management (create, update, cancel)
 * - Unsubscribe functionality
 * - Notification metrics and status
 * - Device registration for push notifications
 */

const express = require('express');
const router = express.Router();

// Import notification services
const NotificationEngine = require('../services/NotificationEngine');
const UserNotificationPreferences = require('../services/UserNotificationPreferences');
const AlertManager = require('../services/AlertManager');
const RateLimiter = require('../services/RateLimiter');
const EmailService = require('../services/EmailService');
const PushNotificationService = require('../services/PushNotificationService');
const BatchNotificationProcessor = require('../services/BatchNotificationProcessor');

// Initialize services (would typically be done in main app initialization)
let notificationServices = null;

const initializeServices = async () => {
    if (notificationServices) return notificationServices;
    
    // Create service instances
    const userPreferences = new UserNotificationPreferences();
    const rateLimiter = new RateLimiter();
    const alertManager = new AlertManager();
    const emailService = new EmailService({ userPreferences });
    const pushService = new PushNotificationService({ userPreferences });
    const batchProcessor = new BatchNotificationProcessor();
    
    const notificationEngine = new NotificationEngine({
        emailService,
        pushService,
        alertManager,
        rateLimiter,
        userPreferences,
        batchProcessor
    });
    
    // Initialize all services
    await userPreferences.initialize();
    await rateLimiter.initialize();
    await alertManager.initialize();
    await emailService.initialize();
    await pushService.initialize();
    await batchProcessor.initialize();
    await notificationEngine.initialize();
    
    notificationServices = {
        notificationEngine,
        userPreferences,
        alertManager,
        rateLimiter,
        emailService,
        pushService,
        batchProcessor
    };
    
    return notificationServices;
};

// Middleware to ensure services are initialized
const ensureServices = async (req, res, next) => {
    try {
        if (!notificationServices) {
            notificationServices = await initializeServices();
        }
        req.notificationServices = notificationServices;
        next();
    } catch (error) {
        console.error('Error initializing notification services:', error);
        res.status(500).json({ error: 'Failed to initialize notification services' });
    }
};

// Apply middleware to all routes
router.use(ensureServices);

/**
 * User Preferences Routes
 */

// GET /api/notifications/preferences/:userId - Get user notification preferences
router.get('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { userPreferences } = req.notificationServices;
        
        const preferences = await userPreferences.getPreferences(userId);
        const summary = await userPreferences.getPreferencesSummary(userId);
        
        res.json({
            success: true,
            preferences,
            summary
        });
        
    } catch (error) {
        console.error('Error getting user preferences:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/notifications/preferences/:userId - Update user notification preferences
router.put('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        const { userPreferences } = req.notificationServices;
        
        const updatedPreferences = await userPreferences.updatePreferences(userId, updates);
        
        res.json({
            success: true,
            preferences: updatedPreferences
        });
        
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/notifications/preferences/:userId/subscribe - Subscribe to notification type
router.post('/preferences/:userId/subscribe', async (req, res) => {
    try {
        const { userId } = req.params;
        const { category, channel } = req.body;
        const { userPreferences } = req.notificationServices;
        
        const result = await userPreferences.subscribe(userId, category, channel);
        
        res.json({
            success: true,
            preferences: result
        });
        
    } catch (error) {
        console.error('Error subscribing user:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/notifications/preferences/:userId/unsubscribe - Unsubscribe from notification type
router.post('/preferences/:userId/unsubscribe', async (req, res) => {
    try {
        const { userId } = req.params;
        const { category, channel } = req.body;
        const { userPreferences } = req.notificationServices;
        
        const result = await userPreferences.unsubscribe(userId, category, channel);
        
        res.json({
            success: true,
            preferences: result
        });
        
    } catch (error) {
        console.error('Error unsubscribing user:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/notifications/unsubscribe - Process unsubscribe token from email
router.post('/unsubscribe', async (req, res) => {
    try {
        const { token, category } = req.body;
        const { userPreferences } = req.notificationServices;
        
        const result = await userPreferences.processUnsubscribeToken(token, category);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error processing unsubscribe token:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Alert Management Routes
 */

// GET /api/notifications/alerts/:userId - Get user alerts
router.get('/alerts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { comicId } = req.query;
        const { alertManager } = req.notificationServices;
        
        const alerts = await alertManager.getUserAlerts(userId, comicId);
        
        res.json({
            success: true,
            alerts
        });
        
    } catch (error) {
        console.error('Error getting user alerts:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/notifications/alerts - Create new alert
router.post('/alerts', async (req, res) => {
    try {
        const { userId, alertData } = req.body;
        const { alertManager } = req.notificationServices;
        
        const alert = await alertManager.createAlert(userId, alertData);
        
        res.status(201).json({
            success: true,
            alert
        });
        
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/notifications/alerts/:alertId - Update alert
router.put('/alerts/:alertId', async (req, res) => {
    try {
        const { alertId } = req.params;
        const updates = req.body;
        const { alertManager } = req.notificationServices;
        
        const alert = await alertManager.updateAlert(alertId, updates);
        
        res.json({
            success: true,
            alert
        });
        
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/notifications/alerts/:alertId - Cancel alert
router.delete('/alerts/:alertId', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { userId } = req.query;
        const { alertManager } = req.notificationServices;
        
        const alert = await alertManager.cancelAlert(alertId, userId);
        
        res.json({
            success: true,
            alert
        });
        
    } catch (error) {
        console.error('Error cancelling alert:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Push Notification Device Management
 */

// POST /api/notifications/devices/register - Register device for push notifications
router.post('/devices/register', async (req, res) => {
    try {
        const { userId, deviceToken, platform, metadata } = req.body;
        const { pushService } = req.notificationServices;
        
        const result = await pushService.registerDevice(userId, deviceToken, platform, metadata);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/notifications/devices/unregister - Unregister device
router.post('/devices/unregister', async (req, res) => {
    try {
        const { userId, deviceToken } = req.body;
        const { pushService } = req.notificationServices;
        
        const result = await pushService.unregisterDevice(userId, deviceToken);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error unregistering device:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Manual Notification Sending
 */

// POST /api/notifications/send - Send notification manually (testing/admin)
router.post('/send', async (req, res) => {
    try {
        const { userId, notification } = req.body;
        const { notificationEngine } = req.notificationServices;
        
        const result = await notificationEngine.sendNotification(userId, notification);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/notifications/send/bulk - Send bulk notifications
router.post('/send/bulk', async (req, res) => {
    try {
        const { notifications } = req.body;
        const { notificationEngine } = req.notificationServices;
        
        const results = await notificationEngine.sendBulkNotifications(notifications);
        
        res.json({
            success: true,
            results
        });
        
    } catch (error) {
        console.error('Error sending bulk notifications:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Rate Limiting Routes
 */

// GET /api/notifications/rate-limit/:userId - Get user rate limit status
router.get('/rate-limit/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { channel = 'email' } = req.query;
        const { rateLimiter } = req.notificationServices;
        
        const status = await rateLimiter.getUserStatus(userId, channel);
        
        res.json({
            success: true,
            status
        });
        
    } catch (error) {
        console.error('Error getting rate limit status:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/notifications/rate-limit/:userId/reset - Reset user rate limits (admin)
router.post('/rate-limit/:userId/reset', async (req, res) => {
    try {
        const { userId } = req.params;
        const { channel } = req.body;
        const { rateLimiter } = req.notificationServices;
        
        const result = await rateLimiter.resetUserLimits(userId, channel);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error resetting rate limits:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Metrics and Status Routes
 */

// GET /api/notifications/metrics - Get overall notification metrics
router.get('/metrics', async (req, res) => {
    try {
        const {
            notificationEngine,
            rateLimiter,
            emailService,
            pushService,
            batchProcessor
        } = req.notificationServices;
        
        const metrics = {
            notification_engine: notificationEngine.getMetrics(),
            rate_limiter: rateLimiter.getMetrics(),
            email_service: emailService.getMetrics(),
            push_service: pushService.getMetrics(),
            batch_processor: batchProcessor.getMetrics()
        };
        
        res.json({
            success: true,
            metrics
        });
        
    } catch (error) {
        console.error('Error getting metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/notifications/status - Get system status
router.get('/status', async (req, res) => {
    try {
        const {
            notificationEngine,
            alertManager,
            batchProcessor
        } = req.notificationServices;
        
        const status = {
            notification_engine: {
                initialized: notificationEngine.isInitialized,
                metrics: notificationEngine.getMetrics()
            },
            alert_manager: {
                initialized: alertManager.isInitialized,
                metrics: alertManager.getMetrics()
            },
            batch_processor: {
                queue_status: batchProcessor.getQueueStatus(),
                metrics: batchProcessor.getMetrics()
            }
        };
        
        res.json({
            success: true,
            status
        });
        
    } catch (error) {
        console.error('Error getting system status:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Testing and Demo Routes
 */

// POST /api/notifications/test/price-alert - Test price alert notification
router.post('/test/price-alert', async (req, res) => {
    try {
        const { userId = 'test_user', comicId = 'test_comic' } = req.body;
        const { notificationEngine } = req.notificationServices;
        
        const testNotification = {
            id: `test_price_alert_${Date.now()}`,
            type: 'price_alert',
            priority: 3,
            title: 'Test Price Alert',
            message: 'Amazing Spider-Man #1 price increased by 15.5%',
            data: {
                comicId,
                comicTitle: 'Amazing Spider-Man #1',
                currentPrice: 125.50,
                previousPrice: 108.75,
                percentChange: 15.5
            },
            timestamp: new Date().toISOString()
        };
        
        const result = await notificationEngine.sendNotification(userId, testNotification);
        
        res.json({
            success: true,
            result,
            notification: testNotification
        });
        
    } catch (error) {
        console.error('Error sending test price alert:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/notifications/test/recommendation - Test recommendation notification
router.post('/test/recommendation', async (req, res) => {
    try {
        const { userId = 'test_user', comicId = 'test_comic' } = req.body;
        const { notificationEngine } = req.notificationServices;
        
        const testNotification = {
            id: `test_recommendation_${Date.now()}`,
            type: 'recommendation',
            priority: 2,
            title: 'New Recommendation Available',
            message: 'List Now recommended for X-Men #1',
            data: {
                comicId,
                comicTitle: 'X-Men #1',
                action: 'List Now',
                confidence: 85
            },
            timestamp: new Date().toISOString()
        };
        
        const result = await notificationEngine.sendNotification(userId, testNotification);
        
        res.json({
            success: true,
            result,
            notification: testNotification
        });
        
    } catch (error) {
        console.error('Error sending test recommendation:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/notifications/simulate/price-change - Simulate price change event
router.post('/simulate/price-change', async (req, res) => {
    try {
        const { 
            comicId = 'test_comic',
            currentPrice = 150.00,
            previousPrice = 130.00
        } = req.body;
        const { alertManager } = req.notificationServices;
        
        const triggeredAlerts = await alertManager.checkPriceChanges(
            comicId,
            currentPrice,
            previousPrice
        );
        
        res.json({
            success: true,
            comicId,
            currentPrice,
            previousPrice,
            percentChange: ((currentPrice - previousPrice) / previousPrice * 100).toFixed(1),
            triggeredAlerts
        });
        
    } catch (error) {
        console.error('Error simulating price change:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Error handler middleware
 */
router.use((error, req, res, next) => {
    console.error('Notification API Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

module.exports = router; 