/**
 * BatchNotificationProcessor.js
 * Batch notification processing system
 * 
 * Handles:
 * - Batch processing of multiple notifications
 * - Queue management and prioritization
 * - Rate limiting and throttling
 * - Failure handling and retries
 * - Performance optimization
 */

class BatchNotificationProcessor {
    constructor(dependencies = {}) {
        this.notificationEngine = dependencies.notificationEngine;
        this.rateLimiter = dependencies.rateLimiter;
        this.userPreferences = dependencies.userPreferences;
        
        // Batch configuration
        this.config = {
            maxBatchSize: 100,
            maxConcurrency: 5,
            retryAttempts: 3,
            retryDelay: 1000, // 1 second
            processingInterval: 30000, // 30 seconds
            priorityWeights: {
                1: 1,    // LOW
                2: 2,    // MEDIUM
                3: 4,    // HIGH
                4: 8     // URGENT
            }
        };
        
        // Processing queues
        this.queues = {
            urgent: [],
            high: [],
            medium: [],
            low: []
        };
        
        // Processing state
        this.isProcessing = false;
        this.processingInterval = null;
        this.activeJobs = new Map();
        
        // Metrics
        this.metrics = {
            processed: 0,
            failed: 0,
            retries: 0,
            averageProcessingTime: 0,
            queueSizes: {
                urgent: 0,
                high: 0,
                medium: 0,
                low: 0
            }
        };
    }
    
    /**
     * Initialize the batch processor
     */
    async initialize() {
        try {
            console.log('Initializing BatchNotificationProcessor...');
            
            // Start processing loop
            this.startProcessing();
            
            console.log('BatchNotificationProcessor initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize BatchNotificationProcessor:', error);
            throw error;
        }
    }
    
    /**
     * Add notification to batch queue
     */
    async addToBatch(notification) {
        try {
            // Determine priority queue
            const priority = notification.priority || 2; // Default to medium
            const queueName = this.getQueueName(priority);
            
            // Add to appropriate queue
            this.queues[queueName].push({
                ...notification,
                addedAt: Date.now(),
                attempts: 0
            });
            
            // Update metrics
            this.metrics.queueSizes[queueName] = this.queues[queueName].length;
            
            console.log(`Added notification to ${queueName} queue`);
            
        } catch (error) {
            console.error('Error adding notification to batch:', error);
            throw error;
        }
    }
    
    /**
     * Process a batch of notifications
     */
    async processBatch(notifications) {
        try {
            const startTime = Date.now();
            console.log(`Processing batch of ${notifications.length} notifications`);
            
            // Group notifications by priority
            const batches = this.groupNotificationsByPriority(notifications);
            
            // Process each priority group
            const results = [];
            for (const [priority, batch] of Object.entries(batches)) {
                if (batch.length > 0) {
                    const batchResults = await this.processPriorityBatch(batch, priority);
                    results.push(...batchResults);
                }
            }
            
            // Update metrics
            const processingTime = Date.now() - startTime;
            this.updateMetrics(results, processingTime);
            
            return results;
            
        } catch (error) {
            console.error('Error processing batch:', error);
            throw error;
        }
    }
    
    /**
     * Process a priority-specific batch
     */
    async processPriorityBatch(batch, priority) {
        try {
            // Split into smaller chunks if necessary
            const chunks = this.chunkArray(batch, this.config.maxBatchSize);
            const results = [];
            
            for (const chunk of chunks) {
                // Process chunk with concurrency control
                const chunkResults = await this.processChunkWithConcurrency(chunk);
                results.push(...chunkResults);
            }
            
            return results;
            
        } catch (error) {
            console.error(`Error processing ${priority} priority batch:`, error);
            throw error;
        }
    }
    
    /**
     * Process chunk with concurrency control
     */
    async processChunkWithConcurrency(chunk) {
        const results = [];
        const semaphore = new Semaphore(this.config.maxConcurrency);
        
        const promises = chunk.map(async (notification) => {
            await semaphore.acquire();
            
            try {
                const result = await this.processSingleNotification(notification);
                results.push(result);
                return result;
            } finally {
                semaphore.release();
            }
        });
        
        await Promise.allSettled(promises);
        return results;
    }
    
    /**
     * Process a single notification with retry logic
     */
    async processSingleNotification(notification) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                notification.attempts = attempt;
                
                // Check rate limits
                const rateLimitResult = await this.checkRateLimit(notification);
                if (!rateLimitResult.allowed) {
                    return {
                        notification,
                        success: false,
                        error: 'Rate limited',
                        rateLimited: true
                    };
                }
                
                // Send the notification
                const result = await this.sendNotification(notification);
                
                if (result.success) {
                    this.metrics.processed++;
                    return {
                        notification,
                        success: true,
                        result: result,
                        attempts: attempt
                    };
                } else {
                    lastError = result.error;
                }
                
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed for notification:`, error.message);
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < this.config.retryAttempts) {
                const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                await this.sleep(delay);
                this.metrics.retries++;
            }
        }
        
        // All attempts failed
        this.metrics.failed++;
        return {
            notification,
            success: false,
            error: lastError?.message || 'All retry attempts failed',
            attempts: this.config.retryAttempts
        };
    }
    
    /**
     * Send individual notification
     */
    async sendNotification(notification) {
        try {
            if (this.notificationEngine) {
                return await this.notificationEngine.sendNotification(
                    notification.userId, 
                    notification
                );
            } else {
                // Fallback implementation
                console.log(`Sending notification to user ${notification.userId}:`, notification.title);
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Start processing loop
     */
    startProcessing() {
        this.processingInterval = setInterval(async () => {
            if (!this.isProcessing && this.hasQueuedNotifications()) {
                await this.processQueues();
            }
        }, this.config.processingInterval);
        
        console.log('Batch processing started');
    }
    
    /**
     * Stop processing loop
     */
    stopProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        console.log('Batch processing stopped');
    }
    
    /**
     * Process all queues in priority order
     */
    async processQueues() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            // Process in priority order: urgent -> high -> medium -> low
            const priorityOrder = ['urgent', 'high', 'medium', 'low'];
            
            for (const queueName of priorityOrder) {
                if (this.queues[queueName].length > 0) {
                    await this.processQueue(queueName);
                }
            }
            
        } catch (error) {
            console.error('Error processing queues:', error);
        } finally {
            this.isProcessing = false;
        }
    }
    
    /**
     * Process a specific queue
     */
    async processQueue(queueName) {
        try {
            const queue = this.queues[queueName];
            if (queue.length === 0) return;
            
            // Get batch from queue
            const batch = queue.splice(0, this.config.maxBatchSize);
            
            // Process the batch
            await this.processPriorityBatch(batch, queueName);
            
            // Update queue size metric
            this.metrics.queueSizes[queueName] = queue.length;
            
        } catch (error) {
            console.error(`Error processing ${queueName} queue:`, error);
        }
    }
    
    /**
     * Check rate limits for notification
     */
    async checkRateLimit(notification) {
        try {
            if (this.rateLimiter) {
                return await this.rateLimiter.checkLimit(
                    notification.userId, 
                    notification.type
                );
            } else {
                return { allowed: true };
            }
        } catch (error) {
            console.error('Error checking rate limit:', error);
            return { allowed: true }; // Allow on error
        }
    }
    
    /**
     * Utility methods
     */
    getQueueName(priority) {
        switch (priority) {
            case 4: return 'urgent';
            case 3: return 'high';
            case 2: return 'medium';
            case 1: 
            default: return 'low';
        }
    }
    
    groupNotificationsByPriority(notifications) {
        const groups = {
            urgent: [],
            high: [],
            medium: [],
            low: []
        };
        
        for (const notification of notifications) {
            const queueName = this.getQueueName(notification.priority || 2);
            groups[queueName].push(notification);
        }
        
        return groups;
    }
    
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    
    hasQueuedNotifications() {
        return Object.values(this.queues).some(queue => queue.length > 0);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateMetrics(results, processingTime) {
        // Update average processing time
        const totalProcessed = this.metrics.processed + this.metrics.failed;
        if (totalProcessed > 0) {
            this.metrics.averageProcessingTime = 
                (this.metrics.averageProcessingTime * (totalProcessed - results.length) + processingTime) / totalProcessed;
        }
    }
    
    /**
     * Get current queue status
     */
    getQueueStatus() {
        return {
            sizes: { ...this.metrics.queueSizes },
            totalQueued: Object.values(this.metrics.queueSizes).reduce((sum, size) => sum + size, 0),
            isProcessing: this.isProcessing,
            activeJobs: this.activeJobs.size
        };
    }
    
    /**
     * Get processing metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            queueStatus: this.getQueueStatus()
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            processed: 0,
            failed: 0,
            retries: 0,
            averageProcessingTime: 0,
            queueSizes: {
                urgent: this.queues.urgent.length,
                high: this.queues.high.length,
                medium: this.queues.medium.length,
                low: this.queues.low.length
            }
        };
    }
    
    /**
     * Clear all queues
     */
    clearQueues() {
        Object.keys(this.queues).forEach(queueName => {
            this.queues[queueName] = [];
            this.metrics.queueSizes[queueName] = 0;
        });
    }
    
    /**
     * Get detailed queue information
     */
    getQueueDetails() {
        const details = {};
        
        Object.keys(this.queues).forEach(queueName => {
            details[queueName] = {
                size: this.queues[queueName].length,
                items: this.queues[queueName].map(item => ({
                    id: item.id,
                    userId: item.userId,
                    type: item.type,
                    addedAt: item.addedAt,
                    attempts: item.attempts
                }))
            };
        });
        
        return details;
    }
}

/**
 * Simple Semaphore implementation for concurrency control
 */
class Semaphore {
    constructor(maxCount) {
        this.maxCount = maxCount;
        this.currentCount = 0;
        this.waiting = [];
    }
    
    async acquire() {
        if (this.currentCount < this.maxCount) {
            this.currentCount++;
            return;
        }
        
        return new Promise(resolve => {
            this.waiting.push(resolve);
        });
    }
    
    release() {
        if (this.waiting.length > 0) {
            const resolve = this.waiting.shift();
            resolve();
        } else {
            this.currentCount--;
        }
    }
}

module.exports = BatchNotificationProcessor; 