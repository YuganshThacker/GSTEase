// JWT Authentication implementation
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret-change-this';

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  
  return session({
    secret: SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for token in session first
    const sessionUserId = (req.session as any)?.userId;
    
    if (sessionUserId) {
      const user = await storage.getUser(sessionUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await storage.getUser(decoded.userId);
        if (user) {
          req.user = user;
          return next();
        }
      }
    }

    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Setup authentication
export async function setupAuth(app: Express) {
  app.set('trust proxy', 1);
  app.use(getSession());

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      console.log('Login attempt for:', email);

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // For demo purposes, we'll create a default admin user if it doesn't exist
      // In production, you should have a proper user registration flow
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create a default user for development
        console.log('User not found, creating new user for:', email);
        const hashedPassword = await hashPassword(password);
        const userToCreate: any = {
          email,
          firstName: 'Admin',
          lastName: 'User',
          profileImageUrl: null,
          role: 'admin',
          password: hashedPassword,
        };
        user = await storage.upsertUser(userToCreate);
        console.log('New user created:', user.id);
      } else {
        // Verify password (if user has a password field)
        const userWithPassword = user as any;
        if (userWithPassword.password) {
          const isValid = await comparePassword(password, userWithPassword.password);
          if (!isValid) {
            console.log('Invalid password for:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
          }
        } else {
          // If user exists but has no password (old data), update with password
          console.log('User has no password, updating with new password');
          const hashedPassword = await hashPassword(password);
          const userToUpdate: any = {
            ...user,
            password: hashedPassword,
          };
          user = await storage.upsertUser(userToUpdate);
        }
      }

      // Generate token
      const token = generateToken(user.id);

      // Store user ID in session
      (req.session as any).userId = user.id;

      console.log('Login successful for:', email);

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out successfully' });
    });
  });

  // Register endpoint (optional, for creating new users)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      console.log('Register attempt:', { email, firstName, lastName });

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      
      const userToCreate: any = {
        email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        profileImageUrl: null,
        role: 'staff', // Default role
        password: hashedPassword,
      };

      console.log('Creating user with data:', { ...userToCreate, password: '[REDACTED]' });

      const user = await storage.upsertUser(userToCreate);

      console.log('User created successfully:', user.id);

      // Generate token
      const token = generateToken(user.id);

      // Store user ID in session
      (req.session as any).userId = user.id;

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
