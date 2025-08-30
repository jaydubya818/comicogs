#!/bin/bash

echo "🔐 Generating production secrets for Comicogs..."
echo ""

# Generate NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""

# Generate JWT_SECRET  
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=\"$JWT_SECRET\""

echo ""
echo "📋 Copy these values to your Vercel Dashboard:"
echo "   Dashboard → Your Project → Settings → Environment Variables"
echo ""
echo "🔗 Additional required environment variables:"
echo "NODE_ENV=\"production\""
echo "NEXTAUTH_URL=\"https://comicogs-01.vercel.app\""
echo "NEXT_PUBLIC_API_URL=\"https://comicogs-01.vercel.app/api\""
echo "CORS_ORIGIN=\"https://comicogs-01.vercel.app\""
echo ""
echo "⚠️  Don't forget to set your production DATABASE_URL!"
echo "   Recommended: Vercel Postgres, Supabase, or Railway"