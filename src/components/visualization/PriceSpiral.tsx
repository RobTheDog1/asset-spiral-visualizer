'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { PricePoint, SpiralConfig } from '@/types';
import {
  priceSeriesToSpiral,
  calculateScaling,
} from '@/lib/spiral/geometry';

interface PriceSpiralProps {
  priceData: PricePoint[];
  config: SpiralConfig;
  color?: string;
  lineWidth?: number;
}

export function PriceSpiral({
  priceData,
  config,
  color = '#ff6600',
  lineWidth = 2,
}: PriceSpiralProps) {
  // Calculate spiral points from price data
  const { spiralPoints, scaling } = useMemo(() => {
    if (priceData.length === 0) {
      return { spiralPoints: [], scaling: { verticalScale: 0.01, radiusScale: 1 } };
    }

    const scaling = calculateScaling(priceData, config, 10, 5);
    const points = priceSeriesToSpiral(priceData, config, {
      verticalScale: scaling.verticalScale,
      radiusScale: scaling.radiusScale,
      minRadius: 0.3,
    });

    return { spiralPoints: points, scaling };
  }, [priceData, config]);

  // Create line points for the spiral
  const linePoints = useMemo(() => {
    if (spiralPoints.length === 0) return [];
    return spiralPoints.map((point): [number, number, number] => [point.x, point.y, point.z]);
  }, [spiralPoints]);

  // Create vertex colors based on price
  const vertexColors = useMemo(() => {
    if (spiralPoints.length === 0) return [];

    const prices = spiralPoints.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const baseColor = new THREE.Color(color);
    const highlightColor = new THREE.Color('#ffcc00');

    return spiralPoints.map((point) => {
      const normalizedPrice = (point.price - minPrice) / priceRange;
      const pointColor = baseColor.clone().lerp(highlightColor, normalizedPrice);
      return pointColor;
    });
  }, [spiralPoints, color]);

  if (spiralPoints.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Main spiral line */}
      <Line
        points={linePoints}
        vertexColors={vertexColors}
        lineWidth={lineWidth}
      />

      {/* Point markers for better visibility */}
      {spiralPoints.length > 0 && spiralPoints.filter((_, i) => i % 20 === 0).map((point, index) => (
        <mesh key={index} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}

      {/* Start point (green) */}
      <mesh position={[spiralPoints[0].x, spiralPoints[0].y, spiralPoints[0].z]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00aa00" emissiveIntensity={0.5} />
      </mesh>

      {/* End point (red/current) */}
      <mesh
        position={[
          spiralPoints[spiralPoints.length - 1].x,
          spiralPoints[spiralPoints.length - 1].y,
          spiralPoints[spiralPoints.length - 1].z,
        ]}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff4444" emissive="#aa0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
