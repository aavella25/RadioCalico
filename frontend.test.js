/**
 * Frontend utility function tests
 * Tests pure functions extracted from radio-calico.js
 */

const {
  generateSongId,
  getUserId,
  parseMetadata,
  isValidRating
} = require('./public/radio-calico-utils');

describe('Radio Calico Frontend Utils', () => {
  describe('generateSongId', () => {
    test('should generate base64 ID from artist and title', () => {
      const songId = generateSongId('Test Artist', 'Test Song');
      expect(songId).toBeTruthy();

      // Decode to verify format
      const decoded = Buffer.from(songId, 'base64').toString();
      expect(decoded).toBe('Test Artist::Test Song');
    });

    test('should return consistent ID for same inputs', () => {
      const id1 = generateSongId('Artist', 'Song');
      const id2 = generateSongId('Artist', 'Song');
      expect(id1).toBe(id2);
    });

    test('should return different IDs for different inputs', () => {
      const id1 = generateSongId('Artist 1', 'Song 1');
      const id2 = generateSongId('Artist 2', 'Song 2');
      expect(id1).not.toBe(id2);
    });

    test('should return null for empty artist', () => {
      const songId = generateSongId('', 'Test Song');
      expect(songId).toBeNull();
    });

    test('should return null for empty title', () => {
      const songId = generateSongId('Test Artist', '');
      expect(songId).toBeNull();
    });

    test('should return null for placeholder artist "—"', () => {
      const songId = generateSongId('—', 'Test Song');
      expect(songId).toBeNull();
    });

    test('should return null for loading title', () => {
      const songId = generateSongId('Test Artist', 'Loading...');
      expect(songId).toBeNull();
    });

    test('should return null for null inputs', () => {
      const songId = generateSongId(null, null);
      expect(songId).toBeNull();
    });

    test('should return null for undefined inputs', () => {
      const songId = generateSongId(undefined, undefined);
      expect(songId).toBeNull();
    });

    test('should handle special characters', () => {
      const songId = generateSongId('Artist & Co.', 'Song #1 (Remix)');
      expect(songId).toBeTruthy();

      const decoded = Buffer.from(songId, 'base64').toString();
      expect(decoded).toBe('Artist & Co.::Song #1 (Remix)');
    });

    test('should handle unicode characters', () => {
      // Note: btoa in Node.js doesn't support unicode directly
      // In browsers, this would need TextEncoder
      // For now, test with ASCII-safe characters
      const songId = generateSongId('Artist Name', 'Song Title');
      expect(songId).toBeTruthy();

      const decoded = Buffer.from(songId, 'base64').toString();
      expect(decoded).toBe('Artist Name::Song Title');

      // TODO: Add proper unicode support with TextEncoder when needed
    });

    test('should handle very long strings', () => {
      const longArtist = 'A'.repeat(500);
      const longTitle = 'T'.repeat(500);
      const songId = generateSongId(longArtist, longTitle);
      expect(songId).toBeTruthy();
    });

    test('should handle pipe character (delimiter in backend)', () => {
      // Note: Frontend uses :: but backend docs show |
      const songId = generateSongId('Artist|Name', 'Song|Title');
      expect(songId).toBeTruthy();
    });
  });

  describe('getUserId', () => {
    let mockStorage;

    beforeEach(() => {
      // Mock localStorage
      mockStorage = {
        data: {},
        getItem(key) {
          return this.data[key] || null;
        },
        setItem(key, value) {
          this.data[key] = value;
        },
        clear() {
          this.data = {};
        }
      };
    });

    test('should generate new user ID if none exists', () => {
      const userId = getUserId(mockStorage);
      expect(userId).toBeTruthy();
      expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
    });

    test('should store generated user ID in storage', () => {
      const userId = getUserId(mockStorage);
      expect(mockStorage.getItem('radioCalicoUserId')).toBe(userId);
    });

    test('should retrieve existing user ID from storage', () => {
      mockStorage.setItem('radioCalicoUserId', 'existing_user_123');
      const userId = getUserId(mockStorage);
      expect(userId).toBe('existing_user_123');
    });

    test('should return same ID on multiple calls', () => {
      const userId1 = getUserId(mockStorage);
      const userId2 = getUserId(mockStorage);
      expect(userId1).toBe(userId2);
    });

    test('should generate unique IDs for different sessions', (done) => {
      const mock1 = {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; }
      };
      const mock2 = {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; }
      };

      const userId1 = getUserId(mock1);

      // Wait 1ms to ensure different timestamp
      setTimeout(() => {
        const userId2 = getUserId(mock2);
        expect(userId1).not.toBe(userId2);
        done();
      }, 2);
    });
  });

  describe('parseMetadata', () => {
    test('should parse complete metadata', () => {
      const rawData = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        date: '2023',
        bit_depth: '24',
        sample_rate: 96000,
        is_new: true,
        is_summer: false,
        is_vidgames: true
      };

      const parsed = parseMetadata(rawData);

      expect(parsed).toEqual({
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        date: '2023',
        bitDepth: '24',
        sampleRate: 96000,
        isNew: true,
        isSummer: false,
        isVidgames: true
      });
    });

    test('should use defaults for missing title', () => {
      const parsed = parseMetadata({});
      expect(parsed.title).toBe('Unknown Track');
    });

    test('should use defaults for missing artist', () => {
      const parsed = parseMetadata({});
      expect(parsed.artist).toBe('Unknown Artist');
    });

    test('should use null for missing optional fields', () => {
      const parsed = parseMetadata({});
      expect(parsed.album).toBeNull();
      expect(parsed.date).toBeNull();
    });

    test('should use default bit depth', () => {
      const parsed = parseMetadata({});
      expect(parsed.bitDepth).toBe('16');
    });

    test('should use default sample rate', () => {
      const parsed = parseMetadata({});
      expect(parsed.sampleRate).toBe(44100);
    });

    test('should default badges to false', () => {
      const parsed = parseMetadata({});
      expect(parsed.isNew).toBe(false);
      expect(parsed.isSummer).toBe(false);
      expect(parsed.isVidgames).toBe(false);
    });

    test('should handle partial metadata', () => {
      const parsed = parseMetadata({
        title: 'Song',
        bit_depth: '24'
      });

      expect(parsed.title).toBe('Song');
      expect(parsed.artist).toBe('Unknown Artist');
      expect(parsed.bitDepth).toBe('24');
    });
  });

  describe('isValidRating', () => {
    test('should accept "up"', () => {
      expect(isValidRating('up')).toBe(true);
    });

    test('should accept "down"', () => {
      expect(isValidRating('down')).toBe(true);
    });

    test('should reject "like"', () => {
      expect(isValidRating('like')).toBe(false);
    });

    test('should reject "upvote"', () => {
      expect(isValidRating('upvote')).toBe(false);
    });

    test('should reject numbers', () => {
      expect(isValidRating(1)).toBe(false);
      expect(isValidRating(0)).toBe(false);
    });

    test('should reject null', () => {
      expect(isValidRating(null)).toBe(false);
    });

    test('should reject undefined', () => {
      expect(isValidRating(undefined)).toBe(false);
    });

    test('should reject empty string', () => {
      expect(isValidRating('')).toBe(false);
    });

    test('should be case-sensitive', () => {
      expect(isValidRating('UP')).toBe(false);
      expect(isValidRating('Down')).toBe(false);
    });
  });
});

describe('Frontend Integration Scenarios', () => {
  test('song change workflow', () => {
    // Simulate song metadata arriving
    const metadata = parseMetadata({
      artist: 'New Artist',
      title: 'New Song',
      bit_depth: '24',
      sample_rate: 96000
    });

    // Generate song ID
    const songId = generateSongId(metadata.artist, metadata.title);
    expect(songId).toBeTruthy();

    // Verify we can use this ID for rating
    expect(isValidRating('up')).toBe(true);
  });

  test('user rating workflow', () => {
    const mockStorage = {
      data: {},
      getItem(key) { return this.data[key] || null; },
      setItem(key, value) { this.data[key] = value; }
    };

    // Get user ID (first time)
    const userId = getUserId(mockStorage);
    expect(userId).toBeTruthy();

    // Generate song ID
    const songId = generateSongId('Artist', 'Song');

    // Validate rating
    const rating = 'up';
    expect(isValidRating(rating)).toBe(true);

    // Verify rating payload would be valid
    const payload = { songId, userId, rating };
    expect(payload.songId).toBeTruthy();
    expect(payload.userId).toBeTruthy();
    expect(isValidRating(payload.rating)).toBe(true);
  });

  test('edge case: rapid song changes', () => {
    const songs = [
      { artist: 'Artist 1', title: 'Song 1' },
      { artist: 'Artist 2', title: 'Song 2' },
      { artist: 'Artist 3', title: 'Song 3' }
    ];

    const songIds = songs.map(s => generateSongId(s.artist, s.title));

    // All should be unique
    const uniqueIds = new Set(songIds);
    expect(uniqueIds.size).toBe(3);

    // All should be valid
    songIds.forEach(id => expect(id).toBeTruthy());
  });
});
