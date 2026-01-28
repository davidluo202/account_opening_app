import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("CMF003 New Fields", () => {
  it("should save personal detailed info with faxNo", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const app = await caller.application.create();

    // 保存个人详细信息（包含传真号码）
    const result = await caller.personalDetailed.save({
      applicationId: app.applicationId,
      idType: "passport",
      idNumber: "P123456",
      idIssuingPlace: "Hong Kong",
      idIsPermanent: false,
      idExpiryDate: "2027-12-31",
      maritalStatus: "single",
      educationLevel: "bachelor",
      email: "test@example.com",
      phoneCountryCode: "+852",
      phoneNumber: "12345678",
      faxNo: "+852-87654321", // 新增字段
      residentialAddress: "123 Test Street",
    });

    expect(result.success).toBe(true);
    expect(result.data?.faxNo).toBe("+852-87654321");
  });

  it("should save occupation info with officeFaxNo", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const app = await caller.application.create();

    // 保存职业信息（包含办公传真）
    const result = await caller.occupation.save({
      applicationId: app.applicationId,
      employmentStatus: "employed",
      companyName: "Test Company",
      position: "Manager",
      yearsOfService: 5,
      industry: "金融服務 / Financial Services",
      companyAddress: "456 Business Road",
      officePhone: "+852-23456789",
      officeFaxNo: "+852-98765432", // 新增字段
    });

    expect(result.success).toBe(true);
    expect(result.data?.officeFaxNo).toBe("+852-98765432");
  });

  it("should save employment details with liquidAsset", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const app = await caller.application.create();

    // 保存就业详情（包含流动资产）
    const result = await caller.employment.save({
      applicationId: app.applicationId,
      incomeSource: "salary",
      annualIncome: "500000-1000000",
      liquidAsset: "1000000-3000000", // 新增字段（必填）
      netWorth: "3000000-5000000",
    });

    expect(result.success).toBe(true);
    expect(result.data?.liquidAsset).toBe("1000000-3000000");
  });

  it("should save bank account with accountType", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const app = await caller.application.create();

    // 添加银行账户（包含账户类型）
    const result = await caller.bankAccount.add({
      applicationId: app.applicationId,
      bankName: "HSBC",
      accountType: "saving", // 新增字段（默认值）
      accountCurrency: "HKD",
      accountNumber: "123-456-789",
      accountHolderName: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeGreaterThan(0);

    // 验证保存的数据
    const accounts = await caller.bankAccount.list({ applicationId: app.applicationId });
    expect(accounts.length).toBe(1);
    expect(accounts[0]?.accountType).toBe("saving");
  });

  it("should handle optional fields correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建申请
    const app = await caller.application.create();

    // 保存个人详细信息（不提供传真号码）
    const result1 = await caller.personalDetailed.save({
      applicationId: app.applicationId,
      idType: "passport",
      idNumber: "P123456",
      idIssuingPlace: "Hong Kong",
      idIsPermanent: true,
      maritalStatus: "single",
      educationLevel: "bachelor",
      email: "test@example.com",
      phoneCountryCode: "+852",
      phoneNumber: "12345678",
      // faxNo 未提供（可选字段）
      residentialAddress: "123 Test Street",
    });

    expect(result1.success).toBe(true);
    // 数据库返回的可选字段为null而不undefined
    expect(result1.data?.faxNo).toBeNull();

    // 保存职业信息（不提供办公传真）
    const result2 = await caller.occupation.save({
      applicationId: app.applicationId,
      employmentStatus: "student",
      // officeFaxNo 未提供（可选字段）
    });

    expect(result2.success).toBe(true);
    // 数据库返回的可选字段为null而不undefined
    expect(result2.data?.officeFaxNo).toBeNull();
  });
});
