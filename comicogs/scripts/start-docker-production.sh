#!/bin/bash

# ComicComp Docker Production Environment Startup Script
# This script sets up and starts the complete ComicComp stack in Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 COMICCOMP DOCKER PRODUCTION ENVIRONMENT${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📋 Pre-flight Checks${NC}"
echo "-------------------"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if Docker Compose is available
if ! docker-compose --version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is available${NC}"

# Check if required files exist
required_files=(
    "docker-compose.full-stack.yml"
    ".env.docker.production"
    "backend/Dockerfile.prod"
    "comicogs-nextjs/Dockerfile.prod"
    "database/docker-init.sql"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Required file not found: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required files present${NC}"

echo ""
echo -e "${YELLOW}🧹 Cleanup Previous Containers${NC}"
echo "------------------------------"

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.full-stack.yml down --volumes --remove-orphans 2>/dev/null || true

# Remove dangling images
echo "Removing dangling images..."
docker image prune -f >/dev/null 2>&1 || true

echo -e "${GREEN}✅ Cleanup completed${NC}"

echo ""
echo -e "${YELLOW}🔨 Building Docker Images${NC}"
echo "-------------------------"

# Build images with no cache for fresh builds
echo "Building backend image..."
docker-compose -f docker-compose.full-stack.yml build --no-cache backend

echo "Building frontend image..."
docker-compose -f docker-compose.full-stack.yml build --no-cache frontend

echo -e "${GREEN}✅ Images built successfully${NC}"

echo ""
echo -e "${YELLOW}🚀 Starting Services${NC}"
echo "-------------------"

# Copy environment file
cp .env.docker.production .env

# Start services in the correct order
echo "Starting PostgreSQL database..."
docker-compose -f docker-compose.full-stack.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
timeout=60
while ! docker-compose -f docker-compose.full-stack.yml exec -T postgres pg_isready -U comicogs_user -d comicogs >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start within 60 seconds${NC}"
        docker-compose -f docker-compose.full-stack.yml logs postgres
        exit 1
    fi
    sleep 1
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

echo "Starting Redis cache..."
docker-compose -f docker-compose.full-stack.yml up -d redis

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
timeout=30
while ! docker-compose -f docker-compose.full-stack.yml exec -T redis redis-cli ping >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ Redis failed to start within 30 seconds${NC}"
        docker-compose -f docker-compose.full-stack.yml logs redis
        exit 1
    fi
    sleep 1
done
echo -e "${GREEN}✅ Redis is ready${NC}"

echo "Starting backend API server..."
docker-compose -f docker-compose.full-stack.yml up -d backend

# Wait for backend to be ready
echo "Waiting for backend API to be ready..."
timeout=120
while ! curl -f http://localhost:3001/api/status >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ Backend API failed to start within 120 seconds${NC}"
        echo "Backend logs:"
        docker-compose -f docker-compose.full-stack.yml logs backend
        exit 1
    fi
    sleep 2
done
echo -e "${GREEN}✅ Backend API is ready${NC}"

echo "Starting frontend Next.js application..."
docker-compose -f docker-compose.full-stack.yml up -d frontend

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
timeout=120
while ! curl -f http://localhost:3002 >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ Frontend failed to start within 120 seconds${NC}"
        echo "Frontend logs:"
        docker-compose -f docker-compose.full-stack.yml logs frontend
        exit 1
    fi
    sleep 2
done
echo -e "${GREEN}✅ Frontend is ready${NC}"

echo ""
echo -e "${GREEN}🎉 COMICCOMP DOCKER ENVIRONMENT IS READY!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo "   Frontend:  http://localhost:3002"
echo "   Backend:   http://localhost:3001"
echo "   API Docs:  http://localhost:3001/api-docs"
echo "   Health:    http://localhost:3001/api/health"
echo ""
echo -e "${BLUE}🗄️  Database Info:${NC}"
echo "   PostgreSQL: localhost:5432"
echo "   Database:   comicogs"
echo "   Username:   comicogs_user"
echo "   Redis:      localhost:6379"
echo ""
echo -e "${BLUE}👤 Test Account:${NC}"
echo "   Email:    admin@comicogs.com"
echo "   Password: admin123"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "   View logs:     docker-compose -f docker-compose.full-stack.yml logs -f [service]"
echo "   Stop all:      docker-compose -f docker-compose.full-stack.yml down"
echo "   Restart:       ./scripts/start-docker-production.sh"
echo "   Run tests:     ./scripts/test-docker-environment.sh"
echo ""
echo -e "${YELLOW}🧪 Ready for UI Testing!${NC}"
echo "You can now run the comprehensive UI tests against this Docker environment."
echo ""
echo -e "${GREEN}✨ Docker production environment started successfully!${NC}"