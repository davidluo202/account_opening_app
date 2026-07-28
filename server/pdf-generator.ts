/**
 * PDF生成模組 v8 (CMF003 v2.0 表格式佈局)
 */
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

const PROJECT_ROOT = process.cwd();
const FONT_PATH_TC = path.join(PROJECT_ROOT, 'server', 'fonts', 'NotoSansCJKtc-Regular.otf');
const FONT_PATH_SC = path.join(PROJECT_ROOT, 'server', 'fonts', 'NotoSansCJKsc-Regular.otf');
const LOGO_PATH = path.join(PROJECT_ROOT, 'client', 'public', 'logo-en.png');

if (!fs.existsSync(FONT_PATH_TC)) {
  console.warn(`[PDF] Traditional Chinese font not found: ${FONT_PATH_TC}`);
}
if (!fs.existsSync(FONT_PATH_SC)) {
  console.warn(`[PDF] Simplified Chinese font not found: ${FONT_PATH_SC}`);
}

// ── 樣式常量 ──────────────────────────────────────────────
const COLOR_LABEL_BG   = '#f0f0f0';
const COLOR_BORDER     = '#333333';
const COLOR_HEADER_BG  = '#1a3a5c';
const COLOR_SECTION_BG = '#dce6f0';
const PAGE_LEFT        = 50;
const PAGE_RIGHT_EDGE  = 545; // 595 - 50
const CONTENT_WIDTH    = PAGE_RIGHT_EDGE - PAGE_LEFT; // 495
const ROW_HEIGHT       = 18;
const LABEL_FONT_SIZE  = 8;
const VALUE_FONT_SIZE  = 9;
const SECTION_FONT_SIZE = 10;

// ── 工具函數 ──────────────────────────────────────────────

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-HK');
  } catch {
    return 'N/A';
  }
}

function formatTimestamp(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return d.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
  } catch {
    return 'N/A';
  }
}

function formatAmountRange(range: string | null | undefined): string {
  if (!range) return 'N/A';
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
  if (range.includes('+')) {
    const num = parseInt(range.replace('+', ''));
    if (!isNaN(num)) return `HKD ${num.toLocaleString('en-US')}+`;
  }
  const num = parseInt(range);
  if (!isNaN(num)) return `HKD ${num.toLocaleString('en-US')}`;
  return range;
}

const translationsMap: Record<string, string> = {
  individual: '個人戶口 Individual',
  joint: '聯名戶口 Joint',
  corporate: '機構戶口 Corporate',
  cash: '現金戶口 Cash',
  margin: '保證金戶口 Margin',
  derivatives_account: '衍生品戶口 Derivatives',
  male: '男 Male',
  female: '女 Female',
  other: '其他 Other',
  hkid: '香港身份證 HKID',
  passport: '護照 Passport',
  mainland_id: '中國大陸身份證 Mainland ID',
  'mainland-id': '中國大陸居民身份證 Mainland ID',
  'taiwan-id': '台灣居民身份證 Taiwan ID',
  'macao-id': '澳門居民身份證 Macao ID',
  single: '單身 Single',
  married: '已婚 Married',
  divorced: '離婚 Divorced',
  widowed: '喪偶 Widowed',
  high_school: '高中 High School',
  associate: '專科 Associate',
  bachelor: '學士 Bachelor',
  master: '碩士 Master',
  doctorate: '博士 Doctorate',
  primary: '小學 Primary',
  secondary: '中學 Secondary',
  employed: '受僱 Employed',
  self_employed: '自僱 Self-Employed',
  unemployed: '無業 Unemployed',
  retired: '退休 Retired',
  student: '學生 Student',
  saving: '儲蓄戶口 Saving',
  current: '支票戶口 Current',
  none: '無經驗 None',
  less_than_1: '少於1年 <1 Yr',
  '1_to_3': '1-3年 1-3 Yrs',
  '3_to_5': '3-5年 3-5 Yrs',
  more_than_5: '5年以上 >5 Yrs',
  stocks: '股票 Stocks',
  bonds: '債券 Bonds',
  funds: '基金 Funds',
  derivatives: '衍生品 Derivatives',
  forex: '外匯 Forex',
  commodities: '商品 Commodities',
  capital_growth: '資本增值 Capital Growth',
  income_generation: '收益生成 Income Generation',
  capital_preservation: '資本保值 Capital Preservation',
  speculation: '投機 Speculation',
  hedging: '對沖 Hedging',
  salary: '薪金 Salary',
  business_income: '營業收入 Business Income',
  investment_income: '投資收益 Investment Income',
  rental_income: '租金收入 Rental Income',
  pension: '養老金 Pension',
  inheritance: '繼承財產 Inheritance',
  gift: '贈與 Gift',
  savings: '儲蓄 Savings',
  draft: '草稿 Draft',
  submitted: '已提交 Submitted',
  approved: '已批准 Approved',
  rejected: '已拒絕 Rejected',
};

const translate = (key: string | null | undefined): string => {
  if (!key) return 'N/A';
  return translationsMap[key] || key;
};

function formatInvestmentExperience(experience: string | Record<string, string> | null | undefined): string {
  if (!experience) return 'N/A';
  if (typeof experience === 'string') {
    try {
      const parsed = JSON.parse(experience);
      if (typeof parsed === 'object') experience = parsed;
    } catch {
      return String(experience);
    }
  }
  if (typeof experience === 'object' && experience !== null) {
    const items = Object.entries(experience)
      .filter(([, value]) => value && value !== 'none')
      .map(([key, value]) => `${translate(key)}: ${translate(value as string)}`);
    return items.length > 0 ? items.join('  |  ') : 'N/A';
  }
  return String(experience);
}

function formatRiskTolerance(riskLevel: string): string {
  const map: Record<string, string> = {
    conservative: '保守型 Conservative',
    moderate: '穩健型 Moderate',
    balanced: '均衡型 Balanced',
    aggressive: '積極型 Aggressive',
    speculative: '激進型 Speculative',
    Lowest: 'Lowest / 最低風險',
    Low: 'Low / 低風險',
    'Low to Medium': 'Low to Medium / 低至中等風險',
    Medium: 'Medium / 中等風險',
    'Medium to High': 'Medium to High / 中等至高風險',
    High: 'High / 高風險',
    R1: 'Low / 低風險',
    R2: 'Low to Medium / 低至中等風險',
    R3: 'Medium / 中等風險',
    R4: 'Medium to High / 中等至高風險',
    R5: 'High / 高風險',
  };
  return map[riskLevel] || riskLevel;
}

function checkbox(checked: boolean | null | undefined): string {
  return checked ? '☑' : '☐';
}

// ── 介面定義 ──────────────────────────────────────────────

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
  isPEP?: boolean | null;
  isUSPerson?: boolean | null;
  isUBO?: boolean | null;
  isSFCEmployee?: boolean | null;
  isCMFEmployee?: boolean | null;
  agreementRead?: boolean | null;
  agreementAccepted?: boolean | null;
  electronicSignatureConsent?: boolean | null;
  amlComplianceConsent?: boolean | null;
  riskAssessmentConsent?: boolean | null;
  bcanConsent?: boolean | null;
  directMarketingConsent?: boolean | null;
  clientConfirmation?: boolean | null;
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

// ── 繪圖輔助函數 ──────────────────────────────────────────

/**
 * 在當前 Y 位置繪製區段標題列，回傳新 Y。
 */
function drawSectionHeader(doc: InstanceType<typeof PDFDocument>, text: string, y: number): number {
  doc.rect(PAGE_LEFT, y, CONTENT_WIDTH, 16).fillAndStroke(COLOR_SECTION_BG, COLOR_BORDER);
  doc.fillColor('#000000').fontSize(SECTION_FONT_SIZE).font('NotoSansCJK')
     .text(text, PAGE_LEFT + 4, y + 3, { width: CONTENT_WIDTH - 8, lineBreak: false });
  return y + 16;
}

/**
 * 繪製單行 label/value 表格列，支援多欄。
 * pairs: [{label, value, labelWidth, totalWidth}]
 * totalWidth 為整列寬度（用於邊框），若只有一欄則等於 CONTENT_WIDTH。
 */
interface CellDef {
  label: string;
  value: string;
  labelWidth: number; // label 格寬
  colWidth: number;   // 整個欄寬（label + value 合計）
}

function drawRow(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  cells: CellDef[],
  rowHeight: number = ROW_HEIGHT
): number {
  let x = PAGE_LEFT;
  for (const cell of cells) {
    // label 背景
    doc.rect(x, y, cell.labelWidth, rowHeight).fillAndStroke(COLOR_LABEL_BG, COLOR_BORDER);
    doc.fillColor('#333333').fontSize(LABEL_FONT_SIZE).font('NotoSansCJK')
       .text(cell.label, x + 2, y + (rowHeight - LABEL_FONT_SIZE) / 2 + 1, {
         width: cell.labelWidth - 4, lineBreak: false,
       });

    // value 背景
    const valueX = x + cell.labelWidth;
    const valueW = cell.colWidth - cell.labelWidth;
    doc.rect(valueX, y, valueW, rowHeight).fillAndStroke('#ffffff', COLOR_BORDER);
    doc.fillColor('#000000').fontSize(VALUE_FONT_SIZE).font('NotoSansCJK')
       .text(cell.value || 'N/A', valueX + 3, y + (rowHeight - VALUE_FONT_SIZE) / 2 + 1, {
         width: valueW - 6, lineBreak: false,
       });

    x += cell.colWidth;
  }
  return y + rowHeight;
}

/**
 * 繪製帶文字換行的高列（label 固定高，value 可多行）。
 * 回傳新 Y。
 */
function drawTallRow(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  label: string,
  value: string,
  labelWidth: number = 130,
  rowHeight: number = ROW_HEIGHT
): number {
  const valueW = CONTENT_WIDTH - labelWidth;

  // 先量文字高度
  doc.fontSize(VALUE_FONT_SIZE).font('NotoSansCJK');
  const textHeight = doc.heightOfString(value || 'N/A', { width: valueW - 6 });
  const actualHeight = Math.max(rowHeight, textHeight + 6);

  doc.rect(PAGE_LEFT, y, labelWidth, actualHeight).fillAndStroke(COLOR_LABEL_BG, COLOR_BORDER);
  doc.fillColor('#333333').fontSize(LABEL_FONT_SIZE).font('NotoSansCJK')
     .text(label, PAGE_LEFT + 2, y + 4, { width: labelWidth - 4, lineBreak: false });

  doc.rect(PAGE_LEFT + labelWidth, y, valueW, actualHeight).fillAndStroke('#ffffff', COLOR_BORDER);
  doc.fillColor('#000000').fontSize(VALUE_FONT_SIZE).font('NotoSansCJK')
     .text(value || 'N/A', PAGE_LEFT + labelWidth + 3, y + 4, { width: valueW - 6 });

  return y + actualHeight;
}

/**
 * 頁首：Logo（左）+ 公司副標題（右）
 */
function drawPageHeader(doc: InstanceType<typeof PDFDocument>): void {
  const logoY = 15;
  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, PAGE_LEFT, logoY, { height: 36 });
    } catch (e) {
      console.error('[PDF] Logo error:', e);
    }
  }
  // 右側副標題
  doc.fontSize(7).font('NotoSansCJK').fillColor('#444444')
     .text(
       'Licensed Corporation under the Securities & Futures Ordinance (CE No. BSU667)',
       PAGE_LEFT + 140,
       logoY + 10,
       { width: CONTENT_WIDTH - 140, align: 'right', lineBreak: false }
     );
  doc.fillColor('#000000');
}

/**
 * 頁尾：公司名稱 + 地址 + CMF003 v2.0
 */
function drawPageFooter(doc: InstanceType<typeof PDFDocument>, pageNum: number, totalPages: number): void {
  const footerY = doc.page.height - 55;
  // 分隔線
  doc.moveTo(PAGE_LEFT, footerY).lineTo(PAGE_RIGHT_EDGE, footerY).strokeColor('#999999').lineWidth(0.5).stroke();
  doc.lineWidth(1); // reset

  doc.fontSize(7).font('NotoSansCJK').fillColor('#555555');
  doc.text(
    '誠港金融股份有限公司  CANTON MUTUAL FINANCIAL LIMITED  www.cmfinancial.com',
    PAGE_LEFT, footerY + 5,
    { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
  );
  doc.text(
    'Room 308, 3/F, Des Voeux Commercial Centre, 212-214 Des Voeux Road Central, Hong Kong',
    PAGE_LEFT, footerY + 15,
    { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
  );

  // 左側申請編號、右側版本+頁碼
  doc.text(`Page ${pageNum} / ${totalPages}`, PAGE_LEFT, footerY + 28, { lineBreak: false });
  doc.text('CMF003 v2.0', PAGE_LEFT, footerY + 28,
    { width: CONTENT_WIDTH, align: 'right', lineBreak: false });

  doc.fillColor('#000000');
}

/**
 * 確認下一行不會超出頁面，否則新增一頁。
 * 回傳（可能更新後的）Y 值。
 */
function ensureSpace(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  needed: number = ROW_HEIGHT + 4
): number {
  const bottomLimit = doc.page.height - 70;
  if (y + needed > bottomLimit) {
    doc.addPage();
    return 80; // top margin after new page
  }
  return y;
}

// ── 主函數 ────────────────────────────────────────────────

export async function generateApplicationPDF(data: ApplicationPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 80, bottom: 70, left: PAGE_LEFT, right: 50 },
        bufferPages: true,
        autoFirstPage: false,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // 字體
      try {
        if (fs.existsSync(FONT_PATH_TC)) {
          doc.registerFont('NotoSansCJK', FONT_PATH_TC);
        } else if (fs.existsSync(FONT_PATH_SC)) {
          doc.registerFont('NotoSansCJK', FONT_PATH_SC);
        } else {
          doc.registerFont('NotoSansCJK', 'Helvetica');
        }
      } catch (e) {
        console.error('[PDF] Font registration error:', e);
      }

      // 第一頁
      doc.addPage();
      drawPageHeader(doc);

      let y = 60;

      // ── 標題橫幅 ─────────────────────────────────────────
      const titleBannerH = 28;
      doc.rect(PAGE_LEFT, y, CONTENT_WIDTH, titleBannerH).fill(COLOR_HEADER_BG);
      doc.fillColor('#ffffff').fontSize(12).font('NotoSansCJK')
         .text(
           'Customer Information Form (Individual / Joint Account)  /  客戶資料表（個人或聯名戶口）',
           PAGE_LEFT + 4, y + 7,
           { width: CONTENT_WIDTH - 8, align: 'center', lineBreak: false }
         );
      doc.fillColor('#000000');
      y += titleBannerH + 6;

      // ── 申請號 + 狀態 橫列 ──────────────────────────────
      y = drawRow(doc, y, [
        { label: '申請編號 Application No.', value: data.applicationNumber || 'N/A', labelWidth: 160, colWidth: 280 },
        { label: '狀態 Status', value: translate(data.status), labelWidth: 80, colWidth: 215 },
      ]);
      y += 6;

      // ── 戶口類型 ─────────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 2);
      y = drawSectionHeader(doc, '戶口類型  Account Type', y);
      y = drawRow(doc, y, [
        { label: '客戶類型 Customer Type', value: translate(data.accountSelection?.customerType), labelWidth: 140, colWidth: 247 },
        { label: '戶口類型 Account Type', value: translate(data.accountSelection?.accountType), labelWidth: 130, colWidth: 248 },
      ]);
      y += 8;

      // ── A. 個人資料 ───────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 6);
      y = drawSectionHeader(doc, 'A.  個人資料  Personal Information', y);

      const bi = data.basicInfo;
      y = drawRow(doc, y, [
        { label: '中文姓名 Name (Chinese)', value: bi?.chineseName || 'N/A', labelWidth: 130, colWidth: 247 },
        { label: '英文姓名 Name (English)', value: bi?.englishName || 'N/A', labelWidth: 130, colWidth: 248 },
      ]);
      y = drawRow(doc, y, [
        { label: '性別 Gender', value: translate(bi?.gender), labelWidth: 100, colWidth: 165 },
        { label: '出生日期 Date of Birth', value: formatDate(bi?.dateOfBirth), labelWidth: 115, colWidth: 165 },
        { label: '出生地 Place of Birth', value: bi?.placeOfBirth || 'N/A', labelWidth: 100, colWidth: 165 },
      ]);
      y = drawRow(doc, y, [
        { label: '國籍 Nationality', value: bi?.nationality || 'N/A', labelWidth: 100, colWidth: 247 },
        { label: '婚姻狀況 Marital Status', value: translate(data.detailedInfo?.maritalStatus), labelWidth: 115, colWidth: 248 },
      ]);

      const di = data.detailedInfo;
      y = drawRow(doc, y, [
        { label: '證件類型 ID Type', value: translate(di?.idType), labelWidth: 100, colWidth: 165 },
        { label: '證件號碼 ID Number', value: di?.idNumber || 'N/A', labelWidth: 100, colWidth: 165 },
        { label: '簽發地 Issuing Place', value: di?.idIssuingPlace || 'N/A', labelWidth: 100, colWidth: 165 },
      ]);
      y = drawRow(doc, y, [
        { label: '有效期 Expiry Date', value: di?.idIsPermanent ? '長期有效 Permanent' : formatDate(di?.idExpiryDate), labelWidth: 110, colWidth: 247 },
        { label: '學歷 Education', value: translate(di?.educationLevel), labelWidth: 100, colWidth: 248 },
      ]);
      y = drawRow(doc, y, [
        { label: '電話 Phone', value: `${di?.phoneCountryCode || ''}${di?.phoneNumber || 'N/A'}`, labelWidth: 90, colWidth: 165 },
        { label: '手機 Mobile', value: `${di?.mobileCountryCode || ''}${di?.mobileNumber || 'N/A'}`, labelWidth: 90, colWidth: 165 },
        { label: '傳真 Fax', value: di?.faxNo || 'N/A', labelWidth: 80, colWidth: 165 },
      ]);
      y = drawRow(doc, y, [
        { label: '電郵 Email', value: di?.email || 'N/A', labelWidth: 90, colWidth: CONTENT_WIDTH },
      ]);

      // 住宅地址（可換行）
      y = ensureSpace(doc, y, 24);
      y = drawTallRow(doc, y, '住宅地址 Residential Address', di?.residentialAddress || 'N/A', 140);

      // 賬單地址
      let billingText = 'N/A';
      if (di?.billingAddressType === 'residential') billingText = '同住宅地址 Same as Residential';
      else if (di?.billingAddressType === 'office') billingText = '辦公地址 Office Address';
      else if (di?.billingAddressType === 'other' && di?.billingAddressOther) billingText = di.billingAddressOther;

      y = ensureSpace(doc, y, ROW_HEIGHT);
      y = drawRow(doc, y, [
        { label: '賬單地址 Billing Address', value: billingText, labelWidth: 130, colWidth: 330 },
        { label: '首選語言 Language', value: di?.preferredLanguage === 'chinese' ? '中文 Chinese' : '英文 English', labelWidth: 90, colWidth: 165 },
      ]);
      y += 8;

      // ── A2. 職業資料 ──────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 4);
      y = drawSectionHeader(doc, 'A2.  職業資料  Occupation Information', y);

      const oc = data.occupation;
      y = drawRow(doc, y, [
        { label: '就業狀況 Employment Status', value: translate(oc?.employmentStatus), labelWidth: 140, colWidth: 247 },
        { label: '從業年限 Years of Service', value: oc?.yearsOfService || 'N/A', labelWidth: 130, colWidth: 248 },
      ]);
      y = drawRow(doc, y, [
        { label: '公司名稱 Company Name', value: oc?.companyName || 'N/A', labelWidth: 120, colWidth: 247 },
        { label: '職位 Position', value: oc?.position || 'N/A', labelWidth: 100, colWidth: 248 },
      ]);
      y = drawRow(doc, y, [
        { label: '行業 Industry', value: oc?.industry || 'N/A', labelWidth: 90, colWidth: 247 },
        { label: '辦公電話 Office Phone', value: oc?.officePhone || 'N/A', labelWidth: 110, colWidth: 248 },
      ]);
      y = ensureSpace(doc, y, 24);
      y = drawTallRow(doc, y, '辦公地址 Office Address', oc?.companyAddress || 'N/A', 130);
      y += 8;

      // ── B. 銀行參考 ───────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 3);
      y = drawSectionHeader(doc, 'B.  銀行參考  Bank Reference', y);

      const banks = data.bankAccounts && data.bankAccounts.length > 0
        ? data.bankAccounts
        : [{ bankName: null, accountType: null, currency: null, accountNumber: null, accountHolderName: null }];

      for (const acct of banks) {
        y = ensureSpace(doc, y, ROW_HEIGHT * 2 + 4);
        y = drawRow(doc, y, [
          { label: '銀行名稱 Bank Name', value: acct.bankName || 'N/A', labelWidth: 110, colWidth: 247 },
          { label: '戶口名稱 Account Name', value: acct.accountHolderName || 'N/A', labelWidth: 110, colWidth: 248 },
        ]);
        y = drawRow(doc, y, [
          { label: '戶口號碼 Account No.', value: acct.accountNumber || 'N/A', labelWidth: 110, colWidth: 165 },
          { label: '戶口類型 Type', value: translate(acct.accountType), labelWidth: 90, colWidth: 165 },
          { label: '貨幣 Currency', value: acct.currency || 'N/A', labelWidth: 80, colWidth: 165 },
        ]);
      }
      y += 8;

      // ── C. 財務狀況 ───────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 2);
      y = drawSectionHeader(doc, 'C.  財務狀況  Financial Status', y);

      const fi = data.financial;
      y = drawRow(doc, y, [
        { label: '收入來源 Income Source', value: fi?.incomeSource || 'N/A', labelWidth: 120, colWidth: CONTENT_WIDTH },
      ]);
      y = drawRow(doc, y, [
        { label: '年收入 Annual Income', value: formatAmountRange(fi?.annualIncome), labelWidth: 110, colWidth: 165 },
        { label: '流動資產 Liquid Assets', value: formatAmountRange(fi?.liquidAsset), labelWidth: 110, colWidth: 165 },
        { label: '淨資產 Net Worth', value: formatAmountRange(fi?.netWorth), labelWidth: 100, colWidth: 165 },
      ]);
      y += 8;

      // ── D. 投資目標及經驗 ─────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 3);
      y = drawSectionHeader(doc, 'D.  投資目標及經驗  Investment Objectives & Experience', y);

      const inv = data.investment;
      let objectivesText = 'N/A';
      if (inv?.investmentObjectives) {
        try {
          const parsed = typeof inv.investmentObjectives === 'string'
            ? JSON.parse(inv.investmentObjectives)
            : inv.investmentObjectives;
          if (Array.isArray(parsed)) {
            objectivesText = parsed.map(translate).join('  |  ');
          } else {
            objectivesText = String(inv.investmentObjectives);
          }
        } catch {
          objectivesText = String(inv.investmentObjectives);
        }
      }

      y = ensureSpace(doc, y, ROW_HEIGHT);
      y = drawRow(doc, y, [
        { label: '投資目標 Objectives', value: objectivesText, labelWidth: 120, colWidth: CONTENT_WIDTH },
      ]);

      const expText = formatInvestmentExperience(inv?.investmentExperience);
      y = ensureSpace(doc, y, 24);
      y = drawTallRow(doc, y, '投資經驗 Experience', expText, 120, ROW_HEIGHT);
      y += 8;

      // ── E. 風險評估 ───────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 2);
      y = drawSectionHeader(doc, 'E.  風險評估  Risk Assessment', y);

      const rq = data.riskQuestionnaire;
      const riskLevel = rq?.riskLevel || data.investment?.riskTolerance || 'N/A';
      const riskScore = rq?.totalScore != null ? String(rq.totalScore) : 'N/A';
      y = drawRow(doc, y, [
        { label: '風險承受能力評分 Risk Score', value: riskScore, labelWidth: 160, colWidth: 247 },
        { label: '風險等級 Risk Level', value: formatRiskTolerance(riskLevel), labelWidth: 110, colWidth: 248 },
      ]);
      if (rq?.riskDescription) {
        y = ensureSpace(doc, y, 24);
        y = drawTallRow(doc, y, '風險描述 Description', rq.riskDescription, 130);
      }
      y += 8;

      // ── F. 稅務資料 ───────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT);
      y = drawSectionHeader(doc, 'F.  稅務資料  Tax Information', y);
      y = drawRow(doc, y, [
        { label: '稅務居籍 Tax Jurisdiction', value: data.taxInfo?.taxResidency || 'N/A', labelWidth: 140, colWidth: 247 },
        { label: '稅務識別號 TIN', value: data.taxInfo?.taxIdNumber || 'N/A', labelWidth: 100, colWidth: 248 },
      ]);
      y += 8;

      // ── G. 上傳文件 ───────────────────────────────────────
      const docs = (data.uploadedDocuments || []).filter(d => d.documentType);
      y = ensureSpace(doc, y, 16 + Math.max(ROW_HEIGHT, docs.length * ROW_HEIGHT));
      y = drawSectionHeader(doc, 'G.  上傳文件  Uploaded Documents', y);

      if (docs.length === 0) {
        y = drawRow(doc, y, [{ label: '文件 Documents', value: 'N/A', labelWidth: 130, colWidth: CONTENT_WIDTH }]);
      } else {
        for (let idx = 0; idx < docs.length; idx++) {
          const docItem = docs[idx];
          const docLabel = `${idx + 1}. ${translate(docItem.documentType)}`;
          // Extract filename from URL (no raw S3 URLs)
          let fileName = 'N/A';
          if (docItem.fileUrl) {
            try {
              const urlObj = new URL(docItem.fileUrl);
              const pathParts = urlObj.pathname.split('/');
              fileName = decodeURIComponent(pathParts[pathParts.length - 1]) || 'N/A';
            } catch {
              // not a valid URL, use as-is but strip query
              fileName = docItem.fileUrl.split('?')[0].split('/').pop() || 'N/A';
            }
          }
          y = ensureSpace(doc, y, ROW_HEIGHT);
          y = drawRow(doc, y, [
            { label: docLabel, value: fileName, labelWidth: 180, colWidth: CONTENT_WIDTH },
          ]);
        }
      }
      y += 8;

      // ── H. 客戶聲明 ───────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 5);
      y = drawSectionHeader(doc, 'H.  客戶聲明  Client Declaration', y);

      const declRows: CellDef[][] = [
        [
          { label: `${checkbox(data.isUBO)} 實益擁有人 UBO`, value: data.isUBO ? '是 Yes' : '否 No', labelWidth: 180, colWidth: 247 },
          { label: `${checkbox(data.isPEP)} 政治公眾人物 PEP`, value: data.isPEP ? '是 Yes' : '否 No', labelWidth: 180, colWidth: 248 },
        ],
        [
          { label: `${checkbox(data.isUSPerson)} 美國人士 US Person`, value: data.isUSPerson ? '是 Yes' : '否 No', labelWidth: 180, colWidth: 247 },
          { label: `${checkbox(data.isSFCEmployee)} 證監會僱員 SFC Employee`, value: data.isSFCEmployee ? '是 Yes' : '否 No', labelWidth: 180, colWidth: 248 },
        ],
        [
          { label: `${checkbox(data.isCMFEmployee)} CMF僱員/關聯人 CMF Employee/Relative`, value: data.isCMFEmployee ? '是 Yes' : '否 No', labelWidth: 220, colWidth: CONTENT_WIDTH },
        ],
      ];
      for (const row of declRows) {
        y = ensureSpace(doc, y, ROW_HEIGHT);
        y = drawRow(doc, y, row);
      }
      y += 8;

      // ── I. 客戶確認 ───────────────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 7);
      y = drawSectionHeader(doc, 'I.  客戶確認  Customer Acknowledgement', y);

      const ackItems: Array<{ label: string; checked: boolean | null | undefined }> = [
        { label: '已閱讀並接受協議 Agreement Read & Accepted', checked: data.agreementRead },
        { label: '接受電子交易條例 ETO Consent', checked: data.electronicSignatureConsent },
        { label: '接受反洗錢合規 AML Compliance Consent', checked: data.amlComplianceConsent },
        { label: '接受風險評估結果 Risk Assessment Consent', checked: data.riskAssessmentConsent },
        { label: 'BCAN同意書 BCAN Consent', checked: data.bcanConsent },
        { label: '客戶確認書 Client Confirmation', checked: data.clientConfirmation },
        { label: '直接促銷同意 Direct Marketing Consent', checked: data.directMarketingConsent },
      ];

      for (const item of ackItems) {
        y = ensureSpace(doc, y, ROW_HEIGHT);
        y = drawRow(doc, y, [
          {
            label: `${checkbox(item.checked)} ${item.label}`,
            value: item.checked ? '同意 Agreed' : '未同意 Not Agreed',
            labelWidth: 280,
            colWidth: CONTENT_WIDTH,
          },
        ]);
      }
      y += 8;

      // ── J. 申請人聲明及簽署 ───────────────────────────────
      y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 3);
      y = drawSectionHeader(doc, 'J.  申請人聲明及簽署  Applicant Declaration & Signature', y);

      const sigName = data.signatureName || data.basicInfo?.englishName || 'N/A';
      y = drawRow(doc, y, [
        { label: '簽署人 Signature Name', value: sigName, labelWidth: 130, colWidth: 247 },
        { label: '簽署方式 Method', value: data.signatureMethod || 'Typed / 輸入', labelWidth: 110, colWidth: 248 },
      ]);
      y = drawRow(doc, y, [
        { label: '簽署時間 Timestamp', value: formatTimestamp(data.signatureTimestamp), labelWidth: 130, colWidth: CONTENT_WIDTH },
      ]);
      y += 8;

      // ── 審批記錄（如有）─────────────────────────────────
      if (data.firstApproval || data.secondApproval) {
        doc.addPage();
        drawPageHeader(doc);
        y = 60;

        y = drawSectionHeader(doc, '審批記錄  Approval Records', y);
        y += 4;

        const renderApproval = (title: string, appr: NonNullable<ApplicationPDFData['firstApproval']>) => {
          y = ensureSpace(doc, y, 16 + ROW_HEIGHT * 4);
          y = drawSectionHeader(doc, title, y);
          y = drawRow(doc, y, [
            { label: '審批人 Approver', value: appr.approverName || 'N/A', labelWidth: 100, colWidth: 247 },
            { label: 'CE號碼 CE No.', value: appr.approverCeNo || 'N/A', labelWidth: 90, colWidth: 248 },
          ]);
          y = drawRow(doc, y, [
            { label: '專業投資者 PI', value: appr.isProfessionalInvestor ? '是 Yes' : '否 No', labelWidth: 100, colWidth: 247 },
            { label: '風險評級 Risk Profile', value: appr.approvedRiskProfile ? formatRiskTolerance(appr.approvedRiskProfile) : 'N/A', labelWidth: 110, colWidth: 248 },
          ]);
          y = drawRow(doc, y, [
            { label: '審批時間 Time', value: formatTimestamp(appr.approvalTime), labelWidth: 100, colWidth: CONTENT_WIDTH },
          ]);
          if (appr.comments) {
            y = ensureSpace(doc, y, 24);
            y = drawTallRow(doc, y, '審批意見 Comments', appr.comments, 120);
          }
          y += 6;
        };

        if (data.firstApproval) renderApproval('初審記錄  First Approval', data.firstApproval);
        if (data.secondApproval) renderApproval('終審記錄  Final Approval', data.secondApproval);
      }

      // ── 所有頁面加頁首/頁尾 ──────────────────────────────
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        drawPageHeader(doc);
        drawPageFooter(doc, i + 1, range.count);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
