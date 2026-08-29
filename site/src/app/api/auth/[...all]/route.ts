import { getAuth } from '@/auth/server';
import { getMigrations } from 'better-auth/db/migration';
import { toNextJsHandler } from 'better-auth/next-js';

export const runtime = 'nodejs';

let migrationPromise: Promise<void> | null = null;

const runAuthMigrations = async () => {
  const auth = getAuth();
  const { runMigrations } = await getMigrations(auth.options);

  await runMigrations();
};

const ensureAuthSchema = async () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  migrationPromise ||= runAuthMigrations();

  await migrationPromise;
};

const handleAuthRequest = async (request: Request) => {
  await ensureAuthSchema();

  return getAuth().handler(request);
};

export const { GET, POST } = toNextJsHandler(handleAuthRequest);
