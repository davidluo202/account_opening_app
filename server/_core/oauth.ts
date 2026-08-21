import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { Pool } from "pg";

const SSO_DATABASE_URL = process.env.SSO_DATABASE_URL || '';
if (!SSO_DATABASE_URL) {
  console.warn('[SECURITY] SSO_DATABASE_URL not set — SSO login will not work');
}

let ssoPool: Pool;
function getSSOPool(): Pool {
  if (!ssoPool) {
    ssoPool = new Pool({ connectionString: SSO_DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  }
  return ssoPool;
}

async function ensureAdminUsersTable(): Promise<void> {
  const p = getSSOPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(200) UNIQUE NOT NULL,
      name VARCHAR(100),
      password_hash VARCHAR(200) NOT NULL,
      role VARCHAR(50) DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP
    )
  `);
}

function ssoHashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const isCompanyEmail = email.toLowerCase().endsWith('@cmfinancial.com');

      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Insert into SSO admin_users table
      try {
        await ensureAdminUsersTable();
        const p = getSSOPool();
        const emailLower = email.toLowerCase();
        const ssoHash = ssoHashPassword(password);
        const existing = await p.query('SELECT id FROM admin_users WHERE email = $1', [emailLower]);
        if (existing.rows.length === 0) {
          await p.query(
            'INSERT INTO admin_users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
            [emailLower, (name || email.split("@")[0]).trim(), ssoHash, 'staff']
          );
        }
      } catch (ssoErr) {
        console.error("[SSO] Failed to insert into admin_users:", ssoErr);
        // Continue with local registration even if SSO insert fails
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const openId = nanoid();

      await db.upsertUser({
        openId,
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        loginMethod: "local",
        lastSignedIn: new Date()
      });

      const user = await db.getUserByOpenId(openId);

      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // SSO: try admin_users table first (for @cmfinancial.com emails)
      let ssoAuthenticated = false;
      let ssoUser: { email: string; name: string; role: string } | null = null;
      try {
        await ensureAdminUsersTable();
        const p = getSSOPool();
        const ssoResult = await p.query('SELECT * FROM admin_users WHERE email = $1', [email.toLowerCase()]);
        if (ssoResult.rows.length > 0) {
          const row = ssoResult.rows[0];
          const inputHash = ssoHashPassword(password);
          if (inputHash === row.password_hash) {
            ssoAuthenticated = true;
            ssoUser = { email: row.email, name: row.name, role: row.role };
            // Update last_login
            await p.query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [row.id]);
          } else {
            return res.status(401).json({ error: "電郵地址或密碼錯誤" });
          }
        }
      } catch (ssoErr) {
        console.error("[SSO] PostgreSQL check failed, falling back to MySQL:", ssoErr);
      }

      // Get or create local user record for session management
      let user = await db.getUserByEmail(email);

      if (ssoAuthenticated && ssoUser) {
        // SSO auth succeeded - ensure local user exists for session
        if (!user) {
          const openId = nanoid();
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await db.upsertUser({
            openId,
            email: ssoUser.email,
            name: ssoUser.name || email.split("@")[0],
            password: hashedPassword,
            loginMethod: "local",
            lastSignedIn: new Date()
          });
          user = await db.getUserByOpenId(openId);
        }
        // Sync role from SSO (PostgreSQL admin_users) to local MySQL user
        if (user && ssoUser.role && user.role !== ssoUser.role) {
          await db.updateUserRole(user.id, ssoUser.role as 'user' | 'admin');
          user = await db.getUserById(user.id);
        }
      } else if (!ssoAuthenticated) {
        // Fallback: MySQL auth
        if (!user) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        if (user.password) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({ error: "電郵地址或密碼錯誤" });
          }
        } else {
          return res.status(401).json({ error: "該賬號為驗證碼註冊，尚未設置密碼，請點擊下方「忘記密碼」設置新密碼。" });
        }
      }

      if (!user) {
        return res.status(500).json({ error: "Failed to resolve user" });
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

  // Password reset (public) — keep JSON response stable (avoid tRPC JSON parse issues on hosting)
  app.post("/api/auth/request-password-reset", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        // do not reveal whether user exists
        return res.json({ success: true, message: "如果該電郵地址已註冊，您將收到密碼重置郵件" });
      }

      const { generateResetToken, generateResetLink } = await import("../password");
      const { sendPasswordResetEmail } = await import("../email");

      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await db.savePasswordResetToken(user.id, resetToken, resetExpires);

      const protocol = (req.headers["x-forwarded-proto"] as string) || (req.secure ? "https" : "http");
      const host = (req.headers["x-forwarded-host"] as string) || (req.headers["host"] as string) || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;
      const resetLink = generateResetLink(resetToken, baseUrl);

      const sent = await sendPasswordResetEmail(email, resetLink);
      if (!sent) {
        return res.status(500).json({ success: false, error: "郵件發送失敗，請稍後重試" });
      }

      return res.json({ success: true, message: "密碼重置郵件已發送" });
    } catch (error: any) {
      console.error("[Auth] request-password-reset failed", error);
      return res.status(500).json({ success: false, error: error?.message || "Server error" });
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

