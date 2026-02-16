# 📻 Radio Calico

A retro-futuristic web-based streaming radio station with HLS lossless audio streaming and an integrated song rating system.

## ✨ Features

- 🎵 **HLS Streaming** - High-quality adaptive bitrate audio streaming via CloudFront
- 📊 **Real-time Metadata** - Live display of current song, artist, and album information
- 👍👎 **Song Rating System** - Vote on tracks with thumbs up/down, see community ratings
- 📈 **Audio Visualizer** - Real-time frequency spectrum visualizer using Web Audio API
- 🕰️ **Song History** - Recently played tracks with timestamps
- 🎨 **Retro UI** - Amber/brass themed CRT-style interface with scanlines and glow effects
- 💾 **Persistent Ratings** - SQLite database stores all song ratings and metadata
- ✅ **Comprehensive Tests** - 63 tests covering backend API and frontend utilities
- 🐳 **Docker Support** - Containerized deployment for dev and production

## 🛠️ Tech Stack

**Backend:**
- Node.js with Express.js
- SQLite3 database
- RESTful API architecture
- Jest + Supertest for testing

**Frontend:**
- Vanilla JavaScript (no framework dependencies)
- HLS.js for adaptive streaming
- Web Audio API for visualization
- CSS3 animations and effects

**Streaming:**
- HLS (HTTP Live Streaming) format
- CloudFront CDN delivery
- Timed metadata for song information

**Deployment:**
- Docker & Docker Compose
- Multi-stage builds (dev/prod)
- Volume persistence

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/aavella25/RadioCalico.git
cd RadioCalico
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

4. **Run tests (optional)**
```bash
npm test
```

5. **Open your browser**
```
http://localhost:3000
```

The stream will start automatically and you'll see the current song information with rating controls.

## ⚡ Make Targets (Recommended)

Radio Calico includes a Makefile for convenient command shortcuts. This is the easiest way to manage the project!

> **Windows Users:** Use `make.bat` instead of `make` (e.g., `make.bat dev`, `make.bat test`)
>
> **Linux/Mac Users:** Use standard `make` command

### Quick Commands

```bash
# Development
make dev              # Start development environment (Docker)
make dev-local        # Start local dev server (npm)
make test             # Run all tests

# Production
make prod             # Start production (PostgreSQL + nginx)
make prod-status      # Check service health
make prod-test        # Test production deployment

# Database
make backup           # Backup production database
make db-shell         # Open PostgreSQL shell

# Management
make stop             # Stop all services
make clean            # Clean up containers
make status           # Show all service status
make help             # Show all available targets
```

### All Available Targets

Run `make help` to see the complete list of targets:

**Development:** `dev`, `dev-local`, `dev-logs`, `dev-test`, `dev-shell`
**Production:** `prod`, `prod-setup`, `prod-rebuild`, `prod-logs`, `prod-status`, `prod-test`, `prod-shell`
**Testing:** `test`, `test-watch`, `test-coverage`
**Database:** `backup`, `restore`, `db-shell`
**Management:** `install`, `stop`, `clean`, `clean-all`, `status`, `logs`

### Example Workflows

**Starting development:**
```bash
make dev              # That's it!
```

**Running tests:**
```bash
make test             # Run once
make test-watch       # Watch mode
make test-coverage    # With coverage
```

**Production deployment:**
```bash
make prod-setup       # First time only
make prod             # Start services
make prod-status      # Check health
make prod-test        # Verify deployment
```

**Database backup:**
```bash
make backup           # Creates timestamped backup
make restore FILE=backup_postgres_20260216_095000.sql
```

## 🐳 Docker Deployment

Radio Calico supports Docker for both development and production deployments.

### Quick Start with Docker

**Development:**
```bash
# Start development container with hot-reload
docker-compose up

# Or use helper script
chmod +x docker-dev.sh
./docker-dev.sh start
```

**Production:**
```bash
# Start production container
docker-compose -f docker-compose.prod.yml up -d

# Or use helper script
chmod +x docker-prod.sh
./docker-prod.sh start
```

Access at: `http://localhost:3000`

### Docker Features

**Development Container:**
- ✅ Hot-reload enabled (nodemon)
- ✅ Source code mounted
- ✅ Full dev dependencies
- ✅ Debugging support

**Production Container:**
- ✅ Optimized build (multi-stage)
- ✅ Non-root user
- ✅ Health checks
- ✅ Resource limits
- ✅ Security hardening

### Docker Commands

```bash
# Development
./docker-dev.sh start       # Start container
./docker-dev.sh logs        # View logs
./docker-dev.sh test        # Run tests
./docker-dev.sh shell       # Open shell
./docker-dev.sh stop        # Stop container

# Production
./docker-prod.sh start      # Start container
./docker-prod.sh logs       # View logs
./docker-prod.sh backup     # Backup database
./docker-prod.sh status     # Check health
./docker-prod.sh stop       # Stop container
```

**Full documentation:** See [DOCKER.md](DOCKER.md) for comprehensive Docker guide.

## 📁 Project Structure

```
radiocalico/
├── server.js                # Express server and API routes
├── database.js              # SQLite database setup and queries
├── database-config.js       # Database abstraction layer (SQLite/PostgreSQL)
├── database-postgres.js     # PostgreSQL implementation
├── package.json             # Dependencies and scripts
├── database.db              # SQLite database (auto-generated)
├── Makefile                 # Convenient make targets for dev/prod/test
├── .gitignore               # Git ignore rules
├── CLAUDE.md                # Project documentation for Claude Code
├── README.md                # This file
├── SETUP_INSTRUCTIONS.md    # Detailed setup guide
├── RATING_SYSTEM_GUIDE.md   # Rating system documentation
├── server.test.js           # Backend integration tests (25 tests)
├── frontend.test.js         # Frontend unit tests (38 tests)
├── test-helpers.js          # Test utilities and database setup
├── TESTING.md               # Testing guide and documentation
├── TEST_SUMMARY.md          # Test results and coverage report
├── .testing-quick-ref.md    # Quick reference for testing
├── Dockerfile               # Multi-stage Docker build
├── docker-compose.yml       # Development Docker Compose
├── docker-compose.prod.yml  # Production Docker Compose
├── .dockerignore            # Docker ignore rules
├── docker-dev.sh            # Development Docker helper script
├── docker-prod.sh           # Production Docker helper script
├── DOCKER.md                # Docker deployment guide
└── public/                  # Frontend files
    ├── index.html           # Main HTML structure
    ├── radio-calico.css     # Retro-futuristic styling
    ├── radio-calico.js      # Streaming and rating functionality
    └── radio-calico-utils.js # Testable utility functions
```

## 🔌 API Endpoints

### Song Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ratings/:songId?userId=xxx` | Get vote counts and user's rating for a song |
| POST | `/api/ratings` | Submit or update a rating (up/down) |

### User Management (Legacy)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get single user |
| POST | `/api/users` | Create new user |
| DELETE | `/api/users/:id` | Delete user |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status check |

### Rating API Example

**Submit a rating:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{
    "songId": "base64_encoded_song_id",
    "userId": "user_browser_id",
    "rating": "up",
    "artist": "Artist Name",
    "title": "Song Title"
  }'
```

**Get ratings for a song:**
```bash
curl "http://localhost:3000/api/ratings/song_id_here?userId=user_id_here"
```

## 🎨 Design

Radio Calico features a **retro-futuristic aesthetic** inspired by:
- 1980s CRT monitors with scanline effects
- Amber monochrome terminals
- Art deco brass accents
- Vintage audio equipment

**Color Palette:**
- Primary: Amber (#ff9500)
- Background: Warm Black (#1a1410)
- Accents: Brass (#b8860b)
- Glow effects and shadow layers

**Typography:**
- Headers: Orbitron (futuristic geometric)
- Body: Share Tech Mono (monospace terminal)

## 🎵 Stream Configuration

The HLS stream is currently configured to:
- **URL**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Format**: HLS (HTTP Live Streaming)
- **Metadata**: Timed metadata for artist/title information

To change the stream source, edit the `streamUrl` variable in `public/radio-calico.js` (around line 21).

## 🗄️ Database Schema

### `ratings` table
```sql
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id TEXT NOT NULL,
  artist TEXT,
  title TEXT,
  user_id TEXT NOT NULL,
  rating TEXT NOT NULL CHECK(rating IN ('up', 'down')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_id, user_id)
);
```

- Song IDs are Base64-encoded: `btoa(artist + "|" + title)`
- User IDs are stored in browser localStorage
- One vote per user per song (enforced by UNIQUE constraint)
- Users can update their vote by rating the same song again

## ✅ Testing

Radio Calico includes a comprehensive test suite with **63 tests** covering both backend and frontend functionality.

### Test Framework
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP integration testing
- **In-memory SQLite** - Fast, isolated test database

### Test Coverage

**Backend Tests (25 tests):**
- ✅ Rating submission (POST /api/ratings)
- ✅ Rating retrieval (GET /api/ratings/:songId)
- ✅ Vote updates (changing from up to down)
- ✅ Input validation (missing fields, invalid values)
- ✅ Edge cases (unicode, special characters, concurrent operations)
- ✅ User context tracking

**Frontend Tests (38 tests):**
- ✅ Song ID generation (Base64 encoding)
- ✅ User ID management (localStorage)
- ✅ Metadata parsing
- ✅ Rating validation
- ✅ Integration scenarios

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Results
```
Test Suites: 2 passed, 2 total
Tests:       63 passed, 63 total
Time:        ~2 seconds
Coverage:    100% on utilities, 46% on server (critical paths)
```

### Test Documentation
- **TESTING.md** - Comprehensive testing guide
- **TEST_SUMMARY.md** - Detailed coverage report
- **.testing-quick-ref.md** - Quick reference card

### Writing Tests

**Backend test example:**
```javascript
test('should create a new rating', async () => {
  const response = await request(app)
    .post('/api/ratings')
    .send({ songId: 'test', userId: 'user1', rating: 'up' })
    .expect(200);

  expect(response.body.message).toBe('Rating saved successfully');
});
```

**Frontend test example:**
```javascript
test('should generate consistent song IDs', () => {
  const id1 = generateSongId('Artist', 'Song');
  const id2 = generateSongId('Artist', 'Song');
  expect(id1).toBe(id2);
});
```

## 🔧 Development

### File Organization
- **HTML**: Structure only in `public/index.html`
- **CSS**: All styling in `public/radio-calico.css`
- **JavaScript**: All functionality in `public/radio-calico.js`
- **Utilities**: Testable functions in `public/radio-calico-utils.js`
- **Tests**: Backend in `server.test.js`, frontend in `frontend.test.js`

### Key Components
1. **HLS Player** - Initializes stream, handles playback
2. **Metadata Polling** - Fetches song info every 10 seconds
3. **Rating System** - Manages votes, updates UI
4. **Visualizer** - Web Audio API frequency analysis
5. **History Display** - Shows recently played tracks

### Making Changes

**Update styling:**
Edit `public/radio-calico.css` and hard refresh (Ctrl+F5)

**Modify functionality:**
Edit `public/radio-calico.js` - server restarts automatically in dev mode

**Change stream source:**
Update `streamUrl` in `public/radio-calico.js`

**Database changes:**
Edit schema in `database.js`, then delete `database.db` to rebuild

**Add new tests:**
Add backend tests to `server.test.js` or frontend tests to `frontend.test.js`

## 💡 Tips

- **Port conflicts**: Change `PORT` in `server.js` if port 3000 is in use
- **Database reset**: Delete `database.db` and restart to clear all data
- **User ID**: Stored in localStorage as `radioCalicoUserId`
- **Hard refresh**: Use Ctrl+F5 to clear cached CSS/JS after changes
- **Stream issues**: Check browser console for HLS.js errors
- **Test in watch mode**: Run `npm run test:watch` during development
- **Check coverage**: Run `npm run test:coverage` to see what's tested

## 🐛 Troubleshooting

**Stream won't play:**
- Check browser console for errors
- Verify stream URL is accessible
- Ensure browser supports HLS (most modern browsers do)

**Ratings not saving:**
- Check network tab for API errors
- Verify database.db exists and has write permissions
- Check server logs for SQLite errors

**No audio visualizer:**
- Click play button first (Web Audio requires user interaction)
- Check if browser supports Web Audio API

**Tests failing:**
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 14 or higher
- See TESTING.md for detailed troubleshooting

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

**Built with ❤️ for music lovers everywhere**

*Streaming the future, one byte at a time* 📻✨
