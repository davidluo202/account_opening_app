/**
 * PDF生成模块 v5 (添加电子签署记录和法律声明)
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

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

  // 格式化时间戳（精确到秒）
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

  // 生成Markdown内容
  const markdown = `
# 誠港金融股份有限公司
## 客戶開戶申請表（個人/聯名）
### Customer Account Opening Form (Ind/Joint)

---

**申請編號 Application Number:** ${data.applicationNumber || 'N/A'}

---

## 個人基本信息 Personal Basic Information

| 項目 | 內容 | 項目 | 內容 |
|------|------|------|------|
| **中文姓名** Chinese Name | ${data.basicInfo?.chineseName || 'N/A'} | **英文姓名** English Name | ${data.basicInfo?.englishName || 'N/A'} |
| **性別** Gender | ${data.basicInfo?.gender === 'male' ? '男 Male' : data.basicInfo?.gender === 'female' ? '女 Female' : 'N/A'} | **出生日期** Date of Birth | ${formatDate(data.basicInfo?.dateOfBirth)} |
| **出生地點** Place of Birth | ${data.basicInfo?.placeOfBirth || 'N/A'} | **國籍** Nationality | ${data.basicInfo?.nationality || 'N/A'} |

---

## 個人詳細信息 Personal Detailed Information

| 項目 | 內容 | 項目 | 內容 |
|------|------|------|------|
| **證件類型** ID Type | ${data.detailedInfo?.idType === 'hkid' ? '香港身份證 HKID' : data.detailedInfo?.idType === 'passport' ? '護照 Passport' : data.detailedInfo?.idType === 'chinaid' ? '大陸身份證 China ID' : 'N/A'} | **證件號碼** ID Number | ${data.detailedInfo?.idNumber || 'N/A'} |
| **證件簽發地** Issuing Place | ${data.detailedInfo?.idIssuingPlace || 'N/A'} | **證件有效期** Expiry Date | ${formatDate(data.detailedInfo?.idExpiryDate)} |
| **婚姻狀況** Marital Status | ${data.detailedInfo?.maritalStatus || 'N/A'} | **教育程度** Education Level | ${data.detailedInfo?.educationLevel || 'N/A'} |

| 項目 | 內容 |
|------|------|
| **居住地址** Residential Address | ${data.detailedInfo?.residentialAddress || 'N/A'} |
| **郵寄地址** Mailing Address | ${data.detailedInfo?.mailingAddress || 'N/A'} |

| 項目 | 內容 | 項目 | 內容 |
|------|------|------|------|
| **電話號碼** Phone Number | ${data.detailedInfo?.phoneCountryCode || ''} ${data.detailedInfo?.phoneNumber || 'N/A'} | **電子郵箱** Email | ${data.detailedInfo?.email || 'N/A'} |

---

${data.occupation ? `
## 職業信息 Occupation Information

| 項目 | 內容 | 項目 | 內容 |
|------|------|------|------|
| **僱傭狀況** Employment Status | ${data.occupation?.employmentStatus || 'N/A'} | **公司名稱** Company Name | ${data.occupation?.companyName || 'N/A'} |
| **職位** Position | ${data.occupation?.position || 'N/A'} | **行業** Industry | ${data.occupation?.industry || 'N/A'} |

| 項目 | 內容 |
|------|------|
| **公司地址** Company Address | ${data.occupation?.companyAddress || 'N/A'} |
| **公司電話** Office Phone | ${data.occupation?.officePhoneCountryCode || ''} ${data.occupation?.officePhoneNo || 'N/A'} |
| **公司傳真** Office Fax | ${data.occupation?.officeFaxNo || 'N/A'} |

---
` : ''}

${data.financial ? `
## 財務狀況 Financial Information

| 項目 | 內容 | 項目 | 內容 |
|------|------|------|------|
| **年收入** Annual Income | HKD ${formatAmount(data.financial?.annualIncome)} | **淨資產** Net Worth | HKD ${formatAmount(data.financial?.netWorth)} |
| **收入來源** Source of Income | ${data.financial?.sourceOfIncome || 'N/A'} | **預計投資金額** Expected Investment | HKD ${formatAmount(data.financial?.expectedInvestmentAmount)} |

---
` : ''}

${data.bankAccounts && data.bankAccounts.length > 0 ? `
## 銀行賬戶信息 Bank Account Information

| 銀行名稱 Bank Name | 賬戶號碼 Account Number | 賬戶持有人 Account Holder | 銀行所在地 Bank Location |
|-------------------|------------------------|-------------------------|------------------------|
${data.bankAccounts.map((account: any) => `| ${account.bankName || 'N/A'} | ${account.accountNumber || 'N/A'} | ${account.accountHolderName || 'N/A'} | ${account.bankLocation || 'N/A'} |`).join('\n')}

---
` : ''}

## 申請人聲明及簽署 Applicant Declaration and Signature

### 客戶聲明 Customer Declaration

本人聲明以上所填寫的資料均屬真實、準確和完整，並同意遵守貴公司的條款及細則。本人也明白並同意以下聲明：

I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company. I also understand and agree to the following declarations:

#### 1. 電子簽署聲明 Electronic Signature Declaration

- 本人同意使用電子簽署方式簽署本申請表，並明白此電子簽署具有與手寫簽名同等的法律效力。
- I agree to use electronic signature to sign this application form and understand that this electronic signature has the same legal effect as a handwritten signature.
- 本電子簽署的效力以香港《電子交易條例》（第553章）對「電子簽署」的定義為基準。
- The validity of this electronic signature is based on the definition of "electronic signature" in the Electronic Transactions Ordinance (Cap. 553) of Hong Kong.

#### 2. 反洗錢聲明 Anti-Money Laundering Declaration

- 本人確認本人的資金來源合法，並同意遵守香港《打擊洗錢及恐怖分子資金籌集條例》及相關監管規定。
- I confirm that my source of funds is legitimate and agree to comply with the Anti-Money Laundering and Counter-Terrorist Financing Ordinance of Hong Kong and related regulatory requirements.
- 本人同意貴公司可根據監管要求進行客戶盡職調查（CDD）和持續監控。
- I agree that the company may conduct Customer Due Diligence (CDD) and ongoing monitoring in accordance with regulatory requirements.

#### 3. 資料使用同意 Data Usage Consent

- 本人同意貴公司收集、使用和儲存本人的個人資料以處理本申請及提供相關服務。
- I agree that the company may collect, use and store my personal data to process this application and provide related services.

---

### 電子簽署記錄 Electronic Signature Record

| 項目 Item | 內容 Details |
|-----------|--------------|
| **簽署人姓名** Signatory Name | ${data.signatureName || data.basicInfo?.englishName || 'N/A'} |
| **簽署方式** Signature Method | ${data.signatureMethod === 'iamsmart' ? 'iAM Smart 智方便' : data.signatureMethod === 'typed' ? '輸入姓名 Typed Name' : 'N/A'} |
| **簽署時間** Signature Timestamp | ${formatTimestamp(data.signatureTimestamp || data.submittedAt)} |

**電子簽署：** ${data.signatureName || data.basicInfo?.englishName || '_______________________________'}

---

<div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
<p>誠港金融股份有限公司 CM Financial Limited</p>
<p>此文件由系統自動生成 This document is generated automatically by the system</p>
<p>生成時間 Generated at: ${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</p>
</div>
`;

  // 创建临时文件
  const tmpDir = os.tmpdir();
  const mdFile = path.join(tmpDir, `application-${Date.now()}.md`);
  const pdfFile = path.join(tmpDir, `application-${Date.now()}.pdf`);

  try {
    // 写入Markdown文件
    await fs.writeFile(mdFile, markdown, 'utf-8');

    // 使用manus-md-to-pdf命令生成PDF
    await execAsync(`manus-md-to-pdf "${mdFile}" "${pdfFile}"`);

    // 读取PDF文件
    const pdfBuffer = await fs.readFile(pdfFile);

    // 清理临时文件
    await fs.unlink(mdFile).catch(() => {});
    await fs.unlink(pdfFile).catch(() => {});

    return pdfBuffer;
  } catch (error) {
    // 清理临时文件
    await fs.unlink(mdFile).catch(() => {});
    await fs.unlink(pdfFile).catch(() => {});
    throw error;
  }
}
