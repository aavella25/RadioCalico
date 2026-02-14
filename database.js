const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create/connect to database file
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database schema
function initializeDatabase() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('📋 Users table ready');
    }
  });
  
  // Create ratings table
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id TEXT NOT NULL,
      artist TEXT,
      title TEXT,
      user_id TEXT NOT NULL,
      rating TEXT NOT NULL CHECK(rating IN ('up', 'down')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(song_id, user_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating ratings table:', err.message);
    } else {
      console.log('⭐ Ratings table ready');
      insertSampleData();
    }
  });
  
  // Create index for faster rating lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON ratings(song_id)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err.message);
    }
  });
}

// Insert sample data if table is empty
function insertSampleData() {
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }
    
    if (row.count === 0) {
      const sampleUsers = [
        ['Alice Johnson', 'alice@example.com'],
        ['Bob Smith', 'bob@example.com'],
        ['Carol Williams', 'carol@example.com']
      ];

      const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
      
      sampleUsers.forEach(user => {
        stmt.run(user, (err) => {
          if (err) console.error(err.message);
        });
      });
      
      stmt.finalize(() => {
        console.log('✨ Sample data inserted');
      });
    }
  });
}

// Export database connection
module.exports = db;
