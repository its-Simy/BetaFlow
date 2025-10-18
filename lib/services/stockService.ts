import { query } from '../database';

export interface StockHolding {
  id: number;
  user_id: number;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

export interface AddStockData {
  user_id: number;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  purchase_price: number;
  current_price: number;
}

export interface PortfolioSummary {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  total_holdings: number;
  total_value: number;
  total_gain_loss: number;
  total_invested: number;
}

export async function addStockToPortfolio(stockData: AddStockData): Promise<StockHolding> {
  const { user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price } = stockData;
  
  // Check if user already has this stock
  const existingHolding = await getStockHolding(user_id, stock_symbol);
  if (existingHolding) {
    // Update existing holding
    return updateStockHolding(user_id, stock_symbol, {
      shares_owned: existingHolding.shares_owned + shares_owned,
      purchase_price: (existingHolding.purchase_price * existingHolding.shares_owned + purchase_price * shares_owned) / (existingHolding.shares_owned + shares_owned),
      current_price: current_price
    });
  }

  // Add new holding
  const result = await query(
    'INSERT INTO user_stocks (user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price]
  );

  return result.rows[0];
}

export async function getUserStocks(user_id: number): Promise<StockHolding[]> {
  const result = await query(
    'SELECT * FROM user_stocks WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  
  return result.rows;
}

export async function getStockHolding(user_id: number, stock_symbol: string): Promise<StockHolding | null> {
  const result = await query(
    'SELECT * FROM user_stocks WHERE user_id = $1 AND stock_symbol = $2',
    [user_id, stock_symbol]
  );
  
  return result.rows[0] || null;
}

export async function updateStockHolding(
  user_id: number, 
  stock_symbol: string, 
  updates: Partial<Pick<StockHolding, 'shares_owned' | 'purchase_price' | 'current_price'>>
): Promise<StockHolding> {
  const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 3}`).join(', ');
  const values = Object.values(updates);
  
  const result = await query(
    `UPDATE user_stocks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND stock_symbol = $2 RETURNING *`,
    [user_id, stock_symbol, ...values]
  );

  return result.rows[0];
}

export async function removeStockFromPortfolio(user_id: number, stock_symbol: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM user_stocks WHERE user_id = $1 AND stock_symbol = $2',
    [user_id, stock_symbol]
  );
  
  return (result.rowCount ?? 0) > 0;
}

// Get user's portfolio summary
export async function getPortfolioSummary(user_id: number): Promise<PortfolioSummary | null> {
  const result = await query(
    'SELECT * FROM user_portfolio_summary WHERE user_id = $1',
    [user_id]
  );
  
  return result.rows[0] || null;
}

// Update current prices for all stocks (for market data updates)
export async function updateStockPrices(stockUpdates: { symbol: string; current_price: number }[]): Promise<void> {
  for (const update of stockUpdates) {
    await query(
      'UPDATE user_stocks SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE stock_symbol = $2',
      [update.current_price, update.symbol]
    );
  }
}

// Get all unique stock symbols across all users
export async function getAllStockSymbols(): Promise<string[]> {
  const result = await query('SELECT DISTINCT stock_symbol FROM user_stocks');
  return result.rows.map(row => row.stock_symbol);
}

// Get stock holdings by symbol (for market data updates)
export async function getStockHoldingsBySymbol(stock_symbol: string): Promise<StockHolding[]> {
  const result = await query('SELECT * FROM user_stocks WHERE stock_symbol = $1', [stock_symbol]);
  return result.rows;
}