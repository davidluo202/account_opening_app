import { describe, it, expect } from 'vitest';
import { validateHKBankAccount, validateCNBankAccount } from '../client/src/lib/validators';

describe('银行账户号码校验', () => {
  describe('香港银行账户校验', () => {
    it('应该接受有效的香港银行账户号码', () => {
      const result = validateHKBankAccount('123456789012');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝少于6位的账户号码', () => {
      const result = validateHKBankAccount('12345');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('6-12位');
    });

    it('应该拒绝超过12位的账户号码', () => {
      const result = validateHKBankAccount('1234567890123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('6-12位');
    });

    it('应该接受带连字符的账户号码', () => {
      const result = validateHKBankAccount('123-456-789');
      expect(result.valid).toBe(true);
    });

    it('应该校验汇丰银行账户为12位', () => {
      const result = validateHKBankAccount('12345678901', '汇丰银行');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('12位');
    });

    it('应该接受有效的汇丰银行账户', () => {
      const result = validateHKBankAccount('123456789012', 'HSBC');
      expect(result.valid).toBe(true);
    });
  });

  describe('大陆银行账户校验', () => {
    it('应该接受有效的大陆银行账户号码', () => {
      const result = validateCNBankAccount('6222021234567890123');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝少于16位的账户号码', () => {
      const result = validateCNBankAccount('123456789012345');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('16-19位');
    });

    it('应该拒绝超过19位的账户号码', () => {
      const result = validateCNBankAccount('12345678901234567890');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('16-19位');
    });

    it('应该校验工商银行账户为19位', () => {
      const result = validateCNBankAccount('622202123456789012', '工商银行');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('19位');
    });

    it('应该接受有效的工商银行账户', () => {
      const result = validateCNBankAccount('6222021234567890123', 'ICBC');
      expect(result.valid).toBe(true);
    });

    it('应该接受有效的建设银行账户', () => {
      const result = validateCNBankAccount('6227001234567890', 'CCB');
      expect(result.valid).toBe(true);
    });
  });
});
