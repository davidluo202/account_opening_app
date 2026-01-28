/**
 * 简繁体转换工具
 * 使用opencc-js库实现简体中文到繁体中文的自动转换
 */

// @ts-ignore - opencc-js没有TypeScript类型定义
import * as OpenCC from 'opencc-js';

// 初始化转换器：简体到繁体（台湾标准）
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

/**
 * 将简体中文转换为繁体中文
 * 如果输入不包含中文字符，则直接返回原文
 * 
 * @param text - 要转换的文本
 * @returns 转换后的繁体中文文本，或原文（如果不含中文）
 */
export function convertToTraditional(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  
  if (!hasChinese) {
    // 如果不包含中文字符（如纯英文），直接返回原文
    return text;
  }

  // 转换简体为繁体
  return converter(text);
}

/**
 * 为输入框添加自动转换功能的辅助函数
 * 在输入框失焦时自动将简体中文转换为繁体中文
 * 
 * @param value - 当前输入值
 * @param onChange - 值改变的回调函数
 * @returns onBlur事件处理函数
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
