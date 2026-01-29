/**
 * PDF生成模块 (使用html-pdf-node，支持中文)
 */
// @ts-ignore
import htmlPdf from 'html-pdf-node';

/**
 * 生成申请表PDF
 * @param data 完整的申请数据
 * @returns PDF Buffer
 */
export async function generateApplicationPDF(data: any): Promise<Buffer> {
  // 格式化金额（添加千分号）
  const formatAmount = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'N/A';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 格式化日期
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-HK');
  };

  // 生成HTML内容
  const html = `
<!DOCTYPE html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>客戶開戶申請表</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "Microsoft YaHei", "微软雅黑", "SimSun", "宋体", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 24px;
      color: #2563eb;
      margin-bottom: 5px;
    }
    
    .header h2 {
      font-size: 18px;
      color: #666;
      font-weight: normal;
    }
    
    .application-number {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 10px 15px;
      margin-bottom: 20px;
      font-size: 14px;
      font-weight: bold;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      background-color: #f3f4f6;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 10px;
      border-left: 4px solid #2563eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .info-item {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .info-item.full-width {
      grid-column: 1 / -1;
    }
    
    .info-label {
      color: #6b7280;
      font-size: 11px;
      margin-bottom: 3px;
    }
    
    .info-value {
      color: #1f2937;
      font-size: 12px;
      font-weight: 500;
    }
    
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    
    .signature-box {
      border: 1px solid #d1d5db;
      padding: 15px;
      margin-top: 10px;
      min-height: 80px;
    }
    
    .signature-line {
      border-top: 1px solid #9ca3af;
      margin-top: 50px;
      padding-top: 5px;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    table th, table td {
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: left;
    }
    
    table th {
      background-color: #f3f4f6;
      font-weight: bold;
      font-size: 11px;
    }
    
    table td {
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>誠港金融股份有限公司</h1>
    <h2>客戶開戶申請表（個人/聯名）</h2>
    <h2 style="font-size: 14px; margin-top: 5px;">Customer Account Opening Form (Ind/Joint)</h2>
  </div>
  
  <div class="application-number">
    申請編號 Application Number: ${data.applicationNumber || 'N/A'}
  </div>
  
  <!-- 個人基本信息 -->
  <div class="section">
    <div class="section-title">個人基本信息 Personal Basic Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">中文姓名 Chinese Name</div>
        <div class="info-value">${data.basicInfo?.chineseName || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">英文姓名 English Name</div>
        <div class="info-value">${data.basicInfo?.englishName || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">性別 Gender</div>
        <div class="info-value">${data.basicInfo?.gender === 'male' ? '男 Male' : data.basicInfo?.gender === 'female' ? '女 Female' : 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">出生日期 Date of Birth</div>
        <div class="info-value">${formatDate(data.basicInfo?.dateOfBirth)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">出生地點 Place of Birth</div>
        <div class="info-value">${data.basicInfo?.placeOfBirth || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">國籍 Nationality</div>
        <div class="info-value">${data.basicInfo?.nationality || 'N/A'}</div>
      </div>
    </div>
  </div>
  
  <!-- 個人詳細信息 -->
  <div class="section">
    <div class="section-title">個人詳細信息 Personal Detailed Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">證件類型 ID Type</div>
        <div class="info-value">${data.detailedInfo?.idType === 'hkid' ? '香港身份證 HKID' : data.detailedInfo?.idType === 'passport' ? '護照 Passport' : data.detailedInfo?.idType === 'chinaid' ? '大陸身份證 China ID' : 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">證件號碼 ID Number</div>
        <div class="info-value">${data.detailedInfo?.idNumber || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">證件簽發地 Issuing Place</div>
        <div class="info-value">${data.detailedInfo?.idIssuingPlace || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">證件有效期 Expiry Date</div>
        <div class="info-value">${formatDate(data.detailedInfo?.idExpiryDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">婚姻狀況 Marital Status</div>
        <div class="info-value">${data.detailedInfo?.maritalStatus || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">教育程度 Education Level</div>
        <div class="info-value">${data.detailedInfo?.educationLevel || 'N/A'}</div>
      </div>
      <div class="info-item full-width">
        <div class="info-label">居住地址 Residential Address</div>
        <div class="info-value">${data.detailedInfo?.residentialAddress || 'N/A'}</div>
      </div>
      <div class="info-item full-width">
        <div class="info-label">郵寄地址 Mailing Address</div>
        <div class="info-value">${data.detailedInfo?.mailingAddress || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">電話號碼 Phone Number</div>
        <div class="info-value">${data.detailedInfo?.phoneCountryCode || ''} ${data.detailedInfo?.phoneNumber || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">電子郵箱 Email</div>
        <div class="info-value">${data.detailedInfo?.email || 'N/A'}</div>
      </div>
    </div>
  </div>
  
  <!-- 職業信息 -->
  ${data.occupation ? `
  <div class="section">
    <div class="section-title">職業信息 Occupation Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">僱傭狀況 Employment Status</div>
        <div class="info-value">${data.occupation?.employmentStatus || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">公司名稱 Company Name</div>
        <div class="info-value">${data.occupation?.companyName || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">職位 Position</div>
        <div class="info-value">${data.occupation?.position || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">行業 Industry</div>
        <div class="info-value">${data.occupation?.industry || 'N/A'}</div>
      </div>
      <div class="info-item full-width">
        <div class="info-label">公司地址 Company Address</div>
        <div class="info-value">${data.occupation?.companyAddress || 'N/A'}</div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- 財務狀況 -->
  ${data.financial ? `
  <div class="section">
    <div class="section-title">財務狀況 Financial Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">年收入 Annual Income</div>
        <div class="info-value">HKD ${formatAmount(data.financial?.annualIncome)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">淨資產 Net Worth</div>
        <div class="info-value">HKD ${formatAmount(data.financial?.netWorth)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">收入來源 Source of Income</div>
        <div class="info-value">${data.financial?.sourceOfIncome || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">預計投資金額 Expected Investment</div>
        <div class="info-value">HKD ${formatAmount(data.financial?.expectedInvestmentAmount)}</div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- 銀行賬戶 -->
  ${data.bankAccounts && data.bankAccounts.length > 0 ? `
  <div class="section">
    <div class="section-title">銀行賬戶信息 Bank Account Information</div>
    <table>
      <thead>
        <tr>
          <th>銀行名稱 Bank Name</th>
          <th>賬戶號碼 Account Number</th>
          <th>賬戶持有人 Account Holder</th>
          <th>銀行所在地 Bank Location</th>
        </tr>
      </thead>
      <tbody>
        ${data.bankAccounts.map((account: any) => `
          <tr>
            <td>${account.bankName || 'N/A'}</td>
            <td>${account.accountNumber || 'N/A'}</td>
            <td>${account.accountHolderName || 'N/A'}</td>
            <td>${account.bankLocation || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <!-- 簽名 -->
  <div class="signature-section">
    <div class="section-title">申請人聲明及簽署 Applicant Declaration and Signature</div>
    <p style="margin: 10px 0; font-size: 11px; color: #6b7280;">
      本人聲明以上所填寫的資料均屬真實、準確和完整，並同意遵守貴公司的條款及細則。
      I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company.
    </p>
    <div class="signature-box">
      <div style="margin-bottom: 60px;">
        <strong>申請人簽名 Applicant Signature:</strong> _______________________________
      </div>
      <div>
        <strong>簽署日期 Date:</strong> ${formatDate(data.submittedAt || new Date())}
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>誠港金融股份有限公司 CM Financial Limited</p>
    <p>此文件由系統自動生成 This document is generated automatically by the system</p>
    <p>生成時間 Generated at: ${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</p>
  </div>
</body>
</html>
  `;

  // 生成PDF
  const file = { content: html };
  const options = {
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm',
    },
  };

  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  return pdfBuffer;
}
