# Makefile for SNMP Project
# Full Stack SNMP Implementation

.PHONY: help install build test clean docker-build docker-run docker-stop k8s-deploy k8s-delete

# Default target
help:
	@echo "SNMP Project - Full Stack Implementation"
	@echo "========================================"
	@echo ""
	@echo "Available targets:"
	@echo "  install       - Install all dependencies"
	@echo "  build         - Build all components"
	@echo "  test          - Run all tests"
	@echo "  clean         - Clean build artifacts"
	@echo "  docker-build  - Build Docker images"
	@echo "  docker-run    - Run with Docker Compose"
	@echo "  docker-stop   - Stop Docker containers"
	@echo "  k8s-deploy    - Deploy to Kubernetes"
	@echo "  k8s-delete    - Delete from Kubernetes"
	@echo "  dev           - Run in development mode"
	@echo "  prod          - Run in production mode"

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd web-client && npm install
	cd web-server && npm install
	cd snmp-manager && pip install -r requirements.txt
	cd snmp-agent && pip install -r requirements.txt
	@echo "Dependencies installed successfully!"

# Build all components
build:
	@echo "Building all components..."
	cd web-client && npm run build
	cd web-server && npm run build
	@echo "Build completed successfully!"

# Run tests
test:
	@echo "Running tests..."
	cd web-client && npm test
	cd web-server && npm test
	cd snmp-manager && python -m pytest tests/ -v
	cd snmp-agent && python -m pytest tests/ -v
	@echo "Tests completed!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cd web-client && rm -rf build/ node_modules/
	cd web-server && rm -rf node_modules/
	cd snmp-manager && find . -type d -name "__pycache__" -exec rm -rf {} +
	cd snmp-agent && find . -type d -name "__pycache__" -exec rm -rf {} +
	@echo "Clean completed!"

# Docker operations
docker-build:
	@echo "Building Docker images..."
	docker build -f docker/Dockerfile.web-client -t snmp-project/web-client:latest .
	docker build -f docker/Dockerfile.web-server -t snmp-project/web-server:latest .
	docker build -f docker/Dockerfile.snmp-manager -t snmp-project/snmp-manager:latest .
	docker build -f docker/Dockerfile.snmp-agent -t snmp-project/snmp-agent:latest .
	@echo "Docker images built successfully!"

docker-run:
	@echo "Starting Docker containers..."
	docker-compose up -d
	@echo "Containers started! Access the application at http://localhost:3000"

docker-run-dev:
	@echo "Starting Docker containers in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "Development containers started!"

docker-stop:
	@echo "Stopping Docker containers..."
	docker-compose down
	@echo "Containers stopped!"

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

# Kubernetes operations
k8s-deploy:
	@echo "Deploying to Kubernetes..."
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/redis-deployment.yaml
	kubectl apply -f k8s/snmp-agent-deployment.yaml
	kubectl apply -f k8s/snmp-manager-deployment.yaml
	kubectl apply -f k8s/web-server-deployment.yaml
	kubectl apply -f k8s/web-client-deployment.yaml
	kubectl apply -f k8s/ingress.yaml
	@echo "Deployment completed!"

k8s-delete:
	@echo "Deleting from Kubernetes..."
	kubectl delete -f k8s/ingress.yaml
	kubectl delete -f k8s/web-client-deployment.yaml
	kubectl delete -f k8s/web-server-deployment.yaml
	kubectl delete -f k8s/snmp-manager-deployment.yaml
	kubectl delete -f k8s/snmp-agent-deployment.yaml
	kubectl delete -f k8s/redis-deployment.yaml
	kubectl delete -f k8s/namespace.yaml
	@echo "Deletion completed!"

k8s-status:
	@echo "Kubernetes deployment status..."
	kubectl get pods -n snmp-system
	kubectl get services -n snmp-system
	kubectl get ingress -n snmp-system

# Development mode
dev:
	@echo "Starting development environment..."
	@echo "Starting web server..."
	cd web-server && npm run dev &
	@echo "Starting SNMP manager..."
	cd snmp-manager && python snmp_manager.py &
	@echo "Starting SNMP agent..."
	cd snmp-agent && python snmp_agent.py &
	@echo "Starting web client..."
	cd web-client && npm start
	@echo "Development environment started!"

# Production mode
prod:
	@echo "Starting production environment..."
	docker-compose up -d
	@echo "Production environment started!"

# Security scanning
security-scan:
	@echo "Running security scans..."
	docker run --rm -v $(PWD):/app aquasec/trivy fs /app
	@echo "Security scan completed!"

# Performance testing
perf-test:
	@echo "Running performance tests..."
	cd tests && npm install
	cd tests && npm run perf-test
	@echo "Performance tests completed!"

# Documentation
docs:
	@echo "Generating documentation..."
	cd docs && pandoc SRS.md -o SRS.pdf
	cd docs && pandoc System_Test_Plan.md -o System_Test_Plan.pdf
	@echo "Documentation generated!"

# Backup
backup:
	@echo "Creating backup..."
	tar -czf snmp-project-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz \
		--exclude=node_modules \
		--exclude=__pycache__ \
		--exclude=.git \
		.
	@echo "Backup created!"

# Restore
restore:
	@echo "Restoring from backup..."
	@read -p "Enter backup filename: " backup_file; \
	tar -xzf $$backup_file
	@echo "Restore completed!"

# Git operations
git-setup:
	@echo "Setting up Git repository..."
	git init
	git add .
	git commit -m "Initial commit: Full Stack SNMP Implementation"
	@echo "Git repository initialized!"

# CI/CD
ci-test:
	@echo "Running CI tests..."
	make install
	make test
	make security-scan
	@echo "CI tests completed!"

# Monitoring
monitor:
	@echo "Starting monitoring..."
	docker-compose -f docker-compose.monitoring.yml up -d
	@echo "Monitoring started! Access Grafana at http://localhost:3000"

# Database operations
db-migrate:
	@echo "Running database migrations..."
	cd web-server && npm run migrate
	@echo "Database migrations completed!"

db-seed:
	@echo "Seeding database..."
	cd web-server && npm run seed
	@echo "Database seeded!"

# SSL certificates
ssl-generate:
	@echo "Generating SSL certificates..."
	mkdir -p ssl
	openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
	@echo "SSL certificates generated!"

# Environment setup
env-setup:
	@echo "Setting up environment..."
	cp env.example .env
	@echo "Environment file created! Please update .env with your configuration."

# Complete setup
setup: env-setup install docker-build
	@echo "Complete setup finished!"
	@echo "Run 'make docker-run' to start the application"
	@echo "Access the application at http://localhost:3000"
