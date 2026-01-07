#!/bin/bash
# Build script for Open Notebook with base image optimization
# This script builds the base image first, then the main application image

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_IMAGE="library/open-notebook-base:latest"
APP_IMAGE="library/open-notebook-cn:latest"
BUILD_BASE=false
PUSH_IMAGES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build-base)
            BUILD_BASE=true
            shift
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build-base    Rebuild the base image (only needed once or when dependencies change)"
            echo "  --push          Push images to registry after build"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Build app image using existing base image"
            echo "  $0 --build-base       # Rebuild base image and app image"
            echo "  $0 --build-base --push  # Rebuild and push both images"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1

echo -e "${BLUE}=== Open Notebook Build Script ===${NC}"
echo ""

# Check if docker-deps directory exists
if [ ! -f "docker-deps/node-v20.18.2-linux-x64.tar.xz" ]; then
    echo -e "${YELLOW}Warning: docker-deps/node-v20.18.2-linux-x64.tar.xz not found${NC}"
    echo "Downloading Node.js..."
    mkdir -p docker-deps
    cd docker-deps
    curl -LO https://nodejs.org/dist/v20.18.2/node-v20.18.2-linux-x64.tar.xz
    cd ..
    echo -e "${GREEN}Node.js downloaded successfully${NC}"
    echo ""
fi

# Build base image if requested or if it doesn't exist
if [ "$BUILD_BASE" = true ]; then
    echo -e "${BLUE}Step 1: Building base image...${NC}"
    docker build -f Dockerfile.base -t "$BASE_IMAGE" .
    echo -e "${GREEN}✓ Base image built successfully${NC}"
    echo ""
    
    if [ "$PUSH_IMAGES" = true ]; then
        echo -e "${BLUE}Pushing base image...${NC}"
        docker push "$BASE_IMAGE"
        echo -e "${GREEN}✓ Base image pushed${NC}"
        echo ""
    fi
else
    # Check if base image exists
    if ! docker image inspect "$BASE_IMAGE" > /dev/null 2>&1; then
        echo -e "${YELLOW}Base image not found. Building it now...${NC}"
        docker build -f Dockerfile.base -t "$BASE_IMAGE" .
        echo -e "${GREEN}✓ Base image built successfully${NC}"
        echo ""
    else
        echo -e "${GREEN}Using existing base image: $BASE_IMAGE${NC}"
        echo ""
    fi
fi

# Build application image
echo -e "${BLUE}Step 2: Building application image...${NC}"
docker build -t "$APP_IMAGE" .
echo -e "${GREEN}✓ Application image built successfully${NC}"
echo ""

if [ "$PUSH_IMAGES" = true ]; then
    echo -e "${BLUE}Pushing application image...${NC}"
    docker push "$APP_IMAGE"
    echo -e "${GREEN}✓ Application image pushed${NC}"
    echo ""
fi

# Show image sizes
echo -e "${BLUE}=== Build Summary ===${NC}"
docker images | grep -E "REPOSITORY|open-notebook"
echo ""
echo -e "${GREEN}Build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: docker-compose up -d"
echo "  2. Or run: docker run -p 8502:8502 -p 5055:5055 $APP_IMAGE"
