'use client';

import { useAppStore } from '@/store/useAppStore';
import { CycleDuration, PriceScale } from '@/types';

const CYCLE_OPTIONS: { value: CycleDuration; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: '1 day = 360°' },
  { value: 'weekly', label: 'Weekly', description: '1 week = 360°' },
  { value: 'monthly', label: 'Monthly', description: '1 month = 360°' },
  { value: 'quarterly', label: 'Quarterly', description: '1 quarter = 360°' },
  { value: 'annual', label: 'Annual', description: '1 year = 360°' },
  { value: 'custom', label: 'Custom', description: 'Set your own period' },
];

export function CycleConfig() {
  const { config, setCycleDuration, setCustomDays, setPriceScale, setDateRange } = useAppStore();

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

  return (
    <div className="space-y-6">
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
