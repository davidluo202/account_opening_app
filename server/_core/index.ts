import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerFileRoutes } from "./files";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { syncMissingTables } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Sync database schema for newly added tables
  await syncMissingTables();

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // DB migration diagnostic endpoint
  app.get("/api/db-migrate", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.json({ error: "no db" });

      const results: string[] = [];

      // Check which columns exist
      const [cols]: any = await db.execute(sql`SHOW COLUMNS FROM \`corporate_financial_info\``);
      const existingCols = Array.isArray(cols) ? cols.map((c: any) => c.Field || c.field) : [];
      results.push(`existing columns: ${JSON.stringify(existingCols)}`);

      const needed = ["assetItemsOther", "experiencedProducts", "experiencedProductsOther"];
      for (const col of needed) {
        if (!existingCols.includes(col)) {
          try {
            await db.execute(sql.raw(`ALTER TABLE \`corporate_financial_info\` ADD COLUMN \`${col}\` text DEFAULT NULL`));
            results.push(`added: ${col}`);
          } catch (e: any) {
            results.push(`failed to add ${col}: ${e?.message || e}`);
          }
        } else {
          results.push(`exists: ${col}`);
        }
      }

      // Ensure client_declarations table exists
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS \`client_declarations\` (
            \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            \`applicationId\` int NOT NULL UNIQUE,
            \`q1Licensed\` varchar(10) NOT NULL DEFAULT '',
            \`q1CeNo\` varchar(100) NOT NULL DEFAULT '',
            \`q2Intermediary\` varchar(10) NOT NULL DEFAULT '',
            \`q2Name\` varchar(200) NOT NULL DEFAULT '',
            \`q2IdPassport\` varchar(100) NOT NULL DEFAULT '',
            \`q2Address\` text DEFAULT NULL,
            \`q3ClientOfCmf\` varchar(10) NOT NULL DEFAULT '',
            \`q3Details\` text DEFAULT NULL,
            \`q4StaffOfCmf\` varchar(10) NOT NULL DEFAULT '',
            \`q4Details\` text DEFAULT NULL,
            \`q5RelationshipWithStaff\` varchar(10) NOT NULL DEFAULT '',
            \`q5Details\` text DEFAULT NULL,
            \`q6ExchangeParticipant\` varchar(10) NOT NULL DEFAULT '',
            \`q6DirectorName\` varchar(200) NOT NULL DEFAULT '',
            \`q6InstitutionName\` varchar(200) NOT NULL DEFAULT '',
            \`q6ParticipateNo\` varchar(100) NOT NULL DEFAULT '',
            \`q6StaffNamePosition\` varchar(200) NOT NULL DEFAULT '',
            \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        results.push("client_declarations: CREATE OK");
      } catch (e: any) {
        results.push(`client_declarations CREATE ERROR: ${e?.message || e}`);
      }

      // Check if table has old schema and needs rebuild
      try {
        const [cdCheck]: any = await db.execute(sql`SHOW COLUMNS FROM \`client_declarations\``);
        const cols = Array.isArray(cdCheck) ? cdCheck.map((c: any) => c.Field || c.field) : [];
        if (cols.includes('q3Relative') && !cols.includes('q3ClientOfCmf')) {
          // Old schema detected — drop and recreate
          await db.execute(sql`DROP TABLE \`client_declarations\``);
          await db.execute(sql`
            CREATE TABLE \`client_declarations\` (
              \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
              \`applicationId\` int NOT NULL UNIQUE,
              \`q1Licensed\` varchar(10) NOT NULL DEFAULT '',
              \`q1CeNo\` varchar(100) NOT NULL DEFAULT '',
              \`q2Intermediary\` varchar(10) NOT NULL DEFAULT '',
              \`q2Name\` varchar(200) NOT NULL DEFAULT '',
              \`q2IdPassport\` varchar(100) NOT NULL DEFAULT '',
              \`q2Address\` text DEFAULT NULL,
              \`q3ClientOfCmf\` varchar(10) NOT NULL DEFAULT '',
              \`q3Details\` text DEFAULT NULL,
              \`q4StaffOfCmf\` varchar(10) NOT NULL DEFAULT '',
              \`q4Details\` text DEFAULT NULL,
              \`q5RelationshipWithStaff\` varchar(10) NOT NULL DEFAULT '',
              \`q5Details\` text DEFAULT NULL,
              \`q6ExchangeParticipant\` varchar(10) NOT NULL DEFAULT '',
              \`q6DirectorName\` varchar(200) NOT NULL DEFAULT '',
              \`q6InstitutionName\` varchar(200) NOT NULL DEFAULT '',
              \`q6ParticipateNo\` varchar(100) NOT NULL DEFAULT '',
              \`q6StaffNamePosition\` varchar(200) NOT NULL DEFAULT '',
              \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
              \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `);
          results.push("client_declarations: REBUILT with new schema");
        }
      } catch (e: any) {
        results.push(`client_declarations rebuild error: ${e?.message || e}`);
      }

      // Show actual columns of client_declarations
      try {
        const [cdCols]: any = await db.execute(sql`SHOW COLUMNS FROM \`client_declarations\``);
        const cdColNames = Array.isArray(cdCols) ? cdCols.map((c: any) => c.Field || c.field) : [];
        results.push(`client_declarations columns: ${JSON.stringify(cdColNames)}`);
      } catch (e: any) {
        results.push(`client_declarations SHOW COLUMNS ERROR: ${e?.message || e}`);
      }

      // Show personal_detailed_info columns
      try {
        const [pdiCols]: any = await db.execute(sql`SHOW COLUMNS FROM \`personal_detailed_info\``);
        const pdiColNames = Array.isArray(pdiCols) ? pdiCols.map((c: any) => c.Field || c.field) : [];
        results.push(`personal_detailed_info columns: ${JSON.stringify(pdiColNames)}`);
      } catch (e: any) {
        results.push(`personal_detailed_info ERROR: ${e?.message || e}`);
      }

      // Add occupation_info columns for mobile/address
      for (const col of ['mobilePhone VARCHAR(50)', 'phoneCountryCode VARCHAR(10)', 'correspondenceAddress TEXT']) {
        const colName = col.split(' ')[0];
        try {
          await db.execute(sql.raw(`ALTER TABLE \`occupation_info\` ADD COLUMN \`${colName}\` ${col.slice(colName.length + 1)}`));
          results.push(`occupation_info: added ${colName}`);
        } catch { results.push(`occupation_info: ${colName} exists`); }
      }

      // Expand employmentStatus enum
      try {
        await db.execute(sql.raw(`ALTER TABLE \`occupation_info\` MODIFY COLUMN \`employmentStatus\` ENUM('employed','self_employed','retired','student','housewife','others','unemployed') NOT NULL`));
        results.push('occupation_info: employmentStatus enum updated');
      } catch (e: any) { results.push(`occupation_info enum: ${e?.message}`); }

      // Create customer_declarations table (for personalClientDeclaration)
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS \`customer_declarations\` (
            \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            \`applicationId\` int NOT NULL UNIQUE,
            \`declaration_a_is_beneficial_owner\` tinyint(1) NOT NULL DEFAULT 0,
            \`declaration_a_owner_name\` varchar(200) DEFAULT NULL,
            \`declaration_a_owner_id\` varchar(100) DEFAULT NULL,
            \`declaration_a_owner_country\` varchar(100) DEFAULT NULL,
            \`declaration_a_owner_address\` text DEFAULT NULL,
            \`declaration_b_is_employee\` tinyint(1) NOT NULL DEFAULT 0,
            \`declaration_b_institution_name\` varchar(300) DEFAULT NULL,
            \`declaration_c_is_cmf_employee\` tinyint(1) NOT NULL DEFAULT 0,
            \`declaration_d_is_relative\` tinyint(1) NOT NULL DEFAULT 0,
            \`declaration_d_employee_name\` varchar(200) DEFAULT NULL,
            \`declaration_d_relationship\` varchar(100) DEFAULT NULL,
            \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
          )
        `);
        results.push('customer_declarations: CREATE OK');
      } catch (e: any) { results.push(`customer_declarations: ${e?.message}`); }

      // Show occupation_info columns
      try {
        const [oiCols]: any = await db.execute(sql`SHOW COLUMNS FROM \`occupation_info\``);
        results.push(`occupation_info columns: ${JSON.stringify(Array.isArray(oiCols) ? oiCols.map((c: any) => c.Field) : [])}`);
      } catch {}

      // Add objectsDirectMarketing to regulatory_declarations
      try {
        await db.execute(sql.raw("ALTER TABLE `regulatory_declarations` ADD COLUMN `objectsDirectMarketing` tinyint(1) NOT NULL DEFAULT 0"));
        results.push('regulatory_declarations: added objectsDirectMarketing');
      } catch (e: any) { results.push(`regulatory_declarations: objectsDirectMarketing ${e?.message?.includes('Duplicate') ? 'exists' : e?.message}`); }

      res.json({ ok: true, results });
    } catch (e: any) {
      res.json({ error: e?.message || String(e) });
    }
  });

  // Debug endpoint to check actual DB data
  app.get("/api/db-debug/:appId", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.json({ error: "no db" });
      const appId = parseInt(req.params.appId);
      const [rows]: any = await db.execute(sql.raw(`SELECT * FROM corporate_financial_info WHERE applicationId = ${appId}`));
      res.json({ row: rows?.[0] || null });
    } catch (e: any) {
      res.json({ error: e?.message || String(e) });
    }
  });

  // User/application debug
  app.get("/api/db-users", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.json({ error: "no db" });
      const [users]: any = await db.execute(sql`SELECT id, email, name, createdAt FROM users ORDER BY id DESC LIMIT 20`);
      const [apps]: any = await db.execute(sql`SELECT id, userId, applicationNumber, status, submittedAt FROM applications ORDER BY id DESC LIMIT 20`);
      res.json({ users, applications: apps });
    } catch (e: any) {
      res.json({ error: e?.message || String(e) });
    }
  });

  // Auth routes
  registerOAuthRoutes(app);
  // File download (signed link → presigned S3 url)
  registerFileRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // In Vercel Serverless, we must NOT bind/listen/scan ports.
  // Just return the Express app and let the platform invoke it.
  if (process.env.VERCEL) {
    console.log(`Running in Vercel Serverless mode`);
    return app;
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  return app;
}

const appPromise = startServer().catch(console.error);
export default async function (req: any, res: any) {
  const app = await appPromise;
  if (app) {
    app(req, res);
  } else {
    res.status(500).send("Server failed to initialize");
  }
}

