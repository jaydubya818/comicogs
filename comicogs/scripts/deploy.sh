#!/bin/bash

# Production Deployment Script for Comicogs
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_NAME="comicogs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/deploy_${TIMESTAMP}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker ps > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
    
    # Check environment file
    if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
        log_error "Environment file .env.${ENVIRONMENT} not found!"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose -f docker-compose.prod.yml ps db | grep -q "Up"; then
        log_info "Backing up database..."
        docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U comicogs comicogs > "${BACKUP_DIR}/database_backup.sql"
        log_success "Database backup created"
    else
        log_warning "Database not running, skipping database backup"
    fi
    
    # Backup volumes
    log_info "Backing up volumes..."
    docker run --rm -v comicogs_postgres_data:/data -v $(pwd)/${BACKUP_DIR}:/backup ubuntu:latest tar czf /backup/postgres_data.tar.gz -C /data .
    docker run --rm -v comicogs_redis_data:/data -v $(pwd)/${BACKUP_DIR}:/backup ubuntu:latest tar czf /backup/redis_data.tar.gz -C /data .
    
    log_success "Backup created at ${BACKUP_DIR}"
}

# Build images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -f Dockerfile.prod -t ${PROJECT_NAME}/backend:${TIMESTAMP} -t ${PROJECT_NAME}/backend:latest .
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -f frontend/Dockerfile.prod -t ${PROJECT_NAME}/frontend:${TIMESTAMP} -t ${PROJECT_NAME}/frontend:latest ./frontend
    
    log_success "Docker images built successfully"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run backend tests
    log_info "Running backend tests..."
    cd backend
    npm test
    cd ..
    
    # Run frontend tests
    log_info "Running frontend tests..."
    cd frontend
    npm test -- --watchAll=false
    cd ..
    
    log_success "All tests passed"
}

# Deploy services
deploy_services() {
    log_info "Deploying services to ${ENVIRONMENT}..."
    
    # Copy environment file
    cp ".env.${ENVIRONMENT}" .env
    
    # Pull latest images if not building locally
    if [[ "${BUILD_LOCALLY:-true}" != "true" ]]; then
        log_info "Pulling latest images..."
        docker-compose -f docker-compose.prod.yml pull
    fi
    
    # Deploy with zero-downtime strategy
    log_info "Deploying with rolling update..."
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    check_health
    
    log_success "Deployment completed successfully"
}

# Health check
check_health() {
    log_info "Performing health checks..."
    
    # Check backend health
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check database
    if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U comicogs > /dev/null 2>&1; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        return 1
    fi
    
    # Check Redis
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis health check passed"
    else
        log_error "Redis health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Database migration
run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f docker-compose.prod.yml exec -T app node run-migration.js
    
    log_success "Database migrations completed"
}

# Cleanup old images
cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove old images (keep last 3 versions)
    docker images ${PROJECT_NAME}/backend --format "table {{.Tag}}\t{{.ID}}" | grep -v latest | tail -n +4 | awk '{print $2}' | xargs -r docker rmi
    docker images ${PROJECT_NAME}/frontend --format "table {{.Tag}}\t{{.ID}}" | grep -v latest | tail -n +4 | awk '{print $2}' | xargs -r docker rmi
    
    # Clean up dangling images
    docker image prune -f
    
    log_success "Cleanup completed"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Restore database
        if [[ -f "${BACKUP_DIR}/database_backup.sql" ]]; then
            log_info "Restoring database..."
            docker-compose -f docker-compose.prod.yml exec -T db psql -U comicogs -d comicogs < "${BACKUP_DIR}/database_backup.sql"
        fi
        
        # Restore volumes
        log_info "Restoring volumes..."
        docker run --rm -v comicogs_postgres_data:/data -v $(pwd)/${BACKUP_DIR}:/backup ubuntu:latest tar xzf /backup/postgres_data.tar.gz -C /data
        docker run --rm -v comicogs_redis_data:/data -v $(pwd)/${BACKUP_DIR}:/backup ubuntu:latest tar xzf /backup/redis_data.tar.gz -C /data
        
        # Restart services
        docker-compose -f docker-compose.prod.yml restart
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

# Send notifications
send_notifications() {
    local status=$1
    local message=$2
    
    # Slack notification (if webhook is configured)
    if [[ -n "${SLACK_WEBHOOK_URL}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Comicogs ${ENVIRONMENT} deployment ${status}: ${message}\"}" \
            "${SLACK_WEBHOOK_URL}"
    fi
    
    # Discord notification (if webhook is configured)
    if [[ -n "${DISCORD_WEBHOOK_URL}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🚀 Comicogs ${ENVIRONMENT} deployment ${status}: ${message}\"}" \
            "${DISCORD_WEBHOOK_URL}"
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment to ${ENVIRONMENT} environment..."
    
    # Trap errors and rollback
    trap 'log_error "Deployment failed! Starting rollback..."; rollback; send_notifications "FAILED" "Deployment failed and rolled back"; exit 1' ERR
    
    # Pre-deployment steps
    check_prerequisites
    create_backup
    
    # Build and test
    if [[ "${BUILD_LOCALLY:-true}" == "true" ]]; then
        build_images
    fi
    
    if [[ "${RUN_TESTS:-true}" == "true" ]]; then
        run_tests
    fi
    
    # Deploy
    deploy_services
    run_migrations
    
    # Post-deployment
    cleanup_old_images
    
    # Success notification
    send_notifications "SUCCESS" "Deployment completed successfully"
    
    log_success "🎉 Deployment to ${ENVIRONMENT} completed successfully!"
    log_info "Backup created: ${BACKUP_DIR}"
    log_info "Access your application at:"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "  - Frontend: https://comicogs.com"
        log_info "  - API: https://api.comicogs.com"
        log_info "  - Admin: https://admin.comicogs.com"
    else
        log_info "  - Frontend: https://staging.comicogs.com"
        log_info "  - API: https://api-staging.comicogs.com"
        log_info "  - Admin: https://admin-staging.comicogs.com"
    fi
}

# Handle command line arguments
case "$1" in
    staging|production)
        main
        ;;
    rollback)
        if [[ -n "$2" ]]; then
            BACKUP_DIR="./backups/deploy_$2"
        else
            # Find most recent backup
            BACKUP_DIR=$(ls -td ./backups/deploy_* 2>/dev/null | head -1)
        fi
        rollback
        ;;
    health)
        check_health
        ;;
    cleanup)
        cleanup_old_images
        ;;
    *)
        echo "Usage: $0 {staging|production|rollback|health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  staging     - Deploy to staging environment"
        echo "  production  - Deploy to production environment"
        echo "  rollback    - Rollback to previous deployment"
        echo "  health      - Run health checks"
        echo "  cleanup     - Clean up old Docker images"
        echo ""
        echo "Environment Variables:"
        echo "  BUILD_LOCALLY - Set to 'false' to pull images instead of building (default: true)"
        echo "  RUN_TESTS     - Set to 'false' to skip tests (default: true)"
        echo "  SLACK_WEBHOOK_URL - Slack webhook for notifications"
        echo "  DISCORD_WEBHOOK_URL - Discord webhook for notifications"
        exit 1
        ;;
esac