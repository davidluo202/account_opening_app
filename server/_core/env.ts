export const ENV = {
  appId: process.env.APP_ID ?? "local-app",
  cookieSecret: process.env.JWT_SECRET ?? "fallback-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
