/**
 * PDF生成模块 (使用manus-md-to-pdf命令行工具，完美支持中文)
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

本人聲明以上所填寫的資料均屬真實、準確和完整，並同意遵守貴公司的條款及細則。

I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company.

**申請人簽名 Applicant Signature:** _______________________________

**簽署日期 Date:** ${formatDate(data.submittedAt || new Date())}

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
