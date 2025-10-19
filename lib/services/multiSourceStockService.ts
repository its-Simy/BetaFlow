// Simplified stock data service using Polygon.io with static fallback
// Sources: Polygon.io → Static fallback

// Get Polygon API key safely
function getPolygonKey(): string {
  return process.env.POLYGON_KEY || process.env.POLYGON_API_KEY || "";
}

interface StockSearchResult {
  symbol: string;
  name: string;
  primaryExchange?: string;
  locale?: string;
  type?: string;
  source: 'polygon' | 'static';
}

interface StockData {
  symbol: string;
  current: {
    c: number; // close price
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
  } | null;
  historical: Array<{
    t: number; // timestamp
    c: number; // close price
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
  }>;
  timestamp: string;
  source: 'polygon' | 'static';
}

// Static fallback data for popular stocks
const STATIC_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Communication Services' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', sector: 'Financials' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Staples' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financials' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' }
];

// 1. POLYGON.IO SEARCH
async function searchPolygon(query: string): Promise<StockSearchResult[]> {
  const polyKey = getPolygonKey();
  if (!polyKey) throw new Error('Polygon API key not configured');

  const makeUrl = (market: "stocks" | "etfs") => {
    const url = new URL("https://api.polygon.io/v3/reference/tickers");
    url.searchParams.set("market", market);
    url.searchParams.set("active", "true");
    url.searchParams.set("search", query);
    url.searchParams.set("limit", "25");
    url.searchParams.set("order", "asc");
    url.searchParams.set("sort", "ticker");
    url.searchParams.set("locale", "us");
    url.searchParams.set("apiKey", polyKey);
    return url.toString();
  };

  const [stocksResp, etfsResp] = await Promise.all([
    fetch(makeUrl("stocks")),
    fetch(makeUrl("etfs")),
  ]);

  if (!stocksResp.ok && !etfsResp.ok) {
    throw new Error(`Polygon API error: ${stocksResp.status}`);
  }

  const [stocksData, etfsData] = await Promise.all([
    stocksResp.ok ? stocksResp.json() : { results: [] },
    etfsResp.ok ? etfsResp.json() : { results: [] },
  ]);

  // Exact ticker search for precise matches
  let exactData = { results: [] };
  if (/^[A-Za-z\.]{1,6}$/.test(query)) {
    const exactUrl = new URL("https://api.polygon.io/v3/reference/tickers");
    exactUrl.searchParams.set("ticker", query.toUpperCase());
    exactUrl.searchParams.set("active", "true");
    exactUrl.searchParams.set("limit", "1");
    exactUrl.searchParams.set("locale", "us");
    exactUrl.searchParams.set("apiKey", polyKey);
    
    const exactResp = await fetch(exactUrl.toString());
    if (exactResp.ok) {
      exactData = await exactResp.json();
    }
  }

  const combined = [
    ...(stocksData.results ?? []),
    ...(etfsData.results ?? []),
    ...(exactData.results ?? []),
  ];

  const seen = new Set<string>();
  const deduped = combined.filter((t: any) => {
    const tick = t.ticker;
    if (!tick || seen.has(tick)) return false;
    seen.add(tick);
    return true;
  });

  return deduped.map((t: any) => ({
    symbol: t.ticker,
    name: t.name,
    primaryExchange: t.primary_exchange || t.primary_exchange_symbol,
    locale: t.locale,
    type: t.type,
    source: 'polygon' as const
  }));
}


// 2. STATIC FALLBACK SEARCH
function searchStatic(query: string): StockSearchResult[] {
  const lowerQuery = query.toLowerCase();
  return STATIC_STOCKS
    .filter(stock => 
      stock.symbol.toLowerCase().includes(lowerQuery) ||
      stock.name.toLowerCase().includes(lowerQuery)
    )
    .map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      primaryExchange: 'NASDAQ',
      locale: 'US',
      type: 'stock',
      source: 'static' as const
    }));
}

// MAIN SEARCH FUNCTION WITH FALLBACK
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  console.log(`🔍 Searching stocks for: "${query}"`);
  
  // Try Polygon first
  try {
    console.log('📡 Trying Polygon.io...');
    const results = await searchPolygon(query);
    console.log(`✅ Polygon.io returned ${results.length} results`);
    return results;
  } catch (error) {
    console.warn('⚠️ Polygon.io failed:', error);
  }

  // Fall back to static data
  console.log('📡 Using static fallback...');
  const results = searchStatic(query);
  console.log(`✅ Static fallback returned ${results.length} results`);
  return results;
}

// STOCK DATA FETCHING WITH FALLBACKS

// 1. POLYGON STOCK DATA
async function getStockDataPolygon(symbol: string): Promise<StockData> {
  const polyKey = getPolygonKey();
  if (!polyKey) throw new Error('Polygon API key not configured');

  const sanitizedKey = encodeURIComponent(polyKey.trim());
  
  // Get current price
  const currentResponse = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/prev?adjusted=true&apiKey=${sanitizedKey}`
  );

  if (!currentResponse.ok) {
    throw new Error(`Polygon current data error: ${currentResponse.status}`);
  }

  const currentData = await currentResponse.json();
  if (currentData.status !== 'OK') {
    throw new Error(`Polygon API error: ${currentData.message || 'Unknown error'}`);
  }

  // Get historical data (last 30 days)
  const getDate30DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const historicalResponse = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${getDate30DaysAgo()}/${getToday()}?adjusted=true&sort=asc&apiKey=${sanitizedKey}`
  );

  let historicalData = [];
  if (historicalResponse.ok) {
    const historical = await historicalResponse.json();
    historicalData = historical.results || [];
  }

  return {
    symbol: symbol.toUpperCase(),
    current: currentData.results?.[0] || null,
    historical: historicalData,
    timestamp: new Date().toISOString(),
    source: 'polygon'
  };
}


// 2. STATIC FALLBACK DATA
function getStockDataStatic(symbol: string): StockData {
  const stock = STATIC_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  
  if (!stock) {
    throw new Error(`Stock ${symbol} not found in static data`);
  }

  // Generate synthetic data for demonstration
  const basePrice = 100 + (symbol.charCodeAt(0) * symbol.charCodeAt(1)) % 200;
  const currentPrice = basePrice + (Math.random() - 0.5) * 20;
  
  // Generate 30 days of synthetic historical data
  const historical = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const price = basePrice + (Math.random() - 0.5) * 40;
    const high = price + Math.random() * 5;
    const low = price - Math.random() * 5;
    const open = price + (Math.random() - 0.5) * 2;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    historical.push({
      t: date.getTime(),
      c: price,
      h: high,
      l: low,
      o: open,
      v: volume
    });
  }

  return {
    symbol: symbol.toUpperCase(),
    current: {
      c: currentPrice,
      h: currentPrice + Math.random() * 5,
      l: currentPrice - Math.random() * 5,
      o: currentPrice + (Math.random() - 0.5) * 2,
      v: Math.floor(Math.random() * 1000000) + 100000
    },
    historical,
    timestamp: new Date().toISOString(),
    source: 'static'
  };
}

// Helper functions
function getDate30DaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// MAIN STOCK DATA FUNCTION WITH FALLBACK
export async function getStockData(symbol: string): Promise<StockData> {
  console.log(`📊 Fetching data for: ${symbol}`);
  
  // Try Polygon first
  try {
    console.log('📡 Trying Polygon.io...');
    const data = await getStockDataPolygon(symbol);
    console.log(`✅ Polygon.io returned data for ${symbol}`);
    return data;
  } catch (error) {
    console.warn('⚠️ Polygon.io failed:', error);
  }

  // Fall back to static data
  console.log('📡 Using static fallback...');
  const data = getStockDataStatic(symbol);
  console.log(`✅ Static fallback returned data for ${symbol}`);
  return data;
}
