#!/bin/bash
# setup-alpha-vercel.sh - Configure Vercel Alpha Environment

set -e

echo "🚀 Setting up Comicogs Alpha on Vercel..."

# Core Alpha Configuration
vercel env add NEXT_PUBLIC_RELEASE_CHANNEL --value="alpha" --environment="production"
vercel env add ALPHA_ALLOWLIST --value="alpha@comicogs.com,demo@comicogs.com,collector@comicogs.com" --environment="production"
vercel env add ALPHA_INVITE_CODE --value="comicogs-alpha-2024" --environment="production"

# Authentication
echo "⚠️  NEXTAUTH_SECRET needs to be generated..."
echo "   Run: openssl rand -base64 32"
echo "   Then add it manually: vercel env add NEXTAUTH_SECRET --value=\"<generated-secret>\" --environment=\"production\""

vercel env add NEXTAUTH_URL --value="https://frontend-jaydubya818.vercel.app" --environment="production"

# Optional: Database (uncomment when ready)
# echo "⚠️  DATABASE_URL needs to be set for alpha database"
# echo "   Add it manually: vercel env add DATABASE_URL --value=\"<alpha-db-url>\" --environment=\"production\""

# Optional: Feedback & Analytics
echo "⚠️  Optional integrations (add if you have them):"
echo "   vercel env add FEEDBACK_WEBHOOK_URL --value=\"<slack-webhook-url>\" --environment=\"production\""
echo "   vercel env add NEXT_PUBLIC_SENTRY_DSN --value=\"<sentry-dsn>\" --environment=\"production\""
echo "   vercel env add ANALYTICS_WEBHOOK_URL --value=\"<analytics-webhook-url>\" --environment=\"production\""

# OAuth Providers (Optional)
echo "⚠️  OAuth providers (add if you want social login):"
echo "   vercel env add GOOGLE_CLIENT_ID --value=\"<google-oauth-id>\" --environment=\"production\""
echo "   vercel env add GOOGLE_CLIENT_SECRET --value=\"<google-oauth-secret>\" --environment=\"production\""
echo "   vercel env add GITHUB_ID --value=\"<github-oauth-id>\" --environment=\"production\""
echo "   vercel env add GITHUB_SECRET --value=\"<github-oauth-secret>\" --environment=\"production\""

echo "✅ Core alpha environment variables set!"
echo "🚀 Ready to deploy with: vercel --prod"
