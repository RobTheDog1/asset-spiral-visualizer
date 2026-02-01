import { create } from 'zustand';
import { Asset, PricePoint, SpiralConfig, CycleDuration, PriceScale } from '@/types';

interface AppState {
  // Selected asset
  asset: Asset | null;
  setAsset: (asset: Asset | null) => void;

  // Spiral configuration
  config: SpiralConfig;
  setConfig: (config: Partial<SpiralConfig>) => void;
  setCycleDuration: (duration: CycleDuration) => void;
  setCustomDays: (days: number) => void;
  setPriceScale: (scale: PriceScale) => void;
  setDateRange: (startDate: Date, endDate: Date) => void;

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

// Default configuration
const defaultConfig: SpiralConfig = {
  cycleDuration: 'annual',
  customDays: 365,
  priceScale: 'logarithmic',
  startDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
  endDate: new Date(),
};

export const useAppStore = create<AppState>((set) => ({
  // Asset
  asset: null,
  setAsset: (asset) => set({ asset }),

  // Config
  config: defaultConfig,
  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),
  setCycleDuration: (duration) =>
    set((state) => ({
      config: { ...state.config, cycleDuration: duration },
    })),
  setCustomDays: (days) =>
    set((state) => ({
      config: { ...state.config, customDays: days },
    })),
  setPriceScale: (scale) =>
    set((state) => ({
      config: { ...state.config, priceScale: scale },
    })),
  setDateRange: (startDate, endDate) =>
    set((state) => ({
      config: { ...state.config, startDate, endDate },
    })),

  // Price data
  priceData: [],
  setPriceData: (data) => set({ priceData: data }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Error
  error: null,
  setError: (error) => set({ error }),
}));
