# Database Backup & Restore Guide

This document explains how to use the automated backup and restore system for Comicogs.

## Overview

The backup system creates nightly PostgreSQL dumps and stores them in S3-compatible object storage (like Cloudflare R2). The system supports:

- Automated nightly backups via GitHub Actions
- Manual backup creation
- Point-in-time restoration
- Configurable retention policies
- Slack/Discord notifications

## Setup

### 1. Environment Variables

Configure these environment variables for backup operations:

```bash
# Database connection
DATABASE_URL=postgresql://user:password@host:port/database

# Object storage (Cloudflare R2, AWS S3, or compatible)
BACKUP_BUCKET=comicogs-backups
BACKUP_REGION=auto
BACKUP_ACCESS_KEY_ID=your_access_key
BACKUP_SECRET_ACCESS_KEY=your_secret_key
BACKUP_ENDPOINT=https://accountid.r2.cloudflarestorage.com

# Optional settings
BACKUP_RETENTION_DAYS=30

# For notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

### 2. GitHub Secrets

For automated backups, add these secrets to your GitHub repository:

- `DATABASE_URL`
- `BACKUP_BUCKET`
- `BACKUP_REGION`
- `BACKUP_ACCESS_KEY_ID`
- `BACKUP_SECRET_ACCESS_KEY`
- `BACKUP_ENDPOINT`
- `BACKUP_RETENTION_DAYS` (optional, defaults to 30)
- `SLACK_WEBHOOK_URL` (optional, for notifications)

### 3. Object Storage Setup

#### Cloudflare R2 (Recommended)
1. Create an R2 bucket
2. Generate API tokens with read/write permissions
3. Use endpoint format: `https://accountid.r2.cloudflarestorage.com`

#### AWS S3
1. Create an S3 bucket
2. Create IAM user with S3 permissions
3. Use region-specific endpoint or leave BACKUP_ENDPOINT empty

## Usage

### Automated Backups

Nightly backups run automatically at 2 AM UTC via GitHub Actions. The workflow:

1. Sets up the environment
2. Installs dependencies
3. Creates a PostgreSQL dump
4. Uploads to object storage
5. Sends notifications (success/failure)

### Manual Backup

```bash
# Run from backend directory
npm run backup
```

### List Available Backups

```bash
# Run restore script to see available backups
npm run restore
```

### Restore Database

```bash
# Restore from most recent backup
npm run restore

# Restore from specific backup
npm run restore backups/backup-2024-01-15T02-00-00-000Z.sql
```

## Backup File Format

Backup files are named with timestamps:
```
backup-YYYY-MM-DDTHH-mm-ss-sssZ.sql
```

Example: `backup-2024-01-15T02-00-00-000Z.sql`

## Monitoring & Alerts

### Slack/Discord Notifications

Configure `SLACK_WEBHOOK_URL` to receive notifications:

- ✅ Backup success
- 🚨 Backup failure
- 📊 Weekly backup summary (future enhancement)

### GitHub Actions Monitoring

Monitor backup status in the GitHub Actions tab:

- View backup logs
- Check failure reasons
- Manually trigger backups
- Monitor storage usage

## Security Considerations

### Access Control
- Use least-privilege IAM policies
- Rotate access keys regularly
- Store secrets securely in GitHub

### Encryption
- Enable bucket encryption at rest
- Use HTTPS for all transfers
- Consider client-side encryption for sensitive data

### Network Security
- Restrict bucket access by IP (if possible)
- Use VPC endpoints for AWS (if applicable)
- Monitor access logs

## Disaster Recovery

### Recovery Time Objectives (RTO)
- Manual restore: ~10-30 minutes
- Automated restore: ~5-15 minutes (with proper tooling)

### Recovery Point Objectives (RPO)
- Daily backups: Up to 24 hours of data loss
- Consider more frequent backups for critical periods

### Recovery Procedures

1. **Partial Data Loss**
   ```bash
   # Restore to new database for comparison
   DATABASE_URL="postgresql://user:pass@host:port/recovery_db" npm run restore
   
   # Manually migrate specific data
   ```

2. **Complete Database Loss**
   ```bash
   # Create new database
   createdb comicogs_new
   
   # Restore from backup
   DATABASE_URL="postgresql://user:pass@host:port/comicogs_new" npm run restore
   
   # Update application configuration
   ```

3. **Point-in-Time Recovery**
   ```bash
   # List backups to find desired point in time
   npm run restore
   
   # Restore specific backup
   npm run restore backups/backup-2024-01-14T15-30-00-000Z.sql
   ```

## Maintenance

### Regular Tasks

1. **Monitor Storage Usage**
   - Check bucket size monthly
   - Verify retention policy is working
   - Clean up old backups if needed

2. **Test Restores**
   - Monthly restore tests to development environment
   - Verify backup integrity
   - Update documentation

3. **Security Reviews**
   - Quarterly access key rotation
   - Review bucket permissions
   - Update notification endpoints

### Troubleshooting

#### Common Issues

1. **pg_dump not found**
   ```bash
   # Install PostgreSQL client tools
   sudo apt-get install postgresql-client
   ```

2. **Access denied errors**
   - Verify access keys and permissions
   - Check bucket exists and is accessible
   - Validate endpoint URL format

3. **Large backup files**
   - Consider compression (built into pg_dump)
   - Implement incremental backups
   - Use streaming uploads for very large databases

4. **Network timeouts**
   - Increase timeout values
   - Use multipart uploads for large files
   - Check network connectivity to storage endpoint

#### Log Analysis

Backup logs include:
- Timestamp and duration
- File sizes and checksums
- Error messages and stack traces
- Storage upload confirmation

## Future Enhancements

### Planned Features
- [ ] Incremental backups
- [ ] Backup verification/testing
- [ ] Cross-region replication
- [ ] Backup encryption
- [ ] Point-in-time recovery automation
- [ ] Backup compression optimization
- [ ] Multi-database support
- [ ] Backup analytics dashboard

### Configuration Options
- [ ] Flexible scheduling (hourly, weekly)
- [ ] Custom retention policies per backup type
- [ ] Backup labeling and tagging
- [ ] Multiple storage destinations
- [ ] Backup performance tuning

## Support

For backup-related issues:

1. Check GitHub Actions logs
2. Review application logs for error details
3. Verify environment variables and secrets
4. Test storage connectivity manually
5. Contact system administrators for access issues

## References

- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [AWS S3 API Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
