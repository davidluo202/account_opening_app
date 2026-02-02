/**
 * PDF生成模块 v7 (使用PDFKit替代puppeteer)
 */
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import * as path from 'path';
import * as fs from 'fs';

// 使用項目根目錄的絕對路徑（更可靠）
// process.cwd() 返回 Node.js 進程的當前工作目錄，即項目根目錄
const PROJECT_ROOT = process.cwd();
const FONT_PATH_SC = path.join(PROJECT_ROOT, 'server', 'fonts', 'NotoSansCJKsc-Regular.otf');
const FONT_PATH_TC = path.join(PROJECT_ROOT, 'server', 'fonts', 'NotoSansCJKtc-Regular.otf');

// 預加載字體文件以確保存在
if (!fs.existsSync(FONT_PATH_SC)) {
  console.warn(`[PDF] Simplified Chinese font not found: ${FONT_PATH_SC}`);
}
if (!fs.existsSync(FONT_PATH_TC)) {
  console.warn(`[PDF] Traditional Chinese font not found: ${FONT_PATH_TC}`);
}

/**
 * 格式化日期
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-CN');
  } catch {
    return 'N/A';
  }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return d.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
  } catch {
    return 'N/A';
  }
}

/**
 * 格式化金额
 */
function formatAmount(amount: string | number | null | undefined): string {
  if (!amount) return 'N/A';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'N/A';
  return `HKD ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * 格式化金额區間
 */
function formatAmountRange(range: string | null | undefined): string {
  if (!range) return 'N/A';
  // 如果包含連字符，表示是區間
  if (range.includes('-')) {
    const parts = range.split('-');
    if (parts.length === 2) {
      const start = parseInt(parts[0]);
      const end = parts[1].includes('+') ? parts[1] : parseInt(parts[1]);
      if (!isNaN(start)) {
        if (typeof end === 'number' && !isNaN(end)) {
          return `HKD ${start.toLocaleString('en-US')} - ${end.toLocaleString('en-US')}`;
        } else if (typeof end === 'string' && end.includes('+')) {
          return `HKD ${start.toLocaleString('en-US')}+`;
        }
      }
    }
  }
  // 如果包含+號，表示以上
  if (range.includes('+')) {
    const num = parseInt(range.replace('+', ''));
    if (!isNaN(num)) {
      return `HKD ${num.toLocaleString('en-US')}+`;
    }
  }
  // 如果是單一數字，直接格式化
  const num = parseInt(range);
  if (!isNaN(num)) {
    return `HKD ${num.toLocaleString('en-US')}`;
  }
  return range;
}

// 翻译映射
const translations: Record<string, string> = {
  // 客户类型
  individual: '个人账户 Individual',
  joint: '联名账户 Joint',
  corporate: '机构账户 Corporate',
  
  // 账户类型
  cash: '现金账户 Cash',
  margin: '保证金账户 Margin',
  derivatives_account: '衡生品账户 Derivatives',
  
  // 性别
  male: '男 Male',
  female: '女 Female',
  other: '其他 Other',
  
  // 证件类型
  hkid: '香港身份证 HKID',
  passport: '护照 Passport',
  mainland_id: '中国大陆身份证 Mainland ID',
  'mainland-id': '中国大陆居民身份证 Mainland ID',
  'taiwan-id': '台湾居民身份证 Taiwan ID',
  'macao-id': '澳门居民身份证 Macao ID',
  
  // 婚姻状况
  single: '单身 Single',
  married: '已婚 Married',
  divorced: '离婚 Divorced',
  widowed: '丧偶 Widowed',
  
  // 教育程度
  high_school: '高中学历 High School',
  associate: '专科学历 Associate',
  bachelor: '本科学历 Bachelor',
  master: '硕士学历 Master',
  doctorate: '博士学历 Doctorate',
  primary: '小学学历 Primary',
  secondary: '中学学历 Secondary',
  
  // 就业状态
  employed: '受雇 Employed',
  self_employed: '自雇 Self-Employed',
  unemployed: '无业 Unemployed',
  retired: '退休 Retired',
  student: '学生 Student',
  
  // 银行账户类型
  saving: '储蓄账户 Saving',
  current: '支票账户 Current',
  
  // 投资经验
  none: '无经验 None',
  less_than_1: '少于1年 Less than 1 year',
  '1_to_3': '1-3 Years/年',
  '3_to_5': '3-5 Years/年',
  more_than_5: '5年以上 More than 5 years',
  
  // 投资产品
  stocks: '股票 Stocks',
  bonds: '债券 Bonds',
  funds: '基金 Funds',
  derivatives: '衡生品 Derivatives',
  forex: '外汇 Forex',
  commodities: '商品 Commodities',
  
  // 投资目标
  capital_growth: '资本增值 Capital Growth',
  income_generation: '收益生成 Income Generation',
  capital_preservation: '资本保值 Capital Preservation',
  speculation: '投机 Speculation',
  hedging: '对冲 Hedging',
  
  // 收入来源
  salary: '薪金 Salary',
  business_income: '营业收入 Business Income',
  investment_income: '投资收益 Investment Income',
  rental_income: '租金收入 Rental Income',
  pension: '养老金 Pension',
  inheritance: '继承财产 Inheritance',
  gift: '赠与 Gift',
  savings: '储蓄 Savings',
  
  // 风险等级
  R1: 'R1 - 低风险',
  R2: 'R2 - 中低风险',
  R3: 'R3 - 中风险',
  R4: 'R4 - 中高风险',
  R5: 'R5 - 高风险',
  
  // 币种
  HKD: '港币 HKD',
  USD: '美元 USD',
  CNY: '人民币 CNY',
  EUR: '欧元 EUR',
  GBP: '英镑 GBP',
  JPY: '日元 JPY',
  
  // 申请状态
  draft: '草稿 Draft',
  submitted: '已提交 Submitted',
  approved: '已批准 Approved',
  rejected: '已拒绝 Rejected',
};

const translate = (key: string | null | undefined): string => {
  if (!key) return 'N/A';
  return translations[key] || key;
};

/**
 * 格式化投资经验
 */
function formatInvestmentExperience(experience: string | Record<string, string> | null | undefined): string {
  if (!experience) return 'N/A';
  
  // 如果是字符串，尝试解析为JSON
  if (typeof experience === 'string') {
    try {
      const parsed = JSON.parse(experience);
      if (typeof parsed === 'object') {
        experience = parsed;
      }
    } catch (e) {
      return String(experience);
    }
  }
  
  // 如果是对象，格式化为列表
  if (typeof experience === 'object' && experience !== null) {
    const items = Object.entries(experience)
      .filter(([_, value]) => value && value !== 'none')
      .map(([key, value]) => {
        const productName = translate(key);
        const experienceLevel = translate(value as string);
        return `${productName}: ${experienceLevel}`;
      });
    
    return items.length > 0 ? items.join('; ') : 'N/A';
  }
  
  return String(experience);
}

export interface ApplicationPDFData {
  applicationNumber?: string | null;
  status?: string | null;
  accountSelection?: {
    customerType?: string | null;
    accountType?: string | null;
  };
  basicInfo?: {
    chineseName?: string | null;
    englishName?: string | null;
    gender?: string | null;
    dateOfBirth?: string | Date | null;
    placeOfBirth?: string | null;
    nationality?: string | null;
  };
  detailedInfo?: {
    idType?: string | null;
    idNumber?: string | null;
    idIssuingPlace?: string | null;
    idExpiryDate?: string | Date | null;
    idIsPermanent?: boolean | null;
    maritalStatus?: string | null;
    educationLevel?: string | null;
    residentialAddress?: string | null;
    phoneCountryCode?: string | null;
    phoneNumber?: string | null;
    faxNo?: string | null;
    email?: string | null;
  };
  occupation?: {
    employmentStatus?: string | null;
    companyName?: string | null;
    companyAddress?: string | null;
    position?: string | null;
    industry?: string | null;
    yearsOfService?: string | null;
    officePhone?: string | null;
    officeFaxNo?: string | null;
  };
  financial?: {
    incomeSource?: string | null;
    annualIncome?: string | null;
    netWorth?: string | null;
    liquidAsset?: string | null;
  };
  investment?: {
    investmentObjectives?: string | null;
    investmentExperience?: string | Record<string, string> | null;
    riskTolerance?: string | null;
  };
  bankAccounts?: Array<{
    bankName?: string | null;
    accountType?: string | null;
    currency?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
  }>;
  taxInfo?: {
    taxResidency?: string | null;
    taxIdNumber?: string | null;
  };
  uploadedDocuments?: Array<{
    documentType?: string | null;
    fileUrl?: string | null;
  }>;
  signatureName?: string | null;
  signatureMethod?: string | null;
  signatureTimestamp?: string | Date | null;
  submittedAt?: string | Date | null;
}

/**
 * 生成申请表PDF (使用PDFKit)
 */
export async function generateApplicationPDF(data: ApplicationPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 註冊中文字體
      try {
        if (fs.existsSync(FONT_PATH_TC)) {
          doc.registerFont('NotoSansCJK', FONT_PATH_TC);
          console.log('[PDF] Traditional Chinese font registered successfully');
        } else if (fs.existsSync(FONT_PATH_SC)) {
          doc.registerFont('NotoSansCJK', FONT_PATH_SC);
          console.log('[PDF] Simplified Chinese font registered successfully');
        } else {
          console.warn('[PDF] No Chinese font available, falling back to default');
        }
      } catch (error) {
        console.error('[PDF] Failed to register Chinese font:', error);
      }

      // 页眉（使用中文字體）
      doc.fontSize(18).font('NotoSansCJK').text('客户开户申请表（个人/联名）', { align: 'center' });
      doc.fontSize(14).font('NotoSansCJK').text('Customer Account Opening Form (Ind/Joint)', { align: 'center' });
      doc.moveDown(0.5);

      // 申请编号和状态
      doc.fontSize(10).font('NotoSansCJK');
      doc.text(`申请编号 Application Number: ${data.applicationNumber || 'N/A'}`);
      doc.text(`申请状态 Status: ${translate(data.status)}`);
      doc.moveDown(1);

      // 账户类型
      if (data.accountSelection) {
        doc.fontSize(12).font('NotoSansCJK').text('账户类型 Account Type');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        doc.text(`客户类型 Customer Type: ${translate(data.accountSelection.customerType)}`);
        doc.text(`账户类型 Account Type: ${translate(data.accountSelection.accountType)}`);
        doc.moveDown(1);
      }

      // 基本信息
      doc.fontSize(12).font('NotoSansCJK').text('1. 个人基本信息 Personal Basic Information');
      doc.moveDown(0.3);
      doc.fontSize(10).font('NotoSansCJK');
      
      if (data.basicInfo) {
        const bi = data.basicInfo;
        doc.text(`中文姓名 Name (Chinese): ${bi.chineseName || 'N/A'}`);
        doc.text(`英文姓名 Name (English): ${bi.englishName || 'N/A'}`);
        doc.text(`性别 Gender: ${translate(bi.gender)}`);
        doc.text(`出生日期 Date of Birth: ${formatDate(bi.dateOfBirth)}`);
        doc.text(`出生地 Place of Birth: ${bi.placeOfBirth || 'N/A'}`);
        doc.text(`国籍 Nationality: ${bi.nationality || 'N/A'}`);
      }
      doc.moveDown(1);

      // 详细信息
      doc.fontSize(12).font('NotoSansCJK').text('2. 个人详细信息 Personal Detailed Information');
      doc.moveDown(0.3);
      doc.fontSize(10).font('NotoSansCJK');
      
      if (data.detailedInfo) {
        const di = data.detailedInfo;
        doc.text(`证件类型 ID Type: ${translate(di.idType)}`);
        doc.text(`证件号码 ID Number: ${di.idNumber || 'N/A'}`);
        doc.text(`签发地 Issuing Place: ${di.idIssuingPlace || 'N/A'}`);
        doc.text(`有效期 Expiry Date: ${di.idIsPermanent ? '长期有效 Permanent' : formatDate(di.idExpiryDate)}`);
        doc.text(`婚姻状况 Marital Status: ${translate(di.maritalStatus)}`);
        doc.text(`学历 Education: ${translate(di.educationLevel)}`);
        doc.text(`电子邮箱 Email: ${di.email || 'N/A'}`);
        doc.text(`电话 Phone: ${di.phoneCountryCode || ''}${di.phoneNumber || 'N/A'}`);
        doc.text(`传真 Fax: ${di.faxNo || 'N/A'}`);
        doc.text(`住宅地址 Residential Address: ${di.residentialAddress || 'N/A'}`);
      }
      doc.moveDown(1);

      // 职业信息
      if (data.occupation) {
        doc.fontSize(12).font('NotoSansCJK').text('3. 职业信息 Occupation Information');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        const oc = data.occupation;
        doc.text(`就业状况 Employment Status: ${translate(oc.employmentStatus)}`);
        
        if (oc.employmentStatus === 'employed' || oc.employmentStatus === 'self_employed') {
          doc.text(`公司名称 Company Name: ${oc.companyName || 'N/A'}`);
          doc.text(`职位 Position: ${oc.position || 'N/A'}`);
          doc.text(`从业年限 Years of Service: ${oc.yearsOfService || 'N/A'}`);
          doc.text(`行业 Industry: ${oc.industry || 'N/A'}`);
          doc.text(`办公地址 Office Address: ${oc.companyAddress || 'N/A'}`);
          doc.text(`办公电话 Office Phone: ${oc.officePhone || 'N/A'}`);
          doc.text(`办公传真 Office Fax: ${oc.officeFaxNo || 'N/A'}`);
        }
        doc.moveDown(1);
      }

      // 财务状况
      if (data.financial) {
        doc.fontSize(12).font('NotoSansCJK').text('4. 财务状况 Financial Status');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        const fi = data.financial;
        doc.text(`收入来源 Income Source: ${fi.incomeSource || 'N/A'}`);
        doc.text(`年收入 Annual Income: ${formatAmountRange(fi.annualIncome)}`);
        doc.text(`流动资产 Liquid Asset: ${formatAmountRange(fi.liquidAsset)}`);
        doc.text(`净资产 Net Worth: ${formatAmountRange(fi.netWorth)}`);
        doc.moveDown(1);
      }

      // 投资信息
      if (data.investment) {
        doc.fontSize(12).font('NotoSansCJK').text('5. 投资信息 Investment Information');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        const inv = data.investment;
        doc.text(`投资目的 Investment Objective: ${inv.investmentObjectives || 'N/A'}`);
        doc.text(`投资经验 Investment Experience: ${formatInvestmentExperience(inv.investmentExperience)}`);
        doc.text(`风险承受能力 Risk Tolerance: ${inv.riskTolerance || 'N/A'}`);
        doc.moveDown(1);
      }

      // 银行账户
      if (data.bankAccounts && data.bankAccounts.length > 0) {
        doc.fontSize(12).font('NotoSansCJK').text('6. 银行账户 Bank Account');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        data.bankAccounts.forEach((account, index) => {
          doc.text(`账户 ${index + 1}:`);
          doc.text(`  银行名称 Bank Name: ${account.bankName || 'N/A'}`);
          doc.text(`  账户类型 Account Type: ${translate(account.accountType)}`);
          doc.text(`  币种 Currency: ${account.currency || 'N/A'}`);
          doc.text(`  账号 Account Number: ${account.accountNumber || 'N/A'}`);
          doc.text(`  持有人 Holder Name: ${account.accountHolderName || 'N/A'}`);
          doc.moveDown(0.5);
        });
        doc.moveDown(0.5);
      }

      // 税务信息
      if (data.taxInfo) {
        doc.fontSize(12).font('NotoSansCJK').text('7. 税务信息 Tax Information');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        doc.text(`  税务居民身份 Tax Residency: ${data.taxInfo.taxResidency || 'N/A'}`);
        doc.text(`  税务识别号 Tax ID Number: ${data.taxInfo.taxIdNumber || 'N/A'}`);
        doc.moveDown(0.5);
      }

      // 上传文件清单
      if (data.uploadedDocuments && data.uploadedDocuments.length > 0) {
        doc.fontSize(12).font('NotoSansCJK').text('8. 上传文件清单 Uploaded Documents');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        data.uploadedDocuments.forEach((doc_item, index) => {
          const docTypeTranslated = translate(doc_item.documentType);
          doc.text(`  ${index + 1}. ${docTypeTranslated}`);
          if (doc_item.fileUrl) {
            doc.fontSize(8).fillColor('blue').text(`     下载链接 Download: ${doc_item.fileUrl}`);
            doc.fillColor('black').fontSize(10);
          }
        });
        doc.moveDown(0.5);
      }

      // 签名声明
      doc.fontSize(12).font('NotoSansCJK').text('申请人声明及签署 Applicant Declaration and Signature');
      doc.moveDown(0.3);
      doc.fontSize(9).font('NotoSansCJK');
      
      doc.text('客户声明 Customer Declaration:');
      doc.fontSize(8);
      doc.text('I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company.');
      doc.text('本人声明以上所填写的资料均属真实、准确和完整，并同意遵守贵公司的条款及细则。');
      doc.moveDown(0.5);
      
      doc.fontSize(9);
      doc.text('电子签署声明 Electronic Signature Declaration:');
      doc.fontSize(8);
      doc.text('I agree to use electronic signature to sign this application form and understand that this electronic signature has the same legal effect as a handwritten signature.');
      doc.text('本人同意使用电子签署方式签署本申请表，并明白此电子签署具有与手写签名同等的法律效力。');
      doc.moveDown(0.5);
      
      doc.fontSize(9).font('NotoSansCJK');
      doc.text(`签名 Signature: ${data.signatureName || 'N/A'}`);
      doc.text(`签署方式 Signature Method: Typed / 输入`);
      doc.text(`签署时间 Signature Timestamp: ${formatTimestamp(data.signatureTimestamp)}`);
      doc.moveDown(1);

      // 页脚
      doc.fontSize(8).font('NotoSansCJK');
      doc.text('诚港金融股份有限公司 CM Financial Limited', { align: 'center' });
      doc.text('此文件由系统自动生成 This document is generated automatically by the system', { align: 'center' });
      doc.text(`生成时间 Generated at: ${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
