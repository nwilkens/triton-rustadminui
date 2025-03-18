# Triton Rust AdminUI Project

## Project Status

We're working on creating a modern Rust-based replacement for the Triton DataCenter Admin UI (sdc-adminui). This file tracks our progress and plans.

## Current Status

1. **Project Structure**: Created a basic Rust project structure with:
   - API modules for various resources (VMs, users, networks, etc.)
   - Authentication system with JWT
   - Error handling framework
   - Configuration handling
   - Service abstractions for Triton components

2. **Build Issues**: We attempted to build the project but encountered some issues:
   - Module visibility problems (fixed by making API modules public)
   - Middleware issues with RequireAdmin struct (fixed by adding Clone trait)
   - There are still some issues with how middleware and parameter handling is integrated

3. **Frontend**: Created a simple HTML/CSS/JS frontend for testing the API endpoints

## Next Steps

1. **Fix Remaining Build Issues**:
   - Update handler functions to properly use or not use the authorization middleware
   - Fix parameter handling in service modules

2. **Create Minimal Working Version**:
   - Ensure the /api/ping endpoint works
   - Ensure the /api/auth endpoint works for login
   - Set up basic VM listing functionality

3. **Mock Server Integration**:
   - Complete the mock server setup for local development
   - Ensure proper API routing for mock data

4. **Testing**:
   - Add unit tests for core functionality
   - Set up integration testing

5. **Complete Rust API Implementation**:
   - Implement actual Triton API clients using reqwest
   - Connect to real Triton services

6. **Build Modern Frontend**:
   - Develop a fully featured SPA frontend using a modern framework
   - Implement responsive UI for operators

## Useful Commands

```bash
# Build the project
cargo build

# Run the project
cargo run

# Run with optimizations
cargo run --release

# Run tests
cargo test
```

## Project Structure

```
src/
├── api/            # API endpoints
├── auth/           # Authentication and authorization
├── config/         # Configuration handling
├── error/          # Error types and handling
├── models/         # Data models
├── services/       # Service abstractions for Triton components
└── main.rs         # Application entry point
```

## Environment Setup

Required environment variables (see .env.example):
- HOST - Server host (default: 127.0.0.1)
- PORT - Server port (default: 8080)
- JWT_SECRET - Secret for JWT tokens
- TRITON_DATACENTER - Name of the datacenter
- Various Triton service URLs (VMAPI, CNAPI, etc.)