#!/bin/bash
# Database Migration Runner for Comicogs Real-time Infrastructure
# Handles safe database migrations with backup and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
MIGRATIONS_DIR="$BACKEND_DIR/migrations"
BACKUP_DIR="/var/backups/comicogs/db"
LOG_FILE="/var/log/comicogs/migration.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
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

# Help function
show_help() {
    echo "Database Migration Runner for Comicogs"
    echo
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo
    echo "Commands:"
    echo "  migrate              Run all pending migrations"
    echo "  migrate-single FILE  Run a specific migration file"
    echo "  rollback NUMBER      Rollback last N migrations"
    echo "  status              Show migration status"
    echo "  backup              Create database backup"
    echo "  restore FILE        Restore database from backup"
    echo "  validate            Validate database schema"
    echo
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -v, --verbose       Enable verbose logging"
    echo "  -d, --dry-run       Show what would be done without executing"
    echo "  --backup-before     Create backup before running migrations"
    echo "  --force            Skip confirmation prompts"
    echo
    echo "Examples:"
    echo "  $0 migrate --backup-before"
    echo "  $0 rollback 1"
    echo "  $0 migrate-single 036_enhanced_realtime_features.sql"
    echo
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$BACKEND_DIR/package.json" ]]; then
        error "Backend directory not found. Run this script from the project root."
        exit 1
    fi
    
    # Check if migrations directory exists
    if [[ ! -d "$MIGRATIONS_DIR" ]]; then
        error "Migrations directory not found: $MIGRATIONS_DIR"
        exit 1
    fi
    
    # Check PostgreSQL connection
    if ! command -v psql &> /dev/null; then
        error "PostgreSQL client (psql) is not installed"
        exit 1
    fi
    
    # Test database connection
    if ! psql "${DATABASE_URL:-$DB_URL}" -c "SELECT 1;" &> /dev/null; then
        error "Cannot connect to database. Check DATABASE_URL environment variable."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create database backup
create_backup() {
    info "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/backup_${timestamp}.sql"
    
    # Create backup
    if pg_dump "${DATABASE_URL:-$DB_URL}" > "$backup_file"; then
        success "Database backup created: $backup_file"
        echo "$backup_file" > /tmp/latest_db_backup
        
        # Compress backup
        gzip "$backup_file"
        success "Backup compressed: ${backup_file}.gz"
        
        # Clean old backups (keep last 10)
        cd "$BACKUP_DIR"
        ls -t *.gz | tail -n +11 | xargs -r rm -f
        info "Old backups cleaned up"
        
        return 0
    else
        error "Database backup failed"
        return 1
    fi
}

# Create schema migrations table if it doesn't exist
ensure_migrations_table() {
    info "Ensuring schema_migrations table exists..."
    
    psql "${DATABASE_URL:-$DB_URL}" -c "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT NOW()
        );
    " &> /dev/null
    
    success "Schema migrations table ready"
}

# Get applied migrations
get_applied_migrations() {
    psql "${DATABASE_URL:-$DB_URL}" -t -c "SELECT version FROM schema_migrations ORDER BY version;" | tr -d ' '
}

# Get pending migrations
get_pending_migrations() {
    local applied_migrations=($(get_applied_migrations))
    local all_migrations=($(ls "$MIGRATIONS_DIR"/*.sql | sort | xargs -n1 basename))
    
    # Find migrations not in applied list
    local pending=()
    for migration in "${all_migrations[@]}"; do
        local migration_name="${migration%.*}"  # Remove .sql extension
        
        if [[ ! " ${applied_migrations[*]} " =~ " ${migration_name} " ]]; then
            pending+=("$migration")
        fi
    done
    
    echo "${pending[@]}"
}

# Apply a single migration
apply_migration() {
    local migration_file="$1"
    local migration_name="${migration_file%.*}"
    
    info "Applying migration: $migration_file"
    
    # Check if migration file exists
    local full_path="$MIGRATIONS_DIR/$migration_file"
    if [[ ! -f "$full_path" ]]; then
        error "Migration file not found: $full_path"
        return 1
    fi
    
    # Begin transaction
    psql "${DATABASE_URL:-$DB_URL}" -c "BEGIN;" &> /dev/null
    
    # Apply migration
    if psql "${DATABASE_URL:-$DB_URL}" -f "$full_path" -v ON_ERROR_STOP=1; then
        # Record migration
        psql "${DATABASE_URL:-$DB_URL}" -c "
            INSERT INTO schema_migrations (version) VALUES ('$migration_name');
        " &> /dev/null
        
        # Commit transaction
        psql "${DATABASE_URL:-$DB_URL}" -c "COMMIT;" &> /dev/null
        
        success "Migration applied successfully: $migration_file"
        return 0
    else
        # Rollback on error
        psql "${DATABASE_URL:-$DB_URL}" -c "ROLLBACK;" &> /dev/null
        error "Migration failed: $migration_file"
        return 1
    fi
}

# Run all pending migrations
run_migrations() {
    info "Running database migrations..."
    
    local pending_migrations=($(get_pending_migrations))
    
    if [[ ${#pending_migrations[@]} -eq 0 ]]; then
        info "No pending migrations found"
        return 0
    fi
    
    info "Found ${#pending_migrations[@]} pending migration(s):"
    for migration in "${pending_migrations[@]}"; do
        info "  - $migration"
    done
    
    if [[ "${FORCE:-false}" != "true" ]]; then
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Migration cancelled by user"
            return 0
        fi
    fi
    
    # Apply migrations one by one
    local successful=0
    for migration in "${pending_migrations[@]}"; do
        if apply_migration "$migration"; then
            ((successful++))
        else
            error "Migration failed, stopping process"
            return 1
        fi
    done
    
    success "Successfully applied $successful migration(s)"
    return 0
}

# Rollback migrations
rollback_migrations() {
    local count=$1
    
    if [[ ! "$count" =~ ^[0-9]+$ ]] || [[ "$count" -le 0 ]]; then
        error "Invalid rollback count: $count"
        return 1
    fi
    
    warning "Rolling back last $count migration(s)..."
    
    # Get last N applied migrations
    local migrations_to_rollback=($(psql "${DATABASE_URL:-$DB_URL}" -t -c "
        SELECT version FROM schema_migrations 
        ORDER BY applied_at DESC 
        LIMIT $count;
    " | tr -d ' '))
    
    if [[ ${#migrations_to_rollback[@]} -eq 0 ]]; then
        warning "No migrations to rollback"
        return 0
    fi
    
    info "Migrations to rollback:"
    for migration in "${migrations_to_rollback[@]}"; do
        info "  - $migration"
    done
    
    if [[ "${FORCE:-false}" != "true" ]]; then
        read -p "This will PERMANENTLY remove data. Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Rollback cancelled by user"
            return 0
        fi
    fi
    
    # For each migration, try to find and execute rollback
    for migration in "${migrations_to_rollback[@]}"; do
        info "Rolling back migration: $migration"
        
        # Look for rollback file
        local rollback_file="$MIGRATIONS_DIR/rollback_${migration}.sql"
        
        if [[ -f "$rollback_file" ]]; then
            # Execute rollback script
            if psql "${DATABASE_URL:-$DB_URL}" -f "$rollback_file" -v ON_ERROR_STOP=1; then
                # Remove from migrations table
                psql "${DATABASE_URL:-$DB_URL}" -c "
                    DELETE FROM schema_migrations WHERE version = '$migration';
                " &> /dev/null
                success "Rollback completed: $migration"
            else
                error "Rollback failed: $migration"
                return 1
            fi
        else
            warning "No rollback script found for $migration, removing from migrations table only"
            psql "${DATABASE_URL:-$DB_URL}" -c "
                DELETE FROM schema_migrations WHERE version = '$migration';
            " &> /dev/null
        fi
    done
    
    success "Rollback completed for $count migration(s)"
}

# Show migration status
show_status() {
    info "Migration Status:"
    echo
    
    local applied_migrations=($(get_applied_migrations))
    local pending_migrations=($(get_pending_migrations))
    
    echo "Applied Migrations (${#applied_migrations[@]}):"
    if [[ ${#applied_migrations[@]} -gt 0 ]]; then
        for migration in "${applied_migrations[@]}"; do
            echo "  ✓ $migration"
        done
    else
        echo "  (none)"
    fi
    
    echo
    echo "Pending Migrations (${#pending_migrations[@]}):"
    if [[ ${#pending_migrations[@]} -gt 0 ]]; then
        for migration in "${pending_migrations[@]}"; do
            echo "  ⏳ $migration"
        done
    else
        echo "  (none)"
    fi
    
    echo
    
    # Show database info
    local db_size=$(psql "${DATABASE_URL:-$DB_URL}" -t -c "
        SELECT pg_size_pretty(pg_database_size(current_database()));
    " | tr -d ' ')
    
    echo "Database Size: $db_size"
    
    # Show table count
    local table_count=$(psql "${DATABASE_URL:-$DB_URL}" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public';
    " | tr -d ' ')
    
    echo "Tables: $table_count"
}

# Validate database schema
validate_schema() {
    info "Validating database schema..."
    
    # Check for required tables
    local required_tables=(
        "users" "comics" "notifications" "price_alerts"
        "auctions" "chat_messages" "connection_tracking"
    )
    
    local missing_tables=()
    for table in "${required_tables[@]}"; do
        local exists=$(psql "${DATABASE_URL:-$DB_URL}" -t -c "
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = '$table';
        " | tr -d ' ')
        
        if [[ "$exists" != "1" ]]; then
            missing_tables+=("$table")
        fi
    done
    
    if [[ ${#missing_tables[@]} -gt 0 ]]; then
        error "Missing required tables:"
        for table in "${missing_tables[@]}"; do
            echo "  - $table"
        done
        return 1
    fi
    
    # Check for indexes on critical columns
    info "Checking critical indexes..."
    
    local critical_indexes=(
        "idx_notifications_user_unread"
        "idx_chat_messages_room_id_sent_at"
        "idx_connection_tracking_user_id"
    )
    
    local missing_indexes=()
    for index in "${critical_indexes[@]}"; do
        local exists=$(psql "${DATABASE_URL:-$DB_URL}" -t -c "
            SELECT COUNT(*) FROM pg_indexes 
            WHERE indexname = '$index';
        " | tr -d ' ')
        
        if [[ "$exists" != "1" ]]; then
            missing_indexes+=("$index")
        fi
    done
    
    if [[ ${#missing_indexes[@]} -gt 0 ]]; then
        warning "Missing recommended indexes:"
        for index in "${missing_indexes[@]}"; do
            echo "  - $index"
        done
    fi
    
    success "Schema validation completed"
}

# Restore database from backup
restore_backup() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    warning "This will OVERWRITE the current database!"
    if [[ "${FORCE:-false}" != "true" ]]; then
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Restore cancelled by user"
            return 0
        fi
    fi
    
    info "Restoring database from: $backup_file"
    
    # If backup is gzipped, decompress it first
    local restore_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        restore_file="${backup_file%.*}"
        gunzip -c "$backup_file" > "$restore_file"
    fi
    
    # Restore database
    if psql "${DATABASE_URL:-$DB_URL}" -f "$restore_file"; then
        success "Database restored successfully"
        
        # Clean up temporary file if we decompressed
        if [[ "$backup_file" == *.gz ]]; then
            rm -f "$restore_file"
        fi
        
        return 0
    else
        error "Database restore failed"
        return 1
    fi
}

# Main function
main() {
    local command="migrate"
    local verbose=false
    local dry_run=false
    local backup_before=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            --backup-before)
                backup_before=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            migrate|migrate-single|rollback|status|backup|restore|validate)
                command=$1
                shift
                ;;
            *)
                break
                ;;
        esac
    done
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    info "Starting database migration tool..."
    info "Command: $command"
    
    # Load environment variables
    if [[ -f "$BACKEND_DIR/.env" ]]; then
        set -a
        source "$BACKEND_DIR/.env"
        set +a
    fi
    
    check_prerequisites
    ensure_migrations_table
    
    # Create backup if requested
    if [[ "$backup_before" == "true" ]]; then
        create_backup
    fi
    
    # Execute command
    case $command in
        migrate)
            run_migrations
            ;;
        migrate-single)
            if [[ -z "${1:-}" ]]; then
                error "Migration file required for migrate-single command"
                exit 1
            fi
            apply_migration "$1"
            ;;
        rollback)
            if [[ -z "${1:-}" ]]; then
                error "Count required for rollback command"
                exit 1
            fi
            rollback_migrations "$1"
            ;;
        status)
            show_status
            ;;
        backup)
            create_backup
            ;;
        restore)
            if [[ -z "${1:-}" ]]; then
                error "Backup file required for restore command"
                exit 1
            fi
            restore_backup "$1"
            ;;
        validate)
            validate_schema
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi