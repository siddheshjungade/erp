import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { GoogleAuthService } from '../services/googleAuth.service';
import { GoogleSheetsService } from '../services/googleSheets.service';

export class AuthController {
  /**
   * Redirects user to Google's consent screen
   */
  public static login(req: Request, res: Response) {
    try {
      const url = GoogleAuthService.getAuthUrl();
      return res.redirect(url);
    } catch (error: any) {
      console.error('[AuthController] Error generating redirect URL:', error);
      return res.status(500).json({ success: false, message: 'OAuth redirect failed.' });
    }
  }

  /**
   * Google OAuth Callback Endpoint
   */
  public static async callback(req: Request, res: Response) {
    const code = req.query.code as string;
    
    if (!code) {
      console.error('[AuthController] Callback error: No authorization code received.');
      return res.redirect(`${config.FRONTEND_URL}/auth/callback?error=no_code`);
    }

    try {
      console.log('[AuthController] Exchanging authorization code for tokens...');
      const tokens = await GoogleAuthService.getTokensFromCode(code);
      
      console.log('[AuthController] Fetching user profile from Google...');
      const profile = await GoogleAuthService.getUserProfile(tokens);
      
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

      const token = jwt.sign(jwtPayload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN as any,
      });

      // 1. Set cookie (HTTPOnly, secure in prod)
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log('[AuthController] Redirecting back to frontend callback with token...');
      // 2. Redirect to frontend auth callback page with token in query string
      const redirectUrl = new URL(`${config.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('token', token);
      
      return res.redirect(redirectUrl.toString());
    } catch (error: any) {
      console.error('[AuthController] OAuth callback flow failed:', error);
      const redirectUrl = new URL(`${config.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('error', 'auth_failed');
      redirectUrl.searchParams.set('details', error.message || 'unknown');
      return res.redirect(redirectUrl.toString());
    }
  }

  /**
   * Retrieves profile details and active Sheet details from the validated JWT token
   */
  public static getMe(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    try {
      // Decode JWT again to read the non-user fields (or we can read directly if we attach them)
      // Since req.user is decoded from token, it has all spreadsheetDetails inside it!
      const user = req.user as any;

      return res.json({
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
      return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
    }
  }

  /**
   * Forces a check/initialization of the Google Sheet spreadsheet database
   */
  public static async initializeSheet(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    try {
      const user = req.user as any;
      console.log(`[AuthController] Force re-initializing sheet for user: ${user.email}`);
      
      const sheetResult = await GoogleSheetsService.initializeDatabase(user.tokens, user.name);

      // Re-sign token with new spreadsheet details (in case they changed)
      const jwtPayload = {
        ...user,
        spreadsheetId: sheetResult.spreadsheetId,
        spreadsheetUrl: sheetResult.spreadsheetUrl,
        sheets: sheetResult.sheets,
      };

      const newToken = jwt.sign(jwtPayload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN as any,
      });

      res.cookie('token', newToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
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
      return res.status(500).json({ success: false, message: 'Sheet initialization failed.', error: error.message });
    }
  }

  /**
   * Log out clear cookie
   */
  public static logout(req: Request, res: Response) {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logged out successfully.' });
  }
}
