# Comicogs Production Deployment Guide

This guide covers deploying Comicogs to production with Docker, including all services and configurations.

## Prerequisites

- Docker & Docker Compose
- Domain name with DNS configured
- SSL certificates (Let's Encrypt recommended)
- Production databases (PostgreSQL & Redis)
- External service accounts (Stripe, Resend, AWS S3)

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone https://github.com/your-org/comicogs.git
   cd comicogs
   cp deployment/.env.production.example .env.production
   ```

2. **Configure Environment**
   Edit `.env.production` with your production values:
   - Database URLs (PostgreSQL & Redis)
   - API keys (Stripe, Resend, AWS)
   - Domain configurations
   - Security tokens

3. **Deploy**
   ```bash
   # Production deployment
   docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d
   
   # Check status
   docker-compose -f deployment/docker-compose.prod.yml ps
   ```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │    Backend      │
│   (Port 80/443) │────│   (Port 3000)   │────│   (Port 4000)   │
│   Load Balancer │    │   Next.js App   │    │   Express API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │              ┌─────────────────┐            │
         │              │     Worker      │            │
         └──────────────│  Background Jobs │────────────┘
                        │   (BullMQ)      │
                        └─────────────────┘
                                 │
         ┌─────────────────┐    │    ┌─────────────────┐
         │   PostgreSQL    │────┼────│     Redis       │
         │   (Port 5432)   │    │    │   (Port 6379)   │
         │    Database     │    │    │  Cache & Queue  │
         └─────────────────┘    │    └─────────────────┘
                               │
                        ┌─────────────────┐
                        │   External      │
                        │   Services      │
                        │ Stripe, Resend  │
                        │ AWS S3, etc.    │
                        └─────────────────┘
```

## Services Overview

### Frontend (Next.js)
- **Port**: 3000
- **Features**: SSR, API routes, static assets
- **Health Check**: `/api/health`

### Backend (Express.js)
- **Port**: 4000
- **Features**: REST API, authentication, business logic
- **Health Check**: `/health`

### Worker (Background Jobs)
- **Purpose**: Email processing, alerts, scheduled tasks
- **Queue System**: BullMQ with Redis
- **Jobs**: `email`, `alerts`, `cleanup`

### Database (PostgreSQL)
- **Port**: 5432
- **Features**: Primary data storage, Prisma ORM
- **Backup**: Automated daily backups recommended

### Cache & Queue (Redis)
- **Port**: 6379
- **Features**: Session storage, job queues, caching
- **Persistence**: AOF enabled

### Nginx (Reverse Proxy)
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Features**: SSL termination, load balancing, static file serving
- **Configuration**: `/nginx/production.conf`

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://user:pass@host:6379` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_...` |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `EMAIL_FROM` | Default sender email | `Comicogs <no-reply@domain.com>` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `https://comicogs.com` |
| `NEXT_PUBLIC_API_URL` | Public API URL | `https://api.comicogs.com` |
| `CRON_TOKEN` | Secure token for cron jobs | `random-secure-token` |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | `secret...` |
| `S3_BUCKET` | S3 bucket for file uploads | `comicogs-uploads-prod` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `SENTRY_DSN` | Sentry error tracking | _(none)_ |
| `GOOGLE_ANALYTICS_ID` | GA tracking ID | _(none)_ |

## Deployment Steps

### 1. Infrastructure Setup

**Database Setup (PostgreSQL)**
```bash
# Option A: Managed service (AWS RDS, Google Cloud SQL, etc.)
# - Create PostgreSQL 15+ instance
# - Note connection details
# - Enable automated backups

# Option B: Self-hosted
docker run -d \
  --name comicogs-postgres \
  -e POSTGRES_DB=comicogs \
  -e POSTGRES_USER=comicogs \
  -e POSTGRES_PASSWORD=secure_password \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

**Redis Setup**
```bash
# Option A: Managed service (AWS ElastiCache, Redis Cloud, etc.)
# - Create Redis 7+ instance
# - Note connection details

# Option B: Self-hosted
docker run -d \
  --name comicogs-redis \
  -v redis_data:/data \
  -p 6379:6379 \
  redis:7-alpine redis-server --appendonly yes
```

### 2. Domain & SSL Configuration

**DNS Configuration**
```
A    comicogs.com        → 1.2.3.4
A    api.comicogs.com    → 1.2.3.4
A    www.comicogs.com    → 1.2.3.4
```

**SSL Certificates (Let's Encrypt)**
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d comicogs.com -d api.comicogs.com -d www.comicogs.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/comicogs.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/comicogs.com/privkey.pem nginx/ssl/
```

### 3. Application Deployment

**Build and Deploy**
```bash
# Clone repository
git clone https://github.com/your-org/comicogs.git
cd comicogs

# Configure environment
cp deployment/.env.production.example .env.production
nano .env.production  # Edit with your values

# Deploy services
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d

# Check logs
docker-compose -f deployment/docker-compose.prod.yml logs -f

# Run database migrations
docker-compose -f deployment/docker-compose.prod.yml exec backend npm run db:migrate

# Seed initial data (optional)
docker-compose -f deployment/docker-compose.prod.yml exec backend npm run db:seed
```

### 4. Health Checks & Monitoring

**Service Health**
```bash
# Check all services
docker-compose -f deployment/docker-compose.prod.yml ps

# Health endpoints
curl https://comicogs.com/api/health        # Frontend
curl https://api.comicogs.com/health        # Backend
curl https://api.comicogs.com/api/alerts/status  # Queue status
```

**Monitoring Setup**
```bash
# Sentry (Error Tracking)
# 1. Create Sentry project
# 2. Add SENTRY_DSN to environment

# Uptime Monitoring
# - Set up monitoring for https://comicogs.com
# - Set up monitoring for https://api.comicogs.com/health
# - Alert on 5xx errors or downtime
```

## Production Operations

### Backup Strategy

**Database Backups**
```bash
# Daily automated backup
docker-compose -f deployment/docker-compose.prod.yml exec db pg_dump -U postgres comicogs > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose -f deployment/docker-compose.prod.yml exec -T db psql -U postgres comicogs < backup_20250829.sql
```

**File Storage Backups**
- AWS S3 versioning enabled
- Cross-region replication configured
- Lifecycle policies for cost optimization

### Scaling Considerations

**Horizontal Scaling**
```yaml
# Add multiple backend instances
backend:
  # ... existing config
  deploy:
    replicas: 3
    update_config:
      parallelism: 1
      delay: 10s
```

**Performance Monitoring**
- Monitor Redis memory usage
- Track PostgreSQL query performance
- Monitor API response times
- Track queue processing times

### Security Hardening

**Network Security**
- Firewall rules (only 80, 443 public)
- Internal network isolation
- VPN access for admin operations

**Application Security**
- Rate limiting enabled
- CORS properly configured
- Helmet.js security headers
- Input validation with Zod

**Data Security**
- Database encryption at rest
- Encrypted backups
- Secure API key storage
- Regular security updates

### Troubleshooting

**Common Issues**

1. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose -f deployment/docker-compose.prod.yml logs [service-name]
   
   # Check environment variables
   docker-compose -f deployment/docker-compose.prod.yml exec [service] env
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   docker-compose -f deployment/docker-compose.prod.yml exec backend npm run db:studio
   
   # Check database status
   docker-compose -f deployment/docker-compose.prod.yml exec db pg_isready
   ```

3. **Queue Processing Issues**
   ```bash
   # Check worker logs
   docker-compose -f deployment/docker-compose.prod.yml logs worker
   
   # Check queue status
   curl https://api.comicogs.com/api/alerts/status
   ```

4. **SSL/Domain Issues**
   ```bash
   # Test SSL certificate
   openssl s_client -connect comicogs.com:443
   
   # Check nginx configuration
   docker-compose -f deployment/docker-compose.prod.yml exec nginx nginx -t
   ```

### Updates & Maintenance

**Application Updates**
```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
docker-compose -f deployment/docker-compose.prod.yml build
docker-compose -f deployment/docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f deployment/docker-compose.prod.yml exec backend npm run db:migrate
```

**Database Migrations**
```bash
# Create migration
docker-compose -f deployment/docker-compose.prod.yml exec backend npm run db:migrate

# Check migration status
docker-compose -f deployment/docker-compose.prod.yml exec backend npx prisma migrate status
```

**Security Updates**
```bash
# Update base images
docker-compose -f deployment/docker-compose.prod.yml pull

# Rebuild with latest security patches
docker-compose -f deployment/docker-compose.prod.yml build --no-cache
```

## Support & Monitoring

### Log Aggregation
- Centralized logging with ELK stack or similar
- Log rotation and retention policies
- Structured logging with correlation IDs

### Alerting
- Service health monitoring
- Database performance alerts
- Queue processing alerts
- Error rate thresholds

### Performance Metrics
- API response times
- Database query performance
- Queue processing rates
- User engagement metrics

---

For additional support, consult the [operational runbooks](../docs/runbooks/) or contact the development team.
