var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to2, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to2;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/const.ts
var COOKIE_NAME, ONE_YEAR_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG;
var init_const = __esm({
  "shared/const.ts"() {
    "use strict";
    COOKIE_NAME = "app_session_id";
    ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
    UNAUTHED_ERR_MSG = "Please login (10001)";
    NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accountSelections: () => accountSelections,
  applicationNumberSequences: () => applicationNumberSequences,
  applications: () => applications,
  approvalRecords: () => approvalRecords,
  approvers: () => approvers,
  bankAccounts: () => bankAccounts,
  corporateBasicInfo: () => corporateBasicInfo,
  corporateFinancialInfo: () => corporateFinancialInfo,
  corporateRelatedParties: () => corporateRelatedParties,
  customerDeclarations: () => customerDeclarations,
  emailVerificationCodes: () => emailVerificationCodes,
  employmentDetails: () => employmentDetails,
  faceVerification: () => faceVerification,
  financialAndInvestment: () => financialAndInvestment,
  occupationInfo: () => occupationInfo,
  personalBasicInfo: () => personalBasicInfo,
  personalDetailedInfo: () => personalDetailedInfo,
  regulatoryDeclarations: () => regulatoryDeclarations,
  riskQuestionnaires: () => riskQuestionnaires,
  taxInfo: () => taxInfo,
  uploadedDocuments: () => uploadedDocuments,
  users: () => users
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
var users, applicationNumberSequences, emailVerificationCodes, applications, accountSelections, corporateBasicInfo, personalBasicInfo, personalDetailedInfo, occupationInfo, employmentDetails, financialAndInvestment, bankAccounts, taxInfo, uploadedDocuments, faceVerification, regulatoryDeclarations, approvers, approvalRecords, riskQuestionnaires, customerDeclarations, corporateFinancialInfo, corporateRelatedParties;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      emailVerified: boolean("emailVerified").default(false).notNull(),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      password: varchar("password", { length: 255 }),
      // bcrypt hash
      passwordResetToken: varchar("passwordResetToken", { length: 255 }),
      passwordResetExpires: timestamp("passwordResetExpires"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    applicationNumberSequences = mysqlTable("application_number_sequences", {
      id: int("id").autoincrement().primaryKey(),
      date: varchar("date", { length: 6 }).notNull().unique(),
      // YYMMDD
      lastSequence: int("lastSequence").default(0).notNull(),
      // 当日最后一个序列号
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    emailVerificationCodes = mysqlTable("email_verification_codes", {
      id: int("id").autoincrement().primaryKey(),
      email: varchar("email", { length: 320 }).notNull(),
      code: varchar("code", { length: 6 }).notNull(),
      expiresAt: timestamp("expiresAt").notNull(),
      verified: boolean("verified").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    applications = mysqlTable("applications", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      applicationNumber: varchar("applicationNumber", { length: 50 }).unique(),
      status: mysqlEnum("status", ["draft", "submitted", "under_review", "approved", "rejected", "returned"]).default("draft").notNull(),
      currentStep: int("currentStep").default(1).notNull(),
      completedSteps: text("completedSteps"),
      // JSON array of completed step numbers
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      submittedAt: timestamp("submittedAt"),
      // 电子签署相关字段
      signatureName: varchar("signatureName", { length: 200 }),
      // 签名人姓名
      signatureTimestamp: timestamp("signatureTimestamp"),
      // 签署时间戳
      signatureMethod: mysqlEnum("signatureMethod", ["typed", "iamsmart"]),
      // 签署方式：输入姓名或iAM Smart
      // 审批相关字段
      isProfessionalInvestor: boolean("isProfessionalInvestor").default(false),
      // 是否为专业投资者（PI）
      approvedRiskProfile: mysqlEnum("approvedRiskProfile", ["Lowest", "Low", "Low to Medium", "Medium", "Medium to High", "High"]),
      // 审批人员评估的风险等级（新6级评分系统）
      // 第一级审批字段
      firstApprovalStatus: mysqlEnum("firstApprovalStatus", ["pending", "approved", "rejected"]).default("pending"),
      // 第一级审批状态
      firstApprovalBy: varchar("firstApprovalBy", { length: 200 }),
      // 第一级审批人员ID
      firstApprovalByName: varchar("firstApprovalByName", { length: 200 }),
      // 第一级审批人员姓名
      firstApprovalByCeNo: varchar("firstApprovalByCeNo", { length: 20 }),
      // 第一级审批人员CE号码
      firstApprovalAt: timestamp("firstApprovalAt"),
      // 第一级审批时间
      firstApprovalComments: text("firstApprovalComments"),
      // 第一级审批意见
      firstApprovalIsProfessionalInvestor: boolean("firstApprovalIsProfessionalInvestor"),
      // 初审人员认定的PI状态
      firstApprovalRiskProfile: mysqlEnum("firstApprovalRiskProfile", ["Lowest", "Low", "Low to Medium", "Medium", "Medium to High", "High"]),
      // 初审人员评估的风险等级（新6级评分系统）
      // 第二级审批字段（合规部终审）
      secondApprovalStatus: mysqlEnum("secondApprovalStatus", ["pending", "approved", "rejected"]).default("pending"),
      // 第二级审批状态
      secondApprovalBy: varchar("secondApprovalBy", { length: 200 }),
      // 第二级审批人员ID
      secondApprovalByName: varchar("secondApprovalByName", { length: 200 }),
      // 第二级审批人员姓名
      secondApprovalByCeNo: varchar("secondApprovalByCeNo", { length: 20 }),
      // 第二级审批人员CE号码（如果有）
      secondApprovalAt: timestamp("secondApprovalAt"),
      // 第二级审批时间
      secondApprovalComments: text("secondApprovalComments"),
      // 第二级审批意见
      // PDF版本管理字段
      customerPdfUrl: varchar("customerPdfUrl", { length: 500 }),
      // 客户版PDF URL（不包含审批信息）
      firstReviewPdfUrl: varchar("firstReviewPdfUrl", { length: 500 }),
      // 初审版PDF URL（包含初审信息）
      finalReviewPdfUrl: varchar("finalReviewPdfUrl", { length: 500 })
      // 终审版PDF URL（包含初审+终审信息）
    });
    accountSelections = mysqlTable("account_selections", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      customerType: mysqlEnum("customerType", ["individual", "joint", "corporate"]).notNull(),
      // 个人/联名/机构
      accountType: mysqlEnum("accountType", ["cash", "margin", "derivatives"]).notNull(),
      // 现金/保证金/衍生品
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    corporateBasicInfo = mysqlTable("corporate_basic_info", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      companyEnglishName: varchar("companyEnglishName", { length: 255 }).notNull(),
      companyChineseName: varchar("companyChineseName", { length: 255 }),
      natureOfEntity: varchar("natureOfEntity", { length: 100 }).notNull(),
      natureOfBusiness: varchar("natureOfBusiness", { length: 100 }).notNull(),
      countryOfIncorporation: varchar("countryOfIncorporation", { length: 100 }).notNull(),
      dateOfIncorporation: varchar("dateOfIncorporation", { length: 10 }).notNull(),
      // YYYY-MM-DD
      certificateOfIncorporationNo: varchar("certificateOfIncorporationNo", { length: 100 }).notNull(),
      businessRegistrationNo: varchar("businessRegistrationNo", { length: 100 }),
      registeredAddress: text("registeredAddress").notNull(),
      businessAddress: text("businessAddress").notNull(),
      officeNo: varchar("officeNo", { length: 50 }).notNull(),
      facsimileNo: varchar("facsimileNo", { length: 50 }),
      contactName: varchar("contactName", { length: 100 }).notNull(),
      contactTitle: varchar("contactTitle", { length: 100 }).notNull(),
      contactPhone: varchar("contactPhone", { length: 50 }).notNull(),
      contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
      contactEmailVerified: boolean("contactEmailVerified").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    personalBasicInfo = mysqlTable("personal_basic_info", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      chineseName: varchar("chineseName", { length: 100 }).notNull(),
      englishName: varchar("englishName", { length: 200 }).notNull(),
      gender: mysqlEnum("gender", ["male", "female", "other"]).notNull(),
      dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(),
      // YYYY-MM-DD
      placeOfBirth: varchar("placeOfBirth", { length: 200 }).notNull(),
      nationality: varchar("nationality", { length: 100 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    personalDetailedInfo = mysqlTable("personal_detailed_info", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      idType: varchar("idType", { length: 50 }).notNull(),
      // 身份证件类型
      idNumber: varchar("idNumber", { length: 100 }).notNull(),
      idIssuingPlace: varchar("idIssuingPlace", { length: 200 }).notNull(),
      idExpiryDate: varchar("idExpiryDate", { length: 10 }),
      // YYYY-MM-DD or null if permanent
      idIsPermanent: boolean("idIsPermanent").default(false).notNull(),
      maritalStatus: varchar("maritalStatus", { length: 50 }).notNull(),
      educationLevel: varchar("educationLevel", { length: 50 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      // 住宅电话（可选）
      phoneCountryCode: varchar("phoneCountryCode", { length: 10 }),
      phoneNumber: varchar("phoneNumber", { length: 50 }),
      // 手机号码（必填）
      mobileCountryCode: varchar("mobileCountryCode", { length: 10 }).notNull(),
      mobileNumber: varchar("mobileNumber", { length: 50 }).notNull(),
      faxNo: varchar("faxNo", { length: 50 }),
      // 传真号码
      emailVerified: boolean("emailVerified").default(false).notNull(),
      // 邮箱验证状态
      residentialAddress: text("residentialAddress").notNull(),
      // 账单通讯地址
      billingAddressType: mysqlEnum("billingAddressType", ["residential", "office", "other"]).notNull(),
      billingAddressOther: text("billingAddressOther"),
      // 当选择"other"时填写
      // 账单首选语言
      preferredLanguage: mysqlEnum("preferredLanguage", ["chinese", "english"]).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    occupationInfo = mysqlTable("occupation_info", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      employmentStatus: mysqlEnum("employmentStatus", ["employed", "self_employed", "student", "unemployed"]).notNull(),
      // 以下字段仅当 employed 或 self_employed 时填写
      companyName: varchar("companyName", { length: 200 }),
      position: varchar("position", { length: 100 }),
      yearsOfService: int("yearsOfService"),
      industry: varchar("industry", { length: 100 }),
      companyAddress: text("companyAddress"),
      officePhone: varchar("officePhone", { length: 50 }),
      officeFaxNo: varchar("officeFaxNo", { length: 50 }),
      // 办公传真
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    employmentDetails = mysqlTable("employment_details", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      incomeSource: varchar("incomeSource", { length: 100 }).notNull(),
      annualIncome: varchar("annualIncome", { length: 50 }).notNull(),
      // 年收入范围
      liquidAsset: varchar("liquidAsset", { length: 50 }),
      // 流动资产 HK$
      netWorth: varchar("netWorth", { length: 50 }).notNull(),
      // 净资产范围
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    financialAndInvestment = mysqlTable("financial_and_investment", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      investmentObjectives: text("investmentObjectives").notNull(),
      // JSON array
      investmentExperience: text("investmentExperience").notNull(),
      // JSON object with experience levels
      riskTolerance: mysqlEnum("riskTolerance", ["R1", "R2", "R3", "R4", "R5"]).notNull(),
      // 客户选择的风险等级：R1(低风险) R2(中低风险) R3(中风险) R4(中高风险) R5(高风险)
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    bankAccounts = mysqlTable("bank_accounts", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull(),
      bankName: varchar("bankName", { length: 200 }).notNull(),
      bankLocation: mysqlEnum("bankLocation", ["HK", "CN", "OTHER"]).default("HK").notNull(),
      // 银行所在地
      accountType: mysqlEnum("accountType", ["saving", "current", "checking", "others"]),
      // 账户类型
      accountCurrency: varchar("accountCurrency", { length: 10 }).notNull(),
      accountNumber: varchar("accountNumber", { length: 100 }).notNull(),
      accountHolderName: varchar("accountHolderName", { length: 200 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    taxInfo = mysqlTable("tax_info", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      taxResidency: varchar("taxResidency", { length: 100 }).notNull(),
      taxIdNumber: varchar("taxIdNumber", { length: 100 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    uploadedDocuments = mysqlTable("uploaded_documents", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull(),
      documentType: varchar("documentType", { length: 50 }).notNull(),
      // id_front, id_back, bank_statement, address_proof
      fileKey: varchar("fileKey", { length: 500 }).notNull(),
      fileUrl: varchar("fileUrl", { length: 1e3 }).notNull(),
      fileName: varchar("fileName", { length: 255 }).notNull(),
      mimeType: varchar("mimeType", { length: 100 }),
      fileSize: int("fileSize"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    faceVerification = mysqlTable("face_verification", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      verified: boolean("verified").default(false).notNull(),
      verificationData: text("verificationData"),
      // JSON with verification details
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    regulatoryDeclarations = mysqlTable("regulatory_declarations", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      isPEP: boolean("isPEP").notNull(),
      // 是否为政治公众人物
      isUSPerson: boolean("isUSPerson").notNull(),
      // 是否为美国人
      agreementRead: boolean("agreementRead").default(false).notNull(),
      agreementAccepted: boolean("agreementAccepted").default(false).notNull(),
      signatureName: varchar("signatureName", { length: 200 }).notNull(),
      electronicSignatureConsent: boolean("electronicSignatureConsent").default(false).notNull(),
      amlComplianceConsent: boolean("amlComplianceConsent").default(false).notNull(),
      riskAssessmentConsent: boolean("riskAssessmentConsent").default(false).notNull(),
      signedAt: timestamp("signedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    approvers = mysqlTable("approvers", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      // 关联users表
      employeeName: varchar("employeeName", { length: 200 }).notNull(),
      // 员工姓名
      ceNumber: varchar("ceNumber", { length: 50 }).notNull(),
      // CE No.
      role: varchar("role", { length: 50 }).default("approver").notNull(),
      // 角色：approver/manager
      isActive: boolean("isActive").default(true).notNull(),
      // 是否激活
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    approvalRecords = mysqlTable("approval_records", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull(),
      // 关联applications表
      approverId: int("approverId").notNull(),
      // 关联approvers表
      action: mysqlEnum("action", ["approved", "rejected", "returned", "first_approved", "second_approved"]).notNull(),
      // 审批操作
      comments: text("comments"),
      // 审批意见
      rejectReason: text("rejectReason"),
      // 拒绝理由
      returnReason: text("returnReason"),
      // 退回补充材料理由
      createdAt: timestamp("createdAt").defaultNow().notNull()
      // 审批时间
    });
    riskQuestionnaires = mysqlTable("risk_questionnaires", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      // PART 1: 适用于全部客户 (Q1-Q6)
      q1_current_investments: text("q1_current_investments"),
      // 多选，JSON数组
      q2_investment_period: varchar("q2_investment_period", { length: 50 }),
      q3_price_volatility: varchar("q3_price_volatility", { length: 50 }),
      q4_investment_percentage: varchar("q4_investment_percentage", { length: 50 }),
      q5_investment_attitude: varchar("q5_investment_attitude", { length: 100 }),
      q6_derivatives_knowledge: text("q6_derivatives_knowledge"),
      // 多选，JSON数组
      // PART 2A: 适用个人/联名客户 (Q7-Q10)
      q7_age_group: varchar("q7_age_group", { length: 50 }),
      q8_education_level: varchar("q8_education_level", { length: 50 }),
      q9_investment_knowledge_sources: text("q9_investment_knowledge_sources"),
      // 多选，JSON数组
      q10_liquidity_needs: varchar("q10_liquidity_needs", { length: 100 }),
      // 评分结果
      totalScore: int("totalScore"),
      riskLevel: varchar("riskLevel", { length: 50 }),
      // 最低风险/低风险/低至中等风险/中等风险/中等至高风险/高风险
      riskDescription: text("riskDescription"),
      // 风险等级描述（投资取向）
      // 客户确认签署
      customerSignature: varchar("customerSignature", { length: 200 }),
      signatureDate: varchar("signatureDate", { length: 10 }),
      // YYYY-MM-DD
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    customerDeclarations = mysqlTable("customer_declarations", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      // (A) 最终受益拥有人
      declaration_a_is_beneficial_owner: boolean("declaration_a_is_beneficial_owner").notNull(),
      declaration_a_owner_name: varchar("declaration_a_owner_name", { length: 200 }),
      declaration_a_owner_id: varchar("declaration_a_owner_id", { length: 100 }),
      declaration_a_owner_country: varchar("declaration_a_owner_country", { length: 100 }),
      declaration_a_owner_address: text("declaration_a_owner_address"),
      // (B) 持牌法团或注册机构僱员或董事
      declaration_b_is_employee: boolean("declaration_b_is_employee").notNull(),
      declaration_b_institution_name: varchar("declaration_b_institution_name", { length: 300 }),
      // (C) Canton Mutual Financial Limited僱员
      declaration_c_is_cmf_employee: boolean("declaration_c_is_cmf_employee").notNull(),
      // (D) Canton Mutual Financial Limited僱员或董事之亲属
      declaration_d_is_relative: boolean("declaration_d_is_relative").notNull(),
      declaration_d_employee_name: varchar("declaration_d_employee_name", { length: 200 }),
      declaration_d_relationship: varchar("declaration_d_relationship", { length: 100 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    corporateFinancialInfo = mysqlTable("corporate_financial_info", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      authorizedShareCapital: text("authorizedShareCapital").notNull(),
      issuedShareCapital: text("issuedShareCapital").notNull(),
      initialSourceOfWealth: text("initialSourceOfWealth").notNull(),
      // JSON array
      netAssetValue: varchar("netAssetValue", { length: 100 }).notNull(),
      netAssetAuditDate: varchar("netAssetAuditDate", { length: 20 }),
      profitAfterTax: varchar("profitAfterTax", { length: 100 }).notNull(),
      profitAuditDate: varchar("profitAuditDate", { length: 20 }),
      assetItems: text("assetItems").notNull(),
      // JSON array
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    corporateRelatedParties = mysqlTable("corporate_related_parties", {
      id: int("id").autoincrement().primaryKey(),
      applicationId: int("applicationId").notNull().unique(),
      relatedParties: text("relatedParties").notNull(),
      // JSON array of party objects
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.APP_ID ?? "local-app",
      cookieSecret: process.env.JWT_SECRET ?? "fallback-secret-change-in-production",
      databaseUrl: process.env.DATABASE_URL ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? ""
    };
  }
});

// server/db.ts
import { eq, and, desc, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function syncMissingTables() {
  const db = await getDb();
  if (!db) return;
  try {
    const { sql } = await import("drizzle-orm");
    console.log("[Database] Running schema sync for new corporate tables...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS \`corporate_financial_info\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`applicationId\` int NOT NULL UNIQUE,
        \`authorizedShareCapital\` text NOT NULL,
        \`issuedShareCapital\` text NOT NULL,
        \`initialSourceOfWealth\` text NOT NULL,
        \`netAssetValue\` varchar(100) NOT NULL,
        \`netAssetAuditDate\` varchar(20) DEFAULT NULL,
        \`profitAfterTax\` varchar(100) NOT NULL,
        \`profitAuditDate\` varchar(20) DEFAULT NULL,
        \`assetItems\` text NOT NULL,
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX \`idx_applicationId\` (\`applicationId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS \`corporate_related_parties\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`applicationId\` int NOT NULL UNIQUE,
        \`relatedParties\` text NOT NULL,
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX \`idx_applicationId\` (\`applicationId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("[Database] Schema sync completed successfully.");
  } catch (error) {
    console.error("[Database] Schema sync failed:", error);
  }
}
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select().from(users).orderBy(desc(users.createdAt));
    return result;
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  try {
    await db.update(users).set({ role }).where(eq(users.id, userId));
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new Error("\u66F4\u65B0\u7528\u6237\u89D2\u8272\u5931\u8D25");
  }
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.emailVerified !== void 0) {
      values.emailVerified = user.emailVerified;
      updateSet.emailVerified = user.emailVerified;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function generateApplicationNumber() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const existing = await db.select().from(applicationNumberSequences).where(eq(applicationNumberSequences.date, dateStr)).limit(1);
  let sequence;
  if (existing.length > 0) {
    sequence = existing[0].lastSequence + 1;
    await db.update(applicationNumberSequences).set({ lastSequence: sequence }).where(eq(applicationNumberSequences.date, dateStr));
  } else {
    sequence = 1;
    await db.insert(applicationNumberSequences).values({
      date: dateStr,
      lastSequence: sequence
    });
  }
  const sequenceStr = sequence.toString().padStart(3, "0");
  return `CMF-ACAPP-${dateStr}-${sequenceStr}`;
}
async function verifyEmailCode(email, code) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(emailVerificationCodes).where(
    and(
      eq(emailVerificationCodes.email, email),
      eq(emailVerificationCodes.code, code),
      eq(emailVerificationCodes.verified, false)
    )
  ).orderBy(desc(emailVerificationCodes.createdAt)).limit(1);
  if (result.length === 0) return false;
  const record = result[0];
  if (/* @__PURE__ */ new Date() > record.expiresAt) return false;
  await db.update(emailVerificationCodes).set({ verified: true }).where(eq(emailVerificationCodes.id, record.id));
  return true;
}
async function createApplication(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(applications).values({
    userId,
    status: "draft",
    currentStep: 1,
    completedSteps: JSON.stringify([])
  });
  return result[0].insertId;
}
async function getApplicationById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getUserApplications(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
}
async function updateApplicationStep(applicationId, step) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const app = await getApplicationById(applicationId);
  if (!app) throw new Error("Application not found");
  const completedSteps = JSON.parse(app.completedSteps || "[]");
  if (!completedSteps.includes(step)) {
    completedSteps.push(step);
  }
  await db.update(applications).set({
    currentStep: step,
    completedSteps: JSON.stringify(completedSteps),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(applications.id, applicationId));
}
async function assignApplicationNumber(applicationId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const applicationNumber = await generateApplicationNumber();
  await db.update(applications).set({ applicationNumber }).where(eq(applications.id, applicationId));
  return applicationNumber;
}
async function submitApplication(applicationId, signatureInfo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(applications).set({
    status: "submitted",
    submittedAt: /* @__PURE__ */ new Date(),
    ...signatureInfo && {
      signatureName: signatureInfo.signatureName,
      signatureData: signatureInfo.signatureData,
      signatureTimestamp: signatureInfo.signatureTimestamp
    }
  }).where(eq(applications.id, applicationId));
}
async function saveAccountSelection(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(accountSelections).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getAccountSelection(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accountSelections).where(eq(accountSelections.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function savePersonalBasicInfo(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(personalBasicInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getPersonalBasicInfo(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(personalBasicInfo).where(eq(personalBasicInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveCorporateBasicInfo(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(corporateBasicInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getCorporateBasicInfo(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(corporateBasicInfo).where(eq(corporateBasicInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function savePersonalDetailedInfo(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(personalDetailedInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getPersonalDetailedInfo(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(personalDetailedInfo).where(eq(personalDetailedInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveOccupationInfo(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(occupationInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getOccupationInfo(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(occupationInfo).where(eq(occupationInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveEmploymentDetails(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(employmentDetails).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getEmploymentDetails(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employmentDetails).where(eq(employmentDetails.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveFinancialAndInvestment(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(financialAndInvestment).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getFinancialAndInvestment(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(financialAndInvestment).where(eq(financialAndInvestment.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveBankAccount(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bankAccounts).values({
    applicationId,
    ...data
  });
  return result[0].insertId;
}
async function getBankAccounts(applicationId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bankAccounts).where(eq(bankAccounts.applicationId, applicationId));
}
async function deleteBankAccount(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
}
async function saveTaxInfo(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(taxInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getTaxInfo(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(taxInfo).where(eq(taxInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveUploadedDocument(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(uploadedDocuments).values({
    applicationId,
    ...data
  });
  return result[0].insertId;
}
async function getUploadedDocuments(applicationId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(uploadedDocuments).where(eq(uploadedDocuments.applicationId, applicationId));
}
async function saveFaceVerification(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(faceVerification).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getFaceVerification(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(faceVerification).where(eq(faceVerification.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveRegulatoryDeclarations(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(regulatoryDeclarations).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getRegulatoryDeclarations(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(regulatoryDeclarations).where(eq(regulatoryDeclarations.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getCompleteApplicationData(applicationId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [
    application,
    accountSelection,
    basicInfo,
    corporateBasic,
    detailedInfo,
    occupation,
    employment,
    financial,
    corporateFinancial,
    bankAccountsList,
    tax,
    riskQuestionnaireData,
    documents,
    face,
    regulatory,
    relatedPartiesData
  ] = await Promise.all([
    getApplicationById(applicationId),
    getAccountSelection(applicationId),
    getPersonalBasicInfo(applicationId),
    getCorporateBasicInfo(applicationId),
    getPersonalDetailedInfo(applicationId),
    getOccupationInfo(applicationId),
    getEmploymentDetails(applicationId),
    getFinancialAndInvestment(applicationId),
    getCorporateFinancialInfo(applicationId),
    getBankAccounts(applicationId),
    getTaxInfo(applicationId),
    getRiskQuestionnaire(applicationId),
    getUploadedDocuments(applicationId),
    getFaceVerification(applicationId),
    getRegulatoryDeclarations(applicationId),
    getCorporateRelatedParties(applicationId)
  ]);
  return {
    application,
    accountSelection,
    basicInfo,
    corporateBasic,
    detailedInfo,
    occupation,
    employment,
    financial,
    corporateFinancial,
    bankAccounts: bankAccountsList,
    taxInfo: tax,
    riskQuestionnaire: riskQuestionnaireData,
    uploadedDocuments: documents,
    face,
    regulatory,
    relatedParties: relatedPartiesData
  };
}
async function saveVerificationCode(email, code, expiresAt) {
  const db = await getDb();
  if (!db) return null;
  try {
    const [result] = await db.insert(emailVerificationCodes).values({
      email,
      code,
      expiresAt,
      verified: false
    });
    return result.insertId;
  } catch (error) {
    console.error("Error saving verification code:", error);
    return null;
  }
}
async function getApproverByUserId(userId) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(approvers).where(eq(approvers.userId, userId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting approver by userId:", error);
    return null;
  }
}
async function getAllApprovers() {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select().from(approvers).leftJoin(users, eq(approvers.userId, users.id)).orderBy(desc(approvers.createdAt));
    return result.map((row) => ({
      ...row.approvers,
      user: row.users
    }));
  } catch (error) {
    console.error("Error getting approvers:", error);
    return [];
  }
}
async function addApprover(data) {
  const db = await getDb();
  if (!db) throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  try {
    const [result] = await db.insert(approvers).values({
      userId: data.userId,
      employeeName: data.employeeName,
      ceNumber: data.ceNumber,
      role: data.role || "approver",
      isActive: true
    });
    return { id: result.insertId, success: true };
  } catch (error) {
    console.error("Error adding approver:", error);
    throw new Error("\u6DFB\u52A0\u5BA1\u6279\u4EBA\u5458\u5931\u8D25");
  }
}
async function updateApprover(data) {
  const db = await getDb();
  if (!db) throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  try {
    const { id, ...updateData } = data;
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== void 0)
    );
    await db.update(approvers).set(filteredData).where(eq(approvers.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating approver:", error);
    throw new Error("\u66F4\u65B0\u5BA1\u6279\u4EBA\u5458\u5931\u8D25");
  }
}
async function deleteApprover(id) {
  const db = await getDb();
  if (!db) throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  try {
    await db.delete(approvers).where(eq(approvers.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting approver:", error);
    throw new Error("\u5220\u9664\u5BA1\u6279\u4EBA\u5458\u5931\u8D25");
  }
}
async function updateUserEmailVerified(userId, verified) {
  const db = await getDb();
  if (!db) throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  try {
    await db.update(users).set({ emailVerified: verified }).where(eq(users.id, userId));
    return { success: true };
  } catch (error) {
    console.error("Error updating user email verified status:", error);
    throw new Error("\u66F4\u65B0\u90AE\u7BB1\u9A8C\u8BC1\u72B6\u6001\u5931\u8D25");
  }
}
async function getSubmittedApplications() {
  const db = await getDb();
  if (!db) return [];
  const { or } = await import("drizzle-orm");
  const results = await db.select({
    id: applications.id,
    applicationNumber: applications.applicationNumber,
    status: applications.status,
    submittedAt: applications.submittedAt,
    customerName: personalBasicInfo.englishName,
    firstApprovalStatus: applications.firstApprovalStatus,
    secondApprovalStatus: applications.secondApprovalStatus
  }).from(applications).leftJoin(personalBasicInfo, eq(applications.id, personalBasicInfo.applicationId)).where(
    or(
      eq(applications.status, "submitted"),
      eq(applications.status, "under_review"),
      eq(applications.status, "approved")
    )
  ).orderBy(desc(applications.submittedAt));
  return results;
}
async function updateApplicationStatus(applicationId, status) {
  const db = await getDb();
  if (!db) return null;
  await db.update(applications).set({ status }).where(eq(applications.id, applicationId));
  return { success: true };
}
async function updateApplicationApprovalInfo(applicationId, info) {
  const db = await getDb();
  if (!db) return null;
  await db.update(applications).set({
    isProfessionalInvestor: info.isProfessionalInvestor,
    approvedRiskProfile: info.approvedRiskProfile
  }).where(eq(applications.id, applicationId));
  return { success: true };
}
async function createApprovalRecord(data) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(approvalRecords).values({
    applicationId: data.applicationId,
    approverId: data.approverId,
    action: data.action,
    comments: data.comments || null,
    rejectReason: data.rejectReason || null,
    returnReason: data.returnReason || null
  });
  return { success: true };
}
async function getApprovalHistory(applicationId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    id: approvalRecords.id,
    action: approvalRecords.action,
    comments: approvalRecords.comments,
    rejectReason: approvalRecords.rejectReason,
    returnReason: approvalRecords.returnReason,
    createdAt: approvalRecords.createdAt,
    approverName: approvers.employeeName,
    approverCeNumber: approvers.ceNumber,
    approverEmail: users.email
  }).from(approvalRecords).leftJoin(approvers, eq(approvalRecords.approverId, approvers.id)).leftJoin(users, eq(approvers.userId, users.id)).where(eq(approvalRecords.applicationId, applicationId)).orderBy(desc(approvalRecords.createdAt));
  return results;
}
async function savePasswordResetToken(userId, token, expiresAt) {
  const db = await getDb();
  if (!db) throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  try {
    await db.update(users).set({
      passwordResetToken: token,
      passwordResetExpires: expiresAt
    }).where(eq(users.id, userId));
  } catch (error) {
    console.error("Error saving password reset token:", error);
    throw new Error("\u4FDD\u5B58\u91CD\u7F6E\u4EE4\u724C\u5931\u8D25");
  }
}
async function getUserByResetToken(token) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(
      and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpires, /* @__PURE__ */ new Date())
      )
    ).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by reset token:", error);
    return null;
  }
}
async function updateUserPassword(userId, hashedPassword) {
  const db = await getDb();
  if (!db) throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  try {
    await db.update(users).set({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }).where(eq(users.id, userId));
  } catch (error) {
    console.error("Error updating user password:", error);
    throw new Error("\u66F4\u65B0\u5BC6\u7801\u5931\u8D25");
  }
}
async function updateFirstApproval(applicationId, info) {
  const db = await getDb();
  if (!db) return null;
  await db.update(applications).set({
    firstApprovalStatus: info.status,
    firstApprovalBy: info.approverEmail,
    firstApprovalByName: info.approverName,
    firstApprovalByCeNo: info.approverCeNo,
    firstApprovalAt: /* @__PURE__ */ new Date(),
    firstApprovalComments: info.comments || null,
    // 儲存初審人員的PI認定和風險評級（只儲存到初審專用字段，不覆蓋最終結果字段）
    firstApprovalIsProfessionalInvestor: info.isProfessionalInvestor,
    firstApprovalRiskProfile: info.riskProfile,
    // 初審通過後，狀態變為待終審
    status: info.status === "approved" ? "under_review" : "submitted",
    secondApprovalStatus: info.status === "approved" ? "pending" : null
  }).where(eq(applications.id, applicationId));
  return { success: true };
}
async function updateSecondApproval(applicationId, info) {
  const db = await getDb();
  if (!db) return null;
  await db.update(applications).set({
    secondApprovalStatus: info.status,
    secondApprovalBy: info.approverEmail,
    secondApprovalByName: info.approverName,
    secondApprovalByCeNo: info.approverCeNo || null,
    secondApprovalAt: /* @__PURE__ */ new Date(),
    secondApprovalComments: info.comments || null
  }).where(eq(applications.id, applicationId));
  return { success: true };
}
async function updateApplicationPdfUrl(applicationId, field, url) {
  const db = await getDb();
  if (!db) return null;
  await db.update(applications).set({ [field]: url }).where(eq(applications.id, applicationId));
  return { success: true };
}
async function saveRiskQuestionnaire(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { riskQuestionnaires: riskQuestionnaires2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const existing = await db.select().from(riskQuestionnaires2).where(eq(riskQuestionnaires2.applicationId, data.applicationId)).limit(1);
  if (existing.length > 0) {
    await db.update(riskQuestionnaires2).set({
      q1_current_investments: data.q1_current_investments,
      q2_investment_period: data.q2_investment_period,
      q3_price_volatility: data.q3_price_volatility,
      q4_investment_percentage: data.q4_investment_percentage,
      q5_investment_attitude: data.q5_investment_attitude,
      q6_derivatives_knowledge: data.q6_derivatives_knowledge,
      q7_age_group: data.q7_age_group,
      q8_education_level: data.q8_education_level,
      q9_investment_knowledge_sources: data.q9_investment_knowledge_sources,
      q10_liquidity_needs: data.q10_liquidity_needs,
      totalScore: data.totalScore,
      riskLevel: data.riskLevel,
      riskDescription: data.riskDescription,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(riskQuestionnaires2.applicationId, data.applicationId));
    return { success: true, id: existing[0].id };
  } else {
    const result = await db.insert(riskQuestionnaires2).values({
      applicationId: data.applicationId,
      q1_current_investments: data.q1_current_investments,
      q2_investment_period: data.q2_investment_period,
      q3_price_volatility: data.q3_price_volatility,
      q4_investment_percentage: data.q4_investment_percentage,
      q5_investment_attitude: data.q5_investment_attitude,
      q6_derivatives_knowledge: data.q6_derivatives_knowledge,
      q7_age_group: data.q7_age_group,
      q8_education_level: data.q8_education_level,
      q9_investment_knowledge_sources: data.q9_investment_knowledge_sources,
      q10_liquidity_needs: data.q10_liquidity_needs,
      totalScore: data.totalScore,
      riskLevel: data.riskLevel,
      riskDescription: data.riskDescription
    });
    return { success: true, id: Number(result.insertId) };
  }
}
async function getRiskQuestionnaire(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const { riskQuestionnaires: riskQuestionnaires2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.select().from(riskQuestionnaires2).where(eq(riskQuestionnaires2.applicationId, applicationId)).limit(1);
  return result[0] || null;
}
async function saveCorporateFinancialInfo(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert((init_schema(), __toCommonJS(schema_exports)).corporateFinancialInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}
async function getCorporateFinancialInfo(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const { corporateFinancialInfo: corporateFinancialInfo2 } = (init_schema(), __toCommonJS(schema_exports));
  const result = await db.select().from(corporateFinancialInfo2).where(eq(corporateFinancialInfo2.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function saveCorporateRelatedParties(applicationId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert((init_schema(), __toCommonJS(schema_exports)).corporateRelatedParties).values({
    applicationId,
    relatedParties: JSON.stringify(data.relatedParties)
  }).onDuplicateKeyUpdate({ set: { relatedParties: JSON.stringify(data.relatedParties) } });
}
async function getCorporateRelatedParties(applicationId) {
  const db = await getDb();
  if (!db) return null;
  const { corporateRelatedParties: corporateRelatedParties2 } = (init_schema(), __toCommonJS(schema_exports));
  const result = await db.select().from(corporateRelatedParties2).where(eq(corporateRelatedParties2.applicationId, applicationId)).limit(1);
  if (result.length === 0) return [];
  const data = result[0];
  return JSON.parse(data.relatedParties || "[]");
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// shared/_core/errors.ts
var HttpError, ForbiddenError;
var init_errors = __esm({
  "shared/_core/errors.ts"() {
    "use strict";
    HttpError = class extends Error {
      constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
      }
    };
    ForbiddenError = (msg) => new HttpError(403, msg);
  }
});

// server/_core/sdk.ts
var sdk_exports = {};
__export(sdk_exports, {
  sdk: () => sdk
});
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString, SDKServer, sdk;
var init_sdk = __esm({
  "server/_core/sdk.ts"() {
    "use strict";
    init_const();
    init_errors();
    init_db();
    init_env();
    isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
    SDKServer = class {
      parseCookies(cookieHeader) {
        if (!cookieHeader) {
          return /* @__PURE__ */ new Map();
        }
        const parsed = parseCookieHeader(cookieHeader);
        return new Map(Object.entries(parsed));
      }
      getSessionSecret() {
        const secret = ENV.cookieSecret || "fallback-secret-for-dev";
        return new TextEncoder().encode(secret);
      }
      async createSessionToken(openId, options = {}) {
        return this.signSession(
          {
            openId,
            appId: ENV.appId || "local-app",
            name: options.name || ""
          },
          options
        );
      }
      async signSession(payload, options = {}) {
        const issuedAt = Date.now();
        const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
        const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
        const secretKey = this.getSessionSecret();
        return new SignJWT({
          openId: payload.openId,
          appId: payload.appId,
          name: payload.name
        }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
      }
      async verifySession(cookieValue) {
        if (!cookieValue) {
          return null;
        }
        try {
          const secretKey = this.getSessionSecret();
          const { payload } = await jwtVerify(cookieValue, secretKey, {
            algorithms: ["HS256"]
          });
          const { openId, appId, name } = payload;
          if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
            console.warn("[Auth] Session payload missing required fields");
            return null;
          }
          return {
            openId,
            appId,
            name
          };
        } catch (error) {
          console.warn("[Auth] Session verification failed", String(error));
          return null;
        }
      }
      async authenticateRequest(req) {
        const cookies = this.parseCookies(req.headers.cookie);
        const sessionCookie = cookies.get(COOKIE_NAME);
        const session = await this.verifySession(sessionCookie);
        if (!session) {
          throw ForbiddenError("Invalid session cookie");
        }
        const sessionUserId = session.openId;
        const signedInAt = /* @__PURE__ */ new Date();
        const user = await getUserByOpenId(sessionUserId);
        if (!user) {
          throw ForbiddenError("User not found");
        }
        await upsertUser({
          openId: user.openId,
          lastSignedIn: signedInAt
        });
        return user;
      }
    };
    sdk = new SDKServer();
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storagePresignGet: () => storagePresignGet,
  storagePut: () => storagePut
});
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
function getStorageProxyConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey2 = ENV.forgeApiKey;
  if (!baseUrl || !apiKey2) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey: apiKey2 };
}
function getS3Config() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;
  return {
    bucket,
    region: process.env.AWS_REGION || "ap-east-1",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
    endpoint: process.env.S3_ENDPOINT
  };
}
function createS3Client(cfg) {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint || void 0
  });
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey2) {
  return { Authorization: `Bearer ${apiKey2}` };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
async function buildDownloadUrl(baseUrl, relKey, apiKey2) {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey2)
  });
  return (await response.json()).url;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const key = normalizeKey(relKey);
  const s3 = getS3Config();
  if (s3) {
    const client = createS3Client({ region: s3.region, endpoint: s3.endpoint });
    const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    await client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType
      })
    );
    const url = s3.publicBaseUrl ? `${s3.publicBaseUrl.replace(/\/+$/, "")}/${encodeURI(key)}` : `https://${s3.bucket}.s3.${s3.region}.amazonaws.com/${encodeURI(key)}`;
    return { key, url };
  }
  const proxy = getStorageProxyConfig();
  if (proxy) {
    const uploadUrl = buildUploadUrl(proxy.baseUrl, key);
    const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(proxy.apiKey),
      body: formData
    });
    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(
        `Storage upload failed (${response.status} ${response.statusText}): ${message}`
      );
    }
    const url = (await response.json()).url;
    return { key, url };
  }
  throw new Error(
    "Storage is not configured. Please set S3_BUCKET (+AWS credentials) for S3 uploads."
  );
}
async function storagePresignGet(relKey, expiresInSeconds) {
  const key = normalizeKey(relKey);
  const s3 = getS3Config();
  if (!s3) {
    throw new Error("S3 is not configured for presigned download");
  }
  const client = createS3Client({ region: s3.region, endpoint: s3.endpoint });
  const command = new GetObjectCommand({ Bucket: s3.bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
async function storageGet(relKey) {
  const key = normalizeKey(relKey);
  const proxy = getStorageProxyConfig();
  if (proxy) {
    return {
      key,
      url: await buildDownloadUrl(proxy.baseUrl, key, proxy.apiKey)
    };
  }
  return {
    key,
    url: await storagePresignGet(key, 60 * 30)
  };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// server/_core/files.ts
var files_exports = {};
__export(files_exports, {
  buildSignedDownloadLink: () => buildSignedDownloadLink,
  registerFileRoutes: () => registerFileRoutes
});
import crypto from "crypto";
function hmacSha256Hex(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
function getSecret() {
  return ENV.cookieSecret || "fallback-secret-change-in-production";
}
function buildSignedDownloadLink(baseUrl, key, ttlSeconds) {
  const exp = Math.floor(Date.now() / 1e3) + ttlSeconds;
  const payload = `${key}:${exp}`;
  const sig = hmacSha256Hex(getSecret(), payload);
  const url = new URL("/api/files/download", baseUrl);
  url.searchParams.set("key", key);
  url.searchParams.set("exp", String(exp));
  url.searchParams.set("sig", sig);
  return url.toString();
}
function registerFileRoutes(app) {
  app.get("/api/files/download", async (req, res) => {
    try {
      const key = String(req.query.key || "");
      const exp = Number(req.query.exp || 0);
      const sig = String(req.query.sig || "");
      if (!key || !exp || !sig) {
        return res.status(400).send("Missing key/exp/sig");
      }
      const now = Math.floor(Date.now() / 1e3);
      if (exp < now) {
        return res.status(410).send("Link expired");
      }
      const payload = `${key}:${exp}`;
      const expected = hmacSha256Hex(getSecret(), payload);
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
        return res.status(403).send("Invalid signature");
      }
      const presigned = await storagePresignGet(key, 60 * 30);
      return res.redirect(302, presigned);
    } catch (error) {
      console.error("[Files] download failed", error);
      return res.status(500).send("Download failed");
    }
  });
}
var init_files = __esm({
  "server/_core/files.ts"() {
    "use strict";
    init_env();
    init_storage();
  }
});

// server/pdf-generator.ts
var pdf_generator_exports = {};
__export(pdf_generator_exports, {
  generateApplicationPDF: () => generateApplicationPDF
});
import PDFDocument from "pdfkit";
import * as path from "path";
import * as fs from "fs";
function formatDate(date) {
  if (!date) return "N/A";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("zh-CN");
  } catch {
    return "N/A";
  }
}
function formatTimestamp(timestamp2) {
  if (!timestamp2) return "N/A";
  try {
    const d = typeof timestamp2 === "string" ? new Date(timestamp2) : timestamp2;
    return d.toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" });
  } catch {
    return "N/A";
  }
}
function formatAmountRange(range) {
  if (!range) return "N/A";
  if (range.includes("-")) {
    const parts = range.split("-");
    if (parts.length === 2) {
      const start = parseInt(parts[0]);
      const end = parts[1].includes("+") ? parts[1] : parseInt(parts[1]);
      if (!isNaN(start)) {
        if (typeof end === "number" && !isNaN(end)) {
          return `HKD ${start.toLocaleString("en-US")} - ${end.toLocaleString("en-US")}`;
        } else if (typeof end === "string" && end.includes("+")) {
          return `HKD ${start.toLocaleString("en-US")}+`;
        }
      }
    }
  }
  if (range.includes("+")) {
    const num2 = parseInt(range.replace("+", ""));
    if (!isNaN(num2)) {
      return `HKD ${num2.toLocaleString("en-US")}+`;
    }
  }
  const num = parseInt(range);
  if (!isNaN(num)) {
    return `HKD ${num.toLocaleString("en-US")}`;
  }
  return range;
}
function formatInvestmentExperience(experience) {
  if (!experience) return "N/A";
  if (typeof experience === "string") {
    try {
      const parsed = JSON.parse(experience);
      if (typeof parsed === "object") {
        experience = parsed;
      }
    } catch (e) {
      return String(experience);
    }
  }
  if (typeof experience === "object" && experience !== null) {
    const items = Object.entries(experience).filter(([_, value]) => value && value !== "none").map(([key, value]) => {
      const productName = translate(key);
      const experienceLevel = translate(value);
      return `${productName}: ${experienceLevel}`;
    });
    return items.length > 0 ? items.join("; ") : "N/A";
  }
  return String(experience);
}
function formatRiskTolerance(riskLevel) {
  const riskDescriptions = {
    // 英文風險等級
    "conservative": "\u4FDD\u5B88\u578B Conservative - \u4F4E\u98CE\u9669\uFF0C\u4F18\u5148\u8003\u8651\u8D44\u672C\u4FDD\u503C",
    "moderate": "\u7A33\u5065\u578B Moderate - \u4E2D\u7B49\u98CE\u9669\uFF0C\u5BFB\u6C42\u5747\u8861\u6536\u76CA\u548C\u98CE\u9669",
    "balanced": "\u5747\u8861\u578B Balanced - \u4E2D\u7B49\u5230\u4E2D\u9AD8\u98CE\u9669\uFF0C\u5E73\u8861\u589E\u503C\u4E0E\u7A33\u5B9A",
    "aggressive": "\u79EF\u6781\u578B Aggressive - \u9AD8\u98CE\u9669\uFF0C\u8FFD\u6C42\u9AD8\u56DE\u62A5",
    "speculative": "\u6FC0\u8FDB\u578B Speculative - \u6781\u9AD8\u98CE\u9669\uFF0C\u63A5\u53D7\u91CD\u5927\u6CE2\u52A8",
    // 新6级风险评分系统
    "Lowest": "Lowest / \u6700\u4F4E\u98CE\u9669\uFF08\u5206\u6570\u8303\u56F4\uFF1A0-200\uFF09",
    "Low": "Low / \u4F4E\u98CE\u9669\uFF08\u5206\u6570\u8303\u56F4\uFF1A201-400\uFF09",
    "Low to Medium": "Low to Medium / \u4F4E\u81F3\u4E2D\u7B49\u98CE\u9669\uFF08\u5206\u6570\u8303\u56F4\uFF1A401-500\uFF09",
    "Medium": "Medium / \u4E2D\u7B49\u98CE\u9669\uFF08\u5206\u6570\u8303\u56F4\uFF1A501-600\uFF09",
    "Medium to High": "Medium to High / \u4E2D\u7B49\u81F3\u9AD8\u98CE\u9669\uFF08\u5206\u6570\u8303\u56F4\uFF1A601-700\uFF09",
    "High": "High / \u9AD8\u98CE\u9669\uFF08\u5206\u6570\u8303\u56F4\uFF1A701+\uFF09",
    // 旧的R1-R5风险等级（兼容旧数据）
    "R1": "Low / \u4F4E\u98CE\u9669",
    "R2": "Low to Medium / \u4F4E\u81F3\u4E2D\u7B49\u98CE\u9669",
    "R3": "Medium / \u4E2D\u7B49\u98CE\u9669",
    "R4": "Medium to High / \u4E2D\u7B49\u81F3\u9AD8\u98CE\u9669",
    "R5": "High / \u9AD8\u98CE\u9669"
  };
  return riskDescriptions[riskLevel] || riskLevel;
}
async function generateApplicationPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 80, bottom: 70, left: 50, right: 50 },
        // 增加頂部和底部邊距，為Logo和頁碼預留空間
        bufferPages: true
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      let pageNumber = 1;
      if (fs.existsSync(LOGO_PATH)) {
        try {
          doc.image(LOGO_PATH, 50, 20, { width: 120 });
          console.log("[PDF] Logo added to first page");
        } catch (error) {
          console.error("[PDF] Failed to add logo to first page:", error);
        }
      }
      doc.on("pageAdded", () => {
        pageNumber++;
        const currentY = doc.y;
        const currentX = doc.x;
        if (fs.existsSync(LOGO_PATH)) {
          try {
            doc.image(LOGO_PATH, 50, 20, { width: 120 });
          } catch (error) {
            console.error("[PDF] Failed to add logo:", error);
          }
        }
        doc.x = currentX;
        doc.y = currentY;
      });
      try {
        if (fs.existsSync(FONT_PATH_TC)) {
          doc.registerFont("NotoSansCJK", FONT_PATH_TC);
          console.log("[PDF] Traditional Chinese font registered successfully");
        } else if (fs.existsSync(FONT_PATH_SC)) {
          doc.registerFont("NotoSansCJK", FONT_PATH_SC);
          console.log("[PDF] Simplified Chinese font registered successfully");
        } else {
          console.warn("[PDF] No Chinese font available, falling back to default");
        }
      } catch (error) {
        console.error("[PDF] Failed to register Chinese font:", error);
      }
      doc.fontSize(20).font("NotoSansCJK").text("\u5BA2\u6237\u5F00\u6237\u7533\u8BF7\u8868\uFF08\u4E2A\u4EBA/\u8054\u540D\uFF09", { align: "center" });
      doc.fontSize(12).font("NotoSansCJK").fillColor("#666666").text("Customer Account Opening Form (Individual/Joint)", { align: "center" });
      doc.fillColor("#000000");
      doc.moveDown(0.8);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#CCCCCC");
      doc.moveDown(0.5);
      doc.fontSize(10).font("NotoSansCJK");
      doc.text(`\u7533\u8BF7\u7F16\u53F7 Application Number: ${data.applicationNumber || "N/A"}`);
      doc.text(`\u7533\u8BF7\u72B6\u6001 Status: ${translate(data.status)}`);
      doc.moveDown(1);
      if (data.accountSelection) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("\u8D26\u6237\u7C7B\u578B Account Type");
        doc.moveDown(0.3);
        doc.fontSize(10).font("NotoSansCJK");
        doc.text(`\u5BA2\u6237\u7C7B\u578B Customer Type: ${translate(data.accountSelection.customerType)}`);
        doc.text(`\u8D26\u6237\u7C7B\u578B Account Type: ${translate(data.accountSelection.accountType)}`);
        doc.moveDown(1);
      }
      doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("1. \u4E2A\u4EBA\u57FA\u672C\u4FE1\u606F Personal Basic Information");
      doc.fillColor("#000000");
      doc.moveDown(0.5);
      doc.fontSize(10).font("NotoSansCJK");
      if (data.basicInfo) {
        const bi = data.basicInfo;
        doc.text(`\u4E2D\u6587\u59D3\u540D Name (Chinese): ${bi.chineseName || "N/A"}`);
        doc.text(`\u82F1\u6587\u59D3\u540D Name (English): ${bi.englishName || "N/A"}`);
        doc.text(`\u6027\u522B Gender: ${translate(bi.gender)}`);
        doc.text(`\u51FA\u751F\u65E5\u671F Date of Birth: ${formatDate(bi.dateOfBirth)}`);
        doc.text(`\u51FA\u751F\u5730 Place of Birth: ${bi.placeOfBirth || "N/A"}`);
        doc.text(`\u56FD\u7C4D Nationality: ${bi.nationality || "N/A"}`);
      }
      doc.moveDown(1);
      doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("2. \u4E2A\u4EBA\u8BE6\u7EC6\u4FE1\u606F Personal Detailed Information");
      doc.fillColor("#000000");
      doc.moveDown(0.5);
      doc.fontSize(10).font("NotoSansCJK");
      if (data.detailedInfo) {
        const di = data.detailedInfo;
        doc.text(`\u8BC1\u4EF6\u7C7B\u578B ID Type: ${translate(di.idType)}`);
        doc.text(`\u8BC1\u4EF6\u53F7\u7801 ID Number: ${di.idNumber || "N/A"}`);
        doc.text(`\u7B7E\u53D1\u5730 Issuing Place: ${di.idIssuingPlace || "N/A"}`);
        doc.text(`\u6709\u6548\u671F Expiry Date: ${di.idIsPermanent ? "\u957F\u671F\u6709\u6548 Permanent" : formatDate(di.idExpiryDate)}`);
        doc.text(`\u5A5A\u59FB\u72B6\u51B5 Marital Status: ${translate(di.maritalStatus)}`);
        doc.text(`\u5B66\u5386 Education: ${translate(di.educationLevel)}`);
        doc.text(`\u7535\u5B50\u90AE\u7BB1 Email: ${di.email || "N/A"}`);
        doc.text(`\u7535\u8BDD Phone: ${di.phoneCountryCode || ""}${di.phoneNumber || "N/A"}`);
        doc.text(`\u624B\u673A\u53F7\u7801 Mobile: ${di.mobileCountryCode || ""}${di.mobileNumber || "N/A"}`);
        doc.text(`\u4F20\u771F Fax: ${di.faxNo || "N/A"}`);
        doc.text(`\u4F4F\u5B85\u5730\u5740 Residential Address: ${di.residentialAddress || "N/A"}`);
        let billingAddressText = "";
        if (di.billingAddressType === "residential") {
          billingAddressText = "\u4F4F\u5B85\u5730\u5740 Residential Address";
        } else if (di.billingAddressType === "office") {
          billingAddressText = "\u529E\u516C\u5730\u5740 Office Address";
        } else if (di.billingAddressType === "other" && di.billingAddressOther) {
          billingAddressText = `\u5176\u4ED6 Other: ${di.billingAddressOther}`;
        }
        doc.text(`\u8D26\u5355\u901A\u8BAF\u5730\u5740 Billing Address: ${billingAddressText}`);
        const preferredLanguageText = di.preferredLanguage === "chinese" ? "\u4E2D\u6587 Chinese" : "\u82F1\u6587 English";
        doc.text(`\u8D26\u5355\u9996\u9009\u8BED\u8A00 Preferred Language: ${preferredLanguageText}`);
      }
      doc.moveDown(1);
      if (data.occupation) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("3. \u804C\u4E1A\u4FE1\u606F Occupation Information");
        doc.moveDown(0.3);
        doc.fontSize(10).font("NotoSansCJK");
        const oc = data.occupation;
        doc.text(`\u5C31\u4E1A\u72B6\u51B5 Employment Status: ${translate(oc.employmentStatus)}`);
        if (oc.employmentStatus === "employed" || oc.employmentStatus === "self_employed") {
          doc.text(`\u516C\u53F8\u540D\u79F0 Company Name: ${oc.companyName || "N/A"}`);
          doc.text(`\u804C\u4F4D Position: ${oc.position || "N/A"}`);
          doc.text(`\u4ECE\u4E1A\u5E74\u9650 Years of Service: ${oc.yearsOfService || "N/A"}`);
          doc.text(`\u884C\u4E1A Industry: ${oc.industry || "N/A"}`);
          doc.text(`\u529E\u516C\u5730\u5740 Office Address: ${oc.companyAddress || "N/A"}`);
          doc.text(`\u529E\u516C\u7535\u8BDD Office Phone: ${oc.officePhone || "N/A"}`);
          doc.text(`\u529E\u516C\u4F20\u771F Office Fax: ${oc.officeFaxNo || "N/A"}`);
        }
        doc.moveDown(1);
      }
      if (data.financial) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("4. \u8D22\u52A1\u72B6\u51B5 Financial Status");
        doc.moveDown(0.3);
        doc.fontSize(10).font("NotoSansCJK");
        const fi = data.financial;
        doc.text(`\u6536\u5165\u6765\u6E90 Income Source: ${fi.incomeSource || "N/A"}`);
        doc.text(`\u5E74\u6536\u5165 Annual Income: ${formatAmountRange(fi.annualIncome)}`);
        doc.text(`\u6D41\u52A8\u8D44\u4EA7 Liquid Asset: ${formatAmountRange(fi.liquidAsset)}`);
        doc.text(`\u51C0\u8D44\u4EA7 Net Worth: ${formatAmountRange(fi.netWorth)}`);
        doc.moveDown(1);
      }
      if (data.investment) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("5. \u6295\u8D44\u4FE1\u606F Investment Information");
        doc.moveDown(0.3);
        doc.fontSize(10).font("NotoSansCJK");
        const inv = data.investment;
        const translateObjective = (obj) => {
          const translations2 = {
            capital_growth: "\u8CC7\u672C\u589E\u503C",
            income_generation: "\u6536\u76CA\u751F\u6210",
            capital_preservation: "\u8CC7\u672C\u4FDD\u503C",
            speculation: "\u6295\u6A5F",
            hedging: "\u5C0D\u6C96"
          };
          return translations2[obj] || obj;
        };
        let objectives = "N/A";
        if (inv.investmentObjectives) {
          try {
            const parsed = typeof inv.investmentObjectives === "string" ? JSON.parse(inv.investmentObjectives) : inv.investmentObjectives;
            if (Array.isArray(parsed)) {
              objectives = parsed.map(translateObjective).join(", ");
            } else {
              objectives = String(inv.investmentObjectives);
            }
          } catch (e) {
            objectives = String(inv.investmentObjectives);
          }
        }
        doc.text(`\u6295\u8D44\u76EE\u7684 Investment Objective: ${objectives}`);
        doc.text(`\u6295\u8D44\u7ECF\u9A8C Investment Experience: ${formatInvestmentExperience(inv.investmentExperience)}`);
        let riskToleranceText = "N/A";
        if (data.riskQuestionnaire && data.riskQuestionnaire.riskLevel) {
          riskToleranceText = `${data.riskQuestionnaire.riskLevel}`;
          if (data.riskQuestionnaire.riskDescription) {
            riskToleranceText += `

${data.riskQuestionnaire.riskDescription}`;
          }
          if (data.riskQuestionnaire.totalScore) {
            riskToleranceText += `

\uFF08\u57FA\u65BC\u98A8\u96AA\u8A55\u4F30\u554F\u5377\u7E3D\u5206: ${data.riskQuestionnaire.totalScore}\uFF09`;
          }
        }
        doc.text(`\u98CE\u9669\u627F\u53D7\u80FD\u529B Risk Tolerance: ${riskToleranceText}`);
        doc.moveDown(1);
      }
      if (data.bankAccounts && data.bankAccounts.length > 0) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("6. \u94F6\u884C\u8D26\u6237 Bank Account");
        doc.fillColor("#000000");
        doc.moveDown(0.5);
        doc.fontSize(10).font("NotoSansCJK");
        data.bankAccounts.forEach((account, index) => {
          const boxY = doc.y;
          doc.rect(50, boxY - 5, 495, 85).fillAndStroke("#f8f9fa", "#dee2e6");
          doc.fillColor("#000000");
          doc.y = boxY;
          doc.fontSize(11).font("NotoSansCJK").fillColor("#2c3e50").text(`\u8D26\u6237 ${index + 1}`, 60, doc.y);
          doc.fillColor("#000000");
          doc.moveDown(0.3);
          doc.fontSize(10).text(`  \u94F6\u884C\u540D\u79F0 Bank Name: ${account.bankName || "N/A"}`, 60);
          doc.text(`  \u8D26\u6237\u7C7B\u578B Account Type: ${translate(account.accountType)}`, 60);
          doc.text(`  \u5E01\u79CD Currency: ${account.currency || "N/A"}`, 60);
          doc.text(`  \u8D26\u53F7 Account Number: ${account.accountNumber || "N/A"}`, 60);
          doc.text(`  \u6301\u6709\u4EBA Holder Name: ${account.accountHolderName || "N/A"}`, 60);
          doc.moveDown(0.8);
        });
        doc.moveDown(0.5);
      }
      if (data.taxInfo) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("7. \u7A0E\u52A1\u4FE1\u606F Tax Information");
        doc.moveDown(0.3);
        doc.fontSize(10).font("NotoSansCJK");
        doc.text(`  \u7A0E\u52A1\u5C45\u6C11\u8EAB\u4EFD Tax Residency: ${data.taxInfo.taxResidency || "N/A"}`);
        doc.text(`  \u7A0E\u52A1\u8BC6\u522B\u53F7 Tax ID Number: ${data.taxInfo.taxIdNumber || "N/A"}`);
        doc.moveDown(0.5);
      }
      if (data.riskQuestionnaire) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("8. \u98CE\u9669\u8BC4\u4F30\u95EE\u5377 Risk Assessment Questionnaire");
        doc.fillColor("#000000");
        doc.moveDown(0.5);
        doc.fontSize(10).font("NotoSansCJK");
        const rq = data.riskQuestionnaire;
        const scoreBoxY = doc.y;
        doc.rect(50, scoreBoxY - 5, 495, 35).fillAndStroke("#e8f4f8", "#b3d9e8");
        doc.fillColor("#000000");
        doc.y = scoreBoxY;
        doc.fontSize(11).font("NotoSansCJK").text(`\u603B\u5206 Total Score: ${rq.totalScore || 0}`, 60);
        doc.text(`\u98CE\u9669\u7B49\u7EA7 Risk Level: ${rq.riskLevel || "N/A"}`, 60);
        doc.moveDown(0.8);
        if (rq.q1_current_investments) {
          const q1Investments = JSON.parse(rq.q1_current_investments || "[]");
          const q1Text = q1Investments.map((item) => {
            if (item === "savings") return "\u5132\u84C4/\u5B9A\u671F\u5132\u84C4/\u5B58\u6B3E\u8B49/\u4FDD\u672C\u7522\u54C1";
            if (item === "bonds") return "\u503A\u5238/\u8B49\u5238/\u55AE\u4F4D\u4FE1\u8A17\u57FA\u91D1/\u6295\u8CC7\u76F8\u9023\u4FDD\u96AA\u8A08\u5283";
            if (item === "derivatives") return "\u671F\u8CA8/\u671F\u6B0A/\u886D\u751F\u7522\u54C1/\u7D50\u69CB\u6027\u6295\u8CC7\u7522\u54C1/\u639B\u9264\u5B58\u6B3E/\u69D3\u687F\u5F0F\u5916\u532F\u6295\u8CC7";
            return item;
          }).join(", ");
          doc.text(`Q1. \u73FE\u5728\u662F\u5426\u6301\u6709\u4EE5\u4E0B\u4EFB\u4F55\u6295\u8CC7\u7522\u54C1\uFF1F ${q1Text}`);
        }
        if (rq.q2_investment_period) {
          let q2Text = "";
          if (rq.q2_investment_period === "less_than_1") q2Text = "\u6C92\u6709\u6216\u5C11\u65BC1\u5E74";
          else if (rq.q2_investment_period === "1_to_3") q2Text = "1-3\u5E74";
          else if (rq.q2_investment_period === "more_than_3") q2Text = "\u591A\u65BC3\u5E74";
          doc.text(`Q2. \u9810\u671F\u6295\u8CC7\u5E74\u671F\u662F\u591A\u5C11\uFF1F ${q2Text}`);
        }
        if (rq.q3_price_volatility) {
          let q3Text = "";
          if (rq.q3_price_volatility === "10_percent") q3Text = "\u50F9\u683C\u6CE2\u5E45\u4ECB\u4E4E-10%\u81F3+10%";
          else if (rq.q3_price_volatility === "20_percent") q3Text = "\u50F9\u683C\u6CE2\u5E45\u4ECB\u4E4E-20%\u81F3+20%";
          else if (rq.q3_price_volatility === "30_percent") q3Text = "\u50F9\u683C\u6CE2\u5E45\u591A\u65BC-30%\u81F3\u591A\u65BC+30%";
          doc.text(`Q3. \u53EF\u4EE5\u63A5\u53D7\u4EE5\u4E0B\u54EA\u500B\u5E74\u5EA6\u50F9\u683C\u6CE2\u5E45\uFF1F ${q3Text}`);
        }
        if (rq.q4_investment_percentage) {
          let q4Text = "";
          if (rq.q4_investment_percentage === "less_than_10") q4Text = "\u5C11\u65BC10%";
          else if (rq.q4_investment_percentage === "10_to_20") q4Text = "\u4ECB\u4E4E10%\u81F320%";
          else if (rq.q4_investment_percentage === "21_to_30") q4Text = "\u4ECB\u4E4E21%\u81F330%";
          else if (rq.q4_investment_percentage === "31_to_50") q4Text = "\u4ECB\u4E4E31%\u81F350%";
          else if (rq.q4_investment_percentage === "more_than_50") q4Text = "\u591A\u65BC50%";
          doc.text(`Q4. \u5728\u73FE\u6642\u8CC7\u7522\u6DEB\u503C\u4E2D(\u64A4\u9664\u81EA\u4F4F\u7269\u696D\u50F9\u503C)\uFF0C\u6709\u591A\u5C11\u500B\u767E\u5206\u6BD4\u53EF\u4F5C\u6295\u8CC7\u7528\u9014\uFF1F ${q4Text}`);
        }
        if (rq.q5_investment_attitude) {
          let q5Text = "";
          if (rq.q5_investment_attitude === "no_volatility") q5Text = "\u4E0D\u80FD\u63A5\u53D7\u4EFB\u4F55\u50F9\u683C\u6CE2\u52D5\uFF0C\u4E26\u4E14\u5C0D\u8CED\u53D6\u6295\u8CC7\u56DE\u5831\u4E0D\u611F\u8208\u8DA3";
          else if (rq.q5_investment_attitude === "small_volatility") q5Text = "\u53EA\u80FD\u63A5\u53D7\u8F03\u5C0F\u5E45\u5EA6\u7684\u50F9\u683C\u6CE2\u52D5\uFF0C\u4E26\u4E14\u50C5\u5E0C\u671B\u8CED\u53D6\u7A0D\u9AD8\u65BC\u9280\u884C\u5B58\u6B3E\u5229\u7387\u7684\u56DE\u5831";
          else if (rq.q5_investment_attitude === "some_volatility") q5Text = "\u53EF\u63A5\u53D7\u82E5\u5E72\u50F9\u683C\u6CE2\u5E45\uFF0C\u4E26\u5E0C\u671B\u8CED\u53D6\u9AD8\u65BC\u9280\u884C\u5B58\u6B3E\u5229\u7387\u7684\u56DE\u5831";
          else if (rq.q5_investment_attitude === "large_volatility") q5Text = "\u53EF\u63A5\u53D7\u5927\u5E45\u5EA6\u7684\u50F9\u683C\u6CE2\u52D5\uFF0C\u4E26\u5E0C\u671B\u8CED\u53D6\u8207\u80A1\u5E02\u6307\u6578\u8868\u73FE\u76F8\u82E5\u7684\u56DE\u5831";
          else if (rq.q5_investment_attitude === "any_volatility") q5Text = "\u53EF\u63A5\u53D7\u4EFB\u4F55\u5E45\u5EA6\u7684\u50F9\u683C\u6CE2\u52D5\uFF0C\u4E26\u5E0C\u671B\u56DE\u5831\u80FD\u8DD1\u8D0F\u80A1\u5E02\u6307\u6578";
          doc.text(`Q5. \u4EE5\u4E0B\u54EA\u4E00\u53E5\u5B50\u6700\u80FD\u8CBC\u5207\u63CF\u8FF0\u60A8\u5C0D\u91D1\u878D\u6295\u8CC7\u7684\u4E00\u822C\u614B\u5EA6\uFF1F ${q5Text}`);
        }
        if (rq.q6_derivatives_knowledge) {
          const q6Knowledge = JSON.parse(rq.q6_derivatives_knowledge || "[]");
          const q6Text = q6Knowledge.map((item) => {
            if (item === "training") return "\u66FE\u63A5\u53D7\u6709\u95DC\u886D\u751F\u7522\u54C1\u7684\u57F9\u8A13\u6216\u4FEE\u8B80\u76F8\u95DC\u8AB2\u7A0B";
            if (item === "experience") return "\u73FE\u6642\u6216\u904E\u53BB\u64C1\u6709\u8207\u886D\u751F\u7522\u54C1\u6709\u95DC\u7684\u5DE5\u4F5C\u7D93\u9A57";
            if (item === "transactions") return "\u65BC\u904E\u5F803\u5E74\u66FE\u57F7\u884C5\u6B21\u6216\u4EE5\u4E0A\u6709\u95DC\u886D\u751F\u7522\u54C1\u7684\u4EA4\u6613";
            if (item === "no_knowledge") return "\u6C92\u6709\u886D\u751F\u5DE5\u5177\u4E4B\u8A8D\u8B58";
            return item;
          }).join(", ");
          doc.text(`Q6. \u5C0D\u886D\u751F\u5DE5\u5177\u7522\u54C1\u7684\u8A8D\u8B58\uFF1A ${q6Text}`);
        }
        if (rq.q7_age_group) {
          let q7Text = "";
          if (rq.q7_age_group === "18_to_25") q7Text = "\u4ECB\u4E4E18\u81F325\u6B72";
          else if (rq.q7_age_group === "26_to_35") q7Text = "\u4ECB\u4E4E26\u81F335\u6B72";
          else if (rq.q7_age_group === "36_to_50") q7Text = "\u4ECB\u4E4E36\u81F350\u6B72";
          else if (rq.q7_age_group === "51_to_64") q7Text = "\u4ECB\u4E4E51\u81F364\u6B72";
          else if (rq.q7_age_group === "65_plus") q7Text = "65\u6B72\u6216\u4EE5\u4E0A";
          doc.text(`Q7. \u60A8\u5C6C\u65BC\u4EE5\u4E0B\u54EA\u500B\u5E74\u9F61\u7D44\u5225\uFF1F ${q7Text}`);
        }
        if (rq.q8_education_level) {
          let q8Text = "";
          if (rq.q8_education_level === "primary_or_below") q8Text = "A. \u5C0F\u5B78\u6216\u4EE5\u4E0B\u5B78\u6B77";
          else if (rq.q8_education_level === "secondary") q8Text = "B. \u4E2D\u5B78";
          else if (rq.q8_education_level === "tertiary_or_above") q8Text = "C. \u5927\u5C08\u6216\u4EE5\u4E0A\u5B78\u6B77";
          doc.text(`Q8. \u60A8\u7684\u6559\u80B2\u7A0B\u5EA6\uFF1A ${q8Text}`);
        }
        if (rq.q9_investment_knowledge_sources) {
          const q9Sources = JSON.parse(rq.q9_investment_knowledge_sources || "[]");
          const q9Text = q9Sources.map((item) => {
            if (item === "no_interest") return "\u5F9E\u672A\u6C72\u53D6\u53CA/\u6216\u6C92\u6709\u8208\u8DA3\u6C72\u53D6\u4EFB\u4F55\u6295\u8CC7\u77E5\u8B58";
            if (item === "discussion") return "\u8207\u89AA\u53CB\u53CA/\u6216\u540C\u4E8B\u8A0E\u8AD6\u6295\u8CC7\u6216\u7406\u8CA1\u8A71\u984C";
            if (item === "reading") return "\u95B1\u8B80\u53CA/\u6216\u6536\u807D\u6709\u95DC\u6295\u8CC7\u6216\u8CA1\u7D93\u65B0\u805E";
            if (item === "research") return "\u7814\u7A76\u6295\u8CC7\u6216\u8CA1\u52D9\u76F8\u95DC\u4E8B\u5B9C\uFF0C\u6216\u53C3\u52A0\u6295\u8CC7\u6216\u8CA1\u52D9\u76F8\u95DC\u8AB2\u7A0B\u3001\u8AD6\u58C7\u3001\u7C21\u5831\u6703\u3001\u7814\u8A0E\u6703\u6216\u5DE5\u4F5C\u574A";
            return item;
          }).join(", ");
          doc.text(`Q9. \u60A8\u66FE\u7D93\u6216\u73FE\u6642\u5F9E\u4EE5\u4E0B\u54EA\u4E9B\u9014\u5F91\u6C72\u53D6\u6295\u8CC7\u77E5\u8B58\uFF1F ${q9Text}`);
        }
        if (rq.q10_liquidity_needs) {
          let q10Text = "";
          if (rq.q10_liquidity_needs === "no_need") q10Text = "\u4E0D\u9700\u8981\u51FA\u552E\u4EFB\u4F55\u6295\u8CC7";
          else if (rq.q10_liquidity_needs === "up_to_30") q10Text = "\u6211\u6703\u51FA\u552E\u4E0D\u8D85\u904E30%\u7684\u6295\u8CC7";
          else if (rq.q10_liquidity_needs === "30_to_50") q10Text = "\u6211\u6703\u51FA\u552E\u8D85\u904E30%\u4F46\u4E0D\u523050%\u7684\u6295\u8CC7";
          else if (rq.q10_liquidity_needs === "over_50") q10Text = "\u6211\u6703\u51FA\u552E\u8D85\u904E50%\u7684\u6295\u8CC7";
          doc.text(`Q10. \u60A8\u9700\u8981\u5C07\u591A\u5C11\u6295\u8CC7\u514C\u73FE\uFF0C\u4EE5\u6EFF\u8DB3\u7A81\u767C\u4E8B\u4EF6\u7684\u6D41\u52D5\u8CC7\u91D1\u9700\u6C42\uFF1F ${q10Text}`);
        }
        doc.moveDown(1);
      }
      if (data.uploadedDocuments && data.uploadedDocuments.length > 0) {
        doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("8. \u4E0A\u4F20\u6587\u4EF6\u6E05\u5355 Uploaded Documents");
        doc.moveDown(0.3);
        doc.fontSize(10).font("NotoSansCJK");
        data.uploadedDocuments.forEach((doc_item, index) => {
          const docTypeTranslated = translate(doc_item.documentType);
          doc.text(`  ${index + 1}. ${docTypeTranslated}`);
          if (doc_item.fileUrl) {
            doc.fontSize(8).fillColor("blue").text(`     \u4E0B\u8F7D\u94FE\u63A5 Download: ${doc_item.fileUrl}`);
            doc.fillColor("black").fontSize(10);
          }
        });
        doc.moveDown(0.5);
      }
      doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("\u5BA2\u6236\u5408\u898F\u8072\u660E Customer Compliance Declarations");
      doc.moveDown(0.3);
      doc.fontSize(9).font("NotoSansCJK");
      doc.text("PEP\u8072\u660E Political Exposed Person (PEP) Declaration:");
      doc.fontSize(8);
      const pepStatus = data.isPEP ? "\u662F Yes" : "\u5426 No";
      doc.text(`\u672C\u4EBA\u78BA\u8A8D\u672C\u4EBA${pepStatus}\u70BA\u653F\u6CBB\u516C\u773E\u4EBA\u7269\uFF08PEP\uFF09\u3002`);
      doc.text(`I confirm that I am ${pepStatus} a Political Exposed Person (PEP).`);
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text("US Person\u8072\u660E US Person Declaration:");
      doc.fontSize(8);
      const usPersonStatus = data.isUSPerson ? "\u662F Yes" : "\u5426 No";
      doc.text(`\u672C\u4EBA\u78BA\u8A8D\u672C\u4EBA${usPersonStatus}\u70BA\u7F8E\u570B\u4EBA\u58EB\uFF08US Person\uFF09\u3002`);
      doc.text(`I confirm that I am ${usPersonStatus} a US Person.`);
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text("\u5DF2\u95B1\u8B80\u958B\u6236\u5354\u8B70 Read Opening Agreement:");
      doc.fontSize(8);
      const hasReadAgreementStatus = data.agreementRead ? "\u662F Yes" : "\u5426 No";
      doc.text(`\u672C\u4EBA\u78BA\u8A8D${hasReadAgreementStatus}\u5DF2\u95B1\u8B80\u958B\u6236\u5354\u8B70\u3002`);
      doc.text(`I confirm that I ${hasReadAgreementStatus} read the opening agreement.`);
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text("\u63A5\u53D7\u96FB\u5B50\u4EA4\u6613\u689D\u4F8B (ETO) Accept Electronic Trading Ordinance:");
      doc.fontSize(8);
      const acceptsETOStatus = data.electronicSignatureConsent ? "\u540C\u610F Agreed" : "\u672A\u540C\u610F Not Agreed";
      doc.text(`\u672C\u4EBA${acceptsETOStatus}\u63A5\u53D7\u96FB\u5B50\u4EA4\u6613\u689D\u4F8B\u7684\u7D04\u675F\u3002`);
      doc.text(`I ${acceptsETOStatus} to accept the Electronic Trading Ordinance.`);
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text("\u63A5\u53D7\u53CD\u6D17\u9322\u548C\u5408\u898F\u76E3\u7BA1 Accept AML and Compliance:");
      doc.fontSize(8);
      const amlStatus = data.amlComplianceConsent ? "\u540C\u610F Agreed" : "\u672A\u540C\u610F Not Agreed";
      doc.text(`\u672C\u4EBA${amlStatus}\u63A5\u53D7\u53CD\u6D17\u9322\u548C\u5176\u4ED6\u76E3\u7BA1\u5408\u898F\u8981\u6C42\u7684\u7D04\u675F\u3002`);
      doc.text(`I ${amlStatus} to accept the constraints of anti-money laundering and other regulatory compliance requirements.`);
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text("\u98CE\u9669\u8BC4\u4F30\u786E\u8BA4 Risk Assessment Confirmation:");
      doc.fontSize(8);
      const riskAssessmentStatus = data.riskAssessmentConsent ? "\u540C\u610F Agreed" : "\u672A\u540C\u610F Not Agreed";
      doc.text(`\u672C\u4EBA${riskAssessmentStatus}\u5DF2\u95B1\u8B80\u98CE\u9669\u8BC4\u4F30\u95EE\u5377\u5E76\u786E\u8BA4\u7ED3\u679C\u3002`);
      doc.text(`I ${riskAssessmentStatus} that I have read the risk assessment questionnaire and confirm the results.`);
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text("\u5354\u8B70\u7C3D\u7F72 Agreement Signed:");
      doc.fontSize(8);
      const agreementStatus = data.agreementAccepted ? "\u5DF2\u7C3D\u7F72 Signed" : "\u672A\u7C3D\u7F72 Not Signed";
      doc.text(`\u5354\u8B70\u7C3D\u7F72\u72C0\u614B Agreement Signed Status: ${agreementStatus}`);
      if (data.agreementAccepted) {
        doc.text("\u672C\u4EBA\u78BA\u8A8D\u5DF2\u8A73\u7D30\u95B1\u8B80\u958B\u6236\u5354\u8B70\uFF0C\u6E05\u695A\u4E86\u89E3\u5354\u8B70\u5167\u5BB9\uFF0C\u4E26\u9858\u610F\u63A5\u53D7\u5354\u8B70\u689D\u6B3E\u7D04\u675F\u3002");
        doc.text("I confirm that I have read the account opening agreement in detail, clearly understand the content of the agreement, and am willing to accept the terms and conditions of the agreement.");
      }
      doc.moveDown(1);
      doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("\u7533\u8BF7\u4EBA\u58F0\u660E\u53CA\u7B7E\u7F72 Applicant Declaration and Signature");
      doc.moveDown(0.3);
      doc.fontSize(9).font("NotoSansCJK");
      doc.text("\u5BA2\u6237\u58F0\u660E Customer Declaration:");
      doc.fontSize(8);
      doc.text("I declare that the information provided above is true, accurate and complete, and I agree to comply with the terms and conditions of the company.");
      doc.text("\u672C\u4EBA\u58F0\u660E\u4EE5\u4E0A\u6240\u586B\u5199\u7684\u8D44\u6599\u5747\u5C5E\u771F\u5B9E\u3001\u51C6\u786E\u548C\u5B8C\u6574\uFF0C\u5E76\u540C\u610F\u9075\u5B88\u8D35\u516C\u53F8\u7684\u6761\u6B3E\u53CA\u7EC6\u5219\u3002");
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text("\u7535\u5B50\u7B7E\u7F72\u58F0\u660E Electronic Signature Declaration:");
      doc.fontSize(8);
      doc.text("I agree to use electronic signature to sign this application form and understand that this electronic signature has the same legal effect as a handwritten signature.");
      doc.text("\u672C\u4EBA\u540C\u610F\u4F7F\u7528\u7535\u5B50\u7B7E\u7F72\u65B9\u5F0F\u7B7E\u7F72\u672C\u7533\u8BF7\u8868\uFF0C\u5E76\u660E\u767D\u6B64\u7535\u5B50\u7B7E\u7F72\u5177\u6709\u4E0E\u624B\u5199\u7B7E\u540D\u540C\u7B49\u7684\u6CD5\u5F8B\u6548\u529B\u3002");
      doc.moveDown(0.5);
      doc.fontSize(9).font("NotoSansCJK");
      const signatureName = data.signatureName || data.basicInfo?.englishName || "N/A";
      doc.text(`\u7B7E\u540D Signature: ${signatureName}`);
      doc.text(`\u7B7E\u7F72\u65B9\u5F0F Signature Method: ${data.signatureMethod || "Typed / \u8F93\u5165"}`);
      doc.text(`\u7B7E\u7F72\u65F6\u95F4 Signature Timestamp: ${formatTimestamp(data.signatureTimestamp)}`);
      doc.moveDown(1);
      if (data.firstApproval || data.secondApproval) {
        doc.addPage();
        doc.fontSize(14).font("NotoSansCJK").text("\u5BE9\u6279\u8A18\u9304 Approval Records", { underline: true });
        doc.moveDown(0.5);
        if (data.firstApproval) {
          doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("\u521D\u5BE9\u8A18\u9304 First Approval Record");
          doc.moveDown(0.3);
          doc.fontSize(9).font("NotoSansCJK");
          doc.text(`\u5BE9\u6279\u4EBA\u54E1 Approver: ${data.firstApproval.approverName || "N/A"}`);
          doc.text(`CE\u865F\u78BC CE Number: ${data.firstApproval.approverCeNo || "N/A"}`);
          doc.text(`\u5C08\u696D\u6295\u8CC7\u8005\u8A8D\u5B9A Professional Investor: ${data.firstApproval.isProfessionalInvestor ? "\u662F Yes" : "\u5426 No"}`);
          doc.text(`\u98A8\u96AA\u8A55\u7D1A Risk Profile: ${data.firstApproval.approvedRiskProfile ? formatRiskTolerance(data.firstApproval.approvedRiskProfile) : "N/A"}`);
          doc.text(`\u5BE9\u6279\u6642\u9593 Approval Time: ${formatTimestamp(data.firstApproval.approvalTime)}`);
          if (data.firstApproval.comments) {
            doc.text(`\u5BE9\u6279\u610F\u898B Comments: ${data.firstApproval.comments}`);
          }
          doc.moveDown(0.5);
        }
        if (data.secondApproval) {
          doc.fontSize(14).font("NotoSansCJK").fillColor("#2c3e50").text("\u7D42\u5BE9\u8A18\u9304 Final Approval Record");
          doc.moveDown(0.3);
          doc.fontSize(9).font("NotoSansCJK");
          doc.text(`\u5BE9\u6279\u4EBA\u54E1 Approver: ${data.secondApproval.approverName || "N/A"}`);
          if (data.secondApproval.approverCeNo) {
            doc.text(`CE\u865F\u78BC CE Number: ${data.secondApproval.approverCeNo}`);
          }
          doc.text(`\u5C08\u696D\u6295\u8CC7\u8005\u8A8D\u5B9A Professional Investor: ${data.secondApproval.isProfessionalInvestor ? "\u662F Yes" : "\u5426 No"}`);
          doc.text(`\u98A8\u96AA\u8A55\u7D1A Risk Profile: ${data.secondApproval.approvedRiskProfile ? formatRiskTolerance(data.secondApproval.approvedRiskProfile) : "N/A"}`);
          doc.text(`\u5BE9\u6279\u6642\u9593 Approval Time: ${formatTimestamp(data.secondApproval.approvalTime)}`);
          if (data.secondApproval.comments) {
            doc.text(`\u5BE9\u6279\u610F\u898B Comments: ${data.secondApproval.comments}`);
          }
          doc.moveDown(1);
        }
      }
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 60;
        doc.moveTo(50, footerY).lineTo(545, footerY).stroke("#CCCCCC");
        doc.fontSize(7).font("NotoSansCJK").fillColor("#666666");
        doc.text("\u8C03\u6E2F\u91D1\u878D CM Financial", 50, footerY + 8, {
          lineBreak: false
        });
        const appNumberText = `${data.applicationNumber || "N/A"}`;
        const appNumberWidth = doc.widthOfString(appNumberText);
        const appNumberX = (doc.page.width - appNumberWidth) / 2;
        doc.text(appNumberText, appNumberX, footerY + 8, {
          lineBreak: false
        });
        const pageNumberText = `${i + 1} / ${pages.count}`;
        const pageNumberWidth = doc.widthOfString(pageNumberText);
        const pageNumberX = doc.page.width - 50 - pageNumberWidth;
        doc.text(pageNumberText, pageNumberX, footerY + 8, {
          lineBreak: false
        });
        doc.fillColor("#000000");
      }
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
var PROJECT_ROOT, FONT_PATH_SC, FONT_PATH_TC, LOGO_PATH, translations, translate;
var init_pdf_generator = __esm({
  "server/pdf-generator.ts"() {
    "use strict";
    PROJECT_ROOT = process.cwd();
    FONT_PATH_SC = path.join(PROJECT_ROOT, "server", "fonts", "NotoSansCJKsc-Regular.otf");
    FONT_PATH_TC = path.join(PROJECT_ROOT, "server", "fonts", "NotoSansCJKtc-Regular.otf");
    LOGO_PATH = path.join(PROJECT_ROOT, "client", "public", "logo-zh.png");
    if (!fs.existsSync(FONT_PATH_SC)) {
      console.warn(`[PDF] Simplified Chinese font not found: ${FONT_PATH_SC}`);
    }
    if (!fs.existsSync(FONT_PATH_TC)) {
      console.warn(`[PDF] Traditional Chinese font not found: ${FONT_PATH_TC}`);
    }
    translations = {
      // 客户类型
      individual: "\u4E2A\u4EBA\u8D26\u6237 Individual",
      joint: "\u8054\u540D\u8D26\u6237 Joint",
      corporate: "\u673A\u6784\u8D26\u6237 Corporate",
      // 账户类型
      cash: "\u73B0\u91D1\u8D26\u6237 Cash",
      margin: "\u4FDD\u8BC1\u91D1\u8D26\u6237 Margin",
      derivatives_account: "\u8861\u751F\u54C1\u8D26\u6237 Derivatives",
      // 性别
      male: "\u7537 Male",
      female: "\u5973 Female",
      other: "\u5176\u4ED6 Other",
      // 证件类型
      hkid: "\u9999\u6E2F\u8EAB\u4EFD\u8BC1 HKID",
      passport: "\u62A4\u7167 Passport",
      mainland_id: "\u4E2D\u56FD\u5927\u9646\u8EAB\u4EFD\u8BC1 Mainland ID",
      "mainland-id": "\u4E2D\u56FD\u5927\u9646\u5C45\u6C11\u8EAB\u4EFD\u8BC1 Mainland ID",
      "taiwan-id": "\u53F0\u6E7E\u5C45\u6C11\u8EAB\u4EFD\u8BC1 Taiwan ID",
      "macao-id": "\u6FB3\u95E8\u5C45\u6C11\u8EAB\u4EFD\u8BC1 Macao ID",
      // 婚姻状况
      single: "\u5355\u8EAB Single",
      married: "\u5DF2\u5A5A Married",
      divorced: "\u79BB\u5A5A Divorced",
      widowed: "\u4E27\u5076 Widowed",
      // 教育程度
      high_school: "\u9AD8\u4E2D\u5B66\u5386 High School",
      associate: "\u4E13\u79D1\u5B66\u5386 Associate",
      bachelor: "\u672C\u79D1\u5B66\u5386 Bachelor",
      master: "\u7855\u58EB\u5B66\u5386 Master",
      doctorate: "\u535A\u58EB\u5B66\u5386 Doctorate",
      primary: "\u5C0F\u5B66\u5B66\u5386 Primary",
      secondary: "\u4E2D\u5B66\u5B66\u5386 Secondary",
      // 就业状态
      employed: "\u53D7\u96C7 Employed",
      self_employed: "\u81EA\u96C7 Self-Employed",
      unemployed: "\u65E0\u4E1A Unemployed",
      retired: "\u9000\u4F11 Retired",
      student: "\u5B66\u751F Student",
      // 银行账户类型
      saving: "\u50A8\u84C4\u8D26\u6237 Saving",
      current: "\u652F\u7968\u8D26\u6237 Current",
      // 投资经验
      none: "\u65E0\u7ECF\u9A8C None",
      less_than_1: "\u5C11\u4E8E1\u5E74 Less than 1 year",
      "1_to_3": "1-3 Years/\u5E74",
      "3_to_5": "3-5 Years/\u5E74",
      more_than_5: "5\u5E74\u4EE5\u4E0A More than 5 years",
      // 投资产品
      stocks: "\u80A1\u7968 Stocks",
      bonds: "\u503A\u5238 Bonds",
      funds: "\u57FA\u91D1 Funds",
      derivatives: "\u8861\u751F\u54C1 Derivatives",
      forex: "\u5916\u6C47 Forex",
      commodities: "\u5546\u54C1 Commodities",
      // 投资目标
      capital_growth: "\u8D44\u672C\u589E\u503C Capital Growth",
      income_generation: "\u6536\u76CA\u751F\u6210 Income Generation",
      capital_preservation: "\u8D44\u672C\u4FDD\u503C Capital Preservation",
      speculation: "\u6295\u673A Speculation",
      hedging: "\u5BF9\u51B2 Hedging",
      // 收入来源
      salary: "\u85AA\u91D1 Salary",
      business_income: "\u8425\u4E1A\u6536\u5165 Business Income",
      investment_income: "\u6295\u8D44\u6536\u76CA Investment Income",
      rental_income: "\u79DF\u91D1\u6536\u5165 Rental Income",
      pension: "\u517B\u8001\u91D1 Pension",
      inheritance: "\u7EE7\u627F\u8D22\u4EA7 Inheritance",
      gift: "\u8D60\u4E0E Gift",
      savings: "\u50A8\u84C4 Savings",
      // 风险等级
      R1: "R1 - \u4F4E\u98CE\u9669",
      R2: "R2 - \u4E2D\u4F4E\u98CE\u9669",
      R3: "R3 - \u4E2D\u98CE\u9669",
      R4: "R4 - \u4E2D\u9AD8\u98CE\u9669",
      R5: "R5 - \u9AD8\u98CE\u9669",
      // 币种
      HKD: "\u6E2F\u5E01 HKD",
      USD: "\u7F8E\u5143 USD",
      CNY: "\u4EBA\u6C11\u5E01 CNY",
      EUR: "\u6B27\u5143 EUR",
      GBP: "\u82F1\u9551 GBP",
      JPY: "\u65E5\u5143 JPY",
      // 申请状态
      draft: "\u8349\u7A3F Draft",
      submitted: "\u5DF2\u63D0\u4EA4 Submitted",
      approved: "\u5DF2\u6279\u51C6 Approved",
      rejected: "\u5DF2\u62D2\u7EDD Rejected"
    };
    translate = (key) => {
      if (!key) return "N/A";
      return translations[key] || key;
    };
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  generateVerificationCode: () => generateVerificationCode,
  sendApprovalNotificationEmail: () => sendApprovalNotificationEmail,
  sendCustomerConfirmationEmail: () => sendCustomerConfirmationEmail,
  sendEmail: () => sendEmail,
  sendFinalApprovalNotificationEmail: () => sendFinalApprovalNotificationEmail,
  sendFirstApprovalNotificationEmail: () => sendFirstApprovalNotificationEmail,
  sendInternalNotificationEmail: () => sendInternalNotificationEmail,
  sendPasswordResetEmail: () => sendPasswordResetEmail,
  sendRejectionNotificationEmail: () => sendRejectionNotificationEmail,
  sendReturnNotificationEmail: () => sendReturnNotificationEmail,
  sendVerificationCode: () => sendVerificationCode
});
import { Resend } from "resend";
async function sendVerificationCode(to2, code) {
  if (!resend || !apiKey) {
    throw new Error("Resend API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  try {
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: to2,
      subject: "\u8AA0\u6E2F\u91D1\u878D - \u90F5\u7BB1\u9A57\u8B49\u78BC",
      text: `\u60A8\u7684\u9A57\u8B49\u78BC\u662F\uFF1A${code}\uFF0C\u6709\u6548\u671F\u70BA5\u5206\u9418\u3002\u8ACB\u52FF\u5C07\u6B64\u9A57\u8B49\u78BC\u544A\u8A34\u4ED6\u4EBA\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">\u8AA0\u6E2F\u91D1\u878D</h2>
          <p>\u60A8\u597D\uFF0C</p>
          <p>\u60A8\u6B63\u5728\u9032\u884C\u90F5\u7BB1\u9A57\u8B49\uFF0C\u60A8\u7684\u9A57\u8B49\u78BC\u662F\uFF1A</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #dc2626; font-weight: bold;">\u6B64\u9A57\u8B49\u78BC\u6709\u6548\u671F\u70BA5\u5206\u9418\uFF0C\u8ACB\u52FF\u5C07\u6B64\u9A57\u8B49\u78BC\u544A\u8A34\u4ED6\u4EBA\u3002</p>
          <p>\u5982\u679C\u60A8\u6C92\u6709\u8ACB\u6C42\u6B64\u9A57\u8B49\u78BC\uFF0C\u8ACB\u5FFD\u7565\u6B64\u90F5\u4EF6\u3002</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u56DE\u8986\u3002</p>
        </div>
      `
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    console.log(`Verification code sent to ${to2}, id: ${data?.id}`);
    return true;
  } catch (error) {
    console.error("Resend error:", error);
    return false;
  }
}
function generateVerificationCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
async function sendViaResend(to2, subject2, html2) {
  if (!resend || !apiKey) {
    throw new Error("Resend API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  try {
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: to2,
      subject: subject2,
      html: html2
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    console.log(`Email sent to ${to2}, id: ${data?.id}`);
    return true;
  } catch (error) {
    console.error("Resend error:", error);
    return false;
  }
}
async function sendCustomerConfirmationEmail(to2, applicationNumber, customerName, customerGender, pdfUrl) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  try {
    const msg = {
      to: to2,
      from: senderEmail,
      subject: `\u8AA0\u6E2F\u91D1\u878D - \u958B\u6236\u7533\u8ACB\u78BA\u8A8D\u51FD (\u7533\u8ACB\u7DE8\u865F\uFF1A${applicationNumber})`,
      text: `\u5C0A\u656C\u7684${customerName}${customerGender === "male" ? "\u5148\u751F" : customerGender === "female" ? "\u5973\u58EB" : "\u5148\u751F/\u5973\u58EB"}\uFF0C

\u611F\u8B1D\u60A8\u9078\u64C7\u8AA0\u6E2F\u91D1\u878D\u80A1\u4EFD\u6709\u9650\u516C\u53F8\u3002

\u6211\u5011\u5DF2\u6536\u5230\u60A8\u7684\u958B\u6236\u7533\u8ACB\uFF08\u7533\u8ACB\u7DE8\u865F\uFF1A${applicationNumber}\uFF09\u3002\u60A8\u7684\u7533\u8ACB\u8CC7\u6599\u5DF2\u63D0\u4EA4\u6210\u529F\uFF0C\u6211\u5011\u7684\u5BA2\u6236\u670D\u52D9\u5718\u968A\u5C07\u57281-2\u500B\u5DE5\u4F5C\u65E5\u5167\u5BE9\u6838\u60A8\u7684\u7533\u8ACB\u4E26\u8207\u60A8\u806F\u7E6B\u3002

\u8ACB\u67E5\u95B1\u9644\u4EF6\u4E2D\u7684\u7533\u8ACB\u8868PDF\u6587\u4EF6\uFF0C\u78BA\u8A8D\u60A8\u63D0\u4EA4\u7684\u6240\u6709\u4FE1\u606F\u6E96\u78BA\u7121\u8AA4\u3002\u5982\u6709\u4EFB\u4F55\u7591\u554F\u6216\u9700\u8981\u4FEE\u6539\uFF0C\u8ACB\u53CA\u6642\u8207\u6211\u5011\u806F\u7E6B\u3002

\u91CD\u8981\u63D0\u793A\uFF1A
- \u8ACB\u59A5\u5584\u4FDD\u7BA1\u60A8\u7684\u7533\u8ACB\u7DE8\u865F\uFF0C\u4EE5\u4FBF\u65E5\u5F8C\u67E5\u8A62
- \u6211\u5011\u53EF\u80FD\u6703\u901A\u904E\u96FB\u8A71\u6216\u90F5\u4EF6\u8207\u60A8\u806F\u7E6B\uFF0C\u4EE5\u6838\u5BE6\u90E8\u5206\u4FE1\u606F
- \u8ACB\u78BA\u4FDD\u60A8\u63D0\u4F9B\u7684\u806F\u7E6B\u65B9\u5F0F\u66A2\u901A

\u5982\u6709\u4EFB\u4F55\u7591\u554F\uFF0C\u6B61\u8FCE\u96A8\u6642\u806F\u7CFB\u6211\u5011\uFF1A
\u96FB\u8A71\uFF1A852-2598-1700
\u90F5\u7BB1\uFF1Aonboarding@cmfinancial.com

\u6B64\u81F4
\u8AA0\u6E2F\u91D1\u878D\u80A1\u4EFD\u6709\u9650\u516C\u53F8
\u5BA2\u6236\u670D\u52D9\u90E8

---
\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u56DE\u8986\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin-bottom: 20px;">\u8AA0\u6E2F\u91D1\u878D\u80A1\u4EFD\u6709\u9650\u516C\u53F8</h2>
            <h3 style="color: #1f2937; margin-bottom: 20px;">\u958B\u6236\u7533\u8ACB\u78BA\u8A8D\u51FD</h3>
            
            <p style="color: #374151;">\u5C0A\u656C\u7684 <strong>${customerName}</strong> ${customerGender === "male" ? "\u5148\u751F" : customerGender === "female" ? "\u5973\u58EB" : "\u5148\u751F/\u5973\u58EB"}\uFF0C</p>
            
            <p style="color: #374151; line-height: 1.6;">
              \u611F\u8B1D\u60A8\u9078\u64C7\u8AA0\u6E2F\u91D1\u878D\u80A1\u4EFD\u6709\u9650\u516C\u53F8\u3002
            </p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>\u7533\u8ACB\u7DE8\u865F\uFF1A</strong>${applicationNumber}
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              \u6211\u5011\u5DF2\u6536\u5230\u60A8\u7684\u958B\u6236\u7533\u8ACB\u3002\u60A8\u7684\u7533\u8ACB\u8CC7\u6599\u5DF2\u63D0\u4EA4\u6210\u529F\uFF0C\u6211\u5011\u7684\u5BA2\u6236\u670D\u52D9\u5718\u968A\u5C07\u5728<strong>1-2\u500B\u5DE5\u4F5C\u65E5\u5167</strong>\u5BE9\u6838\u60A8\u7684\u7533\u8ACB\u4E26\u8207\u60A8\u806F\u7E6B\u3002
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
              \u8ACB\u67E5\u95B1\u9644\u4EF6\u4E2D\u7684\u7533\u8ACB\u8868PDF\u6587\u4EF6\uFF0C\u78BA\u8A8D\u60A8\u63D0\u4EA4\u7684\u6240\u6709\u4FE1\u606F\u6E96\u78BA\u7121\u8AA4\u3002\u5982\u6709\u4EFB\u4F55\u7591\u554F\u6216\u9700\u8981\u4FEE\u6539\uFF0C\u8ACB\u53CA\u6642\u8207\u6211\u5011\u806F\u7E6B\u3002
            </p>
            
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">\u91CD\u8981\u63D0\u793A\uFF1A</p>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>\u8ACB\u59A5\u5584\u4FDD\u7BA1\u60A8\u7684\u7533\u8ACB\u7DE8\u865F\uFF0C\u4EE5\u4FBF\u65E5\u5F8C\u67E5\u8A62</li>
                <li>\u6211\u5011\u53EF\u80FD\u6703\u901A\u904E\u96FB\u8A71\u6216\u90F5\u4EF6\u8207\u60A8\u806F\u7E6B\uFF0C\u4EE5\u6838\u5BE6\u90E8\u5206\u4FE1\u606F</li>
                <li>\u8ACB\u78BA\u4FDD\u60A8\u63D0\u4F9B\u7684\u806F\u7E6B\u65B9\u5F0F\u66A2\u901A</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 5px 0;">\u5982\u6709\u4EFB\u4F55\u7591\u554F\uFF0C\u6B61\u8FCE\u96A8\u6642\u806F\u7E6B\u6211\u5011\uFF1A</p>
              <p style="color: #6b7280; margin: 5px 0;">\u96FB\u8A71\uFF1A852-2598-1700</p>
              <p style="color: #6b7280; margin: 5px 0;">\u90F5\u7BB1\uFF1Aonboarding@cmfinancial.com</p>
            </div>
            
            <div style="margin-top: 30px;">
              <p style="color: #374151; margin: 5px 0;">\u6B64\u81F4</p>
              <p style="color: #374151; margin: 5px 0; font-weight: bold;">\u8AA0\u6E2F\u91D1\u878D\u80A1\u4EFD\u6709\u9650\u516C\u53F8</p>
              <p style="color: #6b7280; margin: 5px 0;">\u5BA2\u6236\u670D\u52D9\u90E8</p>
            </div>
          </div>
          
          ${pdfUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              \u4E0B\u8F09\u7533\u8ACB\u8868PDF / Download Application PDF
            </a>
          </div>
          ` : ""}
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            \u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u56DE\u8986\u3002
          </p>
        </div>
      `
    };
    console.log(`[Customer Email] Preparing to send email to ${to2}`);
    console.log(`[Customer Email] PDF URL: ${pdfUrl || "Not provided"}`);
    try {
      await sendViaResend(to2, subject, html);
      console.log(`Customer confirmation email sent to ${to2} with PDF download link`);
      return true;
    } catch (error) {
      console.error("SendGrid error:", error);
      if (error.response) {
        console.error("SendGrid response:", error.response.body);
      }
      return false;
    }
  } catch (error) {
    console.error("Error in sendCustomerConfirmationEmail:", error);
    return false;
  }
}
async function sendInternalNotificationEmail(applicationNumber, customerName, customerEmail, pdfUrl) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  try {
    const msg = {
      to: "onboarding@cmfinancial.com",
      from: senderEmail,
      subject: `\u65B0\u958B\u6236\u7533\u8ACB - ${applicationNumber} (${customerName})`,
      text: `\u65B0\u958B\u6236\u7533\u8ACB\u901A\u77E5

\u7533\u8ACB\u7DE8\u865F\uFF1A${applicationNumber}
\u5BA2\u6236\u59D3\u540D\uFF1A${customerName}
\u5BA2\u6236\u90F5\u7BB1\uFF1A${customerEmail}
\u63D0\u4EA4\u6642\u9593\uFF1A${(/* @__PURE__ */ new Date()).toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })}

\u8ACB\u67E5\u95B1\u9644\u4EF6\u4E2D\u7684\u7533\u8ACB\u8868PDF\u6587\u4EF6\uFF0C\u4E26\u76E1\u5FEB\u8655\u7406\u6B64\u7533\u8ACB\u3002

---
\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">\u65B0\u958B\u6236\u7533\u8ACB\u901A\u77E5</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>\u7533\u8ACB\u7DE8\u865F\uFF1A</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${applicationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>\u5BA2\u6236\u59D3\u540D\uFF1A</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>\u5BA2\u6236\u90F5\u7BB1\uFF1A</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>\u63D0\u4EA4\u6642\u9593\uFF1A</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${(/* @__PURE__ */ new Date()).toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #374151;">\u8ACB\u67E5\u95B1\u9644\u4EF6\u4E2D\u7684\u7533\u8ACB\u8868PDF\u6587\u4EF6\uFF0C\u4E26\u76E1\u5FEB\u8655\u7406\u6B64\u7533\u8ACB\u3002</p>
          
          ${pdfUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              \u4E0B\u8F09\u7533\u8ACB\u8868PDF / Download Application PDF
            </a>
          </div>
          ` : ""}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\u3002</p>
        </div>
      `
    };
    console.log(`[Internal Email] Preparing to send email to onboarding@cmfinancial.com`);
    console.log(`[Internal Email] PDF URL: ${pdfUrl || "Not provided"}`);
    await sendViaResend(to, subject, html);
    console.log(`Internal notification email sent to onboarding@cmfinancial.com with PDF download link`);
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("SendGrid response:", error.response.body);
    }
    return false;
  }
}
async function sendApprovalNotificationEmail(applicationNumber, customerName, approverName, isProfessionalInvestor, approvedRiskProfile) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  const complianceEmail = "compliance@cmfinancial.com";
  const operationEmail = "operation@cmfinancial.com";
  const riskMap = {
    "low": "\u4F4E\u98CE\u9669",
    "medium": "\u4E2D\u7B49\u98CE\u9669",
    "high": "\u9AD8\u98CE\u9669"
  };
  try {
    const msg = {
      to: operationEmail,
      from: complianceEmail,
      // 使用compliance@cmfinancial.com作为发件人
      subject: `\u5F00\u6237\u7533\u8BF7\u5DF2\u6279\u51C6 - ${applicationNumber}`,
      text: `\u7533\u8BF7\u7F16\u53F7\uFF1A${applicationNumber}
\u5BA2\u6237\u59D3\u540D\uFF1A${customerName}
\u5BA1\u6279\u4EBA\u5458\uFF1A${approverName}
\u5BA1\u6279\u7ED3\u679C\uFF1A\u6279\u51C6
\u4E13\u4E1A\u6295\u8D44\u8005\uFF08PI\uFF09\uFF1A${isProfessionalInvestor ? "\u662F" : "\u5426"}
\u98CE\u9669\u8BC4\u7EA7\uFF1A${riskMap[approvedRiskProfile] || approvedRiskProfile}

\u8BF7\u8FD0\u8425\u90E8\u95E8\u8DDF\u8FDB\u540E\u7EED\u5F00\u6237\u6D41\u7A0B\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">\u5F00\u6237\u7533\u8BF7\u5DF2\u6279\u51C6</h2>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">\u7533\u8BF7\u7F16\u53F7\uFF1A${applicationNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA2\u6237\u59D3\u540D\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA1\u6279\u4EBA\u5458\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA1\u6279\u7ED3\u679C\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #16a34a; font-weight: bold;">\u6279\u51C6</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u4E13\u4E1A\u6295\u8D44\u8005\uFF08PI\uFF09\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${isProfessionalInvestor ? "\u662F" : "\u5426"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u98CE\u9669\u8BC4\u7EA7\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${riskMap[approvedRiskProfile] || approvedRiskProfile}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">\u8BF7\u8FD0\u8425\u90E8\u95E8\u8DDF\u8FDB\u540E\u7EED\u5F00\u6237\u6D41\u7A0B\u3002</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">\u6B64\u90AE\u4EF6\u7531\u5408\u89C4\u90E8\u95E8\u81EA\u52A8\u53D1\u9001\u3002</p>
        </div>
      `
    };
    await sendViaResend(to, subject, html);
    console.log(`Approval notification sent to ${operationEmail} for application ${applicationNumber}`);
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("SendGrid response:", error.response.body);
    }
    return false;
  }
}
async function sendRejectionNotificationEmail(applicationNumber, customerName, customerEmail, approverName, rejectReason) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  const complianceEmail = "compliance@cmfinancial.com";
  const customerServiceEmail = "onboard@cmfinancial.com";
  try {
    const msg = {
      to: [customerEmail, customerServiceEmail],
      // 同时发送给客户和客服部
      from: complianceEmail,
      // 使用compliance@cmfinancial.com作为发件人
      subject: `\u5F00\u6237\u7533\u8BF7\u5DF2\u62D2\u7EDD - ${applicationNumber}`,
      text: `\u7533\u8BF7\u7F16\u53F7\uFF1A${applicationNumber}
\u5BA2\u6237\u59D3\u540D\uFF1A${customerName}
\u5BA2\u6237\u90AE\u7BB1\uFF1A${customerEmail}
\u5BA1\u6279\u4EBA\u5458\uFF1A${approverName}
\u5BA1\u6279\u7ED3\u679C\uFF1A\u62D2\u7EDD
\u62D2\u7EDD\u7406\u7531\uFF1A${rejectReason}

\u8BF7\u5BA2\u6237\u670D\u52A1\u90E8\u95E8\u901A\u77E5\u5BA2\u6237\u5E76\u63D0\u4F9B\u5FC5\u8981\u7684\u8BF4\u660E\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">\u5F00\u6237\u7533\u8BF7\u5DF2\u62D2\u7EDD</h2>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">\u7533\u8BF7\u7F16\u53F7\uFF1A${applicationNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA2\u6237\u59D3\u540D\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA2\u6237\u90AE\u7BB1\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA1\u6279\u4EBA\u5458\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA1\u6279\u7ED3\u679C\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">\u62D2\u7EDD</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">\u62D2\u7EDD\u7406\u7531\uFF1A</p>
            <p style="margin: 10px 0 0 0;">${rejectReason}</p>
          </div>
          <p style="margin-top: 20px;">\u8BF7\u5BA2\u6237\u670D\u52A1\u90E8\u95E8\u901A\u77E5\u5BA2\u6237\u5E76\u63D0\u4F9B\u5FC5\u8981\u7684\u8BF4\u660E\u3002</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">\u6B64\u90AE\u4EF6\u7531\u5408\u89C4\u90E8\u95E8\u81EA\u52A8\u53D1\u9001\u3002</p>
        </div>
      `
    };
    await sendViaResend(to, subject, html);
    console.log(`Rejection notification sent to ${customerServiceEmail} for application ${applicationNumber}`);
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("SendGrid response:", error.response.body);
    }
    return false;
  }
}
async function sendReturnNotificationEmail(applicationNumber, customerName, customerEmail, approverName, returnReason) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  const complianceEmail = "compliance@cmfinancial.com";
  const customerServiceEmail = "onboard@cmfinancial.com";
  try {
    const msg = {
      to: [customerEmail, customerServiceEmail],
      // 同时发送给客户和客服部
      from: complianceEmail,
      // 使用compliance@cmfinancial.com作为发件人
      subject: `\u5F00\u6237\u7533\u8BF7\u9700\u8865\u5145\u6750\u6599 - ${applicationNumber}`,
      text: `\u7533\u8BF7\u7F16\u53F7\uFF1A${applicationNumber}
\u5BA2\u6237\u59D3\u540D\uFF1A${customerName}
\u5BA2\u6237\u90AE\u7BB1\uFF1A${customerEmail}
\u5BA1\u6279\u4EBA\u5458\uFF1A${approverName}
\u5BA1\u6279\u7ED3\u679C\uFF1A\u9000\u56DE\u8865\u5145\u6750\u6599
\u9000\u56DE\u7406\u7531\uFF1A${returnReason}

\u8BF7\u5BA2\u6237\u670D\u52A1\u90E8\u95E8\u901A\u77E5\u5BA2\u6237\u8865\u5145\u6240\u9700\u6750\u6599\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ea580c;">\u5F00\u6237\u7533\u8BF7\u9700\u8865\u5145\u6750\u6599</h2>
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">\u7533\u8BF7\u7F16\u53F7\uFF1A${applicationNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA2\u6237\u59D3\u540D\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA2\u6237\u90AE\u7BB1\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA1\u6279\u4EBA\u5458\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>\u5BA1\u6279\u7ED3\u679C\uFF1A</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #ea580c; font-weight: bold;">\u9000\u56DE\u8865\u5145\u6750\u6599</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">\u9700\u8981\u8865\u5145\u7684\u6750\u6599\uFF1A</p>
            <p style="margin: 10px 0 0 0;">${returnReason}</p>
          </div>
          <p style="margin-top: 20px;">\u8BF7\u5BA2\u6237\u670D\u52A1\u90E8\u95E8\u901A\u77E5\u5BA2\u6237\u8865\u5145\u6240\u9700\u6750\u6599\u3002</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">\u6B64\u90AE\u4EF6\u7531\u5408\u89C4\u90E8\u95E8\u81EA\u52A8\u53D1\u9001\u3002</p>
        </div>
      `
    };
    await sendViaResend(to, subject, html);
    console.log(`Return notification sent to ${customerServiceEmail} for application ${applicationNumber}`);
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("SendGrid response:", error.response.body);
    }
    return false;
  }
}
async function sendPasswordResetEmail(to2, resetLink) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  try {
    const msg = {
      to: to2,
      from: senderEmail,
      subject: "\u8AA0\u6E2F\u91D1\u878D - \u5BC6\u78BC\u91CD\u7F6E",
      text: `\u60A8\u597D\uFF0C

\u6211\u5011\u6536\u5230\u4E86\u60A8\u7684\u5BC6\u78BC\u91CD\u7F6E\u8ACB\u6C42\u3002\u8ACB\u9EDE\u64CA\u4EE5\u4E0B\u93C8\u63A5\u91CD\u7F6E\u60A8\u7684\u5BC6\u78BC\uFF1A

${resetLink}

\u6B64\u93C8\u63A5\u5C07\u57281\u5C0F\u6642\u5F8C\u904E\u671F\u3002\u5982\u679C\u60A8\u6C92\u6709\u8ACB\u6C42\u91CD\u7F6E\u5BC6\u78BC\uFF0C\u8ACB\u5FFD\u7565\u6B64\u90F5\u4EF6\u3002

\u8AA0\u6E2F\u91D1\u878D\u80A1\u4EFD\u6709\u9650\u516C\u53F8
\u5BA2\u6236\u670D\u52D9\u5718\u968A`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">\u8AA0\u6E2F\u91D1\u878D</h2>
          <p>\u60A8\u597D\uFF0C</p>
          <p>\u6211\u5011\u6536\u5230\u4E86\u60A8\u7684\u5BC6\u78BC\u91CD\u7F6E\u8ACB\u6C42\u3002\u8ACB\u9EDE\u64CA\u4EE5\u4E0B\u6309\u9215\u91CD\u7F6E\u60A8\u7684\u5BC6\u78BC\uFF1A</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">\u91CD\u7F6E\u5BC6\u78BC</a>
          </div>
          <p>\u6216\u8907\u88FD\u4EE5\u4E0B\u93C8\u63A5\u5230\u700F\u89BD\u5668\uFF1A</p>
          <p style="background-color: #f3f4f6; padding: 10px; word-break: break-all; font-size: 12px;">${resetLink}</p>
          <p style="color: #dc2626; font-weight: bold;">\u6B64\u93C8\u63A5\u5C07\u57281\u5C0F\u6642\u5F8C\u904E\u671F\u3002</p>
          <p>\u5982\u679C\u60A8\u6C92\u6709\u8ACB\u6C42\u91CD\u7F6E\u5BC6\u78BC\uFF0C\u8ACB\u5FFD\u7565\u6B64\u90F5\u4EF6\u3002\u60A8\u7684\u5BC6\u78BC\u5C07\u4FDD\u6301\u4E0D\u8B8A\u3002</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            \u8AA0\u6E2F\u91D1\u878D\u80A1\u4EFD\u6709\u9650\u516C\u53F8<br>
            \u5BA2\u6236\u670D\u52D9\u5718\u968A<br>
            \u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u56DE\u8986\u3002
          </p>
        </div>
      `
    };
    await sendViaResend(to2, subject, html);
    console.log(`Password reset email sent to ${to2}`);
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("SendGrid response:", error.response.body);
    }
    return false;
  }
}
async function sendFirstApprovalNotificationEmail(applicationNumber, customerName, firstApproverName, firstApproverCeNo, isProfessionalInvestor, approvedRiskProfile) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u9470\u672A\u914D\u7F6E");
  }
  const complianceEmail = "compliance@cmfinancial.com";
  const riskMap = {
    "low": "\u4F4E\u98A8\u96AA",
    "medium": "\u4E2D\u7B49\u98A8\u96AA",
    "high": "\u9AD8\u98A8\u96AA"
  };
  try {
    const msg = {
      to: complianceEmail,
      from: senderEmail,
      subject: `\u3010\u5F85\u7D42\u5BE9\u3011\u958B\u6236\u7533\u8ACB\u7B2C\u4E00\u7D1A\u5BE9\u6279\u5DF2\u901A\u904E - ${applicationNumber}`,
      text: `\u7533\u8ACB\u7DE8\u865F\uFF1A${applicationNumber}
\u5BA2\u6236\u59D3\u540D\uFF1A${customerName}
\u7B2C\u4E00\u7D1A\u5BE9\u6279\u4EBA\u54E1\uFF1A${firstApproverName}\uFF08CE No.: ${firstApproverCeNo}\uFF09
\u5BE9\u6279\u7D50\u679C\uFF1A\u7B2C\u4E00\u7D1A\u5BE9\u6279\u901A\u904E
\u5C08\u696D\u6295\u8CC7\u8005\uFF08PI\uFF09\uFF1A${isProfessionalInvestor ? "\u662F" : "\u5426"}
\u98A8\u96AA\u8A55\u7D1A\uFF1A${riskMap[approvedRiskProfile] || approvedRiskProfile}

\u8ACB\u767B\u9304\u7CFB\u7D71\u9032\u884C\u7B2C\u4E8C\u7D1A\u5BE9\u6279\uFF08\u7D42\u5BE9\uFF09\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">\u8AA0\u6E2F\u91D1\u878D - \u958B\u6236\u7533\u8ACB\u7B2C\u4E00\u7D1A\u5BE9\u6279\u901A\u904E\u901A\u77E5</h2>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">\u26A0\uFE0F \u6B64\u7533\u8ACB\u9700\u8981\u60A8\u9032\u884C\u7B2C\u4E8C\u7D1A\u5BE9\u6279\uFF08\u7D42\u5BE9\uFF09</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u7533\u8ACB\u7DE8\u865F\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u5BA2\u6236\u59D3\u540D\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u7B2C\u4E00\u7D1A\u5BE9\u6279\u4EBA\u54E1\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${firstApproverName}\uFF08CE No.: ${firstApproverCeNo}\uFF09</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u5BE9\u6279\u7D50\u679C\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><span style="color: #10b981; font-weight: bold;">\u2713 \u7B2C\u4E00\u7D1A\u5BE9\u6279\u901A\u904E</span></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u5C08\u696D\u6295\u8CC7\u8005\uFF08PI\uFF09\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${isProfessionalInvestor ? "\u662F" : "\u5426"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u98A8\u96AA\u8A55\u7D1A\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${riskMap[approvedRiskProfile] || approvedRiskProfile}</td>
            </tr>
          </table>
          <p style="margin: 20px 0;">\u8ACB\u767B\u9304\u7CFB\u7D71\u67E5\u770B\u5B8C\u6574\u7533\u8ACB\u8CC7\u6599\u4E26\u9032\u884C\u7B2C\u4E8C\u7D1A\u5BE9\u6279\uFF08\u7D42\u5BE9\uFF09\u3002</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u56DE\u8986\u3002</p>
        </div>
      `
    };
    await sendViaResend(to, subject, html);
    console.log(`First approval notification sent to ${complianceEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send first approval notification email:", error);
    if (error.response) {
      console.error("SendGrid error response:", error.response.body);
    }
    return false;
  }
}
async function sendFinalApprovalNotificationEmail(applicationNumber, customerName, firstApproverName, firstApproverCeNo, secondApproverName, secondApproverCeNo, isProfessionalInvestor, approvedRiskProfile, finalPdfUrl) {
  if (!apiKey) {
    throw new Error("SendGrid API\u5BC6\u9470\u672A\u914D\u7F6E");
  }
  const operationEmail = "operation@cmfinancial.com";
  const customerServiceEmail = "onboard@cmfinancial.com";
  const riskMap = {
    "low": "\u4F4E\u98A8\u96AA",
    "medium": "\u4E2D\u7B49\u98A8\u96AA",
    "high": "\u9AD8\u98A8\u96AA",
    "R1": "R1 - \u4F4E\u98A8\u96AA",
    "R2": "R2 - \u4E2D\u4F4E\u98A8\u96AA",
    "R3": "R3 - \u4E2D\u98A8\u96AA",
    "R4": "R4 - \u4E2D\u9AD8\u98A8\u96AA",
    "R5": "R5 - \u9AD8\u98A8\u96AA"
  };
  try {
    const msg = {
      to: operationEmail,
      cc: customerServiceEmail,
      from: senderEmail,
      subject: `\u3010\u5DF2\u6279\u51C6\u3011\u958B\u6236\u7533\u8ACB\u6700\u7D42\u5BE9\u6279\u901A\u904E - ${applicationNumber}`,
      text: `\u7533\u8ACB\u7DE8\u865F\uFF1A${applicationNumber}
\u5BA2\u6236\u59D3\u540D\uFF1A${customerName}
\u7B2C\u4E00\u7D1A\u5BE9\u6279\u4EBA\u54E1\uFF1A${firstApproverName}\uFF08CE No.: ${firstApproverCeNo}\uFF09
\u7B2C\u4E8C\u7D1A\u5BE9\u6279\u4EBA\u54E1\uFF1A${secondApproverName}${secondApproverCeNo ? `\uFF08CE No.: ${secondApproverCeNo}\uFF09` : ""}
\u5BE9\u6279\u7D50\u679C\uFF1A\u6700\u7D42\u6279\u51C6
\u5C08\u696D\u6295\u8CC7\u8005\uFF08PI\uFF09\uFF1A${isProfessionalInvestor ? "\u662F" : "\u5426"}
\u98A8\u96AA\u8A55\u7D1A\uFF1A${riskMap[approvedRiskProfile] || approvedRiskProfile}

\u8ACB\u9032\u884C\u5F8C\u7E8C\u7684\u958B\u7ACB\u8CEC\u6236\u548C\u767C\u9001Welcome letter\u7684\u6B65\u9A5F\u3002`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">\u8AA0\u6E2F\u91D1\u878D - \u958B\u6236\u7533\u8ACB\u6700\u7D42\u5BE9\u6279\u901A\u904E\u901A\u77E5</h2>
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #065f46;">\u2713 \u6B64\u7533\u8ACB\u5DF2\u901A\u904E\u5169\u7D1A\u5BE9\u6279\uFF0C\u53EF\u4EE5\u9032\u884C\u5F8C\u7E8C\u958B\u6236\u64CD\u4F5C</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u7533\u8ACB\u7DE8\u865F\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u5BA2\u6236\u59D3\u540D\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u7B2C\u4E00\u7D1A\u5BE9\u6279\u4EBA\u54E1\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${firstApproverName}\uFF08CE No.: ${firstApproverCeNo}\uFF09</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u7B2C\u4E8C\u7D1A\u5BE9\u6279\u4EBA\u54E1\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${secondApproverName}${secondApproverCeNo ? `\uFF08CE No.: ${secondApproverCeNo}\uFF09` : ""}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u5BE9\u6279\u7D50\u679C\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><span style="color: #10b981; font-weight: bold;">\u2713 \u6700\u7D42\u6279\u51C6</span></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u5C08\u696D\u6295\u8CC7\u8005\uFF08PI\uFF09\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${isProfessionalInvestor ? "\u662F" : "\u5426"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\u98A8\u96AA\u8A55\u7D1A\uFF1A</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${riskMap[approvedRiskProfile] || approvedRiskProfile}</td>
            </tr>
          </table>
          <p style="margin: 20px 0;">\u8ACB\u9032\u884C\u5F8C\u7E8C\u7684\u958B\u7ACB\u8CEC\u6236\u548C\u767C\u9001Welcome letter\u7684\u6B65\u9A5F\u3002</p>
          ${finalPdfUrl ? `
          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">\u6700\u7D42\u7248PDF\u6587\u4EF6\uFF1A</p>
            <a href="${finalPdfUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">\u4E0B\u8F09\u6700\u7D42\u7248PDF</a>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">\u6B64PDF\u5305\u542B\u5BA2\u6236\u63D0\u4EA4\u3001\u521D\u5BE9\u548C\u7D42\u5BE9\u7684\u5B8C\u6574\u4FE1\u606F\uFF0C\u7528\u65BC\u5167\u90E8\u5B58\u6A94\u3002</p>
          </div>
          ` : ""}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u56DE\u8986\u3002</p>
        </div>
      `
    };
    await sendViaResend(to, subject, html);
    console.log(`Final approval notification sent to ${operationEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send final approval notification email:", error);
    if (error.response) {
      console.error("SendGrid error response:", error.response.body);
    }
    return false;
  }
}
async function sendEmail({
  to: to2,
  subject: subject2,
  html: html2
}) {
  if (!resend || !apiKey) {
    throw new Error("Resend API\u5BC6\u94A5\u672A\u914D\u7F6E");
  }
  try {
    await sendViaResend(to2, subject2, html2);
    console.log(`Generic email sent to ${to2}`);
    return true;
  } catch (error) {
    console.error("Resend error:", error);
    return false;
  }
}
var apiKey, senderEmail, resend;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
    senderEmail = process.env.RESEND_SENDER_EMAIL || process.env.SENDGRID_SENDER_EMAIL || "quote@cmf-otc.com";
    resend = apiKey ? new Resend(apiKey) : null;
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not set");
    } else {
      console.log(`Resend initialized with sender: ${senderEmail}`);
    }
  }
});

// server/password.ts
var password_exports = {};
__export(password_exports, {
  generateResetLink: () => generateResetLink,
  generateResetToken: () => generateResetToken,
  hashPassword: () => hashPassword,
  verifyPassword: () => verifyPassword
});
import bcrypt2 from "bcryptjs";
import crypto2 from "crypto";
async function hashPassword(password) {
  const salt = await bcrypt2.genSalt(10);
  return bcrypt2.hash(password, salt);
}
async function verifyPassword(password, hash) {
  return bcrypt2.compare(password, hash);
}
function generateResetToken() {
  return crypto2.randomBytes(32).toString("hex");
}
function generateResetLink(token, baseUrl) {
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/reset-password?token=${token}`;
}
var init_password = __esm({
  "server/password.ts"() {
    "use strict";
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/oauth.ts
init_const();
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
    maxAge: 7 * 24 * 60 * 60 * 1e3
    // 7天
  };
}

// server/_core/oauth.ts
init_sdk();
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
function registerOAuthRoutes(app) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const openId = nanoid();
      await upsertUser({
        openId,
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        loginMethod: "local",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const user = await getUserByOpenId(openId);
      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      let user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      } else {
        return res.status(401).json({ error: "Please use forgot password to set a new password." });
      }
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user });
    } catch {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}

// server/_core/index.ts
init_files();

// server/routers.ts
init_const();

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
init_const();
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
init_storage();
init_pdf_generator();
init_email();
import { z as z2 } from "zod";
import { nanoid as nanoid2 } from "nanoid";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    // 发送邮箱验证码
    sendVerificationCode: publicProcedure.input(z2.object({
      email: z2.string().email(),
      isApprover: z2.boolean().optional()
      // 标记是否为审批人员注册
    })).mutation(async ({ input }) => {
      if (input.isApprover && !input.email.endsWith("@cmfinancial.com")) {
        throw new Error("\u5BA1\u6279\u4EBA\u5458\u5FC5\u987B\u4F7F\u7528@cmfinancial.com\u90AE\u7BB1");
      }
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1e3);
      await saveVerificationCode(input.email, code, expiresAt);
      const bypassEmail = process.env.BYPASS_EMAIL === "true";
      if (!bypassEmail) {
        const sent = await sendVerificationCode(input.email, code);
        if (!sent) {
          throw new Error("\u90AE\u4EF6\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
        }
      } else {
        console.log(`[BYPASS] Verification code for ${input.email}: ${code}`);
      }
      console.log(`[Verification Code] Sent to ${input.email}`);
      return { success: true, message: "\u9A8C\u8BC1\u7801\u5DF2\u53D1\u9001\u81F3\u60A8\u7684\u90AE\u7BB1" };
    }),
    // 验证邮箱验证码
    verifyCode: publicProcedure.input(z2.object({
      email: z2.string().email(),
      code: z2.string().length(6)
    })).mutation(async ({ input, ctx }) => {
      const verified = await verifyEmailCode(input.email, input.code);
      if (!verified) {
        throw new Error("\u9A8C\u8BC1\u7801\u65E0\u6548\u6216\u5DF2\u8FC7\u671F");
      }
      let user = await getUserByEmail(input.email);
      if (!user) {
        await upsertUser({
          openId: input.email,
          // 使用邮箱作为openId
          email: input.email,
          name: input.email.split("@")[0],
          // 使用邮箱前缀作为姓名
          loginMethod: "email",
          lastSignedIn: /* @__PURE__ */ new Date()
        });
        user = await getUserByEmail(input.email);
      }
      if (!user) {
        throw new Error("\u521B\u5EFA\u7528\u6237\u5931\u8D25");
      }
      await updateUserEmailVerified(user.id, true);
      const isCompanyEmail = input.email.endsWith("@cmfinancial.com");
      if (isCompanyEmail && user.role !== "admin") {
        await updateUserRole(user.id, "admin");
      }
      if (isCompanyEmail) {
        const approver = await getApproverByUserId(user.id);
        if (!approver) {
          await addApprover({
            userId: user.id,
            employeeName: user.name || input.email.split("@")[0],
            ceNumber: "TBD",
            role: "manager"
          });
        }
      }
      const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
      const sessionToken = await sdk2.createSessionToken(user.openId, {
        name: user.name || user.email || ""
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
      return { success: true };
    })
  }),
  // 申请管理
  application: router({
    // 创建新申请
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const applicationId = await createApplication(ctx.user.id);
      return { applicationId };
    }),
    // 获取用户的所有申请
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserApplications(ctx.user.id);
    }),
    // 获取申请详情
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.id);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return application;
    }),
    // 获取完整申请数据
    getComplete: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.id);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getCompleteApplicationData(input.id);
    }),
    // 生成申请编号
    generateNumber: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      const application = await getApplicationById(input.id);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const applicationNumber = await assignApplicationNumber(input.id);
      return { applicationNumber };
    }),
    // 提交申请
    submit: protectedProcedure.input(z2.object({
      id: z2.number(),
      signatureName: z2.string(),
      signatureData: z2.string()
    })).mutation(async ({ input, ctx }) => {
      console.log("\n========== SUBMIT API CALLED ==========");
      console.log("[Submit] Application ID:", input.id);
      console.log("[Submit] Signature Name:", input.signatureName);
      console.log("[Submit] User:", ctx.user.openId);
      const application = await getApplicationById(input.id);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      let applicationNumber = application.applicationNumber;
      if (!applicationNumber) {
        applicationNumber = await assignApplicationNumber(input.id);
      }
      await submitApplication(input.id, {
        signatureName: input.signatureName,
        signatureData: input.signatureData,
        signatureTimestamp: /* @__PURE__ */ new Date()
      });
      const { generateApplicationPDF: generateApplicationPDF2 } = await Promise.resolve().then(() => (init_pdf_generator(), pdf_generator_exports));
      let pdfBuffer;
      const completeData = await getCompleteApplicationData(input.id);
      if (!completeData || !completeData.detailedInfo) {
        throw new Error("\u7533\u8BF7\u6570\u636E\u4E0D\u5B58\u5728");
      }
      const dataForPDF = {
        applicationNumber,
        status: application.status,
        accountSelection: completeData.accountSelection,
        basicInfo: completeData.basicInfo,
        detailedInfo: completeData.detailedInfo,
        occupation: completeData.occupation,
        financial: completeData.employment,
        // employment包含財務狀況
        investment: completeData.financial,
        // financial包含投資信息
        bankAccounts: completeData.bankAccounts,
        signatureName: input.signatureName,
        signatureMethod: "typed",
        signatureTimestamp: /* @__PURE__ */ new Date(),
        submittedAt: /* @__PURE__ */ new Date(),
        // 添加风险评估问卷数据
        riskQuestionnaire: completeData.riskQuestionnaire ? {
          q1_current_investments: completeData.riskQuestionnaire.q1_current_investments,
          q2_investment_period: completeData.riskQuestionnaire.q2_investment_period,
          q3_price_volatility: completeData.riskQuestionnaire.q3_price_volatility,
          q4_investment_percentage: completeData.riskQuestionnaire.q4_investment_percentage,
          q5_investment_attitude: completeData.riskQuestionnaire.q5_investment_attitude,
          q6_derivatives_knowledge: completeData.riskQuestionnaire.q6_derivatives_knowledge,
          q7_age_group: completeData.riskQuestionnaire.q7_age_group,
          q8_education_level: completeData.riskQuestionnaire.q8_education_level,
          q9_investment_knowledge_sources: completeData.riskQuestionnaire.q9_investment_knowledge_sources,
          q10_liquidity_needs: completeData.riskQuestionnaire.q10_liquidity_needs,
          totalScore: completeData.riskQuestionnaire.totalScore,
          riskLevel: completeData.riskQuestionnaire.riskLevel,
          riskDescription: completeData.riskQuestionnaire.riskDescription
        } : void 0
      };
      const { sendCustomerConfirmationEmail: sendCustomerConfirmationEmail2, sendInternalNotificationEmail: sendInternalNotificationEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const customerEmail = completeData.detailedInfo?.email;
      const customerName = completeData.basicInfo?.chineseName || completeData.basicInfo?.englishName || "\u5BA2\u6237";
      const customerGender = completeData.basicInfo?.gender;
      console.log(`Preparing to send emails for application ${applicationNumber}`);
      console.log(`Customer email: ${customerEmail}`);
      console.log(`Customer name: ${customerName}`);
      try {
        console.log("[PDF Generation] Starting PDF generation...");
        console.log("[PDF Generation] Application data:", JSON.stringify({
          applicationNumber: application.applicationNumber,
          hasBasicInfo: !!completeData.basicInfo,
          hasDetailedInfo: !!completeData.detailedInfo,
          hasOccupation: !!completeData.occupation
        }));
        pdfBuffer = await generateApplicationPDF2(dataForPDF);
        console.log(`[PDF Generation] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
      } catch (error) {
        console.error("[PDF Generation] Failed to generate PDF:", error);
        console.error("[PDF Generation] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      }
      let pdfUrl;
      if (pdfBuffer) {
        try {
          const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
          const { buildSignedDownloadLink: buildSignedDownloadLink2 } = await Promise.resolve().then(() => (init_files(), files_exports));
          const fileKey = `applications/${applicationNumber}/application.pdf`;
          const result = await storagePut2(fileKey, pdfBuffer, "application/pdf");
          const proto = ctx.req.headers["x-forwarded-proto"] || "https";
          const host = ctx.req.headers["x-forwarded-host"] || ctx.req.headers.host;
          const baseUrl = `${proto}://${host}`;
          pdfUrl = buildSignedDownloadLink2(baseUrl, fileKey, 60 * 60 * 24 * 30);
          console.log(`PDF uploaded to storage: ${result.url}`);
          console.log(`PDF email link (signed): ${pdfUrl}`);
        } catch (error) {
          console.error("Failed to upload PDF to S3:", error);
        }
      }
      if (customerEmail && applicationNumber) {
        console.log(`Condition met: customerEmail=${customerEmail}, applicationNumber=${applicationNumber}`);
        try {
          console.log(`Calling sendCustomerConfirmationEmail...`);
          const result = await sendCustomerConfirmationEmail2(
            customerEmail,
            applicationNumber,
            customerName,
            customerGender,
            // 传递性别
            pdfUrl
            // PDF下载链接
          );
          console.log(`sendCustomerConfirmationEmail result: ${result}`);
          if (result) {
            console.log(`Customer confirmation email sent to ${customerEmail}`);
          } else {
            console.error(`Failed to send customer confirmation email to ${customerEmail}`);
          }
        } catch (error) {
          console.error("Failed to send customer confirmation email:", error);
        }
        try {
          console.log(`Calling sendInternalNotificationEmail...`);
          const result = await sendInternalNotificationEmail2(
            applicationNumber,
            customerName,
            customerEmail,
            pdfUrl
            // PDF下载链接
          );
          console.log(`sendInternalNotificationEmail result: ${result}`);
          if (result) {
            console.log(`Internal notification email sent for application ${applicationNumber}`);
          } else {
            console.error(`Failed to send internal notification email for application ${applicationNumber}`);
          }
        } catch (error) {
          console.error("Failed to send internal notification email:", error);
        }
      } else {
        console.log(`Email sending skipped: customerEmail=${customerEmail}, applicationNumber=${applicationNumber}`);
      }
      return { success: true, pdfUrl };
    }),
    // 生成PDF
    generatePDF: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      const application = await getApplicationById(input.id);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const completeData = await getCompleteApplicationData(input.id);
      const pdfData = {
        applicationNumber: application.applicationNumber || "DRAFT",
        accountSelection: completeData.accountSelection ? {
          customerType: completeData.accountSelection.customerType || "",
          accountType: completeData.accountSelection.accountType || "cash"
        } : void 0,
        basicInfo: completeData.basicInfo ? {
          chineseName: completeData.basicInfo.chineseName || "",
          englishName: completeData.basicInfo.englishName || "",
          gender: completeData.basicInfo.gender || "",
          dateOfBirth: completeData.basicInfo.dateOfBirth || "",
          placeOfBirth: completeData.basicInfo.placeOfBirth || "",
          nationality: completeData.basicInfo.nationality || ""
        } : void 0,
        detailedInfo: completeData.detailedInfo ? {
          idType: completeData.detailedInfo.idType || "",
          idNumber: completeData.detailedInfo.idNumber || "",
          idIssuingPlace: completeData.detailedInfo.idIssuingPlace || "",
          idExpiryDate: completeData.detailedInfo.idExpiryDate || void 0,
          idIsPermanent: completeData.detailedInfo.idIsPermanent || false,
          maritalStatus: completeData.detailedInfo.maritalStatus || "",
          educationLevel: completeData.detailedInfo.educationLevel || "",
          residentialAddress: completeData.detailedInfo.residentialAddress || "",
          phoneCountryCode: completeData.detailedInfo.phoneCountryCode || "",
          phoneNumber: completeData.detailedInfo.phoneNumber || "",
          mobileCountryCode: completeData.detailedInfo.mobileCountryCode || "",
          mobileNumber: completeData.detailedInfo.mobileNumber || "",
          faxNo: completeData.detailedInfo.faxNo || void 0,
          email: completeData.detailedInfo.email || "",
          billingAddressType: completeData.detailedInfo.billingAddressType || "residential",
          billingAddressOther: completeData.detailedInfo.billingAddressOther || void 0,
          preferredLanguage: completeData.detailedInfo.preferredLanguage || "chinese"
        } : void 0,
        occupation: completeData.occupation ? {
          employmentStatus: completeData.occupation.employmentStatus || "",
          companyName: completeData.occupation.companyName || void 0,
          companyAddress: completeData.occupation.companyAddress || void 0,
          position: completeData.occupation.position || void 0,
          industry: completeData.occupation.industry || void 0,
          yearsOfService: completeData.occupation.yearsOfService?.toString() || void 0,
          officePhone: completeData.occupation.officePhone || void 0,
          officeFaxNo: completeData.occupation.officeFaxNo || void 0
        } : void 0,
        financial: completeData.employment || completeData.financial ? {
          incomeSource: completeData.employment?.incomeSource || void 0,
          annualIncome: completeData.employment?.annualIncome || "",
          netWorth: completeData.employment?.netWorth || "",
          liquidAsset: completeData.employment?.liquidAsset || ""
        } : void 0,
        investment: completeData.financial ? {
          investmentObjectives: completeData.financial.investmentObjectives || "",
          investmentExperience: completeData.financial.investmentExperience || "",
          riskTolerance: completeData.financial.riskTolerance || void 0
        } : void 0,
        bankAccounts: (completeData.bankAccounts || []).map((account) => ({
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountType: account.accountType || "saving",
          currency: account.accountCurrency || void 0,
          accountHolderName: account.accountHolderName || void 0
        })),
        taxInfo: completeData.taxInfo ? {
          taxResidency: completeData.taxInfo.taxResidency || "",
          taxIdNumber: completeData.taxInfo.taxIdNumber || ""
        } : void 0,
        riskQuestionnaire: completeData.riskQuestionnaire ? {
          q1_current_investments: completeData.riskQuestionnaire.q1_current_investments || "",
          q2_investment_period: completeData.riskQuestionnaire.q2_investment_period || "",
          q3_price_volatility: completeData.riskQuestionnaire.q3_price_volatility || "",
          q4_investment_percentage: completeData.riskQuestionnaire.q4_investment_percentage || "",
          q5_investment_attitude: completeData.riskQuestionnaire.q5_investment_attitude || "",
          q6_derivatives_knowledge: completeData.riskQuestionnaire.q6_derivatives_knowledge || "",
          q7_age_group: completeData.riskQuestionnaire.q7_age_group || "",
          q8_education_level: completeData.riskQuestionnaire.q8_education_level || "",
          q9_investment_knowledge_sources: completeData.riskQuestionnaire.q9_investment_knowledge_sources || "",
          q10_liquidity_needs: completeData.riskQuestionnaire.q10_liquidity_needs || "",
          totalScore: completeData.riskQuestionnaire.totalScore || 0,
          riskLevel: completeData.riskQuestionnaire.riskLevel || "",
          riskDescription: completeData.riskQuestionnaire.riskDescription || ""
        } : void 0,
        uploadedDocuments: completeData.uploadedDocuments || [],
        isPEP: completeData.regulatory?.isPEP || false,
        isUSPerson: completeData.regulatory?.isUSPerson || false,
        agreementRead: completeData.regulatory?.agreementRead || false,
        agreementAccepted: completeData.regulatory?.agreementAccepted || false,
        electronicSignatureConsent: completeData.regulatory?.electronicSignatureConsent || false,
        amlComplianceConsent: completeData.regulatory?.amlComplianceConsent || false,
        riskAssessmentConsent: completeData.regulatory?.riskAssessmentConsent || false,
        signatureName: completeData.regulatory?.signatureName || "",
        signatureMethod: "typed",
        // 默认签名方式
        signatureTimestamp: completeData.regulatory?.signedAt || ""
      };
      const pdfBuffer = await generateApplicationPDF(pdfData);
      const fileName = `application-${application.applicationNumber || input.id}-${Date.now()}.pdf`;
      const { url } = await storagePut(
        `applications/${ctx.user.id}/${fileName}`,
        pdfBuffer,
        "application/pdf"
      );
      return { success: true, pdfUrl: url };
    }),
    // 生成预览PDF（不提交，只生成PDF供下载）
    generatePreviewPDF: protectedProcedure.input(z2.object({ applicationId: z2.number() })).mutation(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      if (!application.applicationNumber) {
        throw new Error("\u8BF7\u5148\u751F\u6210\u7533\u8BF7\u7F16\u53F7");
      }
      const completeData = await getCompleteApplicationData(input.applicationId);
      if (!completeData || !completeData.detailedInfo) {
        throw new Error("\u7533\u8BF7\u6570\u636E\u4E0D\u5B58\u5728");
      }
      const dataForPDF = {
        applicationNumber: application.applicationNumber,
        status: application.status,
        accountSelection: completeData.accountSelection,
        basicInfo: completeData.basicInfo,
        detailedInfo: completeData.detailedInfo,
        occupation: completeData.occupation,
        financial: completeData.employment,
        // employment包含財務狀況
        investment: completeData.financial,
        // financial包含投資信息
        bankAccounts: completeData.bankAccounts,
        // 添加稅務信息
        taxInfo: completeData.taxInfo ? {
          taxResidency: completeData.taxInfo.taxResidency,
          taxIdNumber: completeData.taxInfo.taxIdNumber
        } : void 0,
        // 添加上傳文件清單
        uploadedDocuments: completeData.uploadedDocuments?.map((doc) => ({
          documentType: doc.documentType,
          fileUrl: doc.fileUrl
        })) || [],
        // 添加簽名信息（如果已提交）
        signatureName: application.signatureName,
        signatureMethod: application.signatureMethod,
        signatureTimestamp: application.signatureTimestamp,
        submittedAt: application.submittedAt,
        // 添加合規聲明字段（從regulatory對象中獲取）
        isPEP: completeData.regulatory?.isPEP ?? false,
        isUSPerson: completeData.regulatory?.isUSPerson ?? false,
        agreementRead: completeData.regulatory?.agreementRead ?? false,
        agreementAccepted: completeData.regulatory?.agreementAccepted ?? false,
        amlComplianceConsent: completeData.regulatory?.amlComplianceConsent ?? false,
        electronicSignatureConsent: completeData.regulatory?.electronicSignatureConsent ?? false,
        riskAssessmentConsent: completeData.regulatory?.riskAssessmentConsent ?? false,
        // 添加风险评估问卷数据
        riskQuestionnaire: completeData.riskQuestionnaire ? {
          q1_current_investments: completeData.riskQuestionnaire.q1_current_investments,
          q2_investment_period: completeData.riskQuestionnaire.q2_investment_period,
          q3_price_volatility: completeData.riskQuestionnaire.q3_price_volatility,
          q4_investment_percentage: completeData.riskQuestionnaire.q4_investment_percentage,
          q5_investment_attitude: completeData.riskQuestionnaire.q5_investment_attitude,
          q6_derivatives_knowledge: completeData.riskQuestionnaire.q6_derivatives_knowledge,
          q7_age_group: completeData.riskQuestionnaire.q7_age_group,
          q8_education_level: completeData.riskQuestionnaire.q8_education_level,
          q9_investment_knowledge_sources: completeData.riskQuestionnaire.q9_investment_knowledge_sources,
          q10_liquidity_needs: completeData.riskQuestionnaire.q10_liquidity_needs,
          totalScore: completeData.riskQuestionnaire.totalScore,
          riskLevel: completeData.riskQuestionnaire.riskLevel,
          riskDescription: completeData.riskQuestionnaire.riskDescription
        } : void 0
      };
      const { generateApplicationPDF: generateApplicationPDF2 } = await Promise.resolve().then(() => (init_pdf_generator(), pdf_generator_exports));
      let pdfBuffer;
      try {
        console.log("[Preview PDF] Starting PDF generation...");
        pdfBuffer = await generateApplicationPDF2(dataForPDF);
        console.log(`[Preview PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
      } catch (error) {
        console.error("[Preview PDF] Failed to generate PDF:", error);
        throw new Error(`PDF\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
      }
      const pdfBase64 = pdfBuffer.toString("base64");
      return { success: true, pdfData: pdfBase64, fileName: `${application.applicationNumber}.pdf` };
    })
  }),
  // Case 1 & 2: 账户选择
  accountSelection: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      customerType: z2.enum(["individual", "joint", "corporate"]),
      accountType: z2.enum(["cash", "margin", "derivatives"])
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await saveAccountSelection(applicationId, data);
      await updateApplicationStep(applicationId, 2);
      const saved = await getAccountSelection(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getAccountSelection(input.applicationId);
    })
  }),
  // Case 3: 个人基本信息
  personalBasic: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      chineseName: z2.string().min(1),
      englishName: z2.string().min(1),
      gender: z2.enum(["male", "female", "other"]),
      dateOfBirth: z2.string(),
      placeOfBirth: z2.string(),
      nationality: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await savePersonalBasicInfo(applicationId, data);
      await updateApplicationStep(applicationId, 2);
      const saved = await getPersonalBasicInfo(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getPersonalBasicInfo(input.applicationId);
    })
  }),
  // Case 2: 机构基本信息
  corporateBasic: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      companyEnglishName: z2.string().min(1),
      companyChineseName: z2.string().optional(),
      natureOfEntity: z2.string().min(1),
      natureOfBusiness: z2.string().min(1),
      countryOfIncorporation: z2.string().min(1),
      dateOfIncorporation: z2.string(),
      certificateOfIncorporationNo: z2.string().min(1),
      businessRegistrationNo: z2.string().optional(),
      registeredAddress: z2.string().min(1),
      businessAddress: z2.string().min(1),
      officeNo: z2.string().min(1),
      officeCountryCode: z2.string().optional(),
      facsimileNo: z2.string().optional(),
      contactName: z2.string().min(1),
      contactTitle: z2.string().min(1),
      contactPhone: z2.string().min(1),
      contactCountryCode: z2.string().optional(),
      contactEmail: z2.string().email(),
      contactEmailVerified: z2.boolean().optional().default(false)
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, officeCountryCode, contactCountryCode, ...data } = input;
      const officeNo = officeCountryCode ? `${officeCountryCode} ${data.officeNo}` : data.officeNo;
      const contactPhone = contactCountryCode ? `${contactCountryCode} ${data.contactPhone}` : data.contactPhone;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await saveCorporateBasicInfo(applicationId, {
        ...data,
        officeNo,
        contactPhone
      });
      await updateApplicationStep(applicationId, 2);
      const saved = await getCorporateBasicInfo(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getCorporateBasicInfo(input.applicationId);
    })
  }),
  // Case 4: 个人详细信息
  personalDetailed: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      idType: z2.string(),
      idNumber: z2.string(),
      idIssuingPlace: z2.string(),
      idExpiryDate: z2.string().optional(),
      idIsPermanent: z2.boolean(),
      maritalStatus: z2.string(),
      educationLevel: z2.string(),
      email: z2.string().email(),
      // 住宅电话（可选）
      phoneCountryCode: z2.string().optional(),
      phoneNumber: z2.string().optional(),
      // 手机号码（必填）
      mobileCountryCode: z2.string(),
      mobileNumber: z2.string(),
      faxNo: z2.string().optional(),
      emailVerified: z2.boolean().optional().default(false),
      residentialAddress: z2.string(),
      // 账单通讯地址
      billingAddressType: z2.enum(["residential", "office", "other"]),
      billingAddressOther: z2.string().optional(),
      // 账单首选语言
      preferredLanguage: z2.enum(["chinese", "english"])
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await savePersonalDetailedInfo(applicationId, data);
      await updateApplicationStep(applicationId, 4);
      const saved = await getPersonalDetailedInfo(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getPersonalDetailedInfo(input.applicationId);
    })
  }),
  // Case 5: 职业信息
  occupation: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      employmentStatus: z2.enum(["employed", "self_employed", "student", "unemployed"]),
      companyName: z2.string().optional(),
      position: z2.string().optional(),
      yearsOfService: z2.number().optional(),
      industry: z2.string().optional(),
      companyAddress: z2.string().optional(),
      officePhone: z2.string().optional(),
      officeFaxNo: z2.string().optional()
      // 办公传真（可选）
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await saveOccupationInfo(applicationId, data);
      await updateApplicationStep(applicationId, 5);
      const saved = await getOccupationInfo(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getOccupationInfo(input.applicationId);
    })
  }),
  // Case 6: 就业详情
  employment: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      incomeSource: z2.string(),
      annualIncome: z2.string(),
      liquidAsset: z2.string(),
      // 流动资产（必填）
      netWorth: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await saveEmploymentDetails(applicationId, data);
      await updateApplicationStep(applicationId, 6);
      const saved = await getEmploymentDetails(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getEmploymentDetails(input.applicationId);
    })
  }),
  // Case 7: 财务与投资
  financial: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      investmentObjectives: z2.array(z2.string()),
      investmentExperience: z2.record(z2.string(), z2.string())
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, investmentObjectives, investmentExperience, ...rest } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const data = {
        ...rest,
        investmentObjectives: JSON.stringify(investmentObjectives),
        investmentExperience: JSON.stringify(investmentExperience)
      };
      await saveFinancialAndInvestment(applicationId, data);
      await updateApplicationStep(applicationId, 7);
      const saved = await getFinancialAndInvestment(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getFinancialAndInvestment(input.applicationId);
    })
  }),
  corporateFinancial: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      authorizedShareCapital: z2.string(),
      issuedShareCapital: z2.string(),
      initialSourceOfWealth: z2.array(z2.string()),
      netAssetValue: z2.string(),
      netAssetAuditDate: z2.string().optional(),
      profitAfterTax: z2.string(),
      profitAuditDate: z2.string().optional(),
      assetItems: z2.array(z2.string())
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, initialSourceOfWealth, assetItems, ...rest } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const data = {
        ...rest,
        initialSourceOfWealth: JSON.stringify(initialSourceOfWealth),
        assetItems: JSON.stringify(assetItems)
      };
      await saveCorporateFinancialInfo(applicationId, data);
      await updateApplicationStep(applicationId, 3);
      const saved = await getCorporateFinancialInfo(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getCorporateFinancialInfo(input.applicationId);
    })
  }),
  corporateRelatedParties: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      relatedParties: z2.array(z2.any())
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, relatedParties } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await saveCorporateRelatedParties(applicationId, { relatedParties });
      await updateApplicationStep(applicationId, 4);
      const saved = await getCorporateRelatedParties(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getCorporateRelatedParties(input.applicationId);
    })
  }),
  // Case 8: 银行账户
  bankAccount: router({
    add: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      bankName: z2.string(),
      bankLocation: z2.enum(["HK", "CN", "OTHER"]).default("HK"),
      // 银行所在地
      accountType: z2.enum(["saving", "current", "checking", "others"]).optional(),
      // 账户类型（可选）
      accountCurrency: z2.string(),
      accountNumber: z2.string(),
      accountHolderName: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const id = await saveBankAccount(applicationId, data);
      await updateApplicationStep(applicationId, 8);
      return { success: true, id };
    }),
    list: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getBankAccounts(input.applicationId);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteBankAccount(input.id);
      return { success: true };
    })
  }),
  // Case 9: 税务信息
  tax: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      taxResidency: z2.string(),
      taxIdNumber: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      await saveTaxInfo(applicationId, data);
      await updateApplicationStep(applicationId, 9);
      const saved = await getTaxInfo(applicationId);
      return { success: true, data: saved };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getTaxInfo(input.applicationId);
    })
  }),
  // Case 10: 文件上传
  document: router({
    upload: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      documentType: z2.string(),
      fileName: z2.string(),
      fileData: z2.string(),
      // base64
      mimeType: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, documentType, fileName, fileData, mimeType } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const buffer = Buffer.from(fileData, "base64");
      const fileKey = `applications/${applicationId}/${documentType}/${nanoid2()}-${fileName}`;
      const { url } = await storagePut(fileKey, buffer, mimeType);
      const id = await saveUploadedDocument(applicationId, {
        documentType,
        fileKey,
        fileUrl: url,
        fileName,
        mimeType,
        fileSize: buffer.length
      });
      await updateApplicationStep(applicationId, 10);
      return { success: true, id, url };
    }),
    list: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getUploadedDocuments(input.applicationId);
    })
  }),
  // Case 11: 人脸识别
  faceVerification: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      verified: z2.boolean(),
      faceImageData: z2.string(),
      // base64 image data
      confidence: z2.number()
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, faceImageData, confidence, verified } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const base64Data = faceImageData.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const fileKey = `face-verification/${ctx.user.id}/${applicationId}-${Date.now()}.jpg`;
      const { url: faceImageUrl } = await storagePut(fileKey, buffer, "image/jpeg");
      const verificationData = {
        faceImageUrl,
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
        confidence
      };
      const saveData = {
        verified,
        verificationData: JSON.stringify(verificationData)
      };
      await saveFaceVerification(applicationId, saveData);
      await updateApplicationStep(applicationId, 11);
      return { success: true, faceImageUrl };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getFaceVerification(input.applicationId);
    }),
    // Face++人脸比对API
    compareFaces: protectedProcedure.input(z2.object({
      selfieImageUrl: z2.string(),
      idCardImageUrl: z2.string()
    })).mutation(async ({ input }) => {
      const { selfieImageUrl, idCardImageUrl } = input;
      const apiKey2 = process.env.FACEPP_API_KEY;
      const apiSecret = process.env.FACEPP_API_SECRET;
      if (!apiKey2 || !apiSecret) {
        throw new Error("Face++ API\u5BC6\u9470\u672A\u914D\u7F6E");
      }
      try {
        const formData = new FormData();
        formData.append("api_key", apiKey2);
        formData.append("api_secret", apiSecret);
        formData.append("image_url1", selfieImageUrl);
        formData.append("image_url2", idCardImageUrl);
        const response = await fetch("https://api-us.faceplusplus.com/facepp/v3/compare", {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          throw new Error(`Face++ API\u8ACB\u6C42\u5931\u6557: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.error_message) {
          throw new Error(`Face++ API\u932F\u8AA4: ${result.error_message}`);
        }
        const confidence = result.confidence || 0;
        const threshold = 90;
        const success = confidence >= threshold;
        return {
          success,
          confidence,
          message: success ? `\u4EBA\u81C9\u6BD4\u5C0D\u6210\u529F\uFF0C\u7F6E\u4FE1\u5EA6\uFF1A${confidence.toFixed(2)}%` : `\u4EBA\u81C9\u6BD4\u5C0D\u5931\u6557\uFF0C\u7F6E\u4FE1\u5EA6\uFF1A${confidence.toFixed(2)}%\uFF08\u9700\u8981\u2265${threshold}%\uFF09`
        };
      } catch (error) {
        console.error("Face++ API error:", error);
        throw new Error(`\u4EBA\u81C9\u6BD4\u5C0D\u5931\u6557: ${error.message}`);
      }
    })
  }),
  // Case 12: 监管声明
  regulatory: router({
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      isPEP: z2.boolean(),
      isUSPerson: z2.boolean(),
      agreementRead: z2.boolean(),
      agreementAccepted: z2.boolean(),
      signatureName: z2.string(),
      electronicSignatureConsent: z2.boolean(),
      amlComplianceConsent: z2.boolean(),
      riskAssessmentConsent: z2.boolean()
    })).mutation(async ({ input, ctx }) => {
      const { applicationId, ...data } = input;
      const application = await getApplicationById(applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      const saveData = {
        ...data,
        signedAt: /* @__PURE__ */ new Date()
      };
      await saveRegulatoryDeclarations(applicationId, saveData);
      await updateApplicationStep(applicationId, 12);
      return { success: true };
    }),
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input, ctx }) => {
      const application = await getApplicationById(input.applicationId);
      if (!application || application.userId !== ctx.user.id) {
        throw new Error("\u7533\u8BF7\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
      }
      return await getRegulatoryDeclarations(input.applicationId);
    })
  }),
  // 审批人员管理
  approver: router({
    // 密码登录
    loginWithPassword: publicProcedure.input(z2.object({
      email: z2.string().email(),
      password: z2.string().min(6)
    })).mutation(async ({ input, ctx }) => {
      const { hashPassword: hashPassword2, verifyPassword: verifyPassword2 } = await Promise.resolve().then(() => (init_password(), password_exports));
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new Error("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF");
      }
      if (!user.password) {
        throw new Error("\u8BE5\u8D26\u6237\u5C1A\u672A\u8BBE\u7F6E\u5BC6\u7801\uFF0C\u8BF7\u4F7F\u7528\u9A8C\u8BC1\u7801\u767B\u5F55");
      }
      const isValid = await verifyPassword2(input.password, user.password);
      if (!isValid) {
        throw new Error("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF");
      }
      const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
      const sessionToken = await sdk2.createSessionToken(user.openId, {
        name: user.name || user.email || ""
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
      return { success: true };
    }),
    // 请求密码重置
    requestPasswordReset: publicProcedure.input(z2.object({
      email: z2.string().email()
    })).mutation(async ({ input, ctx }) => {
      const { generateResetToken: generateResetToken2, generateResetLink: generateResetLink2 } = await Promise.resolve().then(() => (init_password(), password_exports));
      const { sendPasswordResetEmail: sendPasswordResetEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const user = await getUserByEmail(input.email);
      if (!user) {
        return { success: true, message: "\u5982\u679C\u8BE5\u90AE\u7BB1\u5B58\u5728\uFF0C\u60A8\u5C06\u6536\u5230\u5BC6\u7801\u91CD\u7F6E\u90AE\u4EF6" };
      }
      const resetToken = generateResetToken2();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1e3);
      await savePasswordResetToken(user.id, resetToken, resetExpires);
      const protocol = ctx.req.headers["x-forwarded-proto"] || (ctx.req.secure ? "https" : "http");
      const host = ctx.req.headers["x-forwarded-host"] || ctx.req.headers["host"] || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;
      const resetLink = generateResetLink2(resetToken, baseUrl);
      const sent = await sendPasswordResetEmail2(input.email, resetLink);
      if (!sent) {
        throw new Error("\u90AE\u4EF6\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
      }
      return { success: true, message: "\u5BC6\u7801\u91CD\u7F6E\u90AE\u4EF6\u5DF2\u53D1\u9001" };
    }),
    // 重置密码
    resetPassword: publicProcedure.input(z2.object({
      token: z2.string(),
      newPassword: z2.string().min(6)
    })).mutation(async ({ input }) => {
      const { hashPassword: hashPassword2 } = await Promise.resolve().then(() => (init_password(), password_exports));
      const user = await getUserByResetToken(input.token);
      if (!user) {
        throw new Error("\u91CD\u7F6E\u94FE\u63A5\u65E0\u6548\u6216\u5DF2\u8FC7\u671F");
      }
      const hashedPassword = await hashPassword2(input.newPassword);
      await updateUserPassword(user.id, hashedPassword);
      return { success: true, message: "\u5BC6\u7801\u91CD\u7F6E\u6210\u529F" };
    }),
    // 获取所有审批人员列表
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8BBF\u95EE\u5BA1\u6279\u4EBA\u5458\u5217\u8868");
      }
      return await getAllApprovers();
    }),
    // 添加审批人员（仅管理员）
    add: protectedProcedure.input(z2.object({
      userId: z2.number(),
      employeeName: z2.string(),
      ceNumber: z2.string(),
      role: z2.enum(["approver", "manager"]).default("approver")
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u6DFB\u52A0\u5BA1\u6279\u4EBA\u5458");
      }
      const user = await getUserById(input.userId);
      if (!user) {
        throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
      }
      if (!user.email || !user.email.endsWith("@cmfinancial.com")) {
        throw new Error("\u5BA1\u6279\u4EBA\u5458\u5FC5\u987B\u4F7F\u7528@cmfinancial.com\u90AE\u7BB1");
      }
      if (!user.emailVerified) {
        throw new Error("\u90AE\u7BB1\u5C1A\u672A\u9A8C\u8BC1\uFF0C\u8BF7\u5148\u5B8C\u6210\u90AE\u7BB1\u9A8C\u8BC1");
      }
      return await addApprover(input);
    }),
    // 更新审批人员信息
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      employeeName: z2.string().optional(),
      ceNumber: z2.string().optional(),
      role: z2.enum(["approver", "manager"]).optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u66F4\u65B0\u5BA1\u6279\u4EBA\u5458");
      }
      return await updateApprover(input);
    }),
    // 删除审批人员
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u5220\u9664\u5BA1\u6279\u4EBA\u5458");
      }
      return await deleteApprover(input.id);
    })
  }),
  // 审批管理
  approval: router({
    // 获取所有已提交的申请列表
    getPendingApplications: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && !ctx.user.email?.endsWith("@cmfinancial.com")) {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8BBF\u95EE\u5BA1\u6279\u7CFB\u7EDF");
      }
      return await getSubmittedApplications();
    }),
    // 获取申请完整详情
    getApplicationDetail: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && !ctx.user.email?.endsWith("@cmfinancial.com")) {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8BBF\u95EE\u5BA1\u6279\u7CFB\u7EDF");
      }
      return await getCompleteApplicationData(input.id);
    }),
    // 第一级审批（有CE号码的审批人员）
    firstApprove: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      isProfessionalInvestor: z2.boolean(),
      approvedRiskProfile: z2.enum(["Lowest", "Low", "Low to Medium", "Medium", "Medium to High", "High"]),
      comments: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && !ctx.user.email?.endsWith("@cmfinancial.com")) {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8FDB\u884C\u5BA1\u6279\u64CD\u4F5C");
      }
      const approver = await getApproverByUserId(ctx.user.id);
      if (!approver) {
        throw new Error("\u672A\u627E\u5230\u5BA1\u6279\u4EBA\u5458\u4FE1\u606F\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458");
      }
      if (!approver.ceNumber) {
        throw new Error("\u7B2C\u4E00\u7EA7\u5BA1\u6279\u4EBA\u5458\u5FC5\u987B\u6709CE\u53F7\u7801");
      }
      const existingApplication = await getCompleteApplicationData(input.applicationId);
      if (existingApplication?.application?.firstApprovalStatus === "approved") {
        throw new Error("\u8BE5\u7533\u8BF7\u5DF2\u7ECF\u5B8C\u6210\u521D\u5BA1\uFF0C\u65E0\u6CD5\u91CD\u590D\u5BA1\u6279");
      }
      await updateFirstApproval(input.applicationId, {
        status: "approved",
        approverEmail: ctx.user.email || "",
        approverName: approver.employeeName,
        approverCeNo: approver.ceNumber,
        comments: input.comments,
        isProfessionalInvestor: input.isProfessionalInvestor,
        riskProfile: input.approvedRiskProfile
      });
      await createApprovalRecord({
        applicationId: input.applicationId,
        approverId: approver.id,
        action: "first_approved",
        comments: input.comments
      });
      try {
        const { sendFirstApprovalNotificationEmail: sendFirstApprovalNotificationEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        const applicationData = await getCompleteApplicationData(input.applicationId);
        if (applicationData) {
          await sendFirstApprovalNotificationEmail2(
            applicationData.application?.applicationNumber || "",
            applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || "\u672A\u77E5",
            approver.employeeName,
            approver.ceNumber,
            input.isProfessionalInvestor,
            input.approvedRiskProfile
          );
        }
      } catch (emailError) {
        console.error("Failed to send first approval notification email:", emailError);
      }
      return { success: true };
    }),
    // 第二级审批（合规部终审）
    secondApprove: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      isProfessionalInvestor: z2.boolean(),
      riskProfile: z2.enum(["Lowest", "Low", "Low to Medium", "Medium", "Medium to High", "High"]),
      comments: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && !ctx.user.email?.endsWith("@cmfinancial.com")) {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8FDB\u884C\u5BA1\u6279\u64CD\u4F5C");
      }
      const approver = await getApproverByUserId(ctx.user.id);
      if (!approver) {
        throw new Error("\u672A\u627E\u5230\u5BA1\u6279\u4EBA\u5458\u4FE1\u606F\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458");
      }
      const applicationData = await getCompleteApplicationData(input.applicationId);
      if (!applicationData?.application?.firstApprovalStatus || applicationData.application.firstApprovalStatus !== "approved") {
        throw new Error("\u7B2C\u4E00\u7EA7\u5BA1\u6279\u5C1A\u672A\u901A\u8FC7\uFF0C\u65E0\u6CD5\u8FDB\u884C\u7B2C\u4E8C\u7EA7\u5BA1\u6279");
      }
      if (applicationData?.application?.secondApprovalStatus === "approved") {
        throw new Error("\u8BE5\u7533\u8BF7\u5DF2\u7ECF\u5B8C\u6210\u7EC8\u5BA1\uFF0C\u65E0\u6CD5\u91CD\u590D\u5BA1\u6279");
      }
      if (applicationData?.application?.firstApprovalBy) {
        const firstApprover = await getApproverByUserId(ctx.user.id);
        if (firstApprover && applicationData.application.firstApprovalBy === ctx.user.email) {
          throw new Error("\u521D\u5BA1\u548C\u7EC8\u5BA1\u4E0D\u80FD\u662F\u540C\u4E00\u4EBA\uFF0C\u8BF7\u8054\u7CFB\u5176\u4ED6\u5BA1\u6279\u4EBA\u5458\u8FDB\u884C\u7EC8\u5BA1");
        }
      }
      await updateSecondApproval(input.applicationId, {
        status: "approved",
        approverEmail: ctx.user.email || "",
        approverName: approver.employeeName,
        approverCeNo: approver.ceNumber,
        // 合规部可能没有CE号码号码
        comments: input.comments
      });
      await updateApplicationApprovalInfo(input.applicationId, {
        isProfessionalInvestor: input.isProfessionalInvestor,
        approvedRiskProfile: input.riskProfile
      });
      await updateApplicationStatus(input.applicationId, "approved");
      await createApprovalRecord({
        applicationId: input.applicationId,
        approverId: approver.id,
        action: "second_approved",
        comments: input.comments
      });
      let finalPdfUrl = "";
      try {
        const { generateApplicationPDF: generateApplicationPDF2 } = await Promise.resolve().then(() => (init_pdf_generator(), pdf_generator_exports));
        const pdfData = {
          applicationNumber: applicationData.application?.applicationNumber,
          status: applicationData.application?.status,
          accountSelection: applicationData.accountSelection ? {
            customerType: applicationData.accountSelection.customerType,
            accountType: applicationData.accountSelection.accountType
          } : void 0,
          basicInfo: applicationData.basicInfo ? {
            chineseName: applicationData.basicInfo.chineseName,
            englishName: applicationData.basicInfo.englishName,
            gender: applicationData.basicInfo.gender,
            dateOfBirth: applicationData.basicInfo.dateOfBirth,
            placeOfBirth: applicationData.basicInfo.placeOfBirth,
            nationality: applicationData.basicInfo.nationality
          } : void 0,
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
            email: applicationData.detailedInfo.email
          } : void 0,
          occupation: applicationData.occupation ? {
            employmentStatus: applicationData.occupation.employmentStatus,
            companyName: applicationData.occupation.companyName,
            companyAddress: applicationData.occupation.companyAddress,
            position: applicationData.occupation.position,
            industry: applicationData.occupation.industry,
            yearsOfService: applicationData.occupation.yearsOfService?.toString() || null,
            officePhone: applicationData.occupation.officePhone,
            officeFaxNo: applicationData.occupation.officeFaxNo
          } : void 0,
          financial: applicationData.employment ? {
            incomeSource: applicationData.employment.incomeSource,
            annualIncome: applicationData.employment.annualIncome,
            netWorth: applicationData.employment.netWorth,
            liquidAsset: applicationData.employment.liquidAsset
          } : void 0,
          investment: applicationData.financial ? {
            investmentObjectives: applicationData.financial.investmentObjectives,
            investmentExperience: applicationData.financial.investmentExperience,
            riskTolerance: applicationData.financial.riskTolerance
          } : void 0,
          bankAccounts: applicationData.bankAccounts?.map((acc) => ({
            bankName: acc.bankName,
            accountType: acc.accountType,
            currency: acc.accountCurrency,
            accountNumber: acc.accountNumber,
            accountHolderName: acc.accountHolderName
          })),
          taxInfo: applicationData.taxInfo ? {
            taxResidency: applicationData.taxInfo.taxResidency,
            taxIdNumber: applicationData.taxInfo.taxIdNumber
          } : void 0,
          uploadedDocuments: applicationData.uploadedDocuments?.map((doc) => ({
            documentType: doc.documentType,
            fileUrl: doc.fileUrl
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
            comments: applicationData.application?.firstApprovalComments
          },
          // 終審信息
          secondApproval: {
            approverName: approver.employeeName,
            approverCeNo: approver.ceNumber,
            isProfessionalInvestor: input.isProfessionalInvestor,
            approvedRiskProfile: input.riskProfile,
            approvalTime: /* @__PURE__ */ new Date(),
            comments: input.comments
          }
        };
        const pdfBuffer = await generateApplicationPDF2(pdfData);
        const pdfKey = `applications/${applicationData.application?.applicationNumber}/final-approval-${Date.now()}.pdf`;
        const { url } = await storagePut(pdfKey, pdfBuffer, "application/pdf");
        finalPdfUrl = url;
        await updateApplicationPdfUrl(input.applicationId, "finalReviewPdfUrl", url);
        console.log(`[PDF] Final approval PDF generated and uploaded: ${url}`);
      } catch (pdfError) {
        console.error("Failed to generate or upload final approval PDF:", pdfError);
      }
      try {
        const { sendFinalApprovalNotificationEmail: sendFinalApprovalNotificationEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        if (applicationData) {
          await sendFinalApprovalNotificationEmail2(
            applicationData.application?.applicationNumber || "",
            applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || "\u672A\u77E5",
            applicationData.application?.firstApprovalByName || "",
            applicationData.application?.firstApprovalByCeNo || "",
            approver.employeeName,
            approver.ceNumber || "",
            applicationData.application?.isProfessionalInvestor || false,
            applicationData.application?.approvedRiskProfile || "medium",
            finalPdfUrl
          );
        }
      } catch (emailError) {
        console.error("Failed to send final approval notification email:", emailError);
      }
      return { success: true };
    }),
    // 拒绝申请
    reject: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      rejectReason: z2.string(),
      comments: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && !ctx.user.email?.endsWith("@cmfinancial.com")) {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8FDB\u884C\u5BA1\u6279\u64CD\u4F5C");
      }
      const approver = await getApproverByUserId(ctx.user.id);
      if (!approver) {
        throw new Error("\u672A\u627E\u5230\u5BA1\u6279\u4EBA\u5458\u4FE1\u606F\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458");
      }
      await updateApplicationStatus(input.applicationId, "rejected");
      await createApprovalRecord({
        applicationId: input.applicationId,
        approverId: approver.id,
        action: "rejected",
        comments: input.comments,
        rejectReason: input.rejectReason
      });
      try {
        const applicationData = await getCompleteApplicationData(input.applicationId);
        if (applicationData) {
          await sendRejectionNotificationEmail(
            applicationData.application?.applicationNumber || "",
            applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || "\u672A\u77E5",
            applicationData.detailedInfo?.email || "",
            ctx.user.name || ctx.user.email || "\u5BA1\u6279\u4EBA\u5458",
            input.rejectReason
          );
        }
      } catch (emailError) {
        console.error("Failed to send rejection notification email:", emailError);
      }
      return { success: true };
    }),
    // 退回补充材料
    return: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      returnReason: z2.string(),
      comments: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && !ctx.user.email?.endsWith("@cmfinancial.com")) {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8FDB\u884C\u5BA1\u6279\u64CD\u4F5C");
      }
      const approver = await getApproverByUserId(ctx.user.id);
      if (!approver) {
        throw new Error("\u672A\u627E\u5230\u5BA1\u6279\u4EBA\u5458\u4FE1\u606F\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458");
      }
      await updateApplicationStatus(input.applicationId, "returned");
      await createApprovalRecord({
        applicationId: input.applicationId,
        approverId: approver.id,
        action: "returned",
        comments: input.comments,
        returnReason: input.returnReason
      });
      try {
        const applicationData = await getCompleteApplicationData(input.applicationId);
        if (applicationData) {
          await sendReturnNotificationEmail(
            applicationData.application?.applicationNumber || "",
            applicationData.basicInfo?.chineseName || applicationData.basicInfo?.englishName || "\u672A\u77E5",
            applicationData.detailedInfo?.email || "",
            ctx.user.name || ctx.user.email || "\u5BA1\u6279\u4EBA\u5458",
            input.returnReason
          );
        }
      } catch (emailError) {
        console.error("Failed to send return notification email:", emailError);
      }
      return { success: true };
    }),
    // 获取审批历史记录
    getHistory: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && !ctx.user.email?.endsWith("@cmfinancial.com")) {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8BBF\u95EE\u5BA1\u6279\u5386\u53F2");
      }
      return await getApprovalHistory(input.applicationId);
    })
  }),
  // 用户管理
  user: router({
    // 获取所有用户列表
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u8BBF\u95EE\u7528\u6237\u7BA1\u7406");
      }
      return await getAllUsers();
    }),
    // 重置用户密码
    resetPassword: protectedProcedure.input(z2.object({ userId: z2.number() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u91CD\u7F6E\u5BC6\u7801");
      }
      const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      return { newPassword };
    }),
    // 更新用户角色
    updateRole: protectedProcedure.input(z2.object({
      userId: z2.number(),
      role: z2.enum(["user", "admin"])
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u4FEE\u6539\u7528\u6237\u89D2\u8272");
      }
      return await updateUserRole(input.userId, input.role);
    }),
    // 获取用户的审批人员信息
    getApproverInfo: protectedProcedure.input(z2.object({ userId: z2.number() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("\u6CA1\u6709\u6743\u9650\u67E5\u770B\u5BA1\u6279\u4EBA\u5458\u4FE1\u606F");
      }
      return await getApproverByUserId(input.userId);
    })
  }),
  // 風險評估問卷
  riskQuestionnaire: router({
    // 保存風險評估問卷
    save: protectedProcedure.input(z2.object({
      applicationId: z2.number(),
      q1_current_investments: z2.string(),
      q2_investment_period: z2.string(),
      q3_price_volatility: z2.string(),
      q4_investment_percentage: z2.string(),
      q5_investment_attitude: z2.string(),
      q6_derivatives_knowledge: z2.string(),
      q7_age_group: z2.string(),
      q8_education_level: z2.string(),
      q9_investment_knowledge_sources: z2.string(),
      q10_liquidity_needs: z2.string(),
      totalScore: z2.number(),
      riskLevel: z2.string(),
      riskDescription: z2.string()
    })).mutation(async ({ input }) => {
      return await saveRiskQuestionnaire(input);
    }),
    // 獲取風險評估問卷
    get: protectedProcedure.input(z2.object({ applicationId: z2.number() })).query(async ({ input }) => {
      return await getRiskQuestionnaire(input.applicationId);
    })
  })
});

// server/_core/context.ts
init_sdk();
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid3 } from "nanoid";
import path3 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path2 from "node:path";
import { defineConfig } from "vite";
var plugins = [react(), tailwindcss()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path2.resolve(import.meta.dirname),
  root: path2.resolve(import.meta.dirname, "client"),
  publicDir: path2.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid3()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path3.resolve(import.meta.dirname, "../..", "dist", "public") : path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
init_db();
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  await syncMissingTables();
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  registerFileRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  if (process.env.VERCEL) {
    console.log(`Running in Vercel Serverless mode`);
  } else {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  }
  return app;
}
var appPromise = startServer().catch(console.error);
async function index_default(req, res) {
  const app = await appPromise;
  if (app) {
    app(req, res);
  } else {
    res.status(500).send("Server failed to initialize");
  }
}
export {
  index_default as default
};
