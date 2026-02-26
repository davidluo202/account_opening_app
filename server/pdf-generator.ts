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
const LOGO_PATH = path.join(PROJECT_ROOT, 'client', 'public', 'logo-zh.png');

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

function formatRiskTolerance(riskLevel: string): string {
  const riskDescriptions: Record<string, string> = {
    // 英文風險等級
    'conservative': '保守型 Conservative - 低风险，优先考虑资本保值',
    'moderate': '稳健型 Moderate - 中等风险，寻求均衡收益和风险',
    'balanced': '均衡型 Balanced - 中等到中高风险，平衡增值与稳定',
    'aggressive': '积极型 Aggressive - 高风险，追求高回报',
    'speculative': '激进型 Speculative - 极高风险，接受重大波动',
    // 新6级风险评分系统
    'Lowest': 'Lowest / 最低风险（分数范围：0-200）',
    'Low': 'Low / 低风险（分数范围：201-400）',
    'Low to Medium': 'Low to Medium / 低至中等风险（分数范围：401-500）',
    'Medium': 'Medium / 中等风险（分数范围：501-600）',
    'Medium to High': 'Medium to High / 中等至高风险（分数范围：601-700）',
    'High': 'High / 高风险（分数范围：701+）',
    // 旧的R1-R5风险等级（兼容旧数据）
    'R1': 'Low / 低风险',
    'R2': 'Low to Medium / 低至中等风险',
    'R3': 'Medium / 中等风险',
    'R4': 'Medium to High / 中等至高风险',
    'R5': 'High / 高风险'
  };
  
  return riskDescriptions[riskLevel] || riskLevel;
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
    mobileCountryCode?: string | null;
    mobileNumber?: string | null;
    faxNo?: string | null;
    email?: string | null;
    billingAddressType?: string | null;
    billingAddressOther?: string | null;
    preferredLanguage?: string | null;
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
  riskQuestionnaire?: {
    q1_current_investments?: string | null;
    q2_investment_period?: string | null;
    q3_price_volatility?: string | null;
    q4_investment_percentage?: string | null;
    q5_investment_attitude?: string | null;
    q6_derivatives_knowledge?: string | null;
    q7_age_group?: string | null;
    q8_education_level?: string | null;
    q9_investment_knowledge_sources?: string | null;
    q10_liquidity_needs?: string | null;
    totalScore?: number | null;
    riskLevel?: string | null;
    riskDescription?: string | null;
  };
  uploadedDocuments?: Array<{
    documentType?: string | null;
    fileUrl?: string | null;
  }>;
  signatureName?: string | null;
  signatureMethod?: string | null;
  signatureTimestamp?: string | Date | null;
  submittedAt?: string | Date | null;
  // 合規聲明字段
  isPEP?: boolean | null;
  isUSPerson?: boolean | null;
  agreementRead?: boolean | null;
  agreementAccepted?: boolean | null;
  electronicSignatureConsent?: boolean | null;
  amlComplianceConsent?: boolean | null;
  riskAssessmentConsent?: boolean | null;
  // 審批信息字段
  firstApproval?: {
    approverName?: string | null;
    approverCeNo?: string | null;
    isProfessionalInvestor?: boolean | null;
    approvedRiskProfile?: string | null;
    approvalTime?: string | Date | null;
    comments?: string | null;
  };
  secondApproval?: {
    approverName?: string | null;
    approverCeNo?: string | null;
    isProfessionalInvestor?: boolean | null;
    approvedRiskProfile?: string | null;
    approvalTime?: string | Date | null;
    comments?: string | null;
  };
}

/**
 * 生成申请表PDF (使用PDFKit)
 */
export async function generateApplicationPDF(data: ApplicationPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 80, bottom: 70, left: 50, right: 50 }, // 增加頂部和底部邊距，為Logo和頁碼預留空間
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // 手動為首頁添加Logo（因為pageAdded事件不會在首頁觸發）
      let pageNumber = 1;
      if (fs.existsSync(LOGO_PATH)) {
        try {
          doc.image(LOGO_PATH, 50, 20, { width: 120 });
          console.log('[PDF] Logo added to first page');
        } catch (error) {
          console.error('[PDF] Failed to add logo to first page:', error);
        }
      }
      
      // 使用pageAdded事件監聽器在每個新頁面創建時自動添加頁眉和Logo
      doc.on('pageAdded', () => {
        pageNumber++;
        
        // 保存當前位置
        const currentY = doc.y;
        const currentX = doc.x;
        
        // 添加Logo到頁眉
        if (fs.existsSync(LOGO_PATH)) {
          try {
            doc.image(LOGO_PATH, 50, 20, { width: 120 });
          } catch (error) {
            console.error('[PDF] Failed to add logo:', error);
          }
        }
        
        // 恢復當前位置
        doc.x = currentX;
        doc.y = currentY;
      });

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
      doc.fontSize(20).font('NotoSansCJK').text('客户开户申请表（个人/联名）', { align: 'center' });
      doc.fontSize(12).font('NotoSansCJK').fillColor('#666666').text('Customer Account Opening Form (Individual/Joint)', { align: 'center' });
      doc.fillColor('#000000'); // 重置颜色
      doc.moveDown(0.8);
      
      // 添加分隔线
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#CCCCCC');
      doc.moveDown(0.5);

      // 申请编号和状态
      doc.fontSize(10).font('NotoSansCJK');
      doc.text(`申请编号 Application Number: ${data.applicationNumber || 'N/A'}`);
      doc.text(`申请状态 Status: ${translate(data.status)}`);
      doc.moveDown(1);

      // 账户类型
      if (data.accountSelection) {
        // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('账户类型 Account Type');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        doc.text(`客户类型 Customer Type: ${translate(data.accountSelection.customerType)}`);
        doc.text(`账户类型 Account Type: ${translate(data.accountSelection.accountType)}`);
        doc.moveDown(1);
      }

      // 基本信息
      // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('1. 个人基本信息 Personal Basic Information');
      doc.fillColor('#000000'); // 重置颜色
      doc.moveDown(0.5);
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
      // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('2. 个人详细信息 Personal Detailed Information');
      doc.fillColor('#000000'); // 重置颜色
      doc.moveDown(0.5);
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
        doc.text(`手机号码 Mobile: ${di.mobileCountryCode || ''}${di.mobileNumber || 'N/A'}`);
        doc.text(`传真 Fax: ${di.faxNo || 'N/A'}`);
        doc.text(`住宅地址 Residential Address: ${di.residentialAddress || 'N/A'}`);
        
        // 账单通讯地址
        let billingAddressText = '';
        if (di.billingAddressType === 'residential') {
          billingAddressText = '住宅地址 Residential Address';
        } else if (di.billingAddressType === 'office') {
          billingAddressText = '办公地址 Office Address';
        } else if (di.billingAddressType === 'other' && di.billingAddressOther) {
          billingAddressText = `其他 Other: ${di.billingAddressOther}`;
        }
        doc.text(`账单通讯地址 Billing Address: ${billingAddressText}`);
        
        // 账单首选语言
        const preferredLanguageText = di.preferredLanguage === 'chinese' ? '中文 Chinese' : '英文 English';
        doc.text(`账单首选语言 Preferred Language: ${preferredLanguageText}`);
      }
      doc.moveDown(1);

      // 职业信息
      if (data.occupation) {
        // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('3. 职业信息 Occupation Information');
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
        // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('4. 财务状况 Financial Status');
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
        // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('5. 投资信息 Investment Information');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        
        const inv = data.investment;
        // 翻譯投資目的
        const translateObjective = (obj: string) => {
          const translations: Record<string, string> = {
            capital_growth: '資本增值',
            income_generation: '收益生成',
            capital_preservation: '資本保值',
            speculation: '投機',
            hedging: '對沖',
          };
          return translations[obj] || obj;
        };
        
        let objectives = 'N/A';
        if (inv.investmentObjectives) {
          try {
            const parsed = typeof inv.investmentObjectives === 'string' 
              ? JSON.parse(inv.investmentObjectives) 
              : inv.investmentObjectives;
            if (Array.isArray(parsed)) {
              objectives = parsed.map(translateObjective).join(', ');
            } else {
              objectives = String(inv.investmentObjectives);
            }
          } catch (e) {
            objectives = String(inv.investmentObjectives);
          }
        }
        
        doc.text(`投资目的 Investment Objective: ${objectives}`);
        doc.text(`投资经验 Investment Experience: ${formatInvestmentExperience(inv.investmentExperience)}`);
        
        // 风险等级详细描述 - 从风险评估问卷获取
        let riskToleranceText = 'N/A';
        if (data.riskQuestionnaire && data.riskQuestionnaire.riskLevel) {
          riskToleranceText = `${data.riskQuestionnaire.riskLevel}`;
          if (data.riskQuestionnaire.riskDescription) {
            riskToleranceText += `\n\n${data.riskQuestionnaire.riskDescription}`;
          }
          if (data.riskQuestionnaire.totalScore) {
            riskToleranceText += `\n\n（基於風險評估問卷總分: ${data.riskQuestionnaire.totalScore}）`;
          }
        }
        doc.text(`风险承受能力 Risk Tolerance: ${riskToleranceText}`);
        doc.moveDown(1);
      }

      // 银行账户
      if (data.bankAccounts && data.bankAccounts.length > 0) {
        // 章节标题
        doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('6. 银行账户 Bank Account');
        doc.fillColor('#000000');
        doc.moveDown(0.5);
        doc.fontSize(10).font('NotoSansCJK');
        
        data.bankAccounts.forEach((account, index) => {
          // 添加背景色区域
          const boxY = doc.y;
          doc.rect(50, boxY - 5, 495, 85).fillAndStroke('#f8f9fa', '#dee2e6');
          doc.fillColor('#000000');
          
          doc.y = boxY;
          doc.fontSize(11).font('NotoSansCJK').fillColor('#2c3e50').text(`账户 ${index + 1}`, 60, doc.y);
          doc.fillColor('#000000');
          doc.moveDown(0.3);
          
          doc.fontSize(10).text(`  银行名称 Bank Name: ${account.bankName || 'N/A'}`, 60);
          doc.text(`  账户类型 Account Type: ${translate(account.accountType)}`, 60);
          doc.text(`  币种 Currency: ${account.currency || 'N/A'}`, 60);
          doc.text(`  账号 Account Number: ${account.accountNumber || 'N/A'}`, 60);
          doc.text(`  持有人 Holder Name: ${account.accountHolderName || 'N/A'}`, 60);
          doc.moveDown(0.8);
        });
        doc.moveDown(0.5);
      }

      // 税务信息
      if (data.taxInfo) {
        // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('7. 税务信息 Tax Information');
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSansCJK');
        doc.text(`  税务居民身份 Tax Residency: ${data.taxInfo.taxResidency || 'N/A'}`);
        doc.text(`  税务识别号 Tax ID Number: ${data.taxInfo.taxIdNumber || 'N/A'}`);
        doc.moveDown(0.5);
      }

      // 风险评估问卷
      if (data.riskQuestionnaire) {
        // 章节标题
        doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('8. 风险评估问卷 Risk Assessment Questionnaire');
        doc.fillColor('#000000');
        doc.moveDown(0.5);
        doc.fontSize(10).font('NotoSansCJK');
        
        const rq = data.riskQuestionnaire;
        
        // 总分和风险等级（突出显示）
        const scoreBoxY = doc.y;
        doc.rect(50, scoreBoxY - 5, 495, 35).fillAndStroke('#e8f4f8', '#b3d9e8');
        doc.fillColor('#000000');
        doc.y = scoreBoxY;
        doc.fontSize(11).font('NotoSansCJK').text(`总分 Total Score: ${rq.totalScore || 0}`, 60);
        doc.text(`风险等级 Risk Level: ${rq.riskLevel || 'N/A'}`, 60);
        doc.moveDown(0.8);
        
        // Q1
        if (rq.q1_current_investments) {
          const q1Investments = JSON.parse(rq.q1_current_investments || '[]');
          const q1Text = q1Investments.map((item: string) => {
            if (item === 'savings') return '儲蓄/定期儲蓄/存款證/保本產品';
            if (item === 'bonds') return '债券/證券/單位信託基金/投資相連保險計劃';
            if (item === 'derivatives') return '期貨/期權/衭生產品/結構性投資產品/掛鉤存款/槓桿式外匯投資';
            return item;
          }).join(', ');
          doc.text(`Q1. 現在是否持有以下任何投資產品？ ${q1Text}`);
        }
        
        // Q2
        if (rq.q2_investment_period) {
          let q2Text = '';
          if (rq.q2_investment_period === 'less_than_1') q2Text = '沒有或少於1年';
          else if (rq.q2_investment_period === '1_to_3') q2Text = '1-3年';
          else if (rq.q2_investment_period === 'more_than_3') q2Text = '多於3年';
          doc.text(`Q2. 預期投資年期是多少？ ${q2Text}`);
        }
        
        // Q3
        if (rq.q3_price_volatility) {
          let q3Text = '';
          if (rq.q3_price_volatility === '10_percent') q3Text = '價格波幅介乎-10%至+10%';
          else if (rq.q3_price_volatility === '20_percent') q3Text = '價格波幅介乎-20%至+20%';
          else if (rq.q3_price_volatility === '30_percent') q3Text = '價格波幅多於-30%至多於+30%';
          doc.text(`Q3. 可以接受以下哪個年度價格波幅？ ${q3Text}`);
        }
        
        // Q4
        if (rq.q4_investment_percentage) {
          let q4Text = '';
          if (rq.q4_investment_percentage === 'less_than_10') q4Text = '少於10%';
          else if (rq.q4_investment_percentage === '10_to_20') q4Text = '介乎10%至20%';
          else if (rq.q4_investment_percentage === '21_to_30') q4Text = '介乎21%至30%';
          else if (rq.q4_investment_percentage === '31_to_50') q4Text = '介乎31%至50%';
          else if (rq.q4_investment_percentage === 'more_than_50') q4Text = '多於50%';
          doc.text(`Q4. 在現時資產淫值中(撤除自住物業價值)，有多少個百分比可作投資用途？ ${q4Text}`);
        }
        
        // Q5
        if (rq.q5_investment_attitude) {
          let q5Text = '';
          if (rq.q5_investment_attitude === 'no_volatility') q5Text = '不能接受任何價格波動，並且對賭取投資回報不感興趣';
          else if (rq.q5_investment_attitude === 'small_volatility') q5Text = '只能接受較小幅度的價格波動，並且僅希望賭取稍高於銀行存款利率的回報';
          else if (rq.q5_investment_attitude === 'some_volatility') q5Text = '可接受若干價格波幅，並希望賭取高於銀行存款利率的回報';
          else if (rq.q5_investment_attitude === 'large_volatility') q5Text = '可接受大幅度的價格波動，並希望賭取與股市指數表現相若的回報';
          else if (rq.q5_investment_attitude === 'any_volatility') q5Text = '可接受任何幅度的價格波動，並希望回報能跑贏股市指數';
          doc.text(`Q5. 以下哪一句子最能貼切描述您對金融投資的一般態度？ ${q5Text}`);
        }
        
        // Q6
        if (rq.q6_derivatives_knowledge) {
          const q6Knowledge = JSON.parse(rq.q6_derivatives_knowledge || '[]');
          const q6Text = q6Knowledge.map((item: string) => {
            if (item === 'training') return '曾接受有關衭生產品的培訓或修讀相關課程';
            if (item === 'experience') return '現時或過去擁有與衭生產品有關的工作經驗';
            if (item === 'transactions') return '於過往3年曾執行5次或以上有關衭生產品的交易';
            if (item === 'no_knowledge') return '沒有衭生工具之認識';
            return item;
          }).join(', ');
          doc.text(`Q6. 對衭生工具產品的認識： ${q6Text}`);
        }
        
        // Q7
        if (rq.q7_age_group) {
          let q7Text = '';
          if (rq.q7_age_group === '18_to_25') q7Text = '介乎18至25歲';
          else if (rq.q7_age_group === '26_to_35') q7Text = '介乎26至35歲';
          else if (rq.q7_age_group === '36_to_50') q7Text = '介乎36至50歲';
          else if (rq.q7_age_group === '51_to_64') q7Text = '介乎51至64歲';
          else if (rq.q7_age_group === '65_plus') q7Text = '65歲或以上';
          doc.text(`Q7. 您屬於以下哪個年齡組別？ ${q7Text}`);
        }
        
        // Q8
        if (rq.q8_education_level) {
          let q8Text = '';
          if (rq.q8_education_level === 'primary_or_below') q8Text = 'A. 小學或以下學歷';
          else if (rq.q8_education_level === 'secondary') q8Text = 'B. 中學';
          else if (rq.q8_education_level === 'tertiary_or_above') q8Text = 'C. 大專或以上學歷';
          doc.text(`Q8. 您的教育程度： ${q8Text}`);
        }
        
        // Q9
        if (rq.q9_investment_knowledge_sources) {
          const q9Sources = JSON.parse(rq.q9_investment_knowledge_sources || '[]');
          const q9Text = q9Sources.map((item: string) => {
            if (item === 'no_interest') return '從未汲取及/或沒有興趣汲取任何投資知識';
            if (item === 'discussion') return '與親友及/或同事討論投資或理財話題';
            if (item === 'reading') return '閱讀及/或收聽有關投資或財經新聞';
            if (item === 'research') return '研究投資或財務相關事宜，或參加投資或財務相關課程、論壇、簡報會、研討會或工作坊';
            return item;
          }).join(', ');
          doc.text(`Q9. 您曾經或現時從以下哪些途徑汲取投資知識？ ${q9Text}`);
        }
        
        // Q10
        if (rq.q10_liquidity_needs) {
          let q10Text = '';
          if (rq.q10_liquidity_needs === 'no_need') q10Text = '不需要出售任何投資';
          else if (rq.q10_liquidity_needs === 'up_to_30') q10Text = '我會出售不超過30%的投資';
          else if (rq.q10_liquidity_needs === '30_to_50') q10Text = '我會出售超過30%但不到50%的投資';
          else if (rq.q10_liquidity_needs === 'over_50') q10Text = '我會出售超過50%的投資';
          doc.text(`Q10. 您需要將多少投資兌現，以滿足突發事件的流動資金需求？ ${q10Text}`);
        }
        
        doc.moveDown(1);
      }

      // 上传文件清单
      if (data.uploadedDocuments && data.uploadedDocuments.length > 0) {
        // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('8. 上传文件清单 Uploaded Documents');
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

      // 合規聲明
      // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('客戶合規聲明 Customer Compliance Declarations');
      doc.moveDown(0.3);
      doc.fontSize(9).font('NotoSansCJK');

      // PEP聲明
      doc.text('PEP聲明 Political Exposed Person (PEP) Declaration:');
      doc.fontSize(8);
      const pepStatus = data.isPEP ? '是 Yes' : '否 No';
      doc.text(`本人確認本人${pepStatus}為政治公眾人物（PEP）。`);
      doc.text(`I confirm that I am ${pepStatus} a Political Exposed Person (PEP).`);
      doc.moveDown(0.5);

      // US Person聲明
      doc.fontSize(9);
      doc.text('US Person聲明 US Person Declaration:');
      doc.fontSize(8);
      const usPersonStatus = data.isUSPerson ? '是 Yes' : '否 No';
      doc.text(`本人確認本人${usPersonStatus}為美國人士（US Person）。`);
      doc.text(`I confirm that I am ${usPersonStatus} a US Person.`);
      doc.moveDown(0.5);

      // 已閱讀開戶協議
      doc.fontSize(9);
      doc.text('已閱讀開戶協議 Read Opening Agreement:');
      doc.fontSize(8);
      const hasReadAgreementStatus = data.agreementRead ? '是 Yes' : '否 No';
      doc.text(`本人確認${hasReadAgreementStatus}已閱讀開戶協議。`);
      doc.text(`I confirm that I ${hasReadAgreementStatus} read the opening agreement.`);
      doc.moveDown(0.5);

      // 接受電子交易條例
      doc.fontSize(9);
      doc.text('接受電子交易條例 (ETO) Accept Electronic Trading Ordinance:');
      doc.fontSize(8);
      const acceptsETOStatus = data.electronicSignatureConsent ? '同意 Agreed' : '未同意 Not Agreed';
      doc.text(`本人${acceptsETOStatus}接受電子交易條例的約束。`);
      doc.text(`I ${acceptsETOStatus} to accept the Electronic Trading Ordinance.`);
      doc.moveDown(0.5);

      // 接受反洗錢和合規監管
      doc.fontSize(9);
      doc.text('接受反洗錢和合規監管 Accept AML and Compliance:');
      doc.fontSize(8);
      const amlStatus = data.amlComplianceConsent ? '同意 Agreed' : '未同意 Not Agreed';
      doc.text(`本人${amlStatus}接受反洗錢和其他監管合規要求的約束。`);
      doc.text(`I ${amlStatus} to accept the constraints of anti-money laundering and other regulatory compliance requirements.`);
      doc.moveDown(0.5);

      // 风险评估确认
      doc.fontSize(9);
      doc.text('风险评估确认 Risk Assessment Confirmation:');
      doc.fontSize(8);
      const riskAssessmentStatus = data.riskAssessmentConsent ? '同意 Agreed' : '未同意 Not Agreed';
      doc.text(`本人${riskAssessmentStatus}已閱讀风险评估问卷并确认结果。`);
      doc.text(`I ${riskAssessmentStatus} that I have read the risk assessment questionnaire and confirm the results.`);
      doc.moveDown(0.5);

      // 協議簽署
      doc.fontSize(9);
      doc.text('協議簽署 Agreement Signed:');
      doc.fontSize(8);
      const agreementStatus = data.agreementAccepted ? '已簽署 Signed' : '未簽署 Not Signed';
      doc.text(`協議簽署狀態 Agreement Signed Status: ${agreementStatus}`);
      if (data.agreementAccepted) {
        doc.text('本人確認已詳細閱讀開戶協議，清楚了解協議內容，並願意接受協議條款約束。');
        doc.text('I confirm that I have read the account opening agreement in detail, clearly understand the content of the agreement, and am willing to accept the terms and conditions of the agreement.');
      }
      doc.moveDown(1);

      // 签名声明
      // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('申请人声明及签署 Applicant Declaration and Signature');
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
      const signatureName = data.signatureName || data.basicInfo?.englishName || 'N/A';
      doc.text(`签名 Signature: ${signatureName}`);
      doc.text(`签署方式 Signature Method: ${data.signatureMethod || 'Typed / 输入'}`);
      doc.text(`签署时间 Signature Timestamp: ${formatTimestamp(data.signatureTimestamp)}`);
      doc.moveDown(1);

      // 審批信息（如果存在）
      if (data.firstApproval || data.secondApproval) {
        doc.addPage();
        doc.fontSize(14).font('NotoSansCJK').text('審批記錄 Approval Records', { underline: true });
        doc.moveDown(0.5);

        // 初審信息
        if (data.firstApproval) {
          // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('初審記錄 First Approval Record');
          doc.moveDown(0.3);
          doc.fontSize(9).font('NotoSansCJK');
          
          doc.text(`審批人員 Approver: ${data.firstApproval.approverName || 'N/A'}`);
          doc.text(`CE號碼 CE Number: ${data.firstApproval.approverCeNo || 'N/A'}`);
          doc.text(`專業投資者認定 Professional Investor: ${data.firstApproval.isProfessionalInvestor ? '是 Yes' : '否 No'}`);
          doc.text(`風險評級 Risk Profile: ${data.firstApproval.approvedRiskProfile ? formatRiskTolerance(data.firstApproval.approvedRiskProfile) : 'N/A'}`);
          doc.text(`審批時間 Approval Time: ${formatTimestamp(data.firstApproval.approvalTime)}`);
          if (data.firstApproval.comments) {
            doc.text(`審批意見 Comments: ${data.firstApproval.comments}`);
          }
          doc.moveDown(0.5);
        }

        // 終審信息
        if (data.secondApproval) {
          // 章节标题
      doc.fontSize(14).font('NotoSansCJK').fillColor('#2c3e50').text('終審記錄 Final Approval Record');
          doc.moveDown(0.3);
          doc.fontSize(9).font('NotoSansCJK');
          
          doc.text(`審批人員 Approver: ${data.secondApproval.approverName || 'N/A'}`);
          if (data.secondApproval.approverCeNo) {
            doc.text(`CE號碼 CE Number: ${data.secondApproval.approverCeNo}`);
          }
          doc.text(`專業投資者認定 Professional Investor: ${data.secondApproval.isProfessionalInvestor ? '是 Yes' : '否 No'}`);
          doc.text(`風險評級 Risk Profile: ${data.secondApproval.approvedRiskProfile ? formatRiskTolerance(data.secondApproval.approvedRiskProfile) : 'N/A'}`);
          doc.text(`審批時間 Approval Time: ${formatTimestamp(data.secondApproval.approvalTime)}`);
          if (data.secondApproval.comments) {
            doc.text(`審批意見 Comments: ${data.secondApproval.comments}`);
          }
          doc.moveDown(1);
        }
      }

      // 使用bufferPages功能在所有頁面添加頁腳頁碼
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        // 添加页脚分隔线
        const footerY = doc.page.height - 60;
        doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#CCCCCC');
        
        // 添加公司信息（左侧）
        doc.fontSize(7).font('NotoSansCJK').fillColor('#666666');
        doc.text('调港金融 CM Financial', 50, footerY + 8, {
          lineBreak: false,
        });
        
        // 添加申请编号（中间）
        const appNumberText = `${data.applicationNumber || 'N/A'}`;
        const appNumberWidth = doc.widthOfString(appNumberText);
        const appNumberX = (doc.page.width - appNumberWidth) / 2;
        doc.text(appNumberText, appNumberX, footerY + 8, {
          lineBreak: false,
        });
        
        // 添加页码（右侧）
        const pageNumberText = `${i + 1} / ${pages.count}`;
        const pageNumberWidth = doc.widthOfString(pageNumberText);
        const pageNumberX = doc.page.width - 50 - pageNumberWidth;
        doc.text(pageNumberText, pageNumberX, footerY + 8, {
          lineBreak: false,
        });
        
        // 重置颜色
        doc.fillColor('#000000');
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
