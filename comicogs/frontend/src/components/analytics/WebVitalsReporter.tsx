'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/webVitals';

export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize web vitals tracking
    initWebVitals();
  }, []);

  // This component renders nothing - it just sets up tracking
  return null;
}
