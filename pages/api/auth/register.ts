import type { NextApiRequest, NextApiResponse } from 'next';
import { registerUser } from '../../../lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name) {
      return res.status(400).json({ error: 'Email, password, and first name are required' });
    }

    try {
      const result = await registerUser(email, password, first_name, last_name);

      if (result.success) {
        return res.status(201).json({ message: 'User created successfully', user: result.user });
      } else {
        return res.status(409).json({ error: result.error });
      }
    } catch (error) {
      console.error('Registration API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
