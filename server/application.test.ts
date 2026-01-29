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

describe("Application Management", () => {
  it("should create a new application", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.application.create();

    expect(result).toHaveProperty("applicationId");
    expect(typeof result.applicationId).toBe("number");
    expect(result.applicationId).toBeGreaterThan(0);
  });

  it("should save and retrieve account selection data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create application
    const { applicationId } = await caller.application.create();

    // Save account selection
    const saveResult = await caller.accountSelection.save({
      applicationId,
      customerType: "individual",
      accountType: "cash",
    });

    expect(saveResult.success).toBe(true);
    expect(saveResult.data).toBeDefined();

    // Retrieve saved data
    const retrievedData = await caller.accountSelection.get({ applicationId });

    expect(retrievedData).toBeDefined();
    expect(retrievedData?.customerType).toBe("individual");
    expect(retrievedData?.accountType).toBe("cash");
  });

  it("should save and retrieve personal basic info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { applicationId } = await caller.application.create();

    const personalData = {
      applicationId,
      chineseName: "张三",
      englishName: "Zhang San",
      gender: "male" as const,
      dateOfBirth: "1990-01-01",
      placeOfBirth: "Beijing",
      nationality: "China",
    };

    const saveResult = await caller.personalBasic.save(personalData);

    expect(saveResult.success).toBe(true);
    expect(saveResult.data).toBeDefined();

    const retrievedData = await caller.personalBasic.get({ applicationId });

    expect(retrievedData).toBeDefined();
    expect(retrievedData?.chineseName).toBe("张三");
    expect(retrievedData?.englishName).toBe("Zhang San");
    expect(retrievedData?.gender).toBe("male");
  });

  it("should generate application number", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { applicationId } = await caller.application.create();

    const result = await caller.application.generateNumber({ id: applicationId });

    expect(result).toHaveProperty("applicationNumber");
    expect(typeof result.applicationNumber).toBe("string");
    // 新格式: CMF-ACAPP-YYMMDD-XXX
    expect(result.applicationNumber).toMatch(/^CMF-ACAPP-\d{6}-\d{3}$/);
  });

  it("should submit application", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { applicationId } = await caller.application.create();

    // Generate application number first
    await caller.application.generateNumber({ id: applicationId });

    // Add required data for submission
    await caller.personalBasic.save({
      applicationId,
      chineseName: "張三",
      englishName: "Zhang San",
      gender: "male" as const,
      dateOfBirth: "1990-01-01",
      placeOfBirth: "Hong Kong",
      nationality: "China",
    });

    await caller.personalDetailed.save({
      applicationId,
      idType: "hkid",
      idNumber: "A123456(7)",
      idIssuingPlace: "Hong Kong",
      idExpiryDate: "2030-12-31",
      idIsPermanent: true,
      maritalStatus: "single",
      educationLevel: "bachelor",
      residentialAddress: "123 Test Street",
      mailingAddress: "123 Test Street",
      phoneCountryCode: "+852",
      phoneNumber: "12345678",
      email: "test@example.com",
      emailVerified: true,
    });

    // Submit application
    const result = await caller.application.submit({ id: applicationId });

    expect(result.success).toBe(true);

    // Verify application status
    const application = await caller.application.getById({ id: applicationId });
    expect(application.status).toBe("submitted");
  });
});

describe("Data Persistence", () => {
  it("should persist data across multiple saves", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { applicationId } = await caller.application.create();

    // First save
    await caller.personalBasic.save({
      applicationId,
      chineseName: "李四",
      englishName: "Li Si",
      gender: "female" as const,
      dateOfBirth: "1995-05-15",
      placeOfBirth: "Shanghai",
      nationality: "China",
    });

    // Second save (update)
    await caller.personalBasic.save({
      applicationId,
      chineseName: "李四四",
      englishName: "Li Sisi",
      gender: "female" as const,
      dateOfBirth: "1995-05-15",
      placeOfBirth: "Shanghai",
      nationality: "China",
    });

    // Retrieve and verify latest data
    const retrievedData = await caller.personalBasic.get({ applicationId });

    expect(retrievedData?.chineseName).toBe("李四四");
    expect(retrievedData?.englishName).toBe("Li Sisi");
  });

  it("should handle bank account multiple entries", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { applicationId } = await caller.application.create();

    // Add first bank account
    await caller.bankAccount.add({
      applicationId,
      bankName: "HSBC",
      accountNumber: "123456789",
      accountCurrency: "HKD",
      accountHolderName: "Test User",
    });

    // Add second bank account
    await caller.bankAccount.add({
      applicationId,
      bankName: "Standard Chartered",
      accountNumber: "987654321",
      accountCurrency: "USD",
      accountHolderName: "Test User",
    });

    // Retrieve all bank accounts
    const accounts = await caller.bankAccount.list({ applicationId });

    expect(accounts).toHaveLength(2);
    expect(accounts[0]?.bankName).toBe("HSBC");
    expect(accounts[1]?.bankName).toBe("Standard Chartered");
  });
});
