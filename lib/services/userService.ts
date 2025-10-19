import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { query } from '../database';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Create a new user
export async function createUser(userData: CreateUserData): Promise<User> {
  const { email, password, first_name, last_name } = userData;
  
  // Hash the password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Insert user into database
  const result = await query(
    'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, created_at, updated_at',
    [email, password_hash, first_name, last_name]
  );
  
  return result.rows[0];
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    'SELECT id, email, first_name, last_name, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows[0] || null;
}

// Find user by ID
export async function findUserById(id: number): Promise<User | null> {
  try {
    console.log('Looking up user by ID:', id);
    const result = await query(
      'SELECT id, email, first_name, last_name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    console.log('Database query result:', result.rows.length, 'rows');
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error in findUserById:', error);
    return null;
  }
}

// Get user with password hash for authentication
export async function getUserWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await query(
    'SELECT id, email, password_hash, first_name, last_name, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows[0] || null;
}

// Authenticate user
export async function authenticateUser(loginData: LoginData): Promise<AuthResult | null> {
  const { email, password } = loginData;
  
  // Get user with password hash
  const userWithPassword = await getUserWithPassword(email);
  if (!userWithPassword) {
    return null;
  }
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);
  if (!isValidPassword) {
    return null;
  }
  
  // Remove password hash from user object
  const { password_hash, ...user } = userWithPassword;
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return { user, token };
}

// Verify JWT token
export async function verifyToken(token: string): Promise<User | null> {
  try {
    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    console.log('JWT decoded successfully:', { userId: decoded.userId, email: decoded.email });
    const user = await findUserById(decoded.userId);
    console.log('User lookup result:', user ? `Found user ${user.id}` : 'User not found');
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Register user (wrapper for createUser with validation)
export async function registerUser(email: string, password: string, first_name: string, last_name: string = ''): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Create new user
    const user = await createUser({ email, password, first_name, last_name });
    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Failed to create user account' };
  }
}

// Login user (wrapper for authenticateUser)
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    const result = await authenticateUser({ email, password });
    if (result) {
      return { success: true, user: result.user, token: result.token };
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Update user
export async function updateUser(id: number, updateData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await query(
    `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, first_name, last_name, created_at, updated_at`,
    [id, ...values]
  );
  
  return result.rows[0] || null;
}

// Delete user
export async function deleteUser(id: number): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
