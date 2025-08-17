#!/bin/bash

# Production Configuration Script for ComicComp
# Automates the setup of production environment variables and security

set -e

echo "🔧 ComicComp Production Configuration"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN="${1:-comicogs.com}"
EMAIL="${2:-admin@comicogs.com}"
ENV_FILE=".env.production.local"

echo -e "${BLUE}Domain:${NC} $DOMAIN"
echo -e "${BLUE}Admin Email:${NC} $EMAIL"
echo ""

# Helper functions
generate_random_string() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
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

# Check if production environment file exists
if [[ -f "$ENV_FILE" ]]; then
    echo -e "${YELLOW}⚠️  Production environment file already exists.${NC}"
    echo -n "Do you want to overwrite it? (y/N): "
    read overwrite
    if [[ "$overwrite" != "y" ]] && [[ "$overwrite" != "Y" ]]; then
        echo "Exiting..."
        exit 0
    fi
fi

echo -e "${GREEN}🚀 Starting production configuration...${NC}"
echo ""

# Start with base template
cp .env.production "$ENV_FILE"

# Generate secure secrets
echo -e "${BLUE}🔐 Generating secure secrets...${NC}"

NEXTAUTH_SECRET=$(generate_random_string 32)
JWT_SECRET=$(generate_jwt_secret)
REFRESH_TOKEN_SECRET=$(generate_jwt_secret)
SESSION_SECRET=$(generate_random_string 32)
DB_PASSWORD=$(generate_random_string 24)
REDIS_PASSWORD=$(generate_random_string 24)
GRAFANA_PASSWORD=$(generate_random_string 16)
WEBHOOK_SECRET=$(generate_random_string 32)

echo "✅ Secrets generated"

# Update environment file with generated secrets
sed -i.bak "s/REPLACE_WITH_32_CHAR_RANDOM_STRING/$NEXTAUTH_SECRET/g" "$ENV_FILE"
sed -i.bak "s/REPLACE_WITH_STRONG_JWT_SECRET/$JWT_SECRET/g" "$ENV_FILE"
sed -i.bak "s/REPLACE_WITH_REFRESH_TOKEN_SECRET/$REFRESH_TOKEN_SECRET/g" "$ENV_FILE"
sed -i.bak "s/REPLACE_WITH_SESSION_SECRET/$SESSION_SECRET/g" "$ENV_FILE"
sed -i.bak "s/STRONG_DATABASE_PASSWORD_HERE/$DB_PASSWORD/g" "$ENV_FILE"
sed -i.bak "s/STRONG_REDIS_PASSWORD_HERE/$REDIS_PASSWORD/g" "$ENV_FILE"
sed -i.bak "s/STRONG_GRAFANA_PASSWORD_HERE/$GRAFANA_PASSWORD/g" "$ENV_FILE"
sed -i.bak "s/comicogs.com/$DOMAIN/g" "$ENV_FILE"

# Remove backup file
rm "${ENV_FILE}.bak"

echo ""
echo -e "${BLUE}🔑 OAuth Configuration${NC}"
echo "Please configure OAuth providers in their respective platforms:"

echo ""
echo -e "${YELLOW}Google OAuth:${NC} https://console.developers.google.com"
echo "- Authorized redirect URIs: https://$DOMAIN/api/auth/callback/google"
GOOGLE_CLIENT_ID=$(prompt_user "Google Client ID" "")
GOOGLE_CLIENT_SECRET=$(prompt_user "Google Client Secret" "" "true")

echo ""
echo -e "${YELLOW}GitHub OAuth:${NC} https://github.com/settings/applications/new"
echo "- Authorization callback URL: https://$DOMAIN/api/auth/callback/github"
GITHUB_CLIENT_ID=$(prompt_user "GitHub Client ID" "")
GITHUB_CLIENT_SECRET=$(prompt_user "GitHub Client Secret" "" "true")

echo ""
echo -e "${BLUE}💳 Payment Configuration${NC}"
echo -e "${YELLOW}Stripe:${NC} https://dashboard.stripe.com/apikeys"
STRIPE_SECRET_KEY=$(prompt_user "Stripe Secret Key (sk_live_...)" "" "true")
STRIPE_PUBLISHABLE_KEY=$(prompt_user "Stripe Publishable Key (pk_live_...)" "")
STRIPE_WEBHOOK_SECRET=$(prompt_user "Stripe Webhook Secret (whsec_...)" "" "true")

echo ""
echo -e "${BLUE}📁 File Storage Configuration${NC}"
echo "Choose your file storage provider:"
echo "1) AWS S3"
echo "2) Cloudinary"
echo "3) Both"
echo "4) Skip for now"
read -p "Select option (1-4): " storage_option

case $storage_option in
    1|3)
        echo -e "${YELLOW}AWS S3 Configuration:${NC}"
        AWS_ACCESS_KEY_ID=$(prompt_user "AWS Access Key ID" "")
        AWS_SECRET_ACCESS_KEY=$(prompt_user "AWS Secret Access Key" "" "true")
        AWS_REGION=$(prompt_user "AWS Region" "us-east-1")
        AWS_S3_BUCKET=$(prompt_user "S3 Bucket Name" "${DOMAIN//./-}-images")
        ;;
esac

case $storage_option in
    2|3)
        echo -e "${YELLOW}Cloudinary Configuration:${NC}"
        CLOUDINARY_CLOUD_NAME=$(prompt_user "Cloudinary Cloud Name" "")
        CLOUDINARY_API_KEY=$(prompt_user "Cloudinary API Key" "")
        CLOUDINARY_API_SECRET=$(prompt_user "Cloudinary API Secret" "" "true")
        ;;
esac

echo ""
echo -e "${BLUE}📧 Email Configuration${NC}"
echo "Recommended: Resend (https://resend.com)"
RESEND_API_KEY=$(prompt_user "Resend API Key (re_...)" "" "true")

echo ""
echo -e "${BLUE}📊 Monitoring Configuration${NC}"
echo -e "${YELLOW}Sentry (Error Tracking):${NC} https://sentry.io"
SENTRY_DSN=$(prompt_user "Sentry DSN (optional)" "")

echo -e "${YELLOW}Google Analytics:${NC}"
ANALYTICS_ID=$(prompt_user "Google Analytics ID (G-...)" "")

# Update environment file with user inputs
update_env_var() {
    local key="$1"
    local value="$2"
    if [[ -n "$value" ]]; then
        sed -i.bak "s|${key}=\".*\"|${key}=\"${value}\"|g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
    fi
}

# Update OAuth settings
update_env_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
update_env_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
update_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
update_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET"

# Update payment settings
update_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
update_env_var "STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY"
update_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"

# Update storage settings
update_env_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
update_env_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
update_env_var "AWS_REGION" "$AWS_REGION"
update_env_var "AWS_S3_BUCKET" "$AWS_S3_BUCKET"
update_env_var "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
update_env_var "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
update_env_var "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"

# Update email settings
update_env_var "RESEND_API_KEY" "$RESEND_API_KEY"
update_env_var "EMAIL_FROM" "noreply@$DOMAIN"
update_env_var "EMAIL_REPLY_TO" "support@$DOMAIN"

# Update monitoring settings
update_env_var "SENTRY_DSN" "$SENTRY_DSN"
update_env_var "ANALYTICS_ID" "$ANALYTICS_ID"

# Create secrets file for Docker
echo ""
echo -e "${BLUE}🐳 Creating Docker secrets...${NC}"

mkdir -p ./secrets

# Create individual secret files for Docker
echo "$DB_PASSWORD" > ./secrets/postgres_password
echo "$REDIS_PASSWORD" > ./secrets/redis_password
echo "$GRAFANA_PASSWORD" > ./secrets/grafana_password
echo "$JWT_SECRET" > ./secrets/jwt_secret
echo "$NEXTAUTH_SECRET" > ./secrets/nextauth_secret

# Set proper permissions
chmod 600 ./secrets/*
chmod 700 ./secrets

echo "✅ Docker secrets created"

# Validate configuration
echo ""
echo -e "${BLUE}🔍 Validating configuration...${NC}"

validation_errors=0

# Check required variables
required_vars=("NEXTAUTH_SECRET" "JWT_SECRET" "POSTGRES_PASSWORD")
for var in "${required_vars[@]}"; do
    if ! grep -q "${var}=\"[^\"]*[^\"]*\"" "$ENV_FILE"; then
        echo -e "${RED}❌ Missing or empty: $var${NC}"
        validation_errors=$((validation_errors + 1))
    fi
done

# Check OAuth configuration
if ! grep -q "GOOGLE_CLIENT_ID=\"[^\"]*[^\"]*\"" "$ENV_FILE" && ! grep -q "GITHUB_CLIENT_ID=\"[^\"]*[^\"]*\"" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  No OAuth providers configured. Users won't be able to sign up.${NC}"
fi

# Check payment configuration
if ! grep -q "STRIPE_SECRET_KEY=\"sk_live_[^\"]*\"" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  Stripe not configured. Payments will not work.${NC}"
fi

if [[ $validation_errors -eq 0 ]]; then
    echo -e "${GREEN}✅ Configuration validation passed${NC}"
else
    echo -e "${RED}❌ Configuration has $validation_errors errors${NC}"
    echo "Please review and fix the issues above."
fi

# Create database initialization script
echo ""
echo -e "${BLUE}🗄️  Creating database initialization script...${NC}"

cat > ./scripts/init-production-db.sh << EOF
#!/bin/bash
set -e

echo "🗄️  Initializing production database..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U comicogs_user -d comicogs_prod; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready"

# Run migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T app npm run migrate

# Run seeds (if any)
echo "🌱 Running database seeds..."
docker-compose -f docker-compose.prod.yml exec -T app npm run seed

echo "✅ Database initialization complete"
EOF

chmod +x ./scripts/init-production-db.sh

# Create production deployment script
echo ""
echo -e "${BLUE}🚀 Creating production deployment script...${NC}"

cat > ./scripts/deploy-production.sh << EOF
#!/bin/bash
set -e

echo "🚀 Deploying ComicComp to Production"
echo "=================================="

# Load environment variables
if [[ -f ".env.production.local" ]]; then
    export \$(cat .env.production.local | grep -v '^#' | xargs)
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if required files exist
required_files=(".env.production.local" "docker-compose.prod.yml")
for file in "\${required_files[@]}"; do
    if [[ ! -f "\$file" ]]; then
        echo "❌ Missing required file: \$file"
        exit 1
    fi
done

# Check if SSL certificates exist (if using HTTPS)
if [[ -f "nginx/ssl-production.conf" ]]; then
    if [[ ! -f "ssl/$DOMAIN.crt" ]] || [[ ! -f "ssl/$DOMAIN.key" ]]; then
        echo "❌ SSL certificates not found. Run ./scripts/setup-ssl.sh first"
        exit 1
    fi
fi

echo "✅ Pre-deployment checks passed"

# Build and deploy
echo "🏗️  Building production images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run health checks
echo "🏥 Running health checks..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend: https://$DOMAIN"
echo "   API: https://$DOMAIN/api"
echo "   Admin: https://$DOMAIN/admin"
echo "   Grafana: http://localhost:3030 (admin/$GRAFANA_PASSWORD)"
echo ""
echo "📊 Monitoring:"
echo "   - Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Check status: docker-compose -f docker-compose.prod.yml ps"
echo "   - Health check: curl https://$DOMAIN/api/health"
EOF

chmod +x ./scripts/deploy-production.sh

# Final summary
echo ""
echo -e "${GREEN}🎉 Production configuration completed!${NC}"
echo ""
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "✅ Environment file created: $ENV_FILE"
echo "✅ Secrets generated and stored securely"
echo "✅ Docker secrets configured"
echo "✅ Deployment scripts created"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Review and verify the configuration in $ENV_FILE"
echo "2. Set up SSL certificates: ./scripts/setup-ssl.sh $DOMAIN $EMAIL"
echo "3. Deploy to production: ./scripts/deploy-production.sh"
echo ""
echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
echo "- Never commit $ENV_FILE to version control"
echo "- Regularly rotate secrets and passwords"
echo "- Monitor logs for security events"
echo "- Keep SSL certificates up to date"
echo ""
echo -e "${BLUE}🔐 Generated Credentials:${NC}"
echo "Database Password: $DB_PASSWORD"
echo "Redis Password: $REDIS_PASSWORD"
echo "Grafana Password: $GRAFANA_PASSWORD"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Save these credentials securely!${NC}"