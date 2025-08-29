/**
 * Feature Flags System
 * 
 * Controls feature availability via environment variables.
 * Each flag defaults to "on" unless explicitly set to "off".
 * 
 * Usage:
 * - Set FLAG_PAYMENTS=off to disable payments
 * - Set FLAG_SEARCH=off to disable search functionality
 * - Set FLAG_EMAIL=off to disable email services
 */

export interface FeatureFlags {
  payments: boolean;
  search: boolean;
  email: boolean;
  uploads: boolean;
  exports: boolean;
  imports: boolean;
  alerts: boolean;
  wantlist: boolean;
}

/**
 * Feature flags configuration
 * Defaults to enabled unless explicitly disabled via environment
 */
export const flags: FeatureFlags = {
  payments: process.env.FLAG_PAYMENTS !== "off",
  search: process.env.FLAG_SEARCH !== "off", 
  email: process.env.FLAG_EMAIL !== "off",
  uploads: process.env.FLAG_UPLOADS !== "off",
  exports: process.env.FLAG_EXPORTS !== "off",
  imports: process.env.FLAG_IMPORTS !== "off",
  alerts: process.env.FLAG_ALERTS !== "off",
  wantlist: process.env.FLAG_WANTLIST !== "off",
};

/**
 * Utility to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return flags[feature];
}

/**
 * Get all flag states for monitoring/debugging
 */
export function getAllFlags(): FeatureFlags {
  return { ...flags };
}

/**
 * Log current flag states on startup
 */
export function logFlagStates(logger: any): void {
  const flagStates = Object.entries(flags)
    .map(([key, value]) => `${key}: ${value ? 'ON' : 'OFF'}`)
    .join(', ');
    
  logger.info({ flags }, `🚦 Feature flags: ${flagStates}`);
}
