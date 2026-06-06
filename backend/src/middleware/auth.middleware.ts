import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface UserPayload {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  tokens: any;
}

// Extend Request interface to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = '';

    // Check header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Check cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check query params (fallback)
    if (!token && req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required. Access Denied.' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;
    
    // Attach to request
    req.user = decoded;
    
    next();
  } catch (error: any) {
    console.error('[authMiddleware] Token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Unauthorized.' });
  }
};
