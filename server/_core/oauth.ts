import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
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

      let user = await db.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: "邮箱或密码错误" });
        }
      } else {
        // Allow legacy auto-created test users to login with any password temporarily,
        // but it's better to force them to reset. Given the prompt "my password is correct but system says no",
        // maybe David has a password but there was an issue, or he didn't have one and login failed?
        // Actually, let's enforce password check. If they don't have a password, they MUST reset it or re-register.
        return res.status(401).json({ error: "该账号为验证码注册，尚未设置密码，请点击下方「忘记密码」设置新密码。" });
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
        return res.json({ success: true, message: "如果该邮箱存在，您将收到密码重置邮件" });
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
        return res.status(500).json({ success: false, error: "邮件发送失败，请稍后重试" });
      }

      return res.json({ success: true, message: "密码重置邮件已发送" });
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

