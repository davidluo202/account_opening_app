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
  approvedRiskProfile: mysqlEnum("approvedRiskProfile", ["Lowest", "Low", "Low to Medium", "Medium", "Medium to High", "High"]), // 审批人员评估的风险等级（新6级评分系统）
  // 第一级审批字段
  firstApprovalStatus: mysqlEnum("firstApprovalStatus", ["pending", "approved", "rejected"]).default("pending"), // 第一级审批状态
  firstApprovalBy: varchar("firstApprovalBy", { length: 200 }), // 第一级审批人员ID
  firstApprovalByName: varchar("firstApprovalByName", { length: 200 }), // 第一级审批人员姓名
  firstApprovalByCeNo: varchar("firstApprovalByCeNo", { length: 20 }), // 第一级审批人员CE号码
  firstApprovalAt: timestamp("firstApprovalAt"), // 第一级审批时间
  firstApprovalComments: text("firstApprovalComments"), // 第一级审批意见
  firstApprovalIsProfessionalInvestor: boolean("firstApprovalIsProfessionalInvestor"), // 初审人员认定的PI状态
  firstApprovalRiskProfile: mysqlEnum("firstApprovalRiskProfile", ["Lowest", "Low", "Low to Medium", "Medium", "Medium to High", "High"]), // 初审人员评估的风险等级（新6级评分系统）
  // 第二级审批字段（合规部终审）
  secondApprovalStatus: mysqlEnum("secondApprovalStatus", ["pending", "approved", "rejected"]).default("pending"), // 第二级审批状态
  secondApprovalBy: varchar("secondApprovalBy", { length: 200 }), // 第二级审批人员ID
  secondApprovalByName: varchar("secondApprovalByName", { length: 200 }), // 第二级审批人员姓名
  secondApprovalByCeNo: varchar("secondApprovalByCeNo", { length: 20 }), // 第二级审批人员CE号码（如果有）
  secondApprovalAt: timestamp("secondApprovalAt"), // 第二级审批时间
  secondApprovalComments: text("secondApprovalComments"), // 第二级审批意见
  // PDF版本管理字段
  customerPdfUrl: varchar("customerPdfUrl", { length: 500 }), // 客户版PDF URL（不包含审批信息）
  firstReviewPdfUrl: varchar("firstReviewPdfUrl", { length: 500 }), // 初审版PDF URL（包含初审信息）
  finalReviewPdfUrl: varchar("finalReviewPdfUrl", { length: 500 }), // 终审版PDF URL（包含初审+终审信息）
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
  // 住宅电话（可选）
  phoneCountryCode: varchar("phoneCountryCode", { length: 10 }),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  // 手机号码（必填）
  mobileCountryCode: varchar("mobileCountryCode", { length: 10 }).notNull(),
  mobileNumber: varchar("mobileNumber", { length: 50 }).notNull(),
  faxNo: varchar("faxNo", { length: 50 }), // 传真号码
  emailVerified: boolean("emailVerified").default(false).notNull(), // 邮箱验证状态
  residentialAddress: text("residentialAddress").notNull(),
  // 账单通讯地址
  billingAddressType: mysqlEnum("billingAddressType", ["residential", "office", "other"]).notNull(),
  billingAddressOther: text("billingAddressOther"), // 当选择"other"时填写
  // 账单首选语言
  preferredLanguage: mysqlEnum("preferredLanguage", ["chinese", "english"]).notNull(),
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
  riskTolerance: mysqlEnum("riskTolerance", ["R1", "R2", "R3", "R4", "R5"]).notNull(), // 客户选择的风险等级：R1(低风险) R2(中低风险) R3(中风险) R4(中高风险) R5(高风险)
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
  riskAssessmentConsent: boolean("riskAssessmentConsent").default(false).notNull(),
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

/**
 * 风险评估问卷表
 */
export const riskQuestionnaires = mysqlTable("risk_questionnaires", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  // PART 1: 适用于全部客户 (Q1-Q6)
  q1_current_investments: text("q1_current_investments"), // 多选，JSON数组
  q2_investment_period: varchar("q2_investment_period", { length: 50 }),
  q3_price_volatility: varchar("q3_price_volatility", { length: 50 }),
  q4_investment_percentage: varchar("q4_investment_percentage", { length: 50 }),
  q5_investment_attitude: varchar("q5_investment_attitude", { length: 100 }),
  q6_derivatives_knowledge: text("q6_derivatives_knowledge"), // 多选，JSON数组
  // PART 2A: 适用个人/联名客户 (Q7-Q10)
  q7_age_group: varchar("q7_age_group", { length: 50 }),
  q8_education_level: varchar("q8_education_level", { length: 50 }),
  q9_investment_knowledge_sources: text("q9_investment_knowledge_sources"), // 多选，JSON数组
  q10_liquidity_needs: varchar("q10_liquidity_needs", { length: 100 }),
  // 评分结果
  totalScore: int("totalScore"),
  riskLevel: varchar("riskLevel", { length: 50 }), // 最低风险/低风险/低至中等风险/中等风险/中等至高风险/高风险
  riskDescription: text("riskDescription"), // 风险等级描述（投资取向）
  // 客户确认签署
  customerSignature: varchar("customerSignature", { length: 200 }),
  signatureDate: varchar("signatureDate", { length: 10 }), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 客户声明表
 */
export const customerDeclarations = mysqlTable("customer_declarations", {
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
export type Approver = typeof approvers.$inferSelect;
export type InsertApprover = typeof approvers.$inferInsert;
export type ApprovalRecord = typeof approvalRecords.$inferSelect;
export type InsertApprovalRecord = typeof approvalRecords.$inferInsert;
export type RiskQuestionnaire = typeof riskQuestionnaires.$inferSelect;
export type InsertRiskQuestionnaire = typeof riskQuestionnaires.$inferInsert;
export type CustomerDeclaration = typeof customerDeclarations.$inferSelect;
export type InsertCustomerDeclaration = typeof customerDeclarations.$inferInsert;
