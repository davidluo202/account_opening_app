/**
 * PDF生成功能测试
 */
import { describe, it, expect } from 'vitest';
import { generateApplicationPDF } from './pdf-generator-v4';

describe('PDF生成功能测试', () => {
  it('应该能够成功生成PDF', async () => {
    const testData = {
      applicationNumber: 'CMF-ACAPP-260129-001',
      basicInfo: {
        chineseName: '張三',
        englishName: 'Zhang San',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        placeOfBirth: '香港',
        nationality: '中國',
      },
      detailedInfo: {
        idType: 'hkid',
        idNumber: 'A123456(7)',
        idIssuingPlace: '香港',
        idExpiryDate: '2030-12-31',
        maritalStatus: '已婚',
        educationLevel: '大學',
        residentialAddress: '香港九龍旺角彌敦道123號',
        mailingAddress: '香港九龍旺角彌敦道123號',
        phoneCountryCode: '+852',
        phoneNumber: '12345678',
        email: 'test@example.com',
      },
      occupation: {
        employmentStatus: '受僱',
        companyName: '測試公司',
        position: '經理',
        industry: '金融',
        companyAddress: '香港中環皇后大道中1號',
      },
      financial: {
        annualIncome: 500000,
        netWorth: 2000000,
        sourceOfIncome: '薪金',
        expectedInvestmentAmount: 100000,
      },
      bankAccounts: [
        {
          bankName: '匯豐銀行',
          accountNumber: '123-456789-001',
          accountHolderName: '張三',
          bankLocation: '香港',
        },
      ],
      submittedAt: new Date(),
    };

    const pdfBuffer = await generateApplicationPDF(testData);
    
    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
  }, 30000); // 30秒超时
});
