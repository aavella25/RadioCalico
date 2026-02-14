# Local Web Development Environment Setup

## Quick Start Guide

Follow these steps to get your Node.js + Express + SQLite development environment running.

### Prerequisites
- Node.js installed (download from https://nodejs.org/ if you don't have it)
- A text editor (VS Code recommended)
- Terminal/Command Prompt

### Step 1: Create Your Project Directory

```bash
mkdir web-prototype
cd web-prototype
```

### Step 2: Initialize Node.js Project

```bash
npm init -y
```

### Step 3: Install Dependencies

```bash
npm install express sqlite3
npm install --save-dev nodemon
```

**What these packages do:**
- `express` - Fast, minimalist web framework
- `sqlite3` - Simple file-based database (perfect for prototyping)
- `nodemon` - Auto-restarts server when you make changes (dev tool)

### Step 4: Create Project Files

Create the following files in your project directory (I've included all the code in separate files):

1. `server.js` - Main web server
2. `database.js` - Database setup and connection
3. `public/index.html` - Frontend HTML
4. `public/style.css` - Styling
5. `public/app.js` - Frontend JavaScript

### Step 5: Update package.json

Add these scripts to your `package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

### Step 6: Run Your Server

```bash
npm run dev
```

### Step 7: Open in Browser

Navigate to: `http://localhost:3000`

You should see a working demo with:
- A list of users from the database
- A form to add new users
- Real-time updates

## What You've Built

✅ **Express Web Server** running on port 3000
✅ **SQLite Database** with a sample users table
✅ **RESTful API** endpoints (GET, POST)
✅ **Frontend** that interacts with the backend
✅ **Hot reload** with nodemon for easy development

## Project Structure

```
web-prototype/
├── server.js           # Backend server
├── database.js         # Database configuration
├── package.json        # Project dependencies
├── database.db         # SQLite database file (auto-created)
└── public/            # Frontend files
    ├── index.html     # Main HTML page
    ├── style.css      # Styles
    └── app.js         # Frontend JavaScript
```

## Next Steps

- Modify the database schema in `database.js`
- Add more API endpoints in `server.js`
- Build out your frontend in the `public/` folder
- Try connecting to a PostgreSQL or MySQL database for production use

## Troubleshooting

**Port already in use?**
Change `PORT = 3000` in `server.js` to another number (like 3001)

**Database errors?**
Delete `database.db` and restart the server - it will recreate automatically

**Can't access from browser?**
Make sure the server is running and check for any error messages in terminal
