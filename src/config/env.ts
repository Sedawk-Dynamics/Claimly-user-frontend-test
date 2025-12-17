/**
 * Environment variable validation and configuration
 * Validates required environment variables at build time
 */

interface EnvConfig {
  VITE_API_URL: string;
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_FIREBASE_MEASUREMENT_ID?: string;
}

const requiredEnvVars = [
  'VITE_API_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function validateEnv(): EnvConfig {
  const missingVars: string[] = [];
  
  // VITE_API_URL has a fallback, so it's not strictly required
  const optionalVars = ['VITE_API_URL'];
  
  // Check required variables (excluding optional ones with fallbacks)
  for (const varName of requiredEnvVars) {
    if (!import.meta.env[varName] && !optionalVars.includes(varName)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}\n\nPlease create a .env file with these variables. See .env.example for reference.`;
    
    // In development, show helpful warning (not error)
    if (import.meta.env.DEV) {
      console.warn('⚠️', errorMsg);
    }
    
    // In production, throw error to prevent app from running with missing config
    if (import.meta.env.PROD) {
      throw new Error(errorMsg);
    }
  }
  
  // Validate API URL format
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  try {
    new URL(apiUrl);
  } catch {
    console.warn(`Invalid VITE_API_URL format: ${apiUrl}`);
  }
  
  // Warn if using default API URL in production
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    console.warn('⚠️ Using default API URL in production. Set VITE_API_URL environment variable.');
  }
  
  return {
    VITE_API_URL: apiUrl,
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
    VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

export const env = validateEnv();

// Log environment info in development
if (import.meta.env.DEV) {
  console.log('🔧 Environment Configuration:', {
    apiUrl: env.VITE_API_URL,
    firebaseProjectId: env.VITE_FIREBASE_PROJECT_ID,
    mode: import.meta.env.MODE,
  });
}

