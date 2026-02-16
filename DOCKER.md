# Docker Deployment Guide for Radio Calico

This guide covers running Radio Calico in Docker containers for both development and production environments.

## 🐳 Overview

Radio Calico includes Docker configurations for:
- **Development**: Hot-reloading, debugging, mounted source code
- **Production**: Optimized build, security hardening, resource limits

## 📋 Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+

## 🚀 Quick Start

### Development Mode

```bash
# Build and start development container
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

Access at: `http://localhost:3000`

### Production Mode

```bash
# Build and start production container
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop containers
docker-compose -f docker-compose.prod.yml down
```

## 🏗️ Build Stages

The `Dockerfile` uses multi-stage builds:

1. **base** - Common dependencies (Node.js 18 Alpine)
2. **development** - All dependencies, nodemon for hot-reload
3. **production-deps** - Production dependencies only
4. **production** - Optimized runtime, non-root user, health checks

## 📂 Volume Management

### Development Volumes
- **Source Code**: `.:/app` (hot-reload enabled)
- **Node Modules**: Anonymous volume (avoids host conflicts)
- **Database**: `radio-calico-db-dev` (persisted)

### Production Volumes
- **Database**: `radio-calico-db` (persisted)
- **Logs**: `radio-calico-logs` (optional)

### Managing Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect radio-calico-db

# Remove volume (deletes data!)
docker volume rm radio-calico-db

# Backup database volume
docker run --rm -v radio-calico-db:/data -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /data .

# Restore database volume
docker run --rm -v radio-calico-db:/data -v $(pwd):/backup \
  alpine tar xzf /backup/db-backup.tar.gz -C /data
```

## 🛠️ Development Workflow

### Running Tests in Container

```bash
# Run tests
docker-compose exec radio-calico-dev npm test

# Run tests with coverage
docker-compose exec radio-calico-dev npm run test:coverage

# Run tests in watch mode
docker-compose exec radio-calico-dev npm run test:watch
```

### Installing Dependencies

```bash
# Install new dependency
docker-compose exec radio-calico-dev npm install package-name

# Rebuild after package.json changes
docker-compose down
docker-compose up --build
```

### Accessing Container Shell

```bash
# Development
docker-compose exec radio-calico-dev sh

# Production
docker-compose -f docker-compose.prod.yml exec radio-calico sh
```

### Viewing Logs

```bash
# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f radio-calico-dev
```

## 🏭 Production Deployment

### Environment Variables

Create `.env.prod` file (not tracked in git):

```env
NODE_ENV=production
PORT=3000
# Add any other production environment variables
```

Use with docker-compose:

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Resource Limits

Production container includes resource limits:
- **CPU**: 1 core limit, 0.5 core reservation
- **Memory**: 512MB limit, 256MB reservation

Adjust in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
```

### Security

Production container includes:
- Non-root user (`nodejs:nodejs`)
- Read-only root filesystem (where possible)
- No new privileges
- Temporary filesystem for `/tmp`
- Health checks

### Health Checks

Both dev and prod include health checks:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' radio-calico-prod
```

## 🔄 Updates and Rebuilds

### Updating Application

```bash
# Pull latest code
git pull

# Rebuild and restart (development)
docker-compose up -d --build

# Rebuild and restart (production)
docker-compose -f docker-compose.prod.yml up -d --build
```

### Clearing Everything

```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all -v

# Nuclear option - remove everything
docker system prune -a --volumes
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check if port is in use
netstat -an | grep 3000

# Remove and rebuild
docker-compose down
docker-compose up --build
```

### Database Issues

```bash
# View database file
docker-compose exec radio-calico-dev ls -lah /app

# Reset database (DESTRUCTIVE!)
docker-compose down -v
docker-compose up
```

### Permission Issues

```bash
# Fix ownership (Linux/Mac)
sudo chown -R $USER:$USER .

# Windows - run Docker Desktop as administrator
```

### Hot Reload Not Working (Dev)

```bash
# Ensure volume mounts are correct
docker-compose down
docker-compose up

# Check nodemon is running
docker-compose logs | grep nodemon
```

## 📊 Monitoring

### Container Stats

```bash
# Real-time stats
docker stats radio-calico-prod

# One-time stats
docker stats --no-stream
```

### Database Size

```bash
# Check database size
docker-compose exec radio-calico-dev du -sh /app/database.db
```

### Logs Management

```bash
# Limit log size in docker-compose.yml
services:
  radio-calico:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🚢 Alternative Deployments

### Docker Run (without Compose)

**Development:**
```bash
docker build --target development -t radio-calico:dev .
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules radio-calico:dev
```

**Production:**
```bash
docker build --target production -t radio-calico:prod .
docker run -p 3000:3000 -v radio-calico-db:/app/data radio-calico:prod
```

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml radio-calico

# List services
docker stack services radio-calico

# Remove stack
docker stack rm radio-calico
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests (if available).

## 🏷️ Image Management

### Tagging

```bash
# Build with specific tag
docker build --target production -t radio-calico:v1.0.0 .
docker build --target production -t radio-calico:latest .

# Tag for registry
docker tag radio-calico:v1.0.0 registry.example.com/radio-calico:v1.0.0
```

### Pushing to Registry

```bash
# Docker Hub
docker login
docker push yourusername/radio-calico:v1.0.0

# Private registry
docker login registry.example.com
docker push registry.example.com/radio-calico:v1.0.0
```

### Pulling

```bash
# From Docker Hub
docker pull yourusername/radio-calico:latest

# From private registry
docker pull registry.example.com/radio-calico:v1.0.0
```

## 📝 Best Practices

1. **Use .dockerignore** - Exclude unnecessary files from build context
2. **Multi-stage builds** - Keep production images small
3. **Layer caching** - Order commands from least to most frequently changing
4. **Non-root user** - Run as non-root in production
5. **Health checks** - Enable proper orchestration
6. **Volume mounts** - Persist data outside containers
7. **Environment variables** - Use for configuration
8. **Resource limits** - Prevent resource exhaustion
9. **Security scanning** - Scan images for vulnerabilities
10. **Regular updates** - Keep base images updated

## 🔒 Security Checklist

- ✅ Non-root user in production
- ✅ No secrets in image layers
- ✅ Read-only root filesystem (where possible)
- ✅ Security options enabled
- ✅ Resource limits set
- ✅ Health checks configured
- ✅ Minimal base image (Alpine)
- ✅ Regular security updates

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## 🆘 Support

For issues or questions:
- Check logs: `docker-compose logs`
- Inspect container: `docker inspect radio-calico-prod`
- GitHub Issues: https://github.com/aavella25/RadioCalico/issues

---

**Happy Dockerizing!** 🐳📻
