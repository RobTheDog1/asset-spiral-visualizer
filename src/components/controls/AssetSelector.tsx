'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Asset, AssetType } from '@/types';

// Popular assets for quick selection
const POPULAR_ASSETS: Asset[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'stock' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', type: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', type: 'crypto' },
  { symbol: 'GC=F', name: 'Gold Futures', type: 'commodity' },
  { symbol: 'CL=F', name: 'Crude Oil Futures', type: 'commodity' },
];

export function AssetSelector() {
  const { asset, setAsset } = useAppStore();
  const [customSymbol, setCustomSymbol] = useState('');

  const handleSelectAsset = (selectedAsset: Asset) => {
    setAsset(selectedAsset);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymbol.trim()) {
      setAsset({
        symbol: customSymbol.trim().toUpperCase(),
        name: customSymbol.trim().toUpperCase(),
        type: 'stock' as AssetType,
      });
      setCustomSymbol('');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Asset
      </h3>

      {/* Current selection */}
      {asset && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-lg font-bold text-white">{asset.symbol}</div>
          <div className="text-sm text-gray-400">{asset.name}</div>
        </div>
      )}

      {/* Custom symbol input */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customSymbol}
          onChange={(e) => setCustomSymbol(e.target.value)}
          placeholder="Enter symbol..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Load
        </button>
      </form>

      {/* Popular assets */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider">
          Popular
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ASSETS.map((a) => (
            <button
              key={a.symbol}
              onClick={() => handleSelectAsset(a)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                asset?.symbol === a.symbol
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
