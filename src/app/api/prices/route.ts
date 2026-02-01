import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { DataInterval, INTERVAL_MAX_DAYS } from '@/types';

// Valid intervals for Yahoo Finance chart API
const VALID_INTERVALS = ['1m', '2m', '5m', '15m', '30m', '60m', '1h', '1d'] as const;
type YahooInterval = '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo';

// Create Yahoo Finance instance
const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const intervalParam = searchParams.get('interval') || '1d';

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400 }
    );
  }

  // Validate interval
  const interval = VALID_INTERVALS.includes(intervalParam as typeof VALID_INTERVALS[number])
    ? (intervalParam as DataInterval)
    : '1d';

  try {
    // Parse dates or use defaults
    const period2 = endDate ? new Date(endDate) : new Date();

    // Apply interval-specific date limits
    const maxDays = INTERVAL_MAX_DAYS[interval];
    const defaultStart = new Date(Date.now() - Math.min(maxDays, 5 * 365) * 24 * 60 * 60 * 1000);
    let period1 = startDate ? new Date(startDate) : defaultStart;

    // Enforce max date range for intraday intervals
    const requestedDays = Math.ceil((period2.getTime() - period1.getTime()) / (1000 * 60 * 60 * 24));
    if (requestedDays > maxDays) {
      period1 = new Date(period2.getTime() - maxDays * 24 * 60 * 60 * 1000);
    }

    // Use chart API which supports all intervals including intraday
    const chartResult = await yahooFinance.chart(symbol.toUpperCase(), {
      period1,
      period2,
      interval: interval as YahooInterval,
    });

    // Transform chart data to our format
    const quotes = chartResult.quotes || [];
    const priceData = quotes
      .filter((quote) => quote.close !== null && quote.close !== undefined)
      .map((quote) => ({
        timestamp: new Date(quote.date).toISOString(),
        price: quote.close as number,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        volume: quote.volume,
      }));

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      data: priceData,
      count: priceData.length,
      interval,
      dateRange: {
        start: period1.toISOString(),
        end: period2.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching price data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data', details: String(error) },
      { status: 500 }
    );
  }
}
