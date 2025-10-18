# Database Setup

This directory contains the database schema and setup files for BetaFlow.

## Quick Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. **Run the setup script**:
   ```bash
   npm run setup-db
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

## Manual Setup

If the automated setup doesn't work:

1. **Create the database**:
   ```bash
   /opt/homebrew/opt/postgresql@15/bin/psql -c "CREATE DATABASE financial_track;"
   ```

2. **Run the schema**:
   ```bash
   /opt/homebrew/opt/postgresql@15/bin/psql financial_track -f database/schema.sql
   ```

3. **Add sample data** (optional):
   ```bash
   /opt/homebrew/opt/postgresql@15/bin/psql financial_track -f database/seed.sql
   ```

## Files

- `schema.sql` - Database table definitions
- `seed.sql` - Sample data for development
- `README.md` - This file

## Troubleshooting

- **"database does not exist"**: Run the setup script
- **"permission denied"**: Check PostgreSQL is running
- **"psql not found"**: Add PostgreSQL to your PATH or use full path

## Why Database Data Isn't Shared

Database data (users, portfolios) is stored locally in PostgreSQL and is **not** shared via git. Each developer needs to:

1. Set up their own local database
2. Run the schema to create tables
3. Optionally add sample data

This is normal for development - production databases are separate and managed differently.
