#!/bin/bash
# Radio Calico - Production Docker Helper Script (PostgreSQL + nginx)

set -e

command=$1

# Check for .env.production file
check_env() {
  if [ ! -f .env.production ]; then
    echo "⚠️  Warning: .env.production file not found"
    echo "   Using default environment variables"
    echo "   For production, copy .env.production.example to .env.production"
    echo ""
  fi
}

case $command in
  start)
    echo "🚀 Starting Radio Calico in production mode (PostgreSQL + nginx)..."
    check_env
    if [ -f .env.production ]; then
      docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    else
      docker-compose -f docker-compose.prod.yml up -d
    fi
    echo "✅ Started!"
    echo "📊 Services:"
    echo "   nginx:      http://localhost"
    echo "   API:        http://localhost/api/health"
    echo "   PostgreSQL: Internal (port 5432)"
    echo ""
    echo "📋 View logs: ./docker-prod.sh logs"
    echo "🔍 Check status: ./docker-prod.sh status"
    ;;

  stop)
    echo "🛑 Stopping Radio Calico..."
    docker-compose -f docker-compose.prod.yml down
    echo "✅ Stopped!"
    ;;

  restart)
    echo "🔄 Restarting Radio Calico..."
    docker-compose -f docker-compose.prod.yml restart
    echo "✅ Restarted!"
    ;;

  rebuild)
    echo "🔨 Rebuilding and restarting..."
    docker-compose -f docker-compose.prod.yml down
    check_env
    if [ -f .env.production ]; then
      docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
    else
      docker-compose -f docker-compose.prod.yml up -d --build
    fi
    echo "✅ Rebuilt and started!"
    ;;

  logs)
    docker-compose -f docker-compose.prod.yml logs -f
    ;;

  logs-nginx)
    echo "📋 nginx logs:"
    docker-compose -f docker-compose.prod.yml logs -f nginx
    ;;

  logs-app)
    echo "📋 Application logs:"
    docker-compose -f docker-compose.prod.yml logs -f radio-calico
    ;;

  logs-db)
    echo "📋 PostgreSQL logs:"
    docker-compose -f docker-compose.prod.yml logs -f postgres
    ;;

  shell)
    echo "🐚 Opening shell in application container..."
    docker-compose -f docker-compose.prod.yml exec radio-calico sh
    ;;

  shell-nginx)
    echo "🐚 Opening shell in nginx container..."
    docker-compose -f docker-compose.prod.yml exec nginx sh
    ;;

  db-shell)
    echo "🐚 Opening PostgreSQL shell..."
    docker-compose -f docker-compose.prod.yml exec postgres psql -U radiocalico -d radiocalico
    ;;

  backup)
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_postgres_${timestamp}.sql"
    echo "💾 Backing up PostgreSQL database to ${backup_file}..."
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U radiocalico radiocalico > ${backup_file}
    echo "✅ Backup created: ${backup_file}"
    ;;

  restore)
    if [ -z "$2" ]; then
      echo "❌ Please specify backup file: ./docker-prod.sh restore <backup_file.sql>"
      exit 1
    fi
    backup_file=$2
    echo "📥 Restoring PostgreSQL database from ${backup_file}..."
    read -p "⚠️  This will overwrite current data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      cat ${backup_file} | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U radiocalico -d radiocalico
      echo "✅ Database restored!"
      echo "🔄 Restart services: ./docker-prod.sh restart"
    else
      echo "❌ Cancelled"
    fi
    ;;

  stats)
    echo "📊 Container resource usage:"
    docker stats --no-stream radio-calico-nginx radio-calico-prod radio-calico-postgres
    ;;

  status)
    echo "📊 Container status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "🔍 Health checks:"
    echo -n "  nginx:      "
    docker inspect --format='{{.State.Health.Status}}' radio-calico-nginx 2>/dev/null || echo "Container not running"
    echo -n "  App:        "
    docker inspect --format='{{.State.Health.Status}}' radio-calico-prod 2>/dev/null || echo "Container not running"
    echo -n "  PostgreSQL: "
    docker inspect --format='{{.State.Health.Status}}' radio-calico-postgres 2>/dev/null || echo "Container not running"
    echo ""
    echo "📈 Resource usage:"
    docker stats --no-stream radio-calico-nginx radio-calico-prod radio-calico-postgres 2>/dev/null || echo "Containers not running"
    ;;

  test)
    echo "🧪 Testing production deployment..."
    echo ""
    echo "1. Checking nginx..."
    curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost/ || echo "   ❌ nginx not responding"
    echo ""
    echo "2. Checking API health..."
    curl -s http://localhost/api/health | head -5 || echo "   ❌ API not responding"
    echo ""
    echo "3. Checking database connection..."
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U radiocalico || echo "   ❌ Database not ready"
    echo ""
    echo "✅ Tests complete!"
    ;;

  clean)
    echo "🧹 Cleaning up containers and networks (keeps volumes)..."
    docker-compose -f docker-compose.prod.yml down
    echo "✅ Cleaned!"
    echo "ℹ️  To remove volumes (deletes data):"
    echo "   docker volume rm radiocalico_radio-calico-postgres-data"
    echo "   docker volume rm radiocalico_radio-calico-nginx-logs"
    ;;

  clean-all)
    echo "🧹 Cleaning up containers, networks, AND volumes..."
    read -p "⚠️  This will DELETE ALL DATA. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose -f docker-compose.prod.yml down -v
      echo "✅ Everything cleaned!"
    else
      echo "❌ Cancelled"
    fi
    ;;

  setup)
    echo "⚙️  Setting up production environment..."
    if [ -f .env.production ]; then
      echo "⚠️  .env.production already exists"
      read -p "   Overwrite? (y/N) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 0
      fi
    fi
    cp .env.production.example .env.production
    echo "✅ Created .env.production"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.production and set a secure password:"
    echo "   nano .env.production"
    echo ""
    echo "Then start with: ./docker-prod.sh start"
    ;;

  *)
    echo "Radio Calico - Production Docker Helper (PostgreSQL + nginx)"
    echo ""
    echo "Usage: ./docker-prod.sh <command>"
    echo ""
    echo "Commands:"
    echo "  setup          Create .env.production from template"
    echo "  start          Start all production services"
    echo "  stop           Stop all production services"
    echo "  restart        Restart all production services"
    echo "  rebuild        Rebuild and restart all services"
    echo ""
    echo "Logs:"
    echo "  logs           View all logs (follow mode)"
    echo "  logs-nginx     View nginx logs"
    echo "  logs-app       View application logs"
    echo "  logs-db        View PostgreSQL logs"
    echo ""
    echo "Shell Access:"
    echo "  shell          Open shell in application container"
    echo "  shell-nginx    Open shell in nginx container"
    echo "  db-shell       Open PostgreSQL shell (psql)"
    echo ""
    echo "Database:"
    echo "  backup         Backup PostgreSQL database to SQL file"
    echo "  restore <file> Restore PostgreSQL database from SQL file"
    echo ""
    echo "Monitoring:"
    echo "  stats          Show resource usage statistics"
    echo "  status         Show container status and health"
    echo "  test           Test all services"
    echo ""
    echo "Cleanup:"
    echo "  clean          Remove containers and networks (keeps data)"
    echo "  clean-all      Remove everything including data volumes"
    echo ""
    echo "Examples:"
    echo "  ./docker-prod.sh setup"
    echo "  ./docker-prod.sh start"
    echo "  ./docker-prod.sh logs-app"
    echo "  ./docker-prod.sh backup"
    echo "  ./docker-prod.sh test"
    ;;
esac
