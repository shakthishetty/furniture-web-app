import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { type Request, type Response, type NextFunction } from 'express';

// Use fixed secrets for in-memory mode to prevent token invalidation on restart
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-fixed-for-memory-storage-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-key-fixed-for-memory-storage-2024';

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin?: boolean; // backward compatibility
  role: 'customer' | 'manufacturer' | 'admin';
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = payload;
  next();
};

// Admin-specific middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // DEVELOPMENT BYPASS: Allow admin access in development mode
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      userId: 'dev-admin-user',
      email: 'admin@dev.com',
      isAdmin: true,
      role: 'admin'
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Check both new role system and legacy isAdmin for backward compatibility
  if (payload.role !== 'admin' && !payload.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.user = payload;
  next();
};

// Manufacturer-specific middleware
export const requireManufacturer = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (payload.role !== 'manufacturer') {
    return res.status(403).json({ error: 'Manufacturer access required' });
  }

  req.user = payload;
  next();
};

// Customer-specific middleware
export const requireCustomer = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (payload.role !== 'customer') {
    return res.status(403).json({ error: 'Customer access required' });
  }

  req.user = payload;
  next();
};

// Flexible role-based middleware factory
export const requireRole = (...allowedRoles: Array<'customer' | 'manufacturer' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // For admin role, check both new role system and legacy isAdmin
    const hasAdminAccess = allowedRoles.includes('admin') && (payload.role === 'admin' || payload.isAdmin);
    const hasRoleAccess = allowedRoles.includes(payload.role);
    
    if (!hasAdminAccess && !hasRoleAccess) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    req.user = payload;
    next();
  };
};

// Verify auth without strict requirement (for checking current user)
export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    req.user = payload || undefined;
  }
  next();
};

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}