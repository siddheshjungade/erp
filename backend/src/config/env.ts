export function getEnv(c?: any) {
  const env = (c && c.env) ? c.env : (typeof process !== 'undefined' ? process.env : {});
  return {
    PORT: env.PORT || '5000',
    NODE_ENV: env.NODE_ENV || 'development',
    FRONTEND_URL: env.FRONTEND_URL || 'http://localhost:3000',
    BACKEND_URL: env.BACKEND_URL || 'http://localhost:5000',
    
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_REDIRECT_URI: env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
    
    JWT_SECRET: env.JWT_SECRET || 'fallback_development_secret_key_should_be_long_and_random',
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || '7d',
  };
}

export const config = getEnv();
export default config;
