# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Git
- Node.js 18+ (if running without Docker)

## 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd kidevent

# Copy environment template
cp .env.example .env

# Edit environment variables (important!)
nano .env
```

## 2. Required Environment Variables

Update `.env` with at least these required values:

```env
# Database (required)
DATABASE_URL="postgresql://kidevent_user:kidevent_password@postgres:5432/kidevent_dev"

# Security (REQUIRED - change these!)
SESSION_SECRET="your-very-secure-session-secret-at-least-32-characters-long"

# CORS (development)
CORS_ORIGIN="http://localhost:3000,http://localhost:5000"
```

## 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Or run detached
docker-compose up -d --build
```

**Access the application:**
- Frontend & API: http://localhost:5000
- Database: localhost:5432 (username: kidevent_user, password: kidevent_password)

## 4. Alternative: Manual Setup

```bash
# Install dependencies
npm install

# Set up local PostgreSQL database
# Create database: kidevent_dev
# Update DATABASE_URL in .env accordingly

# Initialize database
npm run db:push

# Start development server
npm run dev
```

## 5. First Login

**Default Admin Account:**
- Email: admin@example.com
- Password: admin123

**Create New Account:**
1. Click "Create Account" on login page
2. Fill out registration form
3. Start using the application

## 6. Health Checks

Check if services are running:
- Health: http://localhost:5000/api/health
- Liveness: http://localhost:5000/api/health/live
- Readiness: http://localhost:5000/api/health/ready

## 7. Stopping Services

```bash
# Stop Docker services
docker-compose down

# Stop with volume cleanup (removes database data)
docker-compose down -v
```

## 8. Troubleshooting

### Common Issues

**Port 5000 already in use:**
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Database connection issues:**
```bash
# Check Docker container status
docker-compose ps
# View database logs
docker-compose logs postgres
```

**TypeScript errors:**
```bash
# Check TypeScript compilation
npm run check
# Build frontend
npm run build
```

### Check Application Status

```bash
# Check all containers
docker-compose ps

# View application logs
docker-compose logs app

# View database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U kidevent_user -d kidevent_dev -c "SELECT NOW();"
```

## 9. Development Workflow

```bash
# Install new dependencies
docker-compose exec app npm install <package-name>

# Run database migrations
docker-compose exec app npm run db:push

# Run tests
docker-compose exec app npm test

# Type checking
docker-compose exec app npm run check
```

## 10. Production Deployment

For production deployment, use `docker-compose.prod.yml`:

```bash
# Set production environment variables
cp .env.example .env.prod
# Edit .env.prod with production values

# Start production services
docker-compose -f docker-compose.prod.yml up -d --build
```

## Next Steps

1. Read the [Development Setup Guide](./DEV_SETUP.md) for detailed information
2. Review [Security Analysis](./SECURITY_ANALYSIS.md) for security considerations
3. Check [Architecture Enhancements](./ARCHITECTURE_ENHANCEMENTS.md) for future improvements

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables in `.env`
3. Ensure all required ports are available
4. Review the troubleshooting section above