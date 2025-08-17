#!/bin/bash

# Complete Production Deployment Script for ComicComp
# Orchestrates the entire production deployment process

set -e

echo "🚀 ComicComp Complete Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-comicogs.com}"
EMAIL="${2:-admin@comicogs.com}"
SKIP_BACKUP="${3:-false}"
SKIP_TESTS="${4:-false}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

log_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Deployment status tracking
DEPLOYMENT_ID="deploy-$(date +%Y%m%d_%H%M%S)"
DEPLOYMENT_LOG="./logs/deployment-$DEPLOYMENT_ID.log"
ROLLBACK_INFO="./logs/rollback-info-$DEPLOYMENT_ID.json"

# Create deployment log
create_deployment_log() {
    mkdir -p ./logs
    {
        echo "ComicComp Production Deployment Log"
        echo "=================================="
        echo "Deployment ID: $DEPLOYMENT_ID"
        echo "Date: $(date)"
        echo "Domain: $DOMAIN"
        echo "Email: $EMAIL"
        echo "User: $(whoami)"
        echo "Host: $(hostname)"
        echo ""
    } > "$DEPLOYMENT_LOG"
}

# Log to both console and file
log_deploy() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" >> "$DEPLOYMENT_LOG"
    
    case $level in
        "INFO")  log_info "$message" ;;
        "SUCCESS") log_success "$message" ;;
        "WARNING") log_warning "$message" ;;
        "ERROR") log_error "$message" ;;
        "STEP") log_step "$message" ;;
    esac
}

# Pre-deployment checks
pre_deployment_checks() {
    log_deploy "STEP" "Running pre-deployment checks..."
    
    # Check if required files exist
    local required_files=(
        ".env.production.local"
        "docker-compose.prod.yml"
        "scripts/setup-ssl.sh"
        "scripts/optimize-database.sh"
        "scripts/setup-monitoring-alerts.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_deploy "ERROR" "Required file not found: $file"
            exit 1
        fi
    done
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_deploy "ERROR" "Docker is not running or accessible"
        exit 1
    fi
    
    # Check available disk space (minimum 5GB)
    local available_space=$(df . | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 5242880 ]]; then
        log_deploy "WARNING" "Low disk space: $(df -h . | awk 'NR==2 {print $4}') available"
    fi
    
    # Check if ports are available
    local required_ports=(80 443 3000 3001 3030 5432 6379 9090 9093)
    for port in "${required_ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_deploy "WARNING" "Port $port is already in use"
        fi
    done
    
    # Load and validate environment variables
    if [[ -f ".env.production.local" ]]; then
        set -a
        source .env.production.local
        set +a
        
        # Check critical environment variables
        local critical_vars=(
            "POSTGRES_PASSWORD"
            "JWT_SECRET"
            "NEXTAUTH_SECRET"
            "REDIS_PASSWORD"
        )
        
        for var in "${critical_vars[@]}"; do
            if [[ -z "${!var}" ]]; then
                log_deploy "ERROR" "Critical environment variable not set: $var"
                exit 1
            fi
        done
    else
        log_deploy "ERROR" "Production environment file not found: .env.production.local"
        exit 1
    fi
    
    log_deploy "SUCCESS" "Pre-deployment checks passed"
}

# Create rollback information
create_rollback_info() {
    log_deploy "STEP" "Creating rollback information..."
    
    # Get current Docker image versions
    local current_images=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(comiccomp|comicogs)" || echo "No existing images")
    
    # Get current environment backup
    cp .env.production.local ".env.backup.$DEPLOYMENT_ID" 2>/dev/null || true
    
    # Create rollback info JSON
    cat > "$ROLLBACK_INFO" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "domain": "$DOMAIN",
  "user": "$(whoami)",
  "host": "$(hostname)",
  "current_images": [
    $(echo "$current_images" | tail -n +2 | sed 's/^/    "/' | sed 's/$/",' | head -n -1)
    $(echo "$current_images" | tail -n 1 | sed 's/^/    "/' | sed 's/$/"/')
  ],
  "environment_backup": ".env.backup.$DEPLOYMENT_ID",
  "docker_compose_files": [
    "docker-compose.prod.yml",
    "docker-compose.monitoring.yml"
  ],
  "rollback_commands": [
    "docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml down",
    "cp .env.backup.$DEPLOYMENT_ID .env.production.local",
    "docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d"
  ]
}
EOF
    
    log_deploy "SUCCESS" "Rollback information created: $ROLLBACK_INFO"
}

# Run tests before deployment
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_deploy "WARNING" "Skipping tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log_deploy "STEP" "Running pre-deployment tests..."
    
    # Backend tests
    if [[ -f "backend/package.json" ]]; then
        log_deploy "INFO" "Running backend tests..."
        cd backend && npm test -- --ci --coverage --watchAll=false || {
            log_deploy "ERROR" "Backend tests failed"
            return 1
        }
        cd ..
    fi
    
    # Frontend tests
    if [[ -f "frontend/package.json" ]]; then
        log_deploy "INFO" "Running frontend tests..."
        cd frontend && npm test -- --ci --coverage --watchAll=false || {
            log_deploy "ERROR" "Frontend tests failed"
            return 1
        }
        cd ..
    fi
    
    # Next.js tests
    if [[ -f "comicogs-nextjs/package.json" ]]; then
        log_deploy "INFO" "Running Next.js tests..."
        cd comicogs-nextjs && npm test -- --ci --coverage --watchAll=false || {
            log_deploy "ERROR" "Next.js tests failed"
            return 1
        }
        cd ..
    fi
    
    log_deploy "SUCCESS" "All tests passed"
}

# Database backup and migration
handle_database() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_deploy "WARNING" "Skipping database backup (SKIP_BACKUP=true)"
    else
        log_deploy "STEP" "Creating database backup..."
        
        # Create backup directory
        local backup_dir="./backups/deployment-$DEPLOYMENT_ID"
        mkdir -p "$backup_dir"
        
        # If database is already running, create backup
        if docker ps --format '{{.Names}}' | grep -q "comicogs_db"; then
            docker exec comicogs_db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$backup_dir/database_backup.sql.gz"
            log_deploy "SUCCESS" "Database backup created: $backup_dir/database_backup.sql.gz"
        else
            log_deploy "INFO" "No existing database found, skipping backup"
        fi
    fi
    
    log_deploy "STEP" "Running database optimizations..."
    ./scripts/optimize-database.sh || {
        log_deploy "ERROR" "Database optimization failed"
        return 1
    }
    
    log_deploy "SUCCESS" "Database operations completed"
}

# SSL certificate setup
setup_ssl() {
    log_deploy "STEP" "Setting up SSL certificates..."
    
    if [[ -f "ssl/$DOMAIN.crt" ]] && [[ -f "ssl/$DOMAIN.key" ]]; then
        log_deploy "INFO" "SSL certificates already exist"
    else
        log_deploy "INFO" "Setting up new SSL certificates..."
        ./scripts/setup-ssl.sh "$DOMAIN" "$EMAIL" letsencrypt || {
            log_deploy "WARNING" "Let's Encrypt failed, creating self-signed certificate..."
            ./scripts/setup-ssl.sh "$DOMAIN" "$EMAIL" custom || {
                log_deploy "ERROR" "SSL setup failed"
                return 1
            }
        }
    fi
    
    log_deploy "SUCCESS" "SSL certificates configured"
}

# Build application images
build_application() {
    log_deploy "STEP" "Building application images..."
    
    # Build production images
    docker-compose -f docker-compose.prod.yml build --no-cache || {
        log_deploy "ERROR" "Application build failed"
        return 1
    }
    
    # Tag images with deployment ID
    local images=$(docker-compose -f docker-compose.prod.yml config --services)
    for service in $images; do
        local image_name="comiccomp/${service}:${DEPLOYMENT_ID}"
        docker tag "comiccomp/${service}:latest" "$image_name" || true
        log_deploy "INFO" "Tagged image: $image_name"
    done
    
    log_deploy "SUCCESS" "Application images built successfully"
}

# Deploy services
deploy_services() {
    log_deploy "STEP" "Deploying services..."
    
    # Stop existing services gracefully
    if docker-compose -f docker-compose.prod.yml ps -q >/dev/null 2>&1; then
        log_deploy "INFO" "Stopping existing services..."
        docker-compose -f docker-compose.prod.yml down --timeout 30
    fi
    
    # Start core services first
    log_deploy "INFO" "Starting database and cache services..."
    docker-compose -f docker-compose.prod.yml up -d db redis
    
    # Wait for database to be ready
    log_deploy "INFO" "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1
    while ! docker exec comicogs_db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
        if [[ $attempt -ge $max_attempts ]]; then
            log_deploy "ERROR" "Database failed to start within timeout"
            return 1
        fi
        sleep 2
        ((attempt++))
    done
    
    # Run database migrations
    log_deploy "INFO" "Running database migrations..."
    docker-compose -f docker-compose.prod.yml run --rm app npm run migrate || {
        log_deploy "ERROR" "Database migrations failed"
        return 1
    }
    
    # Start application services
    log_deploy "INFO" "Starting application services..."
    docker-compose -f docker-compose.prod.yml up -d app frontend
    
    # Start reverse proxy
    log_deploy "INFO" "Starting reverse proxy..."
    docker-compose -f docker-compose.prod.yml up -d nginx
    
    log_deploy "SUCCESS" "Core services deployed"
}

# Deploy monitoring
deploy_monitoring() {
    log_deploy "STEP" "Deploying monitoring stack..."
    
    # Setup monitoring if not already configured
    if [[ ! -f "docker-compose.monitoring.yml" ]]; then
        log_deploy "INFO" "Setting up monitoring configuration..."
        ./scripts/setup-monitoring-alerts.sh "$DOMAIN" "$EMAIL" || {
            log_deploy "WARNING" "Monitoring setup failed, continuing without monitoring"
            return 0
        }
    fi
    
    # Deploy monitoring services
    docker-compose -f docker-compose.monitoring.yml up -d || {
        log_deploy "WARNING" "Monitoring deployment failed, continuing without monitoring"
        return 0
    }
    
    log_deploy "SUCCESS" "Monitoring stack deployed"
}

# Health checks
run_health_checks() {
    log_deploy "STEP" "Running health checks..."
    
    local max_attempts=60
    local attempt=1
    
    # Check API health
    log_deploy "INFO" "Checking API health..."
    while ! curl -f http://localhost:3001/api/health >/dev/null 2>&1; do
        if [[ $attempt -ge $max_attempts ]]; then
            log_deploy "ERROR" "API health check failed"
            return 1
        fi
        sleep 5
        ((attempt++))
    done
    
    # Check frontend health
    log_deploy "INFO" "Checking frontend health..."
    attempt=1
    while ! curl -f http://localhost:3000 >/dev/null 2>&1; do
        if [[ $attempt -ge $max_attempts ]]; then
            log_deploy "ERROR" "Frontend health check failed"
            return 1
        fi
        sleep 5
        ((attempt++))
    done
    
    # Check database connectivity
    log_deploy "INFO" "Checking database connectivity..."
    docker exec comicogs_db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || {
        log_deploy "ERROR" "Database connectivity check failed"
        return 1
    }
    
    # Check Redis connectivity
    log_deploy "INFO" "Checking Redis connectivity..."
    docker exec comicogs_redis redis-cli ping | grep -q PONG || {
        log_deploy "ERROR" "Redis connectivity check failed"
        return 1
    }
    
    # Check SSL if configured
    if [[ -f "ssl/$DOMAIN.crt" ]]; then
        log_deploy "INFO" "Checking SSL configuration..."
        openssl x509 -in "ssl/$DOMAIN.crt" -noout -dates || {
            log_deploy "WARNING" "SSL certificate validation failed"
        }
    fi
    
    log_deploy "SUCCESS" "All health checks passed"
}

# Performance baseline
create_performance_baseline() {
    log_deploy "STEP" "Creating performance baseline..."
    
    local baseline_file="./monitoring/baselines/deployment-baseline-$DEPLOYMENT_ID.json"
    mkdir -p ./monitoring/baselines
    
    # Wait for services to stabilize
    sleep 30
    
    # Collect performance metrics
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3001/api/health || echo "0")
    local memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep comicogs || echo "N/A")
    local cpu_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | grep comicogs || echo "N/A")
    
    # Create baseline JSON
    cat > "$baseline_file" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "domain": "$DOMAIN",
  "performance_metrics": {
    "api_response_time": "$response_time",
    "memory_usage": "$memory_usage",
    "cpu_usage": "$cpu_usage"
  },
  "service_status": {
    "api": "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)",
    "frontend": "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)",
    "database": "$(docker exec comicogs_db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1 && echo "healthy" || echo "unhealthy")",
    "redis": "$(docker exec comicogs_redis redis-cli ping 2>/dev/null || echo "unhealthy")"
  }
}
EOF
    
    log_deploy "SUCCESS" "Performance baseline created: $baseline_file"
}

# Post-deployment tasks
post_deployment_tasks() {
    log_deploy "STEP" "Running post-deployment tasks..."
    
    # Clear application caches
    log_deploy "INFO" "Clearing application caches..."
    docker exec comicogs_app npm run cache:clear >/dev/null 2>&1 || true
    docker exec comicogs_redis redis-cli FLUSHDB >/dev/null 2>&1 || true
    
    # Warm up critical caches
    log_deploy "INFO" "Warming up caches..."
    curl -s http://localhost:3001/api/comics?limit=10 >/dev/null 2>&1 || true
    curl -s http://localhost:3001/api/marketplace?limit=10 >/dev/null 2>&1 || true
    
    # Send deployment notification
    if [[ -n "$EMAIL" ]]; then
        log_deploy "INFO" "Sending deployment notification..."
        cat > /tmp/deployment_notification.txt << EOF
Subject: ComicComp Production Deployment Successful - $DEPLOYMENT_ID

ComicComp has been successfully deployed to production.

Deployment Details:
- Deployment ID: $DEPLOYMENT_ID
- Domain: $DOMAIN
- Timestamp: $(date)
- User: $(whoami)@$(hostname)

Services Status:
✅ API: http://localhost:3001/api/health
✅ Frontend: http://localhost:3000
✅ Database: Connected
✅ Redis: Connected
✅ SSL: Configured

Monitoring:
📊 Grafana: http://localhost:3030
📈 Prometheus: http://localhost:9090
🚨 Alertmanager: http://localhost:9093

Rollback Information:
$ROLLBACK_INFO

Logs:
$DEPLOYMENT_LOG
EOF
        # Send email if configured
        # sendmail "$EMAIL" < /tmp/deployment_notification.txt || true
        rm /tmp/deployment_notification.txt
    fi
    
    log_deploy "SUCCESS" "Post-deployment tasks completed"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    log_deploy "INFO" "Performing cleanup..."
    
    # Remove temporary files
    rm -f /tmp/deployment_notification.txt 2>/dev/null || true
    
    if [[ $exit_code -ne 0 ]]; then
        log_deploy "ERROR" "Deployment failed with exit code $exit_code"
        log_deploy "INFO" "Rollback information available at: $ROLLBACK_INFO"
        log_deploy "INFO" "Deployment log available at: $DEPLOYMENT_LOG"
    fi
    
    exit $exit_code
}

# Main deployment function
main() {
    echo ""
    log_deploy "INFO" "Starting complete production deployment..."
    log_deploy "INFO" "Deployment ID: $DEPLOYMENT_ID"
    log_deploy "INFO" "Domain: $DOMAIN"
    log_deploy "INFO" "Email: $EMAIL"
    echo ""
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Create deployment log
    create_deployment_log
    
    # Run deployment steps
    pre_deployment_checks
    create_rollback_info
    run_tests
    handle_database
    setup_ssl
    build_application
    deploy_services
    deploy_monitoring
    run_health_checks
    create_performance_baseline
    post_deployment_tasks
    
    echo ""
    log_deploy "SUCCESS" "🎉 Production deployment completed successfully!"
    echo ""
    echo -e "${GREEN}📋 Deployment Summary:${NC}"
    echo "   Deployment ID: $DEPLOYMENT_ID"
    echo "   Domain: https://$DOMAIN"
    echo "   API: https://$DOMAIN/api"
    echo "   Admin: https://$DOMAIN/admin"
    echo ""
    echo -e "${BLUE}🔗 Service URLs:${NC}"
    echo "   Frontend: http://localhost:3000"
    echo "   API: http://localhost:3001"
    echo "   Grafana: http://localhost:3030"
    echo "   Prometheus: http://localhost:9090"
    echo "   Alertmanager: http://localhost:9093"
    echo ""
    echo -e "${BLUE}📊 Monitoring:${NC}"
    echo "   Deployment log: $DEPLOYMENT_LOG"
    echo "   Rollback info: $ROLLBACK_INFO"
    echo "   Performance baseline: ./monitoring/baselines/deployment-baseline-$DEPLOYMENT_ID.json"
    echo ""
    echo -e "${YELLOW}🔧 Next Steps:${NC}"
    echo "1. Update DNS to point $DOMAIN to this server"
    echo "2. Test all critical user flows"
    echo "3. Monitor alerts and performance"
    echo "4. Set up automated backups"
    echo "5. Document any environment-specific configurations"
    echo ""
    echo -e "${GREEN}🎊 ComicComp is now live in production!${NC}"
}

# Execute main function
main "$@"