'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text, Line } from '@react-three/drei';
import { PricePoint, SpiralConfig } from '@/types';
import {
  calculateScaling,
  generatePriceLevelRings,
  formatPrice,
} from '@/lib/spiral/geometry';

interface PriceLevelRingsProps {
  priceData: PricePoint[];
  config: SpiralConfig;
  height?: number;
}

function CircleLine({ radius, color = '#666666' }: { radius: number; color?: string }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      dashed
      dashSize={0.2}
      gapSize={0.1}
    />
  );
}

export function PriceLevelRings({
  priceData,
  config,
  height = 0,
}: PriceLevelRingsProps) {
  const rings = useMemo(() => {
    if (priceData.length === 0) return [];

    const prices = priceData.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const { radiusScale } = calculateScaling(priceData, config, 10, 5);
    return generatePriceLevelRings(minPrice, maxPrice, config, radiusScale);
  }, [priceData, config]);

  if (rings.length === 0) return null;

  return (
    <group position={[0, height, 0]}>
      {rings.map((ring, index) => (
        <group key={index}>
          {/* Filled ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ring.radius - 0.02, ring.radius + 0.02, 64]} />
            <meshBasicMaterial
              color="#333333"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Circle outline */}
          <CircleLine radius={ring.radius} color="#555555" />

          {/* Price label */}
          <Text
            position={[ring.radius + 0.3, 0.1, 0]}
            fontSize={0.25}
            color="#888888"
            anchorX="left"
            anchorY="middle"
          >
            {formatPrice(ring.price)}
          </Text>
        </group>
      ))}
    </group>
  );
}
