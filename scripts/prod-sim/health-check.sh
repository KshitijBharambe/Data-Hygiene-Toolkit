#!/bin/bash

# ============================================================================
# Production Simulation - Health Check Script
# ============================================================================
# This script checks the health status of all services in the prod-sim env
#
# Usage: ./scripts/prod-sim/health-check.sh
#   or:  make health-check
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Symbols
CHECK_MARK="${GREEN}✓${NC}"
CROSS_MARK="${RED}✗${NC}"
WARNING="${YELLOW}⚠${NC}"

# Counters
TOTAL=0
HEALTHY=0
UNHEALTHY=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Production Simulation - Health Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    local timeout=${3:-5}

    TOTAL=$((TOTAL + 1))

    if curl -f -s -m "$timeout" "$url" > /dev/null 2>&1; then
        echo -e "$CHECK_MARK ${name}: ${GREEN}Healthy${NC}"
        HEALTHY=$((HEALTHY + 1))
        return 0
    else
        echo -e "$CROSS_MARK ${name}: ${RED}Unhealthy${NC}"
        UNHEALTHY=$((UNHEALTHY + 1))
        return 1
    fi
}

# Function to check docker container
check_container() {
    local name=$1
    local container=$2

    TOTAL=$((TOTAL + 1))

    if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")

        if [ "$health" == "healthy" ] || [ "$health" == "unknown" ]; then
            echo -e "$CHECK_MARK ${name}: ${GREEN}Running${NC} (health: $health)"
            HEALTHY=$((HEALTHY + 1))
            return 0
        else
            echo -e "$WARNING ${name}: ${YELLOW}Running but not healthy${NC} (health: $health)"
            return 1
        fi
    else
        echo -e "$CROSS_MARK ${name}: ${RED}Not running${NC}"
        UNHEALTHY=$((UNHEALTHY + 1))
        return 1
    fi
}

echo -e "${BLUE}Checking Supabase Services...${NC}"
echo "───────────────────────────────────────────────────────────"

check_container "PostgreSQL Database" "prodsim-supabase-db"
check_container "Supabase Studio" "prodsim-supabase-studio"
check_container "Kong API Gateway" "prodsim-supabase-kong"
check_container "Auth Service" "prodsim-supabase-auth"
check_container "REST API (PostgREST)" "prodsim-supabase-rest"
check_container "Realtime Service" "prodsim-supabase-realtime"
check_container "Storage Service" "prodsim-supabase-storage"
check_container "Image Proxy" "prodsim-supabase-imgproxy"
check_container "Database Meta" "prodsim-supabase-meta"
check_container "Email Testing (Inbucket)" "prodsim-supabase-inbucket"
check_container "pgBouncer Pooler" "prodsim-pgbouncer"

echo ""
echo -e "${BLUE}Checking Application Services...${NC}"
echo "───────────────────────────────────────────────────────────"

check_container "Backend API" "prodsim-api"
check_container "Frontend" "prodsim-frontend"

echo ""
echo -e "${BLUE}Checking HTTP Endpoints...${NC}"
echo "───────────────────────────────────────────────────────────"

check_http "API Root" "http://localhost:8000/"
check_http "API Docs" "http://localhost:8000/docs"
check_http "Frontend" "http://localhost:3000/"
check_http "Supabase Kong" "http://localhost:54321/"
check_http "Supabase Studio" "http://localhost:54323/"
check_http "Inbucket" "http://localhost:54324/"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Total Services:   $TOTAL"
echo -e "  ${GREEN}Healthy:${NC}          $HEALTHY"
echo -e "  ${RED}Unhealthy:${NC}        $UNHEALTHY"
echo ""

if [ $UNHEALTHY -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy!${NC}"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo "  Frontend:         http://localhost:3000"
    echo "  API:             http://localhost:8000"
    echo "  API Docs:        http://localhost:8000/docs"
    echo "  Supabase Kong:   http://localhost:54321"
    echo "  Supabase Studio: http://localhost:54323"
    echo "  Inbucket:        http://localhost:54324"
    echo "  PostgreSQL:      localhost:54322 (user: postgres, db: postgres)"
    echo "  pgBouncer:       localhost:54329"
    exit 0
else
    echo -e "${YELLOW}⚠ Some services are unhealthy or not running${NC}"
    echo ""
    echo "To view logs for a specific service:"
    echo "  docker-compose -f docker-compose.prod-sim.yml logs <service-name>"
    echo ""
    echo "To restart all services:"
    echo "  make prod-sim-restart"
    exit 1
fi
