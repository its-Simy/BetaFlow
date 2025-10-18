import type { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../../lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const result = await loginUser(email, password);

      if (result.success && result.user && result.token) {
        return res.status(200).json({ message: 'Login successful', user: result.user, token: result.token });
      } else {
        return res.status(401).json({ error: result.error || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
