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
  mainland_id: '中國大陸身份證',
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
  business: '業務收入',
  business_income: '營業收入',
  investment: '投資收益',
  investment_income: '投資收益',
  rental: '租金收入',
  rental_income: '租金收入',
  pension: '養老金',
  family: '家庭支持',
  inheritance: '繼承財產',
  gift: '贈與',
  savings: '儲蓄',
  
  // 文件類型
  id_card: '身份證件',
  bank_statement: '銀行月結單',
  address_proof: '住址證明',
  income_proof: '收入證明',
  business_license: '營業執照',
  other_document: '其他文件',
  
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
  under_review: '審核中',
  approved: '已審批',
  rejected: '已拒絕',
  returned: '已退回',
};

/**
 * 獲取詳細的申請狀態顯示
 * 根據初審和終審狀態返回更精確的狀態描述
 */
export function getDetailedStatus(
  status: string,
  firstApprovalStatus?: string | null,
  secondApprovalStatus?: string | null
): string {
  // 已經終審批准
  if (status === 'approved' && secondApprovalStatus === 'approved') {
    return '已審批';
  }
  
  // 已經初審批准，待終審
  if (status === 'under_review' && firstApprovalStatus === 'approved' && (!secondApprovalStatus || secondApprovalStatus === 'pending')) {
    return '待終審';
  }
  
  // 已提交，待初審
  if (status === 'submitted' || (status === 'under_review' && !firstApprovalStatus)) {
    return '待初審';
  }
  
  // 已拒絕
  if (status === 'rejected') {
    return '已拒絕';
  }
  
  // 已退回
  if (status === 'returned') {
    return '已退回';
  }
  
  // 草稿
  if (status === 'draft') {
    return '草稿';
  }
  
  // 默認返回翻譯後的狀態
  return translate(status);
}

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
 * 獲取風險等級的完整描述
 */
export function getRiskToleranceDescription(riskLevel: string | null | undefined): string {
  if (!riskLevel) return 'N/A';
  
  const descriptions: Record<string, string> = {
    R1: 'R1 - 低風險：在一定的時間內，本金安全的不穩定性很低，基金淨值會有輕度波動，或造成較微的本金虧損',
    R2: 'R2 - 中低風險：在一定時間內，本金安全的不穩定性相對較低，基金淨值會有較低波動，或造成較低的本金虧損',
    R3: 'R3 - 中風險：在一定時間內，本金安全具有一定的不穩定性，基金淨值會有適度波動，或造成一定的本金虧損',
    R4: 'R4 - 中高風險：在一定時間內，本金安全的不穩定性相對較高，基金淨值會有較高波動，或造成較大的本金虧損',
    R5: 'R5 - 高風險：在一定的時間內，本金安全的不穩定性很高，基金淨值會有高度波動，或造成很大的本金虧損',
  };
  
  return descriptions[riskLevel] || translate(riskLevel);
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

// 最後更新: 2026-02-02
