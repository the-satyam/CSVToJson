const { Pool } = require('pg');
require('dotenv').config();

const apiconf =
  process.env.HOSTENV == 'PROD'
    ? require('../config/config.prod')
    : require('../config/config.uat'); 

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // in ms

let pool;

async function initializePool() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      pool = new Pool({
        connectionString: apiconf.pgconnectionstring,
        max: 2, // max clients in pool
        idleTimeoutMillis: 30000, // close idle clients after 30s
        connectionTimeoutMillis: 5000, // connection timeout
      });

      // Test the connection
      await pool.query('SELECT 1');
      console.log('PostgreSQL pool initialized successfully');
      break;
    } catch (err) {
      console.error(`Failed to connect to PostgreSQL (attempt ${attempt}/${MAX_RETRIES}):`, err.message);

      if (attempt === MAX_RETRIES) {
        console.error('Max retries reached. Exiting.');
        process.exit(1); // fail fast
      }

      // Exponential backoff
      await new Promise((res) => setTimeout(res, RETRY_DELAY_BASE * attempt));
    }
  }
}

initializePool();

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
