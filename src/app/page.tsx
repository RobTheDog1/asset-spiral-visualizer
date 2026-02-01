'use client';

import dynamic from 'next/dynamic';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { DataConnector } from '@/components/DataConnector';

// Dynamic import for the 3D canvas to avoid SSR issues with Three.js
const SpiralCanvas = dynamic(
  () =>
    import('@/components/visualization/SpiralCanvas').then(
      (mod) => mod.SpiralCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading 3D visualization...</div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Data connector (invisible, just manages data flow) */}
      <DataConnector />

      {/* Control Panel (left sidebar) */}
      <ControlPanel />

      {/* 3D Visualization (main area) */}
      <div className="flex-1 h-full">
        <SpiralCanvas />
      </div>
    </div>
  );
}
