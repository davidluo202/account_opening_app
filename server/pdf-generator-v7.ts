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
 * 翻译映射
 */
const translations: Record<string, string> = {
  // 性别
  male: '男 Male',
  female: '女 Female',
  other: '其他 Other',
  
  // 证件类型
  hkid: '香港身份證 HKID',
  passport: '護照 Passport',
  
  // 婚姻状况
  single: '單身 Single',
  married: '已婚 Married',
  divorced: '離婚 Divorced',
  widowed: '喪偶 Widowed',
  
  // 教育程度
  highschool: '高中 High School',
  bachelor: '學士 Bachelor',
  master: '碩士 Master',
  phd: '博士 PhD',
  
  // 就业状态
  employed: '受僱 Employed',
  selfEmployed: '自僱 Self-Employed',
  unemployed: '待業 Unemployed',
  retired: '退休 Retired',
  student: '學生 Student',
  
  // 申请状态
  draft: '草稿 Draft',
  submitted: '已提交 Submitted',
  approved: '已批准 Approved',
  rejected: '已拒絕 Rejected',
};

const translate = (key: string | null | undefined): string => {
  if (!key) return 'N/A';
  return translations[key] || key;
};

export interface ApplicationPDFData {
  applicationNumber?: string | null;
  status?: string | null;
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
    maritalStatus?: string | null;
    educationLevel?: string | null;
    residentialAddress?: string | null;
    mailingAddress?: string | null;
    phoneCountryCode?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
  };
  occupation?: {
    employmentStatus?: string | null;
    companyName?: string | null;
    companyAddress?: string | null;
    position?: string | null;
    industry?: string | null;
    yearsEmployed?: number | null;
    officePhoneCountryCode?: string | null;
    officePhoneNumber?: string | null;
    officeFaxNo?: string | null;
  };
  financial?: {
    annualIncome?: string | null;
    netWorth?: string | null;
    liquidAsset?: string | null;
    sourceOfIncome?: string | null;
    expectedInvestmentAmount?: number | null;
  };
  investmentExperience?: {
    stocksExperience?: number | null;
    bondsExperience?: number | null;
    futuresExperience?: number | null;
    optionsExperience?: number | null;
  };
  bankAccounts?: Array<{
    bankName?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    bankLocation?: string | null;
  }>;
  faceVerification?: {
    verified?: boolean;
    verifiedAt?: string | Date | null;
    verificationData?: string | null;
  };
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
      doc.fontSize(18).font('NotoSansCJK').text('Customer Account Opening Application', { align: 'center' });
      doc.fontSize(16).font('NotoSansCJK').text('客户开户申请表', { align: 'center' });
      doc.moveDown(0.5);

      // 申请编号和状态
      doc.fontSize(10).font('NotoSansCJK');
      doc.text(`Application Number / 申请编号: ${data.applicationNumber || 'N/A'}`, { continued: true });
      doc.text(`     Status / 状态: ${translate(data.status)}`, { align: 'left' });
      doc.moveDown(1);

      // 基本信息
      doc.fontSize(14).font('NotoSansCJK').text('Basic Information / 基本信息');
      doc.moveDown(0.3);
      doc.fontSize(10).font('NotoSansCJK');
      
      if (data.basicInfo) {
        const bi = data.basicInfo;
        doc.text(`Chinese Name / 中文姓名: ${bi.chineseName || 'N/A'}`);
        doc.text(`English Name / 英文姓名: ${bi.englishName || 'N/A'}`);
        doc.text(`Gender / 性别: ${translate(bi.gender)}`);
        doc.text(`Date of Birth / 出生日期: ${formatDate(bi.dateOfBirth)}`);
        doc.text(`Place of Birth / 出生地: ${bi.placeOfBirth || 'N/A'}`);
        doc.text(`Nationality / 国籍: ${bi.nationality || 'N/A'}`);
      }
      doc.moveDown(1);

      // 详细信息
      doc.fontSize(14).font('NotoSansCJK').text('Detailed Information / 详细信息');
      doc.moveDown(0.3);
      doc.fontSize(10).font('NotoSansCJK');
      
      if (data.detailedInfo) {
        const di = data.detailedInfo;
        doc.text(`ID Type / 证件类型: ${translate(di.idType)}`);
        doc.text(`ID Number / 证件号码: ${di.idNumber || 'N/A'}`);
        doc.text(`ID Issuing Place / 证件签发地: ${di.idIssuingPlace || 'N/A'}`);
        doc.text(`ID Expiry Date / 证件到期日: ${formatDate(di.idExpiryDate)}`);
        doc.text(`Marital Status / 婚姻状况: ${translate(di.maritalStatus)}`);
        doc.text(`Education Level / 教育程度: ${translate(di.educationLevel)}`);
        doc.text(`Residential Address / 居住地址: ${di.residentialAddress || 'N/A'}`);
        doc.text(`Mailing Address / 邮寄地址: ${di.mailingAddress || 'N/A'}`);
        doc.text(`Phone / 电话: ${di.phoneCountryCode || ''}${di.phoneNumber || 'N/A'}`);
        doc.text(`Email / 电邮: ${di.email || 'N/A'}`);
      }
      doc.moveDown(1);

      // 职业信息
      if (data.occupation) {
        doc.fontSize(14).font('NotoSansCJK').text('Occupation Information / 职业信息');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        const oc = data.occupation;
        doc.text(`Employment Status / 就业状态: ${translate(oc.employmentStatus)}`);
        doc.text(`Company Name / 公司名称: ${oc.companyName || 'N/A'}`);
        doc.text(`Company Address / 公司地址: ${oc.companyAddress || 'N/A'}`);
        doc.text(`Position / 职位: ${oc.position || 'N/A'}`);
        doc.text(`Industry / 行业: ${oc.industry || 'N/A'}`);
        doc.text(`Years Employed / 工作年限: ${oc.yearsEmployed || 'N/A'}`);
        doc.text(`Office Phone / 办公电话: ${oc.officePhoneCountryCode || ''}${oc.officePhoneNumber || 'N/A'}`);
        doc.text(`Office Fax / 办公传真: ${oc.officeFaxNo || 'N/A'}`);
        doc.moveDown(1);
      }

      // 财务状况
      if (data.financial) {
        doc.fontSize(14).font('NotoSansCJK').text('Financial Information / 财务状况');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        const fi = data.financial;
        doc.text(`Annual Income / 年收入: ${formatAmount(fi.annualIncome)}`);
        doc.text(`Net Worth / 净资产: ${formatAmount(fi.netWorth)}`);
        doc.text(`Liquid Asset / 流动资产: ${formatAmount(fi.liquidAsset)}`);
        doc.text(`Source of Income / 收入来源: ${fi.sourceOfIncome || 'N/A'}`);
        doc.text(`Expected Investment Amount / 预期投资金额: ${formatAmount(fi.expectedInvestmentAmount)}`);
        doc.moveDown(1);
      }

      // 投资经验
      if (data.investmentExperience) {
        doc.fontSize(14).font('NotoSansCJK').text('Investment Experience / 投资经验');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        const ie = data.investmentExperience;
        doc.text(`Stocks / 股票: ${ie.stocksExperience || 0} Years / 年`);
        doc.text(`Bonds / 债券: ${ie.bondsExperience || 0} Years / 年`);
        doc.text(`Futures / 期货: ${ie.futuresExperience || 0} Years / 年`);
        doc.text(`Options / 期权: ${ie.optionsExperience || 0} Years / 年`);
        doc.moveDown(1);
      }

      // 银行账户
      if (data.bankAccounts && data.bankAccounts.length > 0) {
        doc.fontSize(14).font('NotoSansCJK').text('Bank Account Information / 银行账户信息');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        data.bankAccounts.forEach((account, index) => {
          doc.text(`Account ${index + 1}:`);
          doc.text(`  Bank Name / 银行名称: ${account.bankName || 'N/A'}`);
          doc.text(`  Account Number / 账户号码: ${account.accountNumber || 'N/A'}`);
          doc.text(`  Account Holder / 账户持有人: ${account.accountHolderName || 'N/A'}`);
          doc.text(`  Bank Location / 银行所在地: ${account.bankLocation || 'N/A'}`);
          doc.moveDown(0.5);
        });
        doc.moveDown(0.5);
      }

      // 人脸识别验证
      if (data.faceVerification?.verified) {
        doc.fontSize(14).font('NotoSansCJK').text('Face Verification / 人脸识别验证');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        doc.text(`Verification Status / 验证状态: Verified / 已验证`);
        doc.text(`Verification Time / 验证时间: ${formatTimestamp(data.faceVerification.verifiedAt)}`);
        
        if (data.faceVerification.verificationData) {
          try {
            const verData = JSON.parse(data.faceVerification.verificationData);
            if (verData.confidence) {
              doc.text(`Confidence / 置信度: ${verData.confidence.toFixed(2)}%`);
            }
          } catch (e) {
            // 忽略JSON解析错误
          }
        }
        doc.moveDown(1);
      }

      // 签名声明
      doc.fontSize(14).font('NotoSansCJK').text('Applicant Declaration and Signature / 申请人声明及签署');
      doc.moveDown(0.3);
      doc.fontSize(9).font('NotoSansCJK');
      
      doc.text('Customer Declaration / 客户声明:');
      doc.fontSize(8);
      doc.text('I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company.');
      doc.text('本人声明以上所填写的资料均属真实、准确和完整，并同意遵守贵公司的条款及细则。');
      doc.moveDown(0.5);
      
      doc.fontSize(9);
      doc.text('Electronic Signature Declaration / 电子签署声明:');
      doc.fontSize(8);
      doc.text('I agree to use electronic signature to sign this application form and understand that this electronic signature has the same legal effect as a handwritten signature.');
      doc.text('本人同意使用电子签署方式签署本申请表，并明白此电子签署具有与手写签名同等的法律效力。');
      doc.moveDown(0.5);
      
      doc.fontSize(9).font('NotoSansCJK');
      doc.text(`Signature / 签名: ${data.signatureName || 'N/A'}`);
      doc.text(`Signature Method / 签署方式: ${data.signatureMethod === 'typed' ? 'Typed / 键入' : 'Drawn / 手绘'}`);
      doc.text(`Signature Timestamp / 签署时间: ${formatTimestamp(data.signatureTimestamp)}`);
      doc.moveDown(1);

      // 页脚
      doc.fontSize(8).font('NotoSansCJK');
      doc.text('CM Financial Limited / 诚港金融股份有限公司', { align: 'center' });
      doc.text('This document is generated automatically by the system / 此文件由系统自动生成', { align: 'center' });
      doc.text(`Generated at / 生成时间: ${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
