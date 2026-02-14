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

## 🛠️ Tech Stack

**Backend:**
- Node.js with Express.js
- SQLite3 database
- RESTful API architecture

**Frontend:**
- Vanilla JavaScript (no framework dependencies)
- HLS.js for adaptive streaming
- Web Audio API for visualization
- CSS3 animations and effects

**Streaming:**
- HLS (HTTP Live Streaming) format
- CloudFront CDN delivery
- Timed metadata for song information

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

4. **Open your browser**
```
http://localhost:3000
```

The stream will start automatically and you'll see the current song information with rating controls.

## 📁 Project Structure

```
radiocalico/
├── server.js                # Express server and API routes
├── database.js              # SQLite database setup and queries
├── package.json             # Dependencies and scripts
├── database.db              # SQLite database (auto-generated)
├── .gitignore               # Git ignore rules
├── CLAUDE.md                # Project documentation for Claude Code
├── README.md                # This file
├── SETUP_INSTRUCTIONS.md    # Detailed setup guide
├── RATING_SYSTEM_GUIDE.md   # Rating system documentation
└── public/                  # Frontend files
    ├── index.html           # Main HTML structure
    ├── radio-calico.css     # Retro-futuristic styling
    └── radio-calico.js      # Streaming and rating functionality
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

## 🔧 Development

### File Organization
- **HTML**: Structure only in `public/index.html`
- **CSS**: All styling in `public/radio-calico.css`
- **JavaScript**: All functionality in `public/radio-calico.js`

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

## 💡 Tips

- **Port conflicts**: Change `PORT` in `server.js` if port 3000 is in use
- **Database reset**: Delete `database.db` and restart to clear all data
- **User ID**: Stored in localStorage as `radioCalicoUserId`
- **Hard refresh**: Use Ctrl+F5 to clear cached CSS/JS after changes
- **Stream issues**: Check browser console for HLS.js errors

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

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

**Built with ❤️ for music lovers everywhere**

*Streaming the future, one byte at a time* 📻✨
