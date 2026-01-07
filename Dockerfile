# Build stage
# Use custom base image with all dependencies pre-installed
# To build base image: docker build -f Dockerfile.base -t library/open-notebook-base:latest .
FROM library/open-notebook-base:latest AS builder

# Set build optimization environment variables
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

# Copy dependency files for Python
COPY pyproject.toml uv.lock ./
COPY open_notebook/__init__.py ./open_notebook/__init__.py

# Install Python dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install frontend dependencies with cache mount
WORKDIR /app/frontend
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application code
WORKDIR /app
COPY . /app

# Build frontend
WORKDIR /app/frontend
RUN npm run build

WORKDIR /app

# Runtime stage
# Use the same base image for runtime
FROM library/open-notebook-base:latest AS runtime



WORKDIR /app

# Copy from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app
COPY --from=builder /app/frontend/.next/standalone /app/frontend/
COPY --from=builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=builder /app/frontend/public /app/frontend/public

EXPOSE 8502 5055

# Create directories and set permissions
# Fix line endings for scripts (in case they were created on Windows)
RUN mkdir -p /app/data /var/log/supervisor && \
    sed -i 's/\r$//' /app/scripts/wait-for-api.sh && \
    chmod +x /app/scripts/wait-for-api.sh

COPY --from=builder /app/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
