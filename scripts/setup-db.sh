#!/bin/bash

# Stop any running containers
docker-compose down -v

# Start the PostgreSQL container
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec pokecollect_postgres pg_isready -U postgres; do
    sleep 1
done

# Run migrations
echo "Running migrations..."
docker exec -i pokecollect_postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/20240320000000_initial_schema.sql

echo "Setup complete!" 