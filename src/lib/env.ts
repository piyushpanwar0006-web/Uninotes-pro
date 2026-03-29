/**
 * Environment variable validation.
 * Called at module load — fails fast with a clear error if Supabase is not configured.
 */
export function assertEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ] as const;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}.\n` +
      `Copy .env.local.example to .env.local and fill in your Supabase credentials.`
    );
  }
}

export function assertAdminEnvVars() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.\n' +
      'Add it to .env.local (get it from Supabase Dashboard → Settings → API).'
    );
  }
}
