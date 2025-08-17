#!/bin/bash

# Database Performance Optimization Script for ComicComp
# Applies production-ready optimizations and monitoring

set -e

echo "🗄️  ComicComp Database Performance Optimization"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="${1:-comicogs_db}"
DB_NAME="${2:-comicogs_prod}"
DB_USER="${3:-comicogs_user}"
BACKUP_DIR="./backups/optimization-$(date +%Y%m%d_%H%M%S)"

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

# Check if database is accessible
check_database() {
    log_info "Checking database connectivity..."
    
    if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log_success "Database is accessible"
        return 0
    else
        log_error "Cannot connect to database"
        return 1
    fi
}

# Create backup before optimization
create_backup() {
    log_info "Creating backup before optimization..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup schema
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --schema-only > "$BACKUP_DIR/schema_backup.sql"
    
    # Backup data (compressed)
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only | gzip > "$BACKUP_DIR/data_backup.sql.gz"
    
    # Backup globals
    docker exec "$DB_CONTAINER" pg_dumpall -U "$DB_USER" --globals-only > "$BACKUP_DIR/globals_backup.sql"
    
    log_success "Backup created in $BACKUP_DIR"
}

# Analyze current database performance
analyze_performance() {
    log_info "Analyzing current database performance..."
    
    # Get database size
    DB_SIZE=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    log_info "Database size: $DB_SIZE"
    
    # Get table sizes
    echo ""
    log_info "Table sizes:"
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
    LIMIT 10;"
    
    # Get index usage
    echo ""
    log_info "Index usage statistics:"
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        t.tablename,
        indexname,
        idx_scan as times_used,
        pg_size_pretty(pg_relation_size(indexrelname::regclass)) as size
    FROM pg_tables t
    LEFT JOIN pg_indexes i ON i.tablename = t.tablename
    LEFT JOIN pg_stat_user_indexes ui ON ui.indexrelname = i.indexname
    WHERE t.schemaname = 'public' AND indexname IS NOT NULL
    ORDER BY times_used DESC
    LIMIT 15;"
    
    # Check for unused indexes
    echo ""
    log_warning "Potentially unused indexes:"
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        indexname,
        tablename,
        pg_size_pretty(pg_relation_size(indexrelname::regclass)) as size
    FROM pg_indexes i
    LEFT JOIN pg_stat_user_indexes ui ON ui.indexrelname = i.indexname
    WHERE schemaname = 'public' 
    AND (idx_scan = 0 OR idx_scan IS NULL)
    ORDER BY pg_relation_size(indexrelname::regclass) DESC;"
}

# Install required extensions
install_extensions() {
    log_info "Installing required database extensions..."
    
    # Install pg_trgm for fuzzy matching
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    
    # Install pg_stat_statements for query analysis
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
    
    # Install uuid-ossp for UUID generation
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    
    log_success "Extensions installed"
}

# Apply performance optimizations
apply_optimizations() {
    log_info "Applying performance optimizations..."
    
    # Apply the optimization SQL file
    docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < ./backend/database/performance-optimizations.sql
    
    log_success "Performance optimizations applied"
}

# Update PostgreSQL configuration for production
optimize_postgresql_config() {
    log_info "Optimizing PostgreSQL configuration..."
    
    # Create optimized postgresql.conf
    cat > ./database/postgresql.conf << EOF
# PostgreSQL Configuration for ComicComp Production
# Optimized for performance and reliability

# Connection Settings
max_connections = 200
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB

# WAL Settings
wal_buffers = 16MB
checkpoint_completion_target = 0.7
checkpoint_timeout = 10min
max_wal_size = 2GB
min_wal_size = 1GB

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 2

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0

# Statement Statistics
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 20s
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

# Background Writer
bgwriter_delay = 200ms
bgwriter_lru_maxpages = 100
bgwriter_lru_multiplier = 2.0

# Checkpoint
checkpoint_warning = 30s
EOF
    
    log_success "PostgreSQL configuration optimized"
}

# Run VACUUM and ANALYZE
vacuum_analyze() {
    log_info "Running VACUUM and ANALYZE..."
    
    # Vacuum analyze all tables
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "VACUUM ANALYZE;"
    
    # Update table statistics
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT update_table_statistics();"
    
    log_success "VACUUM and ANALYZE completed"
}

# Set up automated maintenance
setup_maintenance() {
    log_info "Setting up automated maintenance..."
    
    # Create maintenance script
    cat > ./scripts/db-maintenance.sh << 'EOF'
#!/bin/bash
# Automated database maintenance script

DB_CONTAINER="comicogs_db"
DB_NAME="comicogs_prod"
DB_USER="comicogs_user"

echo "$(date): Starting database maintenance..."

# Run maintenance function
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT perform_maintenance();"

# Reindex if needed (weekly)
if [ "$(date +%u)" -eq 7 ]; then
    echo "$(date): Running weekly reindex..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "REINDEX DATABASE $DB_NAME;"
fi

echo "$(date): Database maintenance completed"
EOF
    
    chmod +x ./scripts/db-maintenance.sh
    
    # Create cron job template
    cat > ./scripts/crontab-template << EOF
# ComicComp Database Maintenance Cron Jobs
# Add these to your system crontab with: crontab -e

# Daily maintenance at 2 AM
0 2 * * * /path/to/comicogs/scripts/db-maintenance.sh >> /var/log/comicogs-maintenance.log 2>&1

# Weekly full backup at 3 AM on Sundays
0 3 * * 0 /path/to/comicogs/scripts/backup-database.sh >> /var/log/comicogs-backup.log 2>&1

# Monthly statistics update at 4 AM on the 1st
0 4 1 * * docker exec comicogs_db psql -U comicogs_user -d comicogs_prod -c "SELECT update_table_statistics();" >> /var/log/comicogs-stats.log 2>&1
EOF
    
    log_success "Automated maintenance scripts created"
}

# Monitor performance after optimization
monitor_performance() {
    log_info "Monitoring performance after optimization..."
    
    # Create monitoring script
    cat > ./scripts/monitor-performance.sh << 'EOF'
#!/bin/bash
# Database performance monitoring script

DB_CONTAINER="comicogs_db"
DB_NAME="comicogs_prod"
DB_USER="comicogs_user"

echo "=== Database Performance Report ===="
echo "Generated at: $(date)"
echo ""

# Connection stats
echo "=== Connection Statistics ==="
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity 
WHERE datname = '$DB_NAME'
GROUP BY state;"

echo ""

# Query performance
echo "=== Slow Queries (if pg_stat_statements is available) ==="
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 100
ORDER BY mean_time DESC 
LIMIT 10;" 2>/dev/null || echo "pg_stat_statements not available"

echo ""

# Cache hit ratio
echo "=== Cache Hit Ratio ==="
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Buffer Cache' as cache_type,
    ROUND(
        100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2
    ) as hit_ratio_percent
FROM pg_stat_database
WHERE datname = '$DB_NAME';"

echo ""

# Index usage
echo "=== Index Usage ==="
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT * FROM index_usage 
WHERE times_used > 0 
ORDER BY times_used DESC 
LIMIT 10;"

echo ""

# Table statistics
echo "=== Table Statistics ==="
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT * FROM performance_stats 
ORDER BY live_tuples DESC 
LIMIT 10;"
EOF
    
    chmod +x ./scripts/monitor-performance.sh
    
    # Run initial performance report
    ./scripts/monitor-performance.sh
    
    log_success "Performance monitoring set up"
}

# Create performance baseline
create_baseline() {
    log_info "Creating performance baseline..."
    
    mkdir -p ./monitoring/baselines
    
    # Create baseline report
    BASELINE_FILE="./monitoring/baselines/baseline-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "ComicComp Database Performance Baseline"
        echo "======================================"
        echo "Created: $(date)"
        echo ""
        
        echo "=== Database Configuration ==="
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SHOW ALL;" | grep -E "(shared_buffers|work_mem|effective_cache_size|max_connections)"
        
        echo ""
        echo "=== Database Size ==="
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"
        
        echo ""
        echo "=== Query Performance ==="
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            COUNT(*) as total_queries,
            AVG(total_time) as avg_total_time,
            AVG(mean_time) as avg_mean_time
        FROM pg_stat_statements;" 2>/dev/null || echo "pg_stat_statements not available"
        
    } > "$BASELINE_FILE"
    
    log_success "Baseline created: $BASELINE_FILE"
}

# Main execution
main() {
    echo ""
    log_info "Starting database optimization process..."
    
    # Check prerequisites
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed"
        exit 1
    fi
    
    # Check database connectivity
    if ! check_database; then
        log_error "Database check failed"
        exit 1
    fi
    
    # Create backup
    if [[ "${SKIP_BACKUP:-false}" != "true" ]]; then
        create_backup
    else
        log_warning "Skipping backup (SKIP_BACKUP=true)"
    fi
    
    # Analyze current performance
    analyze_performance
    
    # Install extensions
    install_extensions
    
    # Apply optimizations
    apply_optimizations
    
    # Optimize PostgreSQL configuration
    optimize_postgresql_config
    
    # Run vacuum and analyze
    vacuum_analyze
    
    # Set up maintenance
    setup_maintenance
    
    # Monitor performance
    monitor_performance
    
    # Create baseline
    create_baseline
    
    echo ""
    log_success "Database optimization completed successfully!"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "✅ Performance indexes created"
    echo "✅ Database extensions installed"
    echo "✅ PostgreSQL configuration optimized"
    echo "✅ Maintenance scripts created"
    echo "✅ Performance monitoring set up"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo "1. Review the performance baseline in ./monitoring/baselines/"
    echo "2. Set up cron jobs from ./scripts/crontab-template"
    echo "3. Monitor performance with ./scripts/monitor-performance.sh"
    echo "4. Restart database container to apply configuration changes:"
    echo "   docker-compose -f docker-compose.prod.yml restart db"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "- Monitor query performance after optimization"
    echo "- Adjust configuration based on actual usage patterns"
    echo "- Regular maintenance is crucial for optimal performance"
}

# Execute main function
main "$@"