import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { generateApplicationPDF, type ApplicationPDFData } from "./pdf-generator";
import { sendVerificationCode as sendEmail, generateVerificationCode } from "./email";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // 发送邮箱验证码
    sendVerificationCode: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期
        
        // 保存验证码到数据库
        await db.saveVerificationCode(input.email, code, expiresAt);
        
        // 发送邮件
        const sent = await sendEmail(input.email, code);
        if (!sent) {
          throw new Error("邮件发送失败，请稍后重试");
        }
        
        console.log(`[Verification Code] Sent to ${input.email}`);
        
        return { success: true, message: "验证码已发送至您的邮箱" };
      }),
    
    // 验证邮箱验证码
    verifyCode: publicProcedure
      .input(z.object({ 
        email: z.string().email(),
        code: z.string().length(6)
      }))
      .mutation(async ({ input }) => {
        const verified = await db.verifyEmailCode(input.email, input.code);
        if (!verified) {
          throw new Error("验证码无效或已过期");
        }
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
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.id);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        // 提交申请
        await db.submitApplication(input.id);
        
        // 生成PDF（暂时跳过，因为PDF生成需要中文字体支持）
        // const { generateApplicationPDF } = await import('./pdf-generator');
        // const completeData = await db.getCompleteApplicationData(input.id);
        // const pdfBuffer = await generateApplicationPDF(completeData);
        
        // 获取申请数据用于邮件发送
        const completeData = await db.getCompleteApplicationData(input.id);
        if (!completeData || !completeData.detailedInfo) {
          throw new Error("申请数据不存在");
        }
        
        // 发送客户确认邮件
        const { sendCustomerConfirmationEmail, sendInternalNotificationEmail } = await import('./email');
        const customerEmail = completeData.detailedInfo?.email;
        const customerName = completeData.basicInfo?.chineseName || completeData.basicInfo?.englishName || '客户';
        
        // 暂时使用空的PDF Buffer，后续实现PDF生成后替换
        const pdfBuffer = Buffer.from('PDF generation coming soon');
        
        // 发送邮件（暂时禁用，等待PDF生成功能完善）
        // if (customerEmail && application.applicationNumber) {
        //   try {
        //     await sendCustomerConfirmationEmail(
        //       customerEmail,
        //       application.applicationNumber,
        //       customerName,
        //       pdfBuffer
        //     );
        //     console.log(`Customer confirmation email sent to ${customerEmail}`);
        //   } catch (error) {
        //     console.error('Failed to send customer confirmation email:', error);
        //   }
        //   
        //   try {
        //     await sendInternalNotificationEmail(
        //       application.applicationNumber,
        //       customerName,
        //       customerEmail,
        //       pdfBuffer
        //     );
        //     console.log(`Internal notification email sent for application ${application.applicationNumber}`);
        //   } catch (error) {
        //     console.error('Failed to send internal notification email:', error);
        //   }
        // }
        
        console.log(`Application ${application.applicationNumber} submitted successfully. Email notification will be enabled after PDF generation is implemented.`);
        
        return { success: true };
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
          faxNo: completeData.detailedInfo?.faxNo || undefined,
          residentialAddress: completeData.detailedInfo?.residentialAddress || '',
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
          taxCountry: completeData.tax?.taxResidency || '',
          taxIdNumber: completeData.tax?.taxIdNumber || '',
          uploadedDocuments: completeData.documents || [],
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
  
  // Case 4: 个人详细信息
  personalDetailed: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        idType: z.string(),
        idNumber: z.string(),
        idIssuingPlace: z.string(),
        idExpiryDate: z.string().optional(),
        idIsPermanent: z.boolean(),
        maritalStatus: z.string(),
        educationLevel: z.string(),
        email: z.string().email(),
        phoneCountryCode: z.string(),
        phoneNumber: z.string(),
        faxNo: z.string().optional(), // 传真号码（可选）
        residentialAddress: z.string(),
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
        employmentStatus: z.enum(["employed", "self_employed", "student", "unemployed"]),
        companyName: z.string().optional(),
        position: z.string().optional(),
        yearsOfService: z.number().optional(),
        industry: z.string().optional(),
        companyAddress: z.string().optional(),
        officePhone: z.string().optional(),
        officeFaxNo: z.string().optional(), // 办公传真（可选）
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
        riskTolerance: z.string(),
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
        accountType: z.enum(["saving", "current", "others"]).optional(), // 账户类型（可选）
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
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        // 将base64转换为Buffer
        const buffer = Buffer.from(fileData, 'base64');
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
  }),
  
  // Case 11: 人脸识别
  faceVerification: router({
    save: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        verified: z.boolean(),
        verificationData: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, verificationData, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        const saveData = {
          ...data,
          verificationData: verificationData ? JSON.stringify(verificationData) : null,
        };
        
        await db.saveFaceVerification(applicationId, saveData);
        await db.updateApplicationStep(applicationId, 11);
        
        return { success: true };
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
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...data } = input;
        const application = await db.getApplicationById(applicationId);
        if (!application || application.userId !== ctx.user.id) {
          throw new Error("申请不存在或无权访问");
        }
        
        const saveData = {
          ...data,
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
        return await db.getRegulatoryDeclarations(input.applicationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
