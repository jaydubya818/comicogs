#!/bin/bash

# Comicogs Platform Smoke Test Suite
# Comprehensive end-to-end smoke tests for critical user journeys

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-test@comicogs.local}"
TEST_PASSWORD="${TEST_PASSWORD:-testpass123}"
TIMEOUT=30
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test runner function
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Running: $test_name"
    
    if $test_function; then
        log_success "$test_name"
        return 0
    else
        log_failure "$test_name"
        return 1
    fi
}

# HTTP request helper
http_get() {
    local url="$1"
    local expected_status="${2:-200}"
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/response.body "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        log_warning "Expected $expected_status, got $response for $url"
        return 1
    fi
}

# Test: Homepage loads
test_homepage() {
    http_get "$BASE_URL" 200
}

# Test: API health check
test_api_health() {
    http_get "$BASE_URL/api/health" 200
}

# Test: Authentication pages
test_auth_pages() {
    http_get "$BASE_URL/auth/signin" 200 &&
    http_get "$BASE_URL/auth/signup" 200
}

# Test: Main navigation pages
test_navigation_pages() {
    local pages=(
        "/search"
        "/marketplace" 
        "/collection"
        "/ai"
        "/analytics"
        "/community"
    )
    
    for page in "${pages[@]}"; do
        if ! http_get "$BASE_URL$page" 200; then
            return 1
        fi
    done
    
    return 0
}

# Test: AI dashboard
test_ai_dashboard() {
    http_get "$BASE_URL/ai" 200 &&
    http_get "$BASE_URL/ai/grading" 200 &&
    http_get "$BASE_URL/ai/recognition" 200
}

# Test: Search functionality
test_search_functionality() {
    # Test basic search page
    http_get "$BASE_URL/search" 200 &&
    
    # Test search API endpoints
    http_get "$BASE_URL/api/search?q=batman" 200 &&
    http_get "$BASE_URL/api/comics?limit=10" 200
}

# Test: Marketplace features
test_marketplace() {
    http_get "$BASE_URL/marketplace" 200 &&
    http_get "$BASE_URL/marketplace/browse" 200 &&
    http_get "$BASE_URL/api/marketplace/listings" 200
}

# Test: Real-time features
test_realtime_features() {
    # Test WebSocket status endpoint
    http_get "$BASE_URL/api/websocket/status" 200 &&
    
    # Test live price updates
    http_get "$BASE_URL/api/prices/live" 200 &&
    
    # Test notifications endpoint
    http_get "$BASE_URL/api/notifications" 200
}

# Test: Analytics endpoints
test_analytics() {
    http_get "$BASE_URL/analytics" 200 &&
    http_get "$BASE_URL/api/analytics/market-trends" 200 &&
    http_get "$BASE_URL/api/analytics/performance" 200
}

# Test: Database connectivity
test_database() {
    # Test database-dependent endpoints
    http_get "$BASE_URL/api/comics" 200 &&
    http_get "$BASE_URL/api/users/profile" 401  # Should require auth
}

# Test: Static assets
test_static_assets() {
    # Test favicon
    http_get "$BASE_URL/favicon.ico" 200 &&
    
    # Test manifest
    http_get "$BASE_URL/manifest.json" 200 &&
    
    # Test if Next.js static files are being served
    if [ -d "$PWD/comicogs-nextjs/.next/static" ]; then
        log_info "Static assets directory exists"
        return 0
    else
        return 1
    fi
}

# Test: API rate limiting
test_rate_limiting() {
    log_info "Testing rate limiting (making 10 rapid requests)..."
    
    local success_count=0
    local rate_limited_count=0
    
    for i in {1..10}; do
        local status=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/comics" 2>/dev/null || echo "000")
        
        if [ "$status" = "200" ]; then
            success_count=$((success_count + 1))
        elif [ "$status" = "429" ]; then
            rate_limited_count=$((rate_limited_count + 1))
        fi
    done
    
    log_info "Successful requests: $success_count, Rate limited: $rate_limited_count"
    
    # At least some requests should succeed
    [ $success_count -gt 0 ]
}

# Test: Error handling
test_error_handling() {
    # Test 404 page
    http_get "$BASE_URL/non-existent-page" 404 &&
    
    # Test API 404
    http_get "$BASE_URL/api/non-existent-endpoint" 404 &&
    
    # Test invalid API requests
    http_get "$BASE_URL/api/comics/invalid-id" 404
}

# Test: Security headers
test_security_headers() {
    local headers=$(curl -s -I "$BASE_URL" 2>/dev/null || echo "")
    
    # Check for basic security headers
    if echo "$headers" | grep -qi "x-frame-options\|x-content-type-options\|x-xss-protection"; then
        return 0
    else
        log_warning "Security headers not detected"
        return 1
    fi
}

# Test: Mobile responsiveness
test_mobile_responsiveness() {
    # Test with mobile user agent
    local mobile_response=$(curl -s -w "%{http_code}" \
        -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15" \
        -o /dev/null "$BASE_URL" 2>/dev/null || echo "000")
    
    [ "$mobile_response" = "200" ]
}

# Test: Performance metrics
test_performance() {
    log_info "Testing basic performance metrics..."
    
    # Measure homepage load time
    local start_time=$(date +%s%3N)
    if curl -s -f "$BASE_URL" >/dev/null 2>&1; then
        local end_time=$(date +%s%3N)
        local load_time=$((end_time - start_time))
        
        log_info "Homepage load time: ${load_time}ms"
        
        # Should load within 5 seconds (5000ms)
        [ $load_time -lt 5000 ]
    else
        return 1
    fi
}

# Test: Enterprise features
test_enterprise_features() {
    http_get "$BASE_URL/enterprise" 200 &&
    http_get "$BASE_URL/api/enterprise/features" 200
}

# Test: NFT marketplace
test_nft_marketplace() {
    http_get "$BASE_URL/nft" 200 &&
    http_get "$BASE_URL/api/nft/marketplace" 200
}

# Test: International features
test_international() {
    http_get "$BASE_URL/api/i18n/languages" 200 &&
    http_get "$BASE_URL/api/i18n/currencies" 200
}

# Test: Design system
test_design_system() {
    http_get "$BASE_URL/design-audit" 200
}

# Enhanced test with Playwright (if available)
test_e2e_with_playwright() {
    if command -v npx >/dev/null 2>&1 && [ -f "package.json" ]; then
        cd "$PWD/comicogs-nextjs" 2>/dev/null || return 1
        
        if grep -q "playwright" package.json; then
            log_info "Running Playwright smoke test..."
            if npx playwright test --grep "smoke" --reporter=list >/dev/null 2>&1; then
                return 0
            else
                log_warning "Playwright smoke tests failed or not configured"
                return 1
            fi
        else
            log_info "Playwright not configured, skipping E2E tests"
            return 0
        fi
    else
        return 0
    fi
}

# Main test suite
run_smoke_tests() {
    log_info "🚀 Starting Comicogs Platform Smoke Tests"
    log_info "Target URL: $BASE_URL"
    
    echo ""
    log_info "=== Core Functionality Tests ==="
    run_test "Homepage Load" test_homepage
    run_test "API Health Check" test_api_health
    run_test "Authentication Pages" test_auth_pages
    run_test "Navigation Pages" test_navigation_pages
    run_test "Database Connectivity" test_database
    
    echo ""
    log_info "=== Feature-Specific Tests ==="
    run_test "Search Functionality" test_search_functionality
    run_test "Marketplace Features" test_marketplace
    run_test "AI Dashboard" test_ai_dashboard
    run_test "Real-time Features" test_realtime_features
    run_test "Analytics Features" test_analytics
    run_test "Enterprise Features" test_enterprise_features
    run_test "NFT Marketplace" test_nft_marketplace
    run_test "International Features" test_international
    run_test "Design System" test_design_system
    
    echo ""
    log_info "=== Technical Tests ==="
    run_test "Static Assets" test_static_assets
    run_test "Error Handling" test_error_handling
    run_test "Security Headers" test_security_headers
    run_test "Mobile Responsiveness" test_mobile_responsiveness
    run_test "Performance Metrics" test_performance
    run_test "Rate Limiting" test_rate_limiting
    
    echo ""
    log_info "=== End-to-End Tests ==="
    run_test "Playwright E2E" test_e2e_with_playwright
}

# Generate test report
generate_report() {
    echo ""
    log_info "📊 Smoke Test Report"
    echo "===================="
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo "Success Rate: $success_rate%"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        log_success "🎉 All smoke tests passed! Platform is ready."
        return 0
    else
        echo ""
        log_failure "💥 $FAILED_TESTS test(s) failed. Please investigate."
        return 1
    fi
}

# Usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -u, --url URL       Set base URL (default: $BASE_URL)"
    echo "  -t, --timeout SEC   Set timeout in seconds (default: $TIMEOUT)"
    echo "  --quick             Run only critical tests"
    echo ""
    echo "Environment variables:"
    echo "  BASE_URL           Base URL for testing (default: http://localhost:3000)"
    echo "  TEST_EMAIL         Test user email (default: test@comicogs.local)"
    echo "  TEST_PASSWORD      Test user password (default: testpass123)"
}

# Parse command line arguments
QUICK_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --quick)
            QUICK_MODE=true
            shift
            ;;
        *)
            log_failure "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    # Wait a moment for services to be fully ready
    sleep 2
    
    if [ "$QUICK_MODE" = true ]; then
        log_info "🏃 Running quick smoke tests..."
        run_test "Homepage Load" test_homepage
        run_test "API Health Check" test_api_health
        run_test "Search Functionality" test_search_functionality
        run_test "Database Connectivity" test_database
    else
        run_smoke_tests
    fi
    
    generate_report
}

# Run main function
main "$@"
