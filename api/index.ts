import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerFileRoutes } from "../server/_core/files";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { syncMissingTables } from "../server/db";

const app = express();

// Sync DB schema on cold start (non-blocking)
syncMissingTables().catch(console.error);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);
registerFileRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
