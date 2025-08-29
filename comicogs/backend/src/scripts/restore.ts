#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../lib/logger.js';

const execAsync = promisify(exec);

interface RestoreConfig {
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
    endpoint?: string;
  };
}

class DatabaseRestore {
  private config: RestoreConfig;
  private s3Client: S3Client;

  constructor(config: RestoreConfig) {
    this.config = config;
    
    this.s3Client = new S3Client({
      region: config.storage.region,
      credentials: config.storage.accessKeyId && config.storage.secretAccessKey ? {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey,
      } : undefined,
      endpoint: config.storage.endpoint,
      forcePathStyle: true,
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

  async listAvailableBackups(): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.storage.bucket,
        Prefix: 'backups/',
      });

      const response = await this.s3Client.send(command);
      const backups = response.Contents?.map(obj => obj.Key!).filter(key => key.endsWith('.sql')) || [];
      
      // Sort by date (newest first)
      return backups.sort().reverse();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list available backups');
      throw new Error(`Failed to list backups: ${error.message}`);
    }
  }

  async downloadBackup(backupKey: string, localPath: string): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.storage.bucket,
        Key: backupKey,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No backup data received');
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(localPath, buffer);
      
      logger.info({ backupKey, localPath }, 'Backup downloaded successfully');
    } catch (error: any) {
      logger.error({ error: error.message, backupKey }, 'Failed to download backup');
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async restoreDatabase(backupFilePath: string): Promise<void> {
    const dbInfo = this.parseConnectionString(this.config.database.url);
    
    // Set environment variables for psql
    const env = {
      ...process.env,
      PGHOST: dbInfo.host,
      PGPORT: dbInfo.port,
      PGDATABASE: dbInfo.database,
      PGUSER: dbInfo.username,
      PGPASSWORD: dbInfo.password,
    };

    const command = `psql --no-password --verbose -f "${backupFilePath}"`;
    
    logger.info({ command, database: dbInfo.database }, 'Starting database restore');

    try {
      const { stdout, stderr } = await execAsync(command, { env });
      logger.info({ stdout, stderr }, 'Database restore completed');
    } catch (error: any) {
      logger.error({ error: error.message, stderr: error.stderr }, 'Database restore failed');
      throw new Error(`Database restore failed: ${error.message}`);
    }
  }

  async performRestore(backupKey?: string): Promise<void> {
    const tempDir = '/tmp';
    let selectedBackup: string;

    try {
      // If no backup specified, use the most recent one
      if (!backupKey) {
        const availableBackups = await this.listAvailableBackups();
        if (availableBackups.length === 0) {
          throw new Error('No backups found');
        }
        selectedBackup = availableBackups[0];
        logger.info({ selectedBackup }, 'Using most recent backup');
      } else {
        selectedBackup = backupKey;
      }

      const backupFilename = path.basename(selectedBackup);
      const localPath = path.join(tempDir, backupFilename);

      logger.info({ backup: selectedBackup }, 'Starting restore process');

      // Step 1: Download backup
      await this.downloadBackup(selectedBackup, localPath);

      // Step 2: Restore database
      await this.restoreDatabase(localPath);

      // Step 3: Clean up local file
      await fs.unlink(localPath);
      logger.info({ localPath }, 'Local backup file cleaned up');

      logger.info({ backup: selectedBackup }, 'Restore process completed successfully');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Restore process failed');
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const config: RestoreConfig = {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/comicogs',
      },
      storage: {
        bucket: process.env.BACKUP_BUCKET || 'comicogs-backups',
        region: process.env.BACKUP_REGION || 'auto',
        accessKeyId: process.env.BACKUP_ACCESS_KEY_ID,
        secretAccessKey: process.env.BACKUP_SECRET_ACCESS_KEY,
        endpoint: process.env.BACKUP_ENDPOINT,
      },
    };

    // Validate required environment variables
    if (!config.storage.accessKeyId || !config.storage.secretAccessKey) {
      throw new Error('BACKUP_ACCESS_KEY_ID and BACKUP_SECRET_ACCESS_KEY environment variables are required');
    }

    if (!config.storage.endpoint) {
      throw new Error('BACKUP_ENDPOINT environment variable is required');
    }

    const restore = new DatabaseRestore(config);
    
    // Get backup key from command line argument
    const backupKey = process.argv[2];
    
    if (backupKey) {
      logger.info({ backupKey }, 'Restoring from specified backup');
      await restore.performRestore(backupKey);
    } else {
      // List available backups and restore from the most recent
      const backups = await restore.listAvailableBackups();
      console.log('Available backups:');
      backups.forEach((backup, index) => {
        console.log(`  ${index + 1}. ${backup}`);
      });
      
      if (backups.length > 0) {
        logger.info('No backup specified, using most recent');
        await restore.performRestore();
      } else {
        throw new Error('No backups available');
      }
    }
    
    logger.info('Restore completed successfully');
    process.exit(0);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Restore failed');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseRestore, type RestoreConfig };
