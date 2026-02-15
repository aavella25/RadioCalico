const request = require('supertest');
const { createTestDatabase, closeDatabase } = require('./test-helpers');

// Create a module that exports a proxy to the test database
const mockDb = {};

jest.mock('./database', () => {
  // Return a proxy that forwards all calls to mockDb
  return new Proxy({}, {
    get: (target, prop) => {
      if (mockDb.instance && typeof mockDb.instance[prop] === 'function') {
        return mockDb.instance[prop].bind(mockDb.instance);
      }
      return mockDb.instance?.[prop];
    }
  });
});

const app = require('./server');

describe('Radio Calico Ratings API', () => {
  beforeAll(async () => {
    mockDb.instance = await createTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase(mockDb.instance);
  });

  beforeEach((done) => {
    // Clear ratings table before each test
    mockDb.instance.run('DELETE FROM ratings', done);
  });

  describe('POST /api/ratings', () => {
    const validRating = {
      songId: 'dGVzdHNvbmc=',
      artist: 'Test Artist',
      title: 'Test Song',
      userId: 'user123',
      rating: 'up'
    };

    test('should create a new rating successfully', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send(validRating)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Rating saved successfully',
        rating: 'up',
        updated: false
      });
      expect(response.body.id).toBeDefined();
    });

    test('should reject missing songId', async () => {
      const { songId, ...invalidRating } = validRating;

      const response = await request(app)
        .post('/api/ratings')
        .send(invalidRating)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    test('should reject missing userId', async () => {
      const { userId, ...invalidRating } = validRating;

      const response = await request(app)
        .post('/api/ratings')
        .send(invalidRating)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    test('should reject missing rating', async () => {
      const { rating, ...invalidRating } = validRating;

      const response = await request(app)
        .post('/api/ratings')
        .send(invalidRating)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    test('should reject invalid rating value "like"', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({ ...validRating, rating: 'like' })
        .expect(400);

      expect(response.body.error).toBe('Rating must be "up" or "down"');
    });

    test('should reject invalid rating value "upvote"', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({ ...validRating, rating: 'upvote' })
        .expect(400);

      expect(response.body.error).toBe('Rating must be "up" or "down"');
    });

    test('should reject invalid rating value 1', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({ ...validRating, rating: 1 })
        .expect(400);

      expect(response.body.error).toBe('Rating must be "up" or "down"');
    });

    test('should accept rating "down"', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({ ...validRating, rating: 'down' })
        .expect(200);

      expect(response.body.rating).toBe('down');
    });

    test('should update existing rating from up to down', async () => {
      // First rating
      await request(app)
        .post('/api/ratings')
        .send(validRating)
        .expect(200);

      // Update to down
      const response = await request(app)
        .post('/api/ratings')
        .send({ ...validRating, rating: 'down' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Rating updated successfully',
        rating: 'down',
        updated: true
      });
    });

    test('should update existing rating from down to up', async () => {
      // First rating (down)
      await request(app)
        .post('/api/ratings')
        .send({ ...validRating, rating: 'down' })
        .expect(200);

      // Update to up
      const response = await request(app)
        .post('/api/ratings')
        .send({ ...validRating, rating: 'up' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Rating updated successfully',
        rating: 'up',
        updated: true
      });
    });

    test('should allow same songId with different userId', async () => {
      // User 1 rates
      await request(app)
        .post('/api/ratings')
        .send(validRating)
        .expect(200);

      // User 2 rates same song
      const response = await request(app)
        .post('/api/ratings')
        .send({ ...validRating, userId: 'user456' })
        .expect(200);

      expect(response.body.updated).toBe(false);
    });

    test('should store optional artist and title metadata', async () => {
      await request(app)
        .post('/api/ratings')
        .send(validRating)
        .expect(200);

      // Verify in database
      return new Promise((resolve) => {
        mockDb.instance.get(
          'SELECT artist, title FROM ratings WHERE song_id = ?',
          [validRating.songId],
          (err, row) => {
            expect(row.artist).toBe('Test Artist');
            expect(row.title).toBe('Test Song');
            resolve();
          }
        );
      });
    });

    test('should work without artist and title', async () => {
      const { artist, title, ...minimalRating } = validRating;

      const response = await request(app)
        .post('/api/ratings')
        .send(minimalRating)
        .expect(200);

      expect(response.body.message).toBe('Rating saved successfully');
    });
  });

  describe('GET /api/ratings/:songId', () => {
    const songId = 'dGVzdHNvbmc=';

    test('should return zero counts for song with no ratings', async () => {
      const response = await request(app)
        .get(`/api/ratings/${songId}`)
        .expect(200);

      expect(response.body).toEqual({
        thumbsUp: 0,
        thumbsDown: 0,
        userVote: null
      });
    });

    test('should return correct counts with multiple ratings', async () => {
      // Add 3 up votes and 2 down votes
      await request(app).post('/api/ratings').send({
        songId, userId: 'user1', rating: 'up'
      });
      await request(app).post('/api/ratings').send({
        songId, userId: 'user2', rating: 'up'
      });
      await request(app).post('/api/ratings').send({
        songId, userId: 'user3', rating: 'up'
      });
      await request(app).post('/api/ratings').send({
        songId, userId: 'user4', rating: 'down'
      });
      await request(app).post('/api/ratings').send({
        songId, userId: 'user5', rating: 'down'
      });

      const response = await request(app)
        .get(`/api/ratings/${songId}`)
        .expect(200);

      expect(response.body).toEqual({
        thumbsUp: 3,
        thumbsDown: 2,
        userVote: null
      });
    });

    test('should return userVote when userId provided in query', async () => {
      // User rates up
      await request(app).post('/api/ratings').send({
        songId, userId: 'user123', rating: 'up'
      });

      const response = await request(app)
        .get(`/api/ratings/${songId}?userId=user123`)
        .expect(200);

      expect(response.body.userVote).toBe('up');
    });

    test('should return userVote when userId provided in header', async () => {
      // User rates down
      await request(app).post('/api/ratings').send({
        songId, userId: 'user456', rating: 'down'
      });

      const response = await request(app)
        .get(`/api/ratings/${songId}`)
        .set('x-user-id', 'user456')
        .expect(200);

      expect(response.body.userVote).toBe('down');
    });

    test('should return null userVote for non-existent user', async () => {
      await request(app).post('/api/ratings').send({
        songId, userId: 'user123', rating: 'up'
      });

      const response = await request(app)
        .get(`/api/ratings/${songId}?userId=nonexistent`)
        .expect(200);

      expect(response.body.userVote).toBe(null);
    });

    test('should handle updated votes correctly', async () => {
      // User votes up
      await request(app).post('/api/ratings').send({
        songId, userId: 'user123', rating: 'up'
      });

      // User changes to down
      await request(app).post('/api/ratings').send({
        songId, userId: 'user123', rating: 'down'
      });

      const response = await request(app)
        .get(`/api/ratings/${songId}?userId=user123`)
        .expect(200);

      expect(response.body).toEqual({
        thumbsUp: 0,
        thumbsDown: 1,
        userVote: 'down'
      });
    });

    test('should handle different songs independently', async () => {
      const song1 = 'c29uZzE=';
      const song2 = 'c29uZzI=';

      await request(app).post('/api/ratings').send({
        songId: song1, userId: 'user1', rating: 'up'
      });
      await request(app).post('/api/ratings').send({
        songId: song2, userId: 'user1', rating: 'down'
      });

      const response1 = await request(app).get(`/api/ratings/${song1}`);
      const response2 = await request(app).get(`/api/ratings/${song2}`);

      expect(response1.body).toEqual({
        thumbsUp: 1, thumbsDown: 0, userVote: null
      });
      expect(response2.body).toEqual({
        thumbsUp: 0, thumbsDown: 1, userVote: null
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in songId', async () => {
      const specialSongId = 'YXJ0aXN0fHRpdGxl+/==';

      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: specialSongId,
          userId: 'user123',
          rating: 'up'
        })
        .expect(200);

      expect(response.body.message).toBe('Rating saved successfully');
    });

    test('should handle unicode characters in artist/title', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test123',
          artist: 'Артист 🎵',
          title: 'Título Canción 音楽',
          userId: 'user123',
          rating: 'up'
        })
        .expect(200);

      expect(response.body.message).toBe('Rating saved successfully');
    });

    test('should handle very long artist/title names', async () => {
      const longString = 'A'.repeat(1000);

      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test123',
          artist: longString,
          title: longString,
          userId: 'user123',
          rating: 'up'
        })
        .expect(200);

      expect(response.body.message).toBe('Rating saved successfully');
    });

    test('should handle concurrent votes from different users', async () => {
      const songId = 'concurrent-test';

      // Simulate concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app).post('/api/ratings').send({
            songId,
            userId: `user${i}`,
            rating: i % 2 === 0 ? 'up' : 'down'
          })
        );
      }

      await Promise.all(promises);

      const response = await request(app)
        .get(`/api/ratings/${songId}`)
        .expect(200);

      expect(response.body.thumbsUp).toBe(5);
      expect(response.body.thumbsDown).toBe(5);
    });
  });

  describe('GET /api/health', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
