#!/bin/bash

# Production Rollback Script for ComicComp
# Safely rollback to previous deployment state

set -e

echo "🔄 ComicComp Production Rollback"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROLLBACK_INFO_FILE="${1:-}"
FORCE_ROLLBACK="${2:-false}"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Find latest rollback info if not specified
find_rollback_info() {
    if [[ -z "$ROLLBACK_INFO_FILE" ]]; then
        log_info "Searching for latest rollback information..."
        
        ROLLBACK_INFO_FILE=$(ls -t ./logs/rollback-info-*.json 2>/dev/null | head -1)
        
        if [[ -z "$ROLLBACK_INFO_FILE" ]]; then
            log_error "No rollback information found"
            echo "Available rollback files:"
            ls -la ./logs/rollback-info-*.json 2>/dev/null || echo "None found"
            exit 1
        fi
        
        log_info "Using rollback file: $ROLLBACK_INFO_FILE"
    fi
    
    if [[ ! -f "$ROLLBACK_INFO_FILE" ]]; then
        log_error "Rollback file not found: $ROLLBACK_INFO_FILE"
        exit 1
    fi
}

# Parse rollback information
parse_rollback_info() {
    log_info "Parsing rollback information..."
    
    # Extract information from JSON file
    DEPLOYMENT_ID=$(grep '"deployment_id"' "$ROLLBACK_INFO_FILE" | cut -d'"' -f4)
    TIMESTAMP=$(grep '"timestamp"' "$ROLLBACK_INFO_FILE" | cut -d'"' -f4)
    DOMAIN=$(grep '"domain"' "$ROLLBACK_INFO_FILE" | cut -d'"' -f4)
    ENV_BACKUP=$(grep '"environment_backup"' "$ROLLBACK_INFO_FILE" | cut -d'"' -f4)
    
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Domain: $DOMAIN"
    log_info "Environment backup: $ENV_BACKUP"
}

# Confirmation prompt
confirm_rollback() {
    if [[ "$FORCE_ROLLBACK" == "true" ]]; then
        log_warning "Force rollback enabled, skipping confirmation"
        return 0
    fi
    
    echo ""
    log_warning "⚠️  WARNING: This will rollback the current production deployment"
    echo ""
    echo "Rollback Details:"
    echo "  Deployment ID: $DEPLOYMENT_ID"
    echo "  Original Deploy Time: $TIMESTAMP"
    echo "  Domain: $DOMAIN"
    echo ""
    echo "This action will:"
    echo "  1. Stop current services"
    echo "  2. Restore previous environment configuration"
    echo "  3. Restore previous Docker images"
    echo "  4. Restart services with previous configuration"
    echo ""
    echo -n "Are you sure you want to proceed? (y/N): "
    read -r confirmation
    
    if [[ "$confirmation" != "y" ]] && [[ "$confirmation" != "Y" ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
}

# Create rollback log
create_rollback_log() {
    local rollback_id="rollback-$(date +%Y%m%d_%H%M%S)"
    ROLLBACK_LOG="./logs/$rollback_id.log"
    
    mkdir -p ./logs
    {
        echo "ComicComp Production Rollback Log"
        echo "================================"
        echo "Rollback ID: $rollback_id"
        echo "Date: $(date)"
        echo "User: $(whoami)"
        echo "Host: $(hostname)"
        echo "Original Deployment ID: $DEPLOYMENT_ID"
        echo "Rollback Source: $ROLLBACK_INFO_FILE"
        echo ""
    } > "$ROLLBACK_LOG"
    
    log_info "Rollback log created: $ROLLBACK_LOG"
}

# Pre-rollback backup
create_pre_rollback_backup() {
    log_info "Creating pre-rollback backup..."
    
    local backup_dir="./backups/pre-rollback-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup current environment
    cp .env.production.local "$backup_dir/" 2>/dev/null || true
    
    # Backup current database
    if docker ps --format '{{.Names}}' | grep -q "comicogs_db"; then
        log_info "Backing up current database..."
        docker exec comicogs_db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$backup_dir/database_backup.sql.gz"
        log_success "Database backup created"
    fi
    
    # Create service status snapshot
    {
        echo "Services status before rollback:"
        docker-compose -f docker-compose.prod.yml ps
        echo ""
        echo "Docker images:"
        docker images | grep comiccomp
    } > "$backup_dir/service_status.txt"
    
    log_success "Pre-rollback backup created: $backup_dir"
}

# Stop current services
stop_services() {
    log_info "Stopping current services..."
    
    # Stop monitoring first to avoid false alerts
    if [[ -f "docker-compose.monitoring.yml" ]]; then
        docker-compose -f docker-compose.monitoring.yml down --timeout 30 || true
    fi
    
    # Stop main application services
    docker-compose -f docker-compose.prod.yml down --timeout 30 || true
    
    log_success "Services stopped"
}

# Restore environment
restore_environment() {
    log_info "Restoring environment configuration..."
    
    if [[ -f "$ENV_BACKUP" ]]; then
        cp "$ENV_BACKUP" .env.production.local
        log_success "Environment configuration restored from $ENV_BACKUP"
    else
        log_warning "Environment backup not found: $ENV_BACKUP"
        log_warning "Current environment will be used"
    fi
}

# Restore Docker images
restore_images() {
    log_info "Restoring Docker images..."
    
    # Extract image information from rollback file
    local images=$(grep -A 10 '"current_images"' "$ROLLBACK_INFO_FILE" | grep '"' | cut -d'"' -f2 | grep -v current_images)
    
    if [[ -z "$images" ]]; then
        log_warning "No previous images found in rollback info"
        return 0
    fi
    
    # Check if previous images are available
    local available_images=""
    while IFS= read -r image; do
        if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "$image"; then
            available_images="$available_images $image"
            log_info "Previous image available: $image"
        else
            log_warning "Previous image not available: $image"
        fi
    done <<< "$images"
    
    if [[ -n "$available_images" ]]; then
        # Retag previous images as latest
        for image in $available_images; do
            local repo=$(echo "$image" | cut -d':' -f1)
            docker tag "$image" "$repo:latest"
            log_info "Restored image: $image -> $repo:latest"
        done
        log_success "Docker images restored"
    else
        log_warning "No previous images available, current images will be used"
    fi
}

# Database rollback
rollback_database() {
    log_info "Checking database rollback requirements..."
    
    # Check if database backup exists for the target deployment
    local db_backup_dir="./backups/deployment-$DEPLOYMENT_ID"
    if [[ -f "$db_backup_dir/database_backup.sql.gz" ]]; then
        echo ""
        log_warning "Database backup found for deployment $DEPLOYMENT_ID"
        echo "Database backup: $db_backup_dir/database_backup.sql.gz"
        echo ""
        echo -n "Do you want to restore the database? (y/N): "
        read -r db_confirmation
        
        if [[ "$db_confirmation" == "y" ]] || [[ "$db_confirmation" == "Y" ]]; then
            log_info "Restoring database..."
            
            # Start database service
            docker-compose -f docker-compose.prod.yml up -d db
            
            # Wait for database to be ready
            local max_attempts=30
            local attempt=1
            while ! docker exec comicogs_db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
                if [[ $attempt -ge $max_attempts ]]; then
                    log_error "Database failed to start"
                    return 1
                fi
                sleep 2
                ((attempt++))
            done
            
            # Restore database
            log_info "Restoring database from backup..."
            zcat "$db_backup_dir/database_backup.sql.gz" | docker exec -i comicogs_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
            
            log_success "Database restored"
        else
            log_info "Database rollback skipped"
        fi
    else
        log_info "No database backup found for deployment $DEPLOYMENT_ID"
        log_info "Database will remain in current state"
    fi
}

# Start services
start_services() {
    log_info "Starting services with restored configuration..."
    
    # Load restored environment
    if [[ -f ".env.production.local" ]]; then
        set -a
        source .env.production.local
        set +a
    fi
    
    # Start core services
    log_info "Starting database and cache..."
    docker-compose -f docker-compose.prod.yml up -d db redis
    
    # Wait for database
    log_info "Waiting for database..."
    local max_attempts=30
    local attempt=1
    while ! docker exec comicogs_db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
        if [[ $attempt -ge $max_attempts ]]; then
            log_error "Database failed to start"
            return 1
        fi
        sleep 2
        ((attempt++))
    done
    
    # Start application services
    log_info "Starting application services..."
    docker-compose -f docker-compose.prod.yml up -d app frontend nginx
    
    # Start monitoring if available
    if [[ -f "docker-compose.monitoring.yml" ]]; then
        log_info "Starting monitoring services..."
        docker-compose -f docker-compose.monitoring.yml up -d || true
    fi
    
    log_success "Services started"
}

# Health checks after rollback
run_health_checks() {
    log_info "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    
    # Check API health
    log_info "Checking API health..."
    while ! curl -f http://localhost:3001/api/health >/dev/null 2>&1; do
        if [[ $attempt -ge $max_attempts ]]; then
            log_error "API health check failed"
            return 1
        fi
        sleep 5
        ((attempt++))
    done
    
    # Check frontend health
    log_info "Checking frontend health..."
    attempt=1
    while ! curl -f http://localhost:3000 >/dev/null 2>&1; do
        if [[ $attempt -ge $max_attempts ]]; then
            log_error "Frontend health check failed"
            return 1
        fi
        sleep 5
        ((attempt++))
    done
    
    log_success "Health checks passed"
}

# Post-rollback verification
post_rollback_verification() {
    log_info "Running post-rollback verification..."
    
    # Clear caches
    log_info "Clearing caches..."
    docker exec comicogs_redis redis-cli FLUSHDB >/dev/null 2>&1 || true
    
    # Test critical endpoints
    log_info "Testing critical endpoints..."
    local endpoints=(
        "http://localhost:3001/api/health"
        "http://localhost:3001/api/comics?limit=1"
        "http://localhost:3000"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "$endpoint" >/dev/null 2>&1; then
            log_success "✓ $endpoint"
        else
            log_warning "✗ $endpoint"
        fi
    done
    
    # Check service status
    log_info "Service status:"
    docker-compose -f docker-compose.prod.yml ps
    
    log_success "Post-rollback verification completed"
}

# Send notification
send_notification() {
    log_info "Sending rollback notification..."
    
    cat > /tmp/rollback_notification.txt << EOF
Subject: ComicComp Production Rollback Completed - $DEPLOYMENT_ID

ComicComp production has been rolled back.

Rollback Details:
- Original Deployment ID: $DEPLOYMENT_ID
- Rollback Time: $(date)
- User: $(whoami)@$(hostname)
- Domain: $DOMAIN

Services Status:
- API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
- Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
- Database: $(docker exec comicogs_db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1 && echo "healthy" || echo "unhealthy")

Rollback Log: $ROLLBACK_LOG

Please verify all systems are functioning correctly.
EOF
    
    # Clean up notification file
    rm /tmp/rollback_notification.txt
    
    log_success "Rollback notification prepared"
}

# Main rollback function
main() {
    echo ""
    log_info "Starting production rollback process..."
    
    # Find and parse rollback information
    find_rollback_info
    parse_rollback_info
    
    # Confirm rollback
    confirm_rollback
    
    # Create rollback log
    create_rollback_log
    
    # Execute rollback steps
    create_pre_rollback_backup
    stop_services
    restore_environment
    restore_images
    rollback_database
    start_services
    run_health_checks
    post_rollback_verification
    send_notification
    
    echo ""
    log_success "🎉 Rollback completed successfully!"
    echo ""
    echo -e "${GREEN}📋 Rollback Summary:${NC}"
    echo "   Original Deployment ID: $DEPLOYMENT_ID"
    echo "   Domain: $DOMAIN"
    echo "   Rollback Log: $ROLLBACK_LOG"
    echo ""
    echo -e "${BLUE}🔗 Service URLs:${NC}"
    echo "   Frontend: http://localhost:3000"
    echo "   API: http://localhost:3001"
    echo "   Grafana: http://localhost:3030"
    echo ""
    echo -e "${YELLOW}🔧 Next Steps:${NC}"
    echo "1. Verify all critical user flows"
    echo "2. Check monitoring dashboards"
    echo "3. Investigate root cause of original issue"
    echo "4. Plan next deployment with fixes"
    echo ""
    echo -e "${GREEN}✨ Production has been rolled back successfully!${NC}"
}

# Execute main function
main "$@"