import { Resend } from 'resend';

// 初始化Resend
const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
const senderEmail = process.env.RESEND_SENDER_EMAIL || process.env.SENDGRID_SENDER_EMAIL || 'quote@cmf-otc.com';

const resend = apiKey ? new Resend(apiKey) : null;

if (!apiKey) {
  console.warn('RESEND_API_KEY is not set');
} else {
  console.log(`Resend initialized with sender: ${senderEmail}`);
}

/**
 * 发送邮箱验证码
 * @param to 收件人邮箱
 * @param code 6位数字验证码
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  if (!resend || !apiKey) {
    throw new Error('Resend API密钥未配置');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to,
      subject: "誠港金融 - 郵箱驗證碼",
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
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log(`Verification code sent to ${to}, id: ${data?.id}`);
    return true;
  } catch (error: any) {
    console.error('Resend error:', error);
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

// Helper function to send email via Resend
async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend || !apiKey) {
    throw new Error('Resend API密钥未配置');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log(`Email sent to ${to}, id: ${data?.id}`);
    return true;
  } catch (error: any) {
    console.error('Resend error:', error);
    return false;
  }
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
  customerGender?: string | null,
  pdfUrl?: string
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  try {
    const msg = {
      to,
      from: senderEmail,
      subject: `誠港金融 - 開戶申請確認函 (申請編號：${applicationNumber})`,
      text: `尊敬的${customerName}${customerGender === 'male' ? '先生' : customerGender === 'female' ? '女士' : '先生/女士'}，

感謝您選擇誠港金融股份有限公司。

我們已收到您的開戶申請（申請編號：${applicationNumber}）。您的申請資料已提交成功，我們的客戶服務團隊將在1-2個工作日內審核您的申請並與您聯繫。

請查閱附件中的申請表PDF文件，確認您提交的所有信息準確無誤。如有任何疑問或需要修改，請及時與我們聯繫。

重要提示：
- 請妥善保管您的申請編號，以便日後查詢
- 我們可能會通過電話或郵件與您聯繫，以核實部分信息
- 請確保您提供的聯繫方式暢通

如有任何疑問，歡迎隨時聯系我們：
電話：852-2598-1700
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
            
            <p style="color: #374151;">尊敬的 <strong>${customerName}</strong> ${customerGender === 'male' ? '先生' : customerGender === 'female' ? '女士' : '先生/女士'}，</p>
            
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
              <p style="color: #6b7280; margin: 5px 0;">電話：852-2598-1700</p>
              <p style="color: #6b7280; margin: 5px 0;">郵箱：onboarding@cmfinancial.com</p>
            </div>
            
            <div style="margin-top: 30px;">
              <p style="color: #374151; margin: 5px 0;">此致</p>
              <p style="color: #374151; margin: 5px 0; font-weight: bold;">誠港金融股份有限公司</p>
              <p style="color: #6b7280; margin: 5px 0;">客戶服務部</p>
            </div>
          </div>
          
          ${pdfUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              下載申請表PDF / Download Application PDF
            </a>
          </div>
          ` : ''}
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            此郵件由系統自動發送，請勿回覆。
          </p>
        </div>
      `,
    };
    
    // 添加详细日志
    console.log(`[Customer Email] Preparing to send email to ${to}`);
    console.log(`[Customer Email] PDF URL: ${pdfUrl || 'Not provided'}`);
    
    try {
      await sendViaResend(to, subject, html);
      console.log(`Customer confirmation email sent to ${to} with PDF download link`);
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
  pdfUrl?: string
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
          
          ${pdfUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              下載申請表PDF / Download Application PDF
            </a>
          </div>
          ` : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">此郵件由系統自動發送。</p>
        </div>
      `,
    };
    
    // 添加详细日志
    console.log(`[Internal Email] Preparing to send email to onboarding@cmfinancial.com`);
    console.log(`[Internal Email] PDF URL: ${pdfUrl || 'Not provided'}`);
    
    await sendViaResend(to, subject, html);
    console.log(`Internal notification email sent to onboarding@cmfinancial.com with PDF download link`);
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
 * 发送审批通过邮件到operation@cmfinancial.com
 * @param applicationNumber 申请编号
 * @param customerName 客户姓名
 * @param approverName 审批人员姓名
 * @param isProfessionalInvestor 是否为专业投资者
 * @param approvedRiskProfile 审批评定的风险等级
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendApprovalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  approverName: string,
  isProfessionalInvestor: boolean,
  approvedRiskProfile: string
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  const complianceEmail = 'compliance@cmfinancial.com';
  const operationEmail = 'operation@cmfinancial.com';

  const riskMap: Record<string, string> = {
    'low': '低风险',
    'medium': '中等风险',
    'high': '高风险'
  };

  try {
    const msg = {
      to: operationEmail,
      from: complianceEmail, // 使用compliance@cmfinancial.com作为发件人
      subject: `开户申请已批准 - ${applicationNumber}`,
      text: `申请编号：${applicationNumber}
客户姓名：${customerName}
审批人员：${approverName}
审批结果：批准
专业投资者（PI）：${isProfessionalInvestor ? '是' : '否'}
风险评级：${riskMap[approvedRiskProfile] || approvedRiskProfile}

请运营部门跟进后续开户流程。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">开户申请已批准</h2>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">申请编号：${applicationNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>客户姓名：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>审批人员：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>审批结果：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #16a34a; font-weight: bold;">批准</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>专业投资者（PI）：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${isProfessionalInvestor ? '是' : '否'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>风险评级：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${riskMap[approvedRiskProfile] || approvedRiskProfile}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">请运营部门跟进后续开户流程。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">此邮件由合规部门自动发送。</p>
        </div>
      `,
    };

    await sendViaResend(to, subject, html);
    console.log(`Approval notification sent to ${operationEmail} for application ${applicationNumber}`);
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
 * 发送审批拒绝邮件到onboard@cmfinancial.com
 * @param applicationNumber 申请编号
 * @param customerName 客户姓名
 * @param customerEmail 客户邮箱
 * @param approverName 审批人员姓名
 * @param rejectReason 拒绝理由
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendRejectionNotificationEmail(
  applicationNumber: string,
  customerName: string,
  customerEmail: string,
  approverName: string,
  rejectReason: string
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  const complianceEmail = 'compliance@cmfinancial.com';
  const customerServiceEmail = 'onboard@cmfinancial.com';

  try {
    const msg = {
      to: [customerEmail, customerServiceEmail], // 同时发送给客户和客服部
      from: complianceEmail, // 使用compliance@cmfinancial.com作为发件人
      subject: `开户申请已拒绝 - ${applicationNumber}`,
      text: `申请编号：${applicationNumber}
客户姓名：${customerName}
客户邮箱：${customerEmail}
审批人员：${approverName}
审批结果：拒绝
拒绝理由：${rejectReason}

请客户服务部门通知客户并提供必要的说明。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">开户申请已拒绝</h2>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">申请编号：${applicationNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>客户姓名：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>客户邮箱：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>审批人员：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>审批结果：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">拒绝</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">拒绝理由：</p>
            <p style="margin: 10px 0 0 0;">${rejectReason}</p>
          </div>
          <p style="margin-top: 20px;">请客户服务部门通知客户并提供必要的说明。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">此邮件由合规部门自动发送。</p>
        </div>
      `,
    };

    await sendViaResend(to, subject, html);
    console.log(`Rejection notification sent to ${customerServiceEmail} for application ${applicationNumber}`);
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
 * 发送审批退回邮件到onboard@cmfinancial.com
 * @param applicationNumber 申请编号
 * @param customerName 客户姓名
 * @param customerEmail 客户邮箱
 * @param approverName 审批人员姓名
 * @param returnReason 退回理由
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendReturnNotificationEmail(
  applicationNumber: string,
  customerName: string,
  customerEmail: string,
  approverName: string,
  returnReason: string
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  const complianceEmail = 'compliance@cmfinancial.com';
  const customerServiceEmail = 'onboard@cmfinancial.com';

  try {
    const msg = {
      to: [customerEmail, customerServiceEmail], // 同时发送给客户和客服部
      from: complianceEmail, // 使用compliance@cmfinancial.com作为发件人
      subject: `开户申请需补充材料 - ${applicationNumber}`,
      text: `申请编号：${applicationNumber}
客户姓名：${customerName}
客户邮箱：${customerEmail}
审批人员：${approverName}
审批结果：退回补充材料
退回理由：${returnReason}

请客户服务部门通知客户补充所需材料。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ea580c;">开户申请需补充材料</h2>
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">申请编号：${applicationNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>客户姓名：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>客户邮箱：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>审批人员：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>审批结果：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #ea580c; font-weight: bold;">退回补充材料</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">需要补充的材料：</p>
            <p style="margin: 10px 0 0 0;">${returnReason}</p>
          </div>
          <p style="margin-top: 20px;">请客户服务部门通知客户补充所需材料。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">此邮件由合规部门自动发送。</p>
        </div>
      `,
    };

    await sendViaResend(to, subject, html);
    console.log(`Return notification sent to ${customerServiceEmail} for application ${applicationNumber}`);
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
 * 发送密码重置邮件
 * @param to 收件人邮箱
 * @param resetLink 密码重置链接
 * @returns Promise<boolean> 发送成功返回true，失败返回false
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密钥未配置');
  }

  try {
    const msg = {
      to,
      from: senderEmail,
      subject: "誠港金融 - 密碼重置",
      text: `您好，

我們收到了您的密碼重置請求。請點擊以下鏈接重置您的密碼：

${resetLink}

此鏈接將在1小時後過期。如果您沒有請求重置密碼，請忽略此郵件。

誠港金融股份有限公司
客戶服務團隊`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">誠港金融</h2>
          <p>您好，</p>
          <p>我們收到了您的密碼重置請求。請點擊以下按鈕重置您的密碼：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">重置密碼</a>
          </div>
          <p>或複製以下鏈接到瀏覽器：</p>
          <p style="background-color: #f3f4f6; padding: 10px; word-break: break-all; font-size: 12px;">${resetLink}</p>
          <p style="color: #dc2626; font-weight: bold;">此鏈接將在1小時後過期。</p>
          <p>如果您沒有請求重置密碼，請忽略此郵件。您的密碼將保持不變。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            誠港金融股份有限公司<br>
            客戶服務團隊<br>
            此郵件由系統自動發送，請勿回覆。
          </p>
        </div>
      `,
    };

    await sendViaResend(to, subject, html);
    console.log(`Password reset email sent to ${to}`);
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
 * 發送第一級審批通過通知郵件到合規部
 * @param applicationNumber 申請編號
 * @param customerName 客戶姓名
 * @param firstApproverName 第一級審批人員姓名
 * @param firstApproverCeNo 第一級審批人員CE號碼
 * @param isProfessionalInvestor 是否為專業投資者
 * @param approvedRiskProfile 審批的風險偏好
 * @returns Promise<boolean> 發送成功返回true，失敗返回false
 */
export async function sendFirstApprovalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  firstApproverName: string,
  firstApproverCeNo: string,
  isProfessionalInvestor: boolean,
  approvedRiskProfile: string
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密鑰未配置');
  }

  const complianceEmail = 'compliance@cmfinancial.com';

  const riskMap: Record<string, string> = {
    'low': '低風險',
    'medium': '中等風險',
    'high': '高風險'
  };

  try {
    const msg = {
      to: complianceEmail,
      from: senderEmail,
      subject: `【待終審】開戶申請第一級審批已通過 - ${applicationNumber}`,
      text: `申請編號：${applicationNumber}
客戶姓名：${customerName}
第一級審批人員：${firstApproverName}（CE No.: ${firstApproverCeNo}）
審批結果：第一級審批通過
專業投資者（PI）：${isProfessionalInvestor ? '是' : '否'}
風險評級：${riskMap[approvedRiskProfile] || approvedRiskProfile}

請登錄系統進行第二級審批（終審）。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">誠港金融 - 開戶申請第一級審批通過通知</h2>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ 此申請需要您進行第二級審批（終審）</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">申請編號：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">客戶姓名：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">第一級審批人員：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${firstApproverName}（CE No.: ${firstApproverCeNo}）</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">審批結果：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><span style="color: #10b981; font-weight: bold;">✓ 第一級審批通過</span></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">專業投資者（PI）：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${isProfessionalInvestor ? '是' : '否'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">風險評級：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${riskMap[approvedRiskProfile] || approvedRiskProfile}</td>
            </tr>
          </table>
          <p style="margin: 20px 0;">請登錄系統查看完整申請資料並進行第二級審批（終審）。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">此郵件由系統自動發送，請勿回覆。</p>
        </div>
      `,
    };

    await sendViaResend(to, subject, html);
    console.log(`First approval notification sent to ${complianceEmail}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send first approval notification email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    return false;
  }
}

/**
 * 發送最終審批通過通知郵件到運營部
 * @param applicationNumber 申請編號
 * @param customerName 客戶姓名
 * @param firstApproverName 第一級審批人員姓名
 * @param firstApproverCeNo 第一級審批人員CE號碼
 * @param secondApproverName 第二級審批人員姓名
 * @param secondApproverCeNo 第二級審批人員CE號碼（可能為空）
 * @param isProfessionalInvestor 是否為專業投資者
 * @param approvedRiskProfile 審批的風險偏好
 * @returns Promise<boolean> 發送成功返回true，失敗返回false
 */
export async function sendFinalApprovalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  firstApproverName: string,
  firstApproverCeNo: string,
  secondApproverName: string,
  secondApproverCeNo: string,
  isProfessionalInvestor: boolean,
  approvedRiskProfile: string,
  finalPdfUrl?: string
): Promise<boolean> {
  if (!apiKey) {
    throw new Error('SendGrid API密鑰未配置');
  }

  const operationEmail = 'operation@cmfinancial.com';
  const customerServiceEmail = 'onboard@cmfinancial.com';

  const riskMap: Record<string, string> = {
    'low': '低風險',
    'medium': '中等風險',
    'high': '高風險',
    'R1': 'R1 - 低風險',
    'R2': 'R2 - 中低風險',
    'R3': 'R3 - 中風險',
    'R4': 'R4 - 中高風險',
    'R5': 'R5 - 高風險'
  };

  try {
    const msg = {
      to: operationEmail,
      cc: customerServiceEmail,
      from: senderEmail,
      subject: `【已批准】開戶申請最終審批通過 - ${applicationNumber}`,
      text: `申請編號：${applicationNumber}
客戶姓名：${customerName}
第一級審批人員：${firstApproverName}（CE No.: ${firstApproverCeNo}）
第二級審批人員：${secondApproverName}${secondApproverCeNo ? `（CE No.: ${secondApproverCeNo}）` : ''}
審批結果：最終批准
專業投資者（PI）：${isProfessionalInvestor ? '是' : '否'}
風險評級：${riskMap[approvedRiskProfile] || approvedRiskProfile}

請進行後續的開立賬戶和發送Welcome letter的步驟。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">誠港金融 - 開戶申請最終審批通過通知</h2>
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #065f46;">✓ 此申請已通過兩級審批，可以進行後續開戶操作</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">申請編號：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">客戶姓名：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">第一級審批人員：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${firstApproverName}（CE No.: ${firstApproverCeNo}）</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">第二級審批人員：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${secondApproverName}${secondApproverCeNo ? `（CE No.: ${secondApproverCeNo}）` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">審批結果：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><span style="color: #10b981; font-weight: bold;">✓ 最終批准</span></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">專業投資者（PI）：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${isProfessionalInvestor ? '是' : '否'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">風險評級：</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${riskMap[approvedRiskProfile] || approvedRiskProfile}</td>
            </tr>
          </table>
          <p style="margin: 20px 0;">請進行後續的開立賬戶和發送Welcome letter的步驟。</p>
          ${finalPdfUrl ? `
          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">最終版PDF文件：</p>
            <a href="${finalPdfUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">下載最終版PDF</a>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">此PDF包含客戶提交、初審和終審的完整信息，用於內部存檔。</p>
          </div>
          ` : ''}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">此郵件由系統自動發送，請勿回覆。</p>
        </div>
      `,
    };

    await sendViaResend(to, subject, html);
    console.log(`Final approval notification sent to ${operationEmail}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send final approval notification email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    return false;
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resend || !apiKey) {
    throw new Error('Resend API密钥未配置');
  }

  try {
    await sendViaResend(to, subject, html);
    console.log(`Generic email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('Resend error:', error);
    return false;
  }
}
