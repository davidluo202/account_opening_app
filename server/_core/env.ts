const _fallbackSecret = process.env.NODE_ENV === 'production' ? 'CHANGE-ME-IN-PRODUCTION' : 'dev-only-secret-not-for-production';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('[SECURITY WARNING] JWT_SECRET not set in production! Using unsafe fallback.');
}

export const ENV = {
  appId: process.env.APP_ID ?? "local-app",
  cookieSecret: process.env.JWT_SECRET ?? _fallbackSecret ?? '',
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
};
