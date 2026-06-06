import dotenv from 'dotenv';
import path from 'path';

// Load env files
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config(); // Backup to load from current working dir

export const config = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_development_secret_key_should_be_long_and_random',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};

// Validate critical values
if (config.NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  
  if (missing.length > 0) {
    console.error(`[WARNING] Missing critical production env vars: ${missing.join(', ')}`);
  }
}
export default config;
