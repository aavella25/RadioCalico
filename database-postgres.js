const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'radiocalico',
  user: process.env.POSTGRES_USER || 'radiocalico',
  password: process.env.POSTGRES_PASSWORD || 'radiocalico',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

// Initialize database schema
async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Users table ready');

    // Create ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        song_id TEXT NOT NULL,
        artist TEXT,
        title TEXT,
        user_id TEXT NOT NULL,
        rating TEXT NOT NULL CHECK(rating IN ('up', 'down')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_id, user_id)
      )
    `);
    console.log('⭐ Ratings table ready');

    // Create index for faster rating lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON ratings(song_id)
    `);

    // Insert sample data if table is empty
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      const sampleUsers = [
        ['Alice Johnson', 'alice@example.com'],
        ['Bob Smith', 'bob@example.com'],
        ['Carol Williams', 'carol@example.com']
      ];

      for (const [name, email] of sampleUsers) {
        await client.query(
          'INSERT INTO users (name, email) VALUES ($1, $2)',
          [name, email]
        );
      }
      console.log('✨ Sample data inserted');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Wrapper functions to match SQLite API
const db = {
  // Execute a query (for SELECT, INSERT, UPDATE, DELETE)
  async query(text, params) {
    return pool.query(text, params);
  },

  // Get a single row (matches SQLite db.get)
  async get(sql, params, callback) {
    try {
      // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
      const pgSql = sql.replace(/\?/g, () => {
        const index = (sql.match(/\?/g) || []).indexOf('?') + 1;
        return `$${index}`;
      });

      const result = await pool.query(pgSql, params);
      callback(null, result.rows[0]);
    } catch (error) {
      callback(error);
    }
  },

  // Get all rows (matches SQLite db.all)
  async all(sql, params, callback) {
    try {
      // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
      let paramIndex = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

      const result = await pool.query(pgSql, params);
      callback(null, result.rows);
    } catch (error) {
      callback(error);
    }
  },

  // Run a query (matches SQLite db.run)
  async run(sql, params, callback) {
    try {
      // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
      let paramIndex = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

      const result = await pool.query(pgSql, params);

      // Mock SQLite's this.lastID and this.changes
      const mockThis = {
        lastID: result.rows[0]?.id,
        changes: result.rowCount
      };

      callback?.call(mockThis, null);
    } catch (error) {
      callback?.(error);
    }
  },

  // Close connection (matches SQLite db.close)
  async close(callback) {
    try {
      await pool.end();
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }
};

// Initialize database on startup
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = db;
