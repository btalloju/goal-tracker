#!/bin/bash

set -e

echo "Goal Tracker - Local Development Setup"
echo "======================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "Please update .env.local with your Google OAuth credentials."
fi

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL is ready!"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Push schema to database
echo "Pushing Prisma schema to database..."
npx prisma db push

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo ""
echo "Setup complete! Run 'npm run dev' to start the development server."
