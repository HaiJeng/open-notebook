@echo off
REM Build script for Open Notebook with base image optimization (Windows version)
setlocal enabledelayedexpansion

set BASE_IMAGE=library/open-notebook-base:latest
set APP_IMAGE=library/open-notebook-cn:latest
set BUILD_BASE=0
set PUSH_IMAGES=0

REM Parse arguments
:parse_args
if "%~1"=="" goto :end_parse
if /i "%~1"=="--build-base" (
    set BUILD_BASE=1
    shift
    goto :parse_args
)
if /i "%~1"=="--push" (
    set PUSH_IMAGES=1
    shift
    goto :parse_args
)
if /i "%~1"=="--help" (
    echo Usage: build-docker.bat [OPTIONS]
    echo.
    echo Options:
    echo   --build-base    Rebuild the base image ^(only needed once or when dependencies change^)
    echo   --push          Push images to registry after build
    echo   --help          Show this help message
    echo.
    echo Examples:
    echo   build-docker.bat                    # Build app image using existing base image
    echo   build-docker.bat --build-base       # Rebuild base image and app image
    echo   build-docker.bat --build-base --push  # Rebuild and push both images
    exit /b 0
)
echo Unknown option: %~1
echo Use --help for usage information
exit /b 1
:end_parse

REM Enable BuildKit
set DOCKER_BUILDKIT=1

echo === Open Notebook Build Script ===
echo.

REM Check if docker-deps directory exists
if not exist "docker-deps\node-v20.18.2-linux-x64.tar.xz" (
    echo Warning: docker-deps\node-v20.18.2-linux-x64.tar.xz not found
    echo Downloading Node.js...
    if not exist docker-deps mkdir docker-deps
    cd docker-deps
    curl -LO https://nodejs.org/dist/v20.18.2/node-v20.18.2-linux-x64.tar.xz
    cd ..
    echo Node.js downloaded successfully
    echo.
)

REM Build base image if requested or if it doesn't exist
if %BUILD_BASE%==1 (
    echo Step 1: Building base image...
    docker build -f Dockerfile.base -t %BASE_IMAGE% .
    if errorlevel 1 (
        echo Error: Failed to build base image
        exit /b 1
    )
    echo Base image built successfully
    echo.
    
    if %PUSH_IMAGES%==1 (
        echo Pushing base image...
        docker push %BASE_IMAGE%
        echo Base image pushed
        echo.
    )
) else (
    REM Check if base image exists
    docker image inspect %BASE_IMAGE% >nul 2>&1
    if errorlevel 1 (
        echo Base image not found. Building it now...
        docker build -f Dockerfile.base -t %BASE_IMAGE% .
        if errorlevel 1 (
            echo Error: Failed to build base image
            exit /b 1
        )
        echo Base image built successfully
        echo.
    ) else (
        echo Using existing base image: %BASE_IMAGE%
        echo.
    )
)

REM Build application image
echo Step 2: Building application image...
docker build -t %APP_IMAGE% .
if errorlevel 1 (
    echo Error: Failed to build application image
    exit /b 1
)
echo Application image built successfully
echo.

if %PUSH_IMAGES%==1 (
    echo Pushing application image...
    docker push %APP_IMAGE%
    echo Application image pushed
    echo.
)

REM Show image sizes
echo === Build Summary ===
docker images | findstr "REPOSITORY open-notebook"
echo.
echo Build completed successfully!
echo.
echo Next steps:
echo   1. Run: docker-compose up -d
echo   2. Or run: docker run -p 8502:8502 -p 5055:5055 %APP_IMAGE%

endlocal
