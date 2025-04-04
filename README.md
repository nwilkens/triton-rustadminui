# Triton AdminUI - Rust Implementation

A modern rewrite of the Triton DataCenter Admin UI using Rust and React with Tailwind CSS.

## Overview

This project is a complete rewrite of the [SDC AdminUI](https://github.com/TritonDataCenter/sdc-adminui) for Triton DataCenter, implementing the backend in Rust for improved performance, security, and maintainability, with a modern frontend based on React and Tailwind CSS.

## Key Features

- **Rust Backend**: High-performance, secure API server built with Actix Web
- **Modern Authentication**: JWT-based authentication with role-based access control
- **RESTful API**: Well-structured API endpoints for all Triton resources
- **Triton Integration**: Comprehensive integration with Triton services (VMAPI, CNAPI, IMGAPI, etc.)
- **React Frontend**: Modern SPA frontend using React
- **Tailwind CSS**: Utility-first CSS framework for responsive design

## Architecture

The application follows a modern architecture with the following components:

- **Backend**: Rust-based API server using Actix Web
- **API Services**: Service abstractions for interacting with Triton components
- **Authentication**: JWT-based authentication with role-based access control
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Logging**: Structured logging with tracing crate
- **Frontend**: React SPA with Tailwind CSS
- **State Management**: React Context API for state management
- **Routing**: React Router for client-side routing

## Getting Started

### Prerequisites

- Rust (latest stable version)
- Node.js and npm (for frontend development)
- PostgreSQL (optional, for persistent storage)
- Access to a Triton DataCenter deployment

### Running with Docker Compose (Recommended)

The easiest way to get started is using Docker Compose, which sets up the Rust backend, a PostgreSQL database, and a mock Triton API server:

1. Start all services with Docker Compose:

```bash
docker-compose up -d
```

2. Access the UI at http://localhost:8080 and log in with:
   - Username: `admin`
   - Password: `admin`

3. To view logs:

```bash
docker-compose logs -f
```

4. To stop all services:

```bash
docker-compose down
```

### Running Locally with Mock Services

For development and testing without Docker:

1. Start the mock server:

```bash
cd mock-server
npm install -g json-server
json-server --watch db.json --routes routes.json --port 3000
```

2. Create a `.env` file in the project root using the provided `.env.example`:

```bash
cp .env.example .env
```

3. Start a PostgreSQL database (or update the .env to point to your existing database):

```bash
docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=triton_adminui -p 5432:5432 postgres:16
```

4. Run the application:

```bash
cargo run
```

5. Access the UI at http://localhost:8080 and log in with:
   - Username: `admin`
   - Password: `admin`

### Connecting to Real Triton Services

To connect to an actual Triton DataCenter deployment:

1. Create a `.env` file in the project root with the following variables:

```
HOST=0.0.0.0
PORT=8080
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=60 # hours
LOG_LEVEL=info
TRITON_DATACENTER=your_datacenter_name
DATABASE_URL=postgres://username:password@localhost:5432/triton_admin

# Triton Service URLs
VMAPI_URL=https://vmapi.your-datacenter.example.com
CNAPI_URL=https://cnapi.your-datacenter.example.com
NAPI_URL=https://napi.your-datacenter.example.com
IMGAPI_URL=https://imgapi.your-datacenter.example.com
AMON_URL=https://amon.your-datacenter.example.com
UFDS_URL=https://ufds.your-datacenter.example.com
SAPI_URL=https://sapi.your-datacenter.example.com
FWAPI_URL=https://fwapi.your-datacenter.example.com
PAPI_URL=https://papi.your-datacenter.example.com
MAHI_URL=https://mahi.your-datacenter.example.com
```

2. If needed, set up client certificates for connecting to Triton APIs:

```bash
# Copy your client certificates to a secure location
mkdir -p ~/.triton/certs
cp /path/to/cert.pem ~/.triton/certs/
cp /path/to/key.pem ~/.triton/certs/

# Set environment variables for certificates
export TRITON_CLIENT_CERT=~/.triton/certs/cert.pem
export TRITON_CLIENT_KEY=~/.triton/certs/key.pem
```

### Building and Running

```bash
# Build the project
cargo build

# Run in development mode
cargo run

# Run with optimizations
cargo run --release
```

## Development

### Project Structure

#### Backend
```
src/
   api/            # API endpoints
   auth/           # Authentication and authorization
   config/         # Configuration handling
   error/          # Error types and handling
   models/         # Data models
   services/       # Service abstractions for Triton components
   main.rs         # Application entry point
```

#### Frontend
```
frontend/triton-ui/
   src/
      components/  # Reusable React components
      pages/       # Page components
      services/    # API services
      App.tsx      # Root component
      index.tsx    # Entry point
```

### API Endpoints

The API follows RESTful principles and includes endpoints for managing:

- Virtual Machines
- Servers
- Networks
- Images
- Packages
- Users
- and more...

## License

MPL-2.0