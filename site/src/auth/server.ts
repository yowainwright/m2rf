import { betterAuth } from 'better-auth';
import { memoryAdapter, type MemoryDB } from 'better-auth/adapters/memory';

const APP_NAME = 'm2rf';
const DEFAULT_APP_PORT = '54783';
const LOCAL_AUTH_HOSTS = ['localhost', '127.0.0.1'] as const;
const authDb: MemoryDB = {};

const getEnvValue = (name: string) => {
  return process.env[name]?.trim();
};

const getRequiredEnvValue = (name: string) => {
  const value = getEnvValue(name);

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

const getAuthSecret = () => {
  const secret = getRequiredEnvValue('BETTER_AUTH_SECRET');

  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  }

  return secret;
};

const getAuthBaseURL = () => {
  const port = getEnvValue('M2RF_APP_PORT') || DEFAULT_APP_PORT;

  return getEnvValue('BETTER_AUTH_URL') || `http://localhost:${port}`;
};

const getLocalPartnerOrigin = (baseURL: string) => {
  const url = new URL(baseURL);
  const isLocalHost = LOCAL_AUTH_HOSTS.includes(
    url.hostname as (typeof LOCAL_AUTH_HOSTS)[number]
  );

  if (!isLocalHost || url.protocol !== 'http:') {
    return [];
  }

  url.hostname = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost';

  return [url.origin];
};

const createAuthDatabase = () => {
  return memoryAdapter(authDb);
};

const getGithubProvider = () => {
  return {
    github: {
      clientId: getRequiredEnvValue('GITHUB_CLIENT_ID'),
      clientSecret: getRequiredEnvValue('GITHUB_CLIENT_SECRET'),
    },
  };
};

const getAuthOptions = () => {
  const authBaseURL = new URL(getAuthBaseURL()).origin;

  return {
    appName: APP_NAME,
    baseURL: authBaseURL,
    database: createAuthDatabase(),
    secret: getAuthSecret(),
    socialProviders: getGithubProvider(),
    trustedOrigins: getLocalPartnerOrigin(authBaseURL),
    advanced: {
      database: {
        joins: true,
      },
    },
  };
};

const createAuth = () => betterAuth(getAuthOptions());

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | null = null;

export const getAuth = () => {
  if (authInstance) {
    return authInstance;
  }

  authInstance = createAuth();
  return authInstance;
};
