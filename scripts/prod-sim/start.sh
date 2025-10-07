#!/bin/bash

# ============================================================================
# Production Simulation - Startup Script
# ============================================================================
# This script handles initialization and startup of the prod-sim environment
#
# Usage: ./scripts/prod-sim/start.sh
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Production Simulation - Startup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if .env.prod-sim exists
if [ ! -f .env.prod-sim ]; then
    echo -e "${YELLOW}⚠ .env.prod-sim not found${NC}"
    echo ""
    echo -e "${GREEN}Creating from template...${NC}"

    if [ -f .env.example ]; then
        cp .env.example .env.prod-sim
        echo -e "${GREEN}✓ Created .env.prod-sim from .env.example${NC}"
    else
        echo -e "${RED}✗ Error: .env.example not found${NC}"
        echo "Please create .env.prod-sim manually"
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}Please configure .env.prod-sim with appropriate values${NC}"
    echo "You can edit it now or press Enter to continue with defaults"
    read -p "Press Enter to continue..."
fi

# Load environment variables
echo -e "${BLUE}Loading environment variables...${NC}"
set -a
source .env.prod-sim
set +a
echo -e "${GREEN}✓ Environment loaded${NC}"
echo ""

# Check if Supabase CLI is installed
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠ Supabase CLI not found${NC}"
    echo "Install with: brew install supabase/tap/supabase"
    echo ""
    read -p "Continue without Supabase CLI? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Supabase CLI found${NC}"
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "Please install Docker Desktop"
    exit 1
else
    echo -e "${GREEN}✓ Docker found${NC}"
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found${NC}"
    echo "Please install Docker Compose"
    exit 1
else
    echo -e "${GREEN}✓ Docker Compose found${NC}"
fi

echo ""

# Check if containers are already running
if docker ps | grep -q "prodsim-"; then
    echo -e "${YELLOW}⚠ Production simulation containers are already running${NC}"
    echo ""
    read -p "Restart them? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Stopping existing containers...${NC}"
        docker-compose -f docker-compose.prod-sim.yml down
        echo -e "${GREEN}✓ Stopped${NC}"
        echo ""
    else
        echo -e "${GREEN}Continuing with existing containers...${NC}"
        echo ""
        ./scripts/prod-sim/health-check.sh
        exit 0
    fi
fi

# Build containers
echo -e "${BLUE}Building containers...${NC}"
echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
docker-compose -f docker-compose.prod-sim.yml build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Start containers
echo -e "${BLUE}Starting production simulation environment...${NC}"
docker-compose -f docker-compose.prod-sim.yml --env-file .env.prod-sim up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${BLUE}Waiting for services to be healthy...${NC}"
echo -e "${YELLOW}This may take 30-60 seconds...${NC}"
echo ""

sleep 10

# Check health
./scripts/prod-sim/health-check.sh

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Production Simulation Started Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Visit the frontend: http://localhost:3000"
echo "  2. Explore the API docs: http://localhost:8000/docs"
echo "  3. Manage database with Supabase Studio: http://localhost:54323"
echo "  4. Check emails in Inbucket: http://localhost:54324"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  make health-check       - Check service health"
echo "  make prod-sim-logs      - View all logs"
echo "  make logs-api           - View API logs only"
echo "  make logs-frontend      - View frontend logs only"
echo "  make prod-sim-down      - Stop all services"
echo ""
