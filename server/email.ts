import sgMail from '@sendgrid/mail';

// 初始化SendGrid
const apiKey = process.env.SENDGRID_API_KEY;
const senderEmail = process.env.SENDGRID_SENDER_EMAIL || 'noreply@cmfinancial.com';

if (!apiKey) {
  console.warn('SENDGRID_API_KEY is not set');
} else {
  sgMail.setApiKey(apiKey);
  console.log(`SendGrid initialized with sender: ${senderEmail}`);
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
      from: senderEmail, // 使用配置的发件人邮箱
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

/**
 * 发送客户确认邮件（申请提交后）
 * @param to 客户邮箱
 * @param applicationNumber 申请编号
 * @param customerName 客户姓名
 * @param pdfBuffer PDF文件的Buffer
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendCustomerConfirmationEmail(
  to: string,
  applicationNumber: string,
  customerName: string,
  pdfBuffer?: Buffer
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  try {
    const msg = {
      to,
      from: senderEmail,
      subject: `誠港金融 - 開戶申請確認函 (申請編號：${applicationNumber})`,
      text: `尊敬的${customerName}先生/女士，

感謝您選擇誠港金融股份有限公司。

我們已收到您的開戶申請（申請編號：${applicationNumber}）。您的申請資料已提交成功，我們的客戶服務團隊將在1-2個工作日內審核您的申請並與您聯繫。

請查閱附件中的申請表PDF文件，確認您提交的所有信息準確無誤。如有任何疑問或需要修改，請及時與我們聯繫。

重要提示：
- 請妥善保管您的申請編號，以便日後查詢
- 我們可能會通過電話或郵件與您聯繫，以核實部分信息
- 請確保您提供的聯繫方式暢通

如有任何疑問，歡迎隨時聯繫我們：
電話：+852 xxxx xxxx
郵箱：onboarding@cmfinancial.com

此致
誠港金融股份有限公司
客戶服務部

---
此郵件由系統自動發送，請勿回覆。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin-bottom: 20px;">誠港金融股份有限公司</h2>
            <h3 style="color: #1f2937; margin-bottom: 20px;">開戶申請確認函</h3>
            
            <p style="color: #374151;">尊敬的 <strong>${customerName}</strong> 先生/女士，</p>
            
            <p style="color: #374151; line-height: 1.6;">
              感謝您選擇誠港金融股份有限公司。
            </p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>申請編號：</strong>${applicationNumber}
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              我們已收到您的開戶申請。您的申請資料已提交成功，我們的客戶服務團隊將在<strong>1-2個工作日內</strong>審核您的申請並與您聯繫。
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
              請查閱附件中的申請表PDF文件，確認您提交的所有信息準確無誤。如有任何疑問或需要修改，請及時與我們聯繫。
            </p>
            
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">重要提示：</p>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>請妥善保管您的申請編號，以便日後查詢</li>
                <li>我們可能會通過電話或郵件與您聯繫，以核實部分信息</li>
                <li>請確保您提供的聯繫方式暢通</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 5px 0;">如有任何疑問，歡迎隨時聯繫我們：</p>
              <p style="color: #6b7280; margin: 5px 0;">電話：+852 xxxx xxxx</p>
              <p style="color: #6b7280; margin: 5px 0;">郵箱：onboarding@cmfinancial.com</p>
            </div>
            
            <div style="margin-top: 30px;">
              <p style="color: #374151; margin: 5px 0;">此致</p>
              <p style="color: #374151; margin: 5px 0; font-weight: bold;">誠港金融股份有限公司</p>
              <p style="color: #6b7280; margin: 5px 0;">客戶服務部</p>
            </div>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            此郵件由系統自動發送，請勿回覆。
          </p>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          content: pdfBuffer.toString('base64'),
          filename: `申請表_${applicationNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ] : undefined,
    };
    
    // 添加详细日志
    console.log(`[Customer Email] Preparing to send email to ${to}`);
    console.log(`[Customer Email] PDF Buffer exists: ${!!pdfBuffer}`);
    console.log(`[Customer Email] PDF Buffer size: ${pdfBuffer ? pdfBuffer.length : 0} bytes`);
    console.log(`[Customer Email] Has attachments: ${!!msg.attachments}`);
    if (msg.attachments) {
      console.log(`[Customer Email] Attachment count: ${msg.attachments.length}`);
      console.log(`[Customer Email] Attachment filename: ${msg.attachments[0].filename}`);
      console.log(`[Customer Email] Attachment base64 length: ${msg.attachments[0].content.length}`);
    }
    
    try {
      await sgMail.send(msg);
      console.log(`Customer confirmation email sent to ${to} with PDF attachment`);
      return true;
    } catch (error: any) {
      console.error('SendGrid error:', error);
      if (error.response) {
        console.error('SendGrid response:', error.response.body);
      }
      return false;
    }
  } catch (error: any) {
    console.error('Error in sendCustomerConfirmationEmail:', error);
    return false;
  }
}

/**
 * 发送内部通知邮件（发送到客服团队）
 * @param applicationNumber 申请编号
 * @param customerName 客户姓名
 * @param customerEmail 客户邮箱
 * @param pdfBuffer PDF文件的Buffer
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendInternalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  customerEmail: string,
  pdfBuffer?: Buffer
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  try {
    const msg = {
      to: 'onboarding@cmfinancial.com',
      from: senderEmail,
      subject: `新開戶申請 - ${applicationNumber} (${customerName})`,
      text: `新開戶申請通知

申請編號：${applicationNumber}
客戶姓名：${customerName}
客戶郵箱：${customerEmail}
提交時間：${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}

請查閱附件中的申請表PDF文件，並盡快處理此申請。

---
此郵件由系統自動發送。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">新開戶申請通知</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>申請編號：</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${applicationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>客戶姓名：</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>客戶郵箱：</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>提交時間：</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #374151;">請查閱附件中的申請表PDF文件，並盡快處理此申請。</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">此郵件由系統自動發送。</p>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          content: pdfBuffer.toString('base64'),
          filename: `${applicationNumber}_Application.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ] : undefined,
    };
    
    // 添加详细日志
    console.log(`[Internal Email] Preparing to send email to onboarding@cmfinancial.com`);
    console.log(`[Internal Email] PDF Buffer exists: ${!!pdfBuffer}`);
    console.log(`[Internal Email] PDF Buffer size: ${pdfBuffer ? pdfBuffer.length : 0} bytes`);
    console.log(`[Internal Email] Has attachments: ${!!msg.attachments}`);
    if (msg.attachments) {
      console.log(`[Internal Email] Attachment count: ${msg.attachments.length}`);
      console.log(`[Internal Email] Attachment filename: ${msg.attachments[0].filename}`);
      console.log(`[Internal Email] Attachment base64 length: ${msg.attachments[0].content.length}`);
    }
    
    await sgMail.send(msg);
    console.log(`Internal notification email sent to onboarding@cmfinancial.com with PDF attachment`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
    return false;
  }
}


