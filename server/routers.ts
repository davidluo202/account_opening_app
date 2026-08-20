import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut, storagePresignGet } from "./storage";
import { nanoid } from "nanoid";
import { generateApplicationPDF, type ApplicationPDFData } from "./pdf-generator";
import {
  sendVerificationCode as sendEmail,
  sendVerificationCodeBySms,
  generateVerificationCode,
  sendApprovalNotificationEmail,
  sendRejectionNotificationEmail,
  sendReturnNotificationEmail
} from "./email";

import { screenPerson } from "./sanctions";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // 发送邮箱/短信验证码
    sendVerificationCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        isApprover: z.boolean().optional(),
        method: z.enum(['email', 'sms']).optional().default('email'),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.isApprover && !input.email.endsWith('@cmfinancial.com')) {
          throw new Error('审批人员必须使用@cmfinancial.com邮箱');
        }
        if (input.method === 'sms' && !input.phone) {
          throw new Error('短信验证需要提供手机号码');
        }
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await db.saveVerificationCode(input.email, code, expiresAt);

        const bypassEmail = process.env.BYPASS_EMAIL === 'true';
        if (!bypassEmail) {
          if (input.method === 'sms') {
            const sent = await sendVerificationCodeBySms(input.phone!, code);
            if (!sent) throw new Error("短信发送失败，请稍后重试");
          } else {
            const sent = await sendEmail(input.email, code);
            if (!sent) throw new Error("邮件发送失败，请稍后重试");
          }
        } else {
          // console.log(`[BYPASS_EMAIL] Code for ${input.email}: ${code}`);
        }

        return { success: true, message: "验证码已发送至您的邮箱" };
      }),
    
    // 验证邮箱验证码
    verifyCode: publicProcedure
      .input(z.object({ 
        email: z.string().email(),
        code: z.string().length(6)
      }))
      .mutation(async ({ input, ctx }) => {
        const verified = await db.verifyEmailCode(input.email, input.code);
        if (!verified) {
          throw new Error("验证码无效或已过期");
        }
        
        // 查找或创建用户记录（使用邮箱作为openId）
        let user = await db.getUserByEmail(input.email);
        if (!user) {
          // 创建新用户（使用邮箱作为openId）
          await db.upsertUser({
            openId: input.email, // 使用邮箱作为openId
            email: input.email,
            name: input.email.split('@')[0], // 使用邮箱前缀作为姓名
            loginMethod: 'email',
            lastSignedIn: new Date(),
          });
          user = await db.getUserByEmail(input.email);
        }
        
        if (!user) {
          throw new Error("创建用户失败");
        }
        
        // 更新emailVerified状态
        await db.updateUserEmailVerified(user.id, true);
        
        // 创建session token
        const { sdk } = await import('./_core/sdk');
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || '',
        });
        
        // 设置session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        
        return { success: true };
      }),
  }),
  
  // 申请管理
  application: router({
    // 创建新申请
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const applicationId = await db.createApplication(ctx.user.id);
      return { applicationId };
    }),
    
    // 获取用户的所有申请
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserApplications(ctx.user.id);
    }),
    
    // 获取申请详情
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.id);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return application;
      }),
    
    // 获取完整申请数据
    getComplete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.id);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getCompleteApplicationData(input.id);
      }),
    
    // 生成申请编号
    generateNumber: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.id);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        const applicationNumber = await db.assignApplicationNumber(input.id);
        return { applicationNumber };
      }),
    
    // 提交申请
    submit: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        signatureName: z.string(),
        signatureData: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // console.log('\n========== SUBMIT API CALLED ==========');
        // console.log('[Submit] Application ID:', input.id);
        // console.log('[Submit] Signature Name:', input.signatureName);
        // console.log('[Submit] User:', ctx.user.openId);
        const application = await db.getApplicationById(input.id);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        // 分配申请编号（如果还没有）
        let applicationNumber = application.applicationNumber;
        if (!applicationNumber) {
          applicationNumber = await db.assignApplicationNumber(input.id);
        }
        
        // 提交申请（包含签名信息）
        await db.submitApplication(input.id, {
          signatureName: input.signatureName,
          signatureData: input.signatureData,
          signatureTimestamp: new Date(),
        });
        
        // 生成PDF
        const { generateApplicationPDF } = await import('./pdf-generator-v7');
        let pdfBuffer: Buffer | undefined;
        
        // 获取申请数据用于邮件发送
        const completeData = await db.getCompleteApplicationData(input.id);
        if (!completeData || !completeData.detailedInfo) {
          throw new Error("申请数据不存在");
        }                // 準備PDF數據（映射到PDF生成器期望的格式）
        const dataForPDF = {
          applicationNumber: applicationNumber,
          status: application.status,
          accountSelection: completeData.accountSelection,
          basicInfo: completeData.basicInfo,
          detailedInfo: completeData.detailedInfo,
          occupation: completeData.occupation,
          financial: completeData.employment, // employment包含財務狀況
          investment: completeData.financial, // financial包含投資信息
          bankAccounts: completeData.bankAccounts,
          signatureName: input.signatureName,
          signatureMethod: 'typed',
          signatureTimestamp: new Date(),
          submittedAt: new Date(),
        };
        
        // 发送客户确认邮件
        const { sendCustomerConfirmationEmail, sendInternalNotificationEmail } = await import('./email');
        const customerEmail = completeData.detailedInfo?.email;
        const customerName = completeData.basicInfo?.chineseName || completeData.basicInfo?.englishName || '客户';
        const customerGender = completeData.basicInfo?.gender; // 获取客户性别
        
        // console.log(`Preparing to send emails for application ${applicationNumber}`);
        // console.log(`Customer email: ${customerEmail}`);
        // console.log(`Customer name: ${customerName}`);
        
        // 生成PDF
        try {
          pdfBuffer = await generateApplicationPDF(dataForPDF as any);
          // console.log(`[PDF Generation] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
        } catch (error) {
          console.error('[PDF Generation] Failed to generate PDF:', error);
          console.error('[PDF Generation] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          // PDF生成失败不影响邮件发送，只是不附带PDF
        }
        
        // 如果PDF生成成功，先上传到S3获得URL
        let pdfUrl: string | undefined;
        if (pdfBuffer) {
          try {
            const { storagePut } = await import('./storage');
            const result = await storagePut(
              `applications/${applicationNumber}/application.pdf`,
              pdfBuffer,
              'application/pdf'
            );
            pdfUrl = result.url;
            // console.log(`PDF uploaded to S3: ${pdfUrl}`);
          } catch (error) {
            console.error('Failed to upload PDF to S3:', error);
          }
        }
        
        // 发送邮件（使用PDF下载链接）
        if (customerEmail && applicationNumber) {
          // console.log(`Condition met: customerEmail=${customerEmail}, applicationNumber=${applicationNumber}`);
          try {
            // console.log(`Calling sendCustomerConfirmationEmail...`);
            const result = await sendCustomerConfirmationEmail(
              customerEmail,
              applicationNumber,
              customerName,
              customerGender, // 传递性别
              pdfUrl // PDF下载链接
            );
            // console.log(`sendCustomerConfirmationEmail result: ${result}`);
            if (result) {
              // console.log(`Customer confirmation email sent to ${customerEmail}`);
            } else {
              console.error(`Failed to send customer confirmation email to ${customerEmail}`);
            }
          } catch (error) {
            console.error('Failed to send customer confirmation email:', error);
          }
          
          try {
            // console.log(`Calling sendInternalNotificationEmail...`);
            const result = await sendInternalNotificationEmail(
              applicationNumber,
              customerName,
              customerEmail,
              pdfUrl // PDF下载链接
            );
            // console.log(`sendInternalNotificationEmail result: ${result}`);
            if (result) {
              // console.log(`Internal notification email sent for application ${applicationNumber}`);
            } else {
              console.error(`Failed to send internal notification email for application ${applicationNumber}`);
            }
          } catch (error) {
            console.error('Failed to send internal notification email:', error);
          }
        } else {
          // console.log(`Email sending skipped: customerEmail=${customerEmail}, applicationNumber=${applicationNumber}`);
        }
        
        return { success: true, pdfUrl };
      }),
    
    // 生成PDF
    generatePDF: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.id);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        // 获取完整的申请数据
        const completeData = await db.getCompleteApplicationData(input.id);
        
        // 构造PDF数据
        const pdfData: ApplicationPDFData = {
          applicationNumber: application.applicationNumber || 'DRAFT',
          customerType: completeData.accountSelection?.customerType || '',
          accountType: completeData.accountSelection?.accountType || 'cash',
          chineseName: completeData.basicInfo?.chineseName || '',
          englishName: completeData.basicInfo?.englishName || '',
          gender: completeData.basicInfo?.gender || '',
          dateOfBirth: completeData.basicInfo?.dateOfBirth || '',
          placeOfBirth: completeData.basicInfo?.placeOfBirth || '',
          nationality: completeData.basicInfo?.nationality || '',
          idType: completeData.detailedInfo?.idType || '',
          idNumber: completeData.detailedInfo?.idNumber || '',
          idIssuingPlace: completeData.detailedInfo?.idIssuingPlace || '',
          idExpiryDate: completeData.detailedInfo?.idExpiryDate || undefined,
          idIsPermanent: completeData.detailedInfo?.idIsPermanent || false,
          maritalStatus: completeData.detailedInfo?.maritalStatus || '',
          educationLevel: completeData.detailedInfo?.educationLevel || '',
          email: completeData.detailedInfo?.email || '',
          phoneCountryCode: completeData.detailedInfo?.phoneCountryCode || '',
          phoneNumber: completeData.detailedInfo?.phoneNumber || '',
          mobileCountryCode: completeData.detailedInfo?.mobileCountryCode || '',
          mobileNumber: completeData.detailedInfo?.mobileNumber || '',
          faxNo: completeData.detailedInfo?.faxNo || undefined,
          residentialAddress: completeData.detailedInfo?.residentialAddress || '',
          billingAddressType: completeData.detailedInfo?.billingAddressType || 'residential',
          billingAddressOther: completeData.detailedInfo?.billingAddressOther || undefined,
          preferredLanguage: completeData.detailedInfo?.preferredLanguage || 'chinese',
          employmentStatus: completeData.occupation?.employmentStatus || '',
          employerName: completeData.occupation?.companyName || undefined,
          employerAddress: completeData.occupation?.companyAddress || undefined,
          occupation: completeData.occupation?.position || undefined,
          officePhone: completeData.occupation?.officePhone || undefined,
          officeFaxNo: completeData.occupation?.officeFaxNo || undefined,
          annualIncome: completeData.employment?.annualIncome || '',
          netWorth: completeData.employment?.netWorth || '',
          liquidAsset: completeData.employment?.liquidAsset || '',
          investmentObjective: completeData.financial?.investmentObjectives || '',
          investmentExperience: completeData.financial?.investmentExperience || '',
          bankAccounts: (completeData.bankAccounts || []).map(account => ({
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountType: account.accountType || 'saving',
          })),
          taxCountry: completeData.taxInfo?.taxResidency || '',
          taxIdNumber: completeData.taxInfo?.taxIdNumber || '',
          riskQuestionnaire: completeData.riskQuestionnaire ? {
            q1_current_investments: completeData.riskQuestionnaire.q1_current_investments || '',
            q2_investment_period: completeData.riskQuestionnaire.q2_investment_period || '',
            q3_price_volatility: completeData.riskQuestionnaire.q3_price_volatility || '',
            q4_investment_percentage: completeData.riskQuestionnaire.q4_investment_percentage || '',
            q5_investment_attitude: completeData.riskQuestionnaire.q5_investment_attitude || '',
            q6_derivatives_knowledge: completeData.riskQuestionnaire.q6_derivatives_knowledge || '',
            q7_age_group: completeData.riskQuestionnaire.q7_age_group || '',
            q8_education_level: completeData.riskQuestionnaire.q8_education_level || '',
            q9_investment_knowledge_sources: completeData.riskQuestionnaire.q9_investment_knowledge_sources || '',
            q10_liquidity_needs: completeData.riskQuestionnaire.q10_liquidity_needs || '',
            totalScore: completeData.riskQuestionnaire.totalScore || 0,
            riskLevel: completeData.riskQuestionnaire.riskLevel || '',
            riskDescription: completeData.riskQuestionnaire.riskDescription || '',
          } : undefined,
          uploadedDocuments: completeData.uploadedDocuments || [],
          faceVerificationStatus: completeData.face?.verified ? 'verified' : 'pending',
          isPEP: completeData.regulatory?.isPEP || false,
          isUSPerson: completeData.regulatory?.isUSPerson || false,
          agreementSigned: completeData.regulatory?.agreementAccepted || false,
          signatureDate: completeData.regulatory?.signedAt ? new Date(completeData.regulatory.signedAt).toLocaleDateString() : '',
        };
        
        // 生成PDF
        const pdfBuffer = await generateApplicationPDF(pdfData);
        
        // 上传到S3
        const fileName = `application-${application.applicationNumber || input.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(
          `applications/${ctx.user.id}/${fileName}`,
          pdfBuffer,
          'application/pdf'
        );
        
        return { success: true, pdfUrl: url };
      }),

    // 生成预览PDF（不提交，只生成PDF供下载）
    generatePreviewPDF: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        if (!application.applicationNumber) {
          throw new Error("请先生成申请编号");
        }
        
        // 获取完整的申请数据
        const completeData = await db.getCompleteApplicationData(input.applicationId);
        if (!completeData || !completeData.detailedInfo) {
          throw new Error("申请数据不存在");
        }
        
        // 準備PDF數據（映射到PDF生成器期望的格式）
        const dataForPDF = {
          applicationNumber: application.applicationNumber,
          status: application.status,
          accountSelection: completeData.accountSelection,
          basicInfo: completeData.basicInfo,
          detailedInfo: completeData.detailedInfo,
          occupation: completeData.occupation,
          financial: completeData.employment, // employment包含財務狀況
          investment: completeData.financial, // financial包含投資信息
          bankAccounts: completeData.bankAccounts,
          // 添加稅務信息
          taxInfo: completeData.taxInfo ? {
            taxResidency: completeData.taxInfo.taxResidency,
            taxIdNumber: completeData.taxInfo.taxIdNumber,
          } : undefined,
          // 添加上傳文件清單
          uploadedDocuments: completeData.uploadedDocuments?.map((doc: any) => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileKey: doc.fileKey,
            fileUrl: doc.fileUrl,
          })) || [],
          // 添加簽名信息（如果已提交）
          signatureName: application.signatureName,
          signatureMethod: application.signatureMethod,
          signatureTimestamp: application.signatureTimestamp,
          submittedAt: application.submittedAt,
          // 添加合規聲明字段（從regulatory對象中獲取）
          isPEP: completeData.regulatory?.isPEP ?? false,
          isUSPerson: completeData.regulatory?.isUSPerson ?? false,
          agreementRead: completeData.regulatory?.agreementRead ?? completeData.regulatory?.confirmationRead ?? false,
          agreementAccepted: completeData.regulatory?.agreementAccepted ?? completeData.regulatory?.confirmationRead ?? false,
          amlComplianceConsent: completeData.regulatory?.amlComplianceConsent ?? false,
          etoConsent: completeData.regulatory?.electronicSignatureConsent ?? completeData.regulatory?.etoConsent ?? false,
          riskAssessmentConsent: completeData.regulatory?.riskAssessmentConsent ?? false,
          clientConfirmationRead: completeData.regulatory?.agreementAccepted ?? completeData.regulatory?.agreementRead ?? completeData.regulatory?.clientConfirmationRead ?? false,
          objectsDirectMarketing: completeData.regulatory?.objectsDirectMarketing ?? false,
          // 風險評估問卷
          riskQuestionnaire: completeData.riskQuestionnaire || undefined,
        };
        
        // 生成PDF
        const { generateApplicationPDF } = await import('./pdf-generator-v7');
        let pdfBuffer: Buffer;
        
        try {
          // console.log('[Preview PDF] Starting PDF generation...');
          pdfBuffer = await generateApplicationPDF(dataForPDF as any);
          // console.log(`[Preview PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
        } catch (error) {
          console.error('[Preview PDF] Failed to generate PDF:', error);
          throw new Error(`PDF生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
        
        // 返回base64编码的PDF数据，供前端下载
        const pdfBase64 = pdfBuffer.toString('base64');
        
        return { success: true, pdfData: pdfBase64, fileName: `${application.applicationNumber}.pdf` };
      }),
  }),
  
  // Case 1 & 2: 账户选择
  accountSelection: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        customerType: z.enum(["individual", "joint", "corporate"]),
        accountType: z.enum(["cash", "margin", "derivatives"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        await db.saveAccountSelection(applicationId, data);
        await db.updateApplicationStep(applicationId, 2);
        
        // 验证数据已保存
        const saved = await db.getAccountSelection(applicationId);
        return { success: true, data: saved };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getAccountSelection(input.applicationId);
      }),
  }),
  
  // Case 3: 个人基本信息
  personalBasic: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        chineseName: z.string().min(1),
        englishName: z.string().min(1),
        gender: z.enum(["male", "female", "other"]),
        dateOfBirth: z.string(),
        placeOfBirth: z.string(),
        nationality: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        await db.savePersonalBasicInfo(applicationId, data);
        await db.updateApplicationStep(applicationId, 3);
        
        const saved = await db.getPersonalBasicInfo(applicationId);
        return { success: true, data: saved };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getPersonalBasicInfo(input.applicationId);
      }),
  }),
  
  // Case 3b: 机构基本信息
  corporateBasic: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        companyEnglishName: z.string().optional(),
        companyChineseName: z.string().optional(),
        natureOfEntity: z.string().optional(),
        natureOfEntityOther: z.string().optional(),
        natureOfBusiness: z.string().optional(),
        natureOfBusinessOther: z.string().optional(),
        countryOfIncorporation: z.string().optional(),
        countryOfIncorporationOther: z.string().optional(),
        dateOfIncorporation: z.string().optional(),
        certificateOfIncorporationNo: z.string().optional(),
        jurisdictionOfResidence: z.string().optional(),
        businessRegistrationNo: z.string().optional(),
        registeredAddress: z.string().optional(),
        businessAddress: z.string().optional(),
        officeNo: z.string().optional(),
        facsimileNo: z.string().optional(),
        contactName: z.string().optional(),
        contactTitle: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        contactEmailVerified: z.boolean().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }

        await db.saveCorporateBasicInfo(applicationId, data);
        await db.updateApplicationStep(applicationId, 3);

        const saved = await db.getCorporateBasicInfo(applicationId);
        return { success: true, data: saved };
      }),

    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getCorporateBasicInfo(input.applicationId);
      }),
  }),

  // Case 3c: 公司财务状况
  corporateFinancial: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        authorizedShareCapital: z.string().optional(),
        issuedShareCapital: z.string().optional(),
        initialSourceOfWealth: z.array(z.string()).optional(),
        netAssetValue: z.string().optional(),
        netAssetAuditDate: z.string().optional(),
        profitAfterTax: z.string().optional(),
        profitAuditDate: z.string().optional(),
        assetItems: z.array(z.string()).optional(),
        assetItemsOther: z.string().optional(),
        experiencedProducts: z.array(z.string()).optional(),
        experiencedProductsOther: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, initialSourceOfWealth, assetItems, experiencedProducts, ...rest } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) throw new Error("申请不存在或无权访问");
        const data = { ...rest, initialSourceOfWealth: JSON.stringify(initialSourceOfWealth || []), assetItems: JSON.stringify(assetItems || []), experiencedProducts: JSON.stringify(experiencedProducts || []) };
        await db.saveCorporateFinancialInfo(applicationId, data);
        await db.updateApplicationStep(applicationId, 4);
        const saved = await db.getCorporateFinancialInfo(applicationId);
        return { success: true, data: saved };
      }),
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) throw new Error("申请不存在或无权访问");
        return await db.getCorporateFinancialInfo(input.applicationId);
      }),
  }),

  // Case 3d: 公司投资经验与目标
  corporateInvestment: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        investmentObjectives: z.array(z.string()).optional(),
        investmentObjectivesOther: z.string().optional(),
        estimatedInvestmentAmount: z.string().optional(),
        riskVolatility: z.string().optional(),
        investmentExperience: z.string().optional(),
        knowledgeOfDerivatives: z.string().optional(),
        experiencedProducts: z.array(z.string()).optional(),
        experiencedProductsOther: z.string().optional(),
        assetItems: z.array(z.string()).optional(),
        assetItemsOther: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, investmentObjectives, experiencedProducts, assetItems, ...rest } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) throw new Error("申请不存在或无权访问");
        const data = { ...rest, investmentObjectives: JSON.stringify(investmentObjectives || []), experiencedProducts: JSON.stringify(experiencedProducts || []), assetItems: JSON.stringify(assetItems || []) };
        await db.saveCorporateInvestmentInfo(applicationId, data);
        await db.updateApplicationStep(applicationId, 5);
        const saved = await db.getCorporateInvestmentInfo(applicationId);
        return { success: true, data: saved };
      }),
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) throw new Error("申请不存在或无权访问");
        return await db.getCorporateInvestmentInfo(input.applicationId);
      }),
  }),

  // Case 3e: 公司关联人士
  corporateRelatedParties: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        relatedParties: z.array(z.any()),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, relatedParties } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) throw new Error("申请不存在或无权访问");
        await db.saveCorporateRelatedParties(applicationId, relatedParties);
        await db.updateApplicationStep(applicationId, 6);
        const saved = await db.getCorporateRelatedParties(applicationId);
        return { success: true, data: saved };
      }),
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) throw new Error("申请不存在或无权访问");
        return await db.getCorporateRelatedParties(input.applicationId);
      }),
  }),

  // Case 4: 个人详细信息
  personalDetailed: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        idType: z.string(),
        idNumber: z.string(),
        idIssuingCountry: z.string().optional(),
        idIssuingPlace: z.string(),
        idIssuingPlaceOther: z.string().optional(),
        idExpiryDate: z.string().optional(),
        idIsPermanent: z.boolean(),
        maritalStatus: z.string(),
        educationLevel: z.string(),
        email: z.string().email(),
        // 住宅电话（可选）
        phoneCountryCode: z.string().optional(),
        phoneNumber: z.string().optional(),
        // 手机号码（必填）
        mobileCountryCode: z.string(),
        mobileNumber: z.string(),
        faxNo: z.string().optional(),
        emailVerified: z.boolean().optional().default(false),
        residentialAddress: z.string(),
        // 账单通讯地址
        billingAddressType: z.enum(["residential", "office", "other"]),
        billingAddressOther: z.string().optional(),
        // 账单首选语言
        preferredLanguage: z.enum(["chinese", "english"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        await db.savePersonalDetailedInfo(applicationId, data);
        await db.updateApplicationStep(applicationId, 4);
        
        const saved = await db.getPersonalDetailedInfo(applicationId);
        return { success: true, data: saved };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getPersonalDetailedInfo(input.applicationId);
      }),
  }),
  
  // Case 5: 职业信息
  occupation: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        employmentStatus: z.enum(["employed", "self_employed", "retired", "student", "housewife", "others", "unemployed"]),
        companyName: z.string().optional(),
        position: z.string().optional(),
        yearsOfService: z.number().optional(),
        industry: z.string().optional(),
        industryOther: z.string().optional(),
        companyAddress: z.string().optional(),
        officePhone: z.string().optional(),
        officeFaxNo: z.string().optional(),
        mobilePhone: z.string().optional(),
        phoneCountryCode: z.string().optional(),
        correspondenceAddress: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }

        await db.saveOccupationInfo(applicationId, data);
        await db.updateApplicationStep(applicationId, 5);
        
        const saved = await db.getOccupationInfo(applicationId);
        return { success: true, data: saved };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getOccupationInfo(input.applicationId);
      }),
  }),
  
  // Case 6: 就业详情
  employment: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        incomeSource: z.string(),
        annualIncome: z.string(),
        liquidAsset: z.string(), // 流动资产（必填）
        netWorth: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        await db.saveEmploymentDetails(applicationId, data);
        await db.updateApplicationStep(applicationId, 6);
        
        const saved = await db.getEmploymentDetails(applicationId);
        return { success: true, data: saved };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getEmploymentDetails(input.applicationId);
      }),
  }),
  
  // Case 7: 财务与投资
  financial: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        investmentObjectives: z.array(z.string()),
        investmentExperience: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, investmentObjectives, investmentExperience, ...rest } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        const data = {
          ...rest,
          investmentObjectives: JSON.stringify(investmentObjectives),
          investmentExperience: JSON.stringify(investmentExperience),
        };
        
        await db.saveFinancialAndInvestment(applicationId, data);
        await db.updateApplicationStep(applicationId, 7);
        
        const saved = await db.getFinancialAndInvestment(applicationId);
        return { success: true, data: saved };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getFinancialAndInvestment(input.applicationId);
      }),
  }),
  
  // Case 8: 银行账户
  bankAccount: router({
    add: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        bankName: z.string(),
        bankLocation: z.enum(["HK", "CN", "OTHER"]).default("HK"), // 银行所在地
        accountType: z.enum(["saving", "current", "checking", "others"]).optional(), // 账户类型（可选）
        accountCurrency: z.string(),
        accountNumber: z.string(),
        accountHolderName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        const id = await db.saveBankAccount(applicationId, data);
        await db.updateApplicationStep(applicationId, 8);
        
        return { success: true, id };
      }),
    
    list: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getBankAccounts(input.applicationId);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBankAccount(input.id);
        return { success: true };
      }),
  }),
  
  // Case 9: 税务信息
  tax: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        taxResidency: z.string(),
        taxIdNumber: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        await db.saveTaxInfo(applicationId, data);
        await db.updateApplicationStep(applicationId, 9);
        
        const saved = await db.getTaxInfo(applicationId);
        return { success: true, data: saved };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getTaxInfo(input.applicationId);
      }),
  }),
  
  // Case 10: 文件上传
  document: router({
    upload: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        documentType: z.string(),
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, documentType, fileName, fileData, mimeType } = input;

        // File security validation
        const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

        if (!ALLOWED_MIME.includes(mimeType)) {
          throw new Error(`不支持的文件类型: ${mimeType}。支持: PDF, JPG, PNG, DOC, DOCX`);
        }
        const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
        if (!ALLOWED_EXT.includes(ext)) {
          throw new Error(`不支持的文件扩展名: ${ext}。支持: ${ALLOWED_EXT.join(', ')}`);
        }

        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }

        // 将base64转换为Buffer
        const buffer = Buffer.from(fileData, 'base64');
        if (buffer.length > MAX_FILE_SIZE) {
          throw new Error(`文件大小超过限制（最大10MB），当前: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
        }
        const fileKey = `applications/${applicationId}/${documentType}/${nanoid()}-${fileName}`;
        
        // 上传到S3
        const { url } = await storagePut(fileKey, buffer, mimeType);
        
        // 保存到数据库
        const id = await db.saveUploadedDocument(applicationId, {
          documentType,
          fileKey,
          fileUrl: url,
          fileName,
          mimeType,
          fileSize: buffer.length,
        });
        
        await db.updateApplicationStep(applicationId, 10);
        
        return { success: true, id, url };
      }),
    
    list: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getUploadedDocuments(input.applicationId);
      }),

    getViewUrl: publicProcedure
      .input(z.object({
        applicationId: z.union([z.number(), z.string()]),
        fileKey: z.string(),
      }))
      .query(async ({ input }) => {
        const { fileKey } = input;
        if (!fileKey) throw new Error("fileKey is required");
        const url = await storagePresignGet(fileKey, 3600); // 1 hour expiry
        return { url };
      }),
  }),
  
  // Case 11: 人脸识别
  faceVerification: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        verified: z.boolean(),
        faceImageData: z.string(), // base64 image data
        confidence: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, faceImageData, confidence, verified } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        // 上传人脸照片到S3
        const base64Data = faceImageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileKey = `face-verification/${ctx.user.id}/${applicationId}-${Date.now()}.jpg`;
        const { url: faceImageUrl } = await storagePut(fileKey, buffer, 'image/jpeg');
        
        // 准备保存的数据
        const verificationData = {
          faceImageUrl,
          verifiedAt: new Date().toISOString(),
          confidence,
        };
        
        const saveData = {
          verified,
          verificationData: JSON.stringify(verificationData),
        };
        
        await db.saveFaceVerification(applicationId, saveData);
        await db.updateApplicationStep(applicationId, 11);
        
        return { success: true, faceImageUrl };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        return await db.getFaceVerification(input.applicationId);
      }),
    
    // Face++人脸比对API
    compareFaces: protectedProcedure
      .input(z.object({
        selfieImageUrl: z.string(),
        idCardImageUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { selfieImageUrl, idCardImageUrl } = input;
        
        // 检查Face++ API密钥是否配置
        const apiKey = process.env.FACEPP_API_KEY;
        const apiSecret = process.env.FACEPP_API_SECRET;
        
        if (!apiKey || !apiSecret) {
          throw new Error('Face++ API密鑰未配置');
        }
        
        try {
          // 调用Face++ Compare API
          const formData = new FormData();
          formData.append('api_key', apiKey);
          formData.append('api_secret', apiSecret);
          formData.append('image_url1', selfieImageUrl);
          formData.append('image_url2', idCardImageUrl);
          
          const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Face++ API請求失敗: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // 检查是否有错误
          if (result.error_message) {
            throw new Error(`Face++ API錯誤: ${result.error_message}`);
          }
          
          // 获取置信度（0-100）
          const confidence = result.confidence || 0;
          const threshold = 90; // 90%置信度阈值
          const success = confidence >= threshold;
          
          return {
            success,
            confidence,
            message: success 
              ? `人臉比對成功，置信度：${confidence.toFixed(2)}%`
              : `人臉比對失敗，置信度：${confidence.toFixed(2)}%（需要≥${threshold}%）`,
          };
        } catch (error: any) {
          console.error('Face++ API error:', error);
          throw new Error(`人臉比對失敗: ${error.message}`);
        }
      }),
  }),
  
  // Case 12: 监管声明
  regulatory: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        isPEP: z.boolean(),
        isUSPerson: z.boolean(),
        agreementRead: z.boolean(),
        agreementAccepted: z.boolean(),
        signatureName: z.string(),
        electronicSignatureConsent: z.boolean(),
        amlComplianceConsent: z.boolean(),
        riskAssessmentConsent: z.boolean(),
        bcanConsentAccepted: z.boolean().optional(),
        confirmationRead: z.boolean().optional(),
        objectsDirectMarketing: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, confirmationRead, objectsDirectMarketing, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }

        const saveData = {
          ...data,
          // Map confirmationRead to agreementAccepted (frontend uses confirmationRead, DB uses agreementAccepted)
          agreementAccepted: confirmationRead ?? data.agreementAccepted ?? false,
          bcanConsentAccepted: data.bcanConsentAccepted ?? false,
          objectsDirectMarketing: objectsDirectMarketing ?? false,
          signedAt: new Date(),
        };
        
        await db.saveRegulatoryDeclarations(applicationId, saveData);
        await db.updateApplicationStep(applicationId, 12);
        
        return { success: true };
      }),
    
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        const data = await db.getRegulatoryDeclarations(input.applicationId);
        if (data) {
          // Map agreementAccepted back to confirmationRead for frontend compatibility
          return { ...data, confirmationRead: data.agreementAccepted };
        }
        return data;
      }),
  }),
  
  // 审批人员管理
  approver: router({
    // 密码登录
    loginWithPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const { hashPassword, verifyPassword } = await import('./password');
        
        // 查找用户
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error('邮箱或密码错误');
        }
        
        // 验证密码
        if (!user.password) {
          throw new Error('该账户尚未设置密码，请使用验证码登录');
        }
        
        const isValid = await verifyPassword(input.password, user.password);
        if (!isValid) {
          throw new Error('邮箱或密码错误');
        }
        
        // 创建session token
        const { sdk } = await import('./_core/sdk');
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || '',
        });
        
        // 设置session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        
        return { success: true };
      }),
    
    // 请求密码重置
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { generateResetToken, generateResetLink } = await import('./password');
        const { sendPasswordResetEmail } = await import('./email');
        
        // 查找用户
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // 不要透露用户是否存在
          return { success: true, message: '如果该邮箱存在，您将收到密码重置邮件' };
        }
        
        // 生成重置令牌
        const resetToken = generateResetToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期
        
        // 保存重置令牌到数据库
        await db.savePasswordResetToken(user.id, resetToken, resetExpires);
        
        // 从请求头获取域名
        const protocol = ctx.req.headers['x-forwarded-proto'] || (ctx.req.secure ? 'https' : 'http');
        const host = ctx.req.headers['x-forwarded-host'] || ctx.req.headers['host'] || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        const resetLink = generateResetLink(resetToken, baseUrl);
        
        // 发送邮件
        const sent = await sendPasswordResetEmail(input.email, resetLink);
        if (!sent) {
          throw new Error('邮件发送失败，请稍后重试');
        }
        
        return { success: true, message: '密码重置邮件已发送' };
      }),
    
    // 重置密码
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const { hashPassword } = await import('./password');
        
        // 验证令牌
        const user = await db.getUserByResetToken(input.token);
        if (!user) {
          throw new Error('重置链接无效或已过期');
        }
        
        // 加密新密码
        const hashedPassword = await hashPassword(input.newPassword);
        
        // 更新密码并清除重置令牌
        await db.updateUserPassword(user.id, hashedPassword);
        
        return { success: true, message: '密码重置成功' };
      }),
    
    // 获取所有审批人员列表
    list: protectedProcedure.query(async ({ ctx }) => {
      // 检查用户是否为管理员
      if (ctx.user.role !== 'admin') {
        throw new Error('没有权限访问审批人员列表');
      }
      
      return await db.getAllApprovers();
    }),
    
    // 添加审批人员（仅管理员）
    add: protectedProcedure
      .input(z.object({
        userId: z.number(),
        employeeName: z.string(),
        ceNumber: z.string(),
        role: z.enum(['approver', 'manager']).default('approver'),
      }))
      .mutation(async ({ ctx, input }) => {
        // 检查用户是否为管理员
        if (ctx.user.role !== 'admin') {
          throw new Error('没有权限添加审批人员');
        }
        
        // 验证用户邮箱域名
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new Error('用户不存在');
        }
        if (!user.email || !user.email.endsWith('@cmfinancial.com')) {
          throw new Error('审批人员必须使用@cmfinancial.com邮箱');
        }
        if (!user.emailVerified) {
          throw new Error('邮箱尚未验证，请先完成邮箱验证');
        }
        
        return await db.addApprover(input);
      }),
    
    // 更新审批人员信息
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        employeeName: z.string().optional(),
        ceNumber: z.string().optional(),
        role: z.enum(['approver', 'manager']).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 检查用户是否为管理员
        if (ctx.user.role !== 'admin') {
          throw new Error('没有权限更新审批人员');
        }
        
        return await db.updateApprover(input);
      }),
    
    // 删除审批人员
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // 检查用户是否为管理员
        if (ctx.user.role !== 'admin') {
          throw new Error('没有权限删除审批人员');
        }
        
        return await db.deleteApprover(input.id);
      }),
  }),
  
  // 审批管理
  approval: router({
    // 获取所有已提交的申请列表
    getPendingApplications: protectedProcedure.query(async ({ ctx }) => {
      // 检查用户是否为审批人员或管理员
      if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
        throw new Error('没有权限访问审批系统');
      }
      
      return await db.getSubmittedApplications();
    }),
    
    // 获取申请完整详情
    getApplicationDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        // 检查用户是否为审批人员或管理员
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限访问审批系统');
        }
        
        return await db.getCompleteApplicationData(input.id);
      }),
    
    // 第一级审批（有CE号码的审批人员）
    firstApprove: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        isProfessionalInvestor: z.boolean(),
        approvedRiskProfile: z.enum(['R1', 'R2', 'R3', 'R4', 'R5', 'R6']),
        comments: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 检查用户是否为审批人员或管理员
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限进行审批操作');
        }
        
        // 获取审批人员信息
        const approver = await db.getApproverByUserId(ctx.user.id);
        if (!approver) {
          throw new Error('未找到审批人员信息，请联系管理员');
        }
        
        // 第一级审批必须有CE号码
        if (!approver.ceNumber) {
          throw new Error('第一级审批人员必须有CE号码');
        }
        
        // 检查是否已经进行过初审（防止重复审批）
        const existingApplication = await db.getCompleteApplicationData(input.applicationId);
        if (existingApplication?.application?.firstApprovalStatus === 'approved') {
          throw new Error('该申请已经完成初审，无法重复审批');
        }

        // 自动进行制裁/AML筛查（如果尚未筛查）
        const existingScreening = await db.getSanctionsScreening(input.applicationId);
        if (!existingScreening) {
          const applicantName = existingApplication?.basicInfo?.englishName
            || existingApplication?.basicInfo?.chineseName
            || '';
          if (applicantName) {
            try {
              const screenResult = await screenPerson({
                name: applicantName,
                dateOfBirth: existingApplication?.basicInfo?.dateOfBirth || undefined,
                nationality: existingApplication?.basicInfo?.nationality || undefined,
              });
              await db.saveSanctionsScreening(input.applicationId, {
                searchId: screenResult.searchId,
                screenedName: applicantName,
                hitCount: screenResult.hitCount,
                hits: screenResult.hits,
                rawResponse: JSON.stringify(screenResult),
                flaggedForReview: screenResult.hitCount > 0,
              });
              if (screenResult.hitCount > 0) {
                // console.log(`[Sanctions] Application ${input.applicationId} has ${screenResult.hitCount} hit(s) - flagged for review`);
              }
            } catch (sanctionsError) {
              console.error('[Sanctions] Screening failed, continuing with approval:', sanctionsError);
              // 筛查失败不阻止审批流程
            }
          }
        }

        // 更新第一级审批信息（包含PI認定和風險評級）
        await db.updateFirstApproval(input.applicationId, {
          status: 'approved',
          approverEmail: ctx.user.email || '',
          approverName: approver.employeeName,
          approverCeNo: approver.ceNumber,
          comments: input.comments,
          isProfessionalInvestor: input.isProfessionalInvestor,
          riskProfile: input.approvedRiskProfile,
        });
        
        // 记录审批操作
        await db.createApprovalRecord({
          applicationId: input.applicationId,
          approverId: approver.id,
          action: 'first_approved' as any,
          comments: input.comments,
        });
        
        // 发送邮件通知合规部进行第二级审批
        try {
          const { sendFirstApprovalNotificationEmail } = await import('./email');
          const applicationData = await db.getCompleteApplicationData(input.applicationId);
          if (applicationData) {
            await sendFirstApprovalNotificationEmail(
              applicationData.application?.applicationNumber || '',
              applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || '未知',
              approver.employeeName,
              approver.ceNumber,
              input.isProfessionalInvestor,
              input.approvedRiskProfile
            );
          }
        } catch (emailError) {
          console.error('Failed to send first approval notification email:', emailError);
          // 邮件发送失败不影响审批流程
        }
        
        return { success: true };
      }),
    
    // 第二级审批（合规部终审）
    secondApprove: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        isProfessionalInvestor: z.boolean(),
        riskProfile: z.string(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 检查用户是否为审批人员或管理员
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限进行审批操作');
        }
        
        // 获取审批人员信息
        const approver = await db.getApproverByUserId(ctx.user.id);
        if (!approver) {
          throw new Error('未找到审批人员信息，请联系管理员');
        }
        
        // 检查第一级审批是否已通过
        const applicationData = await db.getCompleteApplicationData(input.applicationId);
        if (!applicationData?.application?.firstApprovalStatus || applicationData.application.firstApprovalStatus !== 'approved') {
          throw new Error('第一级审批尚未通过，无法进行第二级审批');
        }
        
        // 检查是否已经完成终审（防止重复审批）
        if (applicationData?.application?.secondApprovalStatus === 'approved') {
          throw new Error('该申请已经完成终审，无法重复审批');
        }
        
        // 检查初审和终审是否为同一人（通过userId比较）
        // firstApprovalBy存储的是初审人员的邮箱
        if (applicationData?.application?.firstApprovalBy) {
          const firstApprover = await db.getApproverByUserId(ctx.user.id);
          // 通过邮箱比较是否为同一人
          if (firstApprover && applicationData.application.firstApprovalBy === ctx.user.email) {
            throw new Error('初审和终审不能是同一人，请联系其他审批人员进行终审');
          }
        }
        
        // 更新第二级审批信息
        await db.updateSecondApproval(input.applicationId, {
          status: 'approved',
          approverEmail: ctx.user.email || '',
          approverName: approver.employeeName,
            approverCeNo: approver.ceNumber, // 合规部可能没有CE号码号码
          comments: input.comments,
        });
        
        // 更新最終的PI認定和風險評級（終審結果，不覆蓋初審專用字段）
        await db.updateApplicationApprovalInfo(input.applicationId, {
          isProfessionalInvestor: input.isProfessionalInvestor,
          approvedRiskProfile: input.riskProfile as any,
        });
        
        // 更新申请状态为最终批准
        await db.updateApplicationStatus(input.applicationId, 'approved');

        // 生成BCAN码（BSU667 + 6位序号）
        let bcanCode = '';
        try {
          bcanCode = await db.generateBcan(input.applicationId) || '';
          // console.log(`[BCAN] Generated for application ${input.applicationId}: ${bcanCode}`);
        } catch (bcanError) {
          console.error('Failed to generate BCAN:', bcanError);
        }

        // 记录审批操作
        await db.createApprovalRecord({
          applicationId: input.applicationId,
          approverId: approver.id,
          action: 'second_approved' as any,
          comments: input.comments,
        });
        
        // 生成終審版PDF（包含客戶提交、初審和終審的完整信息）
        let finalPdfUrl = '';
        try {
          const { generateApplicationPDF } = await import('./pdf-generator-v7');
          const pdfData = {
            applicationNumber: applicationData.application?.applicationNumber,
            status: applicationData.application?.status,
            accountSelection: applicationData.accountSelection ? {
              customerType: applicationData.accountSelection.customerType,
              accountType: applicationData.accountSelection.accountType,
            } : undefined,
            basicInfo: applicationData.basicInfo ? {
              chineseName: applicationData.basicInfo.chineseName,
              englishName: applicationData.basicInfo.englishName,
              gender: applicationData.basicInfo.gender,
              dateOfBirth: applicationData.basicInfo.dateOfBirth,
              placeOfBirth: applicationData.basicInfo.placeOfBirth,
              nationality: applicationData.basicInfo.nationality,
            } : undefined,
            detailedInfo: applicationData.detailedInfo ? {
              idType: applicationData.detailedInfo.idType,
              idNumber: applicationData.detailedInfo.idNumber,
              idIssuingPlace: applicationData.detailedInfo.idIssuingPlace,
              idExpiryDate: applicationData.detailedInfo.idExpiryDate,
              idIsPermanent: applicationData.detailedInfo.idIsPermanent,
              maritalStatus: applicationData.detailedInfo.maritalStatus,
              educationLevel: applicationData.detailedInfo.educationLevel,
              residentialAddress: applicationData.detailedInfo.residentialAddress,
              phoneCountryCode: applicationData.detailedInfo.phoneCountryCode,
              phoneNumber: applicationData.detailedInfo.phoneNumber,
              faxNo: applicationData.detailedInfo.faxNo,
              email: applicationData.detailedInfo.email,
            } : undefined,
            occupation: applicationData.occupation ? {
              employmentStatus: applicationData.occupation.employmentStatus,
              companyName: applicationData.occupation.companyName,
              companyAddress: applicationData.occupation.companyAddress,
              position: applicationData.occupation.position,
              industry: applicationData.occupation.industry,
              industryOther: applicationData.occupation.industryOther,
              yearsOfService: applicationData.occupation.yearsOfService?.toString() || null,
              officePhone: applicationData.occupation.officePhone,
              officeFaxNo: applicationData.occupation.officeFaxNo,
            } : undefined,
            financial: applicationData.employment ? {
              incomeSource: applicationData.employment.incomeSource,
              annualIncome: applicationData.employment.annualIncome,
              netWorth: applicationData.employment.netWorth,
              liquidAsset: applicationData.employment.liquidAsset,
            } : undefined,
            investment: applicationData.financial ? {
              investmentObjectives: applicationData.financial.investmentObjectives,
              investmentExperience: applicationData.financial.investmentExperience,
              riskTolerance: applicationData.financial.riskTolerance,
            } : undefined,
            bankAccounts: applicationData.bankAccounts?.map(acc => ({
              bankName: acc.bankName,
              accountType: acc.accountType,
              currency: acc.accountCurrency,
              accountNumber: acc.accountNumber,
              accountHolderName: acc.accountHolderName,
            })),
            taxInfo: applicationData.taxInfo ? {
              taxResidency: applicationData.taxInfo.taxResidency,
              taxIdNumber: applicationData.taxInfo.taxIdNumber,
            } : undefined,
            uploadedDocuments: applicationData.uploadedDocuments?.map(doc => ({
              documentType: doc.documentType,
              fileUrl: doc.fileUrl,
            })),
            signatureName: applicationData.application?.signatureName,
            signatureMethod: applicationData.application?.signatureMethod,
            signatureTimestamp: applicationData.application?.signatureTimestamp,
            submittedAt: applicationData.application?.submittedAt,
            isPEP: applicationData.regulatory?.isPEP,
            isUSPerson: applicationData.regulatory?.isUSPerson,
            agreementRead: applicationData.regulatory?.agreementRead,
            agreementAccepted: applicationData.regulatory?.agreementAccepted,
            amlComplianceConsent: applicationData.regulatory?.amlComplianceConsent,
            // 初審信息
            firstApproval: {
              approverName: applicationData.application?.firstApprovalByName,
              approverCeNo: applicationData.application?.firstApprovalByCeNo,
              isProfessionalInvestor: applicationData.application?.firstApprovalIsProfessionalInvestor,
              approvedRiskProfile: applicationData.application?.firstApprovalRiskProfile,
              approvalTime: applicationData.application?.firstApprovalAt,
              comments: applicationData.application?.firstApprovalComments,
            },
            // 終審信息
            secondApproval: {
              approverName: approver.employeeName,
              approverCeNo: approver.ceNumber,
              isProfessionalInvestor: input.isProfessionalInvestor,
              approvedRiskProfile: input.riskProfile,
              approvalTime: new Date(),
              comments: input.comments,
            },
          };
          
          const pdfBuffer = await generateApplicationPDF(pdfData);
          
          // 上傳PDF到S3
          const pdfKey = `applications/${applicationData.application?.applicationNumber}/final-approval-${Date.now()}.pdf`;
          const { url } = await storagePut(pdfKey, pdfBuffer, 'application/pdf');
          finalPdfUrl = url;
          
          // 更新数据库中的finalReviewPdfUrl字段
          await db.updateApplicationPdfUrl(input.applicationId, 'finalReviewPdfUrl', url);
          
          // console.log(`[PDF] Final approval PDF generated and uploaded: ${url}`);
        } catch (pdfError) {
          console.error('Failed to generate or upload final approval PDF:', pdfError);
          // PDF生成失败不影响审批流程
        }
        
        // 发送最终批准邮件到operation@cmfinancial.com，抄送customer-services@cmfinancial.com
        try {
          const { sendFinalApprovalNotificationEmail } = await import('./email');
          if (applicationData) {
            await sendFinalApprovalNotificationEmail(
              applicationData.application?.applicationNumber || '',
              applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || '未知',
              applicationData.application?.firstApprovalByName || '',
              applicationData.application?.firstApprovalByCeNo || '',
              approver.employeeName,
              approver.ceNumber || '',
              applicationData.application?.isProfessionalInvestor || false,
              applicationData.application?.approvedRiskProfile || 'medium',
              finalPdfUrl
            );
          }
        } catch (emailError) {
          console.error('Failed to send final approval notification email:', emailError);
          // 邮件发送失败不影响审批流程
        }
        
        return { success: true };
      }),
    
    // 拒绝申请
    reject: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        rejectReason: z.string(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 检查用户是否为审批人员或管理员
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限进行审批操作');
        }
        
        // 获取审批人员信息
        const approver = await db.getApproverByUserId(ctx.user.id);
        if (!approver) {
          throw new Error('未找到审批人员信息，请联系管理员');
        }
        
        // 更新申请状态为已拒绝
        await db.updateApplicationStatus(input.applicationId, 'rejected');
        
        // 记录审批操作（使用approver.id而不是user.id）
        await db.createApprovalRecord({
          applicationId: input.applicationId,
          approverId: approver.id,
          action: 'rejected',
          comments: input.comments,
          rejectReason: input.rejectReason,
        });
        
        // 发送拒绝通知邮件到Customer-services@cmfinancial.com
        try {
          const applicationData = await db.getCompleteApplicationData(input.applicationId);
          if (applicationData) {
            await sendRejectionNotificationEmail(
              applicationData.application?.applicationNumber || '',
              applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || '未知',
              applicationData.detailedInfo?.email || '',
              ctx.user.name || ctx.user.email || '审批人员',
              input.rejectReason
            );
          }
        } catch (emailError) {
          console.error('Failed to send rejection notification email:', emailError);
          // 邮件发送失败不影响审批流程
        }
        
        return { success: true };
      }),
    
    // 退回补充材料
    return: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        returnReason: z.string(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 检查用户是否为审批人员或管理员
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限进行审批操作');
        }
        
        // 获取审批人员信息
        const approver = await db.getApproverByUserId(ctx.user.id);
        if (!approver) {
          throw new Error('未找到审批人员信息，请联系管理员');
        }
        
        // 更新申请状态为退回补充
        await db.updateApplicationStatus(input.applicationId, 'returned');
        
        // 记录审批操作（使用approver.id而不是user.id）
        await db.createApprovalRecord({
          applicationId: input.applicationId,
          approverId: approver.id,
          action: 'returned',
          comments: input.comments,
          returnReason: input.returnReason,
        });
        
        // 发送退回通知邮件到Customer-services@cmfinancial.com
        try {
          const applicationData = await db.getCompleteApplicationData(input.applicationId);
          if (applicationData) {
            await sendReturnNotificationEmail(
              applicationData.application?.applicationNumber || '',
              applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || '未知',
              applicationData.detailedInfo?.email || '',
              ctx.user.name || ctx.user.email || '审批人员',
              input.returnReason
            );
          }
        } catch (emailError) {
          console.error('Failed to send return notification email:', emailError);
          // 邮件发送失败不影响审批流程
        }
        
        return { success: true };
      }),
    
    // 获取审批历史记录
    getHistory: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ ctx, input }) => {
        // 检查用户是否为审批人员或管理员
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限访问审批历史');
        }
        
        return await db.getApprovalHistory(input.applicationId);
      }),
  }),
  
  // 用户管理
  user: router({
    // 获取所有用户列表
    list: protectedProcedure.query(async ({ ctx }) => {
      // 只有管理员可以访问
      if (ctx.user.role !== 'admin') {
        throw new Error('没有权限访问用户管理');
      }
      
      return await db.getAllUsers();
    }),
    
    // 重置用户密码
    resetPassword: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // 只有管理员可以访问
        if (ctx.user.role !== 'admin') {
          throw new Error('没有权限重置密码');
        }
        
        // 生成新密码（8位随机字符）
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
        
        // TODO: 实现密码重置逻辑（当前系统使用OAuth，暂无密码功能）
        // await db.updateUserPassword(input.userId, newPassword);
        
        return { newPassword };
      }),
    
    // 更新用户角色
    updateRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin']),
      }))
      .mutation(async ({ ctx, input }) => {
        // 只有管理员可以访问
        if (ctx.user.role !== 'admin') {
          throw new Error('没有权限修改用户角色');
        }
        
        return await db.updateUserRole(input.userId, input.role);
      }),
    
    // 获取用户的审批人员信息
    getApproverInfo: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        // 只有管理员可以访问
        if (ctx.user.role !== 'admin') {
          throw new Error('没有权限查看审批人员信息');
        }
        
        return await db.getApproverByUserId(input.userId);
      }),
  }),
  
  // 風險評估問卷
  riskQuestionnaire: router({
    // 保存風險評估問卷
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        q1_current_investments: z.string(),
        q2_investment_period: z.string(),
        q3_price_volatility: z.string(),
        q4_investment_percentage: z.string(),
        q5_investment_attitude: z.string(),
        q6_derivatives_knowledge: z.string(),
        q7_age_group: z.string(),
        q8_education_level: z.string(),
        q9_investment_knowledge_sources: z.string(),
        q10_liquidity_needs: z.string(),
        totalScore: z.number(),
        riskLevel: z.string(),
        riskDescription: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.saveRiskQuestionnaire(input);
      }),
    
    // 獲取風險評估問卷
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiskQuestionnaire(input.applicationId);
      }),
  }),

  // 制裁/AML筛查
  personalClientDeclaration: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        declaration_a_is_beneficial_owner: z.boolean(),
        declaration_a_owner_name: z.string().optional(),
        declaration_a_owner_id: z.string().optional(),
        declaration_a_owner_country: z.string().optional(),
        declaration_a_owner_address: z.string().optional(),
        declaration_b_is_employee: z.boolean(),
        declaration_b_institution_name: z.string().optional(),
        declaration_c_is_cmf_employee: z.boolean(),
        declaration_d_is_relative: z.boolean(),
        declaration_d_employee_name: z.string().optional(),
        declaration_d_relationship: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { applicationId, ...data } = input;
        await db.saveCustomerDeclaration(applicationId, data);
        return { success: true };
      }),
    get: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCustomerDeclaration(input.applicationId);
      }),
  }),

  sanctions: router({
    // 手动触发筛查
    screen: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        dateOfBirth: z.string().optional(),
        nationality: z.string().optional(),
        applicationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 只有审批人员或管理员可以触发筛查
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限进行制裁筛查');
        }

        const result = await screenPerson({
          name: input.name,
          dateOfBirth: input.dateOfBirth,
          nationality: input.nationality,
        });

        // 如果提供了applicationId，保存筛查结果
        if (input.applicationId) {
          await db.saveSanctionsScreening(input.applicationId, {
            searchId: result.searchId,
            screenedName: input.name,
            hitCount: result.hitCount,
            hits: result.hits,
            rawResponse: JSON.stringify(result),
            flaggedForReview: result.hitCount > 0,
          });
        }

        return {
          searchId: result.searchId,
          hitCount: result.hitCount,
          hits: result.hits,
          timestamp: result.timestamp,
        };
      }),

    // 按applicationId自动执行筛查
    runScreening: publicProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input }) => {
        const appData = await db.getCompleteApplicationData(input.applicationId);
        if (!appData) throw new Error('申请不存在');
        const name = appData.basicInfo?.englishName || appData.basicInfo?.chineseName || '';
        if (!name) throw new Error('申请人姓名为空');
        const result = await screenPerson({
          name,
          dateOfBirth: appData.basicInfo?.dateOfBirth || undefined,
          nationality: appData.basicInfo?.nationality || undefined,
        });
        await db.saveSanctionsScreening(input.applicationId, {
          searchId: result.searchId,
          screenedName: name,
          hitCount: result.hitCount,
          hits: result.hits,
          rawResponse: JSON.stringify(result),
          flaggedForReview: result.hitCount > 0,
        });
        return { success: true, hitCount: result.hitCount };
      }),

    // 获取申请的筛查结果
    getResult: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限查看筛查结果');
        }
        return await db.getSanctionsScreening(input.applicationId);
      }),
  }),

  // BCAN管理
  bcan: router({
    // 导出BCAN-CID Mapping数据（用��上报港交所SFTP）
    exportMapping: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin' && !ctx.user.email?.endsWith('@cmfinancial.com')) {
          throw new Error('没有权限导出BCAN数据');
        }
        const data = await db.getBcanMappingData();
        // 格式化为港交所要求的结构
        return {
          institutionCode: 'BSU667',
          generatedAt: new Date().toISOString(),
          records: data.map(r => ({
            bcanCode: r.bcanCode,
            englishName: r.englishName,
            chineseName: r.chineseName,
            idType: r.idType,
            idNumber: r.idNumber,
            generatedAt: r.bcanGeneratedAt,
          })),
          totalCount: data.length,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
