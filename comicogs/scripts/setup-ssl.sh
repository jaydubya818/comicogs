#!/bin/bash

# SSL Certificate Setup Script for ComicComp Production
# Supports both Let's Encrypt and custom certificates

set -e

DOMAIN="${1:-comicogs.com}"
EMAIL="${2:-admin@comicogs.com}"
CERT_METHOD="${3:-letsencrypt}"  # letsencrypt or custom

echo "🔐 Setting up SSL certificates for $DOMAIN"

# Create SSL directory
mkdir -p ./ssl
mkdir -p ./nginx/ssl

case $CERT_METHOD in
    "letsencrypt")
        echo "📋 Setting up Let's Encrypt SSL certificates..."
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            echo "Installing certbot..."
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                brew install certbot
            fi
        fi
        
        # Create temporary nginx config for certificate challenge
        cat > ./nginx/temp-ssl.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
        
        # Start temporary nginx for certificate validation
        docker run -d --name nginx-temp -p 80:80 -v $(pwd)/nginx/temp-ssl.conf:/etc/nginx/conf.d/default.conf -v certbot-www:/var/www/certbot nginx:alpine
        
        # Obtain certificate
        docker run --rm -v certbot-certs:/etc/letsencrypt -v certbot-www:/var/www/certbot certbot/certbot certonly --webroot --webroot-path=/var/www/certbot --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN -d www.$DOMAIN
        
        # Stop temporary nginx
        docker stop nginx-temp && docker rm nginx-temp
        
        # Copy certificates to local directory
        docker run --rm -v certbot-certs:/etc/letsencrypt -v $(pwd)/ssl:/ssl alpine cp -r /etc/letsencrypt/live/$DOMAIN/* /ssl/
        
        echo "✅ Let's Encrypt certificates obtained successfully"
        echo "📁 Certificates saved to ./ssl/"
        
        # Set up auto-renewal
        cat > ./scripts/renew-ssl.sh << 'EOF'
#!/bin/bash
echo "🔄 Renewing SSL certificates..."
docker run --rm -v certbot-certs:/etc/letsencrypt -v certbot-www:/var/www/certbot certbot/certbot renew --quiet
docker run --rm -v certbot-certs:/etc/letsencrypt -v $(pwd)/ssl:/ssl alpine cp -r /etc/letsencrypt/live/*/. /ssl/
docker-compose -f docker-compose.prod.yml restart nginx
echo "✅ SSL certificates renewed"
EOF
        chmod +x ./scripts/renew-ssl.sh
        
        echo "⏰ Auto-renewal script created at ./scripts/renew-ssl.sh"
        echo "💡 Add to crontab: 0 2 * * * /path/to/scripts/renew-ssl.sh"
        ;;
        
    "custom")
        echo "🔧 Setting up custom SSL certificates..."
        
        if [[ ! -f "./ssl/$DOMAIN.crt" ]] || [[ ! -f "./ssl/$DOMAIN.key" ]]; then
            echo "📝 Creating self-signed certificate for development/testing..."
            
            # Generate private key
            openssl genrsa -out "./ssl/$DOMAIN.key" 2048
            
            # Generate certificate signing request
            openssl req -new -key "./ssl/$DOMAIN.key" -out "./ssl/$DOMAIN.csr" -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
            
            # Generate self-signed certificate
            openssl x509 -req -in "./ssl/$DOMAIN.csr" -signkey "./ssl/$DOMAIN.key" -out "./ssl/$DOMAIN.crt" -days 365 -extensions v3_req -extfile <(cat << EOF
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = localhost
EOF
)
            
            # Clean up CSR
            rm "./ssl/$DOMAIN.csr"
            
            echo "⚠️  Self-signed certificate created for development"
            echo "⚠️  For production, replace with certificates from a trusted CA"
        else
            echo "✅ Custom certificates found"
        fi
        ;;
        
    *)
        echo "❌ Invalid certificate method. Use 'letsencrypt' or 'custom'"
        exit 1
        ;;
esac

# Set proper permissions
chmod 600 ./ssl/*.key 2>/dev/null || true
chmod 644 ./ssl/*.crt 2>/dev/null || true

# Update docker-compose to use SSL configuration
if [[ ! -f "./docker-compose.ssl.yml" ]]; then
    cat > ./docker-compose.ssl.yml << EOF
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl-production.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
      - frontend
    networks:
      - comiccomp-network
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  nginx_logs:
    driver: local

networks:
  comiccomp-network:
    driver: bridge
EOF
    echo "📋 SSL Docker Compose configuration created"
fi

# Verify SSL setup
echo "🔍 Verifying SSL configuration..."
if [[ -f "./ssl/$DOMAIN.crt" ]] && [[ -f "./ssl/$DOMAIN.key" ]]; then
    echo "✅ SSL certificates are properly configured"
    
    # Test certificate validity
    if openssl x509 -in "./ssl/$DOMAIN.crt" -text -noout > /dev/null 2>&1; then
        echo "✅ Certificate is valid"
        
        # Show certificate details
        echo "📋 Certificate Information:"
        openssl x509 -in "./ssl/$DOMAIN.crt" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)"
    else
        echo "❌ Certificate appears to be invalid"
        exit 1
    fi
else
    echo "❌ SSL certificates not found"
    exit 1
fi

echo ""
echo "🎉 SSL setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your DNS to point $DOMAIN to your server IP"
echo "2. Deploy with SSL: docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d"
echo "3. Test HTTPS: curl -I https://$DOMAIN"
echo ""

if [[ "$CERT_METHOD" == "letsencrypt" ]]; then
    echo "⏰ Don't forget to set up automatic renewal:"
    echo "   crontab -e"
    echo "   Add: 0 2 * * * $(pwd)/scripts/renew-ssl.sh"
fi