/**
 * UserNotificationPreferences.js
 * User notification preference management system
 * 
 * Handles:
 * - User preference storage and retrieval
 * - Subscription/unsubscribe management
 * - Granular notification type controls
 * - Frequency and timing preferences
 * - Compliance with unsubscribe regulations
 */

class UserNotificationPreferences {
    constructor(dependencies = {}) {
        this.database = dependencies.database;
        this.cacheService = dependencies.cacheService;
        
        // Default preferences
        this.DEFAULT_PREFERENCES = {
            email: true,
            push: true,
            sms: false,
            priceAlerts: true,
            recommendations: true,
            marketMovements: true,
            collectionUpdates: true,
            systemAlerts: true,
            frequency: 'immediate', // immediate, hourly, daily, weekly
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00',
                timezone: 'UTC'
            },
            priceAlertThresholds: {
                percentage: 10, // Minimum percentage change to trigger alert
                absolute: null, // Minimum dollar change to trigger alert
                direction: 'both' // 'up', 'down', 'both'
            },
            batchNotifications: false,
            unsubscribeToken: null,
            createdAt: null,
            updatedAt: null
        };
        
        // Notification categories
        this.CATEGORIES = {
            PRICE_ALERTS: 'priceAlerts',
            RECOMMENDATIONS: 'recommendations',
            MARKET_MOVEMENTS: 'marketMovements',
            COLLECTION_UPDATES: 'collectionUpdates',
            SYSTEM_ALERTS: 'systemAlerts'
        };
        
        // Frequency options
        this.FREQUENCY_OPTIONS = [
            'immediate',
            'hourly',
            'daily',
            'weekly'
        ];
        
        // Channel types
        this.CHANNELS = {
            EMAIL: 'email',
            PUSH: 'push',
            SMS: 'sms'
        };
        
        this.isInitialized = false;
        this.cache = new Map();
    }
    
    /**
     * Initialize the preferences service
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing UserNotificationPreferences...');
            
            // Create database table if it doesn't exist
            await this.createPreferencesTable();
            
            this.isInitialized = true;
            console.log('UserNotificationPreferences initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize UserNotificationPreferences:', error);
            throw error;
        }
    }
    
    /**
     * Create preferences table
     */
    async createPreferencesTable() {
        // This would typically create the database table
        // For demonstration, we'll just log
        console.log('Creating user_notification_preferences table...');
    }
    
    /**
     * Get user preferences
     */
    async getPreferences(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            // Check cache first
            const cacheKey = `preferences_${userId}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            // Get from database (simulated)
            const preferences = await this.getPreferencesFromDatabase(userId);
            
            // If no preferences exist, create default ones
            if (!preferences) {
                const defaultPrefs = await this.createDefaultPreferences(userId);
                this.cache.set(cacheKey, defaultPrefs);
                return defaultPrefs;
            }
            
            // Cache the preferences
            this.cache.set(cacheKey, preferences);
            return preferences;
            
        } catch (error) {
            console.error('Error getting user preferences:', error);
            // Return default preferences on error
            return { ...this.DEFAULT_PREFERENCES };
        }
    }
    
    /**
     * Update user preferences
     */
    async updatePreferences(userId, updates) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            // Get current preferences
            const currentPrefs = await this.getPreferences(userId);
            
            // Validate updates
            const validatedUpdates = this.validatePreferences(updates);
            
            // Merge with current preferences
            const updatedPrefs = {
                ...currentPrefs,
                ...validatedUpdates,
                updatedAt: new Date().toISOString()
            };
            
            // Save to database
            await this.savePreferencesToDatabase(userId, updatedPrefs);
            
            // Update cache
            const cacheKey = `preferences_${userId}`;
            this.cache.set(cacheKey, updatedPrefs);
            
            console.log(`Updated preferences for user ${userId}`);
            return updatedPrefs;
            
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }
    
    /**
     * Subscribe user to specific notification type
     */
    async subscribe(userId, category, channel = null) {
        try {
            const updates = {};
            
            if (channel) {
                updates[channel] = true;
            }
            
            if (this.CATEGORIES[category.toUpperCase()]) {
                updates[this.CATEGORIES[category.toUpperCase()]] = true;
            }
            
            return await this.updatePreferences(userId, updates);
            
        } catch (error) {
            console.error('Error subscribing user:', error);
            throw error;
        }
    }
    
    /**
     * Unsubscribe user from specific notification type
     */
    async unsubscribe(userId, category, channel = null) {
        try {
            const updates = {};
            
            if (channel) {
                updates[channel] = false;
            }
            
            if (this.CATEGORIES[category.toUpperCase()]) {
                updates[this.CATEGORIES[category.toUpperCase()]] = false;
            }
            
            return await this.updatePreferences(userId, updates);
            
        } catch (error) {
            console.error('Error unsubscribing user:', error);
            throw error;
        }
    }
    
    /**
     * Unsubscribe from all notifications
     */
    async unsubscribeAll(userId) {
        try {
            const updates = {
                email: false,
                push: false,
                sms: false,
                priceAlerts: false,
                recommendations: false,
                marketMovements: false,
                collectionUpdates: false,
                systemAlerts: false
            };
            
            return await this.updatePreferences(userId, updates);
            
        } catch (error) {
            console.error('Error unsubscribing user from all notifications:', error);
            throw error;
        }
    }
    
    /**
     * Generate unsubscribe token
     */
    generateUnsubscribeToken(userId) {
        // Generate a secure token for unsubscribe links
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${userId}_${timestamp}_${random}`;
    }
    
    /**
     * Process unsubscribe token
     */
    async processUnsubscribeToken(token, category = null) {
        try {
            // Parse token to get user ID
            const parts = token.split('_');
            if (parts.length < 3) {
                throw new Error('Invalid unsubscribe token');
            }
            
            const userId = parts[0];
            
            // Validate token (in real implementation, would check database)
            if (!userId) {
                throw new Error('Invalid user ID in token');
            }
            
            // Unsubscribe from specific category or all
            if (category) {
                await this.unsubscribe(userId, category);
            } else {
                await this.unsubscribeAll(userId);
            }
            
            return {
                success: true,
                userId: userId,
                category: category || 'all'
            };
            
        } catch (error) {
            console.error('Error processing unsubscribe token:', error);
            throw error;
        }
    }
    
    /**
     * Set notification frequency
     */
    async setFrequency(userId, frequency) {
        try {
            if (!this.FREQUENCY_OPTIONS.includes(frequency)) {
                throw new Error(`Invalid frequency. Must be one of: ${this.FREQUENCY_OPTIONS.join(', ')}`);
            }
            
            return await this.updatePreferences(userId, { frequency });
            
        } catch (error) {
            console.error('Error setting notification frequency:', error);
            throw error;
        }
    }
    
    /**
     * Set quiet hours
     */
    async setQuietHours(userId, quietHours) {
        try {
            const validatedQuietHours = this.validateQuietHours(quietHours);
            return await this.updatePreferences(userId, { quietHours: validatedQuietHours });
            
        } catch (error) {
            console.error('Error setting quiet hours:', error);
            throw error;
        }
    }
    
    /**
     * Set price alert thresholds
     */
    async setPriceAlertThresholds(userId, thresholds) {
        try {
            const validatedThresholds = this.validatePriceThresholds(thresholds);
            return await this.updatePreferences(userId, { priceAlertThresholds: validatedThresholds });
            
        } catch (error) {
            console.error('Error setting price alert thresholds:', error);
            throw error;
        }
    }
    
    /**
     * Check if user should receive notification
     */
    async shouldReceiveNotification(userId, notificationType, channel, currentTime = new Date()) {
        try {
            const preferences = await this.getPreferences(userId);
            
            // Check if user has enabled this channel
            if (!preferences[channel]) {
                return { allowed: false, reason: 'channel_disabled' };
            }
            
            // Check if user has enabled this notification type
            if (!preferences[notificationType]) {
                return { allowed: false, reason: 'type_disabled' };
            }
            
            // Check quiet hours
            if (preferences.quietHours?.enabled) {
                const isQuietTime = this.isWithinQuietHours(currentTime, preferences.quietHours);
                if (isQuietTime && preferences.frequency === 'immediate') {
                    return { allowed: false, reason: 'quiet_hours' };
                }
            }
            
            return { allowed: true };
            
        } catch (error) {
            console.error('Error checking notification permissions:', error);
            return { allowed: true }; // Default to allowing on error
        }
    }
    
    /**
     * Get users who should receive batched notifications
     */
    async getUsersForBatchNotifications(frequency) {
        try {
            // This would query database for users with specific frequency settings
            // For now, return empty array
            return [];
        } catch (error) {
            console.error('Error getting users for batch notifications:', error);
            return [];
        }
    }
    
    /**
     * Validate preferences object
     */
    validatePreferences(preferences) {
        const validated = {};
        
        // Validate boolean preferences
        const booleanFields = ['email', 'push', 'sms', 'priceAlerts', 'recommendations', 
                              'marketMovements', 'collectionUpdates', 'systemAlerts', 'batchNotifications'];
        
        for (const field of booleanFields) {
            if (preferences.hasOwnProperty(field)) {
                validated[field] = Boolean(preferences[field]);
            }
        }
        
        // Validate frequency
        if (preferences.frequency && this.FREQUENCY_OPTIONS.includes(preferences.frequency)) {
            validated.frequency = preferences.frequency;
        }
        
        // Validate quiet hours
        if (preferences.quietHours) {
            validated.quietHours = this.validateQuietHours(preferences.quietHours);
        }
        
        // Validate price alert thresholds
        if (preferences.priceAlertThresholds) {
            validated.priceAlertThresholds = this.validatePriceThresholds(preferences.priceAlertThresholds);
        }
        
        return validated;
    }
    
    /**
     * Validate quiet hours
     */
    validateQuietHours(quietHours) {
        const validated = {
            enabled: Boolean(quietHours.enabled),
            start: '22:00',
            end: '08:00',
            timezone: 'UTC'
        };
        
        if (quietHours.start && this.isValidTime(quietHours.start)) {
            validated.start = quietHours.start;
        }
        
        if (quietHours.end && this.isValidTime(quietHours.end)) {
            validated.end = quietHours.end;
        }
        
        if (quietHours.timezone && typeof quietHours.timezone === 'string') {
            validated.timezone = quietHours.timezone;
        }
        
        return validated;
    }
    
    /**
     * Validate price thresholds
     */
    validatePriceThresholds(thresholds) {
        const validated = {
            percentage: 10,
            absolute: null,
            direction: 'both'
        };
        
        if (typeof thresholds.percentage === 'number' && thresholds.percentage >= 0) {
            validated.percentage = thresholds.percentage;
        }
        
        if (typeof thresholds.absolute === 'number' && thresholds.absolute >= 0) {
            validated.absolute = thresholds.absolute;
        }
        
        if (['up', 'down', 'both'].includes(thresholds.direction)) {
            validated.direction = thresholds.direction;
        }
        
        return validated;
    }
    
    /**
     * Check if time is valid (HH:MM format)
     */
    isValidTime(timeString) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }
    
    /**
     * Check if current time is within quiet hours
     */
    isWithinQuietHours(currentTime, quietHours) {
        try {
            const currentHour = currentTime.getHours();
            const currentMinute = currentTime.getMinutes();
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            
            const [startHour, startMinute] = quietHours.start.split(':').map(Number);
            const [endHour, endMinute] = quietHours.end.split(':').map(Number);
            
            const startTimeMinutes = startHour * 60 + startMinute;
            const endTimeMinutes = endHour * 60 + endMinute;
            
            // Handle quiet hours that span midnight
            if (startTimeMinutes > endTimeMinutes) {
                return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
            } else {
                return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
            }
            
        } catch (error) {
            console.error('Error checking quiet hours:', error);
            return false;
        }
    }
    
    /**
     * Create default preferences for new user
     */
    async createDefaultPreferences(userId) {
        try {
            const defaultPrefs = {
                ...this.DEFAULT_PREFERENCES,
                unsubscribeToken: this.generateUnsubscribeToken(userId),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await this.savePreferencesToDatabase(userId, defaultPrefs);
            return defaultPrefs;
            
        } catch (error) {
            console.error('Error creating default preferences:', error);
            return { ...this.DEFAULT_PREFERENCES };
        }
    }
    
    /**
     * Database operations (simulated)
     */
    async getPreferencesFromDatabase(userId) {
        // Simulate database query
        console.log(`Fetching preferences for user ${userId} from database`);
        return null; // No preferences found
    }
    
    async savePreferencesToDatabase(userId, preferences) {
        // Simulate database save
        console.log(`Saving preferences for user ${userId} to database`);
        return true;
    }
    
    /**
     * Clear cache for user
     */
    clearCache(userId) {
        const cacheKey = `preferences_${userId}`;
        this.cache.delete(cacheKey);
    }
    
    /**
     * Get preferences summary for user
     */
    async getPreferencesSummary(userId) {
        try {
            const preferences = await this.getPreferences(userId);
            
            return {
                userId,
                channels: {
                    email: preferences.email,
                    push: preferences.push,
                    sms: preferences.sms
                },
                categories: {
                    priceAlerts: preferences.priceAlerts,
                    recommendations: preferences.recommendations,
                    marketMovements: preferences.marketMovements,
                    collectionUpdates: preferences.collectionUpdates,
                    systemAlerts: preferences.systemAlerts
                },
                frequency: preferences.frequency,
                quietHours: preferences.quietHours,
                thresholds: preferences.priceAlertThresholds
            };
            
        } catch (error) {
            console.error('Error getting preferences summary:', error);
            throw error;
        }
    }
    
    /**
     * Export user preferences (for GDPR compliance)
     */
    async exportUserData(userId) {
        try {
            const preferences = await this.getPreferences(userId);
            
            return {
                userId,
                preferences,
                exportedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error exporting user data:', error);
            throw error;
        }
    }
    
    /**
     * Delete user preferences (for GDPR compliance)
     */
    async deleteUserData(userId) {
        try {
            // Remove from database
            await this.deletePreferencesFromDatabase(userId);
            
            // Clear cache
            this.clearCache(userId);
            
            console.log(`Deleted all preference data for user ${userId}`);
            return true;
            
        } catch (error) {
            console.error('Error deleting user data:', error);
            throw error;
        }
    }
    
    async deletePreferencesFromDatabase(userId) {
        // Simulate database deletion
        console.log(`Deleting preferences for user ${userId} from database`);
        return true;
    }
}

module.exports = UserNotificationPreferences; 