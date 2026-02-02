/**
 * 翻譯工具 - 用於將英文代碼轉換為中文顯示
 */

export const translations: Record<string, string> = {
  // 客戶類型
  individual: '個人賬戶',
  joint: '聯名賬戶',
  corporate: '機構賬戶',
  
  // 賬戶類型
  cash: '現金賬戶',
  margin: '保證金賬戶',
  derivatives_account: '衍生品賬戶',
  
  // 性別
  male: '男',
  female: '女',
  other: '其他',
  
  // 證件類型
  hkid: '香港身份證',
  passport: '護照',
  'mainland-id': '中國大陸居民身份證',
  'taiwan-id': '台灣居民身份證',
  'macao-id': '澳門居民身份證',
  
  // 婚姻狀況
  single: '單身',
  married: '已婚',
  divorced: '離婚',
  widowed: '喪偶',
  
  // 教育程度
  high_school: '高中學歷',
  associate: '專科學歷',
  bachelor: '本科學歷',
  master: '碩士學歷',
  doctorate: '博士學歷',
  primary: '小學學歷',
  secondary: '中學學歷',
  
  // 就業狀態
  employed: '受僱',
  self_employed: '自僱',
  unemployed: '無業',
  retired: '退休',
  student: '學生',
  
  // 銀行賬戶類型
  saving: '儲蓄賬戶',
  current: '支票賬戶',
  
  // 投資經驗
  none: '無經驗',
  less_than_1: '少於1年',
  '1_to_3': '1-3年',
  '3_to_5': '3-5年',
  more_than_5: '5年以上',
  
  // 投資產品
  stocks: '股票',
  bonds: '債券',
  funds: '基金',
  derivatives: '衍生品',
  forex: '外匯',
  commodities: '商品',
  
  // 投資目標
  capital_growth: '資本增值',
  income_generation: '收益生成',
  capital_preservation: '資本保值',
  speculation: '投機',
  hedging: '對沖',
  
  // 收入來源
  salary: '薪金',
  business_income: '營業收入',
  investment_income: '投資收益',
  rental_income: '租金收入',
  pension: '養老金',
  inheritance: '繼承財產',
  gift: '贈與',
  savings: '儲蓄',
  
  // 風險等級
  R1: 'R1 - 低風險',
  R2: 'R2 - 中低風險',
  R3: 'R3 - 中風險',
  R4: 'R4 - 中高風險',
  R5: 'R5 - 高風險',
  
  // 幣種
  HKD: '港幣',
  USD: '美元',
  CNY: '人民幣',
  EUR: '歐元',
  GBP: '英鎊',
  JPY: '日元',
  
  // 申請狀態
  draft: '草稿',
  submitted: '已提交',
  approved: '已批准',
  rejected: '已拒絕',
};

/**
 * 翻譯函數 - 將英文代碼轉換為中文
 */
export function translate(key: string | null | undefined): string {
  if (!key) return 'N/A';
  return translations[key] || key;
}

/**
 * 格式化金額
 */
export function formatAmount(amount: string | number | null | undefined): string {
  if (!amount) return 'N/A';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'N/A';
  return `HKD ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * 格式化投資經驗
 */
export function formatInvestmentExperience(experience: string | Record<string, string> | null | undefined): string {
  if (!experience) return 'N/A';
  
  // 如果是字符串，嘗試解析為JSON
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
  
  // 如果是對象，格式化為列表
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

/**
 * 格式化投資目標
 */
export function formatInvestmentObjectives(objectives: string | string[] | null | undefined): string {
  if (!objectives) return 'N/A';
  
  // 如果是字符串，嘗試解析為JSON
  if (typeof objectives === 'string') {
    try {
      const parsed = JSON.parse(objectives);
      if (Array.isArray(parsed)) {
        objectives = parsed;
      }
    } catch (e) {
      return String(objectives);
    }
  }
  
  // 如果是數組，格式化為列表
  if (Array.isArray(objectives)) {
    const items = objectives
      .filter(obj => obj && obj !== '')
      .map(obj => translate(obj));
    
    return items.length > 0 ? items.join(', ') : 'N/A';
  }
  
  return String(objectives);
}
