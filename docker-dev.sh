#!/bin/bash
# Radio Calico - Development Docker Helper Script

set -e

command=$1

case $command in
  start)
    echo "🚀 Starting Radio Calico in development mode..."
    docker-compose up -d
    echo "✅ Started! Access at http://localhost:3000"
    echo "📋 View logs: ./docker-dev.sh logs"
    ;;

  stop)
    echo "🛑 Stopping Radio Calico..."
    docker-compose down
    echo "✅ Stopped!"
    ;;

  restart)
    echo "🔄 Restarting Radio Calico..."
    docker-compose restart
    echo "✅ Restarted!"
    ;;

  rebuild)
    echo "🔨 Rebuilding and restarting..."
    docker-compose down
    docker-compose up -d --build
    echo "✅ Rebuilt and started!"
    ;;

  logs)
    docker-compose logs -f
    ;;

  shell)
    echo "🐚 Opening shell in container..."
    docker-compose exec radio-calico-dev sh
    ;;

  test)
    echo "🧪 Running tests..."
    docker-compose exec radio-calico-dev npm test
    ;;

  test:watch)
    echo "🧪 Running tests in watch mode..."
    docker-compose exec radio-calico-dev npm run test:watch
    ;;

  test:coverage)
    echo "📊 Running tests with coverage..."
    docker-compose exec radio-calico-dev npm run test:coverage
    ;;

  clean)
    echo "🧹 Cleaning up containers, networks, and volumes..."
    read -p "⚠️  This will delete all data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down -v
      echo "✅ Cleaned!"
    else
      echo "❌ Cancelled"
    fi
    ;;

  status)
    echo "📊 Container status:"
    docker-compose ps
    echo ""
    echo "🔍 Health check:"
    docker inspect --format='{{.State.Health.Status}}' radio-calico-dev 2>/dev/null || echo "Container not running"
    ;;

  *)
    echo "Radio Calico - Development Docker Helper"
    echo ""
    echo "Usage: ./docker-dev.sh <command>"
    echo ""
    echo "Commands:"
    echo "  start          Start development container"
    echo "  stop           Stop development container"
    echo "  restart        Restart development container"
    echo "  rebuild        Rebuild and restart container"
    echo "  logs           View container logs (follow mode)"
    echo "  shell          Open shell in container"
    echo "  test           Run tests"
    echo "  test:watch     Run tests in watch mode"
    echo "  test:coverage  Run tests with coverage"
    echo "  clean          Remove containers, networks, and volumes"
    echo "  status         Show container status"
    echo ""
    echo "Examples:"
    echo "  ./docker-dev.sh start"
    echo "  ./docker-dev.sh logs"
    echo "  ./docker-dev.sh test"
    ;;
esac
