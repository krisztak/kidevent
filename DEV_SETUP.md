# KidEvent Development Environment Setup

## Overview

KidEvent (RightHere) is a full-stack afterschool activity management platform built with modern web technologies. This guide provides comprehensive instructions for setting up a local development environment.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (Neon serverless in production)
- **Authentication**: Dual system (email/password + Replit OAuth)
- **State Management**: TanStack Query (React Query)
- **Testing**: Jest + React Testing Library

### Project Structure
```
kidevent/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility libraries
├── server/                # Express.js backend
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── index.ts          # Main server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database operations
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle ORM schemas and Zod validation
├── tests/                # Test suites
└── migrations/           # Database migrations
```

## Prerequisites

### Required Software
- **Node.js 18+** (recommended: 20+)
- **npm** or **yarn**
- **Docker** and **Docker Compose** (for containerized development)
- **PostgreSQL 15+** (if running without Docker)
- **Git**

### Development Tools (Recommended)
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

## Quick Start with Docker

### 1. Clone the Repository
```bash
git clone <repository-url>
cd kidevent
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Start with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### 4. Initialize Database
```bash
# Run database migrations
docker-compose exec app npm run db:push

# Seed initial data (optional)
docker-compose exec app npm run db:seed
```

## Manual Setup (Without Docker)

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb kidevent_dev

# Create user
sudo -u postgres createuser --interactive kidevent_user
```

#### Option B: Neon Serverless (Cloud)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string

### 3. Environment Configuration
Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://kidevent_user:password@localhost:5432/kidevent_dev"

# Server
PORT=5000
NODE_ENV=development

# Authentication
SESSION_SECRET="your-session-secret-here"

# Replit OAuth (optional)
REPL_ID="your-repl-id"
ISSUER_URL="https://replit.com/oidc"
REPLIT_DOMAINS="localhost:3000,localhost:5000"

# Security
CORS_ORIGIN="http://localhost:3000"
```

### 4. Database Migration
```bash
# Push schema to database
npm run db:push

# Alternative: Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 5. Start Development Servers
```bash
# Start backend (Terminal 1)
npm run dev

# The frontend is served by Vite in development mode
# Access the app at http://localhost:5000
```

## Environment Variables

### Required Variables
```env
DATABASE_URL=            # PostgreSQL connection string
PORT=5000               # Server port
NODE_ENV=development    # Environment mode
SESSION_SECRET=         # Session encryption secret
```

### Optional Variables
```env
# Replit OAuth
REPL_ID=                # Replit application ID
ISSUER_URL=             # Replit OIDC issuer URL
REPLIT_DOMAINS=         # Allowed domains for OAuth

# Security
CORS_ORIGIN=            # Allowed CORS origins
RATE_LIMIT_WINDOW=15    # Rate limiting window (minutes)
RATE_LIMIT_MAX=100      # Max requests per window

# Logging
LOG_LEVEL=info          # Logging level
```

## Development Workflow

### 1. Code Structure
- Frontend components in `client/src/components/`
- Backend routes in `server/routes.ts`
- Database schema in `shared/schema.ts`
- Tests in `tests/` directory

### 2. Database Operations
```bash
# Create new migration
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema changes (development)
npm run db:push

# Studio GUI for database
npx drizzle-kit studio
```

### 3. Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- event-management.test.ts

# Test with coverage
npm run test:coverage
```

### 4. Type Checking
```bash
# Check TypeScript types
npm run check

# Build for production
npm run build
```

## Docker Configuration

### Development Services
- **app**: Main application container
- **postgres**: PostgreSQL database
- **redis**: Session store and caching (optional)

### Docker Commands
```bash
# Build services
docker-compose build

# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs app

# Execute commands in container
docker-compose exec app npm run db:push

# Rebuild and restart
docker-compose up --build --force-recreate
```

## Database Schema

### Core Tables
- **users**: User accounts (email/password + Replit OAuth)
- **attendee**: Children profiles
- **events**: Activity events
- **event_registrations**: Event signups
- **event_supervisors**: Staff assignments
- **sessions**: Express session storage

### Key Relationships
- Users → Children (one-to-many)
- Events → Registrations (one-to-many)
- Events → Supervisors (many-to-many)

## API Endpoints

### Authentication
```
POST /api/auth/signup      # User registration
POST /api/auth/login       # Email/password login
GET  /api/auth/user        # Get current user
POST /api/auth/logout      # User logout
```

### Events
```
GET  /api/events           # List events
POST /api/events           # Create event (admin)
GET  /api/events/:id       # Get event details
PUT  /api/events/:id       # Update event (admin)
DELETE /api/events/:id     # Delete event (admin)
```

### Registrations
```
POST /api/register         # Register for event
GET  /api/registrations    # User's registrations
DELETE /api/registrations/:id # Cancel registration
```

## Common Issues and Solutions

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
```bash
# Check database status
docker-compose ps

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Port Conflicts
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Missing Environment Variables
- Ensure all required variables are set in `.env`
- Restart the application after changing environment variables
- Use `docker-compose down && docker-compose up` to reload environment

## Production Deployment

### Build Process
```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Environment Configuration
- Set `NODE_ENV=production`
- Use strong `SESSION_SECRET`
- Configure proper `DATABASE_URL`
- Set up SSL/TLS certificates

### Database Migration
```bash
# Run migrations in production
npm run db:migrate
```

## Security Considerations

### Development
- Never commit `.env` files
- Use strong session secrets
- Keep dependencies updated
- Enable CORS only for trusted origins

### Production
- Use environment variables for secrets
- Enable HTTPS/SSL
- Configure proper CORS policies
- Set up rate limiting
- Enable security headers
- Regular security audits

## Performance Optimization

### Database
- Use connection pooling
- Add appropriate indexes
- Monitor query performance
- Use database migrations for schema changes

### Frontend
- Implement lazy loading for components
- Use React Query for caching
- Optimize bundle size with Vite
- Use proper error boundaries

### Backend
- Implement response caching
- Use compression middleware
- Monitor memory usage
- Set up proper logging

## Monitoring and Debugging

### Logs
- Application logs in console (development)
- Database query logs via Drizzle
- Error tracking with proper error boundaries

### Debug Tools
- React Developer Tools
- Redux DevTools (for React Query)
- Database GUI tools (Drizzle Studio)
- Network tab for API debugging

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Use conventional commit messages
4. Update documentation for API changes
5. Ensure all tests pass before submitting PR

## Support

For development issues:
1. Check this documentation
2. Review existing GitHub issues
3. Check Docker logs: `docker-compose logs`
4. Verify environment variables
5. Create new issue with reproduction steps