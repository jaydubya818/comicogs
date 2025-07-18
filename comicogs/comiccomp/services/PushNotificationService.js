/**
 * PushNotificationService.js
 * Mobile push notification service
 * 
 * Handles:
 * - Push notification delivery to mobile devices
 * - Device token management
 * - Multi-platform support (iOS, Android, Web)
 * - Notification payload formatting
 * - Delivery tracking and analytics
 */

class PushNotificationService {
    constructor(dependencies = {}) {
        this.pushProvider = dependencies.pushProvider; // Firebase, APNs, etc.
        this.userPreferences = dependencies.userPreferences;
        this.deviceManager = dependencies.deviceManager;
        
        // Push notification configuration
        this.config = {
            maxRetries: 3,
            retryDelay: 2000, // 2 seconds
            batchSize: 100,
            defaultTTL: 86400, // 24 hours in seconds
            priorities: {
                low: 'normal',
                medium: 'high',
                high: 'high',
                urgent: 'high'
            }
        };
        
        // Platform configurations
        this.platforms = {
            ios: {
                sound: 'default',
                badge: 1,
                category: 'comiccomp_alert'
            },
            android: {
                channel_id: 'comiccomp_notifications',
                priority: 'high',
                notification_priority: 'PRIORITY_HIGH'
            },
            web: {
                icon: '/assets/icons/notification-icon.png',
                badge: '/assets/icons/badge-icon.png',
                requireInteraction: false
            }
        };
        
        // Notification templates
        this.templates = {
            price_alert: {
                title: '📈 Price Alert',
                body: '{{comicTitle}} {{changeDirection}} {{percentChange}}%',
                data: {
                    type: 'price_alert',
                    action: 'view_comic'
                }
            },
            recommendation: {
                title: '💡 New Recommendation',
                body: '{{action}} recommended for {{comicTitle}}',
                data: {
                    type: 'recommendation',
                    action: 'view_recommendations'
                }
            },
            market_movement: {
                title: '📊 Market Alert',
                body: 'Significant movement detected: {{description}}',
                data: {
                    type: 'market_movement',
                    action: 'view_market'
                }
            },
            collection_update: {
                title: '📚 Collection Update',
                body: 'Your collection has been updated',
                data: {
                    type: 'collection_update',
                    action: 'view_collection'
                }
            },
            system_alert: {
                title: '🔔 ComicComp Alert',
                body: '{{message}}',
                data: {
                    type: 'system_alert',
                    action: 'open_app'
                }
            }
        };
        
        this.isInitialized = false;
        this.metrics = {
            sent: 0,
            failed: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            byPlatform: {
                ios: { sent: 0, failed: 0, delivered: 0 },
                android: { sent: 0, failed: 0, delivered: 0 },
                web: { sent: 0, failed: 0, delivered: 0 }
            }
        };
    }
    
    /**
     * Initialize the push notification service
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing PushNotificationService...');
            
            // Initialize push provider
            if (this.pushProvider && typeof this.pushProvider.initialize === 'function') {
                await this.pushProvider.initialize();
            }
            
            this.isInitialized = true;
            console.log('PushNotificationService initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize PushNotificationService:', error);
            throw error;
        }
    }
    
    /**
     * Send push notification
     */
    async sendNotification(userId, notification) {
        try {
            console.log(`Sending push notification to user ${userId}: ${notification.title}`);
            
            // Get user's devices
            const devices = await this.getUserDevices(userId);
            if (!devices || devices.length === 0) {
                return { success: false, error: 'No devices found for user' };
            }
            
            // Check user preferences
            const preferences = await this.getUserPreferences(userId);
            if (!this.shouldSendPush(notification.type, preferences)) {
                return { success: false, error: 'User has disabled push notifications for this type' };
            }
            
            // Prepare notification payloads for each device
            const payloads = await this.prepareNotificationPayloads(devices, notification);
            
            // Send to all devices
            const results = await this.sendToDevices(payloads);
            
            // Update metrics
            this.updateMetrics(results);
            
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            
            return {
                success: successCount > 0,
                delivered: successCount,
                total: totalCount,
                results: results
            };
            
        } catch (error) {
            console.error('Error sending push notification:', error);
            this.metrics.failed++;
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Prepare notification payloads for devices
     */
    async prepareNotificationPayloads(devices, notification) {
        const payloads = [];
        
        for (const device of devices) {
            const payload = await this.createPayloadForDevice(device, notification);
            payloads.push({
                device,
                payload,
                platform: device.platform
            });
        }
        
        return payloads;
    }
    
    /**
     * Create platform-specific notification payload
     */
    async createPayloadForDevice(device, notification) {
        const template = this.templates[notification.type] || this.templates.system_alert;
        const platform = device.platform || 'android';
        
        // Prepare template variables
        const variables = this.prepareTemplateVariables(notification);
        
        // Generate title and body
        const title = this.renderTemplate(template.title, variables);
        const body = this.renderTemplate(template.body, variables);
        
        // Base payload
        const basePayload = {
            to: device.token,
            notification: {
                title,
                body
            },
            data: {
                ...template.data,
                notificationId: notification.id,
                timestamp: notification.timestamp,
                ...notification.data
            },
            ttl: this.config.defaultTTL,
            priority: this.config.priorities[notification.priority] || 'normal'
        };
        
        // Add platform-specific configurations
        switch (platform) {
            case 'ios':
                return this.enhanceForIOS(basePayload, notification);
            case 'android':
                return this.enhanceForAndroid(basePayload, notification);
            case 'web':
                return this.enhanceForWeb(basePayload, notification);
            default:
                return basePayload;
        }
    }
    
    /**
     * Enhance payload for iOS
     */
    enhanceForIOS(payload, notification) {
        const iosConfig = this.platforms.ios;
        
        return {
            ...payload,
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: payload.notification.title,
                            body: payload.notification.body
                        },
                        sound: iosConfig.sound,
                        badge: iosConfig.badge,
                        category: iosConfig.category,
                        'thread-id': `comiccomp_${notification.type}`
                    }
                }
            }
        };
    }
    
    /**
     * Enhance payload for Android
     */
    enhanceForAndroid(payload, notification) {
        const androidConfig = this.platforms.android;
        
        return {
            ...payload,
            android: {
                notification: {
                    title: payload.notification.title,
                    body: payload.notification.body,
                    channel_id: androidConfig.channel_id,
                    priority: androidConfig.priority,
                    notification_priority: androidConfig.notification_priority,
                    default_sound: true,
                    default_vibrate_timings: true,
                    default_light_settings: true
                },
                data: payload.data
            }
        };
    }
    
    /**
     * Enhance payload for Web
     */
    enhanceForWeb(payload, notification) {
        const webConfig = this.platforms.web;
        
        return {
            ...payload,
            webpush: {
                notification: {
                    title: payload.notification.title,
                    body: payload.notification.body,
                    icon: webConfig.icon,
                    badge: webConfig.badge,
                    requireInteraction: this.shouldRequireInteraction(notification),
                    actions: this.getNotificationActions(notification)
                },
                data: payload.data
            }
        };
    }
    
    /**
     * Send notifications to devices
     */
    async sendToDevices(payloads) {
        const results = [];
        
        // Process in batches
        const batches = this.chunkArray(payloads, this.config.batchSize);
        
        for (const batch of batches) {
            const batchResults = await this.processBatch(batch);
            results.push(...batchResults);
        }
        
        return results;
    }
    
    /**
     * Process a batch of notifications
     */
    async processBatch(batch) {
        const promises = batch.map(item => this.sendSingleNotification(item));
        const results = await Promise.allSettled(promises);
        
        return results.map((result, index) => {
            const item = batch[index];
            
            if (result.status === 'fulfilled') {
                return {
                    device: item.device,
                    platform: item.platform,
                    success: result.value.success,
                    messageId: result.value.messageId,
                    error: result.value.error
                };
            } else {
                return {
                    device: item.device,
                    platform: item.platform,
                    success: false,
                    error: result.reason?.message || 'Unknown error'
                };
            }
        });
    }
    
    /**
     * Send single notification with retry logic
     */
    async sendSingleNotification(item) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const result = await this.sendPushNotification(item.payload);
                
                if (result.success) {
                    return result;
                } else {
                    lastError = result.error;
                    
                    // Check if it's a permanent failure (invalid token)
                    if (this.isPermanentFailure(result.error)) {
                        await this.handleInvalidDevice(item.device);
                        break;
                    }
                }
                
            } catch (error) {
                lastError = error;
                console.error(`Push notification attempt ${attempt} failed:`, error.message);
            }
            
            // Wait before retry
            if (attempt < this.config.maxRetries) {
                await this.sleep(this.config.retryDelay * attempt);
            }
        }
        
        return { success: false, error: lastError?.message || 'All retry attempts failed' };
    }
    
    /**
     * Send push notification via provider
     */
    async sendPushNotification(payload) {
        try {
            if (this.pushProvider) {
                return await this.pushProvider.send(payload);
            } else {
                // Fallback simulation
                console.log('Simulating push notification send:');
                console.log(`To: ${payload.to}`);
                console.log(`Title: ${payload.notification.title}`);
                console.log(`Body: ${payload.notification.body}`);
                
                return { 
                    success: true, 
                    messageId: `sim_push_${Date.now()}_${Math.random().toString(36).substring(2)}` 
                };
            }
            
        } catch (error) {
            console.error('Error sending push notification:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Prepare template variables
     */
    prepareTemplateVariables(notification) {
        const variables = {
            ...notification.data,
            title: notification.title,
            message: notification.message
        };
        
        // Add computed variables
        if (notification.data?.percentChange) {
            variables.changeDirection = notification.data.percentChange > 0 ? 'increased' : 'decreased';
            variables.percentChange = Math.abs(notification.data.percentChange).toFixed(1);
        }
        
        return variables;
    }
    
    /**
     * Render template with variables
     */
    renderTemplate(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] || match;
        });
    }
    
    /**
     * Get notification actions for web push
     */
    getNotificationActions(notification) {
        const actions = [];
        
        switch (notification.type) {
            case 'price_alert':
                actions.push(
                    { action: 'view', title: 'View Comic', icon: '/assets/icons/view.png' },
                    { action: 'dismiss', title: 'Dismiss', icon: '/assets/icons/dismiss.png' }
                );
                break;
            case 'recommendation':
                actions.push(
                    { action: 'view_recommendations', title: 'View All', icon: '/assets/icons/list.png' },
                    { action: 'dismiss', title: 'Dismiss', icon: '/assets/icons/dismiss.png' }
                );
                break;
            default:
                actions.push(
                    { action: 'open', title: 'Open', icon: '/assets/icons/open.png' },
                    { action: 'dismiss', title: 'Dismiss', icon: '/assets/icons/dismiss.png' }
                );
        }
        
        return actions;
    }
    
    /**
     * Check if notification should require interaction
     */
    shouldRequireInteraction(notification) {
        return notification.priority >= 3; // High and Urgent priority notifications
    }
    
    /**
     * Register device for push notifications
     */
    async registerDevice(userId, deviceToken, platform, metadata = {}) {
        try {
            const device = {
                userId,
                token: deviceToken,
                platform: platform.toLowerCase(),
                metadata: {
                    ...metadata,
                    registeredAt: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                }
            };
            
            // Save device (would typically save to database)
            console.log(`Registering device for user ${userId}:`, device);
            
            return { success: true, deviceId: `device_${Date.now()}` };
            
        } catch (error) {
            console.error('Error registering device:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Unregister device
     */
    async unregisterDevice(userId, deviceToken) {
        try {
            // Remove device (would typically remove from database)
            console.log(`Unregistering device for user ${userId}: ${deviceToken}`);
            
            return { success: true };
            
        } catch (error) {
            console.error('Error unregistering device:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Handle invalid device token
     */
    async handleInvalidDevice(device) {
        try {
            console.log(`Handling invalid device token: ${device.token}`);
            
            // Mark device as invalid or remove it
            await this.unregisterDevice(device.userId, device.token);
            
        } catch (error) {
            console.error('Error handling invalid device:', error);
        }
    }
    
    /**
     * Check if error indicates permanent failure
     */
    isPermanentFailure(error) {
        if (!error) return false;
        
        const permanentErrors = [
            'invalid-registration-token',
            'registration-token-not-registered',
            'invalid-package-name',
            'mismatched-credential'
        ];
        
        return permanentErrors.some(err => error.toLowerCase().includes(err));
    }
    
    /**
     * Utility methods
     */
    async getUserDevices(userId) {
        // This would fetch user devices from database
        // For simulation, return mock devices
        return [
            {
                userId,
                token: `mock_token_${userId}_ios`,
                platform: 'ios',
                metadata: { active: true }
            },
            {
                userId,
                token: `mock_token_${userId}_android`,
                platform: 'android',
                metadata: { active: true }
            }
        ];
    }
    
    async getUserPreferences(userId) {
        try {
            if (this.userPreferences) {
                return await this.userPreferences.getPreferences(userId);
            } else {
                return { push: true }; // Default to allowing push notifications
            }
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return { push: true };
        }
    }
    
    shouldSendPush(notificationType, preferences) {
        if (!preferences || !preferences.push) return false;
        
        // Check type-specific preferences
        switch (notificationType) {
            case 'price_alert':
                return preferences.priceAlerts !== false;
            case 'recommendation':
                return preferences.recommendations !== false;
            case 'market_movement':
                return preferences.marketMovements !== false;
            case 'collection_update':
                return preferences.collectionUpdates !== false;
            default:
                return true;
        }
    }
    
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateMetrics(results) {
        for (const result of results) {
            if (result.success) {
                this.metrics.sent++;
                this.metrics.byPlatform[result.platform].sent++;
            } else {
                this.metrics.failed++;
                this.metrics.byPlatform[result.platform].failed++;
            }
        }
    }
    
    /**
     * Handle push notification events
     */
    async handlePushEvent(eventType, eventData) {
        try {
            switch (eventType) {
                case 'delivered':
                    this.metrics.delivered++;
                    if (eventData.platform) {
                        this.metrics.byPlatform[eventData.platform].delivered++;
                    }
                    break;
                case 'opened':
                    this.metrics.opened++;
                    break;
                case 'clicked':
                    this.metrics.clicked++;
                    break;
            }
            
            console.log(`Push notification event: ${eventType}`, eventData);
            
        } catch (error) {
            console.error('Error handling push event:', error);
        }
    }
    
    /**
     * Get push notification metrics
     */
    getMetrics() {
        const total = this.metrics.sent + this.metrics.failed;
        
        return {
            ...this.metrics,
            successRate: total > 0 ? ((this.metrics.sent / total) * 100).toFixed(2) + '%' : '0%',
            deliveryRate: this.metrics.sent > 0 ? ((this.metrics.delivered / this.metrics.sent) * 100).toFixed(2) + '%' : '0%',
            openRate: this.metrics.delivered > 0 ? ((this.metrics.opened / this.metrics.delivered) * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            sent: 0,
            failed: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            byPlatform: {
                ios: { sent: 0, failed: 0, delivered: 0 },
                android: { sent: 0, failed: 0, delivered: 0 },
                web: { sent: 0, failed: 0, delivered: 0 }
            }
        };
    }
}

module.exports = PushNotificationService; 