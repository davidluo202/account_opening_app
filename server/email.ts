import sgMail from '@sendgrid/mail';

// 初始化SendGrid
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.warn('SENDGRID_API_KEY is not set');
} else {
  sgMail.setApiKey(apiKey);
}

/**
 * 发送邮箱验证码
 * @param to 收件人邮箱
 * @param code 6位数字验证码
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  try {
    const msg = {
      to,
      from: 'noreply@cmfinancial.com', // 使用您的发件人邮箱
      subject: '誠港金融 - 郵箱驗證碼',
      text: `您的驗證碼是：${code}，有效期為5分鐘。請勿將此驗證碼告訴他人。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">誠港金融</h2>
          <p>您好，</p>
          <p>您正在進行郵箱驗證，您的驗證碼是：</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #dc2626; font-weight: bold;">此驗證碼有效期為5分鐘，請勿將此驗證碼告訴他人。</p>
          <p>如果您沒有請求此驗證碼，請忽略此郵件。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">此郵件由系統自動發送，請勿回覆。</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`Verification code sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
    return false;
  }
}

/**
 * 生成6位数字验证码
 * @returns 6位数字字符串
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
