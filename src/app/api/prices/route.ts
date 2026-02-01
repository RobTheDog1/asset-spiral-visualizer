import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

interface HistoricalResult {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

// Create Yahoo Finance instance
const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400 }
    );
  }

  try {
    // Parse dates or use defaults
    const period1 = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000); // 5 years ago

    const period2 = endDate ? new Date(endDate) : new Date();

    // Fetch historical data from Yahoo Finance
    const queryOptions = {
      period1,
      period2,
      interval: '1d' as const,
    };

    const result = await yahooFinance.historical(
      symbol.toUpperCase(),
      queryOptions
    ) as HistoricalResult[];

    // Transform to our format
    const priceData = result.map((quote: HistoricalResult) => ({
      timestamp: quote.date.toISOString(),
      price: quote.close,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      volume: quote.volume,
    }));

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      data: priceData,
      count: priceData.length,
    });
  } catch (error) {
    console.error('Error fetching price data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data', details: String(error) },
      { status: 500 }
    );
  }
}
