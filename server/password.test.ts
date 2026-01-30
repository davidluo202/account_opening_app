import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateResetToken, generateResetLink } from './password';

describe('Password Utilities', () => {
  describe('hashPassword and verifyPassword', () => {
    it('should hash password and verify correctly', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      // Hash should be different from original password
      expect(hashed).not.toBe(password);
      
      // Should verify correct password
      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
      
      // Should reject incorrect password
      const isInvalid = await verifyPassword('wrongPassword', hashed);
      expect(isInvalid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('generateResetToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateResetToken();
      // 32 bytes = 64 hex characters
      expect(token).toHaveLength(64);
      // Should be valid hex string
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateResetLink', () => {
    it('should generate correct reset link', () => {
      const token = 'test-token-123';
      const baseUrl = 'https://example.com';
      const link = generateResetLink(token, baseUrl);
      
      expect(link).toBe('https://example.com/reset-password?token=test-token-123');
    });

    it('should handle baseUrl with trailing slash', () => {
      const token = 'test-token-123';
      const baseUrl = 'https://example.com/';
      const link = generateResetLink(token, baseUrl);
      
      expect(link).toBe('https://example.com/reset-password?token=test-token-123');
    });
  });
});
