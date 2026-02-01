'use client';

import { AssetSelector } from './AssetSelector';
import { CycleConfig } from './CycleConfig';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/lib/spiral/geometry';

export function ControlPanel() {
  const { priceData, asset, isLoading, error } = useAppStore();

  // Calculate some stats for display
  const stats = priceData.length > 0 ? {
    count: priceData.length,
    startPrice: priceData[0].price,
    endPrice: priceData[priceData.length - 1].price,
    minPrice: Math.min(...priceData.map(p => p.price)),
    maxPrice: Math.max(...priceData.map(p => p.price)),
    change: ((priceData[priceData.length - 1].price - priceData[0].price) / priceData[0].price) * 100,
  } : null;

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Asset Spiral</h1>
          <p className="text-sm text-gray-400">3D Price Visualization</p>
        </div>

        {/* Asset Selector */}
        <AssetSelector />

        {/* Loading/Error states */}
        {isLoading && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-blue-300 text-sm">
            Loading price data...
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && asset && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              {asset.symbol} Stats
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-500">Data Points</div>
                <div className="text-white font-medium">{stats.count.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Change</div>
                <div className={`font-medium ${stats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500">Start</div>
                <div className="text-white font-medium">{formatPrice(stats.startPrice)}</div>
              </div>
              <div>
                <div className="text-gray-500">End</div>
                <div className="text-white font-medium">{formatPrice(stats.endPrice)}</div>
              </div>
              <div>
                <div className="text-gray-500">Min</div>
                <div className="text-white font-medium">{formatPrice(stats.minPrice)}</div>
              </div>
              <div>
                <div className="text-gray-500">Max</div>
                <div className="text-white font-medium">{formatPrice(stats.maxPrice)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-800" />

        {/* Cycle Configuration */}
        <CycleConfig />

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Controls:</strong></p>
          <p>• Left-click + drag to rotate</p>
          <p>• Right-click + drag to pan</p>
          <p>• Scroll to zoom</p>
        </div>
      </div>
    </div>
  );
}
