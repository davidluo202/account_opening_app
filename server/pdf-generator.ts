/**
 * PDF生成服务
 * 根据CMF003格式生成客户开户申请表PDF
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

// PDF生成所需的申请数据类型
export interface ApplicationPDFData {
  applicationNumber: string;
  // Case 1-2: 账户选择
  customerType: string;
  accountType: string;
  
  // Case 3: 个人基本信息
  chineseName: string;
  englishName: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  
  // Case 4: 个人详细信息
  idType: string;
  idNumber: string;
  idIssuingPlace: string;
  idExpiryDate?: string;
  idIsPermanent: boolean;
  maritalStatus: string;
  educationLevel: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  mobileCountryCode: string;
  mobileNumber: string;
  faxNo?: string;
  residentialAddress: string;
  billingAddressType: string;
  billingAddressOther?: string;
  preferredLanguage: string;
  
  // Case 5: 职业信息
  employmentStatus: string;
  
  // Case 6: 就业详情
  employerName?: string;
  employerAddress?: string;
  occupation?: string;
  officePhone?: string;
  officeFaxNo?: string;
  annualIncome: string;
  netWorth: string;
  liquidAsset: string;
  
  // Case 7: 财务与投资
  investmentObjective: string;
  investmentExperience: string;
  
  // Case 8: 银行账户（可能有多个）
  bankAccounts: Array<{
    bankName: string;
    accountNumber: string;
    accountType: string;
  }>;
  
  // Case 9: 税务信息
  taxCountry: string;
  taxIdNumber: string;
  
  // Case 10: 风险评估问卷
  riskQuestionnaire?: {
    q1_current_investments: string;
    q2_investment_period: string;
    q3_price_volatility: string;
    q4_investment_percentage: string;
    q5_investment_attitude: string;
    q6_derivatives_knowledge: string;
    q7_age_group: string;
    q8_education_level: string;
    q9_investment_knowledge_sources: string;
    q10_liquidity_needs: string;
    totalScore: number;
    riskLevel: string;
    riskDescription: string;
  };
  
  // Case 10: 文件上传
  uploadedDocuments: Array<{
    documentType: string;
    fileUrl: string;
  }>;
  
  // Case 11: 人脸识别
  faceVerificationStatus: string;
  
  // Case 12: 监管声明
  isPEP: boolean;
  isUSPerson: boolean;
  agreementSigned: boolean;
  signatureDate: string;
}

/**
 * 生成PDF文档
 * @param data 申请数据
 * @returns PDF Buffer
 */
export async function generateApplicationPDF(data: ApplicationPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // 创建PDF文档
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `客户开户申请表 - ${data.applicationNumber}`,
          Author: '誠港金融',
          Subject: '个人客户现金账户开立申请',
        }
      });

      const chunks: Buffer[] = [];
      
      // 收集PDF数据
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 设置字体（使用系统内置字体，支持中文）
      // 注意：pdfkit默认不包含中文字体，这里使用Courier作为示例
      // 实际部署时需要添加中文字体文件
      doc.font('Helvetica');

      // 添加标题
      doc.fontSize(18)
         .text('Canton Mutual Financial Limited', { align: 'center' })
         .fontSize(16)
         .text('誠港金融有限公司', { align: 'center' })
         .moveDown();

      doc.fontSize(14)
         .text('個人客戶現金賬戶開立申請表', { align: 'center' })
         .text('Individual Client Cash Account Opening Application Form', { align: 'center' })
         .moveDown();

      doc.fontSize(10)
         .text(`申請編號 Application Number: ${data.applicationNumber}`, { align: 'right' })
         .moveDown(2);

      // 第一部分：账户选择
      addSection(doc, '第一部分 Part I: 賬戶選擇 Account Selection');
      addField(doc, '客戶類型 Customer Type', translateCustomerType(data.customerType));
      addField(doc, '賬戶類型 Account Type', translateAccountType(data.accountType));
      doc.moveDown();

      // 第二部分：个人基本信息
      addSection(doc, '第二部分 Part II: 個人基本信息 Personal Basic Information');
      addField(doc, '中文姓名 Chinese Name', data.chineseName);
      addField(doc, '英文姓名 English Name', data.englishName);
      addField(doc, '性別 Gender', translateGender(data.gender));
      addField(doc, '出生日期 Date of Birth', data.dateOfBirth);
      addField(doc, '出生地 Place of Birth', data.placeOfBirth);
      addField(doc, '國籍 Nationality', data.nationality);
      doc.moveDown();

      // 第三部分：个人详细信息
      addSection(doc, '第三部分 Part III: 個人詳細信息 Personal Detailed Information');
      addField(doc, '身份證件類型 ID Type', translateIDType(data.idType));
      addField(doc, '證件號碼 ID Number', data.idNumber);
      addField(doc, '證件簽發地 Issuing Place', data.idIssuingPlace);
      addField(doc, '證件有效期 Expiry Date', data.idIsPermanent ? '長期有效 Permanent' : data.idExpiryDate || '');
      addField(doc, '婚姻狀況 Marital Status', translateMaritalStatus(data.maritalStatus));
      addField(doc, '學歷 Education Level', translateEducationLevel(data.educationLevel));
      addField(doc, '電子郵箱 Email', data.email);
      addField(doc, '電話號碼 Phone', `${data.phoneCountryCode} ${data.phoneNumber}`);
      addField(doc, '手機號碼 Mobile', `${data.mobileCountryCode} ${data.mobileNumber}`);
      if (data.faxNo) {
        addField(doc, '傳真號碼 Fax Number', data.faxNo);
      }
      addField(doc, '居住地址 Residential Address', data.residentialAddress);
      
      // 賬單通訊地址
      let billingAddressText = '';
      if (data.billingAddressType === 'residential') {
        billingAddressText = '住宅地址 Residential Address';
      } else if (data.billingAddressType === 'office') {
        billingAddressText = '辦公地址 Office Address';
      } else if (data.billingAddressType === 'other' && data.billingAddressOther) {
        billingAddressText = `其他 Other: ${data.billingAddressOther}`;
      }
      addField(doc, '賬單通訊地址 Billing Address', billingAddressText);
      
      // 賬單首選語言
      const preferredLanguageText = data.preferredLanguage === 'chinese' ? '中文 Chinese' : '英文 English';
      addField(doc, '賬單首選語言 Preferred Language', preferredLanguageText);
      doc.moveDown();

      // 第四部分：职业信息
      addSection(doc, '第四部分 Part IV: 職業信息 Occupation Information');
      addField(doc, '就業狀況 Employment Status', translateEmploymentStatus(data.employmentStatus));
      if (data.employerName) {
        addField(doc, '雇主名稱 Employer Name', data.employerName);
        addField(doc, '雇主地址 Employer Address', data.employerAddress || '');
        addField(doc, '職業 Occupation', data.occupation || '');
        addField(doc, '辦公電話 Office Phone', data.officePhone || '');
        if (data.officeFaxNo) {
          addField(doc, '辦公傳真 Office Fax', data.officeFaxNo);
        }
      }
      doc.moveDown();

      // 第五部分：财务信息
      addSection(doc, '第五部分 Part V: 財務信息 Financial Information');
      addField(doc, '年收入 Annual Income', data.annualIncome);
      addField(doc, '淨資產 Net Worth', data.netWorth);
      addField(doc, '流動資產 Liquid Assets', data.liquidAsset);
      doc.moveDown();

      // 第六部分：投资信息
      addSection(doc, '第六部分 Part VI: 投資信息 Investment Information');
      addField(doc, '投資目的 Investment Objective', data.investmentObjective);
      addField(doc, '投資經驗 Investment Experience', data.investmentExperience);
      doc.moveDown();

      // 第七部分：银行账户
      addSection(doc, '第七部分 Part VII: 銀行賬戶 Bank Account Information');
      data.bankAccounts.forEach((account, index) => {
        doc.fontSize(10).text(`銀行賬戶 ${index + 1} Bank Account ${index + 1}:`, { underline: true });
        addField(doc, '  銀行名稱 Bank Name', account.bankName);
        addField(doc, '  賬戶號碼 Account Number', account.accountNumber);
        addField(doc, '  賬戶類型 Account Type', account.accountType);
        doc.moveDown(0.5);
      });
      doc.moveDown();

      // 第八部分：税务信息
      addSection(doc, '第八部分 Part VIII: 稅務信息 Tax Information');
      addField(doc, '稅務居民國家 Tax Resident Country', data.taxCountry);
      addField(doc, '稅務識別號 Tax ID Number', data.taxIdNumber);
      doc.moveDown();

      // 第九部分：风险评估问卷
      if (data.riskQuestionnaire) {
        addSection(doc, '第九部分 Part IX: 風險評估問卷 Risk Assessment Questionnaire');
        
        // 总分和风险等级
        doc.fontSize(12).font('Helvetica-Bold')
           .text(`總分 Total Score: ${data.riskQuestionnaire.totalScore}`, { continued: true })
           .text(`  |  風險等級 Risk Level: ${data.riskQuestionnaire.riskLevel}`);
        doc.fontSize(10).font('Helvetica')
           .text(`描述 Description: ${data.riskQuestionnaire.riskDescription}`);
        doc.moveDown();
        
        // Q1
        const q1Investments = JSON.parse(data.riskQuestionnaire.q1_current_investments || '[]');
        const q1Text = q1Investments.map((item: string) => {
          if (item === 'none') return '沒有';
          if (item === 'deposits') return '定期存款';
          if (item === 'bonds') return '債券';
          if (item === 'stocks') return '股票';
          if (item === 'funds') return '基金';
          if (item === 'derivatives') return '衔生品';
          return item;
        }).join(', ');
        addField(doc, 'Q1. 目前持有的投資產品', q1Text);
        
        // Q2
        let q2Text = '';
        if (data.riskQuestionnaire.q2_investment_period === 'less_than_1') q2Text = '少於1年 (10分)';
        else if (data.riskQuestionnaire.q2_investment_period === '1_to_3') q2Text = '1-3年 (20分)';
        else if (data.riskQuestionnaire.q2_investment_period === '3_to_5') q2Text = '3-5年 (30分)';
        else if (data.riskQuestionnaire.q2_investment_period === 'over_5') q2Text = '超過5年 (40分)';
        addField(doc, 'Q2. 投資期限', q2Text);
        
        // Q3
        let q3Text = '';
        if (data.riskQuestionnaire.q3_price_volatility === 'low') q3Text = '低 (10分)';
        else if (data.riskQuestionnaire.q3_price_volatility === 'medium') q3Text = '中 (30分)';
        else if (data.riskQuestionnaire.q3_price_volatility === 'high') q3Text = '高 (50分)';
        addField(doc, 'Q3. 價格波動性接受程度', q3Text);
        
        // Q4
        let q4Text = '';
        if (data.riskQuestionnaire.q4_investment_percentage === 'less_than_25') q4Text = '少於25% (10分)';
        else if (data.riskQuestionnaire.q4_investment_percentage === '25_to_50') q4Text = '25%-50% (20分)';
        else if (data.riskQuestionnaire.q4_investment_percentage === '50_to_75') q4Text = '50%-75% (30分)';
        else if (data.riskQuestionnaire.q4_investment_percentage === 'over_75') q4Text = '超過75% (40分)';
        addField(doc, 'Q4. 投資比例', q4Text);
        
        // Q5
        let q5Text = '';
        if (data.riskQuestionnaire.q5_investment_attitude === 'conservative') q5Text = '保守 (10分)';
        else if (data.riskQuestionnaire.q5_investment_attitude === 'moderate') q5Text = '中度 (30分)';
        else if (data.riskQuestionnaire.q5_investment_attitude === 'aggressive') q5Text = '積極 (50分)';
        addField(doc, 'Q5. 投資態度', q5Text);
        
        // Q6
        const q6Knowledge = JSON.parse(data.riskQuestionnaire.q6_derivatives_knowledge || '[]');
        const q6Text = q6Knowledge.map((item: string) => {
          if (item === 'no_knowledge') return '沒有知識';
          if (item === 'options') return '期權';
          if (item === 'futures') return '期貨';
          if (item === 'warrants') return '窝輪';
          if (item === 'cbbc') return '牛熊證';
          return item;
        }).join(', ');
        addField(doc, 'Q6. 衔生品知識', q6Text);
        
        // Q7
        let q7Text = '';
        if (data.riskQuestionnaire.q7_age_group === '18_to_25') q7Text = '18-25歲 (20分)';
        else if (data.riskQuestionnaire.q7_age_group === '26_to_35') q7Text = '26-35歲 (30分)';
        else if (data.riskQuestionnaire.q7_age_group === '36_to_50') q7Text = '36-50歲 (40分)';
        else if (data.riskQuestionnaire.q7_age_group === '51_to_64') q7Text = '51-64歲 (20分)';
        else if (data.riskQuestionnaire.q7_age_group === '65_plus') q7Text = '65歲或以上 (10分)';
        addField(doc, 'Q7. 年齡組別', q7Text);
        
        // Q8
        let q8Text = '';
        if (data.riskQuestionnaire.q8_education_level === 'primary_or_below') q8Text = 'A. 小學或以下學歷 (10分)';
        else if (data.riskQuestionnaire.q8_education_level === 'secondary') q8Text = 'B. 中學 (30分)';
        else if (data.riskQuestionnaire.q8_education_level === 'tertiary_or_above') q8Text = 'C. 大專或以上學歷 (50分)';
        addField(doc, 'Q8. 教育程度', q8Text);
        
        // Q9
        const q9Sources = JSON.parse(data.riskQuestionnaire.q9_investment_knowledge_sources || '[]');
        const q9Text = q9Sources.map((item: string) => {
          if (item === 'no_interest') return '沒有興趣 (0分)';
          if (item === 'discussion') return '與他人討論 (40分)';
          if (item === 'reading') return '閱讀 (40分)';
          if (item === 'research') return '研究 (40分)';
          return item;
        }).join(', ');
        addField(doc, 'Q9. 投資知識來源', q9Text);
        
        // Q10
        let q10Text = '';
        if (data.riskQuestionnaire.q10_liquidity_needs === 'no_need') q10Text = '沒有需求 (50分)';
        else if (data.riskQuestionnaire.q10_liquidity_needs === 'up_to_30') q10Text = '最多30% (30分)';
        else if (data.riskQuestionnaire.q10_liquidity_needs === '30_to_50') q10Text = '30%-50% (20分)';
        else if (data.riskQuestionnaire.q10_liquidity_needs === 'over_50') q10Text = '超過50% (10分)';
        addField(doc, 'Q10. 流動資金需求', q10Text);
        
        doc.moveDown();
      }

      // 第十部分：监管声明
      addSection(doc, '第十部分 Part X: 監管聲明 Regulatory Declarations');
      addField(doc, '政治公眾人物 PEP', data.isPEP ? '是 Yes' : '否 No');
      addField(doc, '美國人士 US Person', data.isUSPerson ? '是 Yes' : '否 No');
      addField(doc, '協議簽署 Agreement Signed', data.agreementSigned ? '已簽署 Signed' : '未簽署 Not Signed');
      addField(doc, '簽署日期 Signature Date', data.signatureDate);
      doc.moveDown();

      // 第十一部分：文件上传
      addSection(doc, '第十一部分 Part XI: 上傳文件 Uploaded Documents');
      data.uploadedDocuments.forEach((doc_item, index) => {
        doc.fontSize(10).text(`${index + 1}. ${doc_item.documentType}`);
      });
      doc.moveDown(2);

      // 页脚
      doc.fontSize(8)
         .text('本申請表由系統自動生成 This application form is automatically generated by the system', 
               { align: 'center' })
         .text(`生成時間 Generated at: ${new Date().toLocaleString('zh-HK')}`, 
               { align: 'center' });

      // 完成PDF生成
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// 辅助函数：添加章节标题
function addSection(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(12)
     .fillColor('#000080')
     .text(title, { underline: true })
     .fillColor('#000000')
     .moveDown(0.5);
}

// 辅助函数：添加字段
function addField(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fontSize(10)
     .text(`${label}: ${value || 'N/A'}`);
}

// 翻译函数
function translateCustomerType(type: string): string {
  const map: Record<string, string> = {
    'individual': '個人 Individual',
    'joint': '聯名 Joint',
    'corporate': '機構 Corporate',
  };
  return map[type] || type;
}

function translateAccountType(type: string): string {
  const map: Record<string, string> = {
    'cash': '現金賬戶 Cash Account',
    'margin': '保證金賬戶 Margin Account',
    'derivatives': '衍生品賬戶 Derivatives Account',
  };
  return map[type] || type;
}

function translateGender(gender: string): string {
  const map: Record<string, string> = {
    'male': '男 Male',
    'female': '女 Female',
    'other': '其他 Other',
  };
  return map[gender] || gender;
}

function translateIDType(type: string): string {
  const map: Record<string, string> = {
    'hkid': '香港身份證 HKID',
    'passport': '護照 Passport',
    'mainland_id': '中國大陸身份證 Mainland ID',
    'other': '其他 Other',
  };
  return map[type] || type;
}

function translateMaritalStatus(status: string): string {
  const map: Record<string, string> = {
    'single': '單身 Single',
    'married': '已婚 Married',
    'divorced': '離異 Divorced',
    'widowed': '喪偶 Widowed',
  };
  return map[status] || status;
}

function translateEducationLevel(level: string): string {
  const map: Record<string, string> = {
    'high_school': '中學 High School',
    'associate': '副學士 Associate Degree',
    'bachelor': '學士 Bachelor',
    'master': '碩士 Master',
    'doctorate': '博士 Doctorate',
    'other': '其他 Other',
  };
  return map[level] || level;
}

function translateEmploymentStatus(status: string): string {
  const map: Record<string, string> = {
    'self_employed': '自僱 Self-employed',
    'employed': '受僱 Employed',
    'student': '學生 Student',
    'unemployed': '無業 Unemployed',
    'retired': '退休 Retired',
  };
  return map[status] || status;
}
