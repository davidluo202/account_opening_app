import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

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
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.createVerificationCode(input.email, code, 10);
        
        // TODO: 集成邮件发送服务
        console.log(`[Verification Code] ${input.email}: ${code}`);
        
        return { success: true, message: "验证码已发送" };
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
        const applicationNumber = await db.generateApplicationNumber(input.id);
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
        await db.submitApplication(input.id);
        return { success: true };
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
