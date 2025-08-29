#!/bin/bash

##
# Comicogs Database Restore Script
# 
# Restores PostgreSQL database from S3 backup
# Usage: ./scripts/restore.sh [backup_file] [target_environment]
#
# Environment variables required:
# - DATABASE_URL: Target PostgreSQL connection string
# - AWS_ACCESS_KEY_ID: AWS access key
# - AWS_SECRET_ACCESS_KEY: AWS secret key  
# - BACKUP_S3_BUCKET: S3 bucket name (default: comicogs-backups)
##

set -euo pipefail

# Configuration
BACKUP_FILE="${1:-latest}"
TARGET_ENV="${2:-staging}"
TEMP_DIR="/tmp/comicogs_restore"
S3_BUCKET="${BACKUP_S3_BUCKET:-comicogs-backups}"

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

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v pg_restore &> /dev/null; then
        log_error "pg_restore not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        log_error "psql not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi
    
    # Prevent accidental production restores
    if [[ "${DATABASE_URL}" == *"production"* ]] && [[ "${TARGET_ENV}" != "production" ]]; then
        log_error "Refusing to restore to production database. Set TARGET_ENV=production if intentional."
        exit 1
    fi
    
    log_success "All dependencies satisfied"
}

# Create temp directory
create_temp_dir() {
    log_info "Creating temporary directory: ${TEMP_DIR}"
    mkdir -p "${TEMP_DIR}"
}

# Find latest backup or specific file
find_backup_file() {
    local backup_path
    
    if [ "${BACKUP_FILE}" = "latest" ]; then
        log_info "Finding latest backup in S3..."
        
        # Find the most recent backup
        backup_path=$(aws s3 ls "s3://${S3_BUCKET}/production/" \
            | grep "\.sql$" \
            | sort -k1,2 \
            | tail -n1 \
            | awk '{print $4}')
        
        if [ -z "${backup_path}" ]; then
            log_error "No backup files found in s3://${S3_BUCKET}/production/"
            exit 1
        fi
        
        BACKUP_FILE="production/${backup_path}"
    else
        # Use specific backup file
        backup_path="${BACKUP_FILE}"
    fi
    
    log_info "Selected backup: ${backup_path}"
}

# Download backup from S3
download_backup() {
    local local_backup_path="${TEMP_DIR}/$(basename "${BACKUP_FILE}")"
    
    log_info "Downloading backup from S3..."
    log_info "Source: s3://${S3_BUCKET}/${BACKUP_FILE}"
    log_info "Local: ${local_backup_path}"
    
    aws s3 cp "s3://${S3_BUCKET}/${BACKUP_FILE}" "${local_backup_path}"
    
    # Verify download
    if [ ! -f "${local_backup_path}" ]; then
        log_error "Failed to download backup file"
        exit 1
    fi
    
    BACKUP_PATH="${local_backup_path}"
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
    log_success "Backup downloaded. Size: ${BACKUP_SIZE}"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."
    
    if pg_restore --list "${BACKUP_PATH}" > /dev/null 2>&1; then
        log_success "Backup integrity verified"
    else
        log_error "Backup integrity check failed!"
        exit 1
    fi
}

# Create database if it doesn't exist
ensure_database_exists() {
    log_info "Ensuring target database exists..."
    
    # Extract database info from DATABASE_URL
    DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Set password for psql
    export PGPASSWORD="${DB_PASS}"
    
    # Connect to postgres database to create target database
    POSTGRES_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres"
    
    # Create database if it doesn't exist
    psql "${POSTGRES_URL}" -c "CREATE DATABASE \"${DB_NAME}\";" 2>/dev/null || log_info "Database already exists"
    
    log_success "Database ready: ${DB_NAME}"
}

# Backup current database before restore
backup_current_database() {
    if [ "${TARGET_ENV}" != "staging" ]; then
        log_warning "Skipping current database backup for ${TARGET_ENV}"
        return 0
    fi
    
    log_info "Creating backup of current database before restore..."
    
    local current_backup_path="${TEMP_DIR}/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    pg_dump \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USER}" \
        --dbname="${DB_NAME}" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=custom \
        --compress=9 \
        --file="${current_backup_path}"
    
    log_success "Current database backed up to: ${current_backup_path}"
}

# Perform database restore
perform_restore() {
    log_info "Starting database restore..."
    log_warning "This will DROP and recreate the database: ${DB_NAME}"
    
    # Confirm for non-staging environments
    if [ "${TARGET_ENV}" != "staging" ]; then
        read -p "Are you sure you want to restore to ${TARGET_ENV}? (yes/no): " -r
        if [[ ! $REPLY =~ ^yes$ ]]; then
            log_error "Restore cancelled by user"
            exit 1
        fi
    fi
    
    # Drop existing connections
    log_info "Terminating existing database connections..."
    psql "postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres" \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
        || log_warning "Could not terminate all connections"
    
    # Drop and recreate database
    log_info "Dropping and recreating database..."
    psql "postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres" \
        -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" \
        -c "CREATE DATABASE \"${DB_NAME}\";"
    
    # Restore from backup
    log_info "Restoring database from backup..."
    pg_restore \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USER}" \
        --dbname="${DB_NAME}" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        "${BACKUP_PATH}"
    
    # Unset password
    unset PGPASSWORD
    
    log_success "Database restore completed!"
}

# Verify restore
verify_restore() {
    log_info "Verifying restore..."
    
    export PGPASSWORD="${DB_PASS}"
    
    # Count tables
    table_count=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    # Count total records (simple check)
    record_count=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM comics;" 2>/dev/null | xargs || echo "0")
    
    unset PGPASSWORD
    
    log_success "Verification complete:"
    log_success "  Tables: ${table_count}"
    log_success "  Comics: ${record_count}"
    
    if [ "${table_count}" -gt 0 ]; then
        log_success "Restore verification passed!"
    else
        log_error "Restore verification failed - no tables found"
        exit 1
    fi
}

# Cleanup temp files
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf "${TEMP_DIR}"
    log_success "Cleanup completed"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    log_info "Notification: ${status} - ${message}"
    
    # TODO: Implement Slack/email notifications
}

# Main execution
main() {
    log_info "🔄 Starting Comicogs database restore process..."
    log_info "Target environment: ${TARGET_ENV}"
    
    # Trap errors and cleanup
    trap 'log_error "Restore failed!"; cleanup; send_notification "FAILED" "Restore process failed"; exit 1' ERR
    trap 'cleanup' EXIT
    
    check_dependencies
    create_temp_dir
    find_backup_file
    download_backup
    verify_backup
    ensure_database_exists
    backup_current_database
    perform_restore
    verify_restore
    
    log_success "🎉 Database restore completed successfully!"
    send_notification "SUCCESS" "Database restore completed for ${TARGET_ENV}"
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
