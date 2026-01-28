/**
 * Face++ (旷视科技) 人脸识别集成模块
 * API文档: https://console.faceplusplus.com.cn/documents/4888373
 */

import FormData from 'form-data';
import fetch from 'node-fetch';

const FACEPP_API_URL = 'https://api-cn.faceplusplus.com/facepp/v3';

/**
 * 人脸检测
 * @param imageUrl 图片URL或base64
 * @returns 人脸检测结果
 */
export async function detectFace(imageUrl: string) {
  const form = new FormData();
  form.append('api_key', process.env.FACEPP_API_KEY);
  form.append('api_secret', process.env.FACEPP_API_SECRET);
  
  if (imageUrl.startsWith('data:')) {
    // Base64图片
    form.append('image_base64', imageUrl.split(',')[1]);
  } else {
    // URL图片
    form.append('image_url', imageUrl);
  }
  
  form.append('return_attributes', 'gender,age,quality');
  
  const response = await fetch(`${FACEPP_API_URL}/detect`, {
    method: 'POST',
    body: form,
  });
  
  const data: any = await response.json();
  
  if (data.error_message) {
    throw new Error(`Face++ API Error: ${data.error_message}`);
  }
  
  return data;
}

/**
 * 人脸比对
 * @param image1 第一张图片（URL或base64）
 * @param image2 第二张图片（URL或base64）
 * @returns 比对结果，包含相似度confidence
 */
export async function compareFaces(image1: string, image2: string) {
  const form = new FormData();
  form.append('api_key', process.env.FACEPP_API_KEY);
  form.append('api_secret', process.env.FACEPP_API_SECRET);
  
  // 处理第一张图片
  if (image1.startsWith('data:')) {
    form.append('image_base64_1', image1.split(',')[1]);
  } else {
    form.append('image_url1', image1);
  }
  
  // 处理第二张图片
  if (image2.startsWith('data:')) {
    form.append('image_base64_2', image2.split(',')[1]);
  } else {
    form.append('image_url2', image2);
  }
  
  const response = await fetch(`${FACEPP_API_URL}/compare`, {
    method: 'POST',
    body: form,
  });
  
  const data: any = await response.json();
  
  if (data.error_message) {
    throw new Error(`Face++ API Error: ${data.error_message}`);
  }
  
  return data;
}

/**
 * 验证人脸质量
 * @param faceData 人脸检测结果
 * @returns 是否通过质量检查
 */
export function validateFaceQuality(faceData: any): { valid: boolean; message: string } {
  if (!faceData.faces || faceData.faces.length === 0) {
    return { valid: false, message: '未检测到人脸' };
  }
  
  if (faceData.faces.length > 1) {
    return { valid: false, message: '检测到多张人脸，请确保只有一人' };
  }
  
  const face = faceData.faces[0];
  const quality = face.attributes?.quality;
  
  if (quality) {
    // 检查遮挡
    if (quality.occlusion?.left_eye > 50 || quality.occlusion?.right_eye > 50) {
      return { valid: false, message: '眼睛被遮挡' };
    }
    if (quality.occlusion?.nose > 50) {
      return { valid: false, message: '鼻子被遮挡' };
    }
    if (quality.occlusion?.mouth > 50) {
      return { valid: false, message: '嘴巴被遮挡' };
    }
    
    // 检查模糊度
    if (quality.blur > 50) {
      return { valid: false, message: '图片过于模糊' };
    }
  }
  
  return { valid: true, message: '人脸质量合格' };
}
