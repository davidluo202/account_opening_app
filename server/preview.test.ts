import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("预览页面功能测试", () => {
  it("应该能够获取完整的申请数据", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const { applicationId } = await caller.application.create();

    // 保存账户选择
    await caller.accountSelection.save({
      applicationId,
      customerType: "individual",
      accountType: "cash",
    });

    // 保存个人基本信息
    await caller.personalBasic.save({
      applicationId,
      chineseName: "张三",
      englishName: "Zhang San",
      gender: "male",
      dateOfBirth: "1990-01-01",
      placeOfBirth: "香港",
      nationality: "中国",
    });

    // 获取完整数据
    const completeData = await caller.application.getComplete({ id: applicationId });

    expect(completeData).toBeDefined();
    expect(completeData.application).toBeDefined();
    expect(completeData.application?.id).toBe(applicationId);
    expect(completeData.accountSelection).toBeDefined();
    expect(completeData.accountSelection?.customerType).toBe("individual");
    expect(completeData.basicInfo).toBeDefined();
    expect(completeData.basicInfo?.chineseName).toBe("张三");
    expect(completeData.basicInfo?.englishName).toBe("Zhang San");
  });

  it("应该能够生成申请编号", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const { applicationId } = await caller.application.create();

    // 生成申请编号
    const { applicationNumber } = await caller.application.generateNumber({ id: applicationId });

    expect(applicationNumber).toBeDefined();
    // 新格式: CMF-ACAPP-YYMMDD-XXX
    expect(applicationNumber).toMatch(/^CMF-ACAPP-\d{6}-\d{3}$/);

    // 验证申请编号已保存
    const application = await caller.application.getById({ id: applicationId });
    expect(application?.applicationNumber).toBe(applicationNumber);
  });

  it("应该能够提交申请", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const { applicationId } = await caller.application.create();

    // 添加必要的个人详细信息（邮箱是必须的）
    await caller.personalDetailed.save({
      applicationId,
      idType: '香港身份证',
      idNumber: 'A123456(7)',
      idIssuingPlace: '香港',
      idIsPermanent: true,
      maritalStatus: '未婚',
      educationLevel: '大学',
      email: 'test@example.com',
      phoneCountryCode: '+852',
      phoneNumber: '12345678',
      residentialAddress: '香港中環干诺道中璱1号',
    });

    // 生成申请编号
    await caller.application.generateNumber({ id: applicationId });

    // 提交申请
    const result = await caller.application.submit({ id: applicationId });

    expect(result.success).toBe(true);

    // 验证申请状态已更新
    const application = await caller.application.getById({ id: applicationId });
    expect(application?.status).toBe("submitted");
    expect(application?.submittedAt).toBeDefined();
  });

  it("应该验证所有数据类型的字段都能正确获取", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const { applicationId } = await caller.application.create();

    // 保存所有类型的数据
    await caller.accountSelection.save({
      applicationId,
      customerType: "individual",
      accountType: "cash",
    });

    await caller.personalBasic.save({
      applicationId,
      chineseName: "李四",
      englishName: "Li Si",
      gender: "female",
      dateOfBirth: "1995-05-15",
      placeOfBirth: "北京",
      nationality: "中国",
    });

    await caller.personalDetailed.save({
      applicationId,
      idType: "passport",
      idNumber: "E12345678",
      idIssuingPlace: "北京",
      idIsPermanent: false,
      idExpiryDate: "2030-12-31",
      maritalStatus: "single",
      educationLevel: "bachelor",
      email: "lisi@example.com",
      phoneCountryCode: "+86",
      phoneNumber: "13800138000",
      faxNo: "010-12345678",
      residentialAddress: "北京市朝阳区某某路123号",
    });

    await caller.occupation.save({
      applicationId,
      employmentStatus: "employed",
      companyName: "某某公司",
      position: "工程师",
      yearsOfService: 5,
      industry: "IT",
      companyAddress: "北京市海淀区某某大厦",
      officePhone: "010-87654321",
      officeFaxNo: "010-87654322",
    });

    await caller.employment.save({
      applicationId,
      incomeSource: "工资",
      annualIncome: "HKD 500,000 - 1,000,000",
      liquidAsset: "HKD 100,000 - 500,000",
      netWorth: "HKD 1,000,000 - 5,000,000",
    });

    await caller.financial.save({
      applicationId,
      investmentObjectives: ["资本增值"],
      investmentExperience: { stocks: "5年以上" },
      riskTolerance: "中等",
    });

    await caller.bankAccount.add({
      applicationId,
      bankName: "中国银行",
      accountType: "saving",
      accountCurrency: "HKD",
      accountNumber: "1234567890",
      accountHolderName: "Li Si",
    });

    await caller.tax.save({
      applicationId,
      taxResidency: "中国",
      taxIdNumber: "110101199505151234",
    });

    await caller.regulatory.save({
      applicationId,
      isPEP: false,
      isUSPerson: false,
      agreementRead: true,
      agreementAccepted: true,
      signatureName: "Li Si",
      electronicSignatureConsent: true,
      amlComplianceConsent: true,
    });

    // 获取完整数据
    const completeData = await caller.application.getComplete({ id: applicationId });

    // 验证所有数据都已正确保存和获取
    expect(completeData.accountSelection?.customerType).toBe("individual");
    expect(completeData.basicInfo?.chineseName).toBe("李四");
    expect(completeData.detailedInfo?.faxNo).toBe("010-12345678");
    expect(completeData.occupation?.officeFaxNo).toBe("010-87654322");
    expect(completeData.employment?.liquidAsset).toBe("HKD 100,000 - 500,000");
    expect(completeData.financial?.investmentObjectives).toBeDefined();
    expect(completeData.bankAccounts).toHaveLength(1);
    expect(completeData.bankAccounts?.[0]?.accountType).toBe("saving");
    expect(completeData.tax?.taxIdNumber).toBe("110101199505151234");
    expect(completeData.regulatory?.isPEP).toBe(false);
    expect(completeData.regulatory?.signatureName).toBe("Li Si");
  });
});
