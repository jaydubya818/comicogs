#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../lib/logger.js';

const execAsync = promisify(exec);

interface BackupConfig {
  database: {
    url: string;
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
  };
  storage: {
    bucket: string;
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string; // For S3-compatible services like Cloudflare R2
  };
  retention: {
    days: number; // Keep backups for this many days
  };
}

class DatabaseBackup {
  private config: BackupConfig;
  private s3Client: S3Client;

  constructor(config: BackupConfig) {
    this.config = config;
    
    // Initialize S3 client (works with Cloudflare R2 and other S3-compatible services)
    this.s3Client = new S3Client({
      region: config.storage.region,
      credentials: config.storage.accessKeyId && config.storage.secretAccessKey ? {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey,
      } : undefined,
      endpoint: config.storage.endpoint,
      forcePathStyle: true, // Required for some S3-compatible services
    });
  }

  private parseConnectionString(connectionString: string) {
    try {
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1),
        username: url.username,
        password: url.password,
      };
    } catch (error) {
      throw new Error(`Invalid database URL: ${error}`);
    }
  }

  private generateBackupFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup-${timestamp}.sql`;
  }

  private async createDatabaseDump(outputPath: string): Promise<void> {
    const dbInfo = this.parseConnectionString(this.config.database.url);
    
    // Set environment variables for pg_dump
    const env = {
      ...process.env,
      PGHOST: dbInfo.host,
      PGPORT: dbInfo.port,
      PGDATABASE: dbInfo.database,
      PGUSER: dbInfo.username,
      PGPASSWORD: dbInfo.password,
    };

    const command = `pg_dump --no-password --verbose --clean --no-acl --no-owner -f "${outputPath}"`;
    
    logger.info({ command, database: dbInfo.database }, 'Starting database backup');

    try {
      const { stdout, stderr } = await execAsync(command, { env });
      logger.info({ stdout, stderr }, 'Database dump completed');
    } catch (error: any) {
      logger.error({ error: error.message, stderr: error.stderr }, 'Database dump failed');
      throw new Error(`Database dump failed: ${error.message}`);
    }
  }

  private async uploadToStorage(filePath: string, key: string): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath);
      
      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.storage.bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/sql',
        Metadata: {
          'backup-date': new Date().toISOString(),
          'database': this.parseConnectionString(this.config.database.url).database || 'unknown',
        },
      });

      await this.s3Client.send(uploadCommand);
      logger.info({ key, bucket: this.config.storage.bucket }, 'Backup uploaded to storage');
    } catch (error: any) {
      logger.error({ error: error.message, key }, 'Failed to upload backup to storage');
      throw new Error(`Storage upload failed: ${error.message}`);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    // Implementation would list objects in bucket and delete old ones
    // For now, just log that cleanup should happen
    logger.info({ retentionDays: this.config.retention.days }, 'Cleanup of old backups should be implemented');
  }

  public async performBackup(): Promise<void> {
    const backupFilename = this.generateBackupFilename();
    const tempDir = '/tmp';
    const localPath = path.join(tempDir, backupFilename);
    const storageKey = `backups/${backupFilename}`;

    try {
      logger.info({ filename: backupFilename }, 'Starting backup process');

      // Step 1: Create database dump
      await this.createDatabaseDump(localPath);

      // Step 2: Upload to storage
      await this.uploadToStorage(localPath, storageKey);

      // Step 3: Clean up local file
      await fs.unlink(localPath);
      logger.info({ localPath }, 'Local backup file cleaned up');

      // Step 4: Clean up old backups (TODO: implement)
      await this.cleanupOldBackups();

      logger.info({ storageKey }, 'Backup process completed successfully');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Backup process failed');
      
      // Clean up local file if it exists
      try {
        await fs.unlink(localPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const config: BackupConfig = {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/comicogs',
      },
      storage: {
        bucket: process.env.BACKUP_BUCKET || 'comicogs-backups',
        region: process.env.BACKUP_REGION || 'auto',
        accessKeyId: process.env.BACKUP_ACCESS_KEY_ID,
        secretAccessKey: process.env.BACKUP_SECRET_ACCESS_KEY,
        endpoint: process.env.BACKUP_ENDPOINT, // For Cloudflare R2: https://accountid.r2.cloudflarestorage.com
      },
      retention: {
        days: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
      },
    };

    // Validate required environment variables
    if (!config.storage.accessKeyId || !config.storage.secretAccessKey) {
      throw new Error('BACKUP_ACCESS_KEY_ID and BACKUP_SECRET_ACCESS_KEY environment variables are required');
    }

    if (!config.storage.endpoint) {
      throw new Error('BACKUP_ENDPOINT environment variable is required (e.g., https://accountid.r2.cloudflarestorage.com)');
    }

    const backup = new DatabaseBackup(config);
    await backup.performBackup();
    
    logger.info('Backup completed successfully');
    process.exit(0);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Backup failed');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseBackup, type BackupConfig };
