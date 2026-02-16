const express = require('express');
const path = require('path');
const db = require('./database-config');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// GET all users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ users: rows });
  });
});

// GET single user
app.get('/api/users/:id', (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: row });
  });
});

// POST new user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  db.run(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        name,
        email,
        created_at: new Date().toISOString()
      });
    }
  );
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// GET ratings for a song
app.get('/api/ratings/:songId', (req, res) => {
  const { songId } = req.params;
  const userId = req.query.userId || req.headers['x-user-id'];
  
  // Get total counts
  db.all(
    'SELECT rating, COUNT(*) as count FROM ratings WHERE song_id = ? GROUP BY rating',
    [songId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      let thumbsUp = 0;
      let thumbsDown = 0;
      
      rows.forEach(row => {
        if (row.rating === 'up') thumbsUp = row.count;
        if (row.rating === 'down') thumbsDown = row.count;
      });
      
      // Check if this user has already voted
      if (userId) {
        db.get(
          'SELECT rating FROM ratings WHERE song_id = ? AND user_id = ?',
          [songId, userId],
          (err, userRating) => {
            res.json({
              thumbsUp,
              thumbsDown,
              userVote: userRating ? userRating.rating : null
            });
          }
        );
      } else {
        res.json({ thumbsUp, thumbsDown, userVote: null });
      }
    }
  );
});

// POST a rating
app.post('/api/ratings', (req, res) => {
  const { songId, artist, title, userId, rating } = req.body;
  
  if (!songId || !userId || !rating) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  if (rating !== 'up' && rating !== 'down') {
    res.status(400).json({ error: 'Rating must be "up" or "down"' });
    return;
  }
  
  // Check if user has already rated this song
  db.get(
    'SELECT id, rating FROM ratings WHERE song_id = ? AND user_id = ?',
    [songId, userId],
    (err, existingRating) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (existingRating) {
        // Update existing rating
        db.run(
          'UPDATE ratings SET rating = ?, created_at = CURRENT_TIMESTAMP WHERE song_id = ? AND user_id = ?',
          [rating, songId, userId],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            res.json({
              message: 'Rating updated successfully',
              id: existingRating.id,
              rating,
              updated: true
            });
          }
        );
      } else {
        // Insert new rating
        db.run(
          'INSERT INTO ratings (song_id, artist, title, user_id, rating) VALUES (?, ?, ?, ?, ?)',
          [songId, artist, title, userId, rating],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            res.json({
              message: 'Rating saved successfully',
              id: this.lastID,
              rating,
              updated: false
            });
          }
        );
      }
    }
  );
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Database ready`);
  console.log(`\n📝 API Endpoints:`);
  console.log(`   GET    /api/users           - Get all users`);
  console.log(`   GET    /api/users/:id       - Get user by ID`);
  console.log(`   POST   /api/users           - Create new user`);
  console.log(`   DELETE /api/users/:id       - Delete user`);
  console.log(`   GET    /api/ratings/:songId - Get song ratings`);
  console.log(`   POST   /api/ratings         - Rate a song`);
  console.log(`   GET    /api/health          - Health check\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
