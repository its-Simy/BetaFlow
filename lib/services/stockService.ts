import { query } from '../database';

export interface StockHolding {
  id: number;
  user_id: number;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  purchase_price: number;
  current_price: number;
  purchase_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AddStockData {
  user_id: number;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  purchase_price: number;
  current_price?: number;
}

export interface UpdateStockData {
  shares_owned?: number;
  current_price?: number;
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

// Add a stock to user's portfolio
export async function addStockToPortfolio(stockData: AddStockData): Promise<StockHolding> {
  const { user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price = purchase_price } = stockData;
  
  // Check if user already has this stock
  const existingStock = await query(
    'SELECT * FROM user_stocks WHERE user_id = $1 AND stock_symbol = $2',
    [user_id, stock_symbol]
  );
  
  if (existingStock.rows.length > 0) {
    // Update existing holding
    const existing = existingStock.rows[0];
    const newShares = existing.shares_owned + shares_owned;
    const newPurchasePrice = ((existing.shares_owned * existing.purchase_price) + (shares_owned * purchase_price)) / newShares;
    
    const result = await query(
      'UPDATE user_stocks SET shares_owned = $1, purchase_price = $2, current_price = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [newShares, newPurchasePrice, current_price, existing.id]
    );
    
    return result.rows[0];
  } else {
    // Create new holding
    const result = await query(
      'INSERT INTO user_stocks (user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price]
    );
    
    return result.rows[0];
  }
}

// Get user's stock holdings
export async function getUserStocks(user_id: number): Promise<StockHolding[]> {
  const result = await query(
    'SELECT * FROM user_stocks WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  
  return result.rows;
}

// Get a specific stock holding
export async function getStockHolding(user_id: number, stock_symbol: string): Promise<StockHolding | null> {
  const result = await query(
    'SELECT * FROM user_stocks WHERE user_id = $1 AND stock_symbol = $2',
    [user_id, stock_symbol]
  );
  
  return result.rows[0] || null;
}

// Update stock holding
export async function updateStockHolding(
  user_id: number, 
  stock_symbol: string, 
  updateData: UpdateStockData
): Promise<StockHolding | null> {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
  
  const result = await query(
    `UPDATE user_stocks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND stock_symbol = $2 RETURNING *`,
    [user_id, stock_symbol, ...values]
  );
  
  return result.rows[0] || null;
}

// Remove stock from portfolio
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
  const result = await query(
    'SELECT * FROM user_stocks WHERE stock_symbol = $1',
    [stock_symbol]
  );
  
  return result.rows;
}
