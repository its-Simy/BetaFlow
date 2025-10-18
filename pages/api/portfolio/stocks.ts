import { NextApiRequest, NextApiResponse } from 'next';
import { addStockToPortfolio, getUserStocks, removeStockFromPortfolio } from '../../../lib/services/stockService';
import { verifyAuthToken } from '../../../lib/services/userService';

// Middleware to verify JWT token
async function authenticateRequest(req: NextApiRequest): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const user = verifyAuthToken(token);
  return user ? user.userId : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user
  const userId = await authenticateRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const stocks = await getUserStocks(userId);
      res.status(200).json({ stocks });
    } catch (error) {
      console.error('Get stocks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { stock_symbol, stock_name, shares_owned, purchase_price, current_price } = req.body;

      if (!stock_symbol || !stock_name || !shares_owned || !purchase_price || !current_price) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const stock = await addStockToPortfolio({
        user_id: userId,
        stock_symbol,
        stock_name,
        shares_owned: parseFloat(shares_owned),
        purchase_price: parseFloat(purchase_price),
        current_price: parseFloat(current_price)
      });

      res.status(201).json({ 
        message: 'Stock added to portfolio',
        stock 
      });

    } catch (error) {
      console.error('Add stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { stockId } = req.query;
      
      if (!stockId) {
        return res.status(400).json({ error: 'Stock ID is required' });
      }

      const success = await removeStockFromPortfolio(userId, stockId as string);
      
      if (success) {
        res.status(200).json({ message: 'Stock removed from portfolio' });
      } else {
        res.status(404).json({ error: 'Stock not found' });
      }

    } catch (error) {
      console.error('Remove stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
