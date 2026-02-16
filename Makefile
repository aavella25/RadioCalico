# Makefile for Radio Calico
# Provides convenient targets for development, production, and testing

.PHONY: help dev prod test stop clean install setup status logs backup restore

# Default target - show help
help:
	@echo "Radio Calico - Make Targets"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start development environment (Docker with hot-reload)"
	@echo "  make dev-local        Start local development server (npm run dev)"
	@echo "  make dev-logs         View development logs"
	@echo "  make dev-test         Run tests in development container"
	@echo "  make dev-shell        Open shell in development container"
	@echo ""
	@echo "Production:"
	@echo "  make prod             Start production environment (PostgreSQL + nginx)"
	@echo "  make prod-setup       Create production environment file"
	@echo "  make prod-rebuild     Rebuild and restart production"
	@echo "  make prod-logs        View production logs"
	@echo "  make prod-status      Check production service status"
	@echo "  make prod-test        Test production deployment"
	@echo "  make prod-shell       Open shell in production container"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all tests locally"
	@echo "  make test-watch       Run tests in watch mode"
	@echo "  make test-coverage    Run tests with coverage report"
	@echo ""
	@echo "Database:"
	@echo "  make backup           Backup production PostgreSQL database"
	@echo "  make restore FILE=... Restore production database from backup"
	@echo "  make db-shell         Open PostgreSQL shell (production)"
	@echo ""
	@echo "Management:"
	@echo "  make install          Install Node.js dependencies"
	@echo "  make stop             Stop all services (dev and prod)"
	@echo "  make clean            Clean up containers (keeps data)"
	@echo "  make clean-all        Remove everything including data"
	@echo "  make status           Show status of all services"
	@echo "  make logs             View all logs (production)"
	@echo ""

# Development targets
dev:
	@echo "🚀 Starting development environment..."
	@bash docker-dev.sh start

dev-local:
	@echo "🚀 Starting local development server..."
	npm run dev

dev-logs:
	@bash docker-dev.sh logs

dev-test:
	@echo "🧪 Running tests in development container..."
	@bash docker-dev.sh test

dev-shell:
	@bash docker-dev.sh shell

dev-stop:
	@echo "🛑 Stopping development environment..."
	@bash docker-dev.sh stop

# Production targets
prod:
	@echo "🚀 Starting production environment..."
	@bash docker-prod.sh start

prod-setup:
	@echo "⚙️  Setting up production environment..."
	@bash docker-prod.sh setup

prod-rebuild:
	@echo "🔨 Rebuilding production environment..."
	@bash docker-prod.sh rebuild

prod-logs:
	@bash docker-prod.sh logs

prod-logs-app:
	@bash docker-prod.sh logs-app

prod-logs-nginx:
	@bash docker-prod.sh logs-nginx

prod-logs-db:
	@bash docker-prod.sh logs-db

prod-status:
	@bash docker-prod.sh status

prod-test:
	@echo "🧪 Testing production deployment..."
	@bash docker-prod.sh test

prod-shell:
	@bash docker-prod.sh shell

prod-stop:
	@echo "🛑 Stopping production environment..."
	@bash docker-prod.sh stop

# Testing targets
test:
	@echo "🧪 Running all tests..."
	npm test

test-watch:
	@echo "🧪 Running tests in watch mode..."
	npm test -- --watch

test-coverage:
	@echo "🧪 Running tests with coverage..."
	npm test -- --coverage

# Database targets
backup:
	@echo "💾 Backing up production database..."
	@bash docker-prod.sh backup

restore:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Error: Please specify backup file with FILE=backup.sql"; \
		echo "   Example: make restore FILE=backup_postgres_20260216_095000.sql"; \
		exit 1; \
	fi
	@echo "📥 Restoring database from $(FILE)..."
	@bash docker-prod.sh restore $(FILE)

db-shell:
	@echo "🐚 Opening PostgreSQL shell..."
	@bash docker-prod.sh db-shell

# Management targets
install:
	@echo "📦 Installing Node.js dependencies..."
	npm install

stop:
	@echo "🛑 Stopping all services..."
	@bash docker-dev.sh stop 2>/dev/null || true
	@bash docker-prod.sh stop 2>/dev/null || true

clean:
	@echo "🧹 Cleaning up containers (keeping data)..."
	@bash docker-dev.sh clean 2>/dev/null || true
	@bash docker-prod.sh clean 2>/dev/null || true

clean-all:
	@echo "🧹 Cleaning up everything including data..."
	@bash docker-dev.sh clean-all 2>/dev/null || true
	@bash docker-prod.sh clean-all 2>/dev/null || true

status:
	@echo "📊 Development Status:"
	@echo "===================="
	@bash docker-dev.sh status 2>/dev/null || echo "Development environment not running"
	@echo ""
	@echo "📊 Production Status:"
	@echo "===================="
	@bash docker-prod.sh status 2>/dev/null || echo "Production environment not running"

logs:
	@bash docker-prod.sh logs

# Quick aliases
start: prod
start-dev: dev
restart: prod-rebuild
restart-dev: dev-stop dev
