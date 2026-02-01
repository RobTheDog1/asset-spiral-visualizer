import { PricePoint, SpiralConfig, SpiralPoint, CycleDuration, ColorMode, CYCLE_DAYS } from '@/types';
import * as THREE from 'three';

/**
 * Get the number of days in a cycle
 */
export function getCycleDays(duration: CycleDuration, customDays?: number): number {
  if (duration === 'custom') {
    return customDays || 365;
  }
  return CYCLE_DAYS[duration];
}

/**
 * Convert a price point to 3D spiral coordinates
 *
 * Geometry:
 * - Y-axis (vertical) = Time progression
 * - Radius (distance from Y-axis) = Price
 * - Angle (rotation around Y-axis) = Position within cycle
 *
 * One full 360° rotation = one complete cycle
 */
export function pricePointToSpiral(
  point: PricePoint,
  config: SpiralConfig,
  baseDate: Date,
  options: {
    verticalScale?: number;
    radiusScale?: number;
    minRadius?: number;
  } = {}
): SpiralPoint {
  const {
    verticalScale = 0.01,  // How much vertical distance per day
    radiusScale = 1,        // Scale factor for price radius
    minRadius = 0.5,        // Minimum radius to prevent center collapse
  } = options;

  // Calculate days elapsed (determines vertical position AND angle)
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysElapsed = (point.timestamp.getTime() - baseDate.getTime()) / msPerDay;

  // Get cycle duration in days
  const cycleDays = getCycleDays(config.cycleDuration, config.customDays);

  // Calculate cycle progress (0 to N cycles)
  const cycleProgress = daysElapsed / cycleDays;

  // Angle in radians (full rotation per cycle)
  const angle = cycleProgress * 2 * Math.PI;

  // Y-axis = TIME (vertical progression)
  const y = daysElapsed * verticalScale;

  // RADIUS = PRICE (distance from center axis)
  let radius: number;
  if (config.priceScale === 'logarithmic') {
    // Log scale: better for assets with large price ranges
    // log10(100) = 2, log10(1000) = 3, log10(10000) = 4
    radius = Math.log10(Math.max(point.price, 1)) * radiusScale;
  } else {
    // Linear scale: direct price mapping
    radius = point.price * radiusScale;
  }

  // Ensure minimum radius
  radius = Math.max(radius, minRadius);

  // X and Z create the circular motion at the price radius
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);

  return {
    x,
    y,
    z,
    price: point.price,
    timestamp: point.timestamp,
  };
}

/**
 * Convert an array of price points to spiral coordinates
 */
export function priceSeriesToSpiral(
  priceData: PricePoint[],
  config: SpiralConfig,
  options?: {
    verticalScale?: number;
    radiusScale?: number;
    minRadius?: number;
  }
): SpiralPoint[] {
  if (priceData.length === 0) return [];

  // Use the first data point's date as the base
  const baseDate = priceData[0].timestamp;

  return priceData.map((point) =>
    pricePointToSpiral(point, config, baseDate, options)
  );
}

/**
 * Calculate optimal scaling factors based on price data
 */
export function calculateScaling(
  priceData: PricePoint[],
  config: SpiralConfig,
  targetHeight: number = 10,
  targetMaxRadius: number = 5
): { verticalScale: number; radiusScale: number } {
  if (priceData.length === 0) {
    return { verticalScale: 0.01, radiusScale: 1 };
  }

  // Calculate total days span
  const firstDate = priceData[0].timestamp;
  const lastDate = priceData[priceData.length - 1].timestamp;
  const totalDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate vertical scale to achieve target height
  const verticalScale = totalDays > 0 ? targetHeight / totalDays : 0.01;

  // Calculate max price for radius scaling
  const maxPrice = Math.max(...priceData.map((p) => p.price));
  const minPrice = Math.min(...priceData.map((p) => p.price));

  let radiusScale: number;
  if (config.priceScale === 'logarithmic') {
    const maxLogRadius = Math.log10(Math.max(maxPrice, 1));
    radiusScale = maxLogRadius > 0 ? targetMaxRadius / maxLogRadius : 1;
  } else {
    radiusScale = maxPrice > 0 ? targetMaxRadius / maxPrice : 1;
  }

  return { verticalScale, radiusScale };
}

/**
 * Generate price level ring positions for visualization
 * Returns radii for different price levels (e.g., $100, $1K, $10K)
 */
export function generatePriceLevelRings(
  minPrice: number,
  maxPrice: number,
  config: SpiralConfig,
  radiusScale: number
): { price: number; radius: number }[] {
  const rings: { price: number; radius: number }[] = [];

  if (config.priceScale === 'logarithmic') {
    // Generate rings at powers of 10
    const minPower = Math.floor(Math.log10(Math.max(minPrice, 1)));
    const maxPower = Math.ceil(Math.log10(Math.max(maxPrice, 1)));

    for (let power = minPower; power <= maxPower; power++) {
      const price = Math.pow(10, power);
      if (price >= minPrice * 0.5 && price <= maxPrice * 2) {
        const radius = Math.log10(price) * radiusScale;
        rings.push({ price, radius });
      }
    }
  } else {
    // Generate rings at nice round numbers
    const range = maxPrice - minPrice;
    const step = Math.pow(10, Math.floor(Math.log10(range)));
    const niceStep = step > 0 ? step : 1;

    const startPrice = Math.floor(minPrice / niceStep) * niceStep;
    for (let price = startPrice; price <= maxPrice * 1.1; price += niceStep) {
      if (price > 0) {
        const radius = price * radiusScale;
        rings.push({ price, radius });
      }
    }
  }

  return rings;
}

/**
 * Get the ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Find indices of key time boundaries for marker placement
 * - Annual/Custom (>90 days): End of month (last trading day)
 * - Quarterly: End of week
 * - Monthly: End of week
 * - Weekly: End of day (daily markers)
 * - Daily: Every few hours or just endpoints
 */
export function getMarkerIndices(
  priceData: PricePoint[],
  cycleDuration: CycleDuration,
  customDays?: number
): number[] {
  if (priceData.length === 0) return [];

  const indices: number[] = [];
  const cycleDays = getCycleDays(cycleDuration, customDays);

  if (cycleDuration === 'annual' || cycleDuration === 'custom' && (customDays || 365) >= 90) {
    // Monthly markers - find last trading day of each month
    let lastMonth = -1;
    let lastIndexInMonth = -1;

    priceData.forEach((point, i) => {
      const month = point.timestamp.getMonth();
      const year = point.timestamp.getFullYear();
      const monthKey = year * 12 + month;

      if (monthKey !== lastMonth) {
        // New month started - save the last index of previous month
        if (lastIndexInMonth >= 0) {
          indices.push(lastIndexInMonth);
        }
        lastMonth = monthKey;
      }
      lastIndexInMonth = i;
    });

    // Don't forget the last month
    if (lastIndexInMonth >= 0 && !indices.includes(lastIndexInMonth)) {
      indices.push(lastIndexInMonth);
    }

  } else if (cycleDuration === 'quarterly' || cycleDuration === 'monthly') {
    // Weekly markers - find last trading day of each week
    let lastWeek = -1;
    let lastIndexInWeek = -1;

    priceData.forEach((point, i) => {
      const week = getWeekNumber(point.timestamp);
      const year = point.timestamp.getFullYear();
      const weekKey = year * 100 + week;

      if (weekKey !== lastWeek) {
        // New week started - save the last index of previous week
        if (lastIndexInWeek >= 0) {
          indices.push(lastIndexInWeek);
        }
        lastWeek = weekKey;
      }
      lastIndexInWeek = i;
    });

    // Don't forget the last week
    if (lastIndexInWeek >= 0 && !indices.includes(lastIndexInWeek)) {
      indices.push(lastIndexInWeek);
    }

  } else if (cycleDuration === 'weekly') {
    // Daily markers - every trading day
    // But that's too many, so let's do every other day
    priceData.forEach((_, i) => {
      if (i % 2 === 0 || i === priceData.length - 1) {
        indices.push(i);
      }
    });

  } else {
    // Daily cycle - just a few markers
    const step = Math.max(1, Math.floor(priceData.length / 10));
    priceData.forEach((_, i) => {
      if (i % step === 0 || i === priceData.length - 1) {
        indices.push(i);
      }
    });
  }

  // Always include first and last points
  if (indices.length > 0 && indices[0] !== 0) {
    indices.unshift(0);
  }
  if (indices.length > 0 && indices[indices.length - 1] !== priceData.length - 1) {
    indices.push(priceData.length - 1);
  }

  return indices;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price >= 1_000_000_000) {
    return `$${(price / 1_000_000_000).toFixed(1)}B`;
  }
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(1)}K`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toFixed(4)}`;
}

/**
 * Calculate daily returns from price data
 */
export function calculateReturns(priceData: PricePoint[]): number[] {
  const returns: number[] = [0]; // First point has no return
  for (let i = 1; i < priceData.length; i++) {
    const prevPrice = priceData[i - 1].price;
    const currPrice = priceData[i].price;
    returns.push((currPrice - prevPrice) / prevPrice);
  }
  return returns;
}

/**
 * Calculate drawdown (% below all-time high) for each point
 */
export function calculateDrawdown(priceData: PricePoint[]): number[] {
  const drawdowns: number[] = [];
  let peak = 0;
  for (const point of priceData) {
    peak = Math.max(peak, point.price);
    const drawdown = (peak - point.price) / peak;
    drawdowns.push(drawdown);
  }
  return drawdowns;
}

/**
 * Calculate rolling volatility (standard deviation of returns)
 */
export function calculateVolatility(priceData: PricePoint[], window: number = 20): number[] {
  const returns = calculateReturns(priceData);
  const volatilities: number[] = [];

  for (let i = 0; i < returns.length; i++) {
    if (i < window) {
      volatilities.push(0);
      continue;
    }

    const windowReturns = returns.slice(i - window, i);
    const mean = windowReturns.reduce((a, b) => a + b, 0) / window;
    const variance = windowReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window;
    volatilities.push(Math.sqrt(variance));
  }

  return volatilities;
}

/**
 * Calculate cycle position for each point (0-1 representing position within cycle)
 */
export function calculateCyclePositions(
  priceData: PricePoint[],
  config: SpiralConfig
): number[] {
  if (priceData.length === 0) return [];

  const baseDate = priceData[0].timestamp;
  const cycleDays = getCycleDays(config.cycleDuration, config.customDays);
  const msPerDay = 1000 * 60 * 60 * 24;

  return priceData.map((point) => {
    const daysElapsed = (point.timestamp.getTime() - baseDate.getTime()) / msPerDay;
    const cycleProgress = daysElapsed / cycleDays;
    return cycleProgress % 1; // Position within current cycle (0-1)
  });
}

/**
 * Aggregate returns by cycle position to find patterns
 * Returns average return at each position bucket
 */
export function calculateCyclePositionReturns(
  priceData: PricePoint[],
  config: SpiralConfig,
  buckets: number = 36 // 10-degree buckets
): { position: number; avgReturn: number; count: number }[] {
  const returns = calculateReturns(priceData);
  const positions = calculateCyclePositions(priceData, config);

  // Aggregate returns by bucket
  const bucketReturns: number[][] = Array.from({ length: buckets }, () => []);

  for (let i = 0; i < positions.length; i++) {
    const bucketIndex = Math.floor(positions[i] * buckets) % buckets;
    bucketReturns[bucketIndex].push(returns[i]);
  }

  return bucketReturns.map((returns, i) => ({
    position: i / buckets,
    avgReturn: returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0,
    count: returns.length,
  }));
}

/**
 * Get color for a point based on the selected color mode
 */
export function getColorForPoint(
  index: number,
  priceData: PricePoint[],
  colorMode: ColorMode,
  config: SpiralConfig,
  // Pre-calculated data for performance
  cachedData?: {
    returns?: number[];
    drawdowns?: number[];
    volatilities?: number[];
    cyclePositionReturns?: { position: number; avgReturn: number }[];
  }
): THREE.Color {
  const returns = cachedData?.returns || calculateReturns(priceData);

  switch (colorMode) {
    case 'price': {
      // Original: orange to yellow based on price
      const prices = priceData.map((p) => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const normalizedPrice = (priceData[index].price - minPrice) / (maxPrice - minPrice || 1);
      return new THREE.Color('#ff6600').lerp(new THREE.Color('#ffcc00'), normalizedPrice);
    }

    case 'return': {
      // Green for positive, red for negative returns
      const returnValue = returns[index];
      const maxReturn = Math.max(...returns.map(Math.abs), 0.01);
      const intensity = Math.min(Math.abs(returnValue) / maxReturn, 1);

      if (returnValue >= 0) {
        // Green gradient
        return new THREE.Color('#1a1a1a').lerp(new THREE.Color('#00ff00'), intensity);
      } else {
        // Red gradient
        return new THREE.Color('#1a1a1a').lerp(new THREE.Color('#ff0000'), intensity);
      }
    }

    case 'drawdown': {
      // Yellow (no drawdown) to red (max drawdown)
      const drawdowns = cachedData?.drawdowns || calculateDrawdown(priceData);
      const drawdown = drawdowns[index];
      const maxDrawdown = Math.max(...drawdowns, 0.01);
      const intensity = drawdown / maxDrawdown;
      return new THREE.Color('#00ff00').lerp(new THREE.Color('#ff0000'), intensity);
    }

    case 'volatility': {
      // Blue (low vol) to red (high vol)
      const volatilities = cachedData?.volatilities || calculateVolatility(priceData);
      const vol = volatilities[index];
      const maxVol = Math.max(...volatilities.filter((v) => v > 0), 0.01);
      const intensity = vol / maxVol;
      return new THREE.Color('#0066ff').lerp(new THREE.Color('#ff3300'), intensity);
    }

    case 'cyclePosition': {
      // Color based on average return at this cycle position
      const cycleReturns = cachedData?.cyclePositionReturns || calculateCyclePositionReturns(priceData, config);
      const positions = calculateCyclePositions(priceData, config);
      const bucketIndex = Math.floor(positions[index] * cycleReturns.length) % cycleReturns.length;
      const avgReturn = cycleReturns[bucketIndex].avgReturn;

      const maxAvgReturn = Math.max(...cycleReturns.map((r) => Math.abs(r.avgReturn)), 0.001);
      const intensity = Math.min(Math.abs(avgReturn) / maxAvgReturn, 1);

      if (avgReturn >= 0) {
        return new THREE.Color('#333333').lerp(new THREE.Color('#00ff88'), intensity);
      } else {
        return new THREE.Color('#333333').lerp(new THREE.Color('#ff4444'), intensity);
      }
    }

    default:
      return new THREE.Color('#ff6600');
  }
}

/**
 * Pre-calculate all color-related data for performance
 */
export function preCalculateColorData(
  priceData: PricePoint[],
  config: SpiralConfig
) {
  return {
    returns: calculateReturns(priceData),
    drawdowns: calculateDrawdown(priceData),
    volatilities: calculateVolatility(priceData),
    cyclePositionReturns: calculateCyclePositionReturns(priceData, config),
  };
}
