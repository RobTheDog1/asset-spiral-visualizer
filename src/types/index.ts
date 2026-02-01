// Core data types for the Asset Price Spiral Visualizer

export interface PricePoint {
  timestamp: Date;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface SpiralConfig {
  cycleDuration: CycleDuration;
  customDays?: number;
  priceScale: PriceScale;
  startDate: Date;
  endDate: Date;
}

export type CycleDuration = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';

export type PriceScale = 'linear' | 'logarithmic';

export type AssetType = 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond';

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
}

export interface SpiralPoint {
  x: number;
  y: number;
  z: number;
  price: number;
  timestamp: Date;
}

export interface AppState {
  // Selected asset
  asset: Asset | null;
  setAsset: (asset: Asset | null) => void;

  // Spiral configuration
  config: SpiralConfig;
  setConfig: (config: Partial<SpiralConfig>) => void;

  // Price data
  priceData: PricePoint[];
  setPriceData: (data: PricePoint[]) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

// API response types
export interface HistoricalQuote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

// Cycle duration in days
export const CYCLE_DAYS: Record<Exclude<CycleDuration, 'custom'>, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  annual: 365,
};
