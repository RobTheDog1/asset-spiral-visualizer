'use client';

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { PricePoint, SpiralConfig } from '@/types';
import {
  priceSeriesToSpiral,
  calculateScaling,
  getCycleDays,
  getColorForPoint,
  preCalculateColorData,
  formatPrice,
  getMarkerIndices,
} from '@/lib/spiral/geometry';

interface PriceSpiralProps {
  priceData: PricePoint[];
  config: SpiralConfig;
  lineWidth?: number;
}

interface HoveredPoint {
  position: [number, number, number];
  price: number;
  date: Date;
  index: number;
}

export function PriceSpiral({
  priceData,
  config,
  lineWidth = 2,
}: PriceSpiralProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

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

  // For cycle overlay mode, group points by cycle
  const { adjustedSpiralPoints, cycleGroups } = useMemo(() => {
    if (spiralPoints.length === 0) {
      return { adjustedSpiralPoints: spiralPoints, cycleGroups: [] };
    }

    if (!config.cycleOverlay) {
      return { adjustedSpiralPoints: spiralPoints, cycleGroups: [] };
    }

    const cycleDays = getCycleDays(config.cycleDuration, config.customDays);
    const msPerDay = 1000 * 60 * 60 * 24;
    const baseDate = priceData[0].timestamp;
    const cycleHeight = 2; // Fixed height per cycle in overlay mode

    // Group points by cycle number
    const groups: { cycleNum: number; points: typeof spiralPoints; indices: number[] }[] = [];
    let currentCycle = -1;

    const adjusted = spiralPoints.map((point, i) => {
      const daysElapsed = (priceData[i].timestamp.getTime() - baseDate.getTime()) / msPerDay;
      const cycleProgress = (daysElapsed % cycleDays) / cycleDays;
      const cycleNumber = Math.floor(daysElapsed / cycleDays);

      // Track cycle groups
      if (cycleNumber !== currentCycle) {
        groups.push({ cycleNum: cycleNumber, points: [], indices: [] });
        currentCycle = cycleNumber;
      }

      const adjustedPoint = {
        ...point,
        y: cycleProgress * cycleHeight + cycleNumber * 0.15, // Small offset so cycles don't perfectly overlap
      };

      groups[groups.length - 1].points.push(adjustedPoint);
      groups[groups.length - 1].indices.push(i);

      return adjustedPoint;
    });

    return { adjustedSpiralPoints: adjusted, cycleGroups: groups };
  }, [spiralPoints, config, priceData]);

  // Create line points - either single array or grouped by cycle
  const linePointGroups = useMemo(() => {
    if (adjustedSpiralPoints.length === 0) return [];

    if (config.cycleOverlay && cycleGroups.length > 0) {
      // Return separate arrays for each cycle
      return cycleGroups.map(group =>
        group.points.map((point): [number, number, number] => [point.x, point.y, point.z])
      );
    }

    // Single continuous line
    return [adjustedSpiralPoints.map((point): [number, number, number] => [point.x, point.y, point.z])];
  }, [adjustedSpiralPoints, config.cycleOverlay, cycleGroups]);

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

  // Group vertex colors by cycle for overlay mode
  const vertexColorGroups = useMemo(() => {
    if (!config.cycleOverlay || cycleGroups.length === 0) {
      return [vertexColors];
    }
    return cycleGroups.map(group => group.indices.map(i => vertexColors[i]));
  }, [vertexColors, config.cycleOverlay, cycleGroups]);

  if (adjustedSpiralPoints.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Main spiral line(s) - separate lines per cycle in overlay mode */}
      {linePointGroups.map((points, groupIndex) => (
        <Line
          key={groupIndex}
          points={points}
          vertexColors={vertexColorGroups[groupIndex] || []}
          lineWidth={lineWidth}
        />
      ))}

      {/* Interactive point markers at meaningful time boundaries */}
      <TimeMarkers
        priceData={priceData}
        adjustedSpiralPoints={adjustedSpiralPoints}
        vertexColors={vertexColors}
        config={config}
        hoveredPoint={hoveredPoint}
        setHoveredPoint={setHoveredPoint}
      />

      {/* Tooltip for hovered point */}
      {hoveredPoint && (
        <Html position={hoveredPoint.position} center>
          <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm shadow-xl pointer-events-none whitespace-nowrap">
            <div className="font-bold text-orange-400">{formatPrice(hoveredPoint.price)}</div>
            <div className="text-gray-400 text-xs">
              {hoveredPoint.date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </Html>
      )}

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

// Component for time-based markers (end of month, end of week, etc.)
function TimeMarkers({
  priceData,
  adjustedSpiralPoints,
  vertexColors,
  config,
  hoveredPoint,
  setHoveredPoint,
}: {
  priceData: PricePoint[];
  adjustedSpiralPoints: { x: number; y: number; z: number; price: number; timestamp: Date }[];
  vertexColors: THREE.Color[];
  config: SpiralConfig;
  hoveredPoint: HoveredPoint | null;
  setHoveredPoint: (point: HoveredPoint | null) => void;
}) {
  const markerIndices = useMemo(() => {
    return getMarkerIndices(priceData, config.cycleDuration, config.customDays);
  }, [priceData, config.cycleDuration, config.customDays]);

  return (
    <>
      {markerIndices.map((originalIndex) => {
        const point = adjustedSpiralPoints[originalIndex];
        if (!point) return null;

        const color = vertexColors[originalIndex] || new THREE.Color('#ff6600');
        const isHovered = hoveredPoint?.index === originalIndex;

        return (
          <mesh
            key={originalIndex}
            position={[point.x, point.y, point.z]}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              setHoveredPoint({
                position: [point.x, point.y, point.z],
                price: priceData[originalIndex].price,
                date: priceData[originalIndex].timestamp,
                index: originalIndex,
              });
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
              setHoveredPoint(null);
            }}
          >
            <sphereGeometry args={[isHovered ? 0.12 : 0.06, 12, 12]} />
            <meshBasicMaterial color={isHovered ? '#ffffff' : color} />
          </mesh>
        );
      })}
    </>
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
