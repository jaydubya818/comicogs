/**
 * NotificationEngine.js
 * Core notification system for ComicComp
 * 
 * Handles:
 * - Email and push notifications
 * - Price alerts and recommendation notifications
 * - User preference management
 * - Rate limiting and spam prevention
 * - Integration with existing recommendation engine
 */

const EventEmitter = require('events');

class NotificationEngine extends EventEmitter {
    constructor(dependencies = {}) {
        super();
        this.emailService = dependencies.emailService;
        this.pushService = dependencies.pushService;
        this.alertManager = dependencies.alertManager;
        this.rateLimiter = dependencies.rateLimiter;
        this.userPreferences = dependencies.userPreferences;
        this.batchProcessor = dependencies.batchProcessor;
        
        // Notification types
        this.NOTIFICATION_TYPES = {
            PRICE_ALERT: 'price_alert',
            RECOMMENDATION: 'recommendation',
            MARKET_MOVEMENT: 'market_movement',
            COLLECTION_UPDATE: 'collection_update',
            SYSTEM_ALERT: 'system_alert'
        };
        
        // Priority levels
        this.PRIORITY_LEVELS = {
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            URGENT: 4
        };
        
        // Notification channels
        this.CHANNELS = {
            EMAIL: 'email',
            PUSH: 'push',
            IN_APP: 'in_app'
        };
        
        this.isInitialized = false;
        this.processingQueue = [];
        this.metrics = {
            sent: 0,
            failed: 0,
            rateLimited: 0,
            unsubscribed: 0
        };
    }
    
    /**
     * Initialize the notification engine
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing NotificationEngine...');
            
            // Initialize dependent services
            if (this.emailService && typeof this.emailService.initialize === 'function') {
                await this.emailService.initialize();
            }
            
            if (this.pushService && typeof this.pushService.initialize === 'function') {
                await this.pushService.initialize();
            }
            
            if (this.alertManager && typeof this.alertManager.initialize === 'function') {
                await this.alertManager.initialize();
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start batch processing
            this.startBatchProcessing();
            
            this.isInitialized = true;
            console.log('NotificationEngine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize NotificationEngine:', error);
            throw error;
        }
    }
    
    /**
     * Set up event listeners for recommendation engine integration
     */
    setupEventListeners() {
        // Listen for price changes
        this.on('price_change', this.handlePriceChange.bind(this));
        
        // Listen for new recommendations
        this.on('new_recommendation', this.handleNewRecommendation.bind(this));
        
        // Listen for market movements
        this.on('market_movement', this.handleMarketMovement.bind(this));
        
        // Listen for collection updates
        this.on('collection_update', this.handleCollectionUpdate.bind(this));
    }
    
    /**
     * Send a notification to a user
     */
    async sendNotification(userId, notification) {
        try {
            // Validate input
            if (!userId || !notification) {
                throw new Error('User ID and notification are required');
            }
            
            // Check user preferences
            const userPrefs = await this.getUserPreferences(userId);
            if (!this.shouldSendNotification(notification, userPrefs)) {
                console.log(`Notification skipped due to user preferences: ${userId}`);
                return { success: true, skipped: true, reason: 'user_preferences' };
            }
            
            // Check rate limits
            const rateLimitCheck = await this.checkRateLimit(userId, notification.type);
            if (!rateLimitCheck.allowed) {
                console.log(`Notification rate limited for user ${userId}`);
                this.metrics.rateLimited++;
                return { success: false, skipped: true, reason: 'rate_limited' };
            }
            
            // Prepare notification data
            const enrichedNotification = await this.enrichNotification(notification);
            
            // Send via appropriate channels
            const results = await this.sendViaChannels(userId, enrichedNotification, userPrefs);
            
            // Update metrics
            if (results.some(r => r.success)) {
                this.metrics.sent++;
            } else {
                this.metrics.failed++;
            }
            
            // Log notification activity
            await this.logNotificationActivity(userId, enrichedNotification, results);
            
            return {
                success: results.some(r => r.success),
                results: results,
                notificationId: enrichedNotification.id
            };
            
        } catch (error) {
            console.error('Failed to send notification:', error);
            this.metrics.failed++;
            throw error;
        }
    }
    
    /**
     * Handle price change events
     */
    async handlePriceChange(data) {
        try {
            const { comicId, currentPrice, previousPrice, percentChange } = data;
            
            // Get users with price alerts for this comic
            const alertUsers = await this.alertManager.getUsersWithAlerts(comicId);
            
            for (const userId of alertUsers) {
                const alerts = await this.alertManager.getUserAlerts(userId, comicId);
                
                for (const alert of alerts) {
                    if (this.shouldTriggerAlert(alert, currentPrice, percentChange)) {
                        const notification = {
                            id: `price_alert_${Date.now()}_${Math.random()}`,
                            type: this.NOTIFICATION_TYPES.PRICE_ALERT,
                            priority: this.calculatePriority(percentChange),
                            title: 'Price Alert Triggered',
                            message: `${alert.comicTitle} price changed by ${percentChange.toFixed(1)}%`,
                            data: {
                                comicId,
                                currentPrice,
                                previousPrice,
                                percentChange,
                                alertId: alert.id
                            },
                            timestamp: new Date().toISOString()
                        };
                        
                        await this.sendNotification(userId, notification);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error handling price change:', error);
        }
    }
    
    /**
     * Handle new recommendation events
     */
    async handleNewRecommendation(data) {
        try {
            const { userId, recommendation } = data;
            
            const notification = {
                id: `recommendation_${Date.now()}_${Math.random()}`,
                type: this.NOTIFICATION_TYPES.RECOMMENDATION,
                priority: this.mapRecommendationPriority(recommendation.action),
                title: 'New Recommendation Available',
                message: `${recommendation.action} recommended for ${recommendation.comicTitle}`,
                data: {
                    recommendationId: recommendation.id,
                    action: recommendation.action,
                    comicId: recommendation.comicId,
                    confidence: recommendation.confidence
                },
                timestamp: new Date().toISOString()
            };
            
            await this.sendNotification(userId, notification);
            
        } catch (error) {
            console.error('Error handling new recommendation:', error);
        }
    }
    
    /**
     * Handle market movement events
     */
    async handleMarketMovement(data) {
        try {
            const { comicId, movementType, magnitude, description } = data;
            
            // Get users who own this comic
            const owners = await this.getComicOwners(comicId);
            
            for (const userId of owners) {
                const notification = {
                    id: `market_movement_${Date.now()}_${Math.random()}`,
                    type: this.NOTIFICATION_TYPES.MARKET_MOVEMENT,
                    priority: this.calculatePriority(magnitude),
                    title: 'Market Movement Alert',
                    message: description,
                    data: {
                        comicId,
                        movementType,
                        magnitude
                    },
                    timestamp: new Date().toISOString()
                };
                
                await this.sendNotification(userId, notification);
            }
            
        } catch (error) {
            console.error('Error handling market movement:', error);
        }
    }
    
    /**
     * Handle collection update events
     */
    async handleCollectionUpdate(data) {
        try {
            const { userId, updateType, comicId, details } = data;
            
            const notification = {
                id: `collection_update_${Date.now()}_${Math.random()}`,
                type: this.NOTIFICATION_TYPES.COLLECTION_UPDATE,
                priority: this.PRIORITY_LEVELS.LOW,
                title: 'Collection Updated',
                message: `Your collection has been updated: ${details}`,
                data: {
                    updateType,
                    comicId,
                    details
                },
                timestamp: new Date().toISOString()
            };
            
            await this.sendNotification(userId, notification);
            
        } catch (error) {
            console.error('Error handling collection update:', error);
        }
    }
    
    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(notifications) {
        try {
            console.log(`Processing ${notifications.length} bulk notifications`);
            
            if (this.batchProcessor) {
                return await this.batchProcessor.processBatch(notifications);
            } else {
                // Fallback to sequential processing
                const results = [];
                for (const notification of notifications) {
                    const result = await this.sendNotification(notification.userId, notification);
                    results.push(result);
                }
                return results;
            }
            
        } catch (error) {
            console.error('Error sending bulk notifications:', error);
            throw error;
        }
    }
    
    /**
     * Get user notification preferences
     */
    async getUserPreferences(userId) {
        try {
            if (this.userPreferences) {
                return await this.userPreferences.getPreferences(userId);
            } else {
                // Default preferences
                return {
                    email: true,
                    push: true,
                    priceAlerts: true,
                    recommendations: true,
                    marketMovements: true,
                    frequency: 'immediate'
                };
            }
        } catch (error) {
            console.error('Error getting user preferences:', error);
            // Return default preferences on error
            return {
                email: true,
                push: true,
                priceAlerts: true,
                recommendations: true,
                marketMovements: true,
                frequency: 'immediate'
            };
        }
    }
    
    /**
     * Check if notification should be sent based on user preferences
     */
    shouldSendNotification(notification, preferences) {
        if (!preferences) return true;
        
        // Check if user has unsubscribed from this type
        switch (notification.type) {
            case this.NOTIFICATION_TYPES.PRICE_ALERT:
                return preferences.priceAlerts !== false;
            case this.NOTIFICATION_TYPES.RECOMMENDATION:
                return preferences.recommendations !== false;
            case this.NOTIFICATION_TYPES.MARKET_MOVEMENT:
                return preferences.marketMovements !== false;
            case this.NOTIFICATION_TYPES.COLLECTION_UPDATE:
                return preferences.collectionUpdates !== false;
            default:
                return true;
        }
    }
    
    /**
     * Check rate limits for user and notification type
     */
    async checkRateLimit(userId, notificationType) {
        try {
            if (this.rateLimiter) {
                return await this.rateLimiter.checkLimit(userId, notificationType);
            } else {
                // Default: allow all notifications
                return { allowed: true };
            }
        } catch (error) {
            console.error('Error checking rate limit:', error);
            return { allowed: true }; // Allow on error
        }
    }
    
    /**
     * Enrich notification with additional data
     */
    async enrichNotification(notification) {
        try {
            const enriched = { ...notification };
            
            // Add timestamp if not present
            if (!enriched.timestamp) {
                enriched.timestamp = new Date().toISOString();
            }
            
            // Add ID if not present
            if (!enriched.id) {
                enriched.id = `notification_${Date.now()}_${Math.random()}`;
            }
            
            // Add priority if not present
            if (!enriched.priority) {
                enriched.priority = this.PRIORITY_LEVELS.MEDIUM;
            }
            
            // Add additional context based on type
            if (enriched.type === this.NOTIFICATION_TYPES.PRICE_ALERT && enriched.data?.comicId) {
                enriched.data.comicDetails = await this.getComicDetails(enriched.data.comicId);
            }
            
            return enriched;
            
        } catch (error) {
            console.error('Error enriching notification:', error);
            return notification;
        }
    }
    
    /**
     * Send notification via appropriate channels
     */
    async sendViaChannels(userId, notification, preferences) {
        const results = [];
        
        try {
            // Send email if enabled
            if (preferences.email && this.emailService) {
                const emailResult = await this.emailService.sendNotification(userId, notification);
                results.push({ channel: this.CHANNELS.EMAIL, ...emailResult });
            }
            
            // Send push notification if enabled
            if (preferences.push && this.pushService) {
                const pushResult = await this.pushService.sendNotification(userId, notification);
                results.push({ channel: this.CHANNELS.PUSH, ...pushResult });
            }
            
            // Always store in-app notification
            const inAppResult = await this.storeInAppNotification(userId, notification);
            results.push({ channel: this.CHANNELS.IN_APP, ...inAppResult });
            
        } catch (error) {
            console.error('Error sending via channels:', error);
            results.push({ channel: 'error', success: false, error: error.message });
        }
        
        return results;
    }
    
    /**
     * Store in-app notification
     */
    async storeInAppNotification(userId, notification) {
        try {
            // This would typically store in database
            // For now, just log
            console.log(`Storing in-app notification for user ${userId}:`, notification.title);
            return { success: true };
        } catch (error) {
            console.error('Error storing in-app notification:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Log notification activity
     */
    async logNotificationActivity(userId, notification, results) {
        try {
            const logEntry = {
                userId,
                notificationId: notification.id,
                type: notification.type,
                title: notification.title,
                timestamp: new Date().toISOString(),
                results: results,
                success: results.some(r => r.success)
            };
            
            console.log('Notification activity:', logEntry);
            // This would typically be stored in database
            
        } catch (error) {
            console.error('Error logging notification activity:', error);
        }
    }
    
    /**
     * Start batch processing
     */
    startBatchProcessing() {
        // Process queue every 30 seconds
        setInterval(() => {
            if (this.processingQueue.length > 0) {
                this.processBatchQueue();
            }
        }, 30000);
    }
    
    /**
     * Process batch queue
     */
    async processBatchQueue() {
        if (this.processingQueue.length === 0) return;
        
        const batch = this.processingQueue.splice(0, 100); // Process up to 100 at a time
        
        try {
            await this.sendBulkNotifications(batch);
        } catch (error) {
            console.error('Error processing batch queue:', error);
        }
    }
    
    /**
     * Helper methods
     */
    shouldTriggerAlert(alert, currentPrice, percentChange) {
        if (alert.priceThreshold && currentPrice >= alert.priceThreshold) return true;
        if (alert.percentThreshold && Math.abs(percentChange) >= alert.percentThreshold) return true;
        return false;
    }
    
    calculatePriority(percentChange) {
        const absChange = Math.abs(percentChange);
        if (absChange >= 20) return this.PRIORITY_LEVELS.URGENT;
        if (absChange >= 10) return this.PRIORITY_LEVELS.HIGH;
        if (absChange >= 5) return this.PRIORITY_LEVELS.MEDIUM;
        return this.PRIORITY_LEVELS.LOW;
    }
    
    mapRecommendationPriority(action) {
        switch (action) {
            case 'List Now': return this.PRIORITY_LEVELS.HIGH;
            case 'Grade': return this.PRIORITY_LEVELS.MEDIUM;
            case 'Monitor': return this.PRIORITY_LEVELS.LOW;
            case 'Hold': return this.PRIORITY_LEVELS.LOW;
            default: return this.PRIORITY_LEVELS.MEDIUM;
        }
    }
    
    async getComicOwners(comicId) {
        // This would query the database for users who own this comic
        // For now, return empty array
        return [];
    }
    
    async getComicDetails(comicId) {
        // This would fetch comic details from database
        // For now, return basic object
        return { id: comicId, title: 'Comic Title' };
    }
    
    /**
     * Get notification metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            sent: 0,
            failed: 0,
            rateLimited: 0,
            unsubscribed: 0
        };
    }
}

module.exports = NotificationEngine; 