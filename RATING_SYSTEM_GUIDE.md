# Song Rating System - Installation Guide

## 🎵 New Feature: Thumbs Up/Down Rating System

Your Radio Calico now has a song rating system! Listeners can:
- ✅ Rate songs with 👍 or 👎
- ✅ See total votes from all listeners
- ✅ Vote only once per song (enforced by unique user ID)
- ✅ See their own vote highlighted

## 📦 Installation Steps

### Step 1: Stop your server
Press `Ctrl + C` in the terminal where your server is running

### Step 2: Backup your files
Navigate to: `C:\Users\aavel\radiocalico\`

Backup these files (just in case):
- `server.js` → `server.js.backup`
- `database.js` → `database.js.backup`
- `public\index.html` → `public\index.html.backup`

### Step 3: Replace the files

Download and replace these 3 files:

1. **index-with-metadata.html** 
   → Save as `C:\Users\aavel\radiocalico\public\index.html`

2. **server.js**
   → Save as `C:\Users\aavel\radiocalico\server.js`

3. **database.js**
   → Save as `C:\Users\aavel\radiocalico\database.js`

### Step 4: Restart your server

```bash
cd C:\Users\aavel\radiocalico
npm run dev
```

You should see:
```
✅ Connected to SQLite database
📋 Users table ready
⭐ Ratings table ready
🚀 Server running at http://localhost:3000

📝 API Endpoints:
   GET    /api/ratings/:songId - Get song ratings
   POST   /api/ratings         - Rate a song
```

### Step 5: Test it!

1. Open **http://localhost:3000**
2. Hard refresh: `Ctrl + F5`
3. You should see thumbs up/down buttons under "Now Playing"
4. Click a button to rate the current song!

## 🎯 How It Works

### User Identification
- Each user gets a unique ID stored in browser localStorage
- Format: `user_[timestamp]_[random]`
- Persists across sessions on the same browser

### Voting Rules
- ✅ One vote per song per user
- ✅ Can't change vote once submitted
- ✅ Votes stored permanently in database
- ✅ Total counts update in real-time

### Database
A new `ratings` table stores:
- `song_id` - Unique identifier (base64 of artist + title)
- `artist` & `title` - Song metadata
- `user_id` - Who voted
- `rating` - 'up' or 'down'
- `created_at` - When they voted

### API Endpoints

**GET /api/ratings/:songId?userId=xxx**
Returns:
```json
{
  "thumbsUp": 42,
  "thumbsDown": 3,
  "userVote": "up"
}
```

**POST /api/ratings**
Body:
```json
{
  "songId": "base64_encoded_id",
  "artist": "Betty Boo",
  "title": "Doin' The Do",
  "userId": "user_xxx",
  "rating": "up"
}
```

## 🎨 UI Features

- 👍 👎 **Vote buttons** - Styled with retro-futuristic design
- 📊 **Vote counts** - Real-time display with amber glow
- ✨ **Voted state** - Your vote is highlighted
- 🚫 **Disabled after voting** - Can't vote twice
- 💬 **Feedback messages** - "You liked this track"

## 🐛 Troubleshooting

**Buttons don't work?**
- Check browser console (F12) for errors
- Make sure server restarted successfully
- Clear browser cache and hard refresh

**Ratings don't persist?**
- Check that database.db file exists
- Verify ratings table was created (check server logs)

**Can vote multiple times?**
- Clear localStorage: Open console (F12) → `localStorage.clear()`
- Each browser = new user

**Server won't start?**
- Port 3000 in use? Change PORT in server.js
- Missing node_modules? Run `npm install`

## 🎉 Success!

You now have a fully functional song rating system! Users can express their opinions and you can track which songs are most popular.

Enjoy! 🎵✨
