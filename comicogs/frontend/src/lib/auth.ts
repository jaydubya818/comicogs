import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
// import { PrismaAdapter } from '@next-auth/prisma-adapter';
// import { PrismaClient } from '@prisma/client';
import { isAlpha, isEmailInAlphaAllowlist } from './release';

// const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Disabled for alpha - using JWT only
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // In alpha, only allow users in the allowlist
      if (isAlpha && user.email) {
        const isAllowed = isEmailInAlphaAllowlist(user.email);
        
        if (!isAllowed) {
          console.log(`🚫 Alpha access denied for: ${user.email}`);
          return '/access-denied';
        }
        
        console.log(`✅ Alpha access granted for: ${user.email}`);
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Add user info to token
      if (user) {
        token.role = (user.role as any) || 'user';
        token.id = user.id;
      }
      
      return token;
    },

    async session({ session, token }) {
      // Add user info to session
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle alpha-specific redirects
      if (isAlpha) {
        // Check if user needs to verify invite code
        if (url.includes('/login') && !url.includes('invited=true')) {
          const inviteCode = process.env.ALPHA_INVITE_CODE;
          if (inviteCode) {
            return `${baseUrl}/invite?callbackUrl=${encodeURIComponent(url)}`;
          }
        }
      }

      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (isAlpha) {
        console.log(`🔐 Alpha sign-in: ${user.email} (new: ${isNewUser})`);
      }
    },
    
    async signOut({ token }) {
      if (isAlpha) {
        console.log(`🔓 Alpha sign-out: ${token?.email}`);
      }
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: isAlpha ? 24 * 60 * 60 : 30 * 24 * 60 * 60, // 1 day for alpha, 30 days for prod
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: isAlpha, // Enable debug logging in alpha
};
