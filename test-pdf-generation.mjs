import { generateApplicationPDF } from './server/pdf-generator-v7.js';
import fs from 'fs';

const testData = {
  applicationNumber: 'TEST-001',
  status: 'submitted',
  accountSelection: {
    customerType: 'individual',
    accountType: 'cash'
  },
  basicInfo: {
    chineseName: '測試用戶',
    englishName: 'Test User',
    gender: 'male',
    dateOfBirth: new Date('1990-01-01'),
    placeOfBirth: '香港',
    nationality: '中國'
  },
  detailedInfo: {
    idType: 'Mainland-ID',
    idNumber: '123456789012345678',
    issuingPlace: '中國',
    expiryDate: '長期有效',
    maritalStatus: 'Single',
    education: 'Bachelor',
    email: 'test@example.com',
    phone: '+852 12345678',
    fax: '+852 87654321',
    residentialAddress: '測試地址123號'
  },
  occupation: {
    employmentStatus: 'Employed',
    companyName: '測試公司',
    position: '經理',
    yearsOfService: '5',
    industry: 'Finance',
    officeAddress: '辦公室地址456號',
    officePhone: '+852 11111111',
    officeFax: '+852 22222222'
  },
  financial: {
    incomeSource: 'salary',
    annualIncome: 'HKD 500,000 - 1,000,000',
    liquidAsset: 'HKD 1,000,000 - 3,000,000',
    netWorth: 'HKD 3,000,000 - 5,000,000'
  },
  investment: {
    investmentObjectives: 'capital_growth,capital_preservation',
    investmentExperience: {
      stocks: '3-5',
      funds: '1-3',
      forex: '1-3',
      commodities: '5+'
    },
    riskTolerance: 'R3'
  },
  bankAccounts: [{
    bankName: '中國銀行（香港）有限公司',
    accountType: 'saving',
    currency: 'HKD',
    accountNumber: '1234567890',
    accountHolderName: 'Test User'
  }],
  taxInfo: {
    taxResidency: '中國',
    taxIdNumber: '123456789012345678'
  },
  uploadedDocuments: [{
    documentType: 'id_front',
    fileUrl: 'https://example.com/id_front.jpg'
  }, {
    documentType: 'id_back',
    fileUrl: 'https://example.com/id_back.jpg'
  }],
  signatureName: 'Test User',
  signatureMethod: 'typed',
  signatureTimestamp: new Date(),
  submittedAt: new Date()
};

console.log('開始生成測試PDF...');
try {
  const pdfBuffer = await generateApplicationPDF(testData);
  console.log(`PDF生成成功，大小: ${pdfBuffer.length} 字節`);
  
  const outputPath = '/home/ubuntu/test-pdf-output.pdf';
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`PDF已保存到: ${outputPath}`);
} catch (error) {
  console.error('PDF生成失敗:', error);
  process.exit(1);
}
