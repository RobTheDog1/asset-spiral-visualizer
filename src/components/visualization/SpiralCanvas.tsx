'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { Scene } from './Scene';
import { PriceSpiral } from './PriceSpiral';
import { PriceLevelRings } from './PriceLevelRings';
import { useAppStore } from '@/store/useAppStore';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#404040" />
    </mesh>
  );
}

function checkWebGLSupport(): { supported: boolean; message: string } {
  if (typeof window === 'undefined') {
    return { supported: false, message: 'Server-side rendering' };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      return { supported: true, message: 'WebGL supported' };
    }
  } catch (e) {
    // Fall through to error
  }

  return {
    supported: false,
    message: 'WebGL is not available. Please enable hardware acceleration in your browser settings.',
  };
}

function WebGLFallback({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-gray-400 p-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-white mb-2">WebGL Not Available</h2>
      <p className="text-center mb-6 max-w-md">{message}</p>
      <div className="bg-gray-800 rounded-lg p-4 text-sm max-w-lg">
        <p className="font-semibold text-white mb-2">To enable WebGL:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Chrome:</strong> Go to chrome://settings → System → Enable "Use hardware acceleration"</li>
          <li><strong>Firefox:</strong> Go to about:config → Set webgl.disabled to false</li>
          <li><strong>Edge:</strong> Go to edge://settings → System → Enable "Use hardware acceleration"</li>
        </ul>
        <p className="mt-3 text-gray-500">After changing settings, restart your browser.</p>
      </div>
    </div>
  );
}

export function SpiralCanvas() {
  const { priceData, config } = useAppStore();
  const [webglStatus, setWebglStatus] = useState<{ supported: boolean; message: string } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    setWebglStatus(checkWebGLSupport());
  }, []);

  // Still checking
  if (webglStatus === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Checking WebGL support...</div>
      </div>
    );
  }

  // WebGL not supported
  if (!webglStatus.supported || renderError) {
    return <WebGLFallback message={renderError || webglStatus.message} />;
  }

  return (
    <div className="w-full h-full min-h-[400px] bg-gray-950" style={{ height: '100%' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          // Successfully created WebGL context
          console.log('WebGL context created successfully');
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setRenderError('Failed to initialize 3D rendering. ' + String(error));
        }}
      >
        <PerspectiveCamera makeDefault position={[15, 8, 15]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          target={[0, 5, 0]}
        />
        <Suspense fallback={<LoadingFallback />}>
          <Scene />
          {priceData.length > 0 && (
            <>
              <PriceSpiral priceData={priceData} config={config} />
              <PriceLevelRings priceData={priceData} config={config} />
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
