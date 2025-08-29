#!/bin/bash

##
# Comicogs Database Backup Script
# 
# Creates timestamped PostgreSQL backups and uploads to S3
# Usage: ./scripts/backup.sh [environment]
#
# Environment variables required:
# - DATABASE_URL: PostgreSQL connection string
# - AWS_ACCESS_KEY_ID: AWS access key
# - AWS_SECRET_ACCESS_KEY: AWS secret key  
# - BACKUP_S3_BUCKET: S3 bucket name (default: comicogs-backups)
# - BACKUP_RETENTION_DAYS: Days to keep backups (default: 90)
##

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-production}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/comicogs_backups"
BACKUP_FILENAME="comicogs_${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
S3_BUCKET="${BACKUP_S3_BUCKET:-comicogs-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-90}"

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
    
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client tools."
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
    
    log_success "All dependencies satisfied"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
}

# Perform database backup
perform_backup() {
    log_info "Starting database backup..."
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Backup file: ${BACKUP_FILENAME}"
    
    # Extract database info from DATABASE_URL
    DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Set password for pg_dump
    export PGPASSWORD="${DB_PASS}"
    
    # Perform backup with compression
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
        --file="${BACKUP_PATH}"
    
    # Unset password
    unset PGPASSWORD
    
    # Check backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
    log_success "Database backup completed. Size: ${BACKUP_SIZE}"
}

# Upload to S3
upload_to_s3() {
    log_info "Uploading backup to S3..."
    log_info "Bucket: s3://${S3_BUCKET}/${ENVIRONMENT}/"
    
    # Upload with metadata
    aws s3 cp "${BACKUP_PATH}" "s3://${S3_BUCKET}/${ENVIRONMENT}/" \
        --metadata "environment=${ENVIRONMENT},timestamp=${TIMESTAMP},retention-days=${RETENTION_DAYS}" \
        --storage-class STANDARD_IA
    
    log_success "Backup uploaded to S3: s3://${S3_BUCKET}/${ENVIRONMENT}/${BACKUP_FILENAME}"
}

# Clean up old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    # Calculate cutoff date
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        CUTOFF_DATE=$(date -j -v-${RETENTION_DAYS}d +"%Y-%m-%d")
    else
        # Linux
        CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +"%Y-%m-%d")
    fi
    
    # List and delete old backups
    aws s3api list-objects-v2 \
        --bucket "${S3_BUCKET}" \
        --prefix "${ENVIRONMENT}/" \
        --query "Contents[?LastModified<=\`${CUTOFF_DATE}\`].[Key]" \
        --output text | while read -r key; do
            if [ -n "$key" ]; then
                log_info "Deleting old backup: $key"
                aws s3 rm "s3://${S3_BUCKET}/$key"
            fi
        done
    
    log_success "Cleanup completed"
}

# Cleanup local files
cleanup_local() {
    log_info "Cleaning up local backup file..."
    rm -f "${BACKUP_PATH}"
    log_success "Local cleanup completed"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."
    
    # Test backup file
    if pg_restore --list "${BACKUP_PATH}" > /dev/null 2>&1; then
        log_success "Backup integrity verified"
    else
        log_error "Backup integrity check failed!"
        exit 1
    fi
}

# Send notification (placeholder for future Slack/email integration)
send_notification() {
    local status=$1
    local message=$2
    
    log_info "Notification: ${status} - ${message}"
    
    # TODO: Implement Slack/email notifications
    # if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"Backup ${status}: ${message}\"}" \
    #         "${SLACK_WEBHOOK_URL}"
    # fi
}

# Main execution
main() {
    log_info "🗄️  Starting Comicogs database backup process..."
    
    # Trap errors and cleanup
    trap 'log_error "Backup failed!"; cleanup_local; send_notification "FAILED" "Backup process failed"; exit 1' ERR
    
    check_dependencies
    create_backup_dir
    perform_backup
    verify_backup
    upload_to_s3
    cleanup_old_backups
    cleanup_local
    
    log_success "🎉 Backup process completed successfully!"
    send_notification "SUCCESS" "Backup completed: ${BACKUP_FILENAME}"
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
