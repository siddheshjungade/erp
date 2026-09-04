import { google } from 'googleapis';
import { getEnv } from '../config/env';

export class GoogleAuthService {
  private static getOAuth2Client(c?: any) {
    const envVars = getEnv(c);
    return new google.auth.OAuth2(
      envVars.GOOGLE_CLIENT_ID,
      envVars.GOOGLE_CLIENT_SECRET,
      envVars.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generates authorization URL for Google Consent Screen
   */
  public static getAuthUrl(c?: any): string {
    const oauth2Client = this.getOAuth2Client(c);
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      prompt: 'consent',       // Force user consent to guarantee refresh token
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
  }

  /**
   * Exchanges auth code for access/refresh tokens
   */
  public static async getTokensFromCode(code: string, c?: any) {
    const oauth2Client = this.getOAuth2Client(c);
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Gets authenticated client with provided tokens
   */
  public static getClientWithTokens(tokens: any, c?: any) {
    const oauth2Client = this.getOAuth2Client(c);
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  }

  /**
   * Retrieves user profile details using tokens
   */
  public static async getUserProfile(tokens: any, c?: any) {
    const auth = this.getClientWithTokens(tokens, c);
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const { data } = await oauth2.userinfo.get();
    return {
      googleId: data.id || '',
      email: data.email || '',
      name: data.name || '',
      picture: data.picture || '',
    };
  }
}
