# PostgreSQL + nginx Production Upgrade Summary

This document summarizes the production deployment upgrade from SQLite to PostgreSQL with nginx as the front-end web server.

## 🎯 Changes Overview

### Architecture Changes

**Before:**
```
[Client] → [Node.js:3000] → [SQLite (file)]
```

**After:**
```
[Client] → [nginx:80] → [Node.js:3000] → [PostgreSQL:5432]
              ↓
        [Static Files]
```

---

## 📦 New Files Created

### Database Layer
1. **`database-postgres.js`** - PostgreSQL database module
   - Implements PostgreSQL connection using `pg` library
   - Compatible API with SQLite module
   - Automatic schema initialization
   - Connection pooling

2. **`database-config.js`** - Database abstraction layer
   - Selects SQLite (dev) or PostgreSQL (prod) based on environment
   - Seamless switching between databases

### nginx Configuration
3. **`nginx/nginx.conf`** - Main nginx configuration
   - Worker processes optimization
   - Gzip compression
   - Logging configuration

4. **`nginx/default.conf`** - Site-specific configuration
   - Reverse proxy to Node.js backend
   - Static file serving with caching
   - Rate limiting (API: 10 req/s, General: 100 req/s)
   - Security headers (CSP, X-Frame-Options, etc.)
   - Health check endpoint

### Docker Configuration
5. **`docker-compose.prod.yml`** - Updated production compose
   - PostgreSQL 15 Alpine service
   - nginx 1.25 Alpine service
   - Node.js application service
   - Service dependencies and health checks
   - Volume management

6. **`.env.production.example`** - Environment variable template
   - PostgreSQL credentials
   - nginx port configuration
   - Security notes

### Scripts
7. **`docker-prod.sh`** - Updated production helper script
   - Setup command for environment
   - Database backup/restore commands
   - Service-specific log viewing
   - PostgreSQL shell access
   - Enhanced status monitoring
   - Test command for deployment verification

### Documentation
8. **`PRODUCTION_DEPLOYMENT.md`** - Comprehensive production guide
   - Architecture overview
   - Quick start guide
   - PostgreSQL management
   - nginx configuration
   - Security checklist
   - HTTPS/SSL setup
   - Monitoring and troubleshooting
   - Cloud deployment guides

9. **`POSTGRES_NGINX_UPGRADE.md`** - This file
   - Upgrade summary
   - Migration guide
   - Testing instructions

---

## 🔧 Modified Files

### Application
1. **`server.js`**
   - Changed: `require('./database')` → `require('./database-config')`
   - Now uses database abstraction layer

2. **`package.json`**
   - Added: `pg` dependency for PostgreSQL support

3. **`.gitignore`**
   - Added: `.env.production` to ignore list

---

## 🎨 Features Added

### PostgreSQL Benefits
- ✅ **Production-grade database** - ACID compliance, transactions
- ✅ **Better concurrency** - Multiple simultaneous connections
- ✅ **Data integrity** - Foreign keys, constraints
- ✅ **Scalability** - Handles larger datasets
- ✅ **Advanced features** - JSON columns, full-text search
- ✅ **Backup/restore** - pg_dump and pg_restore
- ✅ **Monitoring** - Built-in query statistics

### nginx Benefits
- ✅ **High performance** - Efficient static file serving
- ✅ **Reverse proxy** - Routes API requests to backend
- ✅ **Rate limiting** - Prevents API abuse
- ✅ **Security headers** - XSS protection, CSP, etc.
- ✅ **Gzip compression** - Reduces bandwidth
- ✅ **SSL/TLS support** - Easy HTTPS configuration
- ✅ **Caching** - Static file caching with long expiry
- ✅ **Load balancing** - Can distribute across multiple backends

---

## 🚀 Deployment Guide

### First-Time Setup

**1. Clone or pull latest code:**
```bash
git pull origin master
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create production environment file:**
```bash
./docker-prod.sh setup
```

**4. Edit `.env.production` with secure credentials:**
```bash
nano .env.production
```

**IMPORTANT:** Change the PostgreSQL password!

**5. Start services:**
```bash
./docker-prod.sh start
```

**6. Verify deployment:**
```bash
./docker-prod.sh test
```

**7. Check status:**
```bash
./docker-prod.sh status
```

---

## 🔄 Migration from SQLite to PostgreSQL

### Option 1: Fresh Start (Recommended for Testing)

Simply start with PostgreSQL - schema is created automatically:
```bash
./docker-prod.sh start
```

### Option 2: Migrate Existing Data

**Step 1: Export SQLite data**
```bash
# Start development container with SQLite
docker-compose up -d

# Export ratings data
docker-compose exec radio-calico-dev sqlite3 database.db <<EOF
.mode insert ratings
SELECT * FROM ratings;
EOF > ratings_export.sql

# Export users data (if needed)
docker-compose exec radio-calico-dev sqlite3 database.db <<EOF
.mode insert users
SELECT * FROM users;
EOF > users_export.sql
```

**Step 2: Convert to PostgreSQL format**
```bash
# ratings_export.sql needs manual conversion or use migration script
# SQLite: INSERT INTO ratings VALUES(...)
# PostgreSQL: INSERT INTO ratings (columns...) VALUES (...)
```

**Step 3: Import into PostgreSQL**
```bash
# Start production services
./docker-prod.sh start

# Import data
./docker-prod.sh db-shell < ratings_export.sql
```

### Option 3: Use Migration Tool

```bash
# Install pgloader
apt-get install pgloader

# Convert SQLite to PostgreSQL
pgloader database.db postgresql://radiocalico:password@localhost/radiocalico
```

---

## 🧪 Testing

### Development (SQLite)
```bash
# Start development with SQLite
docker-compose up

# Run tests
docker-compose exec radio-calico-dev npm test

# Access: http://localhost:3000
```

### Production (PostgreSQL + nginx)
```bash
# Start production with PostgreSQL + nginx
./docker-prod.sh start

# Run automated tests
./docker-prod.sh test

# Check service health
./docker-prod.sh status

# Access: http://localhost (nginx on port 80)
```

### Test Checklist

- [ ] All containers start successfully
- [ ] nginx responds on port 80
- [ ] API health check returns 200 OK
- [ ] PostgreSQL accepts connections
- [ ] Static files are served by nginx
- [ ] API requests are proxied to backend
- [ ] Database schema is created
- [ ] Sample data is inserted
- [ ] Rate limiting is working
- [ ] Security headers are present

**Run automated tests:**
```bash
./docker-prod.sh test
```

---

## 📊 Service Ports

| Service | Internal Port | External Port | Notes |
|---------|---------------|---------------|-------|
| nginx | 80 | 80 | Web server (public) |
| nginx | 443 | 443 | HTTPS (optional) |
| Node.js | 3000 | - | Internal only |
| PostgreSQL | 5432 | - | Internal only |

Only nginx port 80 (and optionally 443) should be exposed to the internet.

---

## 🔒 Security Improvements

### From Single-Service to Multi-Service

**Before:**
- Node.js directly exposed
- SQLite file permissions only
- No rate limiting
- No security headers

**After:**
- nginx as security layer
- PostgreSQL not exposed
- Rate limiting enabled
- Security headers (CSP, X-Frame-Options, etc.)
- Gzip compression (reduces attack surface)
- Hidden nginx version
- Deny access to hidden files

---

## 📈 Performance Improvements

### Database
- **SQLite:** Single writer, file locks
- **PostgreSQL:** Multiple concurrent connections, better for write-heavy workloads

### Web Server
- **Node.js:** Good for dynamic content
- **nginx:** Excellent for static files, reverse proxy

### Expected Performance Gains
- **Static files:** 5-10x faster with nginx caching
- **API requests:** ~20% faster with nginx buffering
- **Concurrent users:** 10x+ improvement with PostgreSQL
- **Bandwidth:** ~60% reduction with gzip compression

---

## 💾 Backup Strategy

### Automated Backups

**Daily backup script:**
```bash
#!/bin/bash
# /etc/cron.daily/radio-calico-backup

cd /path/to/radiocalico
./docker-prod.sh backup
find . -name "backup_postgres_*.sql" -mtime +7 -delete
```

**Make executable:**
```bash
chmod +x /etc/cron.daily/radio-calico-backup
```

### Manual Backups

**Backup database:**
```bash
./docker-prod.sh backup
```

**Restore database:**
```bash
./docker-prod.sh restore backup_postgres_20260216_120000.sql
```

---

## 🐛 Troubleshooting

### PostgreSQL Won't Start

**Check logs:**
```bash
./docker-prod.sh logs-db
```

**Common issues:**
- Port 5432 already in use
- Insufficient memory
- Volume permissions

**Solution:**
```bash
# Stop all services
./docker-prod.sh stop

# Remove volumes and restart
docker volume rm radiocalico_radio-calico-postgres-data
./docker-prod.sh start
```

### nginx Won't Start

**Test configuration:**
```bash
docker exec radio-calico-nginx nginx -t
```

**Check logs:**
```bash
./docker-prod.sh logs-nginx
```

**Common issues:**
- Port 80 already in use
- Invalid configuration syntax
- Missing static files

### Database Connection Errors

**Check environment variables:**
```bash
docker exec radio-calico-prod env | grep POSTGRES
```

**Test connection:**
```bash
./docker-prod.sh db-shell
```

**Verify health:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## 📚 Next Steps

### After Deployment

1. **Set up monitoring:**
   - Configure log aggregation (ELK, Splunk)
   - Set up alerts (PagerDuty, Slack)
   - Monitor resource usage

2. **Configure SSL/TLS:**
   - Get Let's Encrypt certificate
   - Update nginx configuration
   - Set up auto-renewal

3. **Optimize performance:**
   - Tune PostgreSQL settings
   - Configure nginx caching
   - Set up CDN for static files

4. **Implement backups:**
   - Automated daily backups
   - Test restore procedures
   - Off-site backup storage

5. **Security hardening:**
   - Configure firewall
   - Set up fail2ban
   - Regular security updates

---

## 🎉 Summary

### What Changed
- ✅ SQLite → PostgreSQL for production
- ✅ Direct Node.js → nginx reverse proxy
- ✅ Added rate limiting
- ✅ Added security headers
- ✅ Improved static file serving
- ✅ Better scalability
- ✅ Production-ready architecture

### Benefits
- 🚀 Better performance
- 🔒 Enhanced security
- 📈 Improved scalability
- 💾 Robust backup/restore
- 🌐 Easy HTTPS setup
- ⚡ Static file caching

### Compatibility
- ✅ Development still uses SQLite
- ✅ All tests still pass
- ✅ API unchanged
- ✅ No frontend changes needed
- ✅ Backward compatible

---

**Radio Calico is now production-ready with PostgreSQL and nginx!** 🐘🌐📻✨
