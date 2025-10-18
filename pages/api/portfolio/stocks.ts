import type { NextApiRequest, NextApiResponse } from 'next';
import { addStockToPortfolio, getUserStocks, updateStockHolding, removeStockFromPortfolio } from '../../../lib/services/stockService';
import { verifyAuthToken } from '../../../lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = await verifyAuthToken(token);

  if (!userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const holdings = await getUserStocks(userId);
        return res.status(200).json(holdings);
      } catch (error) {
        console.error('GET /api/portfolio/stocks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    case 'POST':
      try {
        const { stock_symbol, stock_name, shares_owned, purchase_price, current_price } = req.body;

        if (!stock_symbol || !stock_name || !shares_owned || !purchase_price) {
          return res.status(400).json({ error: 'Missing required stock data' });
        }

        const result = await addStockToPortfolio(userId, stock_symbol, stock_name, shares_owned, purchase_price, current_price);

        if (result.success && result.stock) {
          return res.status(201).json({ message: 'Stock added to portfolio', stock: result.stock });
        } else {
          return res.status(500).json({ error: result.error || 'Failed to add stock' });
        }
      } catch (error) {
        console.error('POST /api/portfolio/stocks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    case 'PUT':
      try {
        const { stock_symbol, shares_owned, current_price } = req.body;

        if (!stock_symbol || (!shares_owned && !current_price)) {
          return res.status(400).json({ error: 'Missing required update data' });
        }

        const updatedStock = await updateStockHolding(userId, stock_symbol, { shares_owned, current_price });

        if (updatedStock) {
          return res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
        } else {
          return res.status(404).json({ error: 'Stock not found or not owned by user' });
        }
      } catch (error) {
        console.error('PUT /api/portfolio/stocks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    case 'DELETE':
      try {
        const { stock_id } = req.body; // Expecting stock_id for deletion

        if (!stock_id) {
          return res.status(400).json({ error: 'Stock ID is required for deletion' });
        }

        const success = await removeStockFromPortfolio(userId, stock_id);

        if (success) {
          return res.status(200).json({ message: 'Stock removed successfully' });
        } else {
          return res.status(404).json({ error: 'Stock not found or not owned by user' });
        }
      } catch (error) {
        console.error('DELETE /api/portfolio/stocks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
