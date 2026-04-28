/**
 * 表單校驗工具函數
 * 包含中文/英文姓名、年齡、身份證號碼、證件有效期等校驗規則
 */

/**
 * 校驗中文姓名格式（2-10個漢字，包括繁體和簡體）
 */
export function validateChineseName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, message: '請輸入中文姓名' };
  }

  // 匹配中文字符（包括繁體和簡體）
  // 匹配中文字符（包括繁體和簡體）
  const chineseRegex = /^[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]{2,10}$/;

  if (!chineseRegex.test(name.trim())) {
    return { valid: false, message: '中文姓名必須為2-10個漢字' };
  }

  return { valid: true };
}

/**
 * 校驗英文姓名格式（字母、空格、連字符、撇號）
 */
export function validateEnglishName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, message: '請輸入英文姓名' };
  }

  // 匹配英文字母、空格、連字符、撇號
  const englishRegex = /^[A-Za-z\s\-']+$/;

  if (!englishRegex.test(name.trim())) {
    return { valid: false, message: '英文姓名只能包含字母、空格、連字符和撇號' };
  }

  if (name.trim().length < 2 || name.trim().length > 50) {
    return { valid: false, message: '英文姓名長度必須在2-50個字符之間' };
  }

  return { valid: true };
}

/**
 * 校驗年齡是否≥18歲
 */
export function validateAge(birthDate: string): { valid: boolean; message?: string; age?: number } {
  if (!birthDate) {
    return { valid: false, message: '請選擇出生日期' };
  }

  const birth = new Date(birthDate);
  const today = new Date();

  // 計算年齡
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 18) {
    return { valid: false, message: '申請人必須年滿18歲', age };
  }

  if (age > 120) {
    return { valid: false, message: '請輸入有效的出生日期', age };
  }

  return { valid: true, age };
}

/**
 * 校驗香港身份證號碼格式
 * 格式：A123456(7) 或 AB123456(7)
 */
export function validateHKID(idNumber: string): { valid: boolean; message?: string } {
  if (!idNumber || idNumber.trim() === '') {
    return { valid: false, message: '請輸入香港身份證號碼' };
  }

  // 移除括號和空格
  const cleaned = idNumber.replace(/[\s()]/g, '').toUpperCase();

  // 香港身份證格式：1-2個字母 + 6位數字 + 1位校驗碼（數字或A）
  const hkidRegex = /^[A-Z]{1,2}\d{6}[\dA]$/;

  if (!hkidRegex.test(cleaned)) {
    return { valid: false, message: '香港身份證號碼格式不正確（例如：A123456(7)）' };
  }

  // 可以添加更嚴格的校驗碼驗證邏輯
  return { valid: true };
}

/**
 * 校驗大陸身份證號碼格式（18位）
 * 包括性別校驗
 */
export function validateChinaID(idNumber: string): {
  valid: boolean;
  message?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
} {
  return validateChinaIDWithMatch(idNumber);
}

/**
 * 校驗大陸身份證號碼格式，並匹配用戶輸入的出生日期和性別
 * @param idNumber 身份證號碼
 * @param userBirthDate 用戶輸入的出生日期（YYYY-MM-DD格式）
 * @param userGender 用戶輸入的性別
 */
export function validateChinaIDWithMatch(
  idNumber: string,
  userBirthDate?: string,
  userGender?: 'male' | 'female' | 'other'
): {
  valid: boolean;
  message?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
} {
  if (!idNumber || idNumber.trim() === '') {
    return { valid: false, message: '請輸入大陸身份證號碼' };
  }

  const cleaned = idNumber.replace(/\s/g, '');

  // 18位身份證號碼格式
  const chinaIdRegex = /^\d{17}[\dXx]$/;

  if (!chinaIdRegex.test(cleaned)) {
    return { valid: false, message: '大陸身份證號碼必須為18位' };
  }

  // 提取出生日期（第7-14位）
  const birthYear = cleaned.substring(6, 10);
  const birthMonth = cleaned.substring(10, 12);
  const birthDay = cleaned.substring(12, 14);
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

  // 驗證出生日期是否有效
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) {
    return { valid: false, message: '身份證號碼中的出生日期無效' };
  }

  // 提取性別（第17位，奇數為男，偶數為女）
  const genderDigit = parseInt(cleaned.charAt(16));
  const gender = genderDigit % 2 === 1 ? 'male' : 'female';

  // 校驗碼驗證（第18位）
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights[i];
  }

  const checkCode = checkCodes[sum % 11];
  const providedCheckCode = cleaned.charAt(17).toUpperCase();

  if (checkCode !== providedCheckCode) {
    return { valid: false, message: '身份證號碼校驗碼不正確' };
  }

  // 如果提供了用戶輸入的出生日期，驗證是否匹配
  if (userBirthDate) {
    // 解析用戶輸入的日期
    const userDate = new Date(userBirthDate);
    const idDate = new Date(birthDate);

    // 比較年月日
    if (userDate.getFullYear() !== idDate.getFullYear() ||
        userDate.getMonth() !== idDate.getMonth() ||
        userDate.getDate() !== idDate.getDate()) {
      return {
        valid: false,
        message: `身份證上的出生日期（${birthDate}）與您輸入的出生日期不匹配`,
        gender,
        birthDate
      };
    }
  }

  // 如果提供了用戶輸入的性別，驗證是否匹配
  if (userGender && userGender !== 'other') {
    if (gender !== userGender) {
      const genderText = gender === 'male' ? '男性' : '女性';
      const userGenderText = userGender === 'male' ? '男性' : '女性';
      return {
        valid: false,
        message: `身份證上的性別（${genderText}）與您輸入的性別（${userGenderText}）不匹配`,
        gender,
        birthDate
      };
    }
  }

  return { valid: true, gender, birthDate };
}

/**
 * 校驗香港銀行賬戶號碼格式
 * 香港銀行賬戶號碼通常為6-12位數字，可能包含連字符
 */
export function validateHKBankAccount(accountNumber: string, bankName?: string): {
  valid: boolean;
  message?: string;
} {
  if (!accountNumber || accountNumber.trim() === '') {
    return { valid: false, message: '請輸入銀行賬戶號碼' };
  }

  // 移除空格和連字符
  const cleaned = accountNumber.replace(/[\s-]/g, '');

  // 香港銀行賬戶號碼通常為6-12位數字
  if (!/^\d{6,12}$/.test(cleaned)) {
    return {
      valid: false,
      message: '香港銀行賬戶號碼應為6-12位數字'
    };
  }

  // 特定銀行的額外校驗（可擴展）
  if (bankName) {
    // 匯豐銀行：12位數字
    if (bankName.includes('匯豐') || bankName.includes('汇丰') || bankName.toUpperCase().includes('HSBC')) {
      if (cleaned.length !== 12) {
        return {
          valid: false,
          message: '匯豐銀行賬戶號碼應為12位數字'
        };
      }
    }
    // 恒生銀行：9-12位數字
    else if (bankName.includes('恒生') || bankName.toUpperCase().includes('HANG SENG')) {
      if (cleaned.length < 9 || cleaned.length > 12) {
        return {
          valid: false,
          message: '恒生銀行賬戶號碼應為9-12位數字'
        };
      }
    }
    // 中銀香港：12位數字
    else if (bankName.includes('中銀') || bankName.includes('中银') || bankName.toUpperCase().includes('BOC')) {
      if (cleaned.length !== 12) {
        return {
          valid: false,
          message: '中銀香港賬戶號碼應為12位數字'
        };
      }
    }
  }

  return { valid: true };
}

/**
 * 校驗大陸銀行賬戶號碼格式
 * 大陸銀行賬戶號碼通常為16-19位數字
 */
export function validateCNBankAccount(accountNumber: string, bankName?: string): {
  valid: boolean;
  message?: string;
} {
  if (!accountNumber || accountNumber.trim() === '') {
    return { valid: false, message: '請輸入銀行賬戶號碼' };
  }

  // 移除空格
  const cleaned = accountNumber.replace(/\s/g, '');

  // 大陸銀行賬戶號碼通常為16-19位數字
  if (!/^\d{16,19}$/.test(cleaned)) {
    return {
      valid: false,
      message: '大陸銀行賬戶號碼應為16-19位數字'
    };
  }

  // 特定銀行的額外校驗（可擴展）
  if (bankName) {
    // 工商銀行：19位數字
    if (bankName.includes('工商') || bankName.toUpperCase().includes('ICBC')) {
      if (cleaned.length !== 19) {
        return {
          valid: false,
          message: '工商銀行賬戶號碼應為19位數字'
        };
      }
    }
    // 建設銀行：16-17位數字
    else if (bankName.includes('建設') || bankName.includes('建设') || bankName.toUpperCase().includes('CCB')) {
      if (cleaned.length < 16 || cleaned.length > 17) {
        return {
          valid: false,
          message: '建設銀行賬戶號碼應為16-17位數字'
        };
      }
    }
    // 中國銀行：19位數字
    else if (bankName.includes('中國銀行') || bankName.includes('中国银行') || bankName.toUpperCase().includes('BANK OF CHINA')) {
      if (cleaned.length !== 19) {
        return {
          valid: false,
          message: '中國銀行賬戶號碼應為19位數字'
        };
      }
    }
  }

  return { valid: true };
}

/**
 * 校驗證件有效期是否>1年
 */
export function validateIDExpiry(expiryDate: string, isPermanent: boolean = false): {
  valid: boolean;
  message?: string;
  remainingDays?: number;
} {
  if (isPermanent) {
    return { valid: true };
  }

  if (!expiryDate) {
    return { valid: false, message: '請選擇證件有效期' };
  }

  const expiry = new Date(expiryDate);
  const today = new Date();

  // 計算剩餘天數
  const diffTime = expiry.getTime() - today.getTime();
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (remainingDays < 0) {
    return { valid: false, message: '證件已過期，請更新證件', remainingDays };
  }

  // 檢查是否大於1年（365天）
  if (remainingDays < 365) {
    return { valid: false, message: '證件有效期必須大於1年', remainingDays };
  }

  return { valid: true, remainingDays };
}

/**
 * 根據身份證類型選擇對應的校驗函數
 */
export function validateIDNumber(
  idType: string,
  idNumber: string
): {
  valid: boolean;
  message?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
} {
  if (idType === 'hkid' || idType === '香港身份證') {
    return validateHKID(idNumber);
  } else if (idType === 'china_id' || idType === '大陸身份證') {
    return validateChinaID(idNumber);
  } else if (idType === 'passport' || idType === '護照') {
    // 護照號碼格式較為寬鬆
    if (!idNumber || idNumber.trim() === '') {
      return { valid: false, message: '請輸入護照號碼' };
    }
    if (idNumber.trim().length < 6 || idNumber.trim().length > 20) {
      return { valid: false, message: '護照號碼長度必須在6-20個字符之間' };
    }
    return { valid: true };
  }

  return { valid: false, message: '請選擇有效的證件類型' };
}

/**
 * 校驗郵箱格式
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, message: '請輸入郵箱地址' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, message: '郵箱格式不正確' };
  }

  return { valid: true };
}

/**
 * 校驗電話號碼格式（支持區號）
 */
export function validatePhone(phone: string): { valid: boolean; message?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, message: '請輸入電話號碼' };
  }

  // 移除空格、連字符、括號
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // 允許+號開頭（國際區號）和純數字
  const phoneRegex = /^\+?\d{8,15}$/;

  if (!phoneRegex.test(cleaned)) {
    return { valid: false, message: '電話號碼格式不正確（8-15位數字，可包含+號）' };
  }

  return { valid: true };
}
