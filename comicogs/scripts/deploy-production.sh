#!/bin/bash
# Production Deployment Script for Comicogs Real-time Infrastructure
# This script handles safe production deployment with health checks and rollback capability

set -euo pipefail

# Configuration
DEPLOY_DIR="/var/www/comicogs"
BACKUP_DIR="/var/backups/comicogs"
LOG_FILE="/var/log/comicogs/deploy.log"
HEALTH_CHECK_URL="http://localhost:3001/api/health"
WEBSOCKET_HEALTH_URL="http://localhost:3002/health"
MAX_HEALTH_RETRIES=30
HEALTH_CHECK_INTERVAL=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "${RED}ERROR: $1${NC}"
}

success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

info() {
    log "${BLUE}INFO: $1${NC}"
}

# Check if running as deploy user
check_user() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Use the deploy user."
        exit 1
    fi
    
    if [[ $(whoami) != "deploy" ]]; then
        warning "Not running as deploy user. Current user: $(whoami)"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    info "Running pre-deployment checks..."
    
    # Check if required directories exist
    if [[ ! -d "$DEPLOY_DIR" ]]; then
        error "Deploy directory does not exist: $DEPLOY_DIR"
        exit 1
    fi
    
    # Check if PM2 is available
    if ! command -v pm2 &> /dev/null; then
        error "PM2 is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker is available for Redis
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if PostgreSQL is accessible
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        error "PostgreSQL is not accessible"
        exit 1
    fi
    
    # Check disk space (require at least 2GB free)
    available_space=$(df "$DEPLOY_DIR" | awk 'NR==2 {print $4}')
    required_space=2097152  # 2GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        error "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        exit 1
    fi
    
    success "Pre-deployment checks passed"
}

# Create deployment backup
create_backup() {
    info "Creating deployment backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$timestamp"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment
    if [[ -d "$DEPLOY_DIR" ]]; then
        cp -r "$DEPLOY_DIR" "$backup_path"
        success "Backup created at: $backup_path"
        echo "$backup_path" > /tmp/latest_backup_path
    else
        warning "No existing deployment to backup"
    fi
    
    # Clean old backups (keep last 5)
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    
    info "Old backups cleaned up"
}

# Stop services gracefully
stop_services() {
    info "Stopping services..."
    
    # Stop PM2 processes
    pm2 stop ecosystem.config.js || true
    pm2 delete all || true
    
    # Give services time to stop gracefully
    sleep 10
    
    success "Services stopped"
}

# Deploy application
deploy_application() {
    info "Deploying application..."
    
    cd "$DEPLOY_DIR"
    
    # Pull latest code
    git fetch origin
    git checkout main
    git pull origin main
    
    # Install dependencies
    cd backend
    npm ci --production
    
    # Run database migrations
    info "Running database migrations..."
    npm run migrate || {
        error "Database migration failed"
        return 1
    }
    
    success "Application deployed"
}

# Start Redis infrastructure
start_redis() {
    info "Starting Redis infrastructure..."
    
    cd "$DEPLOY_DIR"
    
    # Start Redis services
    docker-compose -f docker-compose.redis.yml up -d
    
    # Wait for Redis to be ready
    local retry_count=0
    while ! docker exec comicogs-redis-primary redis-cli -a "$REDIS_PASSWORD" ping &>/dev/null; do
        if [[ $retry_count -ge 30 ]]; then
            error "Redis failed to start within timeout"
            return 1
        fi
        sleep 2
        ((retry_count++))
    done
    
    success "Redis infrastructure started"
}

# Start application services
start_services() {
    info "Starting application services..."
    
    cd "$DEPLOY_DIR"
    
    # Start services with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    success "Application services started"
}

# Health check function
check_health() {
    local url=$1
    local service_name=$2
    local retry_count=0
    
    info "Checking health of $service_name..."
    
    while [[ $retry_count -lt $MAX_HEALTH_RETRIES ]]; do
        if curl -sf "$url" &>/dev/null; then
            success "$service_name is healthy"
            return 0
        fi
        
        ((retry_count++))
        info "Health check attempt $retry_count/$MAX_HEALTH_RETRIES for $service_name..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    error "$service_name health check failed after $MAX_HEALTH_RETRIES attempts"
    return 1
}

# Comprehensive health checks
run_health_checks() {
    info "Running comprehensive health checks..."
    
    # Check API server
    if ! check_health "$HEALTH_CHECK_URL" "API Server"; then
        return 1
    fi
    
    # Check WebSocket server
    if ! check_health "$WEBSOCKET_HEALTH_URL" "WebSocket Server"; then
        return 1
    fi
    
    # Check detailed health endpoint
    local detailed_health=$(curl -sf "$HEALTH_CHECK_URL/detailed" | jq -r '.status' 2>/dev/null || echo "unknown")
    if [[ "$detailed_health" != "healthy" ]]; then
        error "Detailed health check failed: $detailed_health"
        return 1
    fi
    
    # Check real-time features
    local realtime_status=$(curl -sf "$HEALTH_CHECK_URL/realtime" | jq -r '.enabled' 2>/dev/null || echo "false")
    if [[ "$realtime_status" != "true" ]]; then
        warning "Real-time features are not enabled"
    fi
    
    success "All health checks passed"
    return 0
}

# Rollback function
rollback() {
    error "Deployment failed. Starting rollback..."
    
    if [[ -f /tmp/latest_backup_path ]]; then
        local backup_path=$(cat /tmp/latest_backup_path)
        
        if [[ -d "$backup_path" ]]; then
            info "Rolling back to: $backup_path"
            
            # Stop current services
            pm2 stop all || true
            pm2 delete all || true
            
            # Restore backup
            rm -rf "$DEPLOY_DIR"
            cp -r "$backup_path" "$DEPLOY_DIR"
            
            # Start services from backup
            cd "$DEPLOY_DIR"
            pm2 start ecosystem.config.js --env production
            
            # Check if rollback was successful
            if check_health "$HEALTH_CHECK_URL" "API Server (Rollback)"; then
                success "Rollback completed successfully"
            else
                error "Rollback failed - manual intervention required"
                exit 1
            fi
        else
            error "Backup not found: $backup_path"
            exit 1
        fi
    else
        error "No backup available for rollback"
        exit 1
    fi
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="good"
        local emoji=":white_check_mark:"
        
        if [[ "$status" == "error" ]]; then
            color="danger"
            emoji=":x:"
        elif [[ "$status" == "warning" ]]; then
            color="warning"
            emoji=":warning:"
        fi
        
        local payload=$(cat <<EOF
{
    "text": "$emoji Comicogs Production Deployment",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {
                    "title": "Status",
                    "value": "$status",
                    "short": true
                },
                {
                    "title": "Server",
                    "value": "$(hostname)",
                    "short": true
                },
                {
                    "title": "Branch",
                    "value": "$(git branch --show-current)",
                    "short": true
                },
                {
                    "title": "Commit",
                    "value": "$(git log -1 --pretty=format:'%h - %s')",
                    "short": false
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK_URL" &>/dev/null || true
    fi
}

# Performance verification
verify_performance() {
    info "Running performance verification..."
    
    # Wait for system to stabilize
    sleep 30
    
    # Check response times
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$HEALTH_CHECK_URL")
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time_ms > 5000" | bc -l) )); then
        warning "API response time is high: ${response_time_ms}ms"
    else
        success "API response time is good: ${response_time_ms}ms"
    fi
    
    # Check memory usage
    local memory_usage=$(pm2 jlist | jq -r '.[0].monit.memory' 2>/dev/null || echo "0")
    local memory_mb=$((memory_usage / 1024 / 1024))
    
    if [[ $memory_mb -gt 1024 ]]; then
        warning "High memory usage detected: ${memory_mb}MB"
    else
        success "Memory usage is normal: ${memory_mb}MB"
    fi
    
    success "Performance verification completed"
}

# Main deployment function
main() {
    info "Starting production deployment at $(date)"
    
    # Set error handler for rollback
    trap 'rollback; send_notification "error" "Deployment failed and rolled back"; exit 1' ERR
    
    check_user
    pre_deployment_checks
    create_backup
    
    stop_services
    deploy_application
    
    start_redis
    start_services
    
    if run_health_checks; then
        verify_performance
        send_notification "success" "Deployment completed successfully"
        success "Production deployment completed successfully!"
    else
        error "Health checks failed"
        exit 1
    fi
    
    info "Deployment finished at $(date)"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Source environment variables
    if [[ -f "$DEPLOY_DIR/.env.production" ]]; then
        set -a
        source "$DEPLOY_DIR/.env.production"
        set +a
    fi
    
    main "$@"
fi