/**
 * AlertManager.js
 * Price alert monitoring and threshold management system
 * 
 * Handles:
 * - Price alert creation and management
 * - Threshold monitoring and triggering
 * - Alert condition evaluation
 * - Integration with pricing data and notifications
 * - Historical alert tracking and analytics
 */

class AlertManager {
    constructor(dependencies = {}) {
        this.database = dependencies.database;
        this.pricingService = dependencies.pricingService;
        this.notificationEngine = dependencies.notificationEngine;
        this.userPreferences = dependencies.userPreferences;
        
        // Alert types
        this.ALERT_TYPES = {
            PRICE_INCREASE: 'price_increase',
            PRICE_DECREASE: 'price_decrease',
            PRICE_TARGET: 'price_target',
            PERCENTAGE_CHANGE: 'percentage_change',
            VOLUME_SPIKE: 'volume_spike',
            MARKET_ANOMALY: 'market_anomaly'
        };
        
        // Alert statuses
        this.ALERT_STATUS = {
            ACTIVE: 'active',
            TRIGGERED: 'triggered',
            PAUSED: 'paused',
            EXPIRED: 'expired',
            CANCELLED: 'cancelled'
        };
        
        // Alert priorities
        this.ALERT_PRIORITIES = {
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            URGENT: 4
        };
        
        this.isInitialized = false;
        this.alertCheckerInterval = null;
        this.monitoredComics = new Map();
        this.alertCache = new Map();
        this.metrics = {
            totalAlerts: 0,
            triggeredAlerts: 0,
            falsePositives: 0,
            averageResponseTime: 0
        };
    }
    
    /**
     * Initialize the alert manager
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing AlertManager...');
            
            // Create database tables
            await this.createAlertTables();
            
            // Load active alerts into memory
            await this.loadActiveAlerts();
            
            // Start monitoring
            this.startMonitoring();
            
            this.isInitialized = true;
            console.log('AlertManager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize AlertManager:', error);
            throw error;
        }
    }
    
    /**
     * Create database tables for alerts
     */
    async createAlertTables() {
        // This would create the database tables
        console.log('Creating alert database tables...');
    }
    
    /**
     * Create a new price alert
     */
    async createAlert(userId, alertData) {
        try {
            const alert = {
                id: this.generateAlertId(),
                userId,
                comicId: alertData.comicId,
                type: alertData.type || this.ALERT_TYPES.PERCENTAGE_CHANGE,
                status: this.ALERT_STATUS.ACTIVE,
                priority: alertData.priority || this.ALERT_PRIORITIES.MEDIUM,
                thresholds: this.validateThresholds(alertData.thresholds),
                conditions: alertData.conditions || {},
                metadata: {
                    comicTitle: alertData.comicTitle,
                    currentPrice: alertData.currentPrice,
                    description: alertData.description
                },
                settings: {
                    repeatOnTrigger: alertData.repeatOnTrigger || false,
                    cooldownPeriod: alertData.cooldownPeriod || 3600000, // 1 hour in milliseconds
                    expirationDate: alertData.expirationDate,
                    maxTriggers: alertData.maxTriggers || 1
                },
                statistics: {
                    timesTriggered: 0,
                    lastTriggered: null,
                    lastChecked: null,
                    averageResponseTime: null
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Validate alert data
            this.validateAlert(alert);
            
            // Save to database
            await this.saveAlertToDatabase(alert);
            
            // Add to monitoring cache
            this.addToMonitoring(alert);
            
            // Update metrics
            this.metrics.totalAlerts++;
            
            console.log(`Created alert ${alert.id} for user ${userId}`);
            return alert;
            
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }
    
    /**
     * Get user alerts
     */
    async getUserAlerts(userId, comicId = null) {
        try {
            // Get from cache first
            const cacheKey = `user_alerts_${userId}${comicId ? `_${comicId}` : ''}`;
            if (this.alertCache.has(cacheKey)) {
                return this.alertCache.get(cacheKey);
            }
            
            // Get from database
            const alerts = await this.getAlertsFromDatabase(userId, comicId);
            
            // Cache the results
            this.alertCache.set(cacheKey, alerts);
            
            return alerts;
            
        } catch (error) {
            console.error('Error getting user alerts:', error);
            return [];
        }
    }
    
    /**
     * Get users with alerts for a specific comic
     */
    async getUsersWithAlerts(comicId) {
        try {
            // This would query the database for users with alerts for this comic
            const users = await this.getUsersWithAlertsFromDatabase(comicId);
            return users;
        } catch (error) {
            console.error('Error getting users with alerts:', error);
            return [];
        }
    }
    
    /**
     * Update alert
     */
    async updateAlert(alertId, updates) {
        try {
            const alert = await this.getAlert(alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }
            
            // Validate updates
            const validatedUpdates = this.validateAlertUpdates(updates);
            
            // Merge updates
            const updatedAlert = {
                ...alert,
                ...validatedUpdates,
                updatedAt: new Date().toISOString()
            };
            
            // Save to database
            await this.saveAlertToDatabase(updatedAlert);
            
            // Update monitoring cache
            this.updateMonitoringCache(updatedAlert);
            
            console.log(`Updated alert ${alertId}`);
            return updatedAlert;
            
        } catch (error) {
            console.error('Error updating alert:', error);
            throw error;
        }
    }
    
    /**
     * Cancel alert
     */
    async cancelAlert(alertId, userId = null) {
        try {
            const alert = await this.getAlert(alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }
            
            // Check ownership if userId provided
            if (userId && alert.userId !== userId) {
                throw new Error('Unauthorized to cancel this alert');
            }
            
            // Update status to cancelled
            const updatedAlert = {
                ...alert,
                status: this.ALERT_STATUS.CANCELLED,
                updatedAt: new Date().toISOString()
            };
            
            // Save to database
            await this.saveAlertToDatabase(updatedAlert);
            
            // Remove from monitoring
            this.removeFromMonitoring(alertId);
            
            console.log(`Cancelled alert ${alertId}`);
            return updatedAlert;
            
        } catch (error) {
            console.error('Error cancelling alert:', error);
            throw error;
        }
    }
    
    /**
     * Check price changes and trigger alerts
     */
    async checkPriceChanges(comicId, currentPrice, previousPrice) {
        try {
            const startTime = Date.now();
            
            // Get active alerts for this comic
            const alerts = await this.getActiveAlertsForComic(comicId);
            
            const triggeredAlerts = [];
            
            for (const alert of alerts) {
                // Check if alert should be triggered
                const shouldTrigger = await this.evaluateAlertConditions(alert, currentPrice, previousPrice);
                
                if (shouldTrigger) {
                    // Check cooldown period
                    if (this.isInCooldown(alert)) {
                        console.log(`Alert ${alert.id} is in cooldown period`);
                        continue;
                    }
                    
                    // Trigger the alert
                    const triggerResult = await this.triggerAlert(alert, {
                        comicId,
                        currentPrice,
                        previousPrice,
                        percentChange: ((currentPrice - previousPrice) / previousPrice) * 100,
                        timestamp: new Date().toISOString()
                    });
                    
                    triggeredAlerts.push(triggerResult);
                }
                
                // Update last checked time
                await this.updateAlertLastChecked(alert.id);
            }
            
            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateResponseTimeMetrics(responseTime);
            
            return triggeredAlerts;
            
        } catch (error) {
            console.error('Error checking price changes:', error);
            return [];
        }
    }
    
    /**
     * Evaluate alert conditions
     */
    async evaluateAlertConditions(alert, currentPrice, previousPrice) {
        try {
            const { type, thresholds, conditions } = alert;
            const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
            
            switch (type) {
                case this.ALERT_TYPES.PRICE_INCREASE:
                    return currentPrice > previousPrice && 
                           (thresholds.percentage ? percentChange >= thresholds.percentage : true) &&
                           (thresholds.absolute ? currentPrice - previousPrice >= thresholds.absolute : true);
                
                case this.ALERT_TYPES.PRICE_DECREASE:
                    return currentPrice < previousPrice && 
                           (thresholds.percentage ? Math.abs(percentChange) >= thresholds.percentage : true) &&
                           (thresholds.absolute ? previousPrice - currentPrice >= thresholds.absolute : true);
                
                case this.ALERT_TYPES.PRICE_TARGET:
                    if (thresholds.direction === 'above') {
                        return currentPrice >= thresholds.target;
                    } else if (thresholds.direction === 'below') {
                        return currentPrice <= thresholds.target;
                    }
                    return Math.abs(currentPrice - thresholds.target) <= (thresholds.tolerance || 0);
                
                case this.ALERT_TYPES.PERCENTAGE_CHANGE:
                    return Math.abs(percentChange) >= thresholds.percentage;
                
                case this.ALERT_TYPES.VOLUME_SPIKE:
                    // This would check volume data if available
                    return false;
                
                case this.ALERT_TYPES.MARKET_ANOMALY:
                    // This would check for anomalies detected by AnomalyDetector
                    return false;
                
                default:
                    return false;
            }
            
        } catch (error) {
            console.error('Error evaluating alert conditions:', error);
            return false;
        }
    }
    
    /**
     * Trigger an alert
     */
    async triggerAlert(alert, triggerData) {
        try {
            console.log(`Triggering alert ${alert.id} for user ${alert.userId}`);
            
            // Update alert statistics
            const updatedAlert = {
                ...alert,
                status: alert.settings.repeatOnTrigger ? this.ALERT_STATUS.ACTIVE : this.ALERT_STATUS.TRIGGERED,
                statistics: {
                    ...alert.statistics,
                    timesTriggered: alert.statistics.timesTriggered + 1,
                    lastTriggered: new Date().toISOString(),
                    lastChecked: new Date().toISOString()
                },
                updatedAt: new Date().toISOString()
            };
            
            // Check if alert has reached max triggers
            if (alert.settings.maxTriggers && 
                updatedAlert.statistics.timesTriggered >= alert.settings.maxTriggers) {
                updatedAlert.status = this.ALERT_STATUS.EXPIRED;
            }
            
            // Save updated alert
            await this.saveAlertToDatabase(updatedAlert);
            
            // Send notification if notification engine is available
            if (this.notificationEngine) {
                const notification = {
                    type: 'price_alert',
                    priority: alert.priority,
                    title: 'Price Alert Triggered',
                    message: this.generateAlertMessage(alert, triggerData),
                    data: {
                        alertId: alert.id,
                        comicId: alert.comicId,
                        comicTitle: alert.metadata.comicTitle,
                        ...triggerData
                    },
                    timestamp: new Date().toISOString()
                };
                
                await this.notificationEngine.sendNotification(alert.userId, notification);
            }
            
            // Update metrics
            this.metrics.triggeredAlerts++;
            
            // Remove from monitoring if not repeating
            if (!alert.settings.repeatOnTrigger) {
                this.removeFromMonitoring(alert.id);
            }
            
            return {
                alert: updatedAlert,
                triggerData,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error triggering alert:', error);
            throw error;
        }
    }
    
    /**
     * Start monitoring service
     */
    startMonitoring() {
        // Check alerts every 5 minutes
        this.alertCheckerInterval = setInterval(async () => {
            try {
                await this.performScheduledChecks();
            } catch (error) {
                console.error('Error in scheduled alert checks:', error);
            }
        }, 300000); // 5 minutes
        
        console.log('Alert monitoring started');
    }
    
    /**
     * Stop monitoring service
     */
    stopMonitoring() {
        if (this.alertCheckerInterval) {
            clearInterval(this.alertCheckerInterval);
            this.alertCheckerInterval = null;
        }
        console.log('Alert monitoring stopped');
    }
    
    /**
     * Perform scheduled checks for expired alerts and maintenance
     */
    async performScheduledChecks() {
        try {
            // Check for expired alerts
            await this.checkExpiredAlerts();
            
            // Clean up old triggered alerts
            await this.cleanupOldAlerts();
            
            // Update monitoring cache
            await this.refreshMonitoringCache();
            
        } catch (error) {
            console.error('Error in scheduled checks:', error);
        }
    }
    
    /**
     * Check for expired alerts
     */
    async checkExpiredAlerts() {
        const now = new Date();
        const expiredAlerts = [];
        
        for (const [alertId, alert] of this.monitoredComics) {
            if (alert.settings.expirationDate && new Date(alert.settings.expirationDate) <= now) {
                expiredAlerts.push(alert);
            }
        }
        
        for (const alert of expiredAlerts) {
            await this.updateAlert(alert.id, { status: this.ALERT_STATUS.EXPIRED });
            this.removeFromMonitoring(alert.id);
        }
        
        if (expiredAlerts.length > 0) {
            console.log(`Expired ${expiredAlerts.length} alerts`);
        }
    }
    
    /**
     * Validate alert data
     */
    validateAlert(alert) {
        if (!alert.userId) throw new Error('User ID is required');
        if (!alert.comicId) throw new Error('Comic ID is required');
        if (!alert.type || !Object.values(this.ALERT_TYPES).includes(alert.type)) {
            throw new Error('Valid alert type is required');
        }
        if (!alert.thresholds) throw new Error('Alert thresholds are required');
    }
    
    /**
     * Validate alert thresholds
     */
    validateThresholds(thresholds) {
        const validated = {};
        
        if (thresholds.percentage !== undefined) {
            validated.percentage = Math.max(0, Number(thresholds.percentage));
        }
        
        if (thresholds.absolute !== undefined) {
            validated.absolute = Math.max(0, Number(thresholds.absolute));
        }
        
        if (thresholds.target !== undefined) {
            validated.target = Math.max(0, Number(thresholds.target));
        }
        
        if (thresholds.direction) {
            validated.direction = thresholds.direction;
        }
        
        if (thresholds.tolerance !== undefined) {
            validated.tolerance = Math.max(0, Number(thresholds.tolerance));
        }
        
        return validated;
    }
    
    /**
     * Generate alert message
     */
    generateAlertMessage(alert, triggerData) {
        const { comicTitle } = alert.metadata;
        const { currentPrice, previousPrice, percentChange } = triggerData;
        
        switch (alert.type) {
            case this.ALERT_TYPES.PRICE_INCREASE:
                return `${comicTitle} price increased by ${percentChange.toFixed(1)}% to $${currentPrice.toFixed(2)}`;
            case this.ALERT_TYPES.PRICE_DECREASE:
                return `${comicTitle} price decreased by ${Math.abs(percentChange).toFixed(1)}% to $${currentPrice.toFixed(2)}`;
            case this.ALERT_TYPES.PRICE_TARGET:
                return `${comicTitle} reached target price of $${currentPrice.toFixed(2)}`;
            case this.ALERT_TYPES.PERCENTAGE_CHANGE:
                return `${comicTitle} price changed by ${percentChange.toFixed(1)}% to $${currentPrice.toFixed(2)}`;
            default:
                return `Price alert triggered for ${comicTitle}`;
        }
    }
    
    /**
     * Helper methods
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    
    isInCooldown(alert) {
        if (!alert.statistics.lastTriggered || !alert.settings.cooldownPeriod) {
            return false;
        }
        
        const lastTriggered = new Date(alert.statistics.lastTriggered);
        const now = new Date();
        return (now - lastTriggered) < alert.settings.cooldownPeriod;
    }
    
    addToMonitoring(alert) {
        this.monitoredComics.set(alert.id, alert);
    }
    
    removeFromMonitoring(alertId) {
        this.monitoredComics.delete(alertId);
    }
    
    updateMonitoringCache(alert) {
        if (alert.status === this.ALERT_STATUS.ACTIVE) {
            this.monitoredComics.set(alert.id, alert);
        } else {
            this.monitoredComics.delete(alert.id);
        }
    }
    
    async loadActiveAlerts() {
        // Load active alerts from database into monitoring cache
        console.log('Loading active alerts into monitoring cache...');
    }
    
    async refreshMonitoringCache() {
        // Refresh the monitoring cache periodically
        console.log('Refreshing monitoring cache...');
    }
    
    async updateAlertLastChecked(alertId) {
        // Update the last checked timestamp for the alert
        console.log(`Updating last checked time for alert ${alertId}`);
    }
    
    updateResponseTimeMetrics(responseTime) {
        // Update average response time metrics
        const currentAvg = this.metrics.averageResponseTime;
        const count = this.metrics.triggeredAlerts;
        this.metrics.averageResponseTime = currentAvg + (responseTime - currentAvg) / Math.max(count, 1);
    }
    
    /**
     * Database operations (simulated)
     */
    async saveAlertToDatabase(alert) {
        console.log(`Saving alert ${alert.id} to database`);
        return true;
    }
    
    async getAlert(alertId) {
        console.log(`Getting alert ${alertId} from database`);
        return null;
    }
    
    async getAlertsFromDatabase(userId, comicId = null) {
        console.log(`Getting alerts for user ${userId}${comicId ? ` and comic ${comicId}` : ''} from database`);
        return [];
    }
    
    async getUsersWithAlertsFromDatabase(comicId) {
        console.log(`Getting users with alerts for comic ${comicId} from database`);
        return [];
    }
    
    async getActiveAlertsForComic(comicId) {
        const alerts = [];
        for (const [alertId, alert] of this.monitoredComics) {
            if (alert.comicId === comicId && alert.status === this.ALERT_STATUS.ACTIVE) {
                alerts.push(alert);
            }
        }
        return alerts;
    }
    
    validateAlertUpdates(updates) {
        const validated = {};
        
        if (updates.status && Object.values(this.ALERT_STATUS).includes(updates.status)) {
            validated.status = updates.status;
        }
        
        if (updates.thresholds) {
            validated.thresholds = this.validateThresholds(updates.thresholds);
        }
        
        if (updates.priority && Object.values(this.ALERT_PRIORITIES).includes(updates.priority)) {
            validated.priority = updates.priority;
        }
        
        return validated;
    }
    
    async cleanupOldAlerts() {
        // Clean up old triggered/expired alerts from cache
        console.log('Cleaning up old alerts...');
    }
    
    /**
     * Get alert metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeAlerts: this.monitoredComics.size,
            monitoredComics: Array.from(new Set(Array.from(this.monitoredComics.values()).map(a => a.comicId))).length
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalAlerts: 0,
            triggeredAlerts: 0,
            falsePositives: 0,
            averageResponseTime: 0
        };
    }
}

module.exports = AlertManager; 