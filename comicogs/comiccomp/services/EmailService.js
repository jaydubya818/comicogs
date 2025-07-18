/**
 * EmailService.js
 * Email notification service
 * 
 * Handles:
 * - Email template management
 * - Email delivery with multiple providers
 * - Unsubscribe link generation
 * - Email tracking and analytics
 * - Fallback and retry mechanisms
 */

class EmailService {
    constructor(dependencies = {}) {
        this.emailProvider = dependencies.emailProvider; // SendGrid, AWS SES, etc.
        this.templateEngine = dependencies.templateEngine;
        this.userPreferences = dependencies.userPreferences;
        
        // Email configuration
        this.config = {
            from: {
                name: 'ComicComp Notifications',
                email: 'notifications@comiccomp.com'
            },
            replyTo: 'noreply@comiccomp.com',
            maxRetries: 3,
            retryDelay: 5000 // 5 seconds
        };
        
        // Email templates
        this.templates = {
            price_alert: {
                subject: 'Price Alert: {{comicTitle}} - {{changeType}}',
                template: 'price-alert'
            },
            recommendation: {
                subject: 'New Recommendation: {{action}} - {{comicTitle}}',
                template: 'recommendation'
            },
            market_movement: {
                subject: 'Market Alert: {{comicTitle}} - {{movementType}}',
                template: 'market-movement'
            },
            collection_update: {
                subject: 'Collection Update: {{updateType}}',
                template: 'collection-update'
            },
            system_alert: {
                subject: 'ComicComp System Alert',
                template: 'system-alert'
            }
        };
        
        // Email tracking
        this.isInitialized = false;
        this.metrics = {
            sent: 0,
            failed: 0,
            bounced: 0,
            opened: 0,
            clicked: 0,
            unsubscribed: 0
        };
    }
    
    /**
     * Initialize the email service
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing EmailService...');
            
            // Initialize email provider
            if (this.emailProvider && typeof this.emailProvider.initialize === 'function') {
                await this.emailProvider.initialize();
            }
            
            // Load email templates
            await this.loadTemplates();
            
            this.isInitialized = true;
            console.log('EmailService initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize EmailService:', error);
            throw error;
        }
    }
    
    /**
     * Send notification email
     */
    async sendNotification(userId, notification) {
        try {
            console.log(`Sending email notification to user ${userId}: ${notification.title}`);
            
            // Get user email preferences
            const userEmail = await this.getUserEmail(userId);
            if (!userEmail) {
                return { success: false, error: 'User email not found' };
            }
            
            // Check if user has unsubscribed from this type
            const preferences = await this.getUserPreferences(userId);
            if (!this.shouldSendEmail(notification.type, preferences)) {
                return { success: false, error: 'User has unsubscribed from this notification type' };
            }
            
            // Prepare email content
            const emailContent = await this.prepareEmailContent(userId, notification);
            
            // Send email with retry logic
            const result = await this.sendWithRetry(userEmail, emailContent);
            
            // Update metrics
            if (result.success) {
                this.metrics.sent++;
            } else {
                this.metrics.failed++;
            }
            
            return result;
            
        } catch (error) {
            console.error('Error sending email notification:', error);
            this.metrics.failed++;
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Prepare email content from notification
     */
    async prepareEmailContent(userId, notification) {
        try {
            const template = this.templates[notification.type] || this.templates.system_alert;
            
            // Prepare template variables
            const variables = {
                ...notification.data,
                title: notification.title,
                message: notification.message,
                timestamp: new Date(notification.timestamp).toLocaleString(),
                priority: this.getPriorityText(notification.priority),
                unsubscribeUrl: await this.generateUnsubscribeUrl(userId, notification.type),
                managePreferencesUrl: await this.generatePreferencesUrl(userId),
                comicCompUrl: 'https://comiccomp.com'
            };
            
            // Generate subject and HTML content
            const subject = this.renderTemplate(template.subject, variables);
            const htmlContent = await this.renderEmailTemplate(template.template, variables);
            const textContent = this.generateTextContent(notification, variables);
            
            return {
                subject,
                htmlContent,
                textContent,
                variables
            };
            
        } catch (error) {
            console.error('Error preparing email content:', error);
            throw error;
        }
    }
    
    /**
     * Send email with retry logic
     */
    async sendWithRetry(userEmail, emailContent) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const result = await this.sendEmail(userEmail, emailContent);
                
                if (result.success) {
                    return result;
                } else {
                    lastError = result.error;
                }
                
            } catch (error) {
                lastError = error;
                console.error(`Email send attempt ${attempt} failed:`, error.message);
            }
            
            // Wait before retry
            if (attempt < this.config.maxRetries) {
                await this.sleep(this.config.retryDelay * attempt);
            }
        }
        
        return { success: false, error: lastError?.message || 'All retry attempts failed' };
    }
    
    /**
     * Send email via provider
     */
    async sendEmail(userEmail, emailContent) {
        try {
            if (this.emailProvider) {
                // Use configured email provider
                return await this.emailProvider.send({
                    to: userEmail,
                    from: this.config.from,
                    replyTo: this.config.replyTo,
                    subject: emailContent.subject,
                    html: emailContent.htmlContent,
                    text: emailContent.textContent
                });
            } else {
                // Fallback simulation
                console.log(`Simulating email send to ${userEmail}:`);
                console.log(`Subject: ${emailContent.subject}`);
                console.log(`Content: ${emailContent.textContent.substring(0, 200)}...`);
                
                return { 
                    success: true, 
                    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2)}` 
                };
            }
            
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Render email template
     */
    async renderEmailTemplate(templateName, variables) {
        try {
            if (this.templateEngine) {
                return await this.templateEngine.render(templateName, variables);
            } else {
                // Fallback HTML template
                return this.generateFallbackHtml(templateName, variables);
            }
        } catch (error) {
            console.error('Error rendering email template:', error);
            return this.generateFallbackHtml(templateName, variables);
        }
    }
    
    /**
     * Generate fallback HTML content
     */
    generateFallbackHtml(templateName, variables) {
        const baseHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${variables.title || 'ComicComp Notification'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { padding: 15px; margin: 15px 0; border-radius: 5px; }
        .alert.high { background: #ffebee; border-left: 4px solid #f44336; }
        .alert.medium { background: #fff3e0; border-left: 4px solid #ff9800; }
        .alert.low { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .button { display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .unsubscribe { font-size: 11px; color: #999; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ComicComp</h1>
        <p>Live Comic Pricing Intelligence</p>
    </div>
    
    <div class="content">
        ${this.getTemplateContent(templateName, variables)}
    </div>
    
    <div class="footer">
        <p>This notification was sent because you subscribed to ComicComp alerts.</p>
        <div class="unsubscribe">
            <a href="${variables.unsubscribeUrl}">Unsubscribe from these notifications</a> | 
            <a href="${variables.managePreferencesUrl}">Manage your preferences</a>
        </div>
    </div>
</body>
</html>`;
        
        return baseHtml;
    }
    
    /**
     * Get template-specific content
     */
    getTemplateContent(templateName, variables) {
        switch (templateName) {
            case 'price-alert':
                return this.getPriceAlertContent(variables);
            case 'recommendation':
                return this.getRecommendationContent(variables);
            case 'market-movement':
                return this.getMarketMovementContent(variables);
            case 'collection-update':
                return this.getCollectionUpdateContent(variables);
            default:
                return this.getGenericContent(variables);
        }
    }
    
    /**
     * Price alert email content
     */
    getPriceAlertContent(variables) {
        const alertClass = variables.priority >= 3 ? 'high' : variables.priority === 2 ? 'medium' : 'low';
        
        return `
            <div class="alert ${alertClass}">
                <h2>${variables.title}</h2>
                <p><strong>${variables.comicTitle || 'Comic'}</strong></p>
                <p>${variables.message}</p>
                
                ${variables.currentPrice ? `
                    <p><strong>Current Price:</strong> $${variables.currentPrice}</p>
                ` : ''}
                
                ${variables.percentChange ? `
                    <p><strong>Price Change:</strong> ${variables.percentChange > 0 ? '+' : ''}${variables.percentChange.toFixed(1)}%</p>
                ` : ''}
                
                <a href="${variables.comicCompUrl}/comic/${variables.comicId}" class="button">View Comic Details</a>
            </div>
        `;
    }
    
    /**
     * Recommendation email content
     */
    getRecommendationContent(variables) {
        return `
            <div class="alert medium">
                <h2>${variables.title}</h2>
                <p><strong>${variables.comicTitle || 'Comic'}</strong></p>
                <p>${variables.message}</p>
                
                ${variables.action ? `
                    <p><strong>Recommended Action:</strong> ${variables.action}</p>
                ` : ''}
                
                ${variables.confidence ? `
                    <p><strong>Confidence:</strong> ${variables.confidence}%</p>
                ` : ''}
                
                <a href="${variables.comicCompUrl}/recommendations" class="button">View All Recommendations</a>
            </div>
        `;
    }
    
    /**
     * Market movement email content
     */
    getMarketMovementContent(variables) {
        return `
            <div class="alert high">
                <h2>${variables.title}</h2>
                <p>${variables.message}</p>
                
                ${variables.magnitude ? `
                    <p><strong>Movement Magnitude:</strong> ${variables.magnitude}%</p>
                ` : ''}
                
                <a href="${variables.comicCompUrl}/market" class="button">View Market Analysis</a>
            </div>
        `;
    }
    
    /**
     * Collection update email content
     */
    getCollectionUpdateContent(variables) {
        return `
            <div class="alert low">
                <h2>${variables.title}</h2>
                <p>${variables.message}</p>
                
                <a href="${variables.comicCompUrl}/collection" class="button">View Your Collection</a>
            </div>
        `;
    }
    
    /**
     * Generic notification content
     */
    getGenericContent(variables) {
        return `
            <div class="alert medium">
                <h2>${variables.title}</h2>
                <p>${variables.message}</p>
                
                <a href="${variables.comicCompUrl}" class="button">Visit ComicComp</a>
            </div>
        `;
    }
    
    /**
     * Generate text content for email
     */
    generateTextContent(notification, variables) {
        let text = `ComicComp Notification\n\n`;
        text += `${variables.title}\n\n`;
        text += `${variables.message}\n\n`;
        
        if (variables.comicTitle) {
            text += `Comic: ${variables.comicTitle}\n`;
        }
        
        if (variables.currentPrice) {
            text += `Current Price: $${variables.currentPrice}\n`;
        }
        
        if (variables.percentChange) {
            text += `Price Change: ${variables.percentChange > 0 ? '+' : ''}${variables.percentChange.toFixed(1)}%\n`;
        }
        
        text += `\nTime: ${variables.timestamp}\n\n`;
        text += `Visit ComicComp: ${variables.comicCompUrl}\n\n`;
        text += `To unsubscribe from these notifications, visit: ${variables.unsubscribeUrl}\n`;
        text += `To manage your preferences, visit: ${variables.managePreferencesUrl}`;
        
        return text;
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
     * Utility methods
     */
    async getUserEmail(userId) {
        // This would fetch user email from database
        // For now, simulate
        return `user${userId}@example.com`;
    }
    
    async getUserPreferences(userId) {
        try {
            if (this.userPreferences) {
                return await this.userPreferences.getPreferences(userId);
            } else {
                return { email: true }; // Default to allowing emails
            }
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return { email: true };
        }
    }
    
    shouldSendEmail(notificationType, preferences) {
        if (!preferences || !preferences.email) return false;
        
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
    
    getPriorityText(priority) {
        switch (priority) {
            case 4: return 'Urgent';
            case 3: return 'High';
            case 2: return 'Medium';
            case 1: return 'Low';
            default: return 'Normal';
        }
    }
    
    async generateUnsubscribeUrl(userId, notificationType) {
        // Generate unsubscribe token
        const token = `${userId}_${notificationType}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        return `https://comiccomp.com/unsubscribe?token=${token}`;
    }
    
    async generatePreferencesUrl(userId) {
        return `https://comiccomp.com/preferences?user=${userId}`;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async loadTemplates() {
        // This would load email templates from file system or database
        console.log('Loading email templates...');
    }
    
    /**
     * Handle email events (bounces, opens, clicks)
     */
    async handleEmailEvent(eventType, eventData) {
        try {
            switch (eventType) {
                case 'bounce':
                    this.metrics.bounced++;
                    break;
                case 'open':
                    this.metrics.opened++;
                    break;
                case 'click':
                    this.metrics.clicked++;
                    break;
                case 'unsubscribe':
                    this.metrics.unsubscribed++;
                    break;
            }
            
            console.log(`Email event: ${eventType}`, eventData);
            
        } catch (error) {
            console.error('Error handling email event:', error);
        }
    }
    
    /**
     * Get email metrics
     */
    getMetrics() {
        const total = this.metrics.sent + this.metrics.failed;
        
        return {
            ...this.metrics,
            successRate: total > 0 ? ((this.metrics.sent / total) * 100).toFixed(2) + '%' : '0%',
            openRate: this.metrics.sent > 0 ? ((this.metrics.opened / this.metrics.sent) * 100).toFixed(2) + '%' : '0%',
            clickRate: this.metrics.opened > 0 ? ((this.metrics.clicked / this.metrics.opened) * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            sent: 0,
            failed: 0,
            bounced: 0,
            opened: 0,
            clicked: 0,
            unsubscribed: 0
        };
    }
}

module.exports = EmailService; 