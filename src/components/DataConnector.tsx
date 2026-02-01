'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePriceData } from '@/hooks/usePriceData';

/**
 * This component connects the data fetching to the store.
 * It watches for changes in asset selection and fetches data accordingly.
 */
export function DataConnector() {
  const { asset, config, setPriceData, setIsLoading, setError } = useAppStore();

  const { data, isLoading, error } = usePriceData(
    asset?.symbol || null,
    config.startDate,
    config.endDate,
    config.interval
  );

  // Update store when data changes
  useEffect(() => {
    if (data) {
      setPriceData(data);
      setError(null);
    }
  }, [data, setPriceData, setError]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  // Update error state
  useEffect(() => {
    if (error) {
      setError(error.message);
    }
  }, [error, setError]);

  // This component doesn't render anything
  return null;
}
