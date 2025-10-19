const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query test successful:', result.rows[0]);
    
    // Test users table
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    console.log('✅ Users table accessible, count:', usersResult.rows[0].count);
    
    client.release();
    await pool.end();
    console.log('✅ Connection test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
