import { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { GoogleAuthService } from '../services/googleAuth.service';
import { GoogleSheetsService } from '../services/googleSheets.service';

export class AuthController {
  /**
   * Redirects user to Google's consent screen
   */
  public static login(c: Context) {
    try {
      const url = GoogleAuthService.getAuthUrl(c);
      return c.redirect(url);
    } catch (error: any) {
      console.error('[AuthController] Error generating redirect URL:', error);
      return c.json({ success: false, message: 'OAuth redirect failed.' }, 500);
    }
  }

  /**
   * Google OAuth Callback Endpoint
   */
  public static async callback(c: Context) {
    const envVars = getEnv(c);
    const code = c.req.query('code');
    
    if (!code) {
      console.error('[AuthController] Callback error: No authorization code received.');
      return c.redirect(`${envVars.FRONTEND_URL}/auth/callback?error=no_code`);
    }

    try {
      console.log('[AuthController] Exchanging authorization code for tokens...');
      const tokens = await GoogleAuthService.getTokensFromCode(code, c);
      
      console.log('[AuthController] Fetching user profile from Google...');
      const profile = await GoogleAuthService.getUserProfile(tokens, c);
      
      console.log('[AuthController] Handshake: Initializing user spreadsheet database...');
      // Initialize or find sheet database in user's Google Drive
      const sheetResult = await GoogleSheetsService.initializeDatabase(tokens, profile.name);

      console.log('[AuthController] Creating User Session JWT...');
      // Build session JWT payload, including Google credentials so server can interact with Sheets later!
      const jwtPayload = {
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        tokens: tokens, // Access token, refresh token, expiry, etc.
        spreadsheetId: sheetResult.spreadsheetId,
        spreadsheetUrl: sheetResult.spreadsheetUrl,
        sheets: sheetResult.sheets,
      };

      const token = jwt.sign(jwtPayload, envVars.JWT_SECRET, {
        expiresIn: envVars.JWT_EXPIRES_IN as any,
      });

      // 1. Set cookie (HTTPOnly, secure in prod)
      setCookie(c, 'token', token, {
        httpOnly: true,
        secure: envVars.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      });

      console.log('[AuthController] Redirecting back to frontend callback with token...');
      // 2. Redirect to frontend auth callback page with token in query string
      const redirectUrl = new URL(`${envVars.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('token', token);
      
      return c.redirect(redirectUrl.toString());
    } catch (error: any) {
      console.error('[AuthController] OAuth callback flow failed:', error);
      const redirectUrl = new URL(`${envVars.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('error', 'auth_failed');
      redirectUrl.searchParams.set('details', error.message || 'unknown');
      return c.redirect(redirectUrl.toString());
    }
  }

  /**
   * Retrieves profile details and active Sheet details from the validated JWT token
   */
  public static getMe(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    try {
      return c.json({
        success: true,
        user: {
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        spreadsheet: {
          id: user.spreadsheetId,
          url: user.spreadsheetUrl,
          sheets: user.sheets,
        }
      });
    } catch (error: any) {
      return c.json({ success: false, message: 'Failed to retrieve profile.' }, 500);
    }
  }

  /**
   * Forces a check/initialization of the Google Sheet spreadsheet database
   */
  public static async initializeSheet(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    try {
      const envVars = getEnv(c);
      console.log(`[AuthController] Force re-initializing sheet for user: ${user.email}`);
      
      const sheetResult = await GoogleSheetsService.initializeDatabase(user.tokens, user.name);

      // Re-sign token with new spreadsheet details (in case they changed)
      const jwtPayload = {
        ...user,
        spreadsheetId: sheetResult.spreadsheetId,
        spreadsheetUrl: sheetResult.spreadsheetUrl,
        sheets: sheetResult.sheets,
      };

      const newToken = jwt.sign(jwtPayload, envVars.JWT_SECRET, {
        expiresIn: envVars.JWT_EXPIRES_IN as any,
      });

      setCookie(c, 'token', newToken, {
        httpOnly: true,
        secure: envVars.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      });

      return c.json({
        success: true,
        token: newToken,
        spreadsheet: {
          id: sheetResult.spreadsheetId,
          url: sheetResult.spreadsheetUrl,
          sheets: sheetResult.sheets,
        }
      });
    } catch (error: any) {
      console.error('[AuthController] Manual sheet initialization failed:', error);
      return c.json({ success: false, message: 'Sheet initialization failed.', error: error.message }, 500);
    }
  }

  /**
   * Log out clear cookie
   */
  public static logout(c: Context) {
    deleteCookie(c, 'token', { path: '/' });
    return c.json({ success: true, message: 'Logged out successfully.' });
  }
}
