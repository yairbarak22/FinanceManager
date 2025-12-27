/**
 * Centralized Configuration Module
 * Validates and exports all environment variables
 * Ensures all required config is present at startup
 */

interface Config {
  // Database
  databaseUrl: string;
  directUrl: string;

  // Auth
  nextAuthUrl: string;
  nextAuthSecret: string;
  googleClientId: string;
  googleClientSecret: string;

  // Encryption
  encryptionKey: string;

  // Admin
  adminEmails: string[];

  // Optional services
  resendApiKey?: string;
  gaMeasurementId?: string;
  groqApiKey?: string;
  googleAiApiKey?: string;

  // Environment
  nodeEnv: 'development' | 'production' | 'test';
}

function validateRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadConfig(): Config {
  // Validate all required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'ENCRYPTION_KEY',
  ];

  // Check for missing required vars
  const missing = requiredVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Parse admin emails
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: No admin emails configured. Admin routes will be inaccessible.');
  }

  return {
    // Database
    databaseUrl: validateRequiredEnvVar('DATABASE_URL'),
    directUrl: validateRequiredEnvVar('DIRECT_URL'),

    // Auth
    nextAuthUrl: validateRequiredEnvVar('NEXTAUTH_URL'),
    nextAuthSecret: validateRequiredEnvVar('NEXTAUTH_SECRET'),
    googleClientId: validateRequiredEnvVar('GOOGLE_CLIENT_ID'),
    googleClientSecret: validateRequiredEnvVar('GOOGLE_CLIENT_SECRET'),

    // Encryption
    encryptionKey: validateRequiredEnvVar('ENCRYPTION_KEY'),

    // Admin
    adminEmails,

    // Optional services
    resendApiKey: process.env.RESEND_API_KEY,
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    groqApiKey: process.env.GROQ_API_KEY,
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY,

    // Environment
    nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  };
}

// Load and validate config once at module initialization
// This will fail fast if any required env vars are missing
export const config = loadConfig();
