/**
 * Release channel and feature flag utilities
 */

export type ReleaseChannel = 'production' | 'alpha' | 'beta' | 'development';

/**
 * Get the current release channel from environment
 */
export function getReleaseChannel(): ReleaseChannel {
  const channel = process.env.NEXT_PUBLIC_RELEASE_CHANNEL as ReleaseChannel;
  return channel || 'production';
}

/**
 * Check if current environment is alpha release
 */
export const isAlpha = getReleaseChannel() === 'alpha';

/**
 * Check if current environment is beta release
 */
export const isBeta = getReleaseChannel() === 'beta';

/**
 * Check if current environment is development
 */
export const isDevelopment = getReleaseChannel() === 'development';

/**
 * Check if current environment is production
 */
export const isProduction = getReleaseChannel() === 'production';

/**
 * Check if feature should be available in current release channel
 */
export function isFeatureEnabled(feature: {
  alpha?: boolean;
  beta?: boolean;
  production?: boolean;
}): boolean {
  const channel = getReleaseChannel();
  
  switch (channel) {
    case 'alpha':
      return feature.alpha ?? false;
    case 'beta':
      return feature.beta ?? false;
    case 'production':
      return feature.production ?? false;
    case 'development':
      return true; // All features enabled in development
    default:
      return false;
  }
}

/**
 * Get allowlist emails for alpha access
 */
export function getAlphaAllowlist(): string[] {
  const allowlist = process.env.ALPHA_ALLOWLIST || '';
  return allowlist.split(',').map(email => email.trim()).filter(Boolean);
}

/**
 * Check if email is in alpha allowlist
 */
export function isEmailInAlphaAllowlist(email: string): boolean {
  if (!isAlpha) return true; // Non-alpha releases don't need allowlist
  
  const allowlist = getAlphaAllowlist();
  return allowlist.includes(email.toLowerCase());
}

/**
 * Get alpha invite code if configured
 */
export function getAlphaInviteCode(): string | null {
  return process.env.ALPHA_INVITE_CODE || null;
}

/**
 * Validate alpha invite code
 */
export function validateAlphaInviteCode(code: string): boolean {
  const validCode = getAlphaInviteCode();
  return validCode ? code === validCode : true; // No code required if not set
}
