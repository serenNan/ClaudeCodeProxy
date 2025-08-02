# ============================================================================
# Multi-stage Dockerfile for ClaudeCodeProxy
# Builds both frontend and backend in optimized layers
# ============================================================================

# ============================================================================
# Stage 1: Frontend Build
# ============================================================================
FROM node:20-alpine AS frontend-build

LABEL stage="frontend-build"
LABEL description="Build React frontend application"

WORKDIR /app/web

# Copy package files for better caching
COPY web/package*.json ./

# Install dependencies with cache optimization
RUN npm i --no-audit --prefer-offline

# Copy source code
COPY web/ ./

# Build the frontend application
RUN npm run build

# ============================================================================
# Stage 2: Backend Build
# ============================================================================
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS backend-build

LABEL stage="backend-build"
LABEL description="Build .NET backend application"

WORKDIR /app

# Copy solution and project files for better caching
COPY *.sln ./
COPY src/ClaudeCodeProxy.Host/*.csproj ./src/ClaudeCodeProxy.Host/
COPY src/ClaudeCodeProxy.Core/*.csproj ./src/ClaudeCodeProxy.Core/
COPY src/ClaudeCodeProxy.Abstraction/*.csproj ./src/ClaudeCodeProxy.Abstraction/
COPY src/ClaudeCodeProxy.Domain/*.csproj ./src/ClaudeCodeProxy.Domain/
COPY src/Provide/ClaudeCodeProxy.EntityFrameworkCore.Sqlite/*.csproj ./src/Provide/ClaudeCodeProxy.EntityFrameworkCore.Sqlite/

# Restore dependencies for linux-x64 runtime
RUN dotnet restore --runtime linux-x64

# Copy source code
COPY src/ ./src/

# Build and publish the application
RUN dotnet publish src/ClaudeCodeProxy.Host/ClaudeCodeProxy.Host.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    --runtime linux-x64 \
    --self-contained false \
    /p:PublishTrimmed=false \
    /p:PublishSingleFile=false

# ============================================================================
# Stage 3: Runtime Image
# ============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime

LABEL maintainer="ClaudeCodeProxy Team"
LABEL description="Enterprise-Grade AI API Proxy Management Platform"
LABEL version="1.0.0"
LABEL org.opencontainers.image.title="ClaudeCodeProxy"
LABEL org.opencontainers.image.description="A sophisticated proxy management system for AI APIs"
LABEL org.opencontainers.image.vendor="ClaudeCodeProxy Team"
LABEL org.opencontainers.image.source="https://github.com/your-username/ClaudeCodeProxy"
LABEL org.opencontainers.image.documentation="https://github.com/your-username/ClaudeCodeProxy/blob/main/README.md"

# Install required packages
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set working directory
WORKDIR /app

# Copy published backend application
COPY --from=backend-build --chown=appuser:appgroup /app/publish ./

# Copy frontend build to wwwroot
COPY --from=frontend-build --chown=appuser:appgroup /app/web/dist ./wwwroot/

# Create data directory for SQLite database
RUN mkdir -p /app/data && \
    chown -R appuser:appgroup /app/data

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_EnableDiagnostics=0
ENV DOTNET_gcServer=1
ENV DOTNET_gcConcurrent=1
ENV TZ=UTC

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Set entrypoint
ENTRYPOINT ["dotnet", "ClaudeCodeProxy.Host.dll"]

# ============================================================================
# Build Information
# ============================================================================
# To build this image:
# docker build -t claudecodeproxy:latest .
#
# To run this image:
# docker run -d -p 8080:8080 --name claudecodeproxy claudecodeproxy:latest
#
# To run with persistent data:
# docker run -d -p 8080:8080 -v $(pwd)/data:/app/data --name claudecodeproxy claudecodeproxy:latest
# ============================================================================