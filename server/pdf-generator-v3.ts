/**
 * PDF生成模块 (使用pdfmake，支持中文)
 */
// @ts-ignore
import PdfPrinter from 'pdfmake/src/printer';

// 定义字体（使用系统自带的字体）
const fonts = {
  // 使用DejaVu字体，它支持中文
  Roboto: {
    normal: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64')
  }
};

/**
 * 生成申请表PDF
 * @param data 完整的申请数据
 * @returns PDF Buffer
 */
export async function generateApplicationPDF(data: any): Promise<Buffer> {
  // 格式化金额（添加千分号）
  const formatAmount = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'N/A';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 格式化日期
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-HK');
  };

  const printer = new PdfPrinter(fonts);

  // 定义PDF文档结构
  const docDefinition: any = {
    content: [
      // 标题
      {
        text: '誠港金融股份有限公司',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      {
        text: '客戶開戶申請表（個人/聯名）',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 3]
      },
      {
        text: 'Customer Account Opening Form (Ind/Joint)',
        style: 'subheader2',
        alignment: 'center',
        margin: [0, 0, 0, 15]
      },
      
      // 申请编号
      {
        text: `申請編號 Application Number: ${data.applicationNumber || 'N/A'}`,
        style: 'applicationNumber',
        margin: [0, 0, 0, 15]
      },
      
      // 个人基本信息
      {
        text: '個人基本信息 Personal Basic Information',
        style: 'sectionTitle',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: '中文姓名\nChinese Name', style: 'tableHeader' },
              { text: data.basicInfo?.chineseName || 'N/A', style: 'tableCell' },
              { text: '英文姓名\nEnglish Name', style: 'tableHeader' },
              { text: data.basicInfo?.englishName || 'N/A', style: 'tableCell' }
            ],
            [
              { text: '性別\nGender', style: 'tableHeader' },
              { text: data.basicInfo?.gender === 'male' ? '男 Male' : data.basicInfo?.gender === 'female' ? '女 Female' : 'N/A', style: 'tableCell' },
              { text: '出生日期\nDate of Birth', style: 'tableHeader' },
              { text: formatDate(data.basicInfo?.dateOfBirth), style: 'tableCell' }
            ],
            [
              { text: '出生地點\nPlace of Birth', style: 'tableHeader' },
              { text: data.basicInfo?.placeOfBirth || 'N/A', style: 'tableCell' },
              { text: '國籍\nNationality', style: 'tableHeader' },
              { text: data.basicInfo?.nationality || 'N/A', style: 'tableCell' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },
      
      // 个人详细信息
      {
        text: '個人詳細信息 Personal Detailed Information',
        style: 'sectionTitle',
        margin: [0, 15, 0, 5]
      },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: '證件類型\nID Type', style: 'tableHeader' },
              { text: data.detailedInfo?.idType === 'hkid' ? '香港身份證 HKID' : data.detailedInfo?.idType === 'passport' ? '護照 Passport' : data.detailedInfo?.idType === 'chinaid' ? '大陸身份證 China ID' : 'N/A', style: 'tableCell' },
              { text: '證件號碼\nID Number', style: 'tableHeader' },
              { text: data.detailedInfo?.idNumber || 'N/A', style: 'tableCell' }
            ],
            [
              { text: '證件簽發地\nIssuing Place', style: 'tableHeader' },
              { text: data.detailedInfo?.idIssuingPlace || 'N/A', style: 'tableCell' },
              { text: '證件有效期\nExpiry Date', style: 'tableHeader' },
              { text: formatDate(data.detailedInfo?.idExpiryDate), style: 'tableCell' }
            ],
            [
              { text: '婚姻狀況\nMarital Status', style: 'tableHeader' },
              { text: data.detailedInfo?.maritalStatus || 'N/A', style: 'tableCell' },
              { text: '教育程度\nEducation Level', style: 'tableHeader' },
              { text: data.detailedInfo?.educationLevel || 'N/A', style: 'tableCell' }
            ],
            [
              { text: '居住地址\nResidential Address', style: 'tableHeader', colSpan: 1 },
              { text: data.detailedInfo?.residentialAddress || 'N/A', style: 'tableCell', colSpan: 3 },
              {},
              {}
            ],
            [
              { text: '郵寄地址\nMailing Address', style: 'tableHeader', colSpan: 1 },
              { text: data.detailedInfo?.mailingAddress || 'N/A', style: 'tableCell', colSpan: 3 },
              {},
              {}
            ],
            [
              { text: '電話號碼\nPhone Number', style: 'tableHeader' },
              { text: `${data.detailedInfo?.phoneCountryCode || ''} ${data.detailedInfo?.phoneNumber || 'N/A'}`, style: 'tableCell' },
              { text: '電子郵箱\nEmail', style: 'tableHeader' },
              { text: data.detailedInfo?.email || 'N/A', style: 'tableCell' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },
      
      // 职业信息
      ...(data.occupation ? [
        {
          text: '職業信息 Occupation Information',
          style: 'sectionTitle',
          margin: [0, 15, 0, 5]
        },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: '僱傭狀況\nEmployment Status', style: 'tableHeader' },
                { text: data.occupation?.employmentStatus || 'N/A', style: 'tableCell' },
                { text: '公司名稱\nCompany Name', style: 'tableHeader' },
                { text: data.occupation?.companyName || 'N/A', style: 'tableCell' }
              ],
              [
                { text: '職位\nPosition', style: 'tableHeader' },
                { text: data.occupation?.position || 'N/A', style: 'tableCell' },
                { text: '行業\nIndustry', style: 'tableHeader' },
                { text: data.occupation?.industry || 'N/A', style: 'tableCell' }
              ],
              [
                { text: '公司地址\nCompany Address', style: 'tableHeader', colSpan: 1 },
                { text: data.occupation?.companyAddress || 'N/A', style: 'tableCell', colSpan: 3 },
                {},
                {}
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ] : []),
      
      // 财务状况
      ...(data.financial ? [
        {
          text: '財務狀況 Financial Information',
          style: 'sectionTitle',
          margin: [0, 15, 0, 5]
        },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: '年收入\nAnnual Income', style: 'tableHeader' },
                { text: `HKD ${formatAmount(data.financial?.annualIncome)}`, style: 'tableCell' },
                { text: '淨資產\nNet Worth', style: 'tableHeader' },
                { text: `HKD ${formatAmount(data.financial?.netWorth)}`, style: 'tableCell' }
              ],
              [
                { text: '收入來源\nSource of Income', style: 'tableHeader' },
                { text: data.financial?.sourceOfIncome || 'N/A', style: 'tableCell' },
                { text: '預計投資金額\nExpected Investment', style: 'tableHeader' },
                { text: `HKD ${formatAmount(data.financial?.expectedInvestmentAmount)}`, style: 'tableCell' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ] : []),
      
      // 银行账户
      ...(data.bankAccounts && data.bankAccounts.length > 0 ? [
        {
          text: '銀行賬戶信息 Bank Account Information',
          style: 'sectionTitle',
          margin: [0, 15, 0, 5],
          pageBreak: 'before'
        },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            headerRows: 1,
            body: [
              [
                { text: '銀行名稱\nBank Name', style: 'tableHeader' },
                { text: '賬戶號碼\nAccount Number', style: 'tableHeader' },
                { text: '賬戶持有人\nAccount Holder', style: 'tableHeader' },
                { text: '銀行所在地\nBank Location', style: 'tableHeader' }
              ],
              ...data.bankAccounts.map((account: any) => [
                { text: account.bankName || 'N/A', style: 'tableCell' },
                { text: account.accountNumber || 'N/A', style: 'tableCell' },
                { text: account.accountHolderName || 'N/A', style: 'tableCell' },
                { text: account.bankLocation || 'N/A', style: 'tableCell' }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ] : []),
      
      // 签名
      {
        text: '申請人聲明及簽署 Applicant Declaration and Signature',
        style: 'sectionTitle',
        margin: [0, 20, 0, 10]
      },
      {
        text: '本人聲明以上所填寫的資料均屬真實、準確和完整，並同意遵守貴公司的條款及細則。\nI declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company.',
        style: 'normal',
        margin: [0, 0, 0, 15]
      },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: '申請人簽名 Applicant Signature:\n\n\n_______________________________', style: 'tableCell' },
              { text: `簽署日期 Date:\n\n${formatDate(data.submittedAt || new Date())}`, style: 'tableCell' }
            ]
          ]
        },
        layout: 'noBorders'
      },
      
      // 页脚
      {
        text: [
          { text: '\n\n誠港金融股份有限公司 CM Financial Limited\n', style: 'footer' },
          { text: '此文件由系統自動生成 This document is generated automatically by the system\n', style: 'footer' },
          { text: `生成時間 Generated at: ${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}`, style: 'footer' }
        ],
        alignment: 'center',
        margin: [0, 20, 0, 0]
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#2563eb'
      },
      subheader: {
        fontSize: 14,
        bold: true,
        color: '#666666'
      },
      subheader2: {
        fontSize: 11,
        color: '#666666'
      },
      applicationNumber: {
        fontSize: 11,
        bold: true,
        background: '#eff6ff',
        color: '#1e40af'
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#1f2937',
        background: '#f3f4f6'
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: '#6b7280',
        fillColor: '#f9fafb'
      },
      tableCell: {
        fontSize: 9,
        color: '#1f2937'
      },
      normal: {
        fontSize: 9,
        color: '#6b7280'
      },
      footer: {
        fontSize: 8,
        color: '#9ca3af'
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  // 生成PDF
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    pdfDoc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    pdfDoc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    pdfDoc.on('error', reject);
    
    pdfDoc.end();
  });
}
