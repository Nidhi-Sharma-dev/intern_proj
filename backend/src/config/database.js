const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('PostgreSQL connected successfully');
    console.log('Database timestamp:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Check your .env file and PostgreSQL service');
    return false;
  }
};

// Execute a query
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
};

// Get a client from the pool for transactions
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Set a timeout of 5 seconds
  const timeout = setTimeout(() => {
    console.error('Client checkout timeout');
    client.release();
  }, 5000);
  
  // Override release method to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    client.release();
  };
  
  return { query, release };
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};