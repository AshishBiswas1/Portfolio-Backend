#!/bin/bash

# Portfolio Docker Deployment Guide

echo "======================================"
echo "Portfolio Full-Stack & ML Docker Setup"
echo "======================================"
echo ""

# Step 1: Create .env file
echo "[1/4] Creating .env file..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ .env file created from .env.example"
  echo "  Please update .env with your actual values (API keys, secrets, etc.)"
else
  echo "✓ .env file already exists"
fi

# Step 2: Build images
echo ""
echo "[2/4] Building Docker images..."
docker build -t portfolio-ml-service:latest ../Portfolio-ML-Service
docker build -t portfolio-backend:latest .
docker build -t portfolio-frontend:latest ../ashishbiswasportfolio
echo "✓ Docker images built successfully"

# Step 3: Start services
echo ""
echo "[3/4] Starting services with docker-compose..."
docker compose up -d
echo "✓ Services starting..."

# Step 4: Wait for services
echo ""
echo "[4/4] Waiting for services to be healthy..."
sleep 10

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Services:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend:     http://localhost:8000"
echo "  ML Service:  http://localhost:5000"
echo ""
echo "View logs:"
echo "  All:         docker compose logs -f"
echo "  ML Service:  docker compose logs -f ml-service"
echo "  Backend:     docker compose logs -f backend"
echo "  Frontend:    docker compose logs -f frontend"
echo ""
echo "Stop services:"
echo "  docker compose down"
echo ""
