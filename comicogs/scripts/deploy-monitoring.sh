#!/bin/bash

# Deploy Monitoring and Analytics Infrastructure
# This script sets up the comprehensive monitoring system for ComicComp

set -e

echo "🚀 Starting ComicComp Monitoring Deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    fi
    
    # Check if database is accessible
    if [ -n "$DATABASE_URL" ]; then
        print_status "Testing database connection..."
        node -e "
            const { Pool } = require('pg');
            const pool = new Pool({ connectionString: process.env.DATABASE_URL });
            pool.query('SELECT NOW()', (err, res) => {
                if (err) {
                    console.error('Database connection failed:', err.message);
                    process.exit(1);
                }
                console.log('Database connection successful');
                pool.end();
            });
        " || {
            print_error "Database connection failed. Please check DATABASE_URL."
            exit 1
        }
    fi
    
    print_status "Prerequisites check completed ✓"
}

# Install monitoring dependencies
install_dependencies() {
    print_status "Installing monitoring dependencies..."
    
    cd backend
    
    # Install monitoring and analytics packages
    npm install --save \
        prometheus-client \
        winston \
        winston-daily-rotate-file \
        express-rate-limit \
        helmet \
        cors \
        compression \
        response-time \
        autocannon \
        nodemailer \
        node-cron
    
    # Install development dependencies for testing
    npm install --save-dev \
        jest \
        supertest \
        artillery \
        clinic
    
    cd ..
    print_status "Dependencies installed ✓"
}

# Set up database tables for analytics
setup_analytics_tables() {
    print_status "Setting up analytics database tables..."
    
    node -e "
        const db = require('./backend/db');
        const { initializeAuditTables } = require('./backend/services/AuditService');
        const analyticsService = require('./backend/services/analytics/AdvancedAnalyticsService');
        
        async function setupTables() {
            try {
                await initializeAuditTables();
                await analyticsService.initializeTables();
                console.log('Analytics tables created successfully');
                process.exit(0);
            } catch (error) {
                console.error('Failed to create analytics tables:', error);
                process.exit(1);
            }
        }
        
        setupTables();
    "
    
    print_status "Analytics tables setup completed ✓"
}

# Configure Prometheus metrics
setup_prometheus() {
    print_status "Setting up Prometheus metrics..."
    
    # Create Prometheus configuration
    mkdir -p monitoring/prometheus
    
    cat > monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'comiccomp-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics/prometheus'
    scrape_interval: 30s
    scrape_timeout: 10s

  - job_name: 'comiccomp-health'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/health'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF

    # Create alert rules
    cat > monitoring/prometheus/alert_rules.yml << EOF
groups:
  - name: comiccomp_alerts
    rules:
      - alert: HighResponseTime
        expr: http_request_duration_milliseconds{quantile="0.95"} > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "P95 response time is {{ \$value }}ms"

      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value | humanizePercentage }}"

      - alert: DatabaseConnectionFailure
        expr: up{job="comiccomp-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend service is down"
          description: "ComicComp backend has been down for more than 1 minute"

      - alert: HighMemoryUsage
        expr: process_memory_usage_bytes{type="heap_used"} / process_memory_usage_bytes{type="heap_total"} > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ \$value | humanizePercentage }}"
EOF

    print_status "Prometheus configuration created ✓"
}

# Set up Grafana dashboards
setup_grafana() {
    print_status "Setting up Grafana dashboards..."
    
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/provisioning/dashboards
    mkdir -p monitoring/grafana/provisioning/datasources
    
    # Grafana datasource configuration
    cat > monitoring/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: PostgreSQL
    type: postgres
    url: $DATABASE_URL
    database: ${DATABASE_NAME:-comiccomp_production}
    user: ${DATABASE_USER:-comiccomp}
    secureJsonData:
      password: ${DATABASE_PASSWORD}
    jsonData:
      sslmode: require
      postgresVersion: 1400
EOF

    # Dashboard provisioning
    cat > monitoring/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

    # ComicComp System Overview Dashboard
    cat > monitoring/grafana/dashboards/comiccomp-overview.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "ComicComp System Overview",
    "tags": ["comiccomp", "overview"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps"
          }
        }
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_milliseconds_bucket[5m]))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_milliseconds_bucket[5m]))",
            "legendFormat": "P50"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "ms"
          }
        }
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit"
          }
        }
      },
      {
        "id": 4,
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "comiccomp_active_users",
            "legendFormat": "Active Users"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    print_status "Grafana dashboards configured ✓"
}

# Set up log aggregation
setup_logging() {
    print_status "Setting up centralized logging..."
    
    mkdir -p logs
    
    # Configure log rotation
    cat > /etc/logrotate.d/comiccomp << EOF
/home/comiccomp/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 comiccomp comiccomp
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    # Create logging configuration
    cat > backend/config/logging.js << 'EOF'
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const createLogger = (service) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service },
    transports: [
      new DailyRotateFile({
        filename: path.join('logs', `${service}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
      }),
      new DailyRotateFile({
        filename: path.join('logs', `${service}-error-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true
      })
    ]
  });
};

if (process.env.NODE_ENV !== 'production') {
  module.exports.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = createLogger;
EOF

    print_status "Logging configuration completed ✓"
}

# Set up health checks and monitoring endpoints
setup_health_checks() {
    print_status "Setting up health check endpoints..."
    
    # Ensure health routes are properly integrated
    node -e "
        const fs = require('fs');
        const path = require('path');
        
        // Check if health routes are integrated in main app
        const appPath = path.join('backend', 'index.js');
        let appContent = fs.readFileSync(appPath, 'utf8');
        
        if (!appContent.includes('require(\\'./routes/health\\')')) {
            console.log('Adding health routes to main application...');
            
            const healthRouteImport = \"const healthRoutes = require('./routes/health');\";
            const healthRouteUse = \"app.use('/health', healthRoutes);\";
            
            // Add import
            if (!appContent.includes(healthRouteImport)) {
                appContent = appContent.replace(
                    /(const.*require.*routes.*)/,
                    \$1 + '\\n' + healthRouteImport
                );
            }
            
            // Add route
            if (!appContent.includes(healthRouteUse)) {
                appContent = appContent.replace(
                    /(app\.use.*api.*)/,
                    \$1 + '\\n' + healthRouteUse
                );
            }
            
            fs.writeFileSync(appPath, appContent);
            console.log('Health routes integrated successfully');
        } else {
            console.log('Health routes already integrated');
        }
    "
    
    print_status "Health check endpoints configured ✓"
}

# Configure PM2 with monitoring
setup_pm2_monitoring() {
    print_status "Configuring PM2 with monitoring..."
    
    # Create PM2 ecosystem file with monitoring
    cat > ecosystem.monitoring.js << EOF
module.exports = {
  apps: [
    {
      name: 'comiccomp-backend',
      script: './backend/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        ENABLE_METRICS: 'true',
        ENABLE_ANALYTICS: 'true'
      },
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Monitoring configuration
      pmx: true,
      monitoring: true,
      
      // Auto-restart configuration
      min_uptime: '10s',
      max_restarts: 5,
      
      // Health check
      health_check: {
        port: 3001,
        path: '/health',
        timeout: 5000,
        interval: 30000
      }
    }
  ],
  
  deploy: {
    production: {
      user: 'comiccomp',
      host: process.env.PRODUCTION_HOST || 'localhost',
      ref: 'origin/main',
      repo: process.env.GIT_REPO || 'git@github.com:your-org/comiccomp.git',
      path: '/home/comiccomp/comiccomp',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.monitoring.js --env production',
      'pre-setup': ''
    }
  }
};
EOF

    print_status "PM2 monitoring configuration created ✓"
}

# Set up alerting
setup_alerting() {
    print_status "Setting up alerting system..."
    
    mkdir -p monitoring/alertmanager
    
    # AlertManager configuration
    cat > monitoring/alertmanager/alertmanager.yml << EOF
global:
  smtp_smarthost: '${SMTP_HOST}:${SMTP_PORT}'
  smtp_from: '${ALERT_FROM_EMAIL:-alerts@comiccomp.com}'
  smtp_auth_username: '${SMTP_USER}'
  smtp_auth_password: '${SMTP_PASS}'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: '${ALERT_EMAIL:-admin@comiccomp.com}'
        subject: 'ComicComp Alert: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Instance: {{ .Labels.instance }}
          Severity: {{ .Labels.severity }}
          {{ end }}

    webhook_configs:
      - url: '${WEBHOOK_URL}'
        send_resolved: true
        http_config:
          basic_auth:
            username: '${WEBHOOK_USER}'
            password: '${WEBHOOK_PASS}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF

    print_status "Alerting system configured ✓"
}

# Create monitoring startup script
create_startup_script() {
    print_status "Creating monitoring startup script..."
    
    cat > start-monitoring.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting ComicComp Monitoring Stack..."

# Start the application with monitoring enabled
pm2 start ecosystem.monitoring.js --env production

# Display PM2 status
pm2 status

# Show logs
echo "📊 Monitoring endpoints available:"
echo "  Health Check: http://localhost:3001/health"
echo "  Detailed Health: http://localhost:3001/health/detailed"
echo "  Metrics: http://localhost:3001/metrics"
echo "  Prometheus Metrics: http://localhost:3001/metrics/prometheus"
echo "  Performance Metrics: http://localhost:3001/metrics/performance"

echo "✅ Monitoring stack started successfully!"
echo "💡 Use 'pm2 monit' to monitor processes in real-time"
echo "📊 Use 'pm2 logs' to view application logs"

# Optional: Start Prometheus and Grafana if using Docker
if command -v docker-compose &> /dev/null; then
    echo "🐳 Starting Prometheus and Grafana..."
    docker-compose -f monitoring/docker-compose.yml up -d
    echo "📊 Grafana available at: http://localhost:3000"
    echo "🔍 Prometheus available at: http://localhost:9090"
fi
EOF

    chmod +x start-monitoring.sh
    
    print_status "Startup script created ✓"
}

# Create Docker Compose for monitoring services
create_monitoring_docker() {
    print_status "Creating Docker Compose for monitoring services..."
    
    mkdir -p monitoring
    
    cat > monitoring/docker-compose.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: comiccomp-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: comiccomp-grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: comiccomp-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager:/etc/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: comiccomp-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:

networks:
  default:
    name: comiccomp-monitoring
EOF

    print_status "Docker Compose configuration created ✓"
}

# Run deployment tests
run_deployment_tests() {
    print_status "Running deployment tests..."
    
    # Test health endpoints
    node -e "
        const http = require('http');
        
        function testEndpoint(path, expectedStatus = 200) {
            return new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: 3001,
                    path: path,
                    method: 'GET'
                }, (res) => {
                    if (res.statusCode === expectedStatus) {
                        console.log(\`✓ \${path} - Status: \${res.statusCode}\`);
                        resolve();
                    } else {
                        console.log(\`✗ \${path} - Status: \${res.statusCode} (expected \${expectedStatus})\`);
                        reject(new Error(\`Unexpected status code: \${res.statusCode}\`));
                    }
                });
                
                req.on('error', (err) => {
                    console.log(\`✗ \${path} - Error: \${err.message}\`);
                    reject(err);
                });
                
                req.end();
            });
        }
        
        async function runTests() {
            try {
                await testEndpoint('/health');
                await testEndpoint('/health/detailed');
                await testEndpoint('/metrics');
                await testEndpoint('/metrics/prometheus');
                console.log('\\n✅ All health check endpoints are working!');
            } catch (error) {
                console.log('\\n❌ Some endpoints failed. Please check the application logs.');
                process.exit(1);
            }
        }
        
        setTimeout(runTests, 5000); // Wait 5 seconds for app to start
    " &
    
    print_status "Deployment tests scheduled ✓"
}

# Main deployment function
main() {
    echo "🎯 ComicComp Monitoring Deployment Script"
    echo "=========================================="
    
    check_prerequisites
    install_dependencies
    setup_analytics_tables
    setup_prometheus
    setup_grafana
    setup_logging
    setup_health_checks
    setup_pm2_monitoring
    setup_alerting
    create_startup_script
    create_monitoring_docker
    
    print_status "Starting monitoring stack..."
    ./start-monitoring.sh
    
    run_deployment_tests
    
    echo ""
    echo "🎉 Monitoring deployment completed successfully!"
    echo ""
    echo "📊 Next Steps:"
    echo "  1. Access Grafana at http://localhost:3000 (admin/admin)"
    echo "  2. Access Prometheus at http://localhost:9090"
    echo "  3. Check health at http://localhost:3001/health"
    echo "  4. Monitor processes with 'pm2 monit'"
    echo "  5. View logs with 'pm2 logs'"
    echo ""
    echo "🔧 Configuration Files Created:"
    echo "  - ecosystem.monitoring.js (PM2 configuration)"
    echo "  - monitoring/prometheus/prometheus.yml"
    echo "  - monitoring/grafana/dashboards/"
    echo "  - monitoring/alertmanager/alertmanager.yml"
    echo "  - monitoring/docker-compose.yml"
    echo ""
    echo "📈 Monitor your application performance and enjoy the insights!"
}

# Execute main function
main "$@"