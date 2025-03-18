#!/bin/bash

# Build the React frontend
cd triton-ui
npm run build

# Clear out the existing static directory
rm -rf ../../static/*

# Copy the React build to the static directory
cp -r build/* ../../static/

echo "Frontend deployed successfully to static directory"