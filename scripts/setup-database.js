#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗄️  Setting up BetaFlow database...\n');

try {
  // Check if PostgreSQL is running
  console.log('1. Checking PostgreSQL connection...');
  execSync('brew services list | grep postgresql@15 | grep started', { stdio: 'pipe' });
  console.log('   ✅ PostgreSQL is running\n');

  // Create database if it doesn't exist
  console.log('2. Creating database...');
  try {
    execSync('/opt/homebrew/opt/postgresql@15/bin/psql postgres -c "CREATE DATABASE financial_track;"', { stdio: 'pipe' });
    console.log('   ✅ Database created\n');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   ✅ Database already exists\n');
    } else {
      throw error;
    }
  }

  // Run schema
  console.log('3. Running database schema...');
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  execSync(`/opt/homebrew/opt/postgresql@15/bin/psql financial_track -f "${schemaPath}"`, { stdio: 'pipe' });
  console.log('   ✅ Schema applied\n');

  // Run seed data
  console.log('4. Adding sample data...');
  const seedPath = path.join(__dirname, '../database/seed.sql');
  execSync(`/opt/homebrew/opt/postgresql@15/bin/psql financial_track -f "${seedPath}"`, { stdio: 'pipe' });
  console.log('   ✅ Sample data added\n');

  console.log('🎉 Database setup complete!');
  console.log('   You can now run: npm run dev');
  
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Make sure PostgreSQL is installed: brew install postgresql@15');
  console.log('2. Start PostgreSQL: brew services start postgresql@15');
  console.log('3. Check your .env file has correct DATABASE_URL');
  process.exit(1);
}
