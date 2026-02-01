'use client';

import { useQuery } from '@tanstack/react-query';
import { PricePoint, DataInterval } from '@/types';

interface PriceDataResponse {
  symbol: string;
  data: {
    timestamp: string;
    price: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
  }[];
  count: number;
}

async function fetchPriceData(
  symbol: string,
  startDate?: Date,
  endDate?: Date,
  interval: DataInterval = '1d'
): Promise<PricePoint[]> {
  const params = new URLSearchParams({ symbol, interval });

  if (startDate) {
    params.set('startDate', startDate.toISOString());
  }
  if (endDate) {
    params.set('endDate', endDate.toISOString());
  }

  const response = await fetch(`/api/prices?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch price data');
  }

  const data: PriceDataResponse = await response.json();

  // Transform to PricePoint format with Date objects
  return data.data.map((item) => ({
    timestamp: new Date(item.timestamp),
    price: item.price,
    open: item.open,
    high: item.high,
    low: item.low,
    volume: item.volume,
  }));
}

export function usePriceData(
  symbol: string | null,
  startDate?: Date,
  endDate?: Date,
  interval: DataInterval = '1d'
) {
  return useQuery({
    queryKey: ['priceData', symbol, startDate?.toISOString(), endDate?.toISOString(), interval],
    queryFn: () => fetchPriceData(symbol!, startDate, endDate, interval),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
