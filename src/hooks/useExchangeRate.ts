'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/utils';

const FALLBACK_RATE = 3.65;
const STALE_MS = 30 * 60 * 1000; // 30 minutes

let cachedRate: number | null = null;
let cachedAt = 0;

export function useExchangeRate() {
  const [rate, setRate] = useState<number>(cachedRate ?? FALLBACK_RATE);
  const [isLoading, setIsLoading] = useState(!cachedRate);

  const fetchRate = useCallback(async () => {
    const now = Date.now();
    if (cachedRate && now - cachedAt < STALE_MS) {
      setRate(cachedRate);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/exchange-rate');
      if (res.ok) {
        const data = await res.json();
        cachedRate = data.rate;
        cachedAt = Date.now();
        setRate(data.rate);
      }
    } catch {
      // keep current rate on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return { rate, isLoading };
}
