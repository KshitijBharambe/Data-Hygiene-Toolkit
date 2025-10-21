# 🧹 Data Hygiene Toolkit

A comprehensive data quality validation and management platform for ensuring data integrity across your organization. Built with FastAPI, Next.js, and PostgreSQL, deployed to GCP.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Quick Start

```bash
# First-time setup
make setup

# Start development (hot reload enabled)
make dev

# Verify everything works
make health-check

# View logs
make logs
```

**That's it!** Your full development environment is running:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

---

## ✨ Features

### Core Capabilities
- 📊 **Multi-Format Data Import**: CSV, Excel, Parquet support
- 🎯 **Comprehensive Rule Engine**: 8 validator types for data quality
- 📈 **Real-time Validation**: Execute rules on datasets with detailed issue tracking
- 📝 **Rule Versioning**: Track changes with complete audit trails
- 🔄 **Batch Processing**: Handle large datasets with memory-efficient chunking
- 📤 **Export Capabilities**: Export validated data in multiple formats
- 🔍 **Advanced Search**: Full-text search across datasets, rules, and issues

### Technical Features
- 🐳 **Production-Grade Docker**: Multi-stage builds, dev/prod parity
- ☁️ **Cloud-Ready**: GCP deployment (Cloud Run, Cloud SQL, Cloud Storage)
- 🔒 **Secure**: OAuth/JWT authentication, non-root containers
- 📱 **Responsive UI**: Modern design with shadcn/ui components
- ⚡ **Optimized Performance**: Connection pooling, memory management
- 🔄 **Storage Abstraction**: Seamless MinIO ↔ GCS switching

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI 0.116+
- **Language**: Python 3.13
- **Database**: PostgreSQL 17
- **ORM**: SQLAlchemy 2.0+
- **Storage**: MinIO (dev) / GCS (prod)

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5+
- **UI**: Radix UI, shadcn/ui, Tailwind CSS 4

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Make (30+ commands)
- **Cloud**: Google Cloud Platform (GCP)
- **IaC**: Terraform (Phase 2)

---

## 📁 Project Structure

```
API/
├── api/                    # Backend (FastAPI)
│   ├── app/               # Application code
│   ├── migrations/        # Database migrations
│   └── pyproject.toml     # Python dependencies
├── frontend/              # Frontend (Next.js)
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   └── package.json      # Node dependencies
├── docker/               # Docker configuration
│   ├── backend/         # Backend Dockerfile
│   ├── frontend/        # Frontend Dockerfile
│   └── compose/         # Docker Compose files
├── docs/                # Documentation
│   ├── infrastructure/  # Docker, deployment, etc.
│   └── features/        # Application features
├── scripts/            # Automation scripts
├── Makefile           # Development commands
└── .env.example       # Environment template
```

---

## 🏗️ Architecture

### Three-Tier System

```
┌─────────────────────────────────┐
│  Tier 1: Local Development     │
│  • Hot reload                   │
│  • Fast iteration               │
│  • make dev                     │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│  Tier 2: Prod Simulation        │
│  • Production builds            │
│  • Resource limits              │
│  • make prod-sim                │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│  Tier 3: GCP Production         │
│  • Cloud Run                    │
│  • Cloud SQL                    │
│  • Cloud Storage                │
└─────────────────────────────────┘
```

### Local Development

```
Frontend (3000) ──▶ Backend (8000)
                        │
          ┌─────────────┴──────────────┐
          │                            │
    PostgreSQL (5432)          MinIO (9000)
```

---

## 📋 Common Commands

### Development
```bash
make dev              # Start development
make stop             # Stop containers
make restart          # Restart services
make logs             # View all logs
make logs-api         # Backend logs only
```

### Testing
```bash
make test             # Run all tests
make test-coverage    # With coverage report
make lint             # Run linters
make format           # Auto-format code
```

### Database
```bash
make db-migrate       # Run migrations
make db-shell         # PostgreSQL shell
make db-backup        # Backup to ./backups/
```

### Production Simulation
```bash
make prod-sim         # Build & start
make rebuild          # Full rebuild
```

**See all commands:** `make help`

---

## 📚 Documentation

### Getting Started
- **[Quick Reference](docs/infrastructure/QUICK_REFERENCE.md)** - Command cheat sheet
- **[Phase 1 Summary](docs/infrastructure/PHASE1_SUMMARY.md)** - Architecture overview
- **[Verification Guide](docs/infrastructure/PHASE1_VERIFICATION.md)** - Testing checklist

### Technical Details
- **[Docker Architecture](docs/infrastructure/DOCKER.md)** - Multi-stage builds, compose
- **[Phase 1 Complete](docs/infrastructure/PHASE1_COMPLETE.md)** - Full implementation guide

### Application Features
- **[Rules System](docs/features/rules-system-docs.md)** - Rule engine documentation
- **[Rule Versioning](docs/features/RULE_VERSIONING_GUIDE.md)** - Version control for rules

**Full documentation:** [docs/README.md](docs/README.md)

---

## 🎯 Development Workflow

### First Time
1. Clone repository
2. Run `make setup` (creates .env files)
3. Run `make dev` (starts all services)
4. Run `make db-migrate` (set up database)
5. Open http://localhost:3000

### Daily Development
```bash
make dev              # Start
# Edit code → auto-reload!
make test             # Test changes
make stop             # Stop when done
```

### Before Committing
```bash
make test             # Tests pass?
make lint             # Code quality?
make prod-sim         # Prod build works?
```

---

## 🔧 Configuration

### Environment Files
- **`.env`** - Development (hot reload, debug logging)
- **`.env.prod-sim`** - Production simulation (optimized builds)

### Key Settings
```bash
# Database
DATABASE_URL=postgresql://admin:password@postgres:5432/data_hygiene

# Storage (auto-switches between MinIO and GCS)
STORAGE_TYPE=minio  # or 'gcs' in production
STORAGE_BUCKET=data-hygiene-local

# API
API_PORT=8000
DEBUG=true  # false in production
```

---

## 🚢 Deployment

### Current Status
- ✅ **Phase 1**: Production-grade Docker setup (Complete)
- 🚧 **Phase 2**: Terraform + GCP infrastructure (In Progress)
- 📋 **Phase 3**: CI/CD pipeline (Planned)

### Production Environment (Phase 2)
- **Frontend**: Vercel (Next.js SSR)
- **Backend**: GCP Cloud Run (serverless)
- **Database**: GCP Cloud SQL (PostgreSQL 17)
- **Storage**: GCP Cloud Storage (GCS)

---

## 🧪 Testing

### Run Tests
```bash
# All tests
make test

# Specific test types
make test-unit
make test-integration

# With coverage
make test-coverage
```

### Test Coverage
```bash
# Generate HTML report
make test-coverage

# View report
open htmlcov/index.html
```

---

## 🤝 Development

### Code Quality
```bash
# Check code
make lint

# Auto-format
make format

# Type checking
make type-check
```

### Database Migrations
```bash
# Create new migration
make db-migrate-create MSG="add users table"

# Apply migrations
make db-migrate

# Access database
make db-shell
```

---

## 📊 Monitoring

### Health Checks
```bash
make health-check     # Check all services
make status           # Container status
make docker-stats     # Resource usage
```

### Logs
```bash
make logs             # All services
make logs-api         # Backend only
make logs-frontend    # Frontend only
make logs-db          # Database only
```

---

## 🐛 Troubleshooting

### Common Issues

**Ports already in use**
```bash
# Check what's using ports
lsof -i :8000  # or :3000, :5432
# Or change ports in .env
```

**Services not starting**
```bash
# Check logs
make logs

# Restart
make restart

# Or full rebuild
make rebuild
```

**Database connection errors**
```bash
# Check PostgreSQL is healthy
make status

# Restart database
docker restart dht-postgres
```

See [docs/infrastructure/PHASE1_VERIFICATION.md](docs/infrastructure/PHASE1_VERIFICATION.md) for more troubleshooting.

---

## 🎓 For Hiring Managers

This project demonstrates:

### Technical Skills
- **Multi-stage Docker builds** for optimization
- **Dev/prod parity** following 12-factor app methodology
- **Storage abstraction** for cloud-agnostic design
- **Infrastructure as Code** with Terraform (Phase 2)
- **CI/CD automation** with GitHub Actions (Phase 3)

### Architecture
- **Microservices** design patterns
- **Cloud-native** architecture (GCP)
- **Security** best practices (non-root containers, secrets management)
- **Performance** optimization (connection pooling, caching)

### DevOps
- **Container orchestration** with Docker Compose
- **Automation** with Make (30+ commands)
- **Monitoring** with health checks and logging
- **Database** migration management

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Kshitij Bharambe**
- AWS Solutions Architect Associate (SAA-C03)
- Backend & Cloud Engineer at Cognologix
- CS Graduate Student at Syracuse University
- Portfolio: [kshitij.space](https://kshitij.space)
- GitHub: [@kshitij-bharambe](https://github.com/kshitij-bharambe)

---

## 🚀 Project Status

- ✅ **Core Features**: Complete
- ✅ **Docker Setup**: Complete (Phase 1)
- ✅ **Local Development**: Production-ready
- 🚧 **GCP Infrastructure**: In Progress (Phase 2)
- 📋 **CI/CD Pipeline**: Planned (Phase 3)
- 📋 **Documentation**: Continuous improvement

---

**Ready to start?** Run `make setup && make dev` 🎉
