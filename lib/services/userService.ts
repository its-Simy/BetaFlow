import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function registerUser(userData: CreateUserData): Promise<User> {
  const { email, password, first_name, last_name } = userData;
  
  // Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Insert user
  const result = await query(
    'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, created_at, updated_at',
    [email, password_hash, first_name, last_name]
  );

  return result.rows[0];
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Get user with password hash
  const result = await query(
    'SELECT id, email, password_hash, first_name, last_name, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );

  const userWithPassword = result.rows[0];
  if (!userWithPassword) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await verifyPassword(password, userWithPassword.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = generateAuthToken(userWithPassword.id, email);

  return {
    user: {
      id: userWithPassword.id,
      email: userWithPassword.email,
      first_name: userWithPassword.first_name,
      last_name: userWithPassword.last_name,
      created_at: userWithPassword.created_at,
      updated_at: userWithPassword.updated_at,
    },
    token
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    'SELECT id, email, first_name, last_name, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows[0] || null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await query(
    'SELECT id, email, first_name, last_name, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0] || null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAuthToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyAuthToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function deleteUser(userId: number): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [userId]);
  return (result.rowCount ?? 0) > 0;
}