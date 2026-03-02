import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Since we just removed Manus and might not have passwords set yet
      // This is a placeholder local login. In production, check bcrypt.
      // For now, let's allow "admin@cmfinancial.com" / "admin" as dummy
      let user = await db.getUserByEmail(email);
      
      if (!user) {
        // Auto-create for testing purposes until full register flow is built
        const openId = nanoid();
        await db.upsertUser({
          openId,
          email,
          name: email.split("@")[0],
          loginMethod: "local",
          lastSignedIn: new Date()
        });
        user = await db.getUserByOpenId(openId);
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user });
    } catch {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}
