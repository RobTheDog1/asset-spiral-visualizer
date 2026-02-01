'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { PricePoint, SpiralConfig } from '@/types';
import {
  priceSeriesToSpiral,
  calculateScaling,
  getCycleDays,
  getColorForPoint,
  preCalculateColorData,
} from '@/lib/spiral/geometry';

interface PriceSpiralProps {
  priceData: PricePoint[];
  config: SpiralConfig;
  lineWidth?: number;
}

export function PriceSpiral({
  priceData,
  config,
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

  // For cycle overlay mode, adjust Y positions to stack cycles
  const adjustedSpiralPoints = useMemo(() => {
    if (!config.cycleOverlay || spiralPoints.length === 0) {
      return spiralPoints;
    }

    const cycleDays = getCycleDays(config.cycleDuration, config.customDays);
    const msPerDay = 1000 * 60 * 60 * 24;
    const baseDate = priceData[0].timestamp;
    const cycleHeight = 2; // Fixed height per cycle in overlay mode

    return spiralPoints.map((point, i) => {
      const daysElapsed = (priceData[i].timestamp.getTime() - baseDate.getTime()) / msPerDay;
      const cycleProgress = (daysElapsed % cycleDays) / cycleDays;
      const cycleNumber = Math.floor(daysElapsed / cycleDays);

      return {
        ...point,
        // In overlay mode, Y is just position within cycle, offset by cycle number for visibility
        y: cycleProgress * cycleHeight + cycleNumber * 0.1, // Small offset so cycles don't perfectly overlap
      };
    });
  }, [spiralPoints, config, priceData]);

  // Create line points for the spiral
  const linePoints = useMemo(() => {
    if (adjustedSpiralPoints.length === 0) return [];
    return adjustedSpiralPoints.map((point): [number, number, number] => [point.x, point.y, point.z]);
  }, [adjustedSpiralPoints]);

  // Pre-calculate color data for performance
  const colorData = useMemo(() => {
    if (priceData.length === 0) return null;
    return preCalculateColorData(priceData, config);
  }, [priceData, config]);

  // Create vertex colors based on selected color mode
  const vertexColors = useMemo(() => {
    if (priceData.length === 0 || !colorData) return [];

    return priceData.map((_, index) =>
      getColorForPoint(index, priceData, config.colorMode, config, colorData)
    );
  }, [priceData, config, colorData]);

  if (adjustedSpiralPoints.length === 0) {
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

      {/* Point markers for better visibility (every 20th point) */}
      {adjustedSpiralPoints.filter((_, i) => i % 20 === 0).map((point, index) => {
        const originalIndex = index * 20;
        const color = vertexColors[originalIndex] || new THREE.Color('#ff6600');
        return (
          <mesh key={index} position={[point.x, point.y, point.z]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}

      {/* Start point (green) */}
      <mesh position={[adjustedSpiralPoints[0].x, adjustedSpiralPoints[0].y, adjustedSpiralPoints[0].z]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00aa00" emissiveIntensity={0.5} />
      </mesh>

      {/* End point (current price marker) */}
      <mesh
        position={[
          adjustedSpiralPoints[adjustedSpiralPoints.length - 1].x,
          adjustedSpiralPoints[adjustedSpiralPoints.length - 1].y,
          adjustedSpiralPoints[adjustedSpiralPoints.length - 1].z,
        ]}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>

      {/* Cycle markers in overlay mode */}
      {config.cycleOverlay && priceData.length > 0 && (
        <CycleMarkers priceData={priceData} config={config} />
      )}
    </group>
  );
}

// Component to show cycle start markers in overlay mode
function CycleMarkers({ priceData, config }: { priceData: PricePoint[]; config: SpiralConfig }) {
  const markers = useMemo(() => {
    const cycleDays = getCycleDays(config.cycleDuration, config.customDays);
    const msPerDay = 1000 * 60 * 60 * 24;
    const baseDate = priceData[0].timestamp;

    const cycleStarts: { cycleNum: number; date: Date }[] = [];
    let lastCycle = -1;

    priceData.forEach((point) => {
      const daysElapsed = (point.timestamp.getTime() - baseDate.getTime()) / msPerDay;
      const cycleNum = Math.floor(daysElapsed / cycleDays);

      if (cycleNum !== lastCycle) {
        cycleStarts.push({ cycleNum, date: point.timestamp });
        lastCycle = cycleNum;
      }
    });

    return cycleStarts;
  }, [priceData, config]);

  return (
    <>
      {markers.map((marker, i) => (
        <group key={i} position={[0, marker.cycleNum * 0.1, 0]}>
          {/* Cycle label would go here */}
        </group>
      ))}
    </>
  );
}
