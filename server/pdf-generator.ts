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
  faxNo?: string;
  residentialAddress: string;
  
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
      if (data.faxNo) {
        addField(doc, '傳真號碼 Fax Number', data.faxNo);
      }
      addField(doc, '居住地址 Residential Address', data.residentialAddress);
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

      // 第九部分：监管声明
      addSection(doc, '第九部分 Part IX: 監管聲明 Regulatory Declarations');
      addField(doc, '政治公眾人物 PEP', data.isPEP ? '是 Yes' : '否 No');
      addField(doc, '美國人士 US Person', data.isUSPerson ? '是 Yes' : '否 No');
      addField(doc, '協議簽署 Agreement Signed', data.agreementSigned ? '已簽署 Signed' : '未簽署 Not Signed');
      addField(doc, '簽署日期 Signature Date', data.signatureDate);
      doc.moveDown();

      // 第十部分：文件上传
      addSection(doc, '第十部分 Part X: 上傳文件 Uploaded Documents');
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
