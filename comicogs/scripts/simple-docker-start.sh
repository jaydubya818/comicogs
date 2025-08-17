#!/bin/bash

# Simple Docker startup for ComicComp
echo "🚀 Starting ComicComp Docker Environment"
echo "========================================"

cd /Users/jaywest/comicogs

# Start PostgreSQL first
echo "📦 Starting PostgreSQL..."
docker-compose -f docker-compose.full-stack.yml up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose -f docker-compose.full-stack.yml exec -T postgres pg_isready -U comicogs_user; do
  echo "PostgreSQL is not ready yet. Waiting..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Start Redis
echo "📦 Starting Redis..."
docker-compose -f docker-compose.full-stack.yml up -d redis

echo "⏳ Waiting for Redis to be ready..."
sleep 5

echo "✅ Redis is ready!"

# Start backend (build if needed)
echo "📦 Starting Backend..."
docker-compose -f docker-compose.full-stack.yml up -d --build backend

echo "⏳ Waiting for Backend to be ready..."
sleep 30

# Test backend
echo "🔍 Testing backend connectivity..."
for i in {1..10}; do
  if curl -s http://localhost:3001/api/status > /dev/null; then
    echo "✅ Backend is ready!"
    break
  else
    echo "Backend not ready yet, attempt $i/10..."
    sleep 5
  fi
done

# Start frontend (build if needed)
echo "📦 Starting Frontend..."
docker-compose -f docker-compose.full-stack.yml up -d --build frontend

echo "⏳ Waiting for Frontend to be ready..."
sleep 30

# Test frontend
echo "🔍 Testing frontend connectivity..."
for i in {1..10}; do
  if curl -s http://localhost:3002 > /dev/null; then
    echo "✅ Frontend is ready!"
    break
  else
    echo "Frontend not ready yet, attempt $i/10..."
    sleep 5
  fi
done

echo ""
echo "🎉 ComicComp Environment Ready!"
echo "Frontend: http://localhost:3002"
echo "Backend:  http://localhost:3001"
echo ""
echo "📋 Check container status:"
docker-compose -f docker-compose.full-stack.yml ps