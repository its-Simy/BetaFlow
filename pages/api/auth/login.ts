import { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../../lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, token } = await loginUser(email, password);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid email or password' });
  }
}
