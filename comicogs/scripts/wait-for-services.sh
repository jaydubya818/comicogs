#!/bin/bash

# Wait for Services Script - Comicogs Platform
# Waits for all required services to be healthy before running tests

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Configuration
MAX_WAIT_TIME=300  # 5 minutes
CHECK_INTERVAL=5   # 5 seconds

# Service configurations
declare -A SERVICES=(
    ["next-app"]="http://localhost:3000/api/health"
    ["postgres"]="postgres://localhost:5432"
    ["redis"]="redis://localhost:6379"
)

# Wait for HTTP service
wait_for_http() {
    local name=$1
    local url=$2
    local timeout=$3
    
    log_info "Waiting for $name at $url..."
    
    local count=0
    while [ $count -lt $timeout ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            log_success "$name is ready!"
            return 0
        fi
        
        sleep $CHECK_INTERVAL
        count=$((count + CHECK_INTERVAL))
        
        if [ $((count % 30)) -eq 0 ]; then
            log_info "Still waiting for $name... (${count}s elapsed)"
        fi
    done
    
    log_error "$name failed to start within ${timeout}s"
    return 1
}

# Wait for PostgreSQL
wait_for_postgres() {
    local name=$1
    local connection_string=$2
    local timeout=$3
    
    log_info "Waiting for $name..."
    
    # Extract connection details
    local host="localhost"
    local port="5432"
    local user="${POSTGRES_USER:-postgres}"
    local password="${POSTGRES_PASSWORD:-password}"
    local database="${POSTGRES_DB:-comicogs}"
    
    local count=0
    while [ $count -lt $timeout ]; do
        if command -v pg_isready >/dev/null 2>&1; then
            if pg_isready -h "$host" -p "$port" >/dev/null 2>&1; then
                log_success "$name is ready!"
                return 0
            fi
        else
            # Fallback: try to connect with psql if available
            if command -v psql >/dev/null 2>&1; then
                if PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" >/dev/null 2>&1; then
                    log_success "$name is ready!"
                    return 0
                fi
            else
                # Last resort: check if port is open
                if nc -z "$host" "$port" >/dev/null 2>&1; then
                    log_success "$name port is open (assuming ready)"
                    return 0
                fi
            fi
        fi
        
        sleep $CHECK_INTERVAL
        count=$((count + CHECK_INTERVAL))
        
        if [ $((count % 30)) -eq 0 ]; then
            log_info "Still waiting for $name... (${count}s elapsed)"
        fi
    done
    
    log_error "$name failed to start within ${timeout}s"
    return 1
}

# Wait for Redis
wait_for_redis() {
    local name=$1
    local connection_string=$2
    local timeout=$3
    
    log_info "Waiting for $name..."
    
    local host="localhost"
    local port="6379"
    
    local count=0
    while [ $count -lt $timeout ]; do
        if command -v redis-cli >/dev/null 2>&1; then
            if redis-cli -h "$host" -p "$port" ping >/dev/null 2>&1; then
                log_success "$name is ready!"
                return 0
            fi
        else
            # Fallback: check if port is open
            if nc -z "$host" "$port" >/dev/null 2>&1; then
                log_success "$name port is open (assuming ready)"
                return 0
            fi
        fi
        
        sleep $CHECK_INTERVAL
        count=$((count + CHECK_INTERVAL))
        
        if [ $((count % 30)) -eq 0 ]; then
            log_info "Still waiting for $name... (${count}s elapsed)"
        fi
    done
    
    log_error "$name failed to start within ${timeout}s"
    return 1
}

# Check if Docker services are running
check_docker_services() {
    log_info "Checking Docker services..."
    
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not found - skipping container checks"
        return 0
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_warning "Docker is not running - manual service startup required"
        return 0
    fi
    
    # List running containers related to Comicogs
    local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(comicogs|postgres|redis)" || true)
    
    if [ -n "$containers" ]; then
        log_info "Found running containers:"
        echo "$containers"
    else
        log_info "No Comicogs-related containers found running"
    fi
}

# Main waiting logic
wait_for_all_services() {
    log_info "🚀 Waiting for all Comicogs services to be ready..."
    
    local failed_services=()
    
    # Check Docker first
    check_docker_services
    
    # Wait for each service
    for service_name in "${!SERVICES[@]}"; do
        local service_url="${SERVICES[$service_name]}"
        
        case $service_name in
            "next-app")
                if ! wait_for_http "$service_name" "$service_url" $MAX_WAIT_TIME; then
                    failed_services+=("$service_name")
                fi
                ;;
            "postgres")
                if ! wait_for_postgres "$service_name" "$service_url" $MAX_WAIT_TIME; then
                    failed_services+=("$service_name")
                fi
                ;;
            "redis")
                if ! wait_for_redis "$service_name" "$service_url" $MAX_WAIT_TIME; then
                    failed_services+=("$service_name")
                fi
                ;;
            *)
                log_warning "Unknown service type: $service_name"
                ;;
        esac
    done
    
    # Report results
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "🎉 All services are ready!"
        return 0
    else
        log_error "💥 Failed services: ${failed_services[*]}"
        log_error "Please check the services and try again"
        return 1
    fi
}

# Health check for running services
health_check() {
    log_info "🏥 Running health checks..."
    
    # Check Next.js app health
    if curl -s -f "http://localhost:3000/api/health" >/dev/null 2>&1; then
        local health_response=$(curl -s "http://localhost:3000/api/health" 2>/dev/null || echo '{"status":"unknown"}')
        log_success "Next.js app: $health_response"
    else
        log_warning "Next.js app health check failed"
    fi
    
    # Check database connectivity (if Prisma is available)
    if command -v npx >/dev/null 2>&1 && [ -f "package.json" ]; then
        if npx prisma db pull --force >/dev/null 2>&1; then
            log_success "Database connection: OK"
        else
            log_warning "Database connection: Failed"
        fi
    fi
    
    # Check Redis connectivity
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli ping >/dev/null 2>&1; then
            log_success "Redis connection: OK"
        else
            log_warning "Redis connection: Failed"
        fi
    fi
}

# Usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -t, --timeout SEC   Set timeout in seconds (default: $MAX_WAIT_TIME)"
    echo "  -i, --interval SEC  Set check interval in seconds (default: $CHECK_INTERVAL)"
    echo "  --health            Run health checks on services"
    echo ""
    echo "Environment variables:"
    echo "  POSTGRES_USER       PostgreSQL username (default: postgres)"
    echo "  POSTGRES_PASSWORD   PostgreSQL password (default: password)"
    echo "  POSTGRES_DB         PostgreSQL database name (default: comicogs)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -t|--timeout)
            MAX_WAIT_TIME="$2"
            shift 2
            ;;
        -i|--interval)
            CHECK_INTERVAL="$2"
            shift 2
            ;;
        --health)
            health_check
            exit $?
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "🔍 Comicogs Service Readiness Check"
    log_info "Timeout: ${MAX_WAIT_TIME}s | Check interval: ${CHECK_INTERVAL}s"
    
    if wait_for_all_services; then
        health_check
        log_success "✅ All systems ready for testing!"
        exit 0
    else
        log_error "❌ Service readiness check failed"
        exit 1
    fi
}

# Run main function
main "$@"
