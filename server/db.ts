import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  applications, 
  applicationNumberSequences,
  accountSelections,
  personalBasicInfo,
  personalDetailedInfo,
  occupationInfo,
  employmentDetails,
  financialAndInvestment,
  bankAccounts,
  taxInfo,
  uploadedDocuments,
  faceVerification,
  regulatoryDeclarations,
  emailVerificationCodes
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

// ==================== 用户相关 ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.emailVerified !== undefined) {
      values.emailVerified = user.emailVerified;
      updateSet.emailVerified = user.emailVerified;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== 申请编号生成 ====================
/**
 * 生成申请编号: CMF-ACAPP-YYMMDD-XXX
 */
export async function generateApplicationNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 获取当前日期 YYMMDD
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 后两位
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // 查找或创建当日的序列记录
  const existing = await db
    .select()
    .from(applicationNumberSequences)
    .where(eq(applicationNumberSequences.date, dateStr))
    .limit(1);
  
  let sequence: number;
  
  if (existing.length > 0) {
    // 更新序列号
    sequence = existing[0].lastSequence + 1;
    await db
      .update(applicationNumberSequences)
      .set({ lastSequence: sequence })
      .where(eq(applicationNumberSequences.date, dateStr));
  } else {
    // 创建新的序列记录
    sequence = 1;
    await db.insert(applicationNumberSequences).values({
      date: dateStr,
      lastSequence: sequence,
    });
  }
  
  // 格式化序列号为3位数
  const sequenceStr = sequence.toString().padStart(3, '0');
  
  // 返回完整的申请编号
  return `CMF-ACAPP-${dateStr}-${sequenceStr}`;
}

// ==================== 邮箱验证码相关 ====================
export async function createVerificationCode(email: string, code: string, expiresInMinutes: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await db.insert(emailVerificationCodes).values({
    email,
    code,
    expiresAt,
    verified: false,
  });
}

export async function verifyEmailCode(email: string, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.code, code),
        eq(emailVerificationCodes.verified, false)
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);
  
  if (result.length === 0) return false;
  
  const record = result[0];
  if (new Date() > record.expiresAt) return false;
  
  await db
    .update(emailVerificationCodes)
    .set({ verified: true })
    .where(eq(emailVerificationCodes.id, record.id));
  
  return true;
}

// ==================== 申请相关 ====================
export async function createApplication(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(applications).values({
    userId,
    status: "draft",
    currentStep: 1,
    completedSteps: JSON.stringify([]),
  });
  
  return result[0].insertId;
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserApplications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
}

export async function updateApplicationStep(applicationId: number, step: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const app = await getApplicationById(applicationId);
  if (!app) throw new Error("Application not found");
  
  const completedSteps = JSON.parse(app.completedSteps || "[]") as number[];
  if (!completedSteps.includes(step)) {
    completedSteps.push(step);
  }
  
  await db
    .update(applications)
    .set({ 
      currentStep: step,
      completedSteps: JSON.stringify(completedSteps),
      updatedAt: new Date()
    })
    .where(eq(applications.id, applicationId));
}

export async function assignApplicationNumber(applicationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 生成新的CMF格式编号
  const applicationNumber = await generateApplicationNumber();
  
  // 更新申请记录
  await db
    .update(applications)
    .set({ applicationNumber })
    .where(eq(applications.id, applicationId));
  
  return applicationNumber;
}

export async function submitApplication(applicationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(applications)
    .set({ 
      status: "submitted",
      submittedAt: new Date()
    })
    .where(eq(applications.id, applicationId));
}

// ==================== Case数据查询和保存 ====================
export async function saveAccountSelection(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(accountSelections).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getAccountSelection(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accountSelections).where(eq(accountSelections.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function savePersonalBasicInfo(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(personalBasicInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getPersonalBasicInfo(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(personalBasicInfo).where(eq(personalBasicInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function savePersonalDetailedInfo(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(personalDetailedInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getPersonalDetailedInfo(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(personalDetailedInfo).where(eq(personalDetailedInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveOccupationInfo(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(occupationInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getOccupationInfo(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(occupationInfo).where(eq(occupationInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveEmploymentDetails(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(employmentDetails).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getEmploymentDetails(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employmentDetails).where(eq(employmentDetails.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveFinancialAndInvestment(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(financialAndInvestment).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getFinancialAndInvestment(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(financialAndInvestment).where(eq(financialAndInvestment.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveBankAccount(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bankAccounts).values({
    applicationId,
    ...data
  });
  
  return result[0].insertId;
}

export async function getBankAccounts(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bankAccounts).where(eq(bankAccounts.applicationId, applicationId));
}

export async function deleteBankAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
}

export async function saveTaxInfo(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(taxInfo).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getTaxInfo(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(taxInfo).where(eq(taxInfo.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveUploadedDocument(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(uploadedDocuments).values({
    applicationId,
    ...data
  });
  
  return result[0].insertId;
}

export async function getUploadedDocuments(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(uploadedDocuments).where(eq(uploadedDocuments.applicationId, applicationId));
}

export async function saveFaceVerification(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(faceVerification).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getFaceVerification(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(faceVerification).where(eq(faceVerification.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveRegulatoryDeclarations(applicationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(regulatoryDeclarations).values({
    applicationId,
    ...data
  }).onDuplicateKeyUpdate({ set: data });
}

export async function getRegulatoryDeclarations(applicationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(regulatoryDeclarations).where(eq(regulatoryDeclarations.applicationId, applicationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== 获取完整申请数据 ====================
export async function getCompleteApplicationData(applicationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [
    application,
    accountSelection,
    basicInfo,
    detailedInfo,
    occupation,
    employment,
    financial,
    bankAccountsList,
    tax,
    documents,
    face,
    regulatory
  ] = await Promise.all([
    getApplicationById(applicationId),
    getAccountSelection(applicationId),
    getPersonalBasicInfo(applicationId),
    getPersonalDetailedInfo(applicationId),
    getOccupationInfo(applicationId),
    getEmploymentDetails(applicationId),
    getFinancialAndInvestment(applicationId),
    getBankAccounts(applicationId),
    getTaxInfo(applicationId),
    getUploadedDocuments(applicationId),
    getFaceVerification(applicationId),
    getRegulatoryDeclarations(applicationId)
  ]);
  
  return {
    application,
    accountSelection,
    basicInfo,
    detailedInfo,
    occupation,
    employment,
    financial,
    bankAccounts: bankAccountsList,
    tax,
    documents,
    face,
    regulatory
  };
}

// ==================== 邮箱验证码相关 ====================

/**
 * 保存邮箱验证码
 */
export async function saveVerificationCode(email: string, code: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return null;

  try {
    const [result] = await db.insert(emailVerificationCodes).values({
      email,
      code,
      expiresAt,
      verified: false,
    });
    return result.insertId;
  } catch (error) {
    console.error('Error saving verification code:', error);
    return null;
  }
}
