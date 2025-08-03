'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Non-blocking client-side analytics tracker
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate a simple session ID if not exists
    let sessionId = sessionStorage.getItem('fareja_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('fareja_session_id', sessionId);
    }

    // Track page view asynchronously
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'page_view',
            data: {
              page: pathname,
              sessionId: sessionId,
            }
          })
        });
      } catch (error) {
        // Silently fail to not impact user experience
        console.debug('Analytics tracking failed:', error);
      }
    };

    // Track with a small delay to not block initial page load
    const timeoutId = setTimeout(trackPageView, 1000);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Component renders nothing
  return null;
}

// Utility function to track promotion clicks from components
export function trackPromotionClick(promotionId: string, buttonType: string) {
  // Track asynchronously without blocking UI
  setTimeout(async () => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'promotion_click',
          data: {
            promotionId,
            buttonType
          }
        })
      });
    } catch (error) {
      console.debug('Promotion click tracking failed:', error);
    }
  }, 0);
}

// Utility function to track promotion views
export function trackPromotionView(promotionId: string, viewType: string) {
  setTimeout(async () => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'promotion_view',
          data: {
            promotionId,
            viewType
          }
        })
      });
    } catch (error) {
      console.debug('Promotion view tracking failed:', error);
    }
  }, 0);
}