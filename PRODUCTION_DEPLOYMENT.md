# Production Deployment Guide - PostgreSQL + nginx

This guide covers deploying Radio Calico in production with PostgreSQL database and nginx web server.

## 🏗️ Architecture

### Production Stack
- **Web Server**: nginx (reverse proxy, static file serving, SSL termination)
- **Application**: Node.js + Express (API server)
- **Database**: PostgreSQL 15 (persistent data storage)
- **Orchestration**: Docker Compose

### Architecture Diagram
```
Internet
    ↓
[nginx:80/443]
    ↓
    ├─→ /api/* → [Node.js:3000] → [PostgreSQL:5432]
    └─→ /*      → Static Files
```

### Key Features
- ✅ PostgreSQL for production-grade data persistence
- ✅ nginx for high-performance static file serving
- ✅ Reverse proxy with rate limiting
- ✅ Security headers and CSP
- ✅ Health checks for all services
- ✅ Resource limits and auto-restart
- ✅ Non-root user execution

---

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 1GB+ RAM available
- 10GB+ disk space

### 1. Clone Repository
```bash
git clone https://github.com/aavella25/RadioCalico.git
cd RadioCalico
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with secure values
nano .env.production
```

**Important:** Change the default PostgreSQL password!

```env
POSTGRES_PASSWORD=your_very_secure_password_here
```

### 3. Deploy
```bash
# Start all services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Or use helper script
./docker-prod.sh start
```

### 4. Verify Deployment
```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost/api/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

Access at: **http://localhost** (or your server's IP/domain)

---

## 📊 Services

### Service Overview

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| nginx | radio-calico-nginx | 80 | Web server, reverse proxy |
| Node.js | radio-calico-prod | 3000 (internal) | API server |
| PostgreSQL | radio-calico-postgres | 5432 (internal) | Database |

### Service Dependencies
```
nginx → radio-calico → postgres
```

Services start in order, with health check dependencies.

---

## 🗄️ PostgreSQL Database

### Connection Details
- **Host**: postgres (internal Docker network)
- **Port**: 5432
- **Database**: radiocalico
- **User**: radiocalico
- **Password**: Set in `.env.production`

### Database Schema
Tables are automatically created on first startup:
- `users` - User accounts (legacy demo feature)
- `ratings` - Song ratings (core feature)

### Accessing PostgreSQL

**Via Docker:**
```bash
# Connect to PostgreSQL container
docker exec -it radio-calico-postgres psql -U radiocalico -d radiocalico

# List tables
\dt

# Query data
SELECT * FROM ratings;

# Exit
\q
```

**Via Client:**
```bash
# Using psql from host (if installed)
PGPASSWORD=your_password psql -h localhost -U radiocalico -d radiocalico
```

### Backup Database
```bash
# Backup to file
docker exec radio-calico-postgres pg_dump -U radiocalico radiocalico > backup.sql

# Or use helper script
./docker-prod.sh backup-db
```

### Restore Database
```bash
# Restore from file
cat backup.sql | docker exec -i radio-calico-postgres psql -U radiocalico -d radiocalico

# Or use helper script
./docker-prod.sh restore-db backup.sql
```

---

## 🌐 nginx Configuration

### nginx Features
- **Static file serving** - Efficient caching and compression
- **Reverse proxy** - Routes /api/* to Node.js backend
- **Rate limiting** - API: 10 req/s, General: 100 req/s
- **Security headers** - CSP, X-Frame-Options, etc.
- **Gzip compression** - Reduces bandwidth
- **Access logs** - Request logging and monitoring

### Configuration Files
- `nginx/nginx.conf` - Main nginx configuration
- `nginx/default.conf` - Site-specific configuration

### Custom Configuration

Edit `nginx/default.conf` and restart:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### View nginx Logs
```bash
# Access log
docker exec radio-calico-nginx tail -f /var/log/nginx/access.log

# Error log
docker exec radio-calico-nginx tail -f /var/log/nginx/error.log
```

---

## 🔒 Security

### Built-in Security Features

**Application:**
- ✅ Non-root user (nodejs:1001)
- ✅ Resource limits (CPU, memory)
- ✅ Health checks with auto-restart
- ✅ No new privileges flag
- ✅ Environment variable secrets

**nginx:**
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ Rate limiting (prevents abuse)
- ✅ Hide nginx version
- ✅ Deny hidden files
- ✅ Gzip compression

**PostgreSQL:**
- ✅ Internal network only (not exposed)
- ✅ Strong password required
- ✅ Data volume encryption (host-level)
- ✅ Health checks

### Security Checklist

Before going live:
- [ ] Change default PostgreSQL password
- [ ] Set up firewall rules (allow 80/443 only)
- [ ] Configure SSL/TLS (see HTTPS section)
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up monitoring/alerts
- [ ] Review nginx rate limits
- [ ] Update all packages: `docker-compose pull`
- [ ] Set strong admin passwords
- [ ] Configure fail2ban (optional)

---

## 🔐 HTTPS/SSL Configuration

### Using Let's Encrypt with Certbot

**1. Install Certbot:**
```bash
apt-get install certbot python3-certbot-nginx
```

**2. Get Certificate:**
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**3. Update docker-compose.prod.yml:**
```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt:/etc/nginx/ssl:ro
```

**4. Update nginx/default.conf:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/yourdomain.com/privkey.pem;

    # ... rest of configuration
}
```

**5. Restart nginx:**
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### Auto-renewal
```bash
# Add to crontab
0 3 * * * certbot renew --quiet && docker-compose -f /path/to/docker-compose.prod.yml restart nginx
```

---

## 📈 Monitoring & Logs

### Health Checks

All services have health checks:
```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# Detailed health info
docker inspect radio-calico-nginx --format='{{.State.Health.Status}}'
```

### View Logs

**All services:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Specific service:**
```bash
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f radio-calico
docker-compose -f docker-compose.prod.yml logs -f postgres
```

**Last 100 lines:**
```bash
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Resource Usage

**Real-time stats:**
```bash
docker stats
```

**Individual service:**
```bash
docker stats radio-calico-prod
```

---

## 🔄 Updates & Maintenance

### Update Application

**1. Pull latest code:**
```bash
git pull origin master
```

**2. Rebuild and restart:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Update Docker Images
```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Recreate containers
docker-compose -f docker-compose.prod.yml up -d
```

### Database Maintenance

**Vacuum (optimize):**
```bash
docker exec radio-calico-postgres psql -U radiocalico -d radiocalico -c "VACUUM ANALYZE;"
```

**Check database size:**
```bash
docker exec radio-calico-postgres psql -U radiocalico -d radiocalico -c "SELECT pg_size_pretty(pg_database_size('radiocalico'));"
```

---

## 🐛 Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Check network:**
```bash
docker network inspect radiocalico_radio-calico-network
```

**Restart services:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

**Check PostgreSQL is running:**
```bash
docker-compose -f docker-compose.prod.yml ps postgres
```

**Test connection:**
```bash
docker exec radio-calico-prod wget -qO- http://localhost:3000/api/health
```

**Check environment variables:**
```bash
docker exec radio-calico-prod env | grep POSTGRES
```

### nginx Not Serving Files

**Check nginx configuration:**
```bash
docker exec radio-calico-nginx nginx -t
```

**Reload nginx:**
```bash
docker exec radio-calico-nginx nginx -s reload
```

**Check static files:**
```bash
docker exec radio-calico-nginx ls -la /usr/share/nginx/html
```

### Performance Issues

**Check resource usage:**
```bash
docker stats
```

**Adjust resource limits in docker-compose.prod.yml:**
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
```

---

## 🚀 Cloud Deployment

### AWS ECS

1. Push image to ECR
2. Create task definition with all 3 services
3. Configure RDS PostgreSQL
4. Use Application Load Balancer
5. Set environment variables via task definition

### Google Cloud Run

1. Build and push to GCR
2. Deploy Cloud Run service
3. Use Cloud SQL for PostgreSQL
4. Configure Cloud CDN for static files
5. Set environment variables in Cloud Run

### DigitalOcean

1. Use App Platform with Docker Compose
2. Or use Managed PostgreSQL
3. Configure CDN for static files
4. Use Spaces for media storage

### Azure Container Instances

1. Push to ACR
2. Create container group
3. Use Azure Database for PostgreSQL
4. Configure Azure CDN
5. Use Azure Key Vault for secrets

---

## 📊 Performance Tuning

### PostgreSQL Optimization

Edit `docker-compose.prod.yml`:
```yaml
postgres:
  command: postgres -c shared_buffers=256MB -c max_connections=200
```

### nginx Optimization

Edit `nginx/nginx.conf`:
```nginx
worker_processes auto;
worker_connections 2048;
```

### Node.js Optimization

Set environment variables:
```yaml
radio-calico:
  environment:
    - NODE_OPTIONS=--max-old-space-size=512
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🆘 Support

For issues:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- GitHub Issues: https://github.com/aavella25/RadioCalico/issues
- Documentation: DOCKER.md, README.md

---

**Radio Calico** - Production-ready streaming radio station 🐳📻✨
