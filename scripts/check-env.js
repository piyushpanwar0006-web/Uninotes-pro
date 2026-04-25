const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ BUILD FAILED: Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  console.error('\nPlease ensure these are set in your deployment environment.');
  process.exit(1);
}

console.log('✅ Environment validation passed.');
