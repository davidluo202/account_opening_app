// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageProxyConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function getS3Config(): {
  bucket: string;
  region: string;
  publicBaseUrl?: string;
  endpoint?: string;
} | null {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;
  return {
    bucket,
    region: process.env.AWS_REGION || "ap-east-1",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
    endpoint: process.env.S3_ENDPOINT,
  };
}

function createS3Client(cfg: { region: string; endpoint?: string }) {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint || undefined,
  });
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // 1) Prefer S3 if configured (CMF-owned)
  const s3 = getS3Config();
  if (s3) {
    const client = createS3Client({ region: s3.region, endpoint: s3.endpoint });
    const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);

    await client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    const url = s3.publicBaseUrl
      ? `${s3.publicBaseUrl.replace(/\/+$/, "")}/${encodeURI(key)}`
      : `https://${s3.bucket}.s3.${s3.region}.amazonaws.com/${encodeURI(key)}`;

    return { key, url };
  }

  // 2) Fallback to legacy storage proxy (template). Requires BUILT_IN_FORGE_API_URL/KEY
  const proxy = getStorageProxyConfig();
  if (proxy) {
    const uploadUrl = buildUploadUrl(proxy.baseUrl, key);
    const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(proxy.apiKey),
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(
        `Storage upload failed (${response.status} ${response.statusText}): ${message}`
      );
    }
    const url = (await response.json()).url;
    return { key, url };
  }

  throw new Error(
    "Storage is not configured. Please set S3_BUCKET (+AWS credentials) for S3 uploads."
  );
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const proxy = getStorageProxyConfig();
  if (!proxy) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  const { baseUrl, apiKey } = proxy;
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
