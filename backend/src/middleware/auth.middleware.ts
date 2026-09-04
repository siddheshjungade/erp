import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';

export interface UserPayload {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  tokens: any;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheets?: string[];
}

export type Env = {
  Variables: {
    user: UserPayload;
  };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  try {
    let token = '';

    // Check header
    const authHeader = c.req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Check cookie
    if (!token) {
      token = getCookie(c, 'token') || '';
    }

    // Check query params (fallback)
    if (!token) {
      token = c.req.query('token') || '';
    }

    if (!token) {
      return c.json({ success: false, message: 'Authorization token required. Access Denied.' }, 401);
    }

    // Verify token
    const envVars = getEnv(c);
    const decoded = jwt.verify(token, envVars.JWT_SECRET) as UserPayload;
    
    // Attach to request context
    c.set('user', decoded);
    
    await next();
  } catch (error: any) {
    console.error('[authMiddleware] Token verification failed:', error.message);
    return c.json({ success: false, message: 'Invalid or expired token. Unauthorized.' }, 401);
  }
});
