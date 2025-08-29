/**
 * Test Authentication Utilities
 * 
 * Provides test-only authentication helpers for E2E testing.
 * These should NEVER be available in production.
 */

import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export interface TestUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
}

/**
 * Create a test session cookie for a given email
 * Looks up the user and creates a signed JWT token
 */
export async function createTestSessionCookie(email: string): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test authentication not available in production');
  }

  try {
    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    if (!user) {
      throw new Error(`Test user not found: ${email}`);
    }

    // Create JWT token with user info
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      JWT_SECRET
    );

    console.log(`🔐 Test session created for ${email} (${user.role})`);
    return token;

  } catch (error) {
    console.error('❌ Error creating test session:', error);
    throw error;
  }
}

/**
 * Verify a test session token and return user info
 */
export async function verifyTestSession(token: string): Promise<TestUser | null> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test authentication not available in production');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch (error) {
    console.warn('⚠️  Invalid test session token:', error);
    return null;
  }
}

/**
 * Create a test user if it doesn't exist
 */
export async function ensureTestUser(email: string, role: 'user' | 'admin' = 'user'): Promise<TestUser> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test user creation not available in production');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });

  if (existing) {
    return existing;
  }

  // Create new test user
  const user = await prisma.user.create({
    data: {
      email,
      name: `Test User (${email})`,
      role,
      profileScore: role === 'admin' ? 100 : 75,
      verified: role === 'admin',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  });

  console.log(`👤 Test user created: ${email} (${role})`);
  return user;
}
