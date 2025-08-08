# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClaudeCodeProxy** is an enterprise-grade AI API proxy management platform built with .NET 9 and React 19. It provides comprehensive API key management, request monitoring, cost analytics, and multi-platform AI service integration (Claude, OpenAI, Gemini).

## Architecture

### Backend (.NET 9)
- **Host**: ASP.NET Core Web API with minimal APIs
- **Database**: SQLite with Entity Framework Core
- **Authentication**: JWT-based authentication
- **Services**: Modular service architecture with dependency injection
- **Endpoints**: RESTful API with Scalar documentation

### Frontend (React 19 + TypeScript)
- **Framework**: React 19 with TypeScript 5.6
- **Styling**: Tailwind CSS 4.x + shadcn/ui components
- **Routing**: React Router DOM v7
- **Charts**: Recharts for analytics and visualizations
- **Build**: Vite with production build targeting backend wwwroot

## Key Technologies

| Component | Technology |
|-----------|------------|
| **Backend** | .NET 9, ASP.NET Core, Entity Framework Core |
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Database** | SQLite with migrations |
| **Authentication** | JWT tokens |
| **Monitoring** | Serilog logging, health checks |
| **Deployment** | Docker, Windows Service support |

## Quick Commands

### Development Setup
```bash
# Backend
cd src/ClaudeCodeProxy.Host
dotnet restore
dotnet run

# Frontend
cd web
npm install
npm run dev

# Docker
docker-compose up -d
```

### Build Commands
```bash
# Backend build
dotnet publish -c Release -o ./publish

# Frontend build for production
npm run build:prod

# Lint frontend
npm run lint
```

### Windows Service
```bash
# Install as Windows service
ClaudeCodeProxy.Host.exe --install-service
ClaudeCodeProxy.Host.exe --start-service

# Service management
--install-service, --uninstall-service
--start-service, --stop-service
--service-status
```

## Project Structure

### Backend Structure
```
src/
├── ClaudeCodeProxy.Abstraction/     # DTOs, interfaces, constants
├── ClaudeCodeProxy.Core/           # Core services, AI integrations
├── ClaudeCodeProxy.Domain/         # Entity models
├── ClaudeCodeProxy.Host/           # Web API, endpoints, middleware
└── Provide/ClaudeCodeProxy.EntityFrameworkCore.Sqlite/  # Database
```

### Frontend Structure
```
web/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route-based page components
│   ├── services/      # API service layer
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utilities and helpers
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## Configuration

### Backend Configuration
- **File**: `src/ClaudeCodeProxy.Host/appsettings.json`
- **Key settings**:
  - `ConnectionStrings:DefaultConnection` - SQLite database path
  - `Jwt:SecretKey` - JWT signing key
  - `Urls` - Server binding (default: http://*:6500)
  - `RunMigrationsAtStartup` - Auto database migration

### Frontend Configuration
- **File**: `web/src/services/api.ts`
- **Key settings**:
  - `VITE_API_URL` - Backend API URL
  - Build outputs to backend wwwroot via `build:prod`

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /system-info` - System information
- `GET /scalar/v1` - API documentation

### Management Endpoints
- `/api/apikeys` - API key management
- `/api/accounts` - Account management
- `/api/dashboard` - Analytics dashboard
- `/api/logs` - Request logging
- `/api/users` - User management
- `/api/pricing` - Pricing management

### Proxy Endpoints
- `/v1/messages` - Claude API proxy
- `/v1/chat/completions` - OpenAI API proxy

## Database

### Migration Commands
```bash
# Add new migration
dotnet ef migrations add MigrationName -p src/ClaudeCodeProxy.EntityFrameworkCore.Sqlite -s src/ClaudeCodeProxy.Host

# Update database
dotnet ef database update -s src/ClaudeCodeProxy.Host
```

### Key Entities
- **User** - System users with roles
- **ApiKey** - Managed API keys
- **RequestLog** - API request logs
- **ModelPricing** - AI model pricing
- **Wallet** - User balance tracking

## Development Workflow

### 1. Start Backend
```bash
cd src/ClaudeCodeProxy.Host
dotnet run
# Server runs on http://localhost:6500
```

### 2. Start Frontend
```bash
cd web
npm run dev
# Frontend runs on http://localhost:5173
```

### 3. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:6500
- **API Docs**: http://localhost:6500/scalar/v1

## Testing

### Backend Testing
```bash
dotnet test  # If tests exist
```

### Frontend Testing
```bash
npm run lint     # ESLint
npm run build    # TypeScript check + build
```

## Deployment

### Docker Production
```bash
# Build and run
docker-compose up -d

# Access via http://localhost:8080
```

### Manual Production
```bash
# Backend
dotnet publish -c Release -o ./publish
cd publish && dotnet ClaudeCodeProxy.Host.dll

# Frontend (builds to backend wwwroot)
cd web
npm run build:prod
```

## Important Notes

### Security
- Change default JWT secret key in production
- Configure OAuth credentials for GitHub/Google/Gitee
- Enable HTTPS in production
- Review CORS settings for production

### Environment Variables
- `USER_NAME`, `PASSWORD` - Default admin credentials
- `ConnectionStrings:DefaultConnection` - Database connection
- OAuth client IDs/secrets for external providers

### Performance
- Response compression enabled
- Memory caching for pricing data
- SQLite with shared cache mode
- Background service initialization

## Troubleshooting

### Common Issues
1. **Database locked**: Ensure single SQLite connection
2. **CORS errors**: Check frontend API URL configuration
3. **Service not starting**: Verify Windows service installation
4. **Build failures**: Check Node.js and .NET SDK versions

### Debug Mode
- Development: Enable detailed logging in `appsettings.Development.json`
- Frontend: Use browser dev tools with source maps
- Backend: Use Serilog console output for debugging