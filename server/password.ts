import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * 密码加密和验证工具函数
 */

/**
 * 加密密码
 * @param password 明文密码
 * @returns 加密后的密码hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 存储的密码hash
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成密码重置令牌
 * @returns 32字节的随机hex字符串
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 生成密码重置链接
 * @param token 重置令牌
 * @param baseUrl 网站基础URL
 * @returns 完整的重置链接
 */
export function generateResetLink(token: string, baseUrl: string): string {
  // 移除baseUrl的尾部斜杠
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/reset-password?token=${token}`;
}
