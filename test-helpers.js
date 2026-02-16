const sqlite3 = require('sqlite3').verbose();

/**
 * Create an in-memory database for testing
 * This ensures tests are isolated and fast
 */
function createTestDatabase() {
  const db = new sqlite3.Database(':memory:');

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create ratings table
      db.run(`
        CREATE TABLE ratings (
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
        if (err) reject(err);
      });

      // Create index
      db.run(`
        CREATE INDEX idx_ratings_song_id ON ratings(song_id)
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  });
}

/**
 * Clean up database after tests
 */
function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  createTestDatabase,
  closeDatabase
};
