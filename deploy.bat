@echo off
REM Portfolio Docker Deployment Guide for Windows

echo.
echo ======================================
echo Portfolio Full-Stack Docker Setup
echo ======================================
echo.

REM Step 1: Create .env file
echo [1/4] Creating .env file...
if not exist .env (
  copy .env.example .env
  echo. ✓ .env file created from .env.example
  echo.  Please update .env with your actual values
) else (
  echo. ✓ .env file already exists
)

REM Step 2: Build images
echo.
echo [2/4] Building Docker images...
docker build -t portfolio-backend:latest .
docker build -t portfolio-frontend:latest ../ashishbiswasportfolio
echo. ✓ Docker images built successfully

REM Step 3: Start services
echo.
echo [3/4] Starting services with docker-compose...
docker compose up -d --pull always
echo. ✓ Services starting...

REM Step 4: Wait for services
echo.
echo [4/4] Waiting for services to be healthy...
timeout /t 10 /nobreak

echo.
echo ======================================
echo Deployment Complete!
echo ======================================
echo.
echo Services:
echo.  Frontend:  http://localhost:3000
echo.  Backend:   http://localhost:8000
echo.  MongoDB:   localhost:27017
echo.
echo View logs:
echo.  All:       docker compose logs -f
echo.  Backend:   docker compose logs -f backend
echo.  Frontend:  docker compose logs -f frontend
echo.  DB:        docker compose logs -f mongodb
echo.
echo Stop services:
echo.  docker compose down
echo.
