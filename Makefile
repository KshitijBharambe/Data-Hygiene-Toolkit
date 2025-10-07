# Data Hygiene Toolkit - Makefile
# Production Simulation Environment Management

.PHONY: help dev prod-sim prod-sim-build prod-sim-up prod-sim-down prod-sim-restart prod-sim-logs prod-sim-clean prod-sim-status supabase-start supabase-stop supabase-reset supabase-migrate health-check test

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)Data Hygiene Toolkit - Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Local Development (Current Setup)

dev: ## Start local development environment (docker-compose.yml)
	@echo "$(GREEN)Starting local development environment...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Development environment started$(NC)"
	@echo "  API: http://localhost:8000"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Docs: http://localhost:8000/docs"

dev-logs: ## View local development logs
	docker-compose logs -f

dev-down: ## Stop local development environment
	@echo "$(YELLOW)Stopping local development environment...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Development environment stopped$(NC)"

##@ Production Simulation Environment

prod-sim: prod-sim-build prod-sim-up ## Build and start production simulation environment

prod-sim-build: ## Build production simulation containers
	@echo "$(GREEN)Building production simulation containers...$(NC)"
	@docker-compose -f docker-compose.prod-sim.yml build
	@echo "$(GREEN)✓ Build complete$(NC)"

prod-sim-up: ## Start production simulation environment
	@echo "$(GREEN)Starting production simulation environment...$(NC)"
	@if [ ! -f .env.prod-sim ]; then \
		echo "$(RED)Error: .env.prod-sim not found!$(NC)"; \
		echo "$(YELLOW)Creating from template...$(NC)"; \
		cp .env.example .env.prod-sim; \
		echo "$(YELLOW)Please configure .env.prod-sim and run again$(NC)"; \
		exit 1; \
	fi
	@docker-compose -f docker-compose.prod-sim.yml --env-file .env.prod-sim up -d
	@echo "$(GREEN)✓ Production simulation environment started$(NC)"
	@echo ""
	@echo "$(BLUE)Services available at:$(NC)"
	@echo "  Frontend:        http://localhost:3000"
	@echo "  API:            http://localhost:8000"
	@echo "  API Docs:       http://localhost:8000/docs"
	@echo "  Supabase Kong:  http://localhost:54321"
	@echo "  Supabase Studio: http://localhost:54323"
	@echo "  Inbucket (Email): http://localhost:54324"
	@echo "  PostgreSQL:     localhost:54322"
	@echo "  pgBouncer:      localhost:54329"
	@echo ""
	@echo "$(YELLOW)Run 'make health-check' to verify all services$(NC)"

prod-sim-down: ## Stop production simulation environment
	@echo "$(YELLOW)Stopping production simulation environment...$(NC)"
	@docker-compose -f docker-compose.prod-sim.yml down
	@echo "$(GREEN)✓ Production simulation environment stopped$(NC)"

prod-sim-restart: ## Restart production simulation environment
	@echo "$(YELLOW)Restarting production simulation environment...$(NC)"
	@docker-compose -f docker-compose.prod-sim.yml restart
	@echo "$(GREEN)✓ Production simulation environment restarted$(NC)"

prod-sim-logs: ## View production simulation logs (use SERVICE=<name> for specific service)
	@if [ -z "$(SERVICE)" ]; then \
		docker-compose -f docker-compose.prod-sim.yml logs -f; \
	else \
		docker-compose -f docker-compose.prod-sim.yml logs -f $(SERVICE); \
	fi

prod-sim-clean: prod-sim-down ## Clean production simulation environment (remove volumes)
	@echo "$(RED)Cleaning production simulation environment...$(NC)"
	@echo "$(YELLOW)This will remove all volumes and data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.prod-sim.yml down -v; \
		echo "$(GREEN)✓ Production simulation environment cleaned$(NC)"; \
	else \
		echo "$(YELLOW)Cleanup cancelled$(NC)"; \
	fi

prod-sim-status: ## Show production simulation services status
	@echo "$(BLUE)Production Simulation Services Status:$(NC)"
	@docker-compose -f docker-compose.prod-sim.yml ps

##@ Supabase Commands

supabase-start: ## Start Supabase local stack
	@echo "$(GREEN)Starting Supabase local stack...$(NC)"
	supabase start
	@echo "$(GREEN)✓ Supabase started$(NC)"

supabase-stop: ## Stop Supabase local stack
	@echo "$(YELLOW)Stopping Supabase local stack...$(NC)"
	supabase stop
	@echo "$(GREEN)✓ Supabase stopped$(NC)"

supabase-reset: ## Reset Supabase local database
	@echo "$(RED)Resetting Supabase database...$(NC)"
	supabase db reset
	@echo "$(GREEN)✓ Supabase database reset$(NC)"

supabase-migrate: ## Run Supabase migrations
	@echo "$(GREEN)Running Supabase migrations...$(NC)"
	supabase db push
	@echo "$(GREEN)✓ Migrations applied$(NC)"

supabase-status: ## Show Supabase status
	@echo "$(BLUE)Supabase Status:$(NC)"
	supabase status

##@ Database Commands

db-migrate: ## Run Alembic migrations (for API service)
	@echo "$(GREEN)Running database migrations...$(NC)"
	@if docker ps | grep -q prodsim-api; then \
		docker-compose -f docker-compose.prod-sim.yml exec api alembic upgrade head; \
	else \
		docker-compose exec api alembic upgrade head; \
	fi
	@echo "$(GREEN)✓ Migrations complete$(NC)"

db-revision: ## Create new Alembic migration (use MESSAGE="description")
	@if [ -z "$(MESSAGE)" ]; then \
		echo "$(RED)Error: MESSAGE required$(NC)"; \
		echo "Usage: make db-revision MESSAGE=\"your migration description\""; \
		exit 1; \
	fi
	@echo "$(GREEN)Creating migration: $(MESSAGE)$(NC)"
	@if docker ps | grep -q prodsim-api; then \
		docker-compose -f docker-compose.prod-sim.yml exec api alembic revision --autogenerate -m "$(MESSAGE)"; \
	else \
		docker-compose exec api alembic revision --autogenerate -m "$(MESSAGE)"; \
	fi

db-shell: ## Connect to PostgreSQL shell
	@echo "$(GREEN)Connecting to PostgreSQL...$(NC)"
	@if docker ps | grep -q prodsim-supabase-db; then \
		docker-compose -f docker-compose.prod-sim.yml exec db psql -U postgres; \
	else \
		docker-compose exec db psql -U postgres; \
	fi

##@ Health & Monitoring

health-check: ## Check health of all production simulation services
	@echo "$(BLUE)Checking service health...$(NC)"
	@./scripts/prod-sim/health-check.sh

logs-api: ## View API logs
	@docker-compose -f docker-compose.prod-sim.yml logs -f api

logs-frontend: ## View frontend logs
	@docker-compose -f docker-compose.prod-sim.yml logs -f frontend

logs-db: ## View database logs
	@docker-compose -f docker-compose.prod-sim.yml logs -f db

##@ Testing

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	@if docker ps | grep -q prodsim-api; then \
		docker-compose -f docker-compose.prod-sim.yml exec api pytest; \
	else \
		docker-compose exec api pytest; \
	fi

test-coverage: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	@if docker ps | grep -q prodsim-api; then \
		docker-compose -f docker-compose.prod-sim.yml exec api pytest --cov=app --cov-report=html; \
	else \
		docker-compose exec api pytest --cov=app --cov-report=html; \
	fi

##@ Maintenance

clean-docker: ## Remove all stopped containers and dangling images
	@echo "$(YELLOW)Cleaning Docker resources...$(NC)"
	docker container prune -f
	docker image prune -f
	@echo "$(GREEN)✓ Docker cleaned$(NC)"

clean-all: prod-sim-clean dev-down clean-docker ## Clean everything (dev + prod-sim + docker)
	@echo "$(GREEN)✓ All environments cleaned$(NC)"

rebuild: prod-sim-clean prod-sim-build prod-sim-up ## Full rebuild of production simulation

##@ Utility

shell-api: ## Open shell in API container
	@docker-compose -f docker-compose.prod-sim.yml exec api sh

shell-frontend: ## Open shell in frontend container
	@docker-compose -f docker-compose.prod-sim.yml exec frontend sh

install-tools: ## Install required CLI tools (macOS)
	@echo "$(GREEN)Installing required tools...$(NC)"
	@if ! command -v supabase &> /dev/null; then \
		echo "Installing Supabase CLI..."; \
		brew install supabase/tap/supabase; \
	fi
	@if ! command -v flyctl &> /dev/null; then \
		echo "Installing Fly CLI..."; \
		brew install flyctl; \
	fi
	@if ! command -v vercel &> /dev/null; then \
		echo "Installing Vercel CLI..."; \
		npm install -g vercel; \
	fi
	@echo "$(GREEN)✓ Tools installed$(NC)"

env-check: ## Check if required environment files exist
	@echo "$(BLUE)Checking environment files...$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN)✓ .env exists$(NC)"; \
	else \
		echo "$(RED)✗ .env missing$(NC)"; \
	fi
	@if [ -f .env.prod-sim ]; then \
		echo "$(GREEN)✓ .env.prod-sim exists$(NC)"; \
	else \
		echo "$(YELLOW)⚠ .env.prod-sim missing (will be created from template)$(NC)"; \
	fi
	@if [ -f frontend/.env.local ]; then \
		echo "$(GREEN)✓ frontend/.env.local exists$(NC)"; \
	else \
		echo "$(RED)✗ frontend/.env.local missing$(NC)"; \
	fi
