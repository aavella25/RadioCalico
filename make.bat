@echo off
REM Windows batch wrapper for Radio Calico make targets
REM Usage: make.bat <target>

set TARGET=%1

if "%TARGET%"=="" (
    goto :help
)

if "%TARGET%"=="help" goto :help
if "%TARGET%"=="dev" goto :dev
if "%TARGET%"=="dev-local" goto :dev-local
if "%TARGET%"=="dev-logs" goto :dev-logs
if "%TARGET%"=="dev-test" goto :dev-test
if "%TARGET%"=="dev-shell" goto :dev-shell
if "%TARGET%"=="prod" goto :prod
if "%TARGET%"=="prod-setup" goto :prod-setup
if "%TARGET%"=="prod-rebuild" goto :prod-rebuild
if "%TARGET%"=="prod-logs" goto :prod-logs
if "%TARGET%"=="prod-status" goto :prod-status
if "%TARGET%"=="prod-test" goto :prod-test
if "%TARGET%"=="prod-shell" goto :prod-shell
if "%TARGET%"=="test" goto :test
if "%TARGET%"=="test-watch" goto :test-watch
if "%TARGET%"=="test-coverage" goto :test-coverage
if "%TARGET%"=="security-scan" goto :security-scan
if "%TARGET%"=="security-fix" goto :security-fix
if "%TARGET%"=="security-report" goto :security-report
if "%TARGET%"=="security-prod" goto :security-prod
if "%TARGET%"=="backup" goto :backup
if "%TARGET%"=="restore" goto :restore
if "%TARGET%"=="db-shell" goto :db-shell
if "%TARGET%"=="install" goto :install
if "%TARGET%"=="stop" goto :stop
if "%TARGET%"=="clean" goto :clean
if "%TARGET%"=="clean-all" goto :clean-all
if "%TARGET%"=="status" goto :status
if "%TARGET%"=="logs" goto :logs

echo Unknown target: %TARGET%
goto :help

:help
echo Radio Calico - Make Targets (Windows Batch Version)
echo.
echo Development:
echo   make.bat dev              Start development environment (Docker)
echo   make.bat dev-local        Start local development server
echo   make.bat dev-logs         View development logs
echo   make.bat dev-test         Run tests in development container
echo   make.bat dev-shell        Open shell in development container
echo.
echo Production:
echo   make.bat prod             Start production environment
echo   make.bat prod-setup       Create production environment file
echo   make.bat prod-rebuild     Rebuild and restart production
echo   make.bat prod-logs        View production logs
echo   make.bat prod-status      Check production service status
echo   make.bat prod-test        Test production deployment
echo   make.bat prod-shell       Open shell in production container
echo.
echo Testing:
echo   make.bat test             Run all tests locally
echo   make.bat test-watch       Run tests in watch mode
echo   make.bat test-coverage    Run tests with coverage report
echo.
echo Security:
echo   make.bat security-scan    Run npm security audit
echo   make.bat security-fix     Apply safe security fixes
echo   make.bat security-report  Generate detailed security report
echo   make.bat security-prod    Audit production dependencies only
echo.
echo Database:
echo   make.bat backup           Backup production database
echo   make.bat restore FILE     Restore production database
echo   make.bat db-shell         Open PostgreSQL shell
echo.
echo Management:
echo   make.bat install          Install Node.js dependencies
echo   make.bat stop             Stop all services
echo   make.bat clean            Clean up containers (keeps data)
echo   make.bat clean-all        Remove everything including data
echo   make.bat status           Show status of all services
echo   make.bat logs             View all logs
echo.
echo Note: On Linux/Mac, use 'make' instead of 'make.bat'
goto :end

:dev
echo Starting development environment...
bash docker-dev.sh start
goto :end

:dev-local
echo Starting local development server...
npm run dev
goto :end

:dev-logs
bash docker-dev.sh logs
goto :end

:dev-test
echo Running tests in development container...
bash docker-dev.sh test
goto :end

:dev-shell
bash docker-dev.sh shell
goto :end

:prod
echo Starting production environment...
bash docker-prod.sh start
goto :end

:prod-setup
echo Setting up production environment...
bash docker-prod.sh setup
goto :end

:prod-rebuild
echo Rebuilding production environment...
bash docker-prod.sh rebuild
goto :end

:prod-logs
bash docker-prod.sh logs
goto :end

:prod-status
bash docker-prod.sh status
goto :end

:prod-test
echo Testing production deployment...
bash docker-prod.sh test
goto :end

:prod-shell
bash docker-prod.sh shell
goto :end

:test
echo Running all tests...
npm test
goto :end

:test-watch
echo Running tests in watch mode...
npm test -- --watch
goto :end

:test-coverage
echo Running tests with coverage...
npm test -- --coverage
goto :end

:security-scan
echo Running security audit...
bash security-scan.sh scan
goto :end

:security-fix
echo Applying safe security fixes...
bash security-scan.sh fix
goto :end

:security-report
echo Generating security reports...
bash security-scan.sh report
goto :end

:security-prod
echo Auditing production dependencies only...
bash security-scan.sh check-production
goto :end

:backup
echo Backing up production database...
bash docker-prod.sh backup
goto :end

:restore
if "%2"=="" (
    echo Error: Please specify backup file
    echo Example: make.bat restore backup_postgres_20260216_095000.sql
    goto :end
)
echo Restoring database from %2...
bash docker-prod.sh restore %2
goto :end

:db-shell
echo Opening PostgreSQL shell...
bash docker-prod.sh db-shell
goto :end

:install
echo Installing Node.js dependencies...
npm install
goto :end

:stop
echo Stopping all services...
bash docker-dev.sh stop 2>nul
bash docker-prod.sh stop 2>nul
goto :end

:clean
echo Cleaning up containers (keeping data)...
bash docker-dev.sh clean 2>nul
bash docker-prod.sh clean 2>nul
goto :end

:clean-all
echo Cleaning up everything including data...
bash docker-dev.sh clean-all 2>nul
bash docker-prod.sh clean-all 2>nul
goto :end

:status
echo Development Status:
echo ====================
bash docker-dev.sh status 2>nul
if errorlevel 1 echo Development environment not running
echo.
echo Production Status:
echo ==================
bash docker-prod.sh status 2>nul
if errorlevel 1 echo Production environment not running
goto :end

:logs
bash docker-prod.sh logs
goto :end

:end
