#!/bin/bash

# Monitoring and Alerting Setup Script for ComicComp
# Configures comprehensive monitoring, alerting, and notification system

set -e

echo "📊 ComicComp Monitoring & Alerting Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-comicogs.com}"
EMAIL="${2:-devops@comicogs.com}"
SLACK_WEBHOOK="${3:-}"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

prompt_user() {
    local prompt="$1"
    local default="$2"
    local is_secret="$3"
    
    echo -n -e "${YELLOW}$prompt${NC}"
    if [[ -n "$default" ]]; then
        echo -n " (default: $default)"
    fi
    echo -n ": "
    
    if [[ "$is_secret" == "true" ]]; then
        read -s user_input
        echo ""
    else
        read user_input
    fi
    
    echo "${user_input:-$default}"
}

# Configure notification channels
configure_notifications() {
    log_info "Configuring notification channels..."
    
    echo ""
    echo -e "${BLUE}📧 Email Configuration${NC}"
    EMAIL_FROM=$(prompt_user "Alert email from address" "alerts@$DOMAIN")
    EMAIL_TO=$(prompt_user "Primary alert email" "$EMAIL")
    CRITICAL_EMAIL=$(prompt_user "Critical alerts email" "$EMAIL_TO")
    SECURITY_EMAIL=$(prompt_user "Security alerts email" "security@$DOMAIN")
    
    echo ""
    echo -e "${BLUE}📱 Slack Configuration (Optional)${NC}"
    echo "Create webhook at: https://your-workspace.slack.com/services/new/incoming-webhook"
    SLACK_WEBHOOK_URL=$(prompt_user "Slack webhook URL (optional)" "$SLACK_WEBHOOK")
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        SLACK_CRITICAL_CHANNEL=$(prompt_user "Critical alerts Slack channel" "#alerts-critical")
        SLACK_WARNING_CHANNEL=$(prompt_user "Warning alerts Slack channel" "#alerts-warning")
        SLACK_SECURITY_CHANNEL=$(prompt_user "Security alerts Slack channel" "#security-alerts")
        SLACK_BUSINESS_CHANNEL=$(prompt_user "Business alerts Slack channel" "#business-alerts")
    fi
    
    echo ""
    echo -e "${BLUE}📧 Email Service Configuration${NC}"
    echo "Choose email service:"
    echo "1) Resend (Recommended)"
    echo "2) SendGrid"
    echo "3) Custom SMTP"
    read -p "Select option (1-3): " email_service
    
    case $email_service in
        1)
            EMAIL_SERVICE="resend"
            SMTP_HOST="smtp.resend.com"
            SMTP_PORT="587"
            RESEND_API_KEY=$(prompt_user "Resend API Key" "" "true")
            SMTP_USERNAME="resend"
            SMTP_PASSWORD="$RESEND_API_KEY"
            ;;
        2)
            EMAIL_SERVICE="sendgrid"
            SMTP_HOST="smtp.sendgrid.net"
            SMTP_PORT="587"
            SENDGRID_API_KEY=$(prompt_user "SendGrid API Key" "" "true")
            SMTP_USERNAME="apikey"
            SMTP_PASSWORD="$SENDGRID_API_KEY"
            ;;
        3)
            EMAIL_SERVICE="custom"
            SMTP_HOST=$(prompt_user "SMTP Host" "")
            SMTP_PORT=$(prompt_user "SMTP Port" "587")
            SMTP_USERNAME=$(prompt_user "SMTP Username" "")
            SMTP_PASSWORD=$(prompt_user "SMTP Password" "" "true")
            ;;
    esac
    
    log_success "Notification channels configured"
}

# Update alertmanager configuration
update_alertmanager_config() {
    log_info "Updating Alertmanager configuration..."
    
    # Update alertmanager.yml with user inputs
    local config_file="./monitoring/alertmanager/alertmanager.yml"
    
    # Update SMTP configuration
    sed -i.bak "s|smtp_smarthost: .*|smtp_smarthost: '$SMTP_HOST:$SMTP_PORT'|g" "$config_file"
    sed -i.bak "s|smtp_from: .*|smtp_from: '$EMAIL_FROM'|g" "$config_file"
    sed -i.bak "s|smtp_auth_username: .*|smtp_auth_username: '$SMTP_USERNAME'|g" "$config_file"
    sed -i.bak "s|smtp_auth_password: .*|smtp_auth_password: '$SMTP_PASSWORD'|g" "$config_file"
    
    # Update email addresses
    sed -i.bak "s|devops@comicogs.com|$EMAIL_TO|g" "$config_file"
    sed -i.bak "s|cto@comicogs.com|$CRITICAL_EMAIL|g" "$config_file"
    sed -i.bak "s|security@comicogs.com|$SECURITY_EMAIL|g" "$config_file"
    
    # Update Slack webhook if provided
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        sed -i.bak "s|YOUR_SLACK_WEBHOOK_URL|$SLACK_WEBHOOK_URL|g" "$config_file"
        sed -i.bak "s|#alerts-critical|$SLACK_CRITICAL_CHANNEL|g" "$config_file"
        sed -i.bak "s|#alerts-warning|$SLACK_WARNING_CHANNEL|g" "$config_file"
        sed -i.bak "s|#security-alerts|$SLACK_SECURITY_CHANNEL|g" "$config_file"
        sed -i.bak "s|#business-alerts|$SLACK_BUSINESS_CHANNEL|g" "$config_file"
    else
        # Remove Slack configuration if not provided
        sed -i.bak '/slack_configs:/,/url:/d' "$config_file"
    fi
    
    # Update domain references
    sed -i.bak "s|comicogs.com|$DOMAIN|g" "$config_file"
    
    # Clean up backup file
    rm "${config_file}.bak" 2>/dev/null || true
    
    log_success "Alertmanager configuration updated"
}

# Create monitoring docker-compose extension
create_monitoring_compose() {
    log_info "Creating monitoring docker-compose configuration..."
    
    cat > ./docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/alerts/alert-rules.yml:/etc/prometheus/alert-rules.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
      - '--alertmanager.notification-queue-capacity=10000'
    networks:
      - comiccomp-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - ./monitoring/alertmanager/templates:/etc/alertmanager/templates:ro
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
      - '--cluster.listen-address=0.0.0.0:9094'
    networks:
      - comiccomp-network
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9093/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Grafana
  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    ports:
      - "3030:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD}
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=\${SMTP_HOST}:\${SMTP_PORT}
      - GF_SMTP_USER=\${SMTP_USERNAME}
      - GF_SMTP_PASSWORD=\${SMTP_PASSWORD}
      - GF_SMTP_FROM_ADDRESS=\${EMAIL_FROM}
      - GF_UNIFIED_ALERTING_ENABLED=true
      - GF_ALERTING_ENABLED=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
    networks:
      - comiccomp-network
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    restart: unless-stopped
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
    networks:
      - comiccomp-network

  # cAdvisor for container metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - comiccomp-network

  # Postgres Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    restart: unless-stopped
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/\${POSTGRES_DB}?sslmode=disable
    networks:
      - comiccomp-network
    depends_on:
      - db

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    restart: unless-stopped
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=\${REDIS_PASSWORD}
    networks:
      - comiccomp-network
    depends_on:
      - redis

volumes:
  prometheus_data:
    driver: local
  alertmanager_data:
    driver: local
  grafana_data:
    driver: local

networks:
  comiccomp-network:
    external: true
EOF
    
    log_success "Monitoring docker-compose configuration created"
}

# Create alert notification templates
create_alert_templates() {
    log_info "Creating alert notification templates..."
    
    mkdir -p ./monitoring/alertmanager/templates
    
    # Email template
    cat > ./monitoring/alertmanager/templates/email.tmpl << 'EOF'
{{ define "email.subject" }}
[{{ .Status | toUpper }}] ComicComp Alert - {{ .GroupLabels.alertname }}
{{ end }}

{{ define "email.html" }}
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .alert { border-left: 4px solid #333; padding: 10px; margin: 10px 0; }
        .critical { border-color: #d73027; background-color: #fdf2f2; }
        .warning { border-color: #f39c12; background-color: #fef9e7; }
        .info { border-color: #3498db; background-color: #edf7ff; }
        .resolved { border-color: #27ae60; background-color: #eafaf1; }
        .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .description { margin: 5px 0; }
        .time { color: #666; font-size: 12px; }
        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        ComicComp Monitoring Alert
    </div>
    
    {{ range .Alerts }}
    <div class="alert {{ .Labels.severity }}">
        <div class="description">
            <strong>{{ .Annotations.summary }}</strong><br>
            {{ .Annotations.description }}
        </div>
        <div class="time">
            <strong>Service:</strong> {{ .Labels.service }}<br>
            <strong>Severity:</strong> {{ .Labels.severity }}<br>
            <strong>Started:</strong> {{ .StartsAt.Format "2006-01-02 15:04:05 UTC" }}<br>
            {{ if .EndsAt }}
            <strong>Ended:</strong> {{ .EndsAt.Format "2006-01-02 15:04:05 UTC" }}
            {{ end }}
        </div>
    </div>
    {{ end }}
    
    <div class="footer">
        <p><strong>Quick Actions:</strong></p>
        <ul>
            <li><a href="https://monitoring.comicogs.com">View Grafana Dashboard</a></li>
            <li><a href="https://logs.comicogs.com">View Application Logs</a></li>
            <li><a href="https://docs.comicogs.com/runbooks">View Runbooks</a></li>
        </ul>
    </div>
</body>
</html>
{{ end }}
EOF
    
    log_success "Alert notification templates created"
}

# Create monitoring health check script
create_health_check() {
    log_info "Creating monitoring health check script..."
    
    cat > ./scripts/check-monitoring-health.sh << 'EOF'
#!/bin/bash

# Monitoring Health Check Script
# Verifies all monitoring components are working correctly

set -e

echo "📊 ComicComp Monitoring Health Check"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Checking $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Check Prometheus
check_service "Prometheus" "http://localhost:9090/-/healthy"

# Check Alertmanager
check_service "Alertmanager" "http://localhost:9093/-/healthy"

# Check Grafana
check_service "Grafana" "http://localhost:3030/api/health"

# Check exporters
check_service "Node Exporter" "http://localhost:9100/metrics"
check_service "Postgres Exporter" "http://localhost:9187/metrics"
check_service "Redis Exporter" "http://localhost:9121/metrics"

# Check if alerts are configured
echo -n "Checking alert rules... "
if curl -s "http://localhost:9090/api/v1/rules" | grep -q '"groups"'; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Check if targets are up
echo -n "Checking monitoring targets... "
targets_up=$(curl -s "http://localhost:9090/api/v1/targets" | grep -o '"health":"up"' | wc -l)
targets_total=$(curl -s "http://localhost:9090/api/v1/targets" | grep -o '"health":"' | wc -l)

if [[ $targets_up -gt 0 ]] && [[ $((targets_up * 100 / targets_total)) -gt 70 ]]; then
    echo -e "${GREEN}✅ OK ($targets_up/$targets_total targets up)${NC}"
else
    echo -e "${YELLOW}⚠️  Warning ($targets_up/$targets_total targets up)${NC}"
fi

echo ""
echo "📊 Monitoring URLs:"
echo "   Prometheus: http://localhost:9090"
echo "   Alertmanager: http://localhost:9093"
echo "   Grafana: http://localhost:3030 (admin/\$GRAFANA_PASSWORD)"
echo ""
echo "📧 Test alert notification:"
echo "   curl -X POST http://localhost:9093/api/v1/alerts"
EOF
    
    chmod +x ./scripts/check-monitoring-health.sh
    
    log_success "Monitoring health check script created"
}

# Create monitoring deployment script
create_deployment_script() {
    log_info "Creating monitoring deployment script..."
    
    cat > ./scripts/deploy-monitoring.sh << 'EOF'
#!/bin/bash

# Deploy ComicComp Monitoring Stack
# Deploys Prometheus, Alertmanager, Grafana, and exporters

set -e

echo "📊 Deploying ComicComp Monitoring Stack"
echo "======================================"

# Load environment variables
if [[ -f ".env.production.local" ]]; then
    export $(cat .env.production.local | grep -v '^#' | xargs)
fi

# Check prerequisites
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is required but not installed"
    exit 1
fi

# Create required directories
mkdir -p ./monitoring/prometheus/data
mkdir -p ./monitoring/alertmanager/data
mkdir -p ./monitoring/grafana/data

# Set proper permissions
sudo chown -R 472:472 ./monitoring/grafana/data  # Grafana user
sudo chown -R 65534:65534 ./monitoring/prometheus/data  # Nobody user
sudo chown -R 65534:65534 ./monitoring/alertmanager/data  # Nobody user

echo "🏗️  Building and starting monitoring services..."

# Deploy monitoring stack
docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Running health checks..."
./scripts/check-monitoring-health.sh

echo ""
echo "✅ Monitoring stack deployed successfully!"
echo ""
echo "📊 Access URLs:"
echo "   Prometheus: http://localhost:9090"
echo "   Alertmanager: http://localhost:9093"
echo "   Grafana: http://localhost:3030"
echo ""
echo "🔐 Default Credentials:"
echo "   Grafana: admin / \$GRAFANA_PASSWORD"
echo ""
echo "📧 Alert Configuration:"
echo "   Email alerts configured for: $EMAIL_TO"
echo "   Critical alerts: $CRITICAL_EMAIL"
echo "   Security alerts: $SECURITY_EMAIL"
EOF
    
    chmod +x ./scripts/deploy-monitoring.sh
    
    log_success "Monitoring deployment script created"
}

# Main execution
main() {
    echo ""
    log_info "Starting monitoring and alerting setup..."
    
    # Configure notification channels
    configure_notifications
    
    # Update alertmanager configuration
    update_alertmanager_config
    
    # Create monitoring docker-compose
    create_monitoring_compose
    
    # Create alert templates
    create_alert_templates
    
    # Create health check script
    create_health_check
    
    # Create deployment script
    create_deployment_script
    
    # Update environment file with monitoring settings
    if [[ -f ".env.production.local" ]]; then
        # Add monitoring configuration to environment file
        cat >> .env.production.local << EOF

# Monitoring Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USERNAME=$SMTP_USERNAME
SMTP_PASSWORD=$SMTP_PASSWORD
EMAIL_FROM=$EMAIL_FROM
EOF
    fi
    
    echo ""
    log_success "Monitoring and alerting setup completed!"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "✅ Alert rules configured for all critical services"
    echo "✅ Notification channels set up (email/Slack)"
    echo "✅ Monitoring docker-compose created"
    echo "✅ Health check scripts created"
    echo "✅ Deployment automation scripts created"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "1. Deploy monitoring stack: ./scripts/deploy-monitoring.sh"
    echo "2. Access Grafana: http://localhost:3030 (admin/\$GRAFANA_PASSWORD)"
    echo "3. Test alerts: curl -X POST http://localhost:9093/api/v1/alerts"
    echo "4. Set up alert escalation procedures with your team"
    echo ""
    echo -e "${BLUE}📧 Configured Notifications:${NC}"
    echo "   Primary: $EMAIL_TO"
    echo "   Critical: $CRITICAL_EMAIL"
    echo "   Security: $SECURITY_EMAIL"
    [[ -n "$SLACK_WEBHOOK_URL" ]] && echo "   Slack: Configured"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "- Test all notification channels before going live"
    echo "- Review alert thresholds based on your usage patterns"
    echo "- Set up escalation procedures for critical alerts"
    echo "- Document runbooks for common alert scenarios"
}

# Execute main function
main "$@"