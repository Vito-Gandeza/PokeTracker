# Stop any running containers
docker-compose down -v

# Start the PostgreSQL container
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..."
do {
    Start-Sleep -Seconds 1
    $isReady = docker exec pokecollect_postgres pg_isready -U postgres -p 5432
} while (-not $isReady)

# Run migrations
Write-Host "Running migrations..."
docker exec -i pokecollect_postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/20240320000000_initial_schema.sql

Write-Host "Setup complete!" 