'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { FeedLoadingView } from './components/FeedLoadingView';

const minimumLoadingDurationMs = 500;

export default function FeedTemplate({ children }: { children: ReactNode }) {
  const [isMinimumLoading, setIsMinimumLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMinimumLoading(false);
    }, minimumLoadingDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (isMinimumLoading) {
    return <FeedLoadingView />;
  }

  return children;
}
