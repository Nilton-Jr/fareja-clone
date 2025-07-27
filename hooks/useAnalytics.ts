'use client';

import { useEffect } from 'react';

// Generate or get session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('fareja_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('fareja_session_id', sessionId);
  }
  return sessionId;
}

// Track page view
export function usePageView(page: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'page_view',
            page,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            sessionId: getSessionId(),
          }),
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [page]);
}

// Track promotion click
export function trackPromotionClick(promotionId: string, buttonType: string = 'pegar_promocao') {
  if (typeof window === 'undefined') return;

  const track = async () => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'promotion_click',
          promotionId,
          buttonType,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });
    } catch (error) {
      console.error('Error tracking promotion click:', error);
    }
  };

  track();
}

// Track promotion view
export function trackPromotionView(promotionId: string, viewType: string = 'card') {
  if (typeof window === 'undefined') return;

  const track = async () => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'promotion_view',
          promotionId,
          viewType,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });
    } catch (error) {
      console.error('Error tracking promotion view:', error);
    }
  };

  track();
}