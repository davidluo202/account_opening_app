/**
 * PDF生成模块 v6 (使用puppeteer替代manus-md-to-pdf)
 */
import puppeteer from 'puppeteer';

/**
 * 格式化金额（添加千分号）
 */
const formatAmount = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  
  // 如果是字符串（金额区间），直接返回
  if (typeof amount === 'string') {
    // 如果包含'-'，说明是区间，格式化每个数字
    if (amount.includes('-')) {
      const [min, max] = amount.split('-').map(s => s.trim());
      const minNum = parseFloat(min);
      const maxNum = parseFloat(max);
      if (!isNaN(minNum) && !isNaN(maxNum)) {
        return `HKD ${minNum.toLocaleString('en-US')} - ${maxNum.toLocaleString('en-US')}`;
      }
    }
    // 如果是单个数字字符串
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      return `HKD ${num.toLocaleString('en-US')}`;
    }
    return amount;
  }
  
  return `HKD ${amount.toLocaleString('en-US')}`;
};

/**
 * 格式化日期
 */
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-HK');
};

/**
 * 格式化时间戳（精确到秒）
 */
const formatTimestamp = (timestamp: string | Date | null | undefined): string => {
  if (!timestamp) return 'N/A';
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return d.toLocaleString('zh-HK', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/**
 * 生成申请表PDF
 * @param data 完整的申请数据
 * @returns PDF Buffer
 */
export async function generateApplicationPDF(data: any): Promise<Buffer> {
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
      font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #fff;
    }
    
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 10px;
      color: #1a5490;
    }
    
    h2 {
      text-align: center;
      font-size: 18px;
      margin-bottom: 5px;
      color: #1a5490;
    }
    
    h3 {
      text-align: center;
      font-size: 14px;
      margin-bottom: 20px;
      color: #666;
    }
    
    h4 {
      font-size: 14px;
      margin: 15px 0 10px 0;
      color: #1a5490;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    
    .app-number {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin: 20px 0;
      padding: 10px;
      background: #f5f5f5;
      border: 1px solid #ddd;
    }
    
    .section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    .declaration {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-left: 4px solid #1a5490;
    }
    
    .declaration p {
      margin: 8px 0;
    }
    
    .signature-box {
      margin: 20px 0;
      padding: 15px;
      border: 2px solid #1a5490;
      background: #f5f9ff;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 10px;
    }
    
    hr {
      border: none;
      border-top: 2px solid #1a5490;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>誠港金融股份有限公司</h1>
  <h2>客戶開戶申請表（個人/聯名）</h2>
  <h3>Customer Account Opening Form (Ind/Joint)</h3>
  
  <div class="app-number">
    申請編號 Application Number: ${data.applicationNumber || 'N/A'}
    <br>
    申請狀態 Status: ${data.status === 'submitted' ? '已提交 Submitted' : data.status === 'draft' ? '草稿 Draft' : data.status || 'N/A'}
  </div>
  
  <hr>
  
  <div class="section">
    <h4>個人基本信息 Personal Basic Information</h4>
    <table>
      <tr>
        <th>中文姓名<br>Chinese Name</th>
        <td>${data.basicInfo?.chineseName || 'N/A'}</td>
        <th>英文姓名<br>English Name</th>
        <td>${data.basicInfo?.englishName || 'N/A'}</td>
      </tr>
      <tr>
        <th>性別<br>Gender</th>
        <td>${data.basicInfo?.gender === 'male' ? '男 Male' : data.basicInfo?.gender === 'female' ? '女 Female' : 'N/A'}</td>
        <th>出生日期<br>Date of Birth</th>
        <td>${formatDate(data.basicInfo?.dateOfBirth)}</td>
      </tr>
      <tr>
        <th>出生地點<br>Place of Birth</th>
        <td>${data.basicInfo?.placeOfBirth || 'N/A'}</td>
        <th>國籍<br>Nationality</th>
        <td>${data.basicInfo?.nationality || 'N/A'}</td>
      </tr>
    </table>
  </div>
  
  <div class="section">
    <h4>個人詳細信息 Personal Detailed Information</h4>
    <table>
      <tr>
        <th>證件類型<br>ID Type</th>
        <td>${data.detailedInfo?.idType === 'hkid' ? '香港身份證 HKID' : data.detailedInfo?.idType === 'passport' ? '護照 Passport' : data.detailedInfo?.idType === 'chinaid' ? '大陸身份證 China ID' : 'N/A'}</td>
        <th>證件號碼<br>ID Number</th>
        <td>${data.detailedInfo?.idNumber || 'N/A'}</td>
      </tr>
      <tr>
        <th>證件簽發地<br>Issuing Place</th>
        <td>${data.detailedInfo?.idIssuingPlace || 'N/A'}</td>
        <th>證件有效期<br>Expiry Date</th>
        <td>${formatDate(data.detailedInfo?.idExpiryDate)}</td>
      </tr>
      <tr>
        <th>婚姻狀況<br>Marital Status</th>
        <td>${data.detailedInfo?.maritalStatus || 'N/A'}</td>
        <th>教育程度<br>Education Level</th>
        <td>${data.detailedInfo?.educationLevel || 'N/A'}</td>
      </tr>
      <tr>
        <th>居住地址<br>Residential Address</th>
        <td colspan="3">${data.detailedInfo?.residentialAddress || 'N/A'}</td>
      </tr>
      <tr>
        <th>郵寄地址<br>Mailing Address</th>
        <td colspan="3">${data.detailedInfo?.mailingAddress || 'N/A'}</td>
      </tr>
      <tr>
        <th>電話號碼<br>Phone Number</th>
        <td>${data.detailedInfo?.phoneCountryCode || ''} ${data.detailedInfo?.phoneNumber || 'N/A'}</td>
        <th>電子郵箱<br>Email</th>
        <td>${data.detailedInfo?.email || 'N/A'}</td>
      </tr>
    </table>
  </div>
  
  ${data.occupation ? `
  <div class="section">
    <h4>職業信息 Occupation Information</h4>
    <table>
      <tr>
        <th>僱傭狀況<br>Employment Status</th>
        <td>${data.occupation?.employmentStatus || 'N/A'}</td>
        <th>公司名稱<br>Company Name</th>
        <td>${data.occupation?.companyName || 'N/A'}</td>
      </tr>
      <tr>
        <th>職位<br>Position</th>
        <td>${data.occupation?.position || 'N/A'}</td>
        <th>行業<br>Industry</th>
        <td>${data.occupation?.industry || 'N/A'}</td>
      </tr>
      <tr>
        <th>公司地址<br>Company Address</th>
        <td colspan="3">${data.occupation?.companyAddress || 'N/A'}</td>
      </tr>
      <tr>
        <th>公司電話<br>Office Phone</th>
        <td>${data.occupation?.officePhoneCountryCode || ''} ${data.occupation?.officePhoneNo || 'N/A'}</td>
        <th>公司傳真<br>Office Fax</th>
        <td>${data.occupation?.officeFaxNo || 'N/A'}</td>
      </tr>
    </table>
  </div>
  ` : ''}
  
  ${data.financial ? `
  <div class="section">
    <h4>財務狀況 Financial Information</h4>
    <table>
      <tr>
        <th>年收入<br>Annual Income</th>
        <td>${formatAmount(data.financial?.annualIncome)}</td>
        <th>淨資產<br>Net Worth</th>
        <td>${formatAmount(data.financial?.netWorth)}</td>
      </tr>
      <tr>
        <th>流動資產<br>Liquid Asset</th>
        <td>${formatAmount(data.financial?.liquidAsset)}</td>
        <th>預計投資金額<br>Expected Investment</th>
        <td>${formatAmount(data.financial?.expectedInvestmentAmount)}</td>
      </tr>
      <tr>
        <th>收入來源<br>Source of Income</th>
        <td colspan="3">${data.financial?.sourceOfIncome || 'N/A'}</td>
      </tr>
    </table>
  </div>
  ` : ''}
  
  ${data.bankAccounts && data.bankAccounts.length > 0 ? `
  <div class="section">
    <h4>銀行賬戶信息 Bank Account Information</h4>
    <table>
      <tr>
        <th>銀行名稱<br>Bank Name</th>
        <th>賬戶號碼<br>Account Number</th>
        <th>賬戶持有人<br>Account Holder</th>
        <th>銀行所在地<br>Bank Location</th>
      </tr>
      ${data.bankAccounts.map((account: any) => `
      <tr>
        <td>${account.bankName || 'N/A'}</td>
        <td>${account.accountNumber || 'N/A'}</td>
        <td>${account.accountHolderName || 'N/A'}</td>
        <td>${account.bankLocation || 'N/A'}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  ` : ''}
  
  ${data.faceVerification?.verified ? `
  <div class="section">
    <h4>人臉識別驗證 Face Verification</h4>
    <table>
      <tr>
        <th>驗證狀態<br>Verification Status</th>
        <td>已驗證 Verified</td>
        <th>驗證時間<br>Verification Time</th>
        <td>${formatTimestamp(data.faceVerification?.verifiedAt)}</td>
      </tr>
      ${data.faceVerification?.verificationData ? `
      <tr>
        <th>置信度<br>Confidence</th>
        <td colspan="3">${(JSON.parse(data.faceVerification.verificationData).confidence || 0).toFixed(2)}%</td>
      </tr>
      ` : ''}
    </table>
  </div>
  ` : ''}
  
  <div class="section">
    <h4>申請人聲明及簽署 Applicant Declaration and Signature</h4>
    
    <div class="declaration">
      <p><strong>客戶聲明 Customer Declaration</strong></p>
      <p>本人聲明以上所填寫的資料均屬真實、準確和完整，並同意遵守貴公司的條款及細則。本人也明白並同意以下聲明：</p>
      <p>I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company. I also understand and agree to the following declarations:</p>
      
      <p style="margin-top: 15px;"><strong>1. 電子簽署聲明 Electronic Signature Declaration</strong></p>
      <p>• 本人同意使用電子簽署方式簽署本申請表，並明白此電子簽署具有與手寫簽名同等的法律效力。</p>
      <p>• I agree to use electronic signature to sign this application form and understand that this electronic signature has the same legal effect as a handwritten signature.</p>
      <p>• 本電子簽署的效力以香港《電子交易條例》（第553章）對「電子簽署」的定義為基準。</p>
      <p>• The validity of this electronic signature is based on the definition of "electronic signature" in the Electronic Transactions Ordinance (Cap. 553) of Hong Kong.</p>
      
      <p style="margin-top: 15px;"><strong>2. 反洗錢聲明 Anti-Money Laundering Declaration</strong></p>
      <p>• 本人確認本人的資金來源合法，並同意遵守香港《打擊洗錢及恐怖分子資金籌集條例》及相關監管規定。</p>
      <p>• I confirm that my source of funds is legitimate and agree to comply with the Anti-Money Laundering and Counter-Terrorist Financing Ordinance of Hong Kong and related regulatory requirements.</p>
      
      <p style="margin-top: 15px;"><strong>3. 資料使用同意 Data Usage Consent</strong></p>
      <p>• 本人同意貴公司收集、使用和儲存本人的個人資料以處理本申請及提供相關服務。</p>
      <p>• I agree that the company may collect, use and store my personal data to process this application and provide related services.</p>
    </div>
    
    <div class="signature-box">
      <table>
        <tr>
          <th>簽署人姓名<br>Signatory Name</th>
          <td>${data.signatureName || data.basicInfo?.englishName || 'N/A'}</td>
        </tr>
        <tr>
          <th>簽署方式<br>Signature Method</th>
          <td>${data.signatureMethod === 'iamsmart' ? 'iAM Smart 智方便' : data.signatureMethod === 'typed' ? '輸入姓名 Typed Name' : 'N/A'}</td>
        </tr>
        <tr>
          <th>簽署時間<br>Signature Timestamp</th>
          <td>${formatTimestamp(data.signatureTimestamp || data.submittedAt)}</td>
        </tr>
      </table>
      <p style="margin-top: 15px; text-align: center; font-size: 16px;">
        <strong>電子簽署 Electronic Signature:</strong> ${data.signatureName || data.basicInfo?.englishName || '_______________________________'}
      </p>
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

  // 使用puppeteer生成PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    await browser.close();
    throw error;
  }
}
