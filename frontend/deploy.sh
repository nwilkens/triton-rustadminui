#!/bin/bash

# Set the script to exit if any command fails
set -e

echo "Beginning frontend deployment process..."

# Check if we should use compatibility mode
USE_COMPAT=0
if [ "$(uname -s)" == "SunOS" ]; then
  echo "Detected SmartOS environment, using compatibility mode"
  USE_COMPAT=1
fi

# Track the original directory
ORIGINAL_DIR=$(pwd)

# Use the React frontend instead of the Vue frontend
cd $(dirname $0)/triton-ui

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the React frontend
echo "Building React application..."
npm run build

# Generate a build timestamp file
BUILD_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
BUILD_VERSION=$(grep '"version":' package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d ' ')
echo "{\"buildTime\":\"$BUILD_TIMESTAMP\",\"version\":\"$BUILD_VERSION\"}" > build/build-info.json

# Move back to original directory
cd $ORIGINAL_DIR

# Clear out the existing static directory
echo "Clearing static directory..."
rm -rf ../static/*

# Copy the React build to the static directory
echo "Copying build files to static directory..."
cp -r triton-ui/build/* ../static/

echo "Frontend deployed successfully to static directory"
echo "Build timestamp: $BUILD_TIMESTAMP"
echo "Version: $BUILD_VERSION"

# Create a reminder for the Rust rebuild
echo "==============================================="
echo "IMPORTANT: You must rebuild the Rust application now:"
echo "cd .. && cargo build [--release]"
echo "==============================================="