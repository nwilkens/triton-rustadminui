#!/bin/bash

# Exit on error
set -e

echo "Verifying frontend static content..."

# Check if static directory exists
if [ ! -d "../static" ]; then
    echo "ERROR: Static directory not found!"
    echo "Run the deploy.sh script first to build and deploy the frontend."
    exit 1
fi

# Check if build-info.json exists in the static directory
if [ ! -f "../static/build-info.json" ]; then
    echo "ERROR: build-info.json not found in static directory!"
    echo "The static content appears to be outdated or was not generated with the latest deploy.sh script."
    echo "Run the deploy.sh script to update the frontend build."
    exit 1
fi

# Get the frontend source files' last modification time
FRONTEND_SRC_LATEST=$(find ./triton-ui/src -type f -name "*.tsx" -o -name "*.ts" -o -name "*.css" | xargs stat -c %Y 2>/dev/null | sort -nr | head -n1)
if [ -z "$FRONTEND_SRC_LATEST" ]; then
    # Try macOS format
    FRONTEND_SRC_LATEST=$(find ./triton-ui/src -type f -name "*.tsx" -o -name "*.ts" -o -name "*.css" | xargs stat -f %m 2>/dev/null | sort -nr | head -n1)
fi

# Get the build-info.json modification time
STATIC_BUILD_INFO_TIME=$(stat -c %Y "../static/build-info.json" 2>/dev/null || stat -f %m "../static/build-info.json" 2>/dev/null)

# Extract the build timestamp from build-info.json
BUILD_TIME_STR=$(grep -o '"buildTime":"[^"]*"' "../static/build-info.json" | cut -d'"' -f4)
BUILD_VERSION=$(grep -o '"version":"[^"]*"' "../static/build-info.json" | cut -d'"' -f4)

echo "Frontend build information:"
echo "  - Version: $BUILD_VERSION"
echo "  - Build time: $BUILD_TIME_STR"

# Check if source files are newer than the build
if [ "$FRONTEND_SRC_LATEST" -gt "$STATIC_BUILD_INFO_TIME" ]; then
    echo "WARNING: Frontend source files have been modified since the last build!"
    echo "Some frontend source files are newer than the current static build."
    echo "Run the deploy.sh script to update the frontend build."
    
    # Find the files that were modified since the last build
    echo "Modified files:"
    for file in $(find ./triton-ui/src -type f -name "*.tsx" -o -name "*.ts" -o -name "*.css"); do
        FILE_TIME=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
        if [ "$FILE_TIME" -gt "$STATIC_BUILD_INFO_TIME" ]; then
            echo "  - $file"
        fi
    done
    
    exit 1
else
    echo "Static content is up to date with the frontend source code."
    echo "No action needed."
fi