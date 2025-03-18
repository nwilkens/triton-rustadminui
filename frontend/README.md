# Triton Admin UI Frontend

This is the React-based frontend for the Triton Admin UI.

## Getting Started

### Installation

```bash
cd triton-ui
npm install
```

### Development Options

#### Using the Mock Server

For development without the Rust backend, you can use the mock server:

```bash
# Install json-server globally if you haven't already
npm install -g json-server

# Start the mock server (from the project root)
json-server --watch mock-server/db.json --routes mock-server/routes.json --port 8080
```

The mock server will run at http://localhost:8080 and provide simulated API responses.

#### Using the Development Server

To start the React development server:

```bash
cd triton-ui
npm start
```

This will launch the development server at [http://localhost:3000](http://localhost:3000). The development server will proxy API requests to either:
- The mock server running at port 8080
- The real Rust backend running at port 8080

### Building and Deploying

To build and deploy the frontend to the static directory (which will be served by the Rust backend):

```bash
./deploy.sh
```

This script:
1. Builds the React application
2. Clears the static directory
3. Copies the build files to the static directory

## Features

- Authentication with JWT tokens
- Dashboard to view system overview
- List and manage VMs (virtual machines)
- View compute servers and their status
- Manage networks and network configurations

## Development Credentials

For the mock server, use these credentials:
- Username: admin
- Password: any password (the mock server accepts any password)