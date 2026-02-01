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
  colorMode: ColorMode;
  cycleOverlay: boolean; // Stack cycles at same height for comparison
  startDate: Date;
  endDate: Date;
  interval: DataInterval;
}

export type CycleDuration = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';

export type DataInterval = '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '1h' | '1d';

export type PriceScale = 'linear' | 'logarithmic';

// Interval constraints from Yahoo Finance
export const INTERVAL_MAX_DAYS: Record<DataInterval, number> = {
  '1m': 7,
  '2m': 7,
  '5m': 60,
  '15m': 60,
  '30m': 60,
  '60m': 60,
  '1h': 60,
  '1d': 7300, // ~20 years
};

// Smart defaults: map cycle duration to recommended interval
export const CYCLE_TO_INTERVAL: Record<Exclude<CycleDuration, 'custom'>, DataInterval> = {
  daily: '5m',      // ~78 points per rotation
  weekly: '30m',    // ~65 points per rotation
  monthly: '1d',    // ~22 points per rotation
  quarterly: '1d',  // ~65 points per rotation
  annual: '1d',     // ~252 points per rotation
};

export type ColorMode = 'price' | 'return' | 'drawdown' | 'volatility' | 'cyclePosition';

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
