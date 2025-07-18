const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const crypto = require('crypto');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/**
 * Backup Manager - Task 9 Implementation
 * Comprehensive backup and disaster recovery system
 */
class BackupManager {
    constructor() {
        this.config = {
            // Database connection
            database: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                name: process.env.DB_NAME || 'comiccomp',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || ''
            },

            // Backup settings
            backup: {
                enabled: process.env.BACKUP_ENABLED !== 'false',
                basePath: process.env.BACKUP_PATH || './data/backups',
                retentionDays: {
                    daily: 30,      // Keep daily backups for 30 days
                    weekly: 12,     // Keep weekly backups for 12 weeks
                    monthly: 12     // Keep monthly backups for 12 months
                },
                compression: true,
                encryption: process.env.BACKUP_ENCRYPTION === 'true',
                encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || null
            },

            // Storage options
            storage: {
                local: {
                    enabled: true,
                    path: process.env.BACKUP_PATH || './data/backups'
                },
                s3: {
                    enabled: process.env.S3_BACKUP_ENABLED === 'true',
                    bucket: process.env.S3_BACKUP_BUCKET || null,
                    region: process.env.S3_BACKUP_REGION || 'us-east-1',
                    accessKeyId: process.env.S3_ACCESS_KEY_ID || null,
                    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || null
                },
                remote: {
                    enabled: process.env.REMOTE_BACKUP_ENABLED === 'true',
                    host: process.env.REMOTE_BACKUP_HOST || null,
                    user: process.env.REMOTE_BACKUP_USER || null,
                    path: process.env.REMOTE_BACKUP_PATH || null
                }
            },

            // Backup schedules
            schedules: {
                incremental: '0 */2 * * *',   // Every 2 hours
                daily: '0 1 * * *',          // 1 AM daily
                weekly: '0 2 * * 0',         // 2 AM Sunday
                monthly: '0 3 1 * *'         // 3 AM first day of month
            },

            // Performance settings
            performance: {
                maxConcurrentBackups: 2,
                timeoutMinutes: 60,
                compressionLevel: 6,
                chunkSizeMB: 100
            }
        };

        this.activeBackups = new Map();
        this.backupHistory = [];
        this.stats = {
            totalBackups: 0,
            successfulBackups: 0,
            failedBackups: 0,
            totalDataBacked: 0,
            lastBackup: null,
            lastRestore: null
        };

        console.log('💾 BackupManager initialized');
    }

    /**
     * Initialize backup manager
     */
    async initialize() {
        try {
            await this.validateConfiguration();
            await this.createBackupDirectories();
            await this.loadBackupHistory();
            
            if (this.config.backup.enabled) {
                await this.scheduleBackups();
            }

            console.log('✅ Backup manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize backup manager:', error);
            throw error;
        }
    }

    /**
     * Schedule automated backups
     */
    async scheduleBackups() {
        // Incremental backups (transaction log)
        cron.schedule(this.config.schedules.incremental, async () => {
            console.log('🔄 Starting incremental backup...');
            await this.createIncrementalBackup();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Daily full backups
        cron.schedule(this.config.schedules.daily, async () => {
            console.log('🗓️ Starting daily backup...');
            await this.createFullBackup('daily');
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Weekly backups
        cron.schedule(this.config.schedules.weekly, async () => {
            console.log('📅 Starting weekly backup...');
            await this.createFullBackup('weekly');
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Monthly backups
        cron.schedule(this.config.schedules.monthly, async () => {
            console.log('🗓️ Starting monthly backup...');
            await this.createFullBackup('monthly');
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        console.log('⏰ Backup schedules configured');
    }

    // ==========================================
    // BACKUP OPERATIONS
    // ==========================================

    /**
     * Create full database backup
     */
    async createFullBackup(type = 'manual') {
        if (this.activeBackups.size >= this.config.performance.maxConcurrentBackups) {
            throw new Error('Maximum concurrent backups reached');
        }

        const backupId = `full-${type}-${Date.now()}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `comiccomp_${type}_${timestamp}`;

        this.activeBackups.set(backupId, {
            type: 'full',
            category: type,
            startTime: new Date(),
            name: backupName
        });

        try {
            console.log(`💾 Starting ${type} backup: ${backupName}`);

            // Create backup using pg_dump
            const backupPath = path.join(this.config.backup.basePath, 'full', `${backupName}.sql`);
            await this.createPostgresBackup(backupPath);

            // Compress backup
            let finalPath = backupPath;
            if (this.config.backup.compression) {
                finalPath = await this.compressFile(backupPath);
                await fs.unlink(backupPath); // Remove uncompressed file
            }

            // Encrypt backup if enabled
            if (this.config.backup.encryption && this.config.backup.encryptionKey) {
                finalPath = await this.encryptFile(finalPath);
            }

            // Get file stats
            const stats = await fs.stat(finalPath);
            const fileSize = stats.size;

            // Upload to remote storage if configured
            await this.uploadToRemoteStorage(finalPath, type);

            // Create backup metadata
            const backupInfo = {
                id: backupId,
                name: backupName,
                type: 'full',
                category: type,
                path: finalPath,
                size: fileSize,
                checksum: await this.calculateChecksum(finalPath),
                createdAt: new Date(),
                compressed: this.config.backup.compression,
                encrypted: this.config.backup.encryption,
                tables: await this.getTableList(),
                dbVersion: await this.getDatabaseVersion()
            };

            // Save backup metadata
            await this.saveBackupMetadata(backupInfo);

            // Update statistics
            this.stats.totalBackups++;
            this.stats.successfulBackups++;
            this.stats.totalDataBacked += fileSize;
            this.stats.lastBackup = new Date();

            // Clean up old backups
            await this.cleanupOldBackups(type);

            console.log(`✅ ${type} backup completed: ${this.formatFileSize(fileSize)}`);
            return backupInfo;

        } catch (error) {
            this.stats.failedBackups++;
            console.error(`❌ ${type} backup failed:`, error);
            throw error;
        } finally {
            this.activeBackups.delete(backupId);
        }
    }

    /**
     * Create incremental backup (WAL files)
     */
    async createIncrementalBackup() {
        const backupId = `incremental-${Date.now()}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `comiccomp_incremental_${timestamp}`;

        this.activeBackups.set(backupId, {
            type: 'incremental',
            startTime: new Date(),
            name: backupName
        });

        try {
            console.log(`🔄 Starting incremental backup: ${backupName}`);

            // Archive current WAL file
            const walPath = path.join(this.config.backup.basePath, 'wal', `${backupName}.wal`);
            await this.archiveWALFile(walPath);

            // Get file stats
            const stats = await fs.stat(walPath);
            const fileSize = stats.size;

            // Compress if enabled
            let finalPath = walPath;
            if (this.config.backup.compression) {
                finalPath = await this.compressFile(walPath);
                await fs.unlink(walPath);
            }

            // Create backup metadata
            const backupInfo = {
                id: backupId,
                name: backupName,
                type: 'incremental',
                path: finalPath,
                size: fileSize,
                checksum: await this.calculateChecksum(finalPath),
                createdAt: new Date(),
                compressed: this.config.backup.compression
            };

            await this.saveBackupMetadata(backupInfo);

            console.log(`✅ Incremental backup completed: ${this.formatFileSize(fileSize)}`);
            return backupInfo;

        } catch (error) {
            console.error(`❌ Incremental backup failed:`, error);
            throw error;
        } finally {
            this.activeBackups.delete(backupId);
        }
    }

    /**
     * Create table-specific backup
     */
    async createTableBackup(tableName, options = {}) {
        const backupId = `table-${tableName}-${Date.now()}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${tableName}_${timestamp}`;

        try {
            console.log(`📊 Starting table backup: ${tableName}`);

            const backupPath = path.join(
                this.config.backup.basePath, 
                'tables', 
                `${backupName}.sql`
            );

            // Create table-specific dump
            await this.createTableDump(tableName, backupPath, options);

            // Process file (compress, encrypt)
            let finalPath = await this.processBackupFile(backupPath);

            const stats = await fs.stat(finalPath);
            const backupInfo = {
                id: backupId,
                name: backupName,
                type: 'table',
                table: tableName,
                path: finalPath,
                size: stats.size,
                checksum: await this.calculateChecksum(finalPath),
                createdAt: new Date(),
                options
            };

            await this.saveBackupMetadata(backupInfo);
            console.log(`✅ Table backup completed: ${tableName} (${this.formatFileSize(stats.size)})`);
            
            return backupInfo;

        } catch (error) {
            console.error(`❌ Table backup failed for ${tableName}:`, error);
            throw error;
        }
    }

    // ==========================================
    // RESTORE OPERATIONS
    // ==========================================

    /**
     * Restore database from backup
     */
    async restoreFromBackup(backupId, options = {}) {
        const backup = await this.getBackupMetadata(backupId);
        if (!backup) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        const restoreId = `restore-${Date.now()}`;
        
        try {
            console.log(`🔄 Starting restore from backup: ${backup.name}`);

            // Validate backup file
            await this.validateBackupFile(backup);

            // Create restore point before proceeding
            if (!options.skipPreRestoreBackup) {
                await this.createFullBackup('pre-restore');
            }

            // Stop applications if requested
            if (options.stopApplications) {
                await this.stopApplications();
            }

            // Perform restore based on backup type
            switch (backup.type) {
                case 'full':
                    await this.restoreFullBackup(backup, options);
                    break;
                case 'incremental':
                    await this.restoreIncrementalBackup(backup, options);
                    break;
                case 'table':
                    await this.restoreTableBackup(backup, options);
                    break;
                default:
                    throw new Error(`Unknown backup type: ${backup.type}`);
            }

            // Update statistics
            this.stats.lastRestore = new Date();

            console.log(`✅ Restore completed from backup: ${backup.name}`);
            return { restoreId, backup, completedAt: new Date() };

        } catch (error) {
            console.error(`❌ Restore failed:`, error);
            throw error;
        } finally {
            // Restart applications if they were stopped
            if (options.stopApplications) {
                await this.startApplications();
            }
        }
    }

    /**
     * Restore full database backup
     */
    async restoreFullBackup(backup, options = {}) {
        let backupPath = backup.path;

        // Decrypt if needed
        if (backup.encrypted) {
            backupPath = await this.decryptFile(backupPath);
        }

        // Decompress if needed
        if (backup.compressed) {
            backupPath = await this.decompressFile(backupPath);
        }

        // Drop existing database if requested
        if (options.dropExisting) {
            await this.dropDatabase();
            await this.createDatabase();
        }

        // Restore using psql
        await this.restorePostgresBackup(backupPath);

        // Clean up temporary files
        if (backup.encrypted || backup.compressed) {
            await fs.unlink(backupPath);
        }
    }

    /**
     * Restore table backup
     */
    async restoreTableBackup(backup, options = {}) {
        let backupPath = backup.path;

        // Process encrypted/compressed file
        if (backup.encrypted) {
            backupPath = await this.decryptFile(backupPath);
        }
        if (backup.compressed) {
            backupPath = await this.decompressFile(backupPath);
        }

        // Drop table if requested
        if (options.dropTable) {
            await this.dropTable(backup.table);
        }

        // Restore table
        await this.restoreTableDump(backup.table, backupPath);

        // Clean up
        if (backup.encrypted || backup.compressed) {
            await fs.unlink(backupPath);
        }
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Create PostgreSQL backup using pg_dump
     */
    async createPostgresBackup(outputPath) {
        const { database } = this.config;
        
        const command = 'pg_dump';
        const args = [
            '-h', database.host,
            '-p', database.port.toString(),
            '-U', database.user,
            '-d', database.name,
            '--verbose',
            '--no-password',
            '--format=custom',
            '--compress=6',
            '--file', outputPath
        ];

        await this.executeCommand(command, args, {
            env: { 
                ...process.env, 
                PGPASSWORD: database.password 
            }
        });
    }

    /**
     * Create table-specific dump
     */
    async createTableDump(tableName, outputPath, options = {}) {
        const { database } = this.config;
        
        const args = [
            '-h', database.host,
            '-p', database.port.toString(),
            '-U', database.user,
            '-d', database.name,
            '--verbose',
            '--no-password',
            '--table', tableName
        ];

        // Add conditional options
        if (options.dataOnly) args.push('--data-only');
        if (options.schemaOnly) args.push('--schema-only');
        if (options.where) args.push('--where', options.where);

        args.push('--file', outputPath);

        await this.executeCommand('pg_dump', args, {
            env: { 
                ...process.env, 
                PGPASSWORD: database.password 
            }
        });
    }

    /**
     * Restore PostgreSQL backup using pg_restore
     */
    async restorePostgresBackup(backupPath) {
        const { database } = this.config;
        
        const args = [
            '-h', database.host,
            '-p', database.port.toString(),
            '-U', database.user,
            '-d', database.name,
            '--verbose',
            '--no-password',
            '--clean',
            '--if-exists',
            backupPath
        ];

        await this.executeCommand('pg_restore', args, {
            env: { 
                ...process.env, 
                PGPASSWORD: database.password 
            }
        });
    }

    /**
     * Execute system command with timeout
     */
    async executeCommand(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: ['inherit', 'pipe', 'pipe'],
                ...options
            });

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            // Set timeout
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`Command timeout: ${command}`));
            }, this.config.performance.timeoutMinutes * 60 * 1000);

            child.on('close', (code) => {
                clearTimeout(timeout);
                
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Compress file using gzip
     */
    async compressFile(filePath) {
        const compressedPath = `${filePath}.gz`;
        await exec(`gzip -${this.config.performance.compressionLevel} "${filePath}"`);
        return compressedPath;
    }

    /**
     * Decompress file
     */
    async decompressFile(filePath) {
        const decompressedPath = filePath.replace(/\.gz$/, '');
        await exec(`gunzip -c "${filePath}" > "${decompressedPath}"`);
        return decompressedPath;
    }

    /**
     * Encrypt file using AES-256
     */
    async encryptFile(filePath) {
        if (!this.config.backup.encryptionKey) {
            throw new Error('Encryption key not configured');
        }

        const encryptedPath = `${filePath}.enc`;
        const key = Buffer.from(this.config.backup.encryptionKey, 'hex');
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipher('aes-256-cbc', key);
        const input = await fs.readFile(filePath);
        
        const encrypted = Buffer.concat([
            iv,
            cipher.update(input),
            cipher.final()
        ]);

        await fs.writeFile(encryptedPath, encrypted);
        await fs.unlink(filePath);
        
        return encryptedPath;
    }

    /**
     * Decrypt file
     */
    async decryptFile(filePath) {
        if (!this.config.backup.encryptionKey) {
            throw new Error('Encryption key not configured');
        }

        const decryptedPath = filePath.replace(/\.enc$/, '');
        const key = Buffer.from(this.config.backup.encryptionKey, 'hex');
        const encrypted = await fs.readFile(filePath);
        
        const iv = encrypted.slice(0, 16);
        const data = encrypted.slice(16);
        
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        const decrypted = Buffer.concat([
            decipher.update(data),
            decipher.final()
        ]);

        await fs.writeFile(decryptedPath, decrypted);
        return decryptedPath;
    }

    /**
     * Calculate file checksum
     */
    async calculateChecksum(filePath) {
        const hash = crypto.createHash('sha256');
        const stream = require('fs').createReadStream(filePath);
        
        return new Promise((resolve, reject) => {
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    /**
     * Get backup manager status
     */
    getStatus() {
        return {
            enabled: this.config.backup.enabled,
            activeBackups: Array.from(this.activeBackups.entries()).map(([id, backup]) => ({
                id,
                ...backup,
                duration: Date.now() - backup.startTime.getTime()
            })),
            stats: { ...this.stats },
            storage: {
                local: this.config.storage.local.enabled,
                s3: this.config.storage.s3.enabled,
                remote: this.config.storage.remote.enabled
            },
            nextScheduledBackup: this.getNextScheduledBackup()
        };
    }

    /**
     * Get next scheduled backup time
     */
    getNextScheduledBackup() {
        // This would calculate the next scheduled backup time
        // Based on the cron schedules
        return null; // Placeholder
    }

    /**
     * Cleanup old backups based on retention policy
     */
    async cleanupOldBackups(type) {
        const retentionDays = this.config.backup.retentionDays[type] || 30;
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

        // This would implement the cleanup logic
        console.log(`🧹 Cleaning up ${type} backups older than ${retentionDays} days`);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Validate configuration
     */
    async validateConfiguration() {
        // Validate database connection
        if (!this.config.database.name) {
            throw new Error('Database name not configured');
        }

        // Check if backup directory exists
        try {
            await fs.access(this.config.backup.basePath);
        } catch {
            await fs.mkdir(this.config.backup.basePath, { recursive: true });
        }

        console.log('✅ Backup configuration validated');
    }

    /**
     * Create backup directory structure
     */
    async createBackupDirectories() {
        const subdirs = ['full', 'incremental', 'tables', 'wal', 'metadata'];
        
        for (const subdir of subdirs) {
            const dirPath = path.join(this.config.backup.basePath, subdir);
            await fs.mkdir(dirPath, { recursive: true });
        }

        console.log('📁 Backup directories created');
    }

    // Placeholder methods for additional functionality
    async saveBackupMetadata(backupInfo) { /* Implementation */ }
    async getBackupMetadata(backupId) { /* Implementation */ }
    async loadBackupHistory() { /* Implementation */ }
    async uploadToRemoteStorage(filePath, type) { /* Implementation */ }
    async archiveWALFile(outputPath) { /* Implementation */ }
    async processBackupFile(filePath) { return filePath; }
    async validateBackupFile(backup) { /* Implementation */ }
    async getTableList() { return []; }
    async getDatabaseVersion() { return '14.0'; }
    async dropDatabase() { /* Implementation */ }
    async createDatabase() { /* Implementation */ }
    async dropTable(tableName) { /* Implementation */ }
    async restoreTableDump(tableName, backupPath) { /* Implementation */ }
    async restoreIncrementalBackup(backup, options) { /* Implementation */ }
    async stopApplications() { /* Implementation */ }
    async startApplications() { /* Implementation */ }
}

module.exports = BackupManager; 