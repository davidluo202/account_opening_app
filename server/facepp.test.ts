import { describe, it, expect } from 'vitest';
import { detectFace } from './facepp';

describe('Face++ API集成测试', () => {
  it('应该能够成功调用Face++ API进行人脸检测', async () => {
    // 使用一个公开的测试图片URL
    const testImageUrl = 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg';
    
    try {
      const result = await detectFace(testImageUrl);
      
      // 验证API响应结构
      expect(result).toBeDefined();
      expect(result.faces).toBeDefined();
      
      // 如果检测到人脸，验证基本字段
      if (result.faces && result.faces.length > 0) {
        expect(result.faces[0]).toHaveProperty('face_token');
        expect(result.faces[0]).toHaveProperty('face_rectangle');
      }
      
      console.log('Face++ API测试成功:', {
        facesDetected: result.faces?.length || 0,
        requestId: result.request_id
      });
    } catch (error: any) {
      // 如果是API密钥错误，测试应该失败
      if (error.message.includes('AUTHENTICATION_ERROR') || error.message.includes('INVALID_API_KEY')) {
        throw new Error('Face++ API密钥无效，请检查FACEPP_API_KEY和FACEPP_API_SECRET配置');
      }
      throw error;
    }
  }, 30000); // 30秒超时
});
