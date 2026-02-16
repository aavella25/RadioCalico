/**
 * Database configuration module
 * Automatically selects SQLite or PostgreSQL based on NODE_ENV
 */

const env = process.env.NODE_ENV || 'development';
const usePostgres = process.env.USE_POSTGRES === 'true' || env === 'production';

console.log(`🗄️  Database mode: ${usePostgres ? 'PostgreSQL' : 'SQLite'} (${env})`);

// Export the appropriate database module
module.exports = usePostgres
  ? require('./database-postgres')
  : require('./database');
