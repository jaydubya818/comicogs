import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { isAlpha } from './release';
import { captureAlphaMetric } from './sentry';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
}

// Thresholds for Web Vitals scoring
const THRESHOLDS = {
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  TTFB: [800, 1800],
};

function getVitalRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = THRESHOLDS[name];
  if (value <= thresholds[0]) return 'good';
  if (value <= thresholds[1]) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: WebVitalMetric) {
  // Send to console in alpha for debugging
  if (isAlpha) {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      id: metric.id,
    });
  }

  // Send to Sentry for alpha users
  captureAlphaMetric({
    name: `web_vital_${metric.name.toLowerCase()}`,
    value: metric.value,
    unit: metric.name === 'CLS' ? 'score' : 'ms',
    tags: {
      rating: metric.rating,
      navigation_type: metric.navigationType,
    }
  });

  // Send to analytics endpoint (if available)
  if (typeof window !== 'undefined') {
    // Send to your analytics service
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        url: window.location.href,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      }),
    }).catch(console.error);
  }
}

export function initWebVitals() {
  // Only measure vitals in alpha or production
  if (!isAlpha && process.env.NODE_ENV !== 'production') {
    return;
  }

  // Cumulative Layout Shift
  onCLS((metric) => {
    const webVital: WebVitalMetric = {
      name: 'CLS',
      value: metric.value,
      rating: getVitalRating('CLS', metric.value),
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
    };
    sendToAnalytics(webVital);
  });

  // Interaction to Next Paint (replaces FID in web-vitals v3+)
  onINP((metric) => {
    const webVital: WebVitalMetric = {
      name: 'INP',
      value: metric.value,
      rating: getVitalRating('INP', metric.value),
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
    };
    sendToAnalytics(webVital);
  });

  // First Contentful Paint
  onFCP((metric) => {
    const webVital: WebVitalMetric = {
      name: 'FCP',
      value: metric.value,
      rating: getVitalRating('FCP', metric.value),
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
    };
    sendToAnalytics(webVital);
  });

  // Largest Contentful Paint
  onLCP((metric) => {
    const webVital: WebVitalMetric = {
      name: 'LCP',
      value: metric.value,
      rating: getVitalRating('LCP', metric.value),
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
    };
    sendToAnalytics(webVital);
  });

  // Time to First Byte
  onTTFB((metric) => {
    const webVital: WebVitalMetric = {
      name: 'TTFB',
      value: metric.value,
      rating: getVitalRating('TTFB', metric.value),
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
    };
    sendToAnalytics(webVital);
  });
}

// Helper to manually report custom performance metrics
export function reportCustomMetric(name: string, value: number, unit = 'ms') {
  if (isAlpha) {
    console.log(`📊 Custom Metric [${name}]:`, `${value}${unit}`);
    
    captureAlphaMetric({
      name: `custom_${name}`,
      value,
      unit,
      tags: {
        type: 'custom_performance',
      }
    });
  }
}
