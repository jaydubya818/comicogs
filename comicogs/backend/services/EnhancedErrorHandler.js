const EventEmitter = require('events');

/**
 * Enhanced Error Handler for Task 1
 * Provides robust error handling with retry logic, circuit breaker patterns,
 * and intelligent failure recovery for marketplace data collection
 */
class EnhancedErrorHandler extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            ...this.getDefaultConfig(),
            ...config
        };
        
        // Error tracking and statistics
        this.errorStats = {
            totalErrors: 0,
            errorsByType: {},
            errorsByMarketplace: {},
            errorsByTimeWindow: {},
            recoveredErrors: 0,
            criticalErrors: 0,
            lastErrorTime: null,
            errorRate: 0,
            consecutiveErrors: 0,
            startTime: Date.now()
        };
        
        // Circuit breaker state for each marketplace
        this.circuitBreakers = new Map();
        
        // Retry queues for failed requests
        this.retryQueues = new Map();
        
        // Error patterns and classifications
        this.errorPatterns = this.initializeErrorPatterns();
        
        // Start error monitoring
        this.startErrorMonitoring();
        
        console.log('🛡️ Enhanced Error Handler initialized');
    }

    getDefaultConfig() {
        return {
            // Retry configuration
            retry: {
                maxAttempts: 5,
                baseDelay: 1000,
                maxDelay: 30000,
                exponentialBackoff: true,
                jitterFactor: 0.1,
                retryableErrors: [
                    'ECONNRESET',
                    'ECONNREFUSED',
                    'ETIMEDOUT',
                    'ENOTFOUND',
                    'RATE_LIMIT_EXCEEDED',
                    'TEMPORARILY_UNAVAILABLE',
                    'INTERNAL_SERVER_ERROR'
                ]
            },
            
            // Circuit breaker configuration
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                recoveryTimeout: 30000,
                halfOpenMaxCalls: 3,
                resetTimeout: 60000,
                monitoringPeriod: 10000
            },
            
            // Error classification
            errorClassification: {
                critical: [
                    'AUTHENTICATION_FAILED',
                    'AUTHORIZATION_DENIED',
                    'ACCOUNT_SUSPENDED',
                    'TERMS_VIOLATION',
                    'PERMANENT_BAN'
                ],
                recoverable: [
                    'RATE_LIMIT_EXCEEDED',
                    'TEMPORARILY_UNAVAILABLE',
                    'NETWORK_ERROR',
                    'TIMEOUT',
                    'SERVER_ERROR'
                ],
                ignorable: [
                    'NOT_FOUND',
                    'NO_RESULTS',
                    'INVALID_QUERY',
                    'VALIDATION_ERROR'
                ]
            },
            
            // Alerting configuration
            alerting: {
                enabled: true,
                errorRateThreshold: 0.1,
                criticalErrorThreshold: 3,
                consecutiveErrorThreshold: 10,
                alertCooldown: 300000, // 5 minutes
                channels: ['console', 'email', 'slack']
            },
            
            // Monitoring configuration
            monitoring: {
                enabled: true,
                errorWindowSize: 3600000, // 1 hour
                metricsRetention: 86400000, // 24 hours
                healthCheckInterval: 30000, // 30 seconds
                degradationThreshold: 0.2
            },
            
            // Recovery strategies
            recovery: {
                autoRecovery: true,
                backoffStrategies: {
                    linear: (attempt) => attempt * 1000,
                    exponential: (attempt) => Math.pow(2, attempt - 1) * 1000,
                    fibonacci: (attempt) => this.fibonacci(attempt) * 1000
                },
                maxRecoveryAttempts: 10,
                recoveryDelay: 60000
            }
        };
    }

    initializeErrorPatterns() {
        return {
            // Network errors
            network: {
                patterns: [
                    /ECONNRESET/,
                    /ECONNREFUSED/,
                    /ETIMEDOUT/,
                    /ENOTFOUND/,
                    /ENETUNREACH/,
                    /EHOSTUNREACH/
                ],
                category: 'network',
                retryable: true,
                severity: 'medium'
            },
            
            // Rate limiting errors
            rateLimit: {
                patterns: [
                    /rate limit/i,
                    /too many requests/i,
                    /quota exceeded/i,
                    /throttled/i,
                    /429/
                ],
                category: 'rate_limit',
                retryable: true,
                severity: 'medium'
            },
            
            // Authentication errors
            authentication: {
                patterns: [
                    /unauthorized/i,
                    /authentication failed/i,
                    /invalid credentials/i,
                    /401/,
                    /403/
                ],
                category: 'authentication',
                retryable: false,
                severity: 'critical'
            },
            
            // Server errors
            server: {
                patterns: [
                    /internal server error/i,
                    /service unavailable/i,
                    /bad gateway/i,
                    /500/,
                    /502/,
                    /503/,
                    /504/
                ],
                category: 'server',
                retryable: true,
                severity: 'high'
            },
            
            // Parsing errors
            parsing: {
                patterns: [
                    /parse error/i,
                    /invalid json/i,
                    /malformed response/i,
                    /unexpected token/i
                ],
                category: 'parsing',
                retryable: false,
                severity: 'medium'
            },
            
            // Validation errors
            validation: {
                patterns: [
                    /validation failed/i,
                    /invalid input/i,
                    /bad request/i,
                    /400/
                ],
                category: 'validation',
                retryable: false,
                severity: 'low'
            }
        };
    }

    /**
     * Main error handling method
     */
    async handleError(error, context = {}) {
        const errorDetails = this.analyzeError(error, context);
        
        // Update error statistics
        this.updateErrorStats(errorDetails);
        
        // Log error
        this.logError(errorDetails);
        
        // Check if error is retryable
        if (errorDetails.retryable && this.shouldRetry(context)) {
            return await this.handleRetry(error, context, errorDetails);
        }
        
        // Update circuit breaker
        if (context.marketplace) {
            this.updateCircuitBreaker(context.marketplace, errorDetails);
        }
        
        // Check for critical errors
        if (errorDetails.severity === 'critical') {
            await this.handleCriticalError(errorDetails);
        }
        
        // Send alerts if necessary
        if (this.shouldAlert(errorDetails)) {
            await this.sendAlert(errorDetails);
        }
        
        // Emit error event
        this.emit('error', errorDetails);
        
        return errorDetails;
    }

    /**
     * Analyze error and extract meaningful information
     */
    analyzeError(error, context) {
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status || error.statusCode,
            timestamp: Date.now(),
            context: context,
            category: 'unknown',
            severity: 'medium',
            retryable: false,
            marketplace: context.marketplace,
            operation: context.operation,
            attempt: context.attempt || 1,
            metadata: {}
        };
        
        // Classify error based on patterns
        for (const [name, pattern] of Object.entries(this.errorPatterns)) {
            for (const regex of pattern.patterns) {
                if (regex.test(error.message) || regex.test(error.code || '')) {
                    errorDetails.category = pattern.category;
                    errorDetails.severity = pattern.severity;
                    errorDetails.retryable = pattern.retryable;
                    errorDetails.patternName = name;
                    break;
                }
            }
            if (errorDetails.category !== 'unknown') break;
        }
        
        // Extract additional metadata
        if (error.response) {
            errorDetails.metadata.responseStatus = error.response.status;
            errorDetails.metadata.responseHeaders = error.response.headers;
            errorDetails.metadata.responseData = error.response.data;
        }
        
        if (error.request) {
            errorDetails.metadata.requestUrl = error.request.url;
            errorDetails.metadata.requestMethod = error.request.method;
            errorDetails.metadata.requestHeaders = error.request.headers;
        }
        
        return errorDetails;
    }

    /**
     * Handle retry logic for recoverable errors
     */
    async handleRetry(error, context, errorDetails) {
        const marketplace = context.marketplace;
        const operation = context.operation;
        const attempt = context.attempt || 1;
        
        if (attempt >= this.config.retry.maxAttempts) {
            console.error(`❌ Max retry attempts reached for ${marketplace}:${operation}`);
            return {
                success: false,
                error: errorDetails,
                finalAttempt: true
            };
        }
        
        // Calculate retry delay
        const delay = this.calculateRetryDelay(attempt, errorDetails);
        
        console.log(`🔄 Retrying ${marketplace}:${operation} (attempt ${attempt + 1}/${this.config.retry.maxAttempts}) in ${delay}ms`);
        
        // Add to retry queue
        this.addToRetryQueue(marketplace, {
            operation,
            context: { ...context, attempt: attempt + 1 },
            delay,
            errorDetails
        });
        
        // Emit retry event
        this.emit('retry', {
            marketplace,
            operation,
            attempt: attempt + 1,
            delay,
            errorDetails
        });
        
        return {
            success: false,
            error: errorDetails,
            willRetry: true,
            nextAttempt: attempt + 1,
            retryDelay: delay
        };
    }

    /**
     * Calculate retry delay with exponential backoff and jitter
     */
    calculateRetryDelay(attempt, errorDetails) {
        let delay = this.config.retry.baseDelay;
        
        if (this.config.retry.exponentialBackoff) {
            delay = this.config.retry.baseDelay * Math.pow(2, attempt - 1);
        }
        
        // Add jitter to prevent thundering herd
        const jitter = delay * this.config.retry.jitterFactor * Math.random();
        delay += jitter;
        
        // Apply category-specific multipliers
        const categoryMultipliers = {
            rate_limit: 2.0,
            network: 1.5,
            server: 1.2,
            parsing: 1.0
        };
        
        const multiplier = categoryMultipliers[errorDetails.category] || 1.0;
        delay *= multiplier;
        
        // Ensure delay is within bounds
        return Math.min(delay, this.config.retry.maxDelay);
    }

    /**
     * Add failed request to retry queue
     */
    addToRetryQueue(marketplace, retryItem) {
        if (!this.retryQueues.has(marketplace)) {
            this.retryQueues.set(marketplace, []);
        }
        
        const queue = this.retryQueues.get(marketplace);
        queue.push({
            ...retryItem,
            scheduledTime: Date.now() + retryItem.delay
        });
        
        // Process retry queue
        this.processRetryQueue(marketplace);
    }

    /**
     * Process retry queue for a marketplace
     */
    processRetryQueue(marketplace) {
        const queue = this.retryQueues.get(marketplace);
        if (!queue || queue.length === 0) return;
        
        const now = Date.now();
        const readyItems = queue.filter(item => item.scheduledTime <= now);
        
        if (readyItems.length === 0) {
            // Schedule next processing
            const nextItem = queue.reduce((earliest, item) => 
                item.scheduledTime < earliest.scheduledTime ? item : earliest
            );
            
            setTimeout(() => {
                this.processRetryQueue(marketplace);
            }, nextItem.scheduledTime - now);
            
            return;
        }
        
        // Remove processed items from queue
        this.retryQueues.set(marketplace, queue.filter(item => item.scheduledTime > now));
        
        // Emit retry ready events
        readyItems.forEach(item => {
            this.emit('retryReady', {
                marketplace,
                operation: item.operation,
                context: item.context,
                errorDetails: item.errorDetails
            });
        });
    }

    /**
     * Update circuit breaker state
     */
    updateCircuitBreaker(marketplace, errorDetails) {
        if (!this.config.circuitBreaker.enabled) return;
        
        let breaker = this.circuitBreakers.get(marketplace);
        if (!breaker) {
            breaker = {
                state: 'CLOSED',
                failureCount: 0,
                lastFailureTime: null,
                nextAttemptTime: null,
                halfOpenCallCount: 0
            };
            this.circuitBreakers.set(marketplace, breaker);
        }
        
        const now = Date.now();
        
        if (errorDetails.severity === 'critical' || errorDetails.category === 'authentication') {
            // Immediately open circuit for critical errors
            breaker.state = 'OPEN';
            breaker.failureCount = this.config.circuitBreaker.failureThreshold;
            breaker.lastFailureTime = now;
            breaker.nextAttemptTime = now + this.config.circuitBreaker.recoveryTimeout;
            
            console.warn(`🔴 Circuit breaker OPENED for ${marketplace} (critical error)`);
            this.emit('circuitBreakerOpen', { marketplace, reason: 'critical_error' });
        } else {
            // Increment failure count
            breaker.failureCount++;
            breaker.lastFailureTime = now;
            
            if (breaker.failureCount >= this.config.circuitBreaker.failureThreshold) {
                breaker.state = 'OPEN';
                breaker.nextAttemptTime = now + this.config.circuitBreaker.recoveryTimeout;
                
                console.warn(`🔴 Circuit breaker OPENED for ${marketplace} (failure threshold reached)`);
                this.emit('circuitBreakerOpen', { marketplace, reason: 'failure_threshold' });
            }
        }
    }

    /**
     * Check if circuit breaker allows request
     */
    isCircuitBreakerOpen(marketplace) {
        const breaker = this.circuitBreakers.get(marketplace);
        if (!breaker || !this.config.circuitBreaker.enabled) return false;
        
        const now = Date.now();
        
        switch (breaker.state) {
            case 'CLOSED':
                return false;
            
            case 'OPEN':
                if (now >= breaker.nextAttemptTime) {
                    // Transition to half-open
                    breaker.state = 'HALF_OPEN';
                    breaker.halfOpenCallCount = 0;
                    console.log(`🟡 Circuit breaker HALF-OPEN for ${marketplace}`);
                    this.emit('circuitBreakerHalfOpen', { marketplace });
                    return false;
                }
                return true;
            
            case 'HALF_OPEN':
                if (breaker.halfOpenCallCount >= this.config.circuitBreaker.halfOpenMaxCalls) {
                    return true;
                }
                breaker.halfOpenCallCount++;
                return false;
            
            default:
                return false;
        }
    }

    /**
     * Handle successful request (for circuit breaker recovery)
     */
    handleSuccess(marketplace) {
        const breaker = this.circuitBreakers.get(marketplace);
        if (!breaker) return;
        
        switch (breaker.state) {
            case 'HALF_OPEN':
                // Reset circuit breaker
                breaker.state = 'CLOSED';
                breaker.failureCount = 0;
                breaker.lastFailureTime = null;
                breaker.nextAttemptTime = null;
                breaker.halfOpenCallCount = 0;
                
                console.log(`🟢 Circuit breaker CLOSED for ${marketplace} (recovery successful)`);
                this.emit('circuitBreakerClosed', { marketplace });
                break;
            
            case 'CLOSED':
                // Gradually reduce failure count on success
                if (breaker.failureCount > 0) {
                    breaker.failureCount = Math.max(0, breaker.failureCount - 1);
                }
                break;
        }
    }

    /**
     * Handle critical errors
     */
    async handleCriticalError(errorDetails) {
        this.errorStats.criticalErrors++;
        
        console.error(`🚨 CRITICAL ERROR in ${errorDetails.marketplace}:${errorDetails.operation}:`, errorDetails.message);
        
        // Log critical error details
        console.error('Critical Error Details:', {
            marketplace: errorDetails.marketplace,
            operation: errorDetails.operation,
            category: errorDetails.category,
            message: errorDetails.message,
            timestamp: new Date(errorDetails.timestamp).toISOString(),
            context: errorDetails.context
        });
        
        // Emit critical error event
        this.emit('criticalError', errorDetails);
        
        // Send immediate alert
        await this.sendAlert(errorDetails, true);
        
        // Potentially disable marketplace temporarily
        if (errorDetails.category === 'authentication' && errorDetails.marketplace) {
            await this.temporarilyDisableMarketplace(errorDetails.marketplace);
        }
    }

    /**
     * Temporarily disable marketplace
     */
    async temporarilyDisableMarketplace(marketplace) {
        console.warn(`⏸️ Temporarily disabling ${marketplace} due to critical error`);
        
        // Open circuit breaker
        const breaker = this.circuitBreakers.get(marketplace) || {};
        breaker.state = 'OPEN';
        breaker.failureCount = this.config.circuitBreaker.failureThreshold;
        breaker.lastFailureTime = Date.now();
        breaker.nextAttemptTime = Date.now() + (this.config.circuitBreaker.recoveryTimeout * 2);
        
        this.circuitBreakers.set(marketplace, breaker);
        
        // Emit marketplace disabled event
        this.emit('marketplaceDisabled', { marketplace, reason: 'critical_error' });
    }

    /**
     * Update error statistics
     */
    updateErrorStats(errorDetails) {
        this.errorStats.totalErrors++;
        this.errorStats.lastErrorTime = errorDetails.timestamp;
        
        // Update error by type
        const errorType = errorDetails.category || 'unknown';
        this.errorStats.errorsByType[errorType] = (this.errorStats.errorsByType[errorType] || 0) + 1;
        
        // Update error by marketplace
        if (errorDetails.marketplace) {
            this.errorStats.errorsByMarketplace[errorDetails.marketplace] = 
                (this.errorStats.errorsByMarketplace[errorDetails.marketplace] || 0) + 1;
        }
        
        // Update error by time window
        const timeWindow = this.getTimeWindow(errorDetails.timestamp);
        this.errorStats.errorsByTimeWindow[timeWindow] = 
            (this.errorStats.errorsByTimeWindow[timeWindow] || 0) + 1;
        
        // Update consecutive errors
        this.errorStats.consecutiveErrors++;
        
        // Calculate error rate
        const timeSpan = errorDetails.timestamp - this.errorStats.startTime;
        this.errorStats.errorRate = this.errorStats.totalErrors / (timeSpan / 1000); // errors per second
    }

    /**
     * Handle successful operations (to reset consecutive errors)
     */
    handleSuccessfulOperation(marketplace) {
        this.errorStats.consecutiveErrors = 0;
        this.handleSuccess(marketplace);
    }

    /**
     * Determine if error should trigger an alert
     */
    shouldAlert(errorDetails) {
        if (!this.config.alerting.enabled) return false;
        
        // Always alert for critical errors
        if (errorDetails.severity === 'critical') return true;
        
        // Alert if error rate is too high
        if (this.errorStats.errorRate > this.config.alerting.errorRateThreshold) return true;
        
        // Alert if too many consecutive errors
        if (this.errorStats.consecutiveErrors >= this.config.alerting.consecutiveErrorThreshold) return true;
        
        // Alert if too many critical errors
        if (this.errorStats.criticalErrors >= this.config.alerting.criticalErrorThreshold) return true;
        
        return false;
    }

    /**
     * Send alert notifications
     */
    async sendAlert(errorDetails, isCritical = false) {
        const alertData = {
            type: isCritical ? 'critical' : 'warning',
            marketplace: errorDetails.marketplace,
            operation: errorDetails.operation,
            category: errorDetails.category,
            message: errorDetails.message,
            timestamp: new Date(errorDetails.timestamp).toISOString(),
            errorStats: this.getErrorSummary()
        };
        
        console.warn(`🚨 ALERT [${alertData.type.toUpperCase()}]:`, alertData.message);
        
        // Emit alert event
        this.emit('alert', alertData);
        
        // TODO: Implement actual alert channels (email, Slack, etc.)
        // For now, just log to console
        if (isCritical) {
            console.error('💥 CRITICAL ALERT:', JSON.stringify(alertData, null, 2));
        }
    }

    /**
     * Determine if error should be retried
     */
    shouldRetry(context) {
        const attempt = context.attempt || 1;
        
        if (attempt >= this.config.retry.maxAttempts) {
            return false;
        }
        
        // Check circuit breaker
        if (context.marketplace && this.isCircuitBreakerOpen(context.marketplace)) {
            return false;
        }
        
        return true;
    }

    /**
     * Log error details
     */
    logError(errorDetails) {
        const logLevel = this.getLogLevel(errorDetails.severity);
        const message = `${errorDetails.marketplace || 'unknown'}:${errorDetails.operation || 'unknown'} - ${errorDetails.message}`;
        
        switch (logLevel) {
            case 'error':
                console.error(`❌ ERROR [${errorDetails.category}]:`, message);
                break;
            case 'warn':
                console.warn(`⚠️ WARNING [${errorDetails.category}]:`, message);
                break;
            case 'info':
                console.info(`ℹ️ INFO [${errorDetails.category}]:`, message);
                break;
            default:
                console.log(`📝 LOG [${errorDetails.category}]:`, message);
        }
        
        // Log additional details for debugging
        if (errorDetails.severity === 'critical' || errorDetails.category === 'authentication') {
            console.error('Error Details:', {
                stack: errorDetails.stack,
                context: errorDetails.context,
                metadata: errorDetails.metadata
            });
        }
    }

    /**
     * Get log level based on error severity
     */
    getLogLevel(severity) {
        const levelMap = {
            'critical': 'error',
            'high': 'error',
            'medium': 'warn',
            'low': 'info'
        };
        
        return levelMap[severity] || 'info';
    }

    /**
     * Get time window for error tracking
     */
    getTimeWindow(timestamp) {
        const date = new Date(timestamp);
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        
        return `${year}-${month}-${day}-${hour}`;
    }

    /**
     * Start error monitoring
     */
    startErrorMonitoring() {
        if (!this.config.monitoring.enabled) return;
        
        setInterval(() => {
            this.performHealthCheck();
            this.cleanupOldErrors();
        }, this.config.monitoring.healthCheckInterval);
    }

    /**
     * Perform health check
     */
    performHealthCheck() {
        const now = Date.now();
        const windowStart = now - this.config.monitoring.errorWindowSize;
        
        // Count recent errors
        const recentErrors = Object.entries(this.errorStats.errorsByTimeWindow)
            .filter(([timeWindow, count]) => {
                const windowTime = this.parseTimeWindow(timeWindow);
                return windowTime >= windowStart;
            })
            .reduce((sum, [timeWindow, count]) => sum + count, 0);
        
        // Calculate health score
        const totalOperations = this.errorStats.totalErrors + this.errorStats.recoveredErrors;
        const errorRate = totalOperations > 0 ? recentErrors / totalOperations : 0;
        const healthScore = Math.max(0, 1 - errorRate);
        
        // Emit health check event
        this.emit('healthCheck', {
            timestamp: now,
            healthScore,
            errorRate,
            recentErrors,
            totalOperations,
            circuitBreakerStates: this.getCircuitBreakerStates(),
            isHealthy: healthScore > (1 - this.config.monitoring.degradationThreshold)
        });
    }

    /**
     * Clean up old error data
     */
    cleanupOldErrors() {
        const cutoffTime = Date.now() - this.config.monitoring.metricsRetention;
        
        // Clean up time window data
        for (const [timeWindow, count] of Object.entries(this.errorStats.errorsByTimeWindow)) {
            const windowTime = this.parseTimeWindow(timeWindow);
            if (windowTime < cutoffTime) {
                delete this.errorStats.errorsByTimeWindow[timeWindow];
            }
        }
    }

    /**
     * Parse time window string back to timestamp
     */
    parseTimeWindow(timeWindow) {
        const [year, month, day, hour] = timeWindow.split('-').map(Number);
        return new Date(year, month, day, hour).getTime();
    }

    /**
     * Get circuit breaker states
     */
    getCircuitBreakerStates() {
        const states = {};
        
        for (const [marketplace, breaker] of this.circuitBreakers.entries()) {
            states[marketplace] = {
                state: breaker.state,
                failureCount: breaker.failureCount,
                lastFailureTime: breaker.lastFailureTime,
                nextAttemptTime: breaker.nextAttemptTime
            };
        }
        
        return states;
    }

    /**
     * Get error summary
     */
    getErrorSummary() {
        const uptime = Date.now() - this.errorStats.startTime;
        
        return {
            totalErrors: this.errorStats.totalErrors,
            errorRate: this.errorStats.errorRate,
            consecutiveErrors: this.errorStats.consecutiveErrors,
            criticalErrors: this.errorStats.criticalErrors,
            recoveredErrors: this.errorStats.recoveredErrors,
            uptime: uptime,
            errorsByType: this.errorStats.errorsByType,
            errorsByMarketplace: this.errorStats.errorsByMarketplace,
            lastErrorTime: this.errorStats.lastErrorTime,
            circuitBreakerStates: this.getCircuitBreakerStates()
        };
    }

    /**
     * Get detailed error statistics
     */
    getDetailedStats() {
        const summary = this.getErrorSummary();
        
        return {
            ...summary,
            retryQueues: this.getRetryQueueSizes(),
            errorPatterns: Object.keys(this.errorPatterns),
            configuration: {
                maxRetryAttempts: this.config.retry.maxAttempts,
                circuitBreakerEnabled: this.config.circuitBreaker.enabled,
                alertingEnabled: this.config.alerting.enabled,
                monitoringEnabled: this.config.monitoring.enabled
            }
        };
    }

    /**
     * Get retry queue sizes
     */
    getRetryQueueSizes() {
        const sizes = {};
        
        for (const [marketplace, queue] of this.retryQueues.entries()) {
            sizes[marketplace] = queue.length;
        }
        
        return sizes;
    }

    /**
     * Utility function for fibonacci sequence
     */
    fibonacci(n) {
        if (n <= 1) return n;
        return this.fibonacci(n - 1) + this.fibonacci(n - 2);
    }

    /**
     * Reset error statistics (for testing or maintenance)
     */
    resetStats() {
        this.errorStats = {
            totalErrors: 0,
            errorsByType: {},
            errorsByMarketplace: {},
            errorsByTimeWindow: {},
            recoveredErrors: 0,
            criticalErrors: 0,
            lastErrorTime: null,
            errorRate: 0,
            consecutiveErrors: 0,
            startTime: Date.now()
        };
        
        this.circuitBreakers.clear();
        this.retryQueues.clear();
        
        console.log('📊 Error handler statistics reset');
        this.emit('statsReset');
    }
}

module.exports = EnhancedErrorHandler; 