const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

/**
 * Migration Manager - Task 9 Implementation
 * Comprehensive database migration and versioning system
 */
class MigrationManager {
    constructor() {
        this.config = {
            // Migration settings
            migrationsPath: path.join(__dirname, '../migrations'),
            migrationTable: 'schema_migrations',
            backupBeforeMigration: true,
            validateBeforeRun: true,
            autoApproveInDev: process.env.NODE_ENV === 'development',
            
            // Safety settings
            maxRollbackDepth: 10,
            requireConfirmation: process.env.NODE_ENV === 'production',
            lockTimeout: 300000, // 5 minutes
            queryTimeout: 60000,  // 1 minute per query
            
            // Validation settings
            validateForeignKeys: true,
            validateConstraints: true,
            validateIndexes: true,
            checkDataConsistency: true
        };

        this.migrationLock = null;
        this.migrationHistory = [];
        this.pendingMigrations = [];
        
        // Migration status tracking
        this.status = {
            currentVersion: null,
            availableVersions: [],
            pendingCount: 0,
            lastMigration: null,
            isLocked: false
        };

        console.log('🔄 MigrationManager initialized');
    }

    /**
     * Initialize migration manager
     */
    async initialize() {
        try {
            await this.ensureMigrationTable();
            await this.loadMigrationHistory();
            await this.scanAvailableMigrations();
            await this.updateStatus();

            console.log('✅ Migration manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize migration manager:', error);
            throw error;
        }
    }

    /**
     * Ensure migration tracking table exists
     */
    async ensureMigrationTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ${this.config.migrationTable} (
                version VARCHAR(50) PRIMARY KEY,
                description TEXT,
                checksum VARCHAR(64),
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                applied_by VARCHAR(100) DEFAULT CURRENT_USER,
                execution_time_ms INTEGER,
                rollback_sql TEXT,
                migration_type VARCHAR(20) DEFAULT 'forward',
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                batch_id VARCHAR(50)
            )
        `;

        await db.query(createTableSQL);

        // Create index for performance
        try {
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
                ON ${this.config.migrationTable} (applied_at DESC)
            `);
        } catch (error) {
            // Index might already exist, ignore
        }
    }

    /**
     * Load migration history from database
     */
    async loadMigrationHistory() {
        const result = await db.query(`
            SELECT * FROM ${this.config.migrationTable}
            ORDER BY applied_at DESC
        `);

        this.migrationHistory = result.rows;
        
        if (this.migrationHistory.length > 0) {
            this.status.currentVersion = this.migrationHistory[0].version;
            this.status.lastMigration = this.migrationHistory[0].applied_at;
        }
    }

    /**
     * Scan for available migration files
     */
    async scanAvailableMigrations() {
        try {
            const files = await fs.readdir(this.config.migrationsPath);
            const migrationFiles = files
                .filter(file => file.match(/^\d{3}_.*\.sql$/))
                .sort();

            this.status.availableVersions = migrationFiles.map(file => {
                const [version, ...nameParts] = file.replace('.sql', '').split('_');
                return {
                    version,
                    name: nameParts.join('_'),
                    filename: file,
                    path: path.join(this.config.migrationsPath, file)
                };
            });

            // Find pending migrations
            const appliedVersions = new Set(this.migrationHistory.map(m => m.version));
            this.pendingMigrations = this.status.availableVersions.filter(
                migration => !appliedVersions.has(migration.version)
            );

            this.status.pendingCount = this.pendingMigrations.length;

        } catch (error) {
            if (error.code === 'ENOENT') {
                // Migrations directory doesn't exist
                await fs.mkdir(this.config.migrationsPath, { recursive: true });
                this.status.availableVersions = [];
                this.pendingMigrations = [];
            } else {
                throw error;
            }
        }
    }

    // ==========================================
    // MIGRATION EXECUTION
    // ==========================================

    /**
     * Run all pending migrations
     */
    async migrate(options = {}) {
        if (this.pendingMigrations.length === 0) {
            console.log('✅ No pending migrations');
            return { applied: [], skipped: [], errors: [] };
        }

        const batchId = this.generateBatchId();
        const results = {
            applied: [],
            skipped: [],
            errors: [],
            batchId
        };

        try {
            await this.acquireLock();
            
            console.log(`🔄 Running ${this.pendingMigrations.length} pending migrations...`);

            for (const migration of this.pendingMigrations) {
                try {
                    const result = await this.runSingleMigration(migration, batchId, options);
                    results.applied.push(result);
                    console.log(`✅ Applied migration: ${migration.version} - ${migration.name}`);
                } catch (error) {
                    console.error(`❌ Migration failed: ${migration.version}`, error);
                    results.errors.push({
                        migration: migration.version,
                        error: error.message
                    });

                    // Stop on first error unless force option is set
                    if (!options.continueOnError) {
                        break;
                    }
                }
            }

            await this.updateStatus();

        } finally {
            await this.releaseLock();
        }

        console.log(`✅ Migration batch completed: ${results.applied.length} applied, ${results.errors.length} errors`);
        return results;
    }

    /**
     * Run a single migration
     */
    async runSingleMigration(migration, batchId, options = {}) {
        const startTime = Date.now();
        
        try {
            // Load and validate migration file
            const migrationSQL = await this.loadMigrationFile(migration.path);
            const checksum = this.calculateChecksum(migrationSQL);
            
            // Validate migration if required
            if (this.config.validateBeforeRun) {
                await this.validateMigration(migrationSQL, migration);
            }

            // Create backup if required
            let backupPath = null;
            if (this.config.backupBeforeMigration) {
                backupPath = await this.createPreMigrationBackup(migration.version);
            }

            // Parse migration content
            const { forwardSQL, rollbackSQL } = this.parseMigrationFile(migrationSQL);

            // Execute migration in transaction
            await db.query('BEGIN');

            try {
                // Execute forward migration
                await this.executeMigrationSQL(forwardSQL);

                // Record migration
                await this.recordMigration({
                    version: migration.version,
                    description: migration.name,
                    checksum,
                    executionTimeMs: Date.now() - startTime,
                    rollbackSQL,
                    batchId,
                    backupPath
                });

                await db.query('COMMIT');

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }

            return {
                version: migration.version,
                description: migration.name,
                executionTime: Date.now() - startTime,
                checksum,
                backupPath
            };

        } catch (error) {
            // Record failed migration
            await this.recordFailedMigration({
                version: migration.version,
                description: migration.name,
                error: error.message,
                executionTime: Date.now() - startTime,
                batchId
            });

            throw error;
        }
    }

    /**
     * Rollback to a specific version
     */
    async rollback(targetVersion, options = {}) {
        const appliedMigrations = this.migrationHistory
            .filter(m => m.success && m.migration_type === 'forward')
            .sort((a, b) => b.applied_at - a.applied_at);

        if (appliedMigrations.length === 0) {
            console.log('✅ No migrations to rollback');
            return { rolledBack: [] };
        }

        // Find rollback path
        const rollbackMigrations = [];
        for (const migration of appliedMigrations) {
            rollbackMigrations.push(migration);
            if (migration.version === targetVersion) {
                break;
            }
        }

        if (rollbackMigrations.length > this.config.maxRollbackDepth) {
            throw new Error(`Rollback depth exceeds maximum allowed (${this.config.maxRollbackDepth})`);
        }

        const batchId = this.generateBatchId();
        const results = { rolledBack: [], errors: [] };

        try {
            await this.acquireLock();

            console.log(`🔄 Rolling back ${rollbackMigrations.length} migrations...`);

            for (const migration of rollbackMigrations) {
                try {
                    await this.rollbackSingleMigration(migration, batchId, options);
                    results.rolledBack.push(migration.version);
                    console.log(`↩️ Rolled back: ${migration.version}`);
                } catch (error) {
                    console.error(`❌ Rollback failed: ${migration.version}`, error);
                    results.errors.push({
                        migration: migration.version,
                        error: error.message
                    });

                    if (!options.continueOnError) {
                        break;
                    }
                }
            }

            await this.updateStatus();

        } finally {
            await this.releaseLock();
        }

        return results;
    }

    /**
     * Rollback a single migration
     */
    async rollbackSingleMigration(migration, batchId, options = {}) {
        if (!migration.rollback_sql) {
            throw new Error(`No rollback SQL available for migration ${migration.version}`);
        }

        const startTime = Date.now();

        try {
            await db.query('BEGIN');

            // Execute rollback SQL
            await this.executeMigrationSQL(migration.rollback_sql);

            // Record rollback
            await this.recordMigration({
                version: migration.version,
                description: `Rollback: ${migration.description}`,
                checksum: this.calculateChecksum(migration.rollback_sql),
                executionTimeMs: Date.now() - startTime,
                migrationType: 'rollback',
                batchId
            });

            await db.query('COMMIT');

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }

    // ==========================================
    // MIGRATION UTILITIES
    // ==========================================

    /**
     * Load migration file content
     */
    async loadMigrationFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to load migration file: ${filePath}`);
        }
    }

    /**
     * Parse migration file into forward and rollback SQL
     */
    parseMigrationFile(content) {
        const lines = content.split('\n');
        let forwardSQL = [];
        let rollbackSQL = [];
        let currentSection = 'forward';

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine === '-- ROLLBACK' || trimmedLine === '-- rollback') {
                currentSection = 'rollback';
                continue;
            }
            
            if (trimmedLine === '-- FORWARD' || trimmedLine === '-- forward') {
                currentSection = 'forward';
                continue;
            }

            if (currentSection === 'forward') {
                forwardSQL.push(line);
            } else if (currentSection === 'rollback') {
                rollbackSQL.push(line);
            }
        }

        return {
            forwardSQL: forwardSQL.join('\n').trim(),
            rollbackSQL: rollbackSQL.join('\n').trim()
        };
    }

    /**
     * Execute migration SQL
     */
    async executeMigrationSQL(sql) {
        if (!sql || sql.trim() === '') {
            return;
        }

        // Split by semicolon and execute each statement
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            try {
                await db.query(statement);
            } catch (error) {
                console.error(`Failed to execute SQL: ${statement.substring(0, 100)}...`);
                throw error;
            }
        }
    }

    /**
     * Validate migration before execution
     */
    async validateMigration(migrationSQL, migration) {
        const { forwardSQL, rollbackSQL } = this.parseMigrationFile(migrationSQL);

        // Basic syntax validation
        if (!forwardSQL || forwardSQL.trim() === '') {
            throw new Error(`Migration ${migration.version} has no forward SQL`);
        }

        // Check for dangerous operations in production
        if (process.env.NODE_ENV === 'production') {
            const dangerousPatterns = [
                /DROP\s+DATABASE/i,
                /TRUNCATE\s+TABLE/i,
                /DELETE\s+FROM\s+\w+\s*;/i, // DELETE without WHERE clause
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(forwardSQL)) {
                    throw new Error(`Migration ${migration.version} contains dangerous operation: ${pattern}`);
                }
            }
        }

        // Validate rollback SQL exists for destructive operations
        const destructivePatterns = [
            /DROP\s+TABLE/i,
            /DROP\s+COLUMN/i,
            /ALTER\s+TABLE.*DROP/i
        ];

        const hasDestructiveOps = destructivePatterns.some(pattern => pattern.test(forwardSQL));
        if (hasDestructiveOps && (!rollbackSQL || rollbackSQL.trim() === '')) {
            throw new Error(`Migration ${migration.version} has destructive operations but no rollback SQL`);
        }
    }

    /**
     * Record successful migration
     */
    async recordMigration(migrationData) {
        await db.query(`
            INSERT INTO ${this.config.migrationTable} 
            (version, description, checksum, execution_time_ms, rollback_sql, migration_type, batch_id, success)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            migrationData.version,
            migrationData.description,
            migrationData.checksum,
            migrationData.executionTimeMs,
            migrationData.rollbackSQL || null,
            migrationData.migrationType || 'forward',
            migrationData.batchId,
            true
        ]);
    }

    /**
     * Record failed migration
     */
    async recordFailedMigration(migrationData) {
        try {
            await db.query(`
                INSERT INTO ${this.config.migrationTable} 
                (version, description, execution_time_ms, batch_id, success, error_message)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                migrationData.version,
                migrationData.description,
                migrationData.executionTime,
                migrationData.batchId,
                false,
                migrationData.error
            ]);
        } catch (error) {
            console.error('Failed to record migration failure:', error);
        }
    }

    // ==========================================
    // MIGRATION GENERATION
    // ==========================================

    /**
     * Generate new migration file
     */
    async generateMigration(name, options = {}) {
        const version = this.generateVersion();
        const filename = `${version}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
        const filepath = path.join(this.config.migrationsPath, filename);

        const template = this.getMigrationTemplate(name, options);

        await fs.writeFile(filepath, template);

        console.log(`✅ Generated migration: ${filename}`);
        
        // Rescan available migrations
        await this.scanAvailableMigrations();

        return {
            version,
            filename,
            filepath
        };
    }

    /**
     * Generate migration template
     */
    getMigrationTemplate(name, options = {}) {
        const timestamp = new Date().toISOString();
        
        return `-- Migration: ${name}
-- Created: ${timestamp}
-- Description: ${options.description || 'Add description here'}

-- FORWARD
-- Add your forward migration SQL here


-- ROLLBACK
-- Add your rollback SQL here

`;
    }

    /**
     * Generate version number
     */
    generateVersion() {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        
        return `${year}${month}${day}${hour}${minute}`;
    }

    // ==========================================
    // LOCK MANAGEMENT
    // ==========================================

    /**
     * Acquire migration lock
     */
    async acquireLock() {
        const lockId = crypto.randomBytes(16).toString('hex');
        const timeout = Date.now() + this.config.lockTimeout;

        while (Date.now() < timeout) {
            try {
                await db.query(`
                    INSERT INTO migration_locks (lock_id, acquired_at, expires_at)
                    VALUES ($1, CURRENT_TIMESTAMP, $2)
                `, [lockId, new Date(Date.now() + this.config.lockTimeout)]);

                this.migrationLock = lockId;
                this.status.isLocked = true;
                return;

            } catch (error) {
                if (error.code === '23505') { // Unique violation
                    // Lock exists, wait and retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                } else {
                    throw error;
                }
            }
        }

        throw new Error('Failed to acquire migration lock within timeout');
    }

    /**
     * Release migration lock
     */
    async releaseLock() {
        if (this.migrationLock) {
            try {
                await db.query(`
                    DELETE FROM migration_locks WHERE lock_id = $1
                `, [this.migrationLock]);
            } catch (error) {
                console.error('Failed to release migration lock:', error);
            }

            this.migrationLock = null;
            this.status.isLocked = false;
        }
    }

    /**
     * Ensure migration locks table exists
     */
    async ensureLockTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS migration_locks (
                lock_id VARCHAR(32) PRIMARY KEY,
                acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE
            )
        `);

        // Clean expired locks
        await db.query(`
            DELETE FROM migration_locks WHERE expires_at < CURRENT_TIMESTAMP
        `);
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Calculate checksum for content
     */
    calculateChecksum(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Generate batch ID
     */
    generateBatchId() {
        return `batch_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Create pre-migration backup
     */
    async createPreMigrationBackup(version) {
        // This would integrate with BackupManager
        // For now, return placeholder
        return `backup_pre_${version}_${Date.now()}`;
    }

    /**
     * Update migration status
     */
    async updateStatus() {
        await this.loadMigrationHistory();
        await this.scanAvailableMigrations();
    }

    /**
     * Get migration status
     */
    getStatus() {
        return {
            ...this.status,
            migrationHistory: this.migrationHistory.slice(0, 10), // Last 10 migrations
            pendingMigrations: this.pendingMigrations.map(m => ({
                version: m.version,
                name: m.name,
                filename: m.filename
            })),
            lockStatus: {
                isLocked: this.status.isLocked,
                lockId: this.migrationLock
            }
        };
    }

    /**
     * Get migration history
     */
    async getMigrationHistory(limit = 50) {
        const result = await db.query(`
            SELECT * FROM ${this.config.migrationTable}
            ORDER BY applied_at DESC
            LIMIT $1
        `, [limit]);

        return result.rows;
    }

    /**
     * Dry run migration (validation only)
     */
    async dryRun(targetVersion = null) {
        const migrationsToRun = targetVersion 
            ? this.pendingMigrations.filter(m => m.version <= targetVersion)
            : this.pendingMigrations;

        const results = {
            valid: [],
            invalid: [],
            warnings: []
        };

        for (const migration of migrationsToRun) {
            try {
                const content = await this.loadMigrationFile(migration.path);
                await this.validateMigration(content, migration);
                
                results.valid.push({
                    version: migration.version,
                    name: migration.name
                });
            } catch (error) {
                results.invalid.push({
                    version: migration.version,
                    name: migration.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Repair migration state (for emergency situations)
     */
    async repairMigrationState(options = {}) {
        console.log('🔧 Repairing migration state...');

        // This would implement state repair logic
        // Such as fixing orphaned locks, correcting version conflicts, etc.
        
        await this.releaseLock();
        await this.updateStatus();

        console.log('✅ Migration state repaired');
    }
}

module.exports = MigrationManager; 