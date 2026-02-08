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
    // R1-R5風險等級（與translations.ts保持一致）
    'R1': 'R1 - 低風險：在一定時間內，本金安全具有較高的穩定性，基金淨值波動較小，或造成較小的本金虧損',
    'R2': 'R2 - 中低風險：在一定時間內，本金安全具有較高的穩定性，基金淨值會有較小波動，或造成較小的本金虧損',
    'R3': 'R3 - 中風險：在一定時間內，本金安全具有一定的不穩定性，基金淨值會有適度波動，或造成一定的本金虧損',
    'R4': 'R4 - 中高風險：在一定時間內，本金安全具有較大的不穩定性，基金淨值會有較大波動，或造成較大的本金虧損',
    'R5': 'R5 - 高風險：在一定時間內，本金安全具有很大的不穩定性，基金淨值會有很大波動，或造成很大的本金虧損'
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
  // 合規聲明字段
  isPEP?: boolean | null;
  isUSPerson?: boolean | null;
  agreementRead?: boolean | null;
  agreementAccepted?: boolean | null;
  amlComplianceConsent?: boolean | null;
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
        
        // 风险等级详细描述
        const riskToleranceText = inv.riskTolerance ? formatRiskTolerance(inv.riskTolerance) : 'N/A';
        doc.text(`风险承受能力 Risk Tolerance: ${riskToleranceText}`);
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

      // 合規聲明
      doc.fontSize(12).font('NotoSansCJK').text('客戶合規聲明 Customer Compliance Declarations');
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

      // 反洗錢合規聲明
      doc.fontSize(9);
      doc.text('反洗錢合規聲明 Anti-Money Laundering Compliance Declaration:');
      doc.fontSize(8);
      const amlStatus = data.amlComplianceConsent ? '同意 Agreed' : '未同意 Not Agreed';
      doc.text(`本人${amlStatus}接受反洗錢和其他監管合規要求的約束。`);
      doc.text(`I ${amlStatus} to accept the constraints of anti-money laundering and other regulatory compliance requirements.`);
      doc.moveDown(0.5);

      // 開戶協議聲明
      doc.fontSize(9);
      doc.text('開戶協議聲明 Account Opening Agreement Declaration:');
      doc.fontSize(8);
      const agreementStatus = (data.agreementRead && data.agreementAccepted) ? '已閱讀並同意 Read and Agreed' : '未完成 Not Completed';
      doc.text(`開戶協議狀態 Agreement Status: ${agreementStatus}`);
      if (data.agreementRead && data.agreementAccepted) {
        doc.text('本人確認已詳細閱讀開戶協議，清楚了解協議內容，並願意接受協議條款約束。');
        doc.text('I confirm that I have read the account opening agreement in detail, clearly understand the content of the agreement, and am willing to accept the terms and conditions of the agreement.');
      }
      doc.moveDown(1);

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

      // 審批信息（如果存在）
      if (data.firstApproval || data.secondApproval) {
        doc.addPage();
        doc.fontSize(14).font('NotoSansCJK').text('審批記錄 Approval Records', { underline: true });
        doc.moveDown(0.5);

        // 初審信息
        if (data.firstApproval) {
          doc.fontSize(12).font('NotoSansCJK').text('初審記錄 First Approval Record');
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
          doc.fontSize(12).font('NotoSansCJK').text('終審記錄 Final Approval Record');
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
        
        // 添加頁碼到頁腳（使用絕對定位）
        const pageNumberText = `第${i + 1}页`;
        const pageNumberWidth = doc.widthOfString(pageNumberText);
        const pageNumberX = (doc.page.width - pageNumberWidth) / 2;
        const pageNumberY = doc.page.height - 40;
        
        doc.fontSize(8).font('NotoSansCJK');
        doc.text(pageNumberText, pageNumberX, pageNumberY, {
          lineBreak: false,
          continued: false,
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
