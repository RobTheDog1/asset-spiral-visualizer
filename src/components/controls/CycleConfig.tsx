'use client';

import { useAppStore } from '@/store/useAppStore';
import { CycleDuration, PriceScale, ColorMode, DataInterval, INTERVAL_MAX_DAYS } from '@/types';

const CYCLE_OPTIONS: { value: CycleDuration; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: '1 day = 360°' },
  { value: 'weekly', label: 'Weekly', description: '1 week = 360°' },
  { value: 'monthly', label: 'Monthly', description: '1 month = 360°' },
  { value: 'quarterly', label: 'Quarterly', description: '1 quarter = 360°' },
  { value: 'annual', label: 'Annual', description: '1 year = 360°' },
  { value: 'custom', label: 'Custom', description: 'Set your own period' },
];

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string; description: string }[] = [
  { value: 'return', label: 'Returns', description: 'Green = gains, Red = losses' },
  { value: 'drawdown', label: 'Drawdown', description: 'Distance from all-time high' },
  { value: 'volatility', label: 'Volatility', description: 'Blue = calm, Red = volatile' },
  { value: 'cyclePosition', label: 'Seasonal', description: 'Patterns at same cycle position' },
  { value: 'price', label: 'Price', description: 'Absolute price level' },
];

const INTERVAL_OPTIONS: { value: DataInterval; label: string; maxDays: number }[] = [
  { value: '1m', label: '1 min', maxDays: 7 },
  { value: '5m', label: '5 min', maxDays: 60 },
  { value: '15m', label: '15 min', maxDays: 60 },
  { value: '30m', label: '30 min', maxDays: 60 },
  { value: '1h', label: '1 hour', maxDays: 60 },
  { value: '1d', label: '1 day', maxDays: 7300 },
];

export function CycleConfig() {
  const { config, setCycleDuration, setCustomDays, setPriceScale, setColorMode, setCycleOverlay, setDateRange, setInterval } = useAppStore();

  const handleCycleChange = (value: string) => {
    setCycleDuration(value as CycleDuration);
  };

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value, 10);
    if (!isNaN(days) && days > 0) {
      setCustomDays(days);
    }
  };

  const handleScaleChange = (scale: PriceScale) => {
    setPriceScale(scale);
  };

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      if (field === 'start') {
        setDateRange(date, config.endDate);
      } else {
        setDateRange(config.startDate, date);
      }
    }
  };

  const handleIntervalChange = (interval: DataInterval) => {
    setInterval(interval);
  };

  // Calculate current date range in days
  const currentRangeDays = Math.ceil(
    (config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get max days for current interval
  const maxDaysForInterval = INTERVAL_MAX_DAYS[config.interval];

  return (
    <div className="space-y-6">
      {/* Color Mode */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Color Mode
        </h3>
        <p className="text-xs text-gray-500">
          What the spiral colors represent
        </p>
        <div className="space-y-2">
          {COLOR_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleColorModeChange(option.value)}
              className={`w-full p-2 rounded-lg text-left transition-colors ${
                config.colorMode === option.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs opacity-70">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cycle Overlay Toggle */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Cycle Comparison
        </h3>
        <button
          onClick={() => setCycleOverlay(!config.cycleOverlay)}
          className={`w-full p-3 rounded-lg text-left transition-colors ${
            config.cycleOverlay
              ? 'bg-orange-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">Overlay Cycles</span>
            <span className={`w-12 h-6 rounded-full relative transition-colors ${
              config.cycleOverlay ? 'bg-orange-400' : 'bg-gray-600'
            }`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                config.cycleOverlay ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </span>
          </div>
          <p className="text-xs opacity-70 mt-1">
            Stack all cycles at same height to compare patterns
          </p>
        </button>
      </div>

      {/* Cycle Duration */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Cycle Duration
        </h3>
        <p className="text-xs text-gray-500">
          What period completes one 360° rotation
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CYCLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleCycleChange(option.value)}
              className={`p-2 rounded-lg text-left transition-colors ${
                config.cycleDuration === option.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs opacity-70">{option.description}</div>
            </button>
          ))}
        </div>

        {/* Custom days input */}
        {config.cycleDuration === 'custom' && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              value={config.customDays || 365}
              onChange={handleCustomDaysChange}
              min={1}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            />
            <span className="text-gray-400">days = 360°</span>
          </div>
        )}
      </div>

      {/* Data Granularity */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Data Granularity
        </h3>
        <p className="text-xs text-gray-500">
          Higher granularity = smoother spirals (but limited history)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {INTERVAL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleIntervalChange(option.value)}
              className={`p-2 rounded-lg text-center transition-colors ${
                config.interval === option.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs opacity-70">
                {option.maxDays < 100 ? `${option.maxDays}d max` : '20y+'}
              </div>
            </button>
          ))}
        </div>
        {/* Warning for intraday intervals */}
        {config.interval !== '1d' && (
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3">
            <p className="text-xs text-yellow-200">
              {config.interval === '1m' || config.interval === '2m' ? (
                <>Limited to last 7 days of data. Date range auto-adjusted.</>
              ) : (
                <>Limited to last 60 days of data. Date range auto-adjusted.</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Price Scale */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Price Scale
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleScaleChange('logarithmic')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              config.priceScale === 'logarithmic'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Logarithmic
          </button>
          <button
            onClick={() => handleScaleChange('linear')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              config.priceScale === 'linear'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Linear
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {config.priceScale === 'logarithmic'
            ? 'Best for assets with large price ranges (e.g., BTC)'
            : 'Direct price mapping, best for stable assets'}
        </p>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Date Range
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start</label>
            <input
              type="date"
              value={config.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">End</label>
            <input
              type="date"
              value={config.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
