# Web Prototype - Node.js Development Environment

A complete local development setup with **Node.js**, **Express**, and **SQLite** for building and testing web applications.

## 🚀 What's Included

- **Express Web Server** - Fast, minimalist Node.js web framework
- **SQLite Database** - Lightweight, file-based SQL database (perfect for prototyping!)
- **RESTful API** - Complete CRUD operations (Create, Read, Update, Delete)
- **Frontend Interface** - Beautiful, responsive UI with HTML/CSS/JavaScript
- **Sample Application** - Working user management system to learn from

## 📋 Quick Start

### 1. Install Node.js
If you don't have it: https://nodejs.org/ (download LTS version)

### 2. Set Up Your Project

```bash
# Create a new folder anywhere on your computer
mkdir my-web-project
cd my-web-project

# Copy all these files into that folder:
# - server.js
# - database.js
# - package.json
# - index.html
# - style.css
# - app.js

# Create a 'public' folder and move the frontend files
mkdir public
mv index.html public/
mv style.css public/
mv app.js public/
```

### 3. Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `sqlite3` - Database
- `nodemon` - Auto-restart tool (dev only)

### 4. Start the Server

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# OR production mode
npm start
```

### 5. Open Your Browser

Navigate to: **http://localhost:3000**

You'll see a user management interface where you can:
- View all users
- Add new users
- Delete users

## 📁 Project Structure

```
my-web-project/
│
├── server.js          # Main Express server + API routes
├── database.js        # SQLite database setup
├── package.json       # Dependencies and scripts
├── database.db        # SQLite database file (auto-created)
│
└── public/           # Frontend files (served by Express)
    ├── index.html    # Main HTML page
    ├── style.css     # Styles
    └── app.js        # Frontend JavaScript (API calls)
```

## 🔌 API Endpoints

Your server has these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get specific user |
| POST | `/api/users` | Create new user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/health` | Check server status |

### Example API Usage

**Create a user:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

**Get all users:**
```bash
curl http://localhost:3000/api/users
```

## 🛠️ Customizing Your App

### Add a New Database Table

Edit `database.js`:

```javascript
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### Add a New API Route

Edit `server.js`:

```javascript
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ products: rows });
  });
});
```

### Modify the Frontend

Edit files in the `public/` folder:
- `index.html` - Structure
- `style.css` - Design
- `app.js` - Functionality

## 🎓 Learning Path

1. **Start Simple** - Understand how the current user management works
2. **Modify** - Change the styling, add new fields
3. **Expand** - Add new tables/features (products, blog posts, etc.)
4. **Connect** - Try connecting to a real PostgreSQL or MySQL database
5. **Deploy** - Learn to deploy to platforms like Heroku, Railway, or Vercel

## 💡 Tips

- **Port in use?** Change `PORT = 3000` in `server.js` to `3001` or another number
- **See console logs** - Check your terminal for server messages and errors
- **Database reset** - Delete `database.db` and restart to start fresh
- **Use nodemon** - Run `npm run dev` so the server restarts on file changes

## 🐛 Troubleshooting

**Cannot find module 'express'**
→ Run `npm install` to install dependencies

**Port already in use**
→ Change the PORT in `server.js` or kill the process using that port

**Database errors**
→ Delete `database.db` and restart the server

**Browser can't connect**
→ Make sure server is running and check for errors in terminal

## 🚀 Next Steps

- Add authentication (login/register)
- Implement sessions or JWT tokens
- Connect to a PostgreSQL database
- Add file upload functionality
- Build a REST API for a mobile app
- Learn about ORMs (Sequelize, Prisma)
- Deploy your app to the cloud

## 📚 Resources

- [Express Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Node.js Documentation](https://nodejs.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Happy Coding! 🎉**

If you have questions or run into issues, feel free to ask!
