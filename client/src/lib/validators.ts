/**
 * 表单校验工具函数
 * 包含中文/英文姓名、年龄、身份证号码、证件有效期等校验规则
 */

/**
 * 校验中文姓名格式（2-10个汉字，包括繁体和简体）
 */
export function validateChineseName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, message: '请输入中文姓名' };
  }
  
  // 匹配中文字符（包括繁体和简体）
  // 匹配中文字符（包括繁体和简体）
  const chineseRegex = /^[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]{2,10}$/;
  
  if (!chineseRegex.test(name.trim())) {
    return { valid: false, message: '中文姓名必须为2-10个汉字' };
  }
  
  return { valid: true };
}

/**
 * 校验英文姓名格式（字母、空格、连字符、撇号）
 */
export function validateEnglishName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, message: '请输入英文姓名' };
  }
  
  // 匹配英文字母、空格、连字符、撇号
  const englishRegex = /^[A-Za-z\s\-']+$/;
  
  if (!englishRegex.test(name.trim())) {
    return { valid: false, message: '英文姓名只能包含字母、空格、连字符和撇号' };
  }
  
  if (name.trim().length < 2 || name.trim().length > 50) {
    return { valid: false, message: '英文姓名长度必须在2-50个字符之间' };
  }
  
  return { valid: true };
}

/**
 * 校验年龄是否≥18岁
 */
export function validateAge(birthDate: string): { valid: boolean; message?: string; age?: number } {
  if (!birthDate) {
    return { valid: false, message: '请选择出生日期' };
  }
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  // 计算年龄
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  if (age < 18) {
    return { valid: false, message: '申请人必须年满18岁', age };
  }
  
  if (age > 120) {
    return { valid: false, message: '请输入有效的出生日期', age };
  }
  
  return { valid: true, age };
}

/**
 * 校验香港身份证号码格式
 * 格式：A123456(7) 或 AB123456(7)
 */
export function validateHKID(idNumber: string): { valid: boolean; message?: string } {
  if (!idNumber || idNumber.trim() === '') {
    return { valid: false, message: '请输入香港身份证号码' };
  }
  
  // 移除括号和空格
  const cleaned = idNumber.replace(/[\s()]/g, '').toUpperCase();
  
  // 香港身份证格式：1-2个字母 + 6位数字 + 1位校验码（数字或A）
  const hkidRegex = /^[A-Z]{1,2}\d{6}[\dA]$/;
  
  if (!hkidRegex.test(cleaned)) {
    return { valid: false, message: '香港身份证号码格式不正确（例如：A123456(7)）' };
  }
  
  // 可以添加更严格的校验码验证逻辑
  return { valid: true };
}

/**
 * 校验大陆身份证号码格式（18位）
 * 包括性别校验
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
 * 校验大陆身份证号码格式，并匹配用户输入的出生日期和性别
 * @param idNumber 身份证号码
 * @param userBirthDate 用户输入的出生日期（YYYY-MM-DD格式）
 * @param userGender 用户输入的性别
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
    return { valid: false, message: '请输入大陆身份证号码' };
  }
  
  const cleaned = idNumber.replace(/\s/g, '');
  
  // 18位身份证号码格式
  const chinaIdRegex = /^\d{17}[\dXx]$/;
  
  if (!chinaIdRegex.test(cleaned)) {
    return { valid: false, message: '大陆身份证号码必须为18位' };
  }
  
  // 提取出生日期（第7-14位）
  const birthYear = cleaned.substring(6, 10);
  const birthMonth = cleaned.substring(10, 12);
  const birthDay = cleaned.substring(12, 14);
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
  
  // 验证出生日期是否有效
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) {
    return { valid: false, message: '身份证号码中的出生日期无效' };
  }
  
  // 提取性别（第17位，奇数为男，偶数为女）
  const genderDigit = parseInt(cleaned.charAt(16));
  const gender = genderDigit % 2 === 1 ? 'male' : 'female';
  
  // 校验码验证（第18位）
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  const providedCheckCode = cleaned.charAt(17).toUpperCase();
  
  if (checkCode !== providedCheckCode) {
    return { valid: false, message: '身份证号码校验码不正确' };
  }
  
  // 如果提供了用户输入的出生日期，验证是否匹配
  if (userBirthDate) {
    // 解析用户输入的日期
    const userDate = new Date(userBirthDate);
    const idDate = new Date(birthDate);
    
    // 比较年月日
    if (userDate.getFullYear() !== idDate.getFullYear() ||
        userDate.getMonth() !== idDate.getMonth() ||
        userDate.getDate() !== idDate.getDate()) {
      return { 
        valid: false, 
        message: `身份证上的出生日期（${birthDate}）与您输入的出生日期不匹配`,
        gender,
        birthDate
      };
    }
  }
  
  // 如果提供了用户输入的性别，验证是否匹配
  if (userGender && userGender !== 'other') {
    if (gender !== userGender) {
      const genderText = gender === 'male' ? '男性' : '女性';
      const userGenderText = userGender === 'male' ? '男性' : '女性';
      return { 
        valid: false, 
        message: `身份证上的性别（${genderText}）与您输入的性别（${userGenderText}）不匹配`,
        gender,
        birthDate
      };
    }
  }
  
  return { valid: true, gender, birthDate };
}

/**
 * 校验香港银行账户号码格式
 * 香港银行账户号码通常为6-12位数字，可能包含连字符
 */
export function validateHKBankAccount(accountNumber: string, bankName?: string): {
  valid: boolean;
  message?: string;
} {
  if (!accountNumber || accountNumber.trim() === '') {
    return { valid: false, message: '请输入银行账户号码' };
  }

  // 移除空格和连字符
  const cleaned = accountNumber.replace(/[\s-]/g, '');

  // 香港银行账户号码通常为6-12位数字
  if (!/^\d{6,12}$/.test(cleaned)) {
    return { 
      valid: false, 
      message: '香港银行账户号码应为6-12位数字' 
    };
  }

  // 特定银行的额外校验（可扩展）
  if (bankName) {
    // 汇丰银行：12位数字
    if (bankName.includes('汇丰') || bankName.toUpperCase().includes('HSBC')) {
      if (cleaned.length !== 12) {
        return { 
          valid: false, 
          message: '汇丰银行账户号码应为12位数字' 
        };
      }
    }
    // 恒生银行：9-12位数字
    else if (bankName.includes('恒生') || bankName.toUpperCase().includes('HANG SENG')) {
      if (cleaned.length < 9 || cleaned.length > 12) {
        return { 
          valid: false, 
          message: '恒生银行账户号码应为9-12位数字' 
        };
      }
    }
    // 中银香港：12位数字
    else if (bankName.includes('中银') || bankName.toUpperCase().includes('BOC')) {
      if (cleaned.length !== 12) {
        return { 
          valid: false, 
          message: '中银香港账户号码应为12位数字' 
        };
      }
    }
  }

  return { valid: true };
}

/**
 * 校验大陆银行账户号码格式
 * 大陆银行账户号码通常为16-19位数字
 */
export function validateCNBankAccount(accountNumber: string, bankName?: string): {
  valid: boolean;
  message?: string;
} {
  if (!accountNumber || accountNumber.trim() === '') {
    return { valid: false, message: '请输入银行账户号码' };
  }

  // 移除空格
  const cleaned = accountNumber.replace(/\s/g, '');

  // 大陆银行账户号码通常为16-19位数字
  if (!/^\d{16,19}$/.test(cleaned)) {
    return { 
      valid: false, 
      message: '大陆银行账户号码应为16-19位数字' 
    };
  }

  // 特定银行的额外校验（可扩展）
  if (bankName) {
    // 工商银行：19位数字
    if (bankName.includes('工商') || bankName.toUpperCase().includes('ICBC')) {
      if (cleaned.length !== 19) {
        return { 
          valid: false, 
          message: '工商银行账户号码应为19位数字' 
        };
      }
    }
    // 建设银行：16-17位数字
    else if (bankName.includes('建设') || bankName.toUpperCase().includes('CCB')) {
      if (cleaned.length < 16 || cleaned.length > 17) {
        return { 
          valid: false, 
          message: '建设银行账户号码应为16-17位数字' 
        };
      }
    }
    // 中国银行：19位数字
    else if (bankName.includes('中国银行') || bankName.toUpperCase().includes('BANK OF CHINA')) {
      if (cleaned.length !== 19) {
        return { 
          valid: false, 
          message: '中国银行账户号码应为19位数字' 
        };
      }
    }
  }

  return { valid: true };
}

/**
 * 校验证件有效期是否>1年
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
    return { valid: false, message: '请选择证件有效期' };
  }
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  
  // 计算剩余天数
  const diffTime = expiry.getTime() - today.getTime();
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (remainingDays < 0) {
    return { valid: false, message: '证件已过期，请更新证件', remainingDays };
  }
  
  // 检查是否大于1年（365天）
  if (remainingDays < 365) {
    return { valid: false, message: '证件有效期必须大于1年', remainingDays };
  }
  
  return { valid: true, remainingDays };
}

/**
 * 根据身份证类型选择对应的校验函数
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
  if (idType === 'hkid' || idType === '香港身份证') {
    return validateHKID(idNumber);
  } else if (idType === 'china_id' || idType === '大陆身份证') {
    return validateChinaID(idNumber);
  } else if (idType === 'passport' || idType === '护照') {
    // 护照号码格式较为宽松
    if (!idNumber || idNumber.trim() === '') {
      return { valid: false, message: '请输入护照号码' };
    }
    if (idNumber.trim().length < 6 || idNumber.trim().length > 20) {
      return { valid: false, message: '护照号码长度必须在6-20个字符之间' };
    }
    return { valid: true };
  }
  
  return { valid: false, message: '请选择有效的证件类型' };
}

/**
 * 校验邮箱格式
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, message: '请输入邮箱地址' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: '邮箱格式不正确' };
  }
  
  return { valid: true };
}

/**
 * 校验电话号码格式（支持区号）
 */
export function validatePhone(phone: string): { valid: boolean; message?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, message: '请输入电话号码' };
  }
  
  // 移除空格、连字符、括号
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // 允许+号开头（国际区号）和纯数字
  const phoneRegex = /^\+?\d{8,15}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, message: '电话号码格式不正确（8-15位数字，可包含+号）' };
  }
  
  return { valid: true };
}
