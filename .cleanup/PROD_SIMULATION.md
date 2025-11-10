# Production Simulation Environment

## Overview

The **Production Simulation Environment** is a complete local replica of your production stack that runs on your machine. It mimics the exact architecture, constraints, and services of your deployed application on Vercel, Fly.io, and Supabase.

### Why Production Simulation?

- **Test Before Deploy**: Validate changes in a prod-like environment before pushing to production
- **Debug Production Issues**: Reproduce and fix prod-specific bugs locally
- **Performance Testing**: Test with real memory/CPU constraints matching Fly.io VMs
- **Integration Testing**: Verify all services work together correctly
- **Cost-Free Experimentation**: No cloud costs for testing and development
- **Offline Development**: Work without internet connectivity

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Production Simulation                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │   Supabase   │      │
│  │   (Vercel)   │  │   (Fly.io)   │  │  (Database)  │      │
│  │              │  │              │  │              │      │
│  │  Next.js 15  │  │  FastAPI     │  │  PostgreSQL  │      │
│  │  Standalone  │  │  + Uvicorn   │  │  + Auth      │      │
│  │              │  │              │  │  + Storage   │      │
│  │  Port: 3000  │  │  Port: 8000  │  │  + Realtime  │      │
│  │              │  │              │  │  + Studio    │      │
│  │  512MB RAM   │  │  256MB RAM   │  │              │      │
│  │  1 CPU       │  │  1 CPU       │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                   │
│                  Docker Network                              │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

1. **Docker Desktop** (latest version)
   ```bash
   # Verify installation
   docker --version
   docker-compose --version
   ```

2. **Supabase CLI** (optional but recommended)
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Verify installation
   supabase --version
   ```

3. **Fly CLI** (optional, for advanced features)
   ```bash
   # macOS
   brew install flyctl

   # Verify installation
   flyctl version
   ```

### Quick Start

1. **Start the environment**
   ```bash
   make prod-sim
   ```

   Or manually:
   ```bash
   ./scripts/prod-sim/start.sh
   ```

2. **Verify all services are healthy**
   ```bash
   make health-check
   ```

3. **Access the services**
   - **Frontend**: http://localhost:3000
   - **API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs
   - **Supabase Studio**: http://localhost:54323
   - **Email Testing**: http://localhost:54324

### Configuration

#### Environment Variables

The production simulation uses `.env.prod-sim` for configuration. This file is automatically created from `.env.example` on first run.

**Key variables:**
```bash
# Database
POSTGRES_PASSWORD=postgres

# Supabase
JWT_SECRET=your-jwt-secret
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key

# API
DATABASE_URL=postgresql+psycopg://postgres:postgres@pgbouncer:6432/postgres
SECRET_KEY=your-api-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-nextauth-secret
```

**To regenerate secrets:**
```bash
# JWT Secret
openssl rand -base64 32

# NextAuth Secret
openssl rand -base64 32

# API Secret Key
openssl rand -hex 32
```

## Available Services

### 1. Frontend (Port 3000)

**Simulates**: Vercel deployment

- **Technology**: Next.js 15 with standalone build
- **Build**: Production optimized, mirrors Vercel's build process
- **Constraints**: 512MB RAM, 1 CPU
- **Access**: http://localhost:3000

**Features:**
- Same build output as Vercel
- Production mode (`NODE_ENV=production`)
- Standalone server (node server.js)
- All Next.js optimizations enabled

### 2. Backend API (Port 8000)

**Simulates**: Fly.io deployment

- **Technology**: FastAPI + Python 3.12
- **Constraints**: 256MB RAM, 1 shared CPU (matches production)
- **Access**: http://localhost:8000
- **Docs**: http://localhost:8000/docs

**Features:**
- Exact memory constraints as production Fly.io VM
- Connection pooling via pgBouncer
- Production database migrations on startup
- Health checks matching production
- Volume mounts for data persistence

### 3. Supabase Services

#### PostgreSQL Database (Port 54322)
- **Version**: PostgreSQL 16 (matching production)
- **Connection**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **Pooler** (pgBouncer): Port 54329

#### Supabase Studio (Port 54323)
- **Access**: http://localhost:54323
- **Purpose**: Database management UI
- **Features**: Table editor, SQL editor, API explorer

#### Kong API Gateway (Port 54321)
- **Access**: http://localhost:54321
- **Purpose**: Routes requests to Auth, REST, Storage, Realtime
- **Configuration**: `supabase/kong.yml`

#### GoTrue Auth (Internal)
- Handles authentication and user management
- OAuth providers (if configured)
- JWT token generation

#### PostgREST (Internal)
- Auto-generated REST API from database schema
- Row-level security support

#### Storage API (Internal)
- File upload and management
- Image transformation via imgproxy

#### Realtime Service (Internal)
- WebSocket server for real-time updates
- Database change notifications

#### Inbucket Email Testing (Port 54324)
- **Access**: http://localhost:54324
- **Purpose**: Capture and view emails sent by the application
- **No real emails are sent**

## Common Tasks

### Starting and Stopping

```bash
# Start everything
make prod-sim

# Start (if already built)
make prod-sim-up

# Stop (keeps data)
make prod-sim-down

# Restart services
make prod-sim-restart

# Clean everything (removes all data)
make prod-sim-clean
```

### Viewing Logs

```bash
# All services
make prod-sim-logs

# Specific service
make logs-api
make logs-frontend
make logs-db

# Or use SERVICE parameter
make prod-sim-logs SERVICE=prodsim-api
```

### Database Operations

```bash
# Run migrations
make db-migrate

# Create new migration
make db-revision MESSAGE="add new column"

# Connect to PostgreSQL shell
make db-shell

# Reset database (Supabase)
make supabase-reset
```

### Health Monitoring

```bash
# Check all services
make health-check

# View service status
make prod-sim-status

# View Supabase-specific status
make supabase-status
```

### Testing

```bash
# Run API tests
make test

# Run tests with coverage
make test-coverage
```

### Accessing Containers

```bash
# API shell
make shell-api
docker-compose -f docker-compose.prod-sim.yml exec api sh

# Frontend shell
make shell-frontend
docker-compose -f docker-compose.prod-sim.yml exec frontend sh

# Database shell
make db-shell
docker-compose -f docker-compose.prod-sim.yml exec db psql -U postgres
```

## Differences from Production

While the simulation is very close to production, there are some differences:

| Aspect | Production | Simulation |
|--------|-----------|-----------|
| **Hosting** | Vercel/Fly.io/Supabase | Docker Compose |
| **HTTPS** | Enforced | HTTP only (local) |
| **Domains** | Custom domains | localhost |
| **Secrets** | Managed secrets | .env file |
| **Auto-scaling** | Yes (Vercel/Fly) | No (fixed containers) |
| **Geographic distribution** | Multi-region | Single machine |
| **Backups** | Automatic | Manual |
| **Monitoring** | Built-in | Manual/scripts |

## Troubleshooting

### Service Not Starting

```bash
# Check logs
make prod-sim-logs SERVICE=service-name

# Check container status
docker ps -a | grep prodsim

# Restart specific service
docker-compose -f docker-compose.prod-sim.yml restart service-name
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose -f docker-compose.prod-sim.yml ps db

# Check database logs
make logs-db

# Test connection
docker-compose -f docker-compose.prod-sim.yml exec db psql -U postgres -c "SELECT 1"
```

### Port Conflicts

If ports are already in use:

```bash
# Find process using port
lsof -i :3000   # Frontend
lsof -i :8000   # API
lsof -i :54322  # PostgreSQL

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.prod-sim.yml
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: 8GB for smooth operation
```

### Clean Start

```bash
# Nuclear option - clean everything
make clean-all

# Rebuild from scratch
make rebuild
```

## Performance Testing

### Memory Constraints

The API service runs with 256MB RAM limit (matching Fly.io):

```bash
# Monitor memory usage
docker stats prodsim-api

# View memory logs in API
make logs-api | grep "Memory"
```

### Load Testing

```bash
# Install Apache Bench
brew install apache-bench

# Test API endpoint
ab -n 1000 -c 10 http://localhost:8000/

# Test with larger payload
ab -n 100 -c 5 -p data.json -T application/json http://localhost:8000/upload/
```

### Database Performance

```bash
# Connect to database
make db-shell

# Check connection pool stats
SELECT * FROM pg_stat_activity;

# Monitor query performance
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## Best Practices

### 1. Regular Cleanup

```bash
# Clean up stopped containers weekly
make clean-docker

# Clean prod-sim environment monthly
make prod-sim-clean
```

### 2. Keep Secrets Safe

- Never commit `.env.prod-sim` with real production credentials
- Regenerate secrets regularly
- Use different secrets for each environment

### 3. Test Before Production

```bash
# Test migration in prod-sim first
make db-revision MESSAGE="new migration"
make db-migrate
make test

# Only then deploy to production
```

### 4. Monitor Resource Usage

```bash
# Check Docker resource usage
docker system df

# Clean up unused resources
docker system prune -a
```

## Advanced Usage

### Custom Docker Compose Override

Create `docker-compose.prod-sim.override.yml`:

```yaml
version: '3.8'
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M  # Increase from 256M
```

Run with:
```bash
docker-compose -f docker-compose.prod-sim.yml -f docker-compose.prod-sim.override.yml up
```

### Integration with CI/CD

```yaml
# .github/workflows/test.yml
- name: Start Prod Simulation
  run: make prod-sim

- name: Wait for services
  run: |
    sleep 30
    make health-check

- name: Run integration tests
  run: make test
```

### Using with Fly.io CLI

```bash
# Deploy to Fly.io using local config
flyctl deploy --local-only --config fly.local.toml
```

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. View logs: `make prod-sim-logs`
3. Check health: `make health-check`
4. Review documentation: `docs/PROD_SIMULATION.md`

## Related Documentation

- [Main README](../README.md) - Project overview and setup
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Fly.io Documentation](https://fly.io/docs/)
- [Next.js Standalone Mode](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

**Built with ❤️ for production-quality local development**
