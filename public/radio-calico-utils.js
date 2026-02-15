/**
 * Utility functions extracted from radio-calico.js for testing
 * These are pure functions that can be tested in isolation
 */

/**
 * Generate song ID from artist and title
 * @param {string} artist - Artist name
 * @param {string} title - Song title
 * @returns {string|null} - Base64 encoded song ID or null if invalid
 */
function generateSongId(artist, title) {
  if (!artist || !title || artist === '—' || title === 'Loading...') {
    return null;
  }
  return btoa(artist + '::' + title);
}

/**
 * Generate or retrieve user ID
 * @param {Storage} storage - localStorage or mock storage
 * @returns {string} - User ID
 */
function getUserId(storage = localStorage) {
  let userId = storage.getItem('radioCalicoUserId');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    storage.setItem('radioCalicoUserId', userId);
  }
  return userId;
}

/**
 * Parse metadata from API response
 * @param {Object} data - Raw metadata from API
 * @returns {Object} - Parsed metadata
 */
function parseMetadata(data) {
  return {
    title: data.title || 'Unknown Track',
    artist: data.artist || 'Unknown Artist',
    album: data.album || null,
    date: data.date || null,
    bitDepth: data.bit_depth || '16',
    sampleRate: data.sample_rate || 44100,
    isNew: data.is_new || false,
    isSummer: data.is_summer || false,
    isVidgames: data.is_vidgames || false
  };
}

/**
 * Validate rating value
 * @param {string} rating - Rating value ('up' or 'down')
 * @returns {boolean} - True if valid
 */
function isValidRating(rating) {
  return rating === 'up' || rating === 'down';
}

// Export for testing (CommonJS for Node, works in browser too)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSongId,
    getUserId,
    parseMetadata,
    isValidRating
  };
}
