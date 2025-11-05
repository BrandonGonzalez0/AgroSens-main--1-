#!/bin/bash
set -e  # Exit on any error
set -u  # Exit on undefined variables
set -o pipefail  # Exit on pipe failures

# Function to handle errors
handle_error() {
    echo "Error occurred in build script at line $1" >&2
    exit 1
}

# Set error trap
trap 'handle_error $LINENO' ERR

echo "Starting build process..."

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "Error: frontend directory not found" >&2
    exit 1
fi

# Change to frontend directory
cd frontend || {
    echo "Error: Failed to change to frontend directory" >&2
    exit 1
}

echo "Installing dependencies..."
# Install dependencies with error handling
if ! npm install; then
    echo "Error: npm install failed" >&2
    exit 1
fi

echo "Building application..."
# Build with error handling
if ! node node_modules/vite/bin/vite.js build; then
    echo "Error: Build process failed" >&2
    exit 1
fi

echo "Build completed successfully!"
exit 0