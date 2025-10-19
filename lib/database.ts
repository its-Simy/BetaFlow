import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const connectDb = async () => {
  try {
    await pool.connect();
    console.log('Connected to PostgreSQL database');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database', err);
    process.exit(1);
  }
};

export const disconnectDb = async () => {
  await pool.end();
  console.log('Disconnected from PostgreSQL database');
};

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('Database pool connected successfully'))
  .catch(err => console.error('Database pool connection failed:', err));
