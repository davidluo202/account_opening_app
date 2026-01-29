import { describe, it, expect } from 'vitest';
import { generateVerificationCode, sendVerificationCode } from './email';

describe('邮件服务测试', () => {
  it('应该能够生成6位数字验证码', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(code.length).toBe(6);
  });

  it('应该能够验证SendGrid API密钥配置', async () => {
    // 检查环境变量是否配置
    expect(process.env.SENDGRID_API_KEY).toBeDefined();
    expect(process.env.SENDGRID_API_KEY).not.toBe('');
  });

  // 注意：实际发送邮件的测试需要真实的邮箱地址，这里仅测试API密钥配置
  // 如果需要测试实际发送，请取消注释以下测试并替换为真实邮箱
  /*
  it('应该能够发送验证码邮件', async () => {
    const testEmail = 'your-test-email@example.com';
    const code = generateVerificationCode();
    const result = await sendVerificationCode(testEmail, code);
    expect(result).toBe(true);
  }, 10000);
  */
});
