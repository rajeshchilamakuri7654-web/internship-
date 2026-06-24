require('dotenv').config();
const { Pool } = require('pg');
const mockDb = require('./mockDb');

let useMock = false;

if (!process.env.DATABASE_URL) {
  console.log('⚠️ No DATABASE_URL specified. Falling back to in-memory database mock.');
  useMock = true;
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pgPool;
if (!useMock) {
  try {
    pgPool = new Pool(poolConfig);
    // Test connection on startup
    pgPool.query('SELECT 1').then(() => {
      console.log('✅ Connected to PostgreSQL successfully.');
    }).catch(err => {
      console.error('❌ Failed to connect to PostgreSQL. Falling back to in-memory database mock.');
      useMock = true;
    });
  } catch (e) {
    console.error('❌ Error initializing PostgreSQL Pool. Falling back to in-memory database mock.');
    useMock = true;
  }
}

const pool = {
  query: async (text, params) => {
    if (useMock) {
      return mockDb.query(text, params);
    }
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('connect') || err.message.includes('timeout')) {
        console.error('❌ PostgreSQL connection lost/failed. Switching to in-memory database mock:', err.message);
        useMock = true;
        return mockDb.query(text, params);
      }
      throw err;
    }
  },
  on: (event, handler) => {
    if (pgPool && typeof pgPool.on === 'function') {
      pgPool.on(event, handler);
    } else {
      // Silent sub for mock
    }
  }
};

module.exports = { pool };

