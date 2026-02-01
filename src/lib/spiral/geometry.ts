import { PricePoint, SpiralConfig, SpiralPoint, CycleDuration, CYCLE_DAYS } from '@/types';

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
