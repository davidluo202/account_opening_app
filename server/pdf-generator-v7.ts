/**
 * PDF生成模块 v7 — 表格样式（匹配 ApplicationPreview 页面格式）
 * 使用 PDFKit 生成带表格边框、蓝色段头、灰色标签列的专业 PDF
 */
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

const PROJECT_ROOT = process.cwd();
const FONT_PATH_SC = path.join(PROJECT_ROOT, 'server', 'fonts', 'NotoSansCJKsc-Regular.otf');
const FONT_PATH_TC = path.join(PROJECT_ROOT, 'server', 'fonts', 'NotoSansCJKtc-Regular.otf');
const LOGO_PATH = path.join(PROJECT_ROOT, 'client', 'public', 'logo-zh-official.jpg');

if (!fs.existsSync(FONT_PATH_SC)) {
  console.warn(`[PDF] Simplified Chinese font not found: ${FONT_PATH_SC}`);
}
if (!fs.existsSync(FONT_PATH_TC)) {
  console.warn(`[PDF] Traditional Chinese font not found: ${FONT_PATH_TC}`);
}

// ── Colors ────────────────────────────────────────────────
const BLUE = '#1a3a6a';
const GRAY_BG = '#f9fafb';
const GRAY_TEXT = '#4b5563';
const BLACK = '#111827';
const WHITE = '#ffffff';
const BORDER = '#d1d5db';

// ── Page geometry ─────────────────────────────────────────
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const M_LEFT = 40;
const M_RIGHT = 40;
const M_TOP = 80;
const M_BOTTOM = 60;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;
const FOOTER_Y = PAGE_H - M_BOTTOM + 10;

// ── Translations ──────────────────────────────────────────
const translations: Record<string, string> = {
  individual: '個人賬戶 Individual',
  joint: '聯名賬戶 Joint',
  corporate: '機構賬戶 Corporate',
  cash: '現金賬戶 Cash',
  margin: '保證金賬戶 Margin',
  derivatives_account: '衍生品賬戶 Derivatives',
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
  high_school: '高中學歷 High School',
  associate: '專科學歷 Associate',
  bachelor: '本科學歷 Bachelor',
  master: '碩士學歷 Master',
  doctorate: '博士學歷 Doctorate',
  primary: '小學學歷 Primary',
  secondary: '中學學歷 Secondary',
  employed: '受僱 Employed',
  self_employed: '自僱 Self-Employed',
  unemployed: '無業 Unemployed',
  retired: '退休 Retired',
  student: '學生 Student',
  housewife: '家庭主婦 Housewife',
  others: '其他 Others',
  saving: '儲蓄賬戶 Saving',
  current: '支票賬戶 Current',
  none: '無經驗 None',
  less_than_1: '少於1年 Less than 1 year',
  '1_to_3': '1-3 Years/年',
  '3_to_5': '3-5 Years/年',
  more_than_5: '5年以上 More than 5 years',
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
  HKD: '港幣 HKD',
  USD: '美元 USD',
  CNY: '人民幣 CNY',
  EUR: '歐元 EUR',
  GBP: '英鎊 GBP',
  JPY: '日圓 JPY',
  draft: '草稿 Draft',
  submitted: '已提交 Submitted',
  approved: '已批准 Approved',
  rejected: '已拒絕 Rejected',
};

const translate = (key: string | null | undefined): string => {
  if (!key) return '-';
  return translations[key] || key;
};

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-HK');
  } catch {
    return '-';
  }
}

function formatTimestamp(ts: string | Date | null | undefined): string {
  if (!ts) return '-';
  try {
    const d = typeof ts === 'string' ? new Date(ts) : ts;
    return d.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
  } catch {
    return '-';
  }
}

function formatAmountRange(range: string | null | undefined): string {
  if (!range) return '-';
  if (range.includes('-')) {
    const parts = range.split('-');
    if (parts.length === 2) {
      const start = parseInt(parts[0]);
      const end = parts[1].includes('+') ? parts[1] : parseInt(parts[1]);
      if (!isNaN(start)) {
        if (typeof end === 'number' && !isNaN(end)) {
          return `HKD ${start.toLocaleString('en-US')} - ${end.toLocaleString('en-US')}`;
        }
        if (typeof end === 'string' && end.includes('+')) {
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

function formatInvestmentExperience(experience: string | Record<string, string> | null | undefined): string {
  if (!experience) return '-';
  if (typeof experience === 'string') {
    try {
      const parsed = JSON.parse(experience);
      if (typeof parsed === 'object') experience = parsed;
    } catch { return String(experience); }
  }
  if (typeof experience === 'object' && experience !== null) {
    const items = Object.entries(experience)
      .filter(([, v]) => v && v !== 'none')
      .map(([k, v]) => `${translate(k)}: ${translate(v as string)}`);
    return items.length > 0 ? items.join('; ') : '-';
  }
  return String(experience);
}

function formatInvestmentObjectives(obj: string | null | undefined): string {
  if (!obj) return '-';
  try {
    const parsed = typeof obj === 'string' ? JSON.parse(obj) : obj;
    if (Array.isArray(parsed)) return parsed.map(o => translate(o)).join(', ');
  } catch { /* ignore */ }
  return translate(obj);
}

function formatIncomeSource(src: string | null | undefined): string {
  if (!src) return '-';
  try {
    const parsed = typeof src === 'string' ? JSON.parse(src) : src;
    if (Array.isArray(parsed)) return parsed.map(s => translate(s)).join(', ');
  } catch { /* ignore */ }
  return translate(src);
}

function formatRiskTolerance(level: string): string {
  const m: Record<string, string> = {
    conservative: '保守型 Conservative',
    moderate: '穩健型 Moderate',
    balanced: '均衡型 Balanced',
    aggressive: '積極型 Aggressive',
    speculative: '激進型 Speculative',
    R1: 'R1 - 低風險',
    R2: 'R2 - 中低風險',
    R3: 'R3 - 中風險',
    R4: 'R4 - 中高風險',
    R5: 'R5 - 高風險',
  };
  return m[level] || level;
}

// ── Data interface ────────────────────────────────────────
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
    idIssuingCountry?: string | null;
    idExpiryDate?: string | Date | null;
    idIsPermanent?: boolean | null;
    maritalStatus?: string | null;
    educationLevel?: string | null;
    residentialAddress?: string | null;
    billingAddressType?: string | null;
    billingAddressOther?: string | null;
    preferredLanguage?: string | null;
    phoneCountryCode?: string | null;
    phoneNumber?: string | null;
    mobileCountryCode?: string | null;
    mobileNumber?: string | null;
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
  } | null;
  bankAccounts?: Array<{
    bankName?: string | null;
    swiftCode?: string | null;
    accountType?: string | null;
    currency?: string | null;
    accountCurrency?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    accountHolderAddress?: string | null;
  }>;
  taxInfo?: {
    taxResidency?: string | null;
    taxIdNumber?: string | null;
  };
  uploadedDocuments?: Array<{
    documentType?: string | null;
    fileName?: string | null;
    fileUrl?: string | null;
  }>;
  personalClientDeclaration?: {
    declaration_a_is_beneficial_owner?: boolean | null;
    declaration_a_owner_name?: string | null;
    declaration_a_owner_id?: string | null;
    declaration_a_owner_country?: string | null;
    declaration_a_owner_address?: string | null;
    declaration_b_is_employee?: boolean | null;
    declaration_b_institution_name?: string | null;
    declaration_c_is_cmf_employee?: boolean | null;
    declaration_d_is_relative?: boolean | null;
    declaration_d_employee_name?: string | null;
    declaration_d_relationship?: string | null;
  } | null;
  signatureName?: string | null;
  signatureMethod?: string | null;
  signatureTimestamp?: string | Date | null;
  submittedAt?: string | Date | null;
  isPEP?: boolean | null;
  isUSPerson?: boolean | null;
  agreementRead?: boolean | null;
  agreementAccepted?: boolean | null;
  amlComplianceConsent?: boolean | null;
  etoConsent?: boolean | null;
  riskAssessmentConsent?: boolean | null;
  clientConfirmationRead?: boolean | null;
  objectsDirectMarketing?: boolean | null;
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

// ══════════════════════════════════════════════════════════
//  Main export
// ══════════════════════════════════════════════════════════
export async function generateApplicationPDF(data: ApplicationPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: M_TOP, bottom: M_BOTTOM, left: M_LEFT, right: M_RIGHT },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Register CJK font ────────────────────────────
      let fontName = 'Helvetica';
      try {
        if (fs.existsSync(FONT_PATH_TC)) {
          doc.registerFont('NotoSansCJK', FONT_PATH_TC);
          fontName = 'NotoSansCJK';
        } else if (fs.existsSync(FONT_PATH_SC)) {
          doc.registerFont('NotoSansCJK', FONT_PATH_SC);
          fontName = 'NotoSansCJK';
        }
      } catch (e) {
        console.error('[PDF] Failed to register CJK font:', e);
      }

      const F = fontName; // shorthand

      // ── Helper: add logo to current page ──────────────
      const addLogo = () => {
        if (fs.existsSync(LOGO_PATH)) {
          try {
            doc.image(LOGO_PATH, M_LEFT, 15, { width: 110 });
          } catch (e) { /* ignore */ }
        }
      };

      // First page logo
      addLogo();

      // ── Utility: check space and add page if needed ───
      const ensureSpace = (needed: number) => {
        if (doc.y + needed > PAGE_H - M_BOTTOM) {
          doc.addPage();
          addLogo();
          doc.y = M_TOP;
        }
      };

      // ── Drawing helpers ───────────────────────────────

      /** Draw a section header bar (blue background, white text, full width) */
      const drawSectionHeader = (text: string) => {
        ensureSpace(28);
        const y = doc.y;
        doc.save();
        doc.rect(M_LEFT, y, CONTENT_W, 24).fill(BLUE);
        doc.font(F).fontSize(10).fillColor(WHITE);
        doc.text(text, M_LEFT + 8, y + 6, { width: CONTENT_W - 16 });
        doc.restore();
        doc.fillColor(BLACK);
        doc.y = y + 24;
      };

      /**
       * Draw a table row.
       * cells: array of { label, value, colSpan? }
       * columns: total columns (2 or 4)
       */
      const ROW_PAD = 6;
      const LABEL_FONT = 8;
      const VALUE_FONT = 8.5;

      type Cell = { label?: string; value: string; colSpan?: number; isHeader?: boolean };

      const measureCellHeight = (text: string, width: number, fontSize: number): number => {
        doc.font(F).fontSize(fontSize);
        const h = doc.heightOfString(text, { width: width - 12 });
        return h + ROW_PAD * 2;
      };

      const drawTableRow = (cells: Cell[], columns: 4 | 2 = 4) => {
        const colW = CONTENT_W / columns;

        // For 4-column layout, each "field" = label cell + value cell (pair takes 2 columns)
        // For 2-column layout, label takes ~40%, value takes ~60%
        let actualCells: { x: number; w: number; text: string; isLabel: boolean }[] = [];

        if (columns === 4) {
          let colIdx = 0;
          for (const cell of cells) {
            if (cell.label !== undefined) {
              // label-value pair
              const span = cell.colSpan || 1; // number of value columns
              actualCells.push({ x: M_LEFT + colIdx * colW, w: colW, text: cell.label, isLabel: true });
              colIdx++;
              const valW = colW * span;
              actualCells.push({ x: M_LEFT + colIdx * colW, w: valW, text: cell.value, isLabel: false });
              colIdx += span;
            } else {
              // standalone value (colSpan covers from current position)
              const span = cell.colSpan || 1;
              const w = colW * span;
              actualCells.push({ x: M_LEFT + colIdx * colW, w, text: cell.value, isLabel: false });
              colIdx += span;
            }
          }
        } else {
          // 2-column: label ~40%, value ~60%
          const labelW = CONTENT_W * 0.4;
          const valueW = CONTENT_W * 0.6;
          for (const cell of cells) {
            if (cell.label !== undefined) {
              actualCells.push({ x: M_LEFT, w: labelW, text: cell.label, isLabel: true });
              actualCells.push({ x: M_LEFT + labelW, w: valueW, text: cell.value, isLabel: false });
            } else {
              actualCells.push({ x: M_LEFT, w: CONTENT_W, text: cell.value, isLabel: false });
            }
          }
        }

        // Measure max row height
        let rowH = 20;
        for (const c of actualCells) {
          const fs = c.isLabel ? LABEL_FONT : VALUE_FONT;
          const h = measureCellHeight(c.text, c.w, fs);
          if (h > rowH) rowH = h;
        }

        ensureSpace(rowH);
        const y = doc.y;

        // Draw cells
        for (const c of actualCells) {
          // Background
          doc.save();
          if (c.isLabel) {
            doc.rect(c.x, y, c.w, rowH).fill(GRAY_BG);
          }
          // Border
          doc.rect(c.x, y, c.w, rowH).lineWidth(0.5).strokeColor(BORDER).stroke();
          // Text
          const textColor = c.isLabel ? GRAY_TEXT : BLACK;
          const fontSize = c.isLabel ? LABEL_FONT : VALUE_FONT;
          doc.font(F).fontSize(fontSize).fillColor(textColor);
          doc.text(c.text, c.x + 6, y + ROW_PAD, { width: c.w - 12 });
          doc.restore();
        }

        doc.y = y + rowH;
        doc.fillColor(BLACK);
      };

      /** 4-column row: label | value | label | value */
      const row4 = (l1: string, v1: string, l2: string, v2: string) => {
        drawTableRow([
          { label: l1, value: v1 },
          { label: l2, value: v2 },
        ], 4);
      };

      /** 4-column row: label | value (spanning 3 columns) */
      const row4wide = (label: string, value: string) => {
        drawTableRow([
          { label, value, colSpan: 3 },
        ], 4);
      };

      /** 2-column row: label | value */
      const row2 = (label: string, value: string) => {
        drawTableRow([
          { label, value },
        ], 2);
      };

      // ══════════════════════════════════════════════════
      //  PAGE CONTENT
      // ══════════════════════════════════════════════════

      // ── Title ─────────────────────────────────────────
      doc.font(F).fontSize(16).fillColor(BLACK);
      doc.text('客戶開戶申請表（個人/聯名）', M_LEFT, M_TOP, { width: CONTENT_W, align: 'center' });
      doc.fontSize(11).text('Customer Account Opening Form (Ind/Joint)', { width: CONTENT_W, align: 'center' });
      doc.moveDown(0.3);

      // Application number and status
      doc.fontSize(9).fillColor(GRAY_TEXT);
      doc.text(`申請編號 Application No.: ${data.applicationNumber || '-'}     狀態 Status: ${translate(data.status)}`, M_LEFT, doc.y, { width: CONTENT_W });
      doc.moveDown(0.5);
      doc.fillColor(BLACK);

      // ── Account Type ──────────────────────────────────
      drawSectionHeader('賬戶類型 Account Type');
      row4('客戶類型 Customer Type', translate(data.accountSelection?.customerType),
           '賬戶類型 Account Type', translate(data.accountSelection?.accountType));

      doc.moveDown(0.3);

      // ── 1. Personal Basic Info ────────────────────────
      drawSectionHeader('1. 個人基本信息 Personal Basic Information');
      const bi = data.basicInfo;
      row4('中文姓名 Name (Chinese)', bi?.chineseName || '-',
           '英文姓名 Name (English)', bi?.englishName || '-');
      row4('性別 Gender', translate(bi?.gender),
           '出生日期 Date of Birth', formatDate(bi?.dateOfBirth));
      row4('出生地 Place of Birth', bi?.placeOfBirth || '-',
           '國籍 Nationality', bi?.nationality || '-');

      doc.moveDown(0.3);

      // ── 2. Personal Detailed Info ─────────────────────
      drawSectionHeader('2. 個人詳細信息 Personal Detailed Information');
      const di = data.detailedInfo;
      row4('證件類型 ID Type', translate(di?.idType),
           '證件號碼 ID Number', di?.idNumber || '-');
      row4('簽發國家/地區 Issuing Country', di?.idIssuingCountry || di?.idIssuingPlace || '-',
           '有效期 Expiry Date', di?.idIsPermanent ? '長期有效 Permanent' : formatDate(di?.idExpiryDate));
      row4('婚姻狀況 Marital Status', translate(di?.maritalStatus),
           '學歷 Education', translate(di?.educationLevel));
      row4('電子郵箱 Email', di?.email || '-',
           '手機號碼 Mobile', ((di?.mobileCountryCode || di?.phoneCountryCode || '') + ' ' + (di?.mobileNumber || di?.phoneNumber || '-')).trim());
      row4('傳真 Fax', di?.faxNo || '-', '', '');
      row4wide('住宅地址 Residential Address', di?.residentialAddress || '-');

      // Billing address
      let billingText = '-';
      if (di?.billingAddressType === 'residential') billingText = '住宅地址 Residential Address';
      else if (di?.billingAddressType === 'office') billingText = '辦公地址 Office Address';
      else if (di?.billingAddressType === 'other') billingText = `其他: ${di?.billingAddressOther || '-'}`;
      row4wide('賬單通訊地址 Billing Address', billingText);

      const langText = di?.preferredLanguage === 'english' ? '英文 English' : '中文 Chinese';
      row4wide('賬單首選語言 Preferred Language', langText);

      doc.moveDown(0.3);

      // ── 3. Occupation Info ────────────────────────────
      drawSectionHeader('3. 職業信息 Occupation Information');
      const oc = data.occupation;
      row4wide('就業狀況 Employment Status', translate(oc?.employmentStatus));
      if (oc?.employmentStatus === 'employed' || oc?.employmentStatus === 'self_employed') {
        row4('公司名稱 Company Name', oc?.companyName || '-',
             '職位 Position', oc?.position || '-');
        row4('從業年限 Years of Service', oc?.yearsOfService || '-',
             '行業 Industry', oc?.industry || '-');
        row4wide('辦公地址 Office Address', oc?.companyAddress || '-');
        row4('辦公電話 Office Phone', oc?.officePhone || '-',
             '辦公傳真 Office Fax', oc?.officeFaxNo || '-');
      }

      doc.moveDown(0.3);

      // ── 4. Financial Status ───────────────────────────
      drawSectionHeader('4. 財務狀況 Financial Status');
      const fi = data.financial;
      row4('收入來源 Income Source', formatIncomeSource(fi?.incomeSource),
           '年收入 Annual Income', formatAmountRange(fi?.annualIncome));
      row4('流動資產 Liquid Asset', formatAmountRange(fi?.liquidAsset),
           '淨資產 Net Worth', formatAmountRange(fi?.netWorth));

      doc.moveDown(0.3);

      // ── 5. Investment Info ────────────────────────────
      drawSectionHeader('5. 投資信息 Investment Information');
      const inv = data.investment;
      row4wide('投資目的 Investment Objective', formatInvestmentObjectives(inv?.investmentObjectives));
      row4wide('投資經驗 Investment Experience', formatInvestmentExperience(inv?.investmentExperience));

      doc.moveDown(0.3);

      // ── 6. Risk Assessment Questionnaire ──────────────
      drawSectionHeader('6. 風險評估問卷 Risk Assessment Questionnaire');
      const rq = data.riskQuestionnaire;
      if (rq) {
        // Q1
        let q1Text = '-';
        try {
          const q1Arr = JSON.parse(rq.q1_current_investments || '[]');
          if (Array.isArray(q1Arr) && q1Arr.length > 0) {
            q1Text = q1Arr.map((item: string) => {
              if (item === 'savings') return '儲蓄/定期儲蓄/存款證/保本產品';
              if (item === 'bonds') return '债券/證券/單位信託基金/投資相連保險計劃';
              if (item === 'derivatives') return '期貨/期權/衍生產品/結構性投資產品';
              return item;
            }).join(', ');
          }
        } catch { /* ignore */ }
        row2('Q1. 現在是否持有以下任何投資產品？', q1Text);

        // Q2
        const q2Map: Record<string, string> = { less_than_1: '沒有或少於1年', '1_to_3': '1-3年', more_than_3: '多於3年' };
        row2('Q2. 預期投資年期是多少？', q2Map[rq.q2_investment_period || ''] || '-');

        // Q3
        const q3Map: Record<string, string> = { '10_percent': '價格波幅介乎-10%至+10%', '20_percent': '價格波幅介乎-20%至+20%', '30_percent': '價格波幅多於-30%至多於+30%' };
        row2('Q3. 可以接受以下哪個年度價格波幅？', q3Map[rq.q3_price_volatility || ''] || '-');

        // Q4
        const q4Map: Record<string, string> = { less_than_10: '少於10%', '10_to_20': '介乎10%至20%', '21_to_30': '介乎21%至30%', '31_to_50': '介乎31%至50%', more_than_50: '多於50%' };
        row2('Q4. 資產淨值中可作投資用途的百分比？', q4Map[rq.q4_investment_percentage || ''] || '-');

        // Q5
        const q5Map: Record<string, string> = {
          no_volatility: '不能接受任何價格波動',
          small_volatility: '只能接受較小幅度的價格波動',
          some_volatility: '可接受若干價格波幅',
          large_volatility: '可接受大幅度的價格波動',
          any_volatility: '可接受任何幅度的價格波動',
        };
        row2('Q5. 對金融投資的一般態度？', q5Map[rq.q5_investment_attitude || ''] || '-');

        // Q6
        let q6Text = '-';
        try {
          const q6Arr = JSON.parse(rq.q6_derivatives_knowledge || '[]');
          if (Array.isArray(q6Arr) && q6Arr.length > 0) {
            q6Text = q6Arr.map((item: string) => {
              if (item === 'training') return '曾接受衍生產品培訓或課程';
              if (item === 'experience') return '擁有衍生產品相關工作經驗';
              if (item === 'transactions') return '過往3年曾執行5次或以上衍生產品交易';
              if (item === 'no_knowledge') return '沒有衍生工具之認識';
              return item;
            }).join(', ');
          }
        } catch { /* ignore */ }
        row2('Q6. 對衍生工具產品的認識', q6Text);

        // Q7
        const q7Map: Record<string, string> = {
          age_18_25: '介乎18至25歲', age_26_35: '介乎26至35歲', age_36_50: '介乎36至50歲',
          age_51_64: '介乎51至64歲', age_65_plus: '65歲或以上',
          less_than_1m: '少於港幣$1,000,000', '1m_to_5m': '介乎港幣$1,000,001至$5,000,000',
          '5m_to_10m': '介乎港幣$5,000,001至$10,000,000', over_10m: '多於港幣$10,000,000', more_than_10m: '多於港幣$10,000,000',
        };
        row2('Q7. 年齡組別 / 投資金額', q7Map[rq.q7_age_group || ''] || '-');

        // Q8
        const q8Map: Record<string, string> = {
          primary_or_below: '小學或以下', secondary: '中學', post_secondary: '大專或以上',
          less_than_25: '少於25%', '25_to_50': '介乎25%至50%', '51_to_75': '介乎51%至75%', over_75: '多於75%', more_than_75: '多於75%',
        };
        row2('Q8. 教育程度 / 高風險投資比例', q8Map[rq.q8_education_level || ''] || '-');

        // Q9
        let q9Text = '-';
        const q9Val = rq.q9_investment_knowledge_sources;
        if (q9Val) {
          try {
            const arr = typeof q9Val === 'string' ? JSON.parse(q9Val) : q9Val;
            if (Array.isArray(arr)) {
              q9Text = arr.map((item: string) => {
                if (item === 'never') return '從未獲取投資知識';
                if (item === 'relatives') return '與親友討論投資話題';
                if (item === 'media') return '閱讀投資或財經新聞';
                if (item === 'courses') return '研究投資或參加課程';
                return item;
              }).join('、');
            } else {
              const singleMap: Record<string, string> = {
                no_no_knowledge: '否，沒有相關知識',
                no_adequate_knowledge: '否，但有足夠相關知識',
                yes_little_knowledge: '是，但只有少許知識',
                yes_adequate_knowledge: '是，有足夠相關知識',
                yes_some_knowledge: '是，但只有一些知識',
                yes_adequate_management: '是，有足夠知識的管理層',
              };
              q9Text = singleMap[String(q9Val)] || String(q9Val);
            }
          } catch {
            const singleMap: Record<string, string> = {
              no_no_knowledge: '否，沒有相關知識',
              no_adequate_knowledge: '否，但有足夠相關知識',
              yes_little_knowledge: '是，但只有少許知識',
              yes_adequate_knowledge: '是，有足夠相關知識',
            };
            q9Text = singleMap[String(q9Val)] || String(q9Val);
          }
        }
        row2('Q9. 投資知識來源', q9Text);

        // Q10
        const q10Map: Record<string, string> = {
          no_sell: '不需要出售任何投資', sell_less_30: '出售不超過30%的投資',
          sell_30_50: '出售超過30%但不到50%的投資', sell_more_50: '出售超過50%的投資',
          less_than_3m: '少於3個月營運開支', less_than_3_months: '少於3個月營運開支',
          '3m_to_6m': '3至6個月營運開支', '3_to_6_months': '3至6個月營運開支',
          '6m_to_12m': '6至12個月營運開支', '6_to_12_months': '6至12個月營運開支',
          '12m_plus': '12個月以上營運開支', more_than_12_months: '12個月以上營運開支',
        };
        row2('Q10. 流動資金需求', q10Map[rq.q10_liquidity_needs || ''] || '-');

        // Risk result summary
        doc.moveDown(0.15);
        row2('風險評估總分 Total Score', String(rq.totalScore ?? '-'));
        const rqScore = rq.totalScore || 0;
        const rLevel = rqScore <= 99 ? '最低風險 Lowest (R1)' : rqScore <= 199 ? '低風險 Low (R2)' : rqScore <= 299 ? '低至中等風險 Low to Medium (R3)' : rqScore <= 399 ? '中等風險 Medium (R4)' : rqScore <= 599 ? '中等至高風險 Medium to High (R5)' : '高風險 High (R6)';
        row2('風險承受能力 Risk Tolerance', rLevel);
      } else {
        row2('狀態 Status', '未完成風險評估問卷');
      }

      doc.moveDown(0.3);

      // ── 7. Bank Account ───────────────────────────────
      drawSectionHeader('7. 銀行賬戶 Bank Account');
      if (data.bankAccounts && data.bankAccounts.length > 0) {
        data.bankAccounts.forEach((acc, idx) => {
          if (idx > 0) doc.moveDown(0.15);
          row2('銀行名稱 Bank Name', acc.bankName || '-');
          row2('SWIFT Code', acc.swiftCode || '-');
          row2('賬戶類型 Account Type', translate(acc.accountType));
          row2('幣種 Currency', acc.accountCurrency || acc.currency || '-');
          row2('賬號 Account Number', acc.accountNumber || '-');
          row2('持有人 Holder Name', acc.accountHolderName || '-');
          row2('持有人地址 Holder Address', acc.accountHolderAddress || '-');
        });
      } else {
        row2('狀態 Status', '未添加銀行賬戶');
      }

      doc.moveDown(0.3);

      // ── 8. Tax Info ───────────────────────────────────
      drawSectionHeader('8. 稅務信息 Tax Information');
      row4('稅務管轄區 Tax Jurisdiction', data.taxInfo?.taxResidency || '-',
           '稅務識別號 TIN', data.taxInfo?.taxIdNumber || '-');

      doc.moveDown(0.3);

      // ── 9. Document Upload ────────────────────────────
      drawSectionHeader('9. 文件上傳 Document Upload');
      if (data.uploadedDocuments && data.uploadedDocuments.length > 0) {
        // Table header
        const headerY = doc.y;
        const col1W = CONTENT_W * 0.5;
        const col2W = CONTENT_W * 0.5;
        doc.save();
        doc.rect(M_LEFT, headerY, col1W, 20).fill(GRAY_BG);
        doc.rect(M_LEFT, headerY, col1W, 20).lineWidth(0.5).strokeColor(BORDER).stroke();
        doc.rect(M_LEFT + col1W, headerY, col2W, 20).fill(GRAY_BG);
        doc.rect(M_LEFT + col1W, headerY, col2W, 20).lineWidth(0.5).strokeColor(BORDER).stroke();
        doc.font(F).fontSize(8).fillColor(GRAY_TEXT);
        doc.text('文件類型 Document Type', M_LEFT + 6, headerY + 5, { width: col1W - 12 });
        doc.text('狀態 Status', M_LEFT + col1W + 6, headerY + 5, { width: col2W - 12 });
        doc.restore();
        doc.y = headerY + 20;

        data.uploadedDocuments.forEach((docItem) => {
          ensureSpace(20);
          const ry = doc.y;
          doc.save();
          doc.rect(M_LEFT, ry, col1W, 20).lineWidth(0.5).strokeColor(BORDER).stroke();
          doc.rect(M_LEFT + col1W, ry, col2W, 20).lineWidth(0.5).strokeColor(BORDER).stroke();
          doc.font(F).fontSize(8).fillColor(BLACK);
          doc.text(translate(docItem.documentType), M_LEFT + 6, ry + 5, { width: col1W - 12 });
          doc.text('已遞交 Submitted', M_LEFT + col1W + 6, ry + 5, { width: col2W - 12 });
          doc.restore();
          doc.y = ry + 20;
        });
      } else {
        row2('狀態 Status', '未上傳文件');
      }

      doc.moveDown(0.3);

      // ── 10. Client Declaration ────────────────────────
      drawSectionHeader('10. 客戶聲明 Client Declaration');
      const pcd = data.personalClientDeclaration;
      if (pcd) {
        row2('最終權益擁有人 Ultimate Beneficial Owner', pcd.declaration_a_is_beneficial_owner ? '是 Yes' : '否 No');
        if (!pcd.declaration_a_is_beneficial_owner && pcd.declaration_a_owner_name) {
          row2('受益人資料 Beneficial Owner', `姓名: ${pcd.declaration_a_owner_name} | 證件: ${pcd.declaration_a_owner_id || '-'} | 國家: ${pcd.declaration_a_owner_country || '-'} | 地址: ${pcd.declaration_a_owner_address || '-'}`);
        }
        row2('SFC持牌機構雇員/董事', pcd.declaration_b_is_employee ? `是 - ${pcd.declaration_b_institution_name || ''}` : '否 No');
        row2('誠港金融雇員 CMF Employee', pcd.declaration_c_is_cmf_employee ? '是 Yes' : '否 No');
        row2('誠港金融雇員/董事親屬 CMF Relative', pcd.declaration_d_is_relative ? `是 - ${pcd.declaration_d_employee_name || ''} (${pcd.declaration_d_relationship || ''})` : '否 No');
      } else {
        // Fallback: use isPEP / isUSPerson fields directly
        row4('是否為PEP', data.isPEP ? '是 Yes' : '否 No',
             '是否為US Person', data.isUSPerson ? '是 Yes' : '否 No');
      }

      doc.moveDown(0.3);

      // ── 11. Regulatory Declaration ────────────────────
      drawSectionHeader('11. 監管聲明 Regulatory Declaration');
      row4('是否為PEP', data.isPEP ? '是 Yes' : '否 No',
           '是否為US Person', data.isUSPerson ? '是 Yes' : '否 No');
      row4wide('已閱讀開戶協議 Read Agreement', (data.agreementRead || data.agreementAccepted) ? '是 Yes' : '否 No');
      row4wide('接受電子交易條例 ETO Consent', data.etoConsent ? '已接受 Accepted' : '未接受 Not Accepted');
      row4wide('接受反洗錢和合規監管 AML Consent', data.amlComplianceConsent ? '已接受 Accepted' : '未接受 Not Accepted');
      row4wide('風險評估確認 Risk Assessment Consent', data.riskAssessmentConsent ? '已確認 Confirmed' : '未確認 Not Confirmed');
      row4wide('客戶確認 Client Confirmation', data.clientConfirmationRead ? '已閱讀並同意 Read and Agreed' : '未確認 Not Confirmed');
      row4wide('直接促銷 Direct Marketing', data.objectsDirectMarketing
        ? '反對 — 反對使用個人資料於直接促銷 / Objects'
        : '同意 — 同意使用個人資料於直接促銷 / Agrees');

      doc.moveDown(0.5);

      // ── Applicant Declaration & Signature ─────────────
      drawSectionHeader('申請人聲明及簽署 Applicant Declaration and Signature');
      doc.moveDown(0.3);
      doc.font(F).fontSize(8.5).fillColor(BLACK);
      doc.text('客戶聲明 Customer Declaration:', M_LEFT, doc.y, { width: CONTENT_W });
      doc.moveDown(0.15);
      doc.fontSize(8).fillColor(GRAY_TEXT);
      doc.text('本人聲明以上所填寫的資料均屬真實、準確和完整，並同意遵守貴公司的條款及細則。', M_LEFT, doc.y, { width: CONTENT_W });
      doc.text('I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company.', M_LEFT, doc.y, { width: CONTENT_W });
      doc.moveDown(0.5);

      // Signature blank area
      ensureSpace(100);
      doc.fillColor(BLACK).fontSize(9).font(F);
      doc.text('客戶簽署 Client Signature:', M_LEFT, doc.y);
      doc.moveDown(2.5);
      const sigY = doc.y;
      doc.moveTo(M_LEFT, sigY).lineTo(M_LEFT + 280, sigY).lineWidth(0.5).strokeColor(BORDER).stroke();
      doc.moveDown(2);
      doc.text('簽署日期 Date:', M_LEFT, doc.y);
      doc.moveDown(2);
      const dateY = doc.y;
      doc.moveTo(M_LEFT, dateY).lineTo(M_LEFT + 200, dateY).lineWidth(0.5).strokeColor(BORDER).stroke();
      doc.moveDown(1.5);

      // ── Approval Records (if present) ─────────────────
      if ((data.firstApproval && data.firstApproval.approverName) || (data.secondApproval && data.secondApproval.approverName)) {
        doc.addPage();
        doc.y = M_TOP;
        drawSectionHeader('審批記錄 Approval Records');

        if (data.firstApproval) {
          doc.moveDown(0.2);
          doc.font(F).fontSize(9).fillColor(BLACK).text('初審記錄 First Approval Record', M_LEFT);
          doc.moveDown(0.15);
          row2('審批人員 Approver', data.firstApproval.approverName || '-');
          row2('CE號碼 CE Number', data.firstApproval.approverCeNo || '-');
          row2('專業投資者認定 Professional Investor', data.firstApproval.isProfessionalInvestor ? '是 Yes' : '否 No');
          row2('風險評級 Risk Profile', data.firstApproval.approvedRiskProfile ? formatRiskTolerance(data.firstApproval.approvedRiskProfile) : '-');
          row2('審批時間 Approval Time', formatTimestamp(data.firstApproval.approvalTime));
          if (data.firstApproval.comments) {
            row2('審批意見 Comments', data.firstApproval.comments);
          }
          doc.moveDown(0.3);
        }

        if (data.secondApproval) {
          doc.font(F).fontSize(9).fillColor(BLACK).text('終審記錄 Final Approval Record', M_LEFT);
          doc.moveDown(0.15);
          row2('審批人員 Approver', data.secondApproval.approverName || '-');
          if (data.secondApproval.approverCeNo) {
            row2('CE號碼 CE Number', data.secondApproval.approverCeNo);
          }
          row2('專業投資者認定 Professional Investor', data.secondApproval.isProfessionalInvestor ? '是 Yes' : '否 No');
          row2('風險評級 Risk Profile', data.secondApproval.approvedRiskProfile ? formatRiskTolerance(data.secondApproval.approvedRiskProfile) : '-');
          row2('審批時間 Approval Time', formatTimestamp(data.secondApproval.approvalTime));
          if (data.secondApproval.comments) {
            row2('審批意見 Comments', data.secondApproval.comments);
          }
        }
      }

      // ── Footer on all pages ───────────────────────────
      const footerText = '誠港金融股份有限公司 CMF Securities Ltd. | Rm 308, 3/F, 308 Des Voeux Road Central, HK | Tel: 2598-1700 | info@cmfinancial.com | CE No. BSU667';
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        // Footer line
        doc.save();
        doc.moveTo(M_LEFT, FOOTER_Y - 4).lineTo(M_LEFT + CONTENT_W, FOOTER_Y - 4).lineWidth(0.3).strokeColor(BORDER).stroke();
        doc.font(F).fontSize(6).fillColor(GRAY_TEXT);
        doc.text(footerText, M_LEFT, FOOTER_Y, { width: CONTENT_W, align: 'center', lineBreak: false });

        // Page number
        const pageText = `${i + 1} / ${pages.count}`;
        doc.text(pageText, M_LEFT, FOOTER_Y + 10, { width: CONTENT_W, align: 'center', lineBreak: false });
        doc.restore();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
