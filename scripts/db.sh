#!/bin/bash

# Function to reset the database
reset_db() {
    echo "Resetting database..."
    docker-compose down -v
    docker-compose up -d
    sleep 5
    echo "Database reset complete!"
}

# Function to run migrations
run_migrations() {
    echo "Running migrations..."
    docker-compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/00000000000000_initial_schema.sql
    docker-compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/00000000000001_sample_data.sql
    echo "Migrations complete!"
}

# Function to connect to the database
connect_db() {
    echo "Connecting to database..."
    docker-compose exec db psql -U postgres -d postgres
}

# Main script
case "$1" in
    "reset")
        reset_db
        ;;
    "migrate")
        run_migrations
        ;;
    "connect")
        connect_db
        ;;
    *)
        echo "Usage: $0 {reset|migrate|connect}"
        exit 1
        ;;
esac 