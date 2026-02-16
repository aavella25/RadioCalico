#!/bin/bash
# Radio Calico - Production Docker Helper Script

set -e

command=$1

case $command in
  start)
    echo "🚀 Starting Radio Calico in production mode..."
    docker-compose -f docker-compose.prod.yml up -d
    echo "✅ Started! Access at http://localhost:3000"
    echo "📋 View logs: ./docker-prod.sh logs"
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
    docker-compose -f docker-compose.prod.yml up -d --build
    echo "✅ Rebuilt and started!"
    ;;

  logs)
    docker-compose -f docker-compose.prod.yml logs -f
    ;;

  shell)
    echo "🐚 Opening shell in container..."
    docker-compose -f docker-compose.prod.yml exec radio-calico sh
    ;;

  backup)
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.tar.gz"
    echo "💾 Backing up database to ${backup_file}..."
    docker run --rm -v radio-calico-db:/data -v $(pwd):/backup \
      alpine tar czf /backup/${backup_file} -C /data .
    echo "✅ Backup created: ${backup_file}"
    ;;

  restore)
    if [ -z "$2" ]; then
      echo "❌ Please specify backup file: ./docker-prod.sh restore <backup_file.tar.gz>"
      exit 1
    fi
    backup_file=$2
    echo "📥 Restoring database from ${backup_file}..."
    read -p "⚠️  This will overwrite current data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker run --rm -v radio-calico-db:/data -v $(pwd):/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/${backup_file} -C /data"
      echo "✅ Database restored!"
      echo "🔄 Restart container to use restored data: ./docker-prod.sh restart"
    else
      echo "❌ Cancelled"
    fi
    ;;

  stats)
    echo "📊 Container resource usage:"
    docker stats --no-stream radio-calico-prod
    ;;

  status)
    echo "📊 Container status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "🔍 Health check:"
    docker inspect --format='{{.State.Health.Status}}' radio-calico-prod 2>/dev/null || echo "Container not running"
    echo ""
    echo "📈 Resource usage:"
    docker stats --no-stream radio-calico-prod 2>/dev/null || echo "Container not running"
    ;;

  clean)
    echo "🧹 Cleaning up containers and networks (keeps volumes)..."
    docker-compose -f docker-compose.prod.yml down
    echo "✅ Cleaned!"
    echo "ℹ️  To remove volumes (deletes data): docker volume rm radio-calico-db"
    ;;

  *)
    echo "Radio Calico - Production Docker Helper"
    echo ""
    echo "Usage: ./docker-prod.sh <command>"
    echo ""
    echo "Commands:"
    echo "  start          Start production container"
    echo "  stop           Stop production container"
    echo "  restart        Restart production container"
    echo "  rebuild        Rebuild and restart container"
    echo "  logs           View container logs (follow mode)"
    echo "  shell          Open shell in container"
    echo "  backup         Backup database to tar.gz file"
    echo "  restore <file> Restore database from tar.gz file"
    echo "  stats          Show resource usage statistics"
    echo "  status         Show container status and health"
    echo "  clean          Remove containers and networks (keeps data)"
    echo ""
    echo "Examples:"
    echo "  ./docker-prod.sh start"
    echo "  ./docker-prod.sh logs"
    echo "  ./docker-prod.sh backup"
    echo "  ./docker-prod.sh restore backup_20260216_120000.tar.gz"
    ;;
esac
