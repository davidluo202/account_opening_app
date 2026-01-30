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
  password: varchar("password", { length: 255 }), // bcrypt hash
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * 申请编号序列追踪表 - 用于生成CMF-ACAPP-YYMMDD-XXX格式的编号
 */
export const applicationNumberSequences = mysqlTable("application_number_sequences", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 6 }).notNull().unique(), // YYMMDD
  lastSequence: int("lastSequence").default(0).notNull(), // 当日最后一个序列号
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "approved", "rejected", "returned"]).default("draft").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  completedSteps: text("completedSteps"), // JSON array of completed step numbers
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  // 电子签署相关字段
  signatureName: varchar("signatureName", { length: 200 }), // 签名人姓名
  signatureTimestamp: timestamp("signatureTimestamp"), // 签署时间戳
  signatureMethod: mysqlEnum("signatureMethod", ["typed", "iamsmart"]), // 签署方式：输入姓名或iAM Smart
  // 审批相关字段
  isProfessionalInvestor: boolean("isProfessionalInvestor").default(false), // 是否为专业投资者（PI）
  approvedRiskProfile: mysqlEnum("approvedRiskProfile", ["low", "medium", "high"]), // 审批人员评估的风险偏好
  // 第一级审批字段
  firstApprovalStatus: mysqlEnum("firstApprovalStatus", ["pending", "approved", "rejected"]).default("pending"), // 第一级审批状态
  firstApprovalBy: varchar("firstApprovalBy", { length: 200 }), // 第一级审批人员ID
  firstApprovalByName: varchar("firstApprovalByName", { length: 200 }), // 第一级审批人员姓名
  firstApprovalByCeNo: varchar("firstApprovalByCeNo", { length: 20 }), // 第一级审批人员CE号码
  firstApprovalAt: timestamp("firstApprovalAt"), // 第一级审批时间
  firstApprovalComments: text("firstApprovalComments"), // 第一级审批意见
  // 第二级审批字段（合规部终审）
  secondApprovalStatus: mysqlEnum("secondApprovalStatus", ["pending", "approved", "rejected"]).default("pending"), // 第二级审批状态
  secondApprovalBy: varchar("secondApprovalBy", { length: 200 }), // 第二级审批人员ID
  secondApprovalByName: varchar("secondApprovalByName", { length: 200 }), // 第二级审批人员姓名
  secondApprovalByCeNo: varchar("secondApprovalByCeNo", { length: 20 }), // 第二级审批人员CE号码（如果有）
  secondApprovalAt: timestamp("secondApprovalAt"), // 第二级审批时间
  secondApprovalComments: text("secondApprovalComments"), // 第二级审批意见
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
  faxNo: varchar("faxNo", { length: 50 }), // 传真号码
  emailVerified: boolean("emailVerified").default(false).notNull(), // 邮箱验证状态
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
  officeFaxNo: varchar("officeFaxNo", { length: 50 }), // 办公传真
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
  liquidAsset: varchar("liquidAsset", { length: 50 }), // 流动资产 HK$
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
  bankLocation: mysqlEnum("bankLocation", ["HK", "CN", "OTHER"]).default("HK").notNull(), // 银行所在地
  accountType: mysqlEnum("accountType", ["saving", "current", "checking", "others"]), // 账户类型
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

/**
 * 审批人员表
 */
export const approvers = mysqlTable("approvers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // 关联users表
  employeeName: varchar("employeeName", { length: 200 }).notNull(), // 员工姓名
  ceNumber: varchar("ceNumber", { length: 50 }).notNull(), // CE No.
  role: varchar("role", { length: 50 }).default("approver").notNull(), // 角色：approver/manager
  isActive: boolean("isActive").default(true).notNull(), // 是否激活
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 审批记录表
 */
export const approvalRecords = mysqlTable("approval_records", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(), // 关联applications表
  approverId: int("approverId").notNull(), // 关联approvers表
  action: mysqlEnum("action", ["approved", "rejected", "returned", "first_approved", "second_approved"]).notNull(), // 审批操作
  comments: text("comments"), // 审批意见
  rejectReason: text("rejectReason"), // 拒绝理由
  returnReason: text("returnReason"), // 退回补充材料理由
  createdAt: timestamp("createdAt").defaultNow().notNull(), // 审批时间
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
export type Approver = typeof approvers.$inferSelect;
export type InsertApprover = typeof approvers.$inferInsert;
export type ApprovalRecord = typeof approvalRecords.$inferSelect;
export type InsertApprovalRecord = typeof approvalRecords.$inferInsert;
