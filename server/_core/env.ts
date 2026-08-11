const _fallbackSecret = process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-not-for-production';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[SECURITY] JWT_SECRET must be set in production environment');
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
