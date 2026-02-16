# Radio Calico System Architecture

This document provides comprehensive architecture diagrams for Radio Calico using Mermaid.

## Table of Contents
1. [Overall System Architecture](#overall-system-architecture)
2. [Production Deployment](#production-deployment)
3. [Development Architecture](#development-architecture)
4. [Data Flow](#data-flow)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Database Schema](#database-schema)

---

## Overall System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        DevTools[Browser DevTools]
    end

    subgraph "CDN/External Services"
        HLS[HLS Stream Source<br/>Apple Test/Radio.co/etc]
        Fonts[Google Fonts CDN]
        HLSJS[HLS.js Library CDN]
    end

    subgraph "Docker Production Environment"
        subgraph "nginx Container :80"
            NGINX[nginx Web Server<br/>Port 80]
            Static[Static Files<br/>HTML/CSS/JS]
            CSP[Content Security Policy]
        end

        subgraph "Node.js Container :3000"
            Express[Express.js Server<br/>Port 3000]
            API[REST API Endpoints]
            DBConfig[Database Config<br/>SQLite/PostgreSQL]
        end

        subgraph "PostgreSQL Container :5432"
            Postgres[PostgreSQL 15<br/>Port 5432]
            UsersTable[(users table)]
            RatingsTable[(ratings table)]
        end

        Network[Docker Bridge Network]
    end

    Browser -->|HTTP :80| NGINX
    Browser -->|Load HLS Stream| HLS
    Browser -->|Load Fonts| Fonts
    Browser -->|Load HLS.js| HLSJS

    NGINX -->|Serve| Static
    NGINX -->|Reverse Proxy /api/*| Express
    NGINX -->|Apply| CSP

    Express -->|Query| DBConfig
    DBConfig -->|Development| SQLite[SQLite File<br/>database.db]
    DBConfig -->|Production| Postgres

    Postgres -->|Store| UsersTable
    Postgres -->|Store| RatingsTable

    Express -.->|Internal Network| Network
    NGINX -.->|Internal Network| Network
    Postgres -.->|Internal Network| Network

    DevTools -.->|Monitor| Browser

    style Browser fill:#e1f5ff
    style NGINX fill:#90EE90
    style Express fill:#FFD700
    style Postgres fill:#4169E1,color:#fff
    style HLS fill:#FF6B6B
```

---

## Production Deployment

```mermaid
graph TB
    subgraph "External Access"
        User[User Browser<br/>http://localhost]
        StreamProvider[Streaming Service<br/>Radio.co/Mixlr/AWS]
    end

    subgraph "Docker Host - Production"
        subgraph "Port Mapping"
            Port80[":80 → :80"]
        end

        subgraph "nginx Container"
            NGINX[nginx 1.25-alpine<br/>11 MB RAM]
            NginxConf[nginx.conf<br/>default.conf]
            NginxLogs[/var/log/nginx]
        end

        subgraph "Application Container"
            NodeApp[Node.js 18-alpine<br/>19 MB RAM]
            ServerJS[server.js<br/>Express App]
            Routes[API Routes<br/>users, ratings, health]
        end

        subgraph "Database Container"
            PG[PostgreSQL 15-alpine<br/>40 MB RAM]
            PGData[/var/lib/postgresql/data]
        end

        subgraph "Docker Volumes"
            V1[(postgres-data)]
            V2[(nginx-logs)]
        end

        subgraph "Docker Network"
            Bridge[radio-calico-network<br/>Bridge Driver]
        end
    end

    User -->|HTTP Request| Port80
    Port80 --> NGINX
    NGINX -->|/api/*| NodeApp
    NGINX -->|/*.html,css,js| Static[Static Files<br/>public/]
    NGINX --> NginxLogs

    NodeApp --> ServerJS
    ServerJS --> Routes
    Routes -->|SQL Queries| PG

    PG --> PGData
    PGData --> V1
    NginxLogs --> V2

    NGINX -.->|Internal| Bridge
    NodeApp -.->|Internal| Bridge
    PG -.->|Internal| Bridge

    NodeApp -->|Fetch Stream| StreamProvider
    User -->|Direct HLS| StreamProvider

    style User fill:#e1f5ff
    style NGINX fill:#90EE90
    style NodeApp fill:#FFD700
    style PG fill:#4169E1,color:#fff
    style V1 fill:#DDA0DD
    style V2 fill:#DDA0DD
```

---

## Development Architecture

```mermaid
graph TB
    subgraph "Developer Workstation"
        IDE[IDE/VS Code]
        Terminal[Terminal]
        LocalBrowser[Browser<br/>localhost:3000]
    end

    subgraph "Development Options"
        subgraph "Option 1: Docker Dev"
            DockerDev[docker-compose up]
            DevContainer[Dev Container<br/>nodemon hot-reload]
            VolMount[Volume Mount<br/>./public, ./src]
            SQLiteDev[(SQLite Dev DB)]
        end

        subgraph "Option 2: Local Node"
            NPMDev[npm run dev]
            LocalNode[Node.js Local<br/>Port 3000]
            SQLiteLocal[(SQLite Local DB)]
        end
    end

    subgraph "Development Tools"
        Jest[Jest + Supertest<br/>63 Unit Tests]
        SecurityScan[security-scan.sh<br/>npm audit]
        Make[Makefile<br/>make.bat]
    end

    IDE -->|Edit Code| VolMount
    IDE -->|Run Commands| Terminal

    Terminal -->|make dev| DockerDev
    Terminal -->|make dev-local| NPMDev
    Terminal -->|make test| Jest
    Terminal -->|make security-scan| SecurityScan

    DockerDev --> DevContainer
    DevContainer -->|Hot Reload| VolMount
    DevContainer --> SQLiteDev

    NPMDev --> LocalNode
    LocalNode --> SQLiteLocal

    LocalBrowser -->|Test| DevContainer
    LocalBrowser -->|Test| LocalNode

    style IDE fill:#FFD700
    style Terminal fill:#90EE90
    style Jest fill:#FF6B6B
    style Make fill:#DDA0DD
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant N as nginx
    participant A as Node.js App
    participant D as PostgreSQL
    participant S as HLS Stream

    Note over U,S: Page Load Sequence
    U->>N: GET /
    N->>U: Return index.html
    U->>N: GET /radio-calico.css
    N->>U: Return CSS
    U->>N: GET /radio-calico.js
    N->>U: Return JS

    Note over U,S: Stream Playback
    U->>S: Request HLS Manifest (.m3u8)
    S->>U: Return Playlist
    U->>S: Request Media Segments (.ts)
    S->>U: Stream Audio Chunks
    U->>U: HLS.js Decodes & Plays

    Note over U,S: Song Rating Flow
    U->>N: GET /api/ratings/:songId
    N->>A: Proxy Request
    A->>D: SELECT ratings WHERE song_id=?
    D->>A: Return Rating Counts
    A->>N: JSON Response
    N->>U: Rating Data

    U->>N: POST /api/ratings
    N->>A: Proxy Request
    A->>D: INSERT/UPDATE rating
    D->>A: Success
    A->>N: JSON Response
    N->>U: Confirmation

    Note over U,S: Health Check
    U->>N: GET /api/health
    N->>A: Proxy Request
    A->>D: Test Connection
    D->>A: OK
    A->>N: {"status":"ok","database":"connected"}
    N->>U: Health Status
```

---

## CI/CD Pipeline

```mermaid
graph LR
    subgraph "Developer"
        Dev[Developer]
        LocalGit[Local Git]
    end

    subgraph "GitHub"
        Repo[GitHub Repository<br/>master branch]
        PR[Pull Request]
        Actions[GitHub Actions]
    end

    subgraph "CI Workflow Jobs"
        subgraph "Test Job"
            T1[Node 18.x Tests]
            T2[Node 20.x Tests]
            T3[Node 22.x Tests]
            TC[Coverage Report]
        end

        subgraph "Security Job"
            S1[npm audit]
            S2[security-scan.sh]
            S3[Generate Reports]
        end

        subgraph "Quality Job"
            Q1[Syntax Check]
            Q2[package.json Validate]
        end

        subgraph "Docker Job"
            D1[Build Dev Image]
            D2[Build Prod Image]
            D3[Test Images]
        end

        Status[All Checks Pass]
    end

    subgraph "Artifacts & Reports"
        A1[(Test Results<br/>7 days)]
        A2[(Security Reports<br/>30 days)]
        A3[(Coverage<br/>Codecov)]
    end

    subgraph "Automation"
        Dependabot[Dependabot<br/>Weekly Updates]
        WeeklyScan[Weekly Security Scan<br/>Monday 9 AM UTC]
    end

    Dev -->|git push| LocalGit
    LocalGit -->|push| Repo
    Repo -->|create| PR
    PR -->|trigger| Actions

    Actions --> T1 & T2 & T3
    T1 & T2 & T3 --> TC
    TC --> A1 & A3

    Actions --> S1
    S1 --> S2
    S2 --> S3
    S3 --> A2

    Actions --> Q1 & Q2
    Actions --> D1 & D2 & D3

    T3 & S3 & Q2 & D3 --> Status
    Status -->|pass| Repo

    Repo -.->|schedule| WeeklyScan
    Repo -.->|monitor| Dependabot
    Dependabot -.->|create| PR

    style Dev fill:#e1f5ff
    style Actions fill:#90EE90
    style Status fill:#FFD700
    style A1 fill:#DDA0DD
    style A2 fill:#DDA0DD
    style A3 fill:#DDA0DD
```

---

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ RATINGS : creates

    USERS {
        integer id PK "Auto-increment"
        text name "NOT NULL"
        text email "UNIQUE, NOT NULL"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    RATINGS {
        integer id PK "Auto-increment"
        text song_id "NOT NULL, Base64(artist|title)"
        text artist "Optional metadata"
        text title "Optional metadata"
        text user_id "NOT NULL, from localStorage"
        text rating "NOT NULL, 'up' or 'down'"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
        constraint unique_song_user "UNIQUE(song_id, user_id)"
    }

    USERS ||--o{ RATINGS : "user_id references localStorage ID"
```

**Indexes:**
- `idx_ratings_song_id` on `ratings(song_id)` for fast song lookups
- `UNIQUE(song_id, user_id)` prevents duplicate votes

**Notes:**
- Users table is legacy (demo feature)
- Ratings table is primary feature for song voting
- song_id is Base64 encoded: `btoa(artist + '::' + title)`
- user_id stored in browser localStorage, not FK to users table

---

## Component Interaction Map

```mermaid
graph TB
    subgraph "Frontend Components"
        HTML[index.html<br/>Structure]
        CSS[radio-calico.css<br/>875 lines<br/>Styling]
        JS[radio-calico.js<br/>503 lines<br/>Logic]
        Utils[radio-calico-utils.js<br/>Testable Functions]
    end

    subgraph "JavaScript Modules"
        HLSJS[HLS.js Library<br/>Stream Handling]
        Audio[HTML5 Audio Element<br/>Playback]
        WebAudio[Web Audio API<br/>Visualizer]
        Storage[localStorage<br/>User ID]
    end

    subgraph "API Integration"
        Fetch[Fetch API<br/>HTTP Requests]
        Endpoints[Express Routes<br/>/api/*]
    end

    subgraph "Backend Services"
        Express[Express.js<br/>server.js]
        DBLayer[database-config.js<br/>Abstraction]
        SQLite[database.js<br/>SQLite Impl]
        PostgreSQL[database-postgres.js<br/>PostgreSQL Impl]
    end

    HTML --> CSS
    HTML --> JS
    JS --> Utils
    JS --> HLSJS
    JS --> Audio
    JS --> WebAudio
    JS --> Storage
    JS --> Fetch

    HLSJS --> Audio
    Audio --> WebAudio

    Fetch --> Endpoints
    Endpoints --> Express
    Express --> DBLayer
    DBLayer --> SQLite
    DBLayer --> PostgreSQL

    style HTML fill:#FF6B6B
    style CSS fill:#4169E1,color:#fff
    style JS fill:#FFD700
    style Express fill:#90EE90
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "nginx Security"
            CSP[Content Security Policy<br/>Restricts Resources]
            RateLimit[Rate Limiting<br/>API: 100/min<br/>General: 200/min]
            Headers[Security Headers<br/>X-Frame-Options<br/>X-Content-Type-Options]
        end

        subgraph "Application Security"
            InputVal[Input Validation<br/>Rating: up/down only]
            SQLProtect[SQL Injection Protection<br/>Parameterized Queries]
            NonRoot[Non-root User<br/>nodejs:1001]
        end

        subgraph "Docker Security"
            SecOpt[Security Options<br/>no-new-privileges]
            HealthCheck[Health Checks<br/>Auto-restart on failure]
            ResourceLimit[Resource Limits<br/>CPU/Memory caps]
        end

        subgraph "CI/CD Security"
            AuditCI[npm audit<br/>Every commit]
            Weekly[Weekly Security Scan<br/>90-day retention]
            Dependabot[Automated Updates<br/>Security patches]
        end
    end

    subgraph "Monitoring"
        Logs[nginx Access/Error Logs]
        Artifacts[Security Reports<br/>Archived]
        Issues[Auto-created Issues<br/>Critical vulnerabilities]
    end

    CSP --> Headers
    Headers --> RateLimit

    InputVal --> SQLProtect
    SQLProtect --> NonRoot

    NonRoot --> SecOpt
    SecOpt --> HealthCheck
    HealthCheck --> ResourceLimit

    AuditCI --> Weekly
    Weekly --> Dependabot

    Weekly --> Artifacts
    Artifacts --> Issues
    RateLimit --> Logs

    style CSP fill:#FF6B6B
    style InputVal fill:#FFD700
    style SecOpt fill:#4169E1,color:#fff
    style AuditCI fill:#90EE90
```

---

## Make Targets Overview

```mermaid
graph LR
    subgraph "Developer Commands"
        Help[make help]
        Install[make install]
    end

    subgraph "Development"
        Dev[make dev]
        DevLocal[make dev-local]
        DevLogs[make dev-logs]
        DevTest[make dev-test]
    end

    subgraph "Production"
        Prod[make prod]
        ProdStatus[make prod-status]
        ProdTest[make prod-test]
        ProdRebuild[make prod-rebuild]
    end

    subgraph "Testing"
        Test[make test]
        TestWatch[make test-watch]
        TestCov[make test-coverage]
    end

    subgraph "Security"
        SecScan[make security-scan]
        SecFix[make security-fix]
        SecReport[make security-report]
    end

    subgraph "Database"
        Backup[make backup]
        Restore[make restore]
        DBShell[make db-shell]
    end

    subgraph "Management"
        Stop[make stop]
        Clean[make clean]
        Status[make status]
    end

    Help --> Install
    Install --> Dev & DevLocal
    Dev --> DevLogs & DevTest

    Prod --> ProdStatus & ProdTest
    ProdTest --> ProdRebuild

    Test --> TestWatch & TestCov

    SecScan --> SecFix
    SecFix --> SecReport

    Backup --> Restore
    Restore --> DBShell

    Stop --> Clean
    Clean --> Status

    style Help fill:#FFD700
    style Prod fill:#FF6B6B
    style Test fill:#90EE90
    style SecScan fill:#4169E1,color:#fff
```

---

## File Structure Tree

```
radiocalico/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Main CI pipeline
│   │   ├── security-scan.yml         # Weekly security
│   │   └── README.md                 # Workflow docs
│   └── dependabot.yml                # Dependency automation
│
├── nginx/
│   ├── nginx.conf                    # Main nginx config
│   └── default.conf                  # Site config + CSP
│
├── public/
│   ├── index.html                    # HTML structure (149 lines)
│   ├── radio-calico.css              # Styling (875 lines)
│   ├── radio-calico.js               # Main logic (503 lines)
│   └── radio-calico-utils.js         # Testable utils
│
├── server.js                         # Express server
├── database.js                       # SQLite implementation
├── database-postgres.js              # PostgreSQL implementation
├── database-config.js                # DB abstraction layer
│
├── server.test.js                    # Backend tests (25)
├── frontend.test.js                  # Frontend tests (38)
├── test-helpers.js                   # Test utilities
│
├── security-scan.sh                  # Security scanner
├── Makefile                          # Linux/Mac commands
├── make.bat                          # Windows commands
│
├── Dockerfile                        # Multi-stage build
├── docker-compose.yml                # Development
├── docker-compose.prod.yml           # Production
├── docker-dev.sh                     # Dev helper
├── docker-prod.sh                    # Prod helper
│
├── .env.production                   # Prod environment vars
├── package.json                      # Dependencies
├── package-lock.json                 # Locked versions
│
├── README.md                         # Main documentation
├── CLAUDE.md                         # Project guide
├── ARCHITECTURE.md                   # This file
└── .gitignore                        # Git exclusions
```

---

## Technology Stack

```mermaid
mindmap
  root((Radio Calico))
    Frontend
      HTML5
      CSS3
        Animations
        Flexbox/Grid
      Vanilla JavaScript
      HLS.js
      Web Audio API
    Backend
      Node.js 18
      Express.js 4
      SQLite3
      PostgreSQL 15
    DevOps
      Docker
        Multi-stage builds
        Alpine Linux
      Docker Compose
      nginx 1.25
    Testing
      Jest
      Supertest
      63 Unit Tests
    CI/CD
      GitHub Actions
      Dependabot
      npm audit
    Tools
      Makefile
      Bash scripts
      Git
```

---

## Deployment Options

```mermaid
graph TB
    Code[Source Code]

    subgraph "Local Development"
        L1[npm run dev<br/>Port 3000]
        L2[Docker Dev<br/>Hot reload]
    end

    subgraph "Local Production Test"
        P1[docker-compose prod<br/>Port 80]
        P2[PostgreSQL + nginx]
    end

    subgraph "Cloud Deployment Options"
        C1[AWS ECS<br/>+ RDS + CloudFront]
        C2[DigitalOcean<br/>Droplet + App Platform]
        C3[Heroku<br/>+ Heroku Postgres]
        C4[Railway<br/>+ Railway DB]
        C5[Render<br/>+ Render DB]
    end

    Code --> L1 & L2
    Code --> P1
    P1 --> P2
    Code --> C1 & C2 & C3 & C4 & C5

    style Code fill:#FFD700
    style L1 fill:#90EE90
    style P1 fill:#FF6B6B
    style C1 fill:#4169E1,color:#fff
```

---

## Summary

Radio Calico is a **production-ready streaming radio application** with:

- **Modern Architecture**: Microservices in Docker containers
- **Robust Testing**: 63 automated tests with CI/CD
- **Security First**: CSP, rate limiting, automated audits
- **Developer Friendly**: Make targets, hot-reload, comprehensive docs
- **Scalable**: PostgreSQL, nginx, container orchestration
- **Maintainable**: Clean separation of concerns, well-documented

Total Lines of Code:
- Frontend: ~1,530 lines (HTML/CSS/JS)
- Backend: ~600 lines (Node.js/Express)
- Tests: ~800 lines (Jest/Supertest)
- DevOps: ~1,000 lines (Docker/CI/nginx)
- **Total: ~4,000 lines** of production code

Built with ❤️ using Claude Code
