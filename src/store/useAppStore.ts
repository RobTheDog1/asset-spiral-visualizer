import { create } from 'zustand';
import { Asset, PricePoint, SpiralConfig, CycleDuration, PriceScale, ColorMode, DataInterval, CYCLE_TO_INTERVAL, INTERVAL_MAX_DAYS } from '@/types';

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
  setColorMode: (mode: ColorMode) => void;
  setCycleOverlay: (enabled: boolean) => void;
  setDateRange: (startDate: Date, endDate: Date) => void;
  setInterval: (interval: DataInterval) => void;

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
  colorMode: 'return',
  cycleOverlay: false,
  startDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
  endDate: new Date(),
  interval: '1d',
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
    set((state) => {
      // Auto-select appropriate interval for the cycle duration
      const interval = duration === 'custom'
        ? state.config.interval
        : CYCLE_TO_INTERVAL[duration];

      // Adjust date range if needed for intraday intervals
      let { startDate, endDate } = state.config;
      const maxDays = INTERVAL_MAX_DAYS[interval];
      const currentRangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (currentRangeDays > maxDays) {
        // Adjust start date to fit within interval limits
        startDate = new Date(endDate.getTime() - maxDays * 24 * 60 * 60 * 1000);
      }

      return {
        config: { ...state.config, cycleDuration: duration, interval, startDate },
      };
    }),
  setCustomDays: (days) =>
    set((state) => ({
      config: { ...state.config, customDays: days },
    })),
  setPriceScale: (scale) =>
    set((state) => ({
      config: { ...state.config, priceScale: scale },
    })),
  setColorMode: (mode) =>
    set((state) => ({
      config: { ...state.config, colorMode: mode },
    })),
  setCycleOverlay: (enabled) =>
    set((state) => ({
      config: { ...state.config, cycleOverlay: enabled },
    })),
  setDateRange: (startDate, endDate) =>
    set((state) => {
      // Validate date range against interval limits
      const maxDays = INTERVAL_MAX_DAYS[state.config.interval];
      const requestedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (requestedDays > maxDays) {
        // Adjust start date to fit within interval limits
        startDate = new Date(endDate.getTime() - maxDays * 24 * 60 * 60 * 1000);
      }

      return {
        config: { ...state.config, startDate, endDate },
      };
    }),
  setInterval: (interval) =>
    set((state) => {
      // Validate and adjust date range for the new interval
      const maxDays = INTERVAL_MAX_DAYS[interval];
      let { startDate, endDate } = state.config;
      const currentRangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (currentRangeDays > maxDays) {
        startDate = new Date(endDate.getTime() - maxDays * 24 * 60 * 60 * 1000);
      }

      return {
        config: { ...state.config, interval, startDate },
      };
    }),

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
