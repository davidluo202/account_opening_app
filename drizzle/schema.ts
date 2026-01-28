import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * 用户表 - 核心认证表
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * 邮箱验证码表
 */
export const emailVerificationCodes = mysqlTable("email_verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 开户申请主表
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  applicationNumber: varchar("applicationNumber", { length: 50 }).unique(),
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "approved", "rejected"]).default("draft").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  completedSteps: text("completedSteps"), // JSON array of completed step numbers
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp("submittedAt"),
});

/**
 * Case 1 & 2: 账户选择信息
 */
export const accountSelections = mysqlTable("account_selections", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  customerType: mysqlEnum("customerType", ["individual", "joint", "corporate"]).notNull(), // 个人/联名/机构
  accountType: mysqlEnum("accountType", ["cash", "margin", "derivatives"]).notNull(), // 现金/保证金/衍生品
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 3: 个人基本信息
 */
export const personalBasicInfo = mysqlTable("personal_basic_info", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  chineseName: varchar("chineseName", { length: 100 }).notNull(),
  englishName: varchar("englishName", { length: 200 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female", "other"]).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(), // YYYY-MM-DD
  placeOfBirth: varchar("placeOfBirth", { length: 200 }).notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 4: 个人详细信息
 */
export const personalDetailedInfo = mysqlTable("personal_detailed_info", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  idType: varchar("idType", { length: 50 }).notNull(), // 身份证件类型
  idNumber: varchar("idNumber", { length: 100 }).notNull(),
  idIssuingPlace: varchar("idIssuingPlace", { length: 200 }).notNull(),
  idExpiryDate: varchar("idExpiryDate", { length: 10 }), // YYYY-MM-DD or null if permanent
  idIsPermanent: boolean("idIsPermanent").default(false).notNull(),
  maritalStatus: varchar("maritalStatus", { length: 50 }).notNull(),
  educationLevel: varchar("educationLevel", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phoneCountryCode: varchar("phoneCountryCode", { length: 10 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
  residentialAddress: text("residentialAddress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 5: 职业信息
 */
export const occupationInfo = mysqlTable("occupation_info", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 6: 就业详情(收入和净资产)
 */
export const employmentDetails = mysqlTable("employment_details", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  incomeSource: varchar("incomeSource", { length: 100 }).notNull(),
  annualIncome: varchar("annualIncome", { length: 50 }).notNull(), // 年收入范围
  netWorth: varchar("netWorth", { length: 50 }).notNull(), // 净资产范围
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 7: 财务与投资信息
 */
export const financialAndInvestment = mysqlTable("financial_and_investment", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  investmentObjectives: text("investmentObjectives").notNull(), // JSON array
  investmentExperience: text("investmentExperience").notNull(), // JSON object with experience levels
  riskTolerance: varchar("riskTolerance", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 8: 银行账户信息(支持多个)
 */
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  bankName: varchar("bankName", { length: 200 }).notNull(),
  accountCurrency: varchar("accountCurrency", { length: 10 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 100 }).notNull(),
  accountHolderName: varchar("accountHolderName", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 9: 税务信息
 */
export const taxInfo = mysqlTable("tax_info", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  taxResidency: varchar("taxResidency", { length: 100 }).notNull(),
  taxIdNumber: varchar("taxIdNumber", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Case 10: 文件上传记录
 */
export const uploadedDocuments = mysqlTable("uploaded_documents", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  documentType: varchar("documentType", { length: 50 }).notNull(), // id_front, id_back, bank_statement, address_proof
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Case 11: 人脸识别记录
 */
export const faceVerification = mysqlTable("face_verification", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  verified: boolean("verified").default(false).notNull(),
  verificationData: text("verificationData"), // JSON with verification details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Case 12: 监管声明和签署
 */
export const regulatoryDeclarations = mysqlTable("regulatory_declarations", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  isPEP: boolean("isPEP").notNull(), // 是否为政治公众人物
  isUSPerson: boolean("isUSPerson").notNull(), // 是否为美国人
  agreementRead: boolean("agreementRead").default(false).notNull(),
  agreementAccepted: boolean("agreementAccepted").default(false).notNull(),
  signatureName: varchar("signatureName", { length: 200 }).notNull(),
  electronicSignatureConsent: boolean("electronicSignatureConsent").default(false).notNull(),
  amlComplianceConsent: boolean("amlComplianceConsent").default(false).notNull(),
  signedAt: timestamp("signedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
export type AccountSelection = typeof accountSelections.$inferSelect;
export type PersonalBasicInfo = typeof personalBasicInfo.$inferSelect;
export type PersonalDetailedInfo = typeof personalDetailedInfo.$inferSelect;
export type OccupationInfo = typeof occupationInfo.$inferSelect;
export type EmploymentDetails = typeof employmentDetails.$inferSelect;
export type FinancialAndInvestment = typeof financialAndInvestment.$inferSelect;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type TaxInfo = typeof taxInfo.$inferSelect;
export type UploadedDocument = typeof uploadedDocuments.$inferSelect;
export type FaceVerification = typeof faceVerification.$inferSelect;
export type RegulatoryDeclaration = typeof regulatoryDeclarations.$inferSelect;
