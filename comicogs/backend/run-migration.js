const fs = require('fs');
const path = require('path');
const { query } = require('./db');

const migrationFilePath = path.join(__dirname, 'migrations', '006_create_initial_schema.sql');

async function runMigration() {
  try {
    // Drop all tables before applying the new schema
    console.log('Dropping all tables...');
    await query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Tables dropped successfully.');

    const sql = fs.readFileSync(migrationFilePath, 'utf8');
    console.log('Applying migration:', migrationFilePath);
    await query(sql);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    // The process will exit, so no need to explicitly end the pool.
  }
}

runMigration();
