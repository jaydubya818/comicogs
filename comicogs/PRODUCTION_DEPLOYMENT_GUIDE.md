# 🚀 ComicComp Production Deployment Guide

Complete guide for deploying ComicComp to production with enterprise-grade reliability, security, and monitoring.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ or macOS 10.15+
- **RAM**: Minimum 8GB, Recommended 16GB+
- **Storage**: Minimum 50GB, Recommended 100GB+ SSD
- **CPU**: Minimum 4 cores, Recommended 8+ cores
- **Network**: Static IP address, Domain name configured

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- OpenSSL 1.1+
- curl, wget, jq

### Domain & DNS Setup
- Domain name pointing to your server
- DNS A record: `your-domain.com` → `SERVER_IP`
- DNS CNAME record: `www.your-domain.com` → `your-domain.com`

## 🔐 Quick Start (Automated)

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/comicogs.git
cd comicogs

# Run complete setup (interactive)
./scripts/configure-production.sh your-domain.com admin@your-domain.com
```

### 2. Deploy Everything

```bash
# Complete production deployment
./scripts/deploy-production-complete.sh your-domain.com admin@your-domain.com
```

### 3. Verify Deployment

```bash
# Check all services
./scripts/check-monitoring-health.sh

# Test endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com
```

**That's it! Your production ComicComp instance is live! 🎉**

---

## 📖 Detailed Step-by-Step Guide

### Step 1: Environment Configuration

#### Generate Production Environment
```bash
# Interactive configuration
./scripts/configure-production.sh your-domain.com admin@your-domain.com
```

This script will:
- ✅ Generate secure secrets automatically
- ✅ Configure OAuth providers (Google, GitHub, Discord)
- ✅ Set up payment processing (Stripe)
- ✅ Configure file storage (AWS S3 or Cloudinary)
- ✅ Set up email service (Resend recommended)
- ✅ Configure monitoring and analytics

#### Manual Configuration (Alternative)
```bash
# Copy template
cp .env.production .env.production.local

# Edit with your values
nano .env.production.local
```

**Critical Variables to Configure:**
```bash
# Database
POSTGRES_PASSWORD="your-secure-password"

# Authentication
JWT_SECRET="your-64-character-secret"
NEXTAUTH_SECRET="your-32-character-secret"

# OAuth (choose providers)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Payments
STRIPE_SECRET_KEY="sk_live_your-stripe-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-key"

# Email
RESEND_API_KEY="re_your-resend-key"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

### Step 2: SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)
```bash
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com letsencrypt
```

#### Option B: Custom Certificate
```bash
# Place your certificates
cp your-certificate.crt ssl/your-domain.com.crt
cp your-private-key.key ssl/your-domain.com.key

./scripts/setup-ssl.sh your-domain.com admin@your-domain.com custom
```

### Step 3: Database Optimization

```bash
# Apply production optimizations
./scripts/optimize-database.sh
```

This includes:
- ✅ Performance indexes for all tables
- ✅ Query optimization functions
- ✅ Automated maintenance procedures
- ✅ Monitoring views
- ✅ Cleanup routines

### Step 4: Monitoring & Alerting

```bash
# Configure comprehensive monitoring
./scripts/setup-monitoring-alerts.sh your-domain.com admin@your-domain.com
```

Features:
- ✅ Prometheus metrics collection
- ✅ Grafana dashboards
- ✅ Alertmanager notifications
- ✅ Email and Slack alerts
- ✅ Performance baselines

### Step 5: Complete Deployment

```bash
# Deploy everything
./scripts/deploy-production-complete.sh your-domain.com admin@your-domain.com
```

**Deployment Process:**
1. 🔍 Pre-deployment checks
2. 🧪 Run all tests
3. 💾 Database backup and optimization
4. 🔐 SSL certificate validation
5. 🏗️ Build application images
6. 🚀 Deploy core services
7. 📊 Deploy monitoring stack
8. 🏥 Comprehensive health checks
9. 📈 Performance baseline creation
10. ✅ Post-deployment verification

---

## 🔧 Manual Deployment Steps

### 1. Build and Start Core Services

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start database and cache
docker-compose -f docker-compose.prod.yml up -d db redis

# Run database migrations
docker-compose -f docker-compose.prod.yml run --rm app npm run migrate

# Start application services
docker-compose -f docker-compose.prod.yml up -d app frontend nginx
```

### 2. Deploy Monitoring (Optional)

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Health Verification

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Test API
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:3000

# Check monitoring
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3030/api/health  # Grafana
```

---

## 📊 Accessing Your Services

### Primary Application
- **Frontend**: https://your-domain.com
- **API**: https://your-domain.com/api
- **Admin Panel**: https://your-domain.com/admin

### Monitoring & Operations
- **Grafana**: http://localhost:3030 (admin/your-grafana-password)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### Development/Debug
- **API Direct**: http://localhost:3001
- **Frontend Direct**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

---

## 🛡️ Security Checklist

### SSL/TLS Configuration
- ✅ SSL certificates installed and valid
- ✅ HTTP to HTTPS redirect configured
- ✅ Strong cipher suites enabled
- ✅ HSTS headers configured

### Application Security
- ✅ Strong passwords and secrets
- ✅ Rate limiting enabled
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection headers
- ✅ CORS properly configured

### Infrastructure Security
- ✅ Database access restricted
- ✅ Redis password protected
- ✅ Docker containers non-root
- ✅ File permissions properly set
- ✅ Monitoring access secured

---

## 📈 Performance Optimization

### Database Performance
```bash
# Monitor query performance
docker exec comicogs_db psql -U comicogs_user -d comicogs_prod -c "SELECT * FROM slow_queries LIMIT 10;"

# Check index usage
docker exec comicogs_db psql -U comicogs_user -d comicogs_prod -c "SELECT * FROM index_usage ORDER BY times_used DESC LIMIT 10;"

# Run maintenance
docker exec comicogs_db psql -U comicogs_user -d comicogs_prod -c "SELECT perform_maintenance();"
```

### Application Performance
```bash
# Check cache performance
curl http://localhost:3001/api/health/cache

# Monitor response times
curl -w "%{time_total}" http://localhost:3001/api/comics

# View memory usage
docker stats comicogs_app comicogs_frontend
```

### Network Performance
```bash
# Test SSL performance
openssl s_time -connect your-domain.com:443 -new

# Check compression
curl -H "Accept-Encoding: gzip" -v https://your-domain.com
```

---

## 🔄 Backup & Recovery

### Automated Backups
```bash
# Set up automated backups (add to crontab)
0 2 * * * /path/to/comicogs/scripts/db-maintenance.sh
0 3 * * 0 /path/to/comicogs/scripts/backup-database.sh
```

### Manual Backup
```bash
# Database backup
docker exec comicogs_db pg_dump -U comicogs_user comicogs_prod | gzip > backup-$(date +%Y%m%d).sql.gz

# Complete system backup
tar -czf comicogs-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  .
```

### Disaster Recovery
```bash
# Restore from backup
zcat backup-20240101.sql.gz | docker exec -i comicogs_db psql -U comicogs_user -d comicogs_prod

# Rollback deployment
./scripts/rollback-deployment.sh logs/rollback-info-deploy-20240101_120000.json
```

---

## 📱 Monitoring & Alerting

### Key Metrics to Monitor
- **Response Time**: < 200ms for 95th percentile
- **Error Rate**: < 1% for all endpoints
- **Database Connections**: < 80% of maximum
- **Memory Usage**: < 85% of available
- **CPU Usage**: < 70% average
- **Disk Space**: > 20% free

### Alert Channels
- **Critical Alerts**: Email + Slack (immediate)
- **Warning Alerts**: Email (within 2 minutes)
- **Security Alerts**: Email + Slack (immediate)
- **Business Metrics**: Email (daily summary)

### Custom Dashboards
Access Grafana at `http://localhost:3030` to view:
- 📊 Application Performance Dashboard
- 🗄️ Database Performance Dashboard  
- 🔧 Infrastructure Overview Dashboard
- 💼 Business Metrics Dashboard

---

## 🚨 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app
docker-compose -f docker-compose.prod.yml logs db

# Check disk space
df -h

# Check ports
lsof -i :3000 -i :3001 -i :5432
```

#### Database Connection Issues
```bash
# Test database connectivity
docker exec comicogs_db pg_isready -U comicogs_user -d comicogs_prod

# Check database logs
docker logs comicogs_db

# Reset database connection
docker-compose -f docker-compose.prod.yml restart db
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/your-domain.com.crt -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443

# Regenerate certificate
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com letsencrypt
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor database performance
./scripts/monitor-performance.sh

# Clear caches
docker exec comicogs_redis redis-cli FLUSHDB
docker exec comicogs_app npm run cache:clear
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Quick rollback to previous version
./scripts/rollback-deployment.sh

# Specific rollback
./scripts/rollback-deployment.sh logs/rollback-info-deploy-20240101_120000.json
```

#### Scale Up Resources
```bash
# Increase database connections
docker exec comicogs_db psql -U comicogs_user -d comicogs_prod -c "ALTER SYSTEM SET max_connections = 300;"
docker-compose -f docker-compose.prod.yml restart db

# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

---

## 🔧 Maintenance

### Daily Tasks
- ✅ Monitor alert channels
- ✅ Check system health dashboards
- ✅ Review error logs
- ✅ Verify backup completion

### Weekly Tasks
- ✅ Update security patches
- ✅ Review performance metrics
- ✅ Clean up old logs and backups
- ✅ Test monitoring alerts

### Monthly Tasks
- ✅ Review and rotate secrets
- ✅ Update SSL certificates (if needed)
- ✅ Performance optimization review
- ✅ Capacity planning assessment

---

## 🎯 Post-Deployment Checklist

### Immediate (First Hour)
- [ ] All services healthy and responsive
- [ ] SSL certificate valid and working
- [ ] Database connectivity confirmed
- [ ] Cache system operational
- [ ] Monitoring dashboards accessible
- [ ] Alert notifications working

### Short Term (First Day)
- [ ] User registration working
- [ ] Payment processing functional
- [ ] Email notifications sending
- [ ] Search functionality working
- [ ] Image uploads functional
- [ ] API rate limiting working

### Medium Term (First Week)
- [ ] Performance baselines established
- [ ] Backup procedures tested
- [ ] Rollback procedures tested
- [ ] Load testing completed
- [ ] Security scanning completed
- [ ] Documentation updated

---

## 📞 Support & Resources

### Documentation
- **API Documentation**: https://your-domain.com/api/docs
- **User Guide**: https://docs.your-domain.com
- **Runbooks**: https://docs.your-domain.com/runbooks

### Monitoring
- **Status Page**: https://status.your-domain.com
- **Grafana**: http://localhost:3030
- **Logs**: `docker-compose -f docker-compose.prod.yml logs -f`

### Emergency Contacts
- **DevOps Team**: devops@your-domain.com
- **Security Team**: security@your-domain.com
- **On-Call**: +1-XXX-XXX-XXXX

---

## 🎉 Congratulations!

Your ComicComp production deployment is now complete! 

**What you've achieved:**
- ✅ Enterprise-grade security configuration
- ✅ Comprehensive monitoring and alerting
- ✅ High-performance database optimization
- ✅ Automated deployment and rollback procedures
- ✅ Production-ready infrastructure

**Your ComicComp platform is now ready to serve users at scale! 🚀**

---

*For additional help or questions, please contact our support team or check the documentation at https://docs.comicogs.com*