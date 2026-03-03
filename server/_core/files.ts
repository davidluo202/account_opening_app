import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { ENV } from "./env";
import { storagePresignGet } from "../storage";

function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function getSecret(): string {
  // use the same secret used for sessions (fallback still ok for UAT)
  return ENV.cookieSecret || "fallback-secret-change-in-production";
}

/**
 * Signed, time-bounded download link.
 * The link points to our backend, which will mint a short-lived S3 presigned URL and redirect.
 */
export function buildSignedDownloadLink(baseUrl: string, key: string, ttlSeconds: number) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${key}:${exp}`;
  const sig = hmacSha256Hex(getSecret(), payload);
  const url = new URL("/api/files/download", baseUrl);
  url.searchParams.set("key", key);
  url.searchParams.set("exp", String(exp));
  url.searchParams.set("sig", sig);
  return url.toString();
}

export function registerFileRoutes(app: Express) {
  app.get("/api/files/download", async (req: Request, res: Response) => {
    try {
      const key = String(req.query.key || "");
      const exp = Number(req.query.exp || 0);
      const sig = String(req.query.sig || "");

      if (!key || !exp || !sig) {
        return res.status(400).send("Missing key/exp/sig");
      }

      const now = Math.floor(Date.now() / 1000);
      if (exp < now) {
        return res.status(410).send("Link expired");
      }

      const payload = `${key}:${exp}`;
      const expected = hmacSha256Hex(getSecret(), payload);
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
        return res.status(403).send("Invalid signature");
      }

      // Mint a short-lived presigned url each time the link is clicked
      const presigned = await storagePresignGet(key, 60 * 30); // 30 minutes
      return res.redirect(302, presigned);
    } catch (error) {
      console.error("[Files] download failed", error);
      return res.status(500).send("Download failed");
    }
  });
}
