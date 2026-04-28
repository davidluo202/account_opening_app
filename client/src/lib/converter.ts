/**
 * 簡繁體轉換工具
 * 使用opencc-js庫實現簡體中文到繁體中文的自動轉換
 */

// @ts-ignore - opencc-js沒有TypeScript類型定義
import * as OpenCC from 'opencc-js';

// 初始化轉換器：簡體到繁體（台灣標準）
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

/**
 * 將簡體中文轉換為繁體中文
 * 如果輸入不包含中文字符，則直接返回原文
 *
 * @param text - 要轉換的文本
 * @returns 轉換後的繁體中文文本，或原文（如果不含中文）
 */
export function convertToTraditional(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // 檢查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);

  if (!hasChinese) {
    // 如果不包含中文字符（如純英文），直接返回原文
    return text;
  }

  // 轉換簡體為繁體
  return converter(text);
}

/**
 * 為輸入框添加自動轉換功能的輔助函數
 * 在輸入框失焦時自動將簡體中文轉換為繁體中文
 *
 * @param value - 當前輸入值
 * @param onChange - 值改變的回調函數
 * @returns onBlur事件處理函數
 */
export function createAutoConvertHandler(
  value: string,
  onChange: (value: string) => void
) {
  return () => {
    const converted = convertToTraditional(value);
    if (converted !== value) {
      onChange(converted);
    }
  };
}
