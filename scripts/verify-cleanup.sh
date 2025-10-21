#!/bin/bash
# ============================================================================
# Cleanup Verification Script
# Verifies all cleanup tasks completed successfully
# ============================================================================

set -e

echo "🔍 Verifying cleanup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0

# Test function
test_condition() {
    local description=$1
    local command=$2
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $description"
        ((FAIL++))
    fi
}

test_not_exist() {
    local description=$1
    local path=$2
    
    if [ ! -e "$path" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $description (exists: $path)"
        ((FAIL++))
    fi
}

test_exist() {
    local description=$1
    local path=$2
    
    if [ -e "$path" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $description (missing: $path)"
        ((FAIL++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checking Python Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_not_exist "No requirements.txt in api/" "api/requirements.txt"
test_not_exist "No requirements-dev.txt in api/" "api/requirements-dev.txt"
test_exist "pyproject.toml exists" "pyproject.toml"
test_exist "uv.lock exists" "uv.lock"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checking Documentation Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_exist "docs/README.md (index)" "docs/README.md"
test_exist "docs/features/ directory" "docs/features"
test_exist "docs/infrastructure/ directory" "docs/infrastructure"
test_exist "docs/infrastructure/DOCKER.md" "docs/infrastructure/DOCKER.md"
test_not_exist "No docker/README.md" "docker/README.md"
test_not_exist "No loose PHASE1 docs in root" "PHASE1_COMPLETE.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checking Docker Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_exist "docker/backend/Dockerfile" "docker/backend/Dockerfile"
test_exist "docker/frontend/Dockerfile" "docker/frontend/Dockerfile"
test_exist "docker/compose/docker-compose.yml" "docker/compose/docker-compose.yml"
test_exist "docker/compose/docker-compose.dev.yml" "docker/compose/docker-compose.dev.yml"
test_exist "docker/compose/docker-compose.prod-sim.yml" "docker/compose/docker-compose.prod-sim.yml"

# Check backend Dockerfile uses pyproject.toml
if grep -q "pyproject.toml" docker/backend/Dockerfile; then
    echo -e "${GREEN}✓${NC} Backend Dockerfile uses pyproject.toml"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Backend Dockerfile doesn't use pyproject.toml"
    ((FAIL++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checking Essential Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_exist "Makefile" "Makefile"
test_exist ".env.example" ".env.example"
test_exist ".env.prod-sim.example" ".env.prod-sim.example"
test_exist "README.md" "README.md"
test_exist "scripts/setup.sh" "scripts/setup.sh"
test_exist "scripts/init-db.sh" "scripts/init-db.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Tests Passed: ${GREEN}$PASS${NC}"
echo "Tests Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All cleanup verification checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test the setup: make setup && make dev"
    echo "  2. Proceed to Phase 2: Terraform for GCP"
    exit 0
else
    echo -e "${RED}❌ Some cleanup verification checks failed!${NC}"
    echo ""
    echo "Please review the failed checks above."
    exit 1
fi
