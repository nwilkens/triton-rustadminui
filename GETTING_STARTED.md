# Getting Started with Triton Rust AdminUI

This guide will walk you through setting up and running the Triton Rust AdminUI application, both in development and production environments.

## Prerequisites

- Rust (1.70+)
- Docker and Docker Compose (for containerized deployment)
- Node.js and npm (for mock server in development)
- PostgreSQL database (optional)
- Access to a Triton DataCenter deployment (for production)

## Development Environment

### Option 1: Using Docker Compose (Recommended)

The easiest way to get started is using Docker Compose, which sets up all required services:

1. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/yourusername/triton-rustadminui.git
cd triton-rustadminui
```

2. Start the services with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- The Rust AdminUI backend
- A PostgreSQL database
- A mock Triton API server (json-server)

3. Access the UI at http://localhost:8080 and log in with:
   - Username: `admin`
   - Password: `admin`

4. To view logs:

```bash
docker-compose logs -f
```

5. To stop all services:

```bash
docker-compose down
```

### Option 2: Local Development Setup

If you prefer to run the components separately:

1. Start the mock Triton API server:

```bash
cd mock-server
npm install -g json-server
json-server --watch db.json --routes routes.json --port 3000
```

2. Create or edit the `.env` file in the project root:

```
HOST=127.0.0.1
PORT=8080
JWT_SECRET=your_jwt_secret_key_for_development
JWT_EXPIRATION=60
LOG_LEVEL=debug
RUST_LOG=debug
TRITON_DATACENTER=development

# Database connection (PostgreSQL)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/triton_adminui

# Mock server URLs for development
VMAPI_URL=http://localhost:3000/vmapi
CNAPI_URL=http://localhost:3000/cnapi
NAPI_URL=http://localhost:3000/napi
IMGAPI_URL=http://localhost:3000/imgapi
AMON_URL=http://localhost:3000/amon
UFDS_URL=http://localhost:3000/ufds
SAPI_URL=http://localhost:3000/sapi
FWAPI_URL=http://localhost:3000/fwapi
PAPI_URL=http://localhost:3000/papi
MAHI_URL=http://localhost:3000/mahi
```

3. Start a PostgreSQL database (if not already running):

```bash
docker run -d --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=triton_adminui \
  -p 5432:5432 \
  postgres:16
```

4. Build and run the application:

```bash
cargo run
```

5. Access the UI at http://localhost:8080 and log in with:
   - Username: `admin`
   - Password: `admin`

## Connecting to Real Triton Services

To connect to a production Triton DataCenter deployment:

1. Create an `.env` file with the actual Triton service URLs:

```
HOST=0.0.0.0
PORT=8080
JWT_SECRET=your_secure_jwt_secret_for_production
JWT_EXPIRATION=24
LOG_LEVEL=info
TRITON_DATACENTER=your_datacenter_name

# Database connection (PostgreSQL)
DATABASE_URL=postgres://username:password@db-host:5432/triton_adminui

# Triton Service URLs
VMAPI_URL=https://vmapi.your-triton-datacenter.example.com
CNAPI_URL=https://cnapi.your-triton-datacenter.example.com
NAPI_URL=https://napi.your-triton-datacenter.example.com
IMGAPI_URL=https://imgapi.your-triton-datacenter.example.com
AMON_URL=https://amon.your-triton-datacenter.example.com
UFDS_URL=ldaps://ufds.your-triton-datacenter.example.com
SAPI_URL=https://sapi.your-triton-datacenter.example.com
FWAPI_URL=https://fwapi.your-triton-datacenter.example.com
PAPI_URL=https://papi.your-triton-datacenter.example.com
MAHI_URL=https://mahi.your-triton-datacenter.example.com
```

2. Build and run the application:

```bash
cargo build --release
./target/release/triton-adminui
```

## Docker Deployment in Production

For production deployment using Docker:

1. Build the Docker image:

```bash
docker build -t triton-adminui:latest .
```

2. Create a docker-compose.yml file for production:

```yaml
version: '3.8'

services:
  app:
    image: triton-adminui:latest
    container_name: triton-adminui
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - HOST=0.0.0.0
      - PORT=8080
      - JWT_SECRET=your_secure_jwt_secret
      - JWT_EXPIRATION=24
      - LOG_LEVEL=info
      - TRITON_DATACENTER=your_datacenter_name
      - DATABASE_URL=postgres://username:password@db:5432/triton_adminui
      - VMAPI_URL=https://vmapi.your-triton-datacenter.example.com
      - CNAPI_URL=https://cnapi.your-triton-datacenter.example.com
      - NAPI_URL=https://napi.your-triton-datacenter.example.com
      - IMGAPI_URL=https://imgapi.your-triton-datacenter.example.com
      - AMON_URL=https://amon.your-triton-datacenter.example.com
      - UFDS_URL=ldaps://ufds.your-triton-datacenter.example.com
      - SAPI_URL=https://sapi.your-triton-datacenter.example.com
      - FWAPI_URL=https://fwapi.your-triton-datacenter.example.com
      - PAPI_URL=https://papi.your-triton-datacenter.example.com
      - MAHI_URL=https://mahi.your-triton-datacenter.example.com
    volumes:
      - /path/to/certs:/app/certs  # For client certificates if needed
    depends_on:
      - db
    
  db:
    image: postgres:16
    container_name: triton-adminui-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=username
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=triton_adminui
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

3. Deploy the application:

```bash
docker-compose -f docker-compose.production.yml up -d
```

## Authentication and Authorization

The application supports two authentication methods:

1. **Local Authentication**: JWT-based authentication with local users
2. **UFDS Authentication**: Authentication against Triton's UFDS service

In development mode, you can log in with:
- Username: `admin`
- Password: `admin`

In production mode, you will authenticate against the UFDS service.

## Troubleshooting

### Common Issues

1. **Connection refused to services**:
   - Check that the service URLs are correct
   - Verify network connectivity
   - Check that the service is running

2. **Authentication failures**:
   - Verify UFDS URL is correct
   - Check credentials
   - Ensure JWT_SECRET is properly set

3. **Database connection issues**:
   - Verify PostgreSQL is running
   - Check connection string
   - Ensure database exists

### Logs

By default, logs are written to stdout. You can adjust the log level with:

```
LOG_LEVEL=debug
RUST_LOG=debug
```

For more detailed logging, set:

```
RUST_LOG=actix_web=debug,triton_adminui=trace
```