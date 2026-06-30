/**
 * /api/backup - Database backup to S3
 * GET ?action=trigger&secret=xxx - Trigger backup (called by AWS Lambda)
 * GET ?action=status - Check last backup status
 */
delete process.env.DATABASE_URL;

import pg from 'pg';
const { Pool } = pg;

const RAILWAY_URL = 'postgresql://postgres:XCBgJFsPbtJgiaCGaKgQXxnnhTJzyusL@switchyard.proxy.rlwy.net:45054/railway';
const pool = new Pool({ connectionString: RAILWAY_URL, ssl: { rejectUnauthorized: false } });
pool.on('connect', (client) => { client.query("SET timezone = 'Asia/Hong_Kong'"); });

const BACKUP_SECRET = process.env.BACKUP_SECRET || 'cmf-backup-2026';
const AWS_KEY = process.env.AWS_BACKUP_KEY || '';
const AWS_SECRET = process.env.AWS_BACKUP_SECRET || '';
const S3_BUCKET = 'cmf-backup-hk';
const S3_REGION = 'ap-southeast-1';

async function uploadToS3(key, body) {
  const date = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const dateShort = date.slice(0, 8);
  const host = `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

  // Use fetch with AWS Signature V4 (simplified for PUT)
  const { createHmac, createHash } = await import('crypto');

  const payloadHash = createHash('sha256').update(body).digest('hex');
  const method = 'PUT';
  const canonicalUri = `/${key}`;
  const canonicalQueryString = '';
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${date}\nx-amz-server-side-encryption:AES256\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date;x-amz-server-side-encryption';

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateShort}/${S3_REGION}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${credentialScope}\n${createHash('sha256').update(canonicalRequest).digest('hex')}`;

  const kDate = createHmac('sha256', `AWS4${AWS_SECRET}`).update(dateShort).digest();
  const kRegion = createHmac('sha256', kDate).update(S3_REGION).digest();
  const kService = createHmac('sha256', kRegion).update('s3').digest();
  const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${AWS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': date,
      'x-amz-server-side-encryption': 'AES256',
      'Authorization': authorization,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`S3 upload failed: ${res.status} ${errText}`);
  }
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, secret } = req.query;

  if (action === 'trigger') {
    if (secret !== BACKUP_SECRET) return res.status(403).json({ error: 'Invalid secret' });
    if (!AWS_KEY || !AWS_SECRET) return res.status(500).json({ error: 'AWS credentials not configured' });

    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const tables = [
        'clients', 'portal_users', 'fund_transactions', 'client_balances',
        'rfqs', 'trades', 'client_statements', 'margin_records',
        'mtm_valuations', 'mtm_daily_summary', 'bank_transactions',
        'reconciliation_adjustments', 'otc_system_config'
      ];

      const backup = { backupDate: dateStr, backupTime: now.toISOString(), tables: {} };
      for (const table of tables) {
        try {
          const result = await pool.query(`SELECT * FROM ${table}`);
          backup.tables[table] = { rowCount: result.rowCount, rows: result.rows };
        } catch (e) {
          backup.tables[table] = { error: e.message, rowCount: 0, rows: [] };
        }
      }

      const body = JSON.stringify(backup);
      const key = `daily-backup/${dateStr}/cmf-db-${dateStr}.json`;
      await uploadToS3(key, body);

      const summary = Object.entries(backup.tables).map(([t, d]) => `${t}:${d.rowCount}`).join(', ');
      return res.json({ success: true, date: dateStr, key, sizeKB: Math.round(body.length / 1024), summary });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ error: 'action=trigger&secret=xxx required' });
}
