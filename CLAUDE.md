# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radio Calico is a web-based streaming radio station with HLS lossless audio streaming and an integrated song rating system. The application features:

- **Backend**: Node.js Express server with SQLite database
- **Frontend**: Single-page application with HLS.js for streaming
- **Stream Source**: CloudFront-hosted HLS stream at `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Design**: Retro-futuristic UI with amber/brass color scheme (distinct from the mint/green brand style guide in `RadioCalicoStyle/`)

## Development Commands

### Starting the Server
```bash
# Development mode with auto-restart on file changes
npm run dev

# Production mode
npm start
```

The server runs on port 3000 by default. Access at `http://localhost:3000`.

### Running Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Suite**: 63 tests covering backend ratings API and frontend utility functions. Tests use in-memory SQLite database for isolation and speed (~2 seconds for full suite).

### Database Management
- Database file: `database.db` (auto-created on first run)
- To reset database: delete `database.db` and restart server
- Sample users are automatically inserted on first initialization

## File Structure

### Root Directory
```
radiocalico/
├── server.js              # Express server and API routes (exportable for testing)
├── database.js            # SQLite database setup and queries
├── package.json           # Node.js dependencies and scripts
├── database.db            # SQLite database file (auto-generated)
├── CLAUDE.md              # This file - project documentation
├── RadioCalico_Style_Guide.txt  # Brand style guide reference
├── server.test.js         # Backend integration tests (25 tests)
├── frontend.test.js       # Frontend unit tests (38 tests)
├── test-helpers.js        # Test utilities (in-memory database setup)
├── TESTING.md             # Testing guide and documentation
├── TEST_SUMMARY.md        # Test results and coverage analysis
├── .testing-quick-ref.md  # Quick reference for testing commands
├── public/                # Static files served by Express
│   ├── index.html         # Main HTML structure (149 lines)
│   ├── radio-calico.css   # All styling (875 lines)
│   ├── radio-calico.js    # All functionality (503 lines)
│   ├── radio-calico-utils.js  # Extracted testable functions
│   ├── app.js             # Legacy demo file (not used)
│   └── style.css          # Legacy demo file (not used)
└── RadioCalicoStyle/      # Brand assets (reference only, not used in app)
```

### Active Files (Current Implementation)
- **index.html** - Clean HTML structure with semantic markup
- **radio-calico.css** - Retro-futuristic amber/brass theme with animations
- **radio-calico.js** - HLS streaming, metadata polling, rating system, user management
- **radio-calico-utils.js** - Pure utility functions (song ID generation, user ID management, metadata parsing, rating validation)

### Test Files
- **server.test.js** - Backend integration tests for ratings API (Jest + Supertest)
- **frontend.test.js** - Frontend unit tests for utility functions (Jest)
- **test-helpers.js** - Test infrastructure (in-memory database setup/teardown)
- **TESTING.md** - Comprehensive testing documentation
- **TEST_SUMMARY.md** - Test results and coverage report
- **.testing-quick-ref.md** - Quick reference card

### Legacy Files (Not Currently Used)
- **app.js** - Original user management demo
- **style.css** - Original demo styles
- **RadioCalicoStyle/** - Older mint/green brand guide (reference only)

## Architecture

### Backend Structure (`server.js` + `database.js`)

**Server** ([server.js](server.js)):
- Express app serving static files from `public/`
- RESTful API endpoints for users and ratings
- SPA fallback route (serves index.html for all non-API routes)
- Graceful shutdown with database cleanup
- Exports app for testing (starts server only when run directly)

**Database** ([database.js](database.js)):
- SQLite3 connection and schema initialization
- Two tables: `users` and `ratings`
- Index on `ratings.song_id` for performance
- Automatic sample data insertion

### API Endpoints

**User Management** (legacy demo feature):
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (requires name, email)
- `DELETE /api/users/:id` - Delete user

**Song Ratings**:
- `GET /api/ratings/:songId?userId=xxx` - Get rating counts and user's vote
- `POST /api/ratings` - Submit/update rating (requires songId, userId, rating, optional artist/title)
  - Rating validation: must be 'up' or 'down'
  - One vote per song per user (enforced by UNIQUE constraint)
  - Updates existing vote if user rates same song again

**Health Check**:
- `GET /api/health` - Server status

### Frontend Architecture

The frontend follows a clean separation of concerns with three main files:

**HTML Structure** ([public/index.html](public/index.html) - 149 lines):
- Semantic HTML5 markup
- Links to external CSS and JavaScript
- HLS.js library loaded from CDN
- Google Fonts (Orbitron, Share Tech Mono)
- Audio element for streaming
- Sections: Header, Radio Player, Now Playing, Audio Quality, Visualizer, Controls, History, User Management

**Styling** ([public/radio-calico.css](public/radio-calico.css) - 875 lines):
- Retro-futuristic amber/brass theme
- CSS custom properties (variables) for colors
- Animations: fade-in, glow, pulse, scan, slide-in
- Responsive design with mobile breakpoints
- CRT-style effects: scanlines, noise overlay
- Component styles: buttons, forms, cards, visualizer

**Functionality** ([public/radio-calico.js](public/radio-calico.js) - 503 lines):
- HLS stream initialization and playback control
- Audio visualizer using Web Audio API
- Metadata polling (10-second intervals)
- Song rating system with localStorage user IDs
- Recently played history display
- User directory management (legacy feature)
- Volume control and UI state management

**Utility Functions** ([public/radio-calico-utils.js](public/radio-calico-utils.js)):
- Pure functions extracted for testability
- `generateSongId(artist, title)` - Base64 encoding for song IDs
- `getUserId(storage)` - User ID generation and retrieval
- `parseMetadata(data)` - Metadata parsing with defaults
- `isValidRating(rating)` - Rating validation ('up' or 'down')
- Fully tested with 100% code coverage

**Key Frontend Features**:
- **Audio Player**: HLS streaming with play/pause, volume control, and visual equalizer
- **Metadata Display**: Shows current artist and title from HLS stream metadata
- **Rating System**: Thumbs up/down buttons with vote counts
  - User IDs stored in localStorage (`radioCalicoUserId`)
  - Buttons disabled after voting
  - Visual feedback for user's vote
- **Song ID Generation**: Base64 encoding of `artist + "|" + title`

**Legacy Files**:
- `public/app.js` - Original user management demo (not used in current Radio Calico)
- `public/style.css` - Original demo styles (not used in current Radio Calico)

### Data Flow

1. **Stream Playback**: Frontend loads HLS stream → hls.js handles adaptive bitrate → audio element plays
2. **Metadata Updates**: HLS stream emits metadata → JavaScript parses → UI updates artist/title → fetches ratings
3. **Rating Submission**: User clicks thumb → POST to `/api/ratings` → database stores vote → UI updates counts and disables buttons

### Database Schema

**users table**:
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `email` (TEXT NOT NULL UNIQUE)
- `created_at` (DATETIME)

**ratings table**:
- `id` (INTEGER PRIMARY KEY)
- `song_id` (TEXT NOT NULL) - Base64 of "artist|title"
- `artist` (TEXT)
- `title` (TEXT)
- `user_id` (TEXT NOT NULL) - From localStorage
- `rating` (TEXT NOT NULL) - 'up' or 'down' only
- `created_at` (DATETIME)
- UNIQUE constraint on (song_id, user_id)
- Index on song_id for performance

## Testing Architecture

### Test Framework
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library for API testing
- **In-memory SQLite** - Isolated test database (`:memory:`)

### Backend Tests ([server.test.js](server.test.js))
**25 integration tests** covering:
- Rating creation (POST /api/ratings)
- Rating retrieval (GET /api/ratings/:songId)
- Vote updates (changing from up to down and vice versa)
- Input validation (missing fields, invalid values)
- Edge cases (unicode, special characters, concurrent operations)
- User context tracking (query params and headers)
- Health check endpoint

**Test Strategy**: Pragmatic integration tests focusing on high-value API paths. Each test uses fresh in-memory database for isolation.

### Frontend Tests ([frontend.test.js](frontend.test.js))
**38 unit tests** covering:
- Song ID generation (Base64 encoding consistency)
- User ID management (localStorage persistence)
- Metadata parsing (defaults and optional fields)
- Rating validation (accept 'up'/'down', reject invalid)
- Integration scenarios (song changes, rating workflows)

**Test Strategy**: Unit tests for pure utility functions with mocked dependencies (localStorage, etc.)

### Test Helpers ([test-helpers.js](test-helpers.js))
- `createTestDatabase()` - Creates in-memory SQLite with full schema
- `closeDatabase(db)` - Clean database cleanup
- Fast test execution (~2 seconds for 63 tests)

### Coverage
```
File                    | Coverage
------------------------|----------
radio-calico-utils.js   | 100%
server.js (ratings API) | 46% (focused on critical paths)
```

### Test Isolation
- Each test suite uses fresh in-memory database
- Database cleared between individual tests
- No impact on production `database.db` file
- Tests run in parallel for speed
- Mocked localStorage for frontend tests

### Running Tests
See Development Commands section above for test commands.

## Styling and Design

The active UI uses a **retro-futuristic amber/brass theme** with:
- Primary colors: Amber (#ff9500), Warm Black (#1a1410), Brass (#b8860b)
- Fonts: Orbitron (headings), Share Tech Mono (body)
- CRT-style scanlines, glow effects, and noise texture overlay

**Note**: The `RadioCalicoStyle/` directory contains an **older brand style guide** (mint/green/teal palette) that is NOT currently used in the application. The logo and style guide are reference materials only.

## Important Notes

- **Stream URL** is defined in [public/radio-calico.js](public/radio-calico.js) (line ~21). Update there if stream source changes.
- **User IDs** are browser-local only (localStorage), not tied to actual user accounts
- **Rating updates** are allowed - users can change their vote for the same song
- **Port conflicts**: If port 3000 is in use, modify `PORT` constant in server.js
- **Test suite**: 63 tests covering ratings API and frontend utilities (run with `npm test`)
- **No build process**: Frontend is vanilla HTML/CSS/JS, no bundler required
- **Separation of concerns**: HTML (structure), CSS (styling), and JS (functionality) are in separate files for maintainability
- **Test-driven development**: Backend tests use in-memory database; frontend tests use extracted pure functions

## Common Development Tasks

### Adding New API Endpoints
1. Add route handler in [server.js](server.js)
2. If new table needed, update schema in [database.js](database.js)
3. Write integration test in [server.test.js](server.test.js)
4. Run tests with `npm test` to verify
5. Test endpoint manually with curl or browser dev tools

### Modifying the Stream UI
1. Edit [public/radio-calico.css](public/radio-calico.css) for styling changes
2. Edit [public/radio-calico.js](public/radio-calico.js) for functionality changes
3. Edit [public/index.html](public/index.html) for HTML structure changes
4. Hard refresh browser (Ctrl+F5) to see changes

### Changing the Stream Source
1. Update `streamUrl` variable in [public/radio-calico.js](public/radio-calico.js) (~line 21)
2. Ensure new stream is HLS format (.m3u8) and includes timed metadata for song info

### Database Migrations
This project has no formal migration system. To add columns/tables:
1. Update schema in [database.js](database.js) `initializeDatabase()`
2. For production: manually alter tables or delete database.db to rebuild (loses data)

### Running and Writing Tests
1. Run all tests: `npm test`
2. Run in watch mode: `npm run test:watch` (re-runs on file changes)
3. Generate coverage: `npm run test:coverage`
4. Add backend tests to [server.test.js](server.test.js) using Supertest
5. Add frontend tests to [frontend.test.js](frontend.test.js) for pure functions
6. Extract testable functions to [public/radio-calico-utils.js](public/radio-calico-utils.js)
7. See [TESTING.md](TESTING.md) for comprehensive testing guide
8. See [.testing-quick-ref.md](.testing-quick-ref.md) for quick reference

**Test Philosophy**: Pragmatic testing focused on high-value paths. Backend uses integration tests with in-memory database. Frontend tests pure utility functions. See TEST_SUMMARY.md for detailed coverage report.

### Style Guide
the style guide is called RadioCalico_Style_Guide.txt

