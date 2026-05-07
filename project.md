# 誠港金融開戶系統升級方案 v2.0

> 編制日期：2026-05-04
> 版本：v2.0-DRAFT
> 適用範圍：Account Opening App + CMF-Bookkeeping + 客戶交易門戶
> 共享對象：全體開發Agent（Nova/Icy/Qual/Nas/Imax/Davvy）

---

## 一、現有系統概況

### 1.1 開戶系統（Account Opening App）

- **代碼庫**：`account_opening_app/`
- **技術棧**：TypeScript + React 19 + tRPC 11 + Drizzle ORM 0.44 + MySQL（Railway）
- **部署**：Vercel（前端）+ Railway（數據庫）
- **當前版本**：v1.0.260507
- **功能清單**：
  - 個人開戶 13 步流程：賬戶選擇 → 基本信息 → 詳細信息 → 職業 → 財務 → 投資經驗 → 銀行賬戶 → 稅務 → 文件上傳 → 人臉識別 → 客戶聲明 → 風險問卷 → 監管聲明簽署
  - 機構開戶 11 步流程：賬戶選擇 → 公司基本信息 → 財務信息 → 投資經驗 → 關聯方 → 銀行賬戶 → 稅務 → 文件上傳 → 客戶聲明 → 風險問卷 → 監管聲明簽署
  - 雙級審批：初審（持牌人員，需CE號）→ 終審（合規部）
  - PDF 生成（pdfkit/pdfmake）、S3 文件存儲、Resend 郵件、Face++ 人臉比對
  - 管理後台：用戶管理、審批人員管理、申請審批

### 1.2 現有數據庫表結構

| 表名 | 用途 |
|------|------|
| `users` | 用戶認證（openId/email/password/role） |
| `application_number_sequences` | 申請編號序列（CMF-ACAPP-YYMMDD-XXX） |
| `email_verification_codes` | 郵箱驗證碼 |
| `applications` | 開戶申請主表（含雙級審批字段、PDF URL） |
| `account_selections` | 賬戶類型選擇（individual/joint/corporate + cash/margin/derivatives） |
| `personal_basic_info` | 個人基本信息 |
| `personal_detailed_info` | 個人詳細信息（證件/聯繫/地址） |
| `corporate_basic_info` | 機構基本信息 |
| `corporate_financial_info` | 機構財務信息 |
| `corporate_investment_info` | 機構投資經驗 |
| `corporate_related_parties` | 機構關聯方 |
| `occupation_info` | 職業信息 |
| `employment_details` | 就業詳情（收入/淨資產） |
| `financial_and_investment` | 投資目標與經驗 |
| `bank_accounts` | 銀行賬戶（支持多個） |
| `tax_info` | 稅務信息 |
| `uploaded_documents` | 上傳文件記錄 |
| `face_verification` | 人臉識別記錄 |
| `regulatory_declarations` | 監管聲明 |
| `customer_declarations` | 客戶聲明 |
| `personal_client_declarations` | 個人客戶聲明 |
| `risk_questionnaires` | 風險評估問卷（Q1-Q10 + 評分結果） |
| `approvers` | 審批人員 |
| `approval_records` | 審批記錄 |

### 1.3 財務系統（CMF-Bookkeeping）

- **部署**：Railway
- **功能**：總賬（General Ledger）、日記賬分錄（Journal Entries）、科目表（Chart of Accounts）、多實體架構

---

## 二、升級方案總覽

```
Phase 1：審批後賬號生成          → 2 週（2026-05-05 ~ 2026-05-18）
Phase 2：財務系統對接              → 2 週（2026-05-19 ~ 2026-06-01）
Phase 3.1：資金管理（出入金）    → 3 週（2026-06-02 ~ 2026-06-22）
Phase 3.2：交易界面 + 持倉管理    → 4 週（2026-06-23 ~ 2026-07-20）
Phase 3.3：行情數據 + 報表        → 2 週（2026-07-21 ~ 2026-08-03）
```

**總工期：13 週，預計 2026 年 8 月 3 日完成全部功能。**

---

## 三、Phase 1：審批後賬號自動生成（2 週）

### 3.1 客戶賬號編碼規則

終審通過後，系統自動按以下規則生成客戶賬號：

| 客戶類型 | 格式 | 示例 |
|----------|------|------|
| 個人 | `CMF-IND-YYYYMM-XXXX` | CMF-IND-202605-0001 |
| 機構 | `CMF-CORP-YYYYMM-XXXX` | CMF-CORP-202605-0001 |
| 聯名 | `CMF-JNT-YYYYMM-XXXX` | CMF-JNT-202605-0001 |

- `YYYYMM`：賬號生成年月
- `XXXX`：當月該類型的流水號，從 0001 開始，自動遞增
- 流水號按類型分別計數，互不干擾

### 3.2 新增數據庫表

```sql
-- 客戶賬號表
CREATE TABLE client_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicationId INT NOT NULL UNIQUE,          -- 關聯 applications 表
  userId INT NOT NULL,                         -- 關聯 users 表
  accountNumber VARCHAR(30) NOT NULL UNIQUE,   -- CMF-IND-202605-0001
  customerType ENUM('individual', 'joint', 'corporate') NOT NULL,
  accountType ENUM('cash', 'margin', 'derivatives') NOT NULL,
  status ENUM('pending_activation', 'active', 'suspended', 'closed') DEFAULT 'pending_activation' NOT NULL,
  activatedAt TIMESTAMP NULL,
  welcomeEmailSent BOOLEAN DEFAULT FALSE NOT NULL,
  confirmationLetterUrl VARCHAR(500),          -- 開戶確認函 PDF URL
  bookkeepingAccountCode VARCHAR(50),          -- 財務系統科目代碼，Phase 2 填充
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- 賬號序列表（按類型+年月追蹤流水號）
CREATE TABLE client_account_sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerType ENUM('individual', 'joint', 'corporate') NOT NULL,
  yearMonth VARCHAR(6) NOT NULL,              -- YYYYMM
  lastSequence INT DEFAULT 0 NOT NULL,
  UNIQUE KEY uk_type_month (customerType, yearMonth),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

### 3.3 Drizzle Schema 新增（server 端）

在 `drizzle/schema.ts` 新增：

```typescript
export const clientAccounts = mysqlTable("client_accounts", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().unique(),
  userId: int("userId").notNull(),
  accountNumber: varchar("accountNumber", { length: 30 }).notNull().unique(),
  customerType: mysqlEnum("customerType", ["individual", "joint", "corporate"]).notNull(),
  accountType: mysqlEnum("accountType", ["cash", "margin", "derivatives"]).notNull(),
  status: mysqlEnum("status", ["pending_activation", "active", "suspended", "closed"]).default("pending_activation").notNull(),
  activatedAt: timestamp("activatedAt"),
  welcomeEmailSent: boolean("welcomeEmailSent").default(false).notNull(),
  confirmationLetterUrl: varchar("confirmationLetterUrl", { length: 500 }),
  bookkeepingAccountCode: varchar("bookkeepingAccountCode", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const clientAccountSequences = mysqlTable("client_account_sequences", {
  id: int("id").autoincrement().primaryKey(),
  customerType: mysqlEnum("customerType", ["individual", "joint", "corporate"]).notNull(),
  yearMonth: varchar("yearMonth", { length: 6 }).notNull(),
  lastSequence: int("lastSequence").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### 3.4 申請狀態擴展

現有 `applications.status` 枚舉需擴展：

```
draft → submitted → under_review → approved → account_generated → active
                                  ↘ rejected
                                  ↘ returned
```

具體修改 `applications` 表的 `status` 枚舉：

```typescript
status: mysqlEnum("status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "account_generated",  // 新增：賬號已生成
  "active",             // 新增：賬戶已激活
  "rejected",
  "returned"
]).default("draft").notNull(),
```

### 3.5 核心業務邏輯

**賬號生成流程（在 `secondApprove` mutation 末尾追加）：**

```typescript
// server/account-generation.ts
export async function generateClientAccount(
  applicationId: number,
  customerType: 'individual' | 'joint' | 'corporate',
  accountType: 'cash' | 'margin' | 'derivatives',
  userId: number
): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const typePrefix = {
    individual: 'IND',
    joint: 'JNT',
    corporate: 'CORP',
  }[customerType];

  // 原子操作：獲取並遞增序列號（使用 FOR UPDATE 鎖）
  const sequence = await db.getNextAccountSequence(customerType, yearMonth);
  const accountNumber = `CMF-${typePrefix}-${yearMonth}-${String(sequence).padStart(4, '0')}`;

  // 創建客戶賬號記錄
  await db.createClientAccount({
    applicationId,
    userId,
    accountNumber,
    customerType,
    accountType,
    status: 'pending_activation',
  });

  // 更新申請狀態
  await db.updateApplicationStatus(applicationId, 'account_generated');

  return accountNumber;
}
```

**序列號獲取（需事務 + 行鎖防並發）：**

```typescript
// server/db.ts 新增
export async function getNextAccountSequence(
  customerType: string,
  yearMonth: string
): Promise<number> {
  return await dbInstance.transaction(async (tx) => {
    // SELECT ... FOR UPDATE 鎖住行
    const existing = await tx.select()
      .from(clientAccountSequences)
      .where(and(
        eq(clientAccountSequences.customerType, customerType),
        eq(clientAccountSequences.yearMonth, yearMonth)
      ))
      .for('update');

    if (existing.length > 0) {
      const newSeq = existing[0].lastSequence + 1;
      await tx.update(clientAccountSequences)
        .set({ lastSequence: newSeq })
        .where(eq(clientAccountSequences.id, existing[0].id));
      return newSeq;
    } else {
      await tx.insert(clientAccountSequences).values({
        customerType,
        yearMonth,
        lastSequence: 1,
      });
      return 1;
    }
  });
}
```

### 3.6 開戶確認函 PDF 生成

在現有 `pdf-generator.ts` 基礎上新增 `generateConfirmationLetter` 函數：

```typescript
export async function generateConfirmationLetter(data: {
  accountNumber: string;
  customerName: string;
  customerType: string;
  accountType: string;
  approvalDate: Date;
}): Promise<Buffer> {
  // 使用 pdfkit 生成正式開戶確認函
  // 包含：CMF 公司抬頭、賬號信息、賬戶類型、開戶日期、合規聲明
  // 中英文雙語版本
}
```

### 3.7 歡迎郵件

在 `server/email.ts` 新增 `sendWelcomeEmail`：

```typescript
export async function sendWelcomeEmail(
  to: string,
  customerName: string,
  accountNumber: string,
  confirmationLetterUrl: string
): Promise<boolean> {
  // 郵件內容：
  // - 恭喜開戶成功
  // - 客戶賬號
  // - 開戶確認函下載鏈接
  // - 下一步操作指引（入金、設置密碼等）
  // - CMF 客服聯繫方式
}
```

### 3.8 管理後台新增功能

- 審批列表新增「賬號狀態」列：待生成 / 已生成 / 已激活
- 點擊賬號可查看客戶賬號詳情
- 新增「客戶賬號管理」頁面：搜索、篩選、啟用/停用賬戶

### 3.9 新增 tRPC Router

```typescript
// server/routers.ts 新增
clientAccount: router({
  // 獲取賬號詳情
  getByApplicationId: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => { /* ... */ }),

  // 管理員：獲取所有客戶賬號列表
  list: protectedProcedure.query(async ({ ctx }) => { /* ... */ }),

  // 管理員：激活賬戶（status → active）
  activate: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input }) => { /* ... */ }),

  // 管理員：停用賬戶
  suspend: protectedProcedure
    .input(z.object({ accountId: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => { /* ... */ }),
}),
```

### 3.10 Phase 1 交付物清單

| 序號 | 交付物 | 負責 | 截止日期 |
|------|--------|------|----------|
| 1 | `client_accounts` + `client_account_sequences` 表遷移 | DB | 05-07 |
| 2 | `applications.status` 枚舉擴展遷移 | DB | 05-07 |
| 3 | 賬號生成服務 `account-generation.ts` | Backend | 05-09 |
| 4 | 開戶確認函 PDF 模板 | Backend | 05-12 |
| 5 | 歡迎郵件模板 | Backend | 05-12 |
| 6 | `secondApprove` 流程集成賬號生成 | Backend | 05-14 |
| 7 | 管理後台：賬號管理頁面 | Frontend | 05-16 |
| 8 | 集成測試 + 部署 | QA | 05-18 |

---

## 四、Phase 2：財務系統對接（2 週）

### 4.1 對接架構

```
開戶系統（Vercel）  ──REST API──>  財務系統（Railway）
       |                                    |
  client_accounts              general_ledger / journal_entries
  fund_transactions               chart_of_accounts
```

兩個系統通過 REST API 通信，使用 **共享 API Key** 做服務間認證（存於環境變量 `BOOKKEEPING_API_KEY`）。

### 4.2 財務系統需新增的 API 端點

| 方法 | 路徑 | 用途 |
|------|------|------|
| POST | `/api/integration/create-client-account` | 創建客戶存款科目 |
| GET | `/api/integration/client-balance/:accountCode` | 查詢客戶餘額 |
| POST | `/api/integration/journal-entry` | 創建日記賬分錄 |
| GET | `/api/integration/client-transactions/:accountCode` | 查詢客戶交易記錄 |

### 4.3 科目代碼規則

客戶存款歸入負債類科目：

```
2001（客戶存款總科目）
  |-- 2001-CMF-IND-202605-0001（個人客戶張三）
  |-- 2001-CMF-CORP-202605-0001（機構客戶XX公司）
  +-- 2001-CMF-JNT-202605-0001（聯名客戶李四/王五）
```

- 父科目 `2001` 在科目表中預設，名稱「客戶存款 / Client Deposits」
- 子科目自動創建，格式 `2001-{ClientAccountNumber}`
- 科目名稱自動填充客戶姓名

### 4.4 對接流程

**賬號生成時（Phase 1 的 `generateClientAccount` 末尾追加）：**

```typescript
// 調用財務系統創建科目
const bookkeepingResult = await callBookkeepingAPI('/api/integration/create-client-account', {
  accountCode: `2001-${accountNumber}`,
  accountName: `客戶存款 - ${customerName}`,
  parentCode: '2001',
  currency: 'HKD',
  clientAccountNumber: accountNumber,
});

// 保存財務科目代碼到 client_accounts
await db.updateClientAccountBookkeepingCode(accountId, bookkeepingResult.accountCode);
```

### 4.5 REST API 客戶端

```typescript
// server/bookkeeping-client.ts
const BOOKKEEPING_BASE_URL = process.env.BOOKKEEPING_API_URL; // Railway URL
const BOOKKEEPING_API_KEY = process.env.BOOKKEEPING_API_KEY;

export async function callBookkeepingAPI(path: string, body: any) {
  const res = await fetch(`${BOOKKEEPING_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BOOKKEEPING_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Bookkeeping API error: ${res.status} - ${error}`);
  }

  return res.json();
}
```

### 4.6 對賬機制

- 每日凌晨 2:00 運行對賬任務（可用 Railway Cron 或外部調度）
- 比對：開戶系統 `fund_transactions` 累計餘額 vs 財務系統 GL 餘額
- 差異自動生成告警郵件發送至 `operation@cmfinancial.com`
- 對賬結果記錄到 `reconciliation_logs` 表

### 4.7 Phase 2 交付物清單

| 序號 | 交付物 | 負責 | 截止日期 |
|------|--------|------|----------|
| 1 | 財務系統 Integration API 四個端點 | Bookkeeping | 05-23 |
| 2 | `bookkeeping-client.ts` REST 客戶端 | Backend | 05-23 |
| 3 | 賬號生成 → 自動創建科目集成 | Backend | 05-26 |
| 4 | 對賬任務 + `reconciliation_logs` 表 | Backend | 05-30 |
| 5 | 集成測試（跨系統） | QA | 06-01 |

---

## 五、Phase 3：客戶交易門戶

### 5.1 整體架構設計

```
+---------------------------------------------------+
|                   前端（React）                      |
|  Dashboard | 資金 | 交易 | 持倉 | 行情 | 報表       |
+---------------------------------------------------+
|              tRPC + WebSocket                        |
+---------------------------------------------------+
|                   後端（Express）                     |
|  Auth | Account | Fund | Order | Market | Report     |
+----------+----------+----------------------------+
|  MySQL   | Redis    | External APIs                  |
| (Railway)| (Cache)  | (HTIFS/Market Data)            |
+----------+----------+----------------------------+
```

### 5.2 技術選型新增

| 需求 | 技術方案 | 說明 |
|------|----------|------|
| 實時數據推送 | WebSocket（ws 庫） | 行情、訂單狀態實時更新 |
| 緩存層 | Redis（Upstash） | 行情數據緩存、Session 管理 |
| 圖表 | recharts（已有）+ TradingView Lightweight Charts | K線圖、持倉分布圖 |
| 國際化 | i18next + react-i18next | 繁體中文/簡體中文/英文 |
| 主題 | next-themes（已有） | 深色/淺色主題 |
| 2FA | otpauth 庫 + QR Code | TOTP 雙重認證 |
| PDF 報表 | pdfkit（已有）增強 | 月結單、稅務報告 |
| Excel 導出 | xlsx 或 exceljs | 交易記錄導出 |

### 5.3 Phase 3.1：資金管理（3 週）

#### 5.3.1 新增數據庫表

```sql
-- 資金交易表（出入金）
CREATE TABLE fund_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientAccountId INT NOT NULL,                -- 關聯 client_accounts
  transactionNumber VARCHAR(30) NOT NULL UNIQUE, -- FT-YYYYMMDD-XXXX
  type ENUM('deposit', 'withdrawal') NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'HKD' NOT NULL,
  status ENUM('pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
  -- 入金專用
  depositMethod ENUM('bank_transfer', 'cheque', 'fps') NULL,
  bankReference VARCHAR(100),                   -- 銀行參考號
  proofFileUrl VARCHAR(500),                    -- 入金證明文件 URL
  proofFileKey VARCHAR(500),
  -- 出金專用
  withdrawalBankAccountId INT NULL,             -- 關聯 bank_accounts，出金到哪個銀行
  -- 審批
  approvedBy INT NULL,
  approvedAt TIMESTAMP NULL,
  approvalComments TEXT,
  rejectedReason TEXT,
  -- 財務系統
  journalEntryId VARCHAR(50),                   -- 財務系統日記賬ID
  -- 時間戳
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  completedAt TIMESTAMP NULL
);
```

#### 5.3.2 入金流程

```
客戶提交入金申請（選擇方式 + 金額 + 上傳憑證）
     |
系統生成入金單號（FT-YYYYMMDD-XXXX），status = pending
     |
管理員審核入金憑證
     | 通過
status -> approved -> 調用財務系統記賬：
  DR: 1001（銀行存款）
  CR: 2001-{客戶賬號}（客戶存款）
     |
status -> completed，更新客戶可用餘額
     |
發送入金到賬通知郵件
```

#### 5.3.3 出金流程

```
客戶提交出金申請（選擇銀行賬戶 + 金額）
     |
系統校驗：可用餘額 >= 出金金額
     |
生成出金單號，status = pending
     |
管理員審核
     | 通過
status -> approved -> 調用財務系統記賬：
  DR: 2001-{客戶賬號}（客戶存款）
  CR: 1001（銀行存款）
     |
財務部執行銀行轉賬
     |
status -> completed
     |
發送出金完成通知郵件
```

#### 5.3.4 餘額查詢

```typescript
// 客戶餘額 = 所有已完成入金之和 - 所有已完成出金之和 - 持倉佔用保證金
interface ClientBalance {
  totalBalance: number;      // 總資產
  availableBalance: number;  // 可用餘額（可出金/可交易）
  marginBalance: number;     // 保證金佔用
  unrealizedPnL: number;     // 未實現盈虧
  buyingPower: number;       // 購買力（現金賬戶=可用餘額，保證金賬戶=可用餘額*槓桿倍數）
}
```

#### 5.3.5 tRPC Router

```typescript
fund: router({
  // 客戶：提交入金申請
  deposit: protectedProcedure.input(depositSchema).mutation(/* ... */),
  // 客戶：提交出金申請
  withdraw: protectedProcedure.input(withdrawSchema).mutation(/* ... */),
  // 客戶：查詢餘額
  getBalance: protectedProcedure.query(/* ... */),
  // 客戶：查詢出入金歷史
  getTransactions: protectedProcedure.input(paginationSchema).query(/* ... */),
  // 管理員：出入金審批列表
  getPendingTransactions: protectedProcedure.query(/* ... */),
  // 管理員：審批出入金
  approveTransaction: protectedProcedure.input(approveSchema).mutation(/* ... */),
  // 管理員：拒絕出入金
  rejectTransaction: protectedProcedure.input(rejectSchema).mutation(/* ... */),
}),
```

### 5.4 Phase 3.2：交易界面 + 持倉管理（4 週）

#### 5.4.1 新增數據庫表

```sql
-- 訂單表
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientAccountId INT NOT NULL,
  orderNumber VARCHAR(30) NOT NULL UNIQUE,      -- ORD-YYYYMMDD-XXXX
  symbol VARCHAR(20) NOT NULL,                   -- 股票代碼（如 0700.HK）
  stockName VARCHAR(100),                        -- 股票名稱
  side ENUM('buy', 'sell') NOT NULL,
  orderType ENUM('market', 'limit', 'stop', 'stop_limit') NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(18,4) NULL,                      -- limit/stop 價格
  stopPrice DECIMAL(18,4) NULL,                  -- stop 觸發價格
  filledQuantity INT DEFAULT 0 NOT NULL,
  averageFilledPrice DECIMAL(18,4) NULL,
  status ENUM('pending', 'submitted', 'partial_filled', 'filled', 'cancelled', 'rejected', 'expired') DEFAULT 'pending' NOT NULL,
  timeInForce ENUM('day', 'gtc', 'ioc', 'fok') DEFAULT 'day' NOT NULL,
  commission DECIMAL(18,2) DEFAULT 0,
  stampDuty DECIMAL(18,2) DEFAULT 0,
  tradingFee DECIMAL(18,2) DEFAULT 0,
  totalCost DECIMAL(18,2) DEFAULT 0,             -- 成交金額 + 所有費用
  errorMessage TEXT,
  submittedAt TIMESTAMP NULL,
  filledAt TIMESTAMP NULL,
  cancelledAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- 持倉表
CREATE TABLE holdings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientAccountId INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  stockName VARCHAR(100),
  quantity INT NOT NULL,                          -- 持有數量
  averageCost DECIMAL(18,4) NOT NULL,            -- 平均成本
  totalCost DECIMAL(18,2) NOT NULL,              -- 總成本
  currentPrice DECIMAL(18,4) DEFAULT 0,          -- 當前價格（定期更新）
  marketValue DECIMAL(18,2) DEFAULT 0,           -- 當前市值
  unrealizedPnL DECIMAL(18,2) DEFAULT 0,         -- 未實現盈虧
  unrealizedPnLPercent DECIMAL(8,4) DEFAULT 0,   -- 未實現盈虧百分比
  realizedPnL DECIMAL(18,2) DEFAULT 0,           -- 已實現盈虧（累計）
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY uk_account_symbol (clientAccountId, symbol)
);

-- 成交記錄表
CREATE TABLE trade_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  clientAccountId INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side ENUM('buy', 'sell') NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(18,4) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  commission DECIMAL(18,2) DEFAULT 0,
  executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### 5.4.2 訂單流程

```
客戶下單（symbol + side + type + quantity + price）
     |
前端校驗：餘額/持倉是否足夠
     |
後端校驗：
  買入 -> 可用餘額 >= 預估金額（quantity * price + 預估費用）
  賣出 -> 持倉數量 >= 賣出數量
     |
生成訂單號，status = pending
     |
提交到交易系統（Phase 3.2 暫用手動確認；後續對接 HTIFS FIX 協議）
     |
成交回報 -> 更新 orders + holdings + trade_executions
     |
調用財務系統記賬：
  買入：DR: 持有股票資產  CR: 客戶存款 + 銀行（佣金）
  賣出：DR: 客戶存款 + 銀行（佣金）  CR: 持有股票資產 +/- 盈虧
     |
WebSocket 推送訂單狀態更新到客戶端
```

#### 5.4.3 費用計算

```typescript
interface TradingFees {
  commission: number;     // 佣金：成交金額 * 0.25%，最低 HK$100
  stampDuty: number;      // 印花稅：成交金額 * 0.13%（買賣雙方均需）
  tradingFee: number;     // 交易費：成交金額 * 0.00565%
  settlementFee: number;  // 結算費：成交金額 * 0.002%，最低 HK$2，最高 HK$100
  sfcLevy: number;        // SFC 徵費：成交金額 * 0.0027%
  frcLevy: number;        // FRC 徵費：成交金額 * 0.00015%
}
```

#### 5.4.4 持倉管理前端頁面

- **持倉概覽**：表格展示全部持倉，列含股票代碼、名稱、數量、均價、現價、盈虧、佔比
- **板塊分布**：餅圖展示行業/板塊分佈
- **收益曲線**：折線圖展示賬戶淨值變化（日/週/月/年）
- **未實現/已實現盈虧**：分開展示，支持按股票篩選

#### 5.4.5 tRPC Router

```typescript
order: router({
  // 客戶：下單
  place: protectedProcedure.input(orderSchema).mutation(/* ... */),
  // 客戶：撤單
  cancel: protectedProcedure.input(z.object({ orderId: z.number() })).mutation(/* ... */),
  // 客戶：查詢待成交訂單
  getPending: protectedProcedure.query(/* ... */),
  // 客戶：查詢歷史訂單
  getHistory: protectedProcedure.input(paginationSchema).query(/* ... */),
}),

portfolio: router({
  // 客戶：查詢持倉
  getHoldings: protectedProcedure.query(/* ... */),
  // 客戶：查詢盈虧明細
  getPnLBreakdown: protectedProcedure.query(/* ... */),
  // 客戶：查詢收益曲線數據
  getPerformance: protectedProcedure.input(z.object({
    period: z.enum(['1d', '1w', '1m', '3m', '6m', '1y', 'all']),
  })).query(/* ... */),
}),
```

### 5.5 Phase 3.3：行情數據 + 報表（2 週）

#### 5.5.1 新增數據庫表

```sql
-- 自選股表
CREATE TABLE watchlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(50) DEFAULT 'default' NOT NULL,
  symbols TEXT NOT NULL,                         -- JSON array: ["0700.HK", "9988.HK"]
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY uk_user_name (userId, name)
);

-- 行情緩存表
CREATE TABLE market_data_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  stockName VARCHAR(100),
  lastPrice DECIMAL(18,4),
  changeAmount DECIMAL(18,4),
  changePercent DECIMAL(8,4),
  volume BIGINT,
  turnover DECIMAL(18,2),
  high DECIMAL(18,4),
  low DECIMAL(18,4),
  open DECIMAL(18,4),
  previousClose DECIMAL(18,4),
  marketCap DECIMAL(20,2),
  peRatio DECIMAL(10,2),
  dividendYield DECIMAL(8,4),
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

#### 5.5.2 行情數據來源

**優先級排序：**

1. **HTIFS FIX 協議**（如已對接交易系統，直接獲取實時行情）
2. **Yahoo Finance API**（免費，延遲 15 分鐘，適合初期）
3. **東方財富 API**（港股數據豐富，需評估合規性）
4. **收費方案**：Refinitiv / Bloomberg B-PIPE（專業級，後期考慮）

**初期方案（Phase 3.3）**：使用 Yahoo Finance API 作為數據源，15 分鐘延遲，足夠展示持倉估值和行情概覽。後續升級為實時數據源。

#### 5.5.3 WebSocket 實時推送

```typescript
// server/websocket.ts
import { WebSocketServer } from 'ws';

// 推送類型
type WSMessage =
  | { type: 'quote_update'; data: { symbol: string; price: number; change: number } }
  | { type: 'order_update'; data: { orderId: number; status: string } }
  | { type: 'balance_update'; data: { availableBalance: number } }
  | { type: 'notification'; data: { title: string; message: string } };

// 每 5 秒推送自選股行情更新
// 訂單狀態變化即時推送
// 出入金完成即時推送
```

#### 5.5.4 報表模塊

| 報表類型 | 格式 | 內容 |
|----------|------|------|
| 月結單 | PDF | 賬戶摘要、當月交易記錄、持倉明細、費用明細、期末餘額 |
| 稅務報告 | PDF/Excel | 年度資本收益/損失彙總、股息收入、費用扣除 |
| 交易記錄 | Excel | 指定時段全部交易明細，含費用 |
| 持倉報告 | PDF | 截至指定日期的持倉快照 |

**月結單自動生成**：每月 1 日凌晨自動生成上月月結單，保存到 S3，發送郵件通知客戶。

```typescript
report: router({
  // 客戶：生成月結單
  generateMonthlyStatement: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .mutation(/* ... */),
  // 客戶：生成稅務報告
  generateTaxReport: protectedProcedure
    .input(z.object({ taxYear: z.number() }))
    .mutation(/* ... */),
  // 客戶：導出交易記錄
  exportTransactions: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string(), format: z.enum(['pdf', 'excel']) }))
    .mutation(/* ... */),
}),
```

---

## 六、前端設計規範

### 6.1 設計參考

參考行業領先券商的 UI/UX 設計：
- **富途/moomoo**：深色主題、數據密度高、操作流暢
- **老虎證券**：簡潔現代、圖表豐富
- **Interactive Brokers**：專業級功能、信息完整
- **嘉信理財（Charles Schwab）**：清晰易用、面向大眾

### 6.2 佈局結構

```
+--------------------------------------------------+
|  頂部導航欄（Logo / 搜索 / 通知 / 用戶菜單）        |
+--------+-----------------------------------------+
|        |                                           |
|  側邊   |       主內容區域                           |
|  導航   |                                           |
|  欄     |                                           |
|        |                                           |
+--------+-----------------------------------------+
|  底部狀態欄（市場狀態 / 連接狀態 / 版本號）           |
+--------------------------------------------------+
```

**側邊導航菜單：**
- 首頁（Dashboard）
- 資金管理
  - 入金
  - 出金
  - 資金流水
- 交易
  - 下單
  - 委託查詢
  - 歷史成交
- 持倉
- 行情
  - 自選股
  - 市場概覽
- 報表
- 設置

### 6.3 響應式設計

| 斷點 | 佈局 |
|------|------|
| >=1280px | 完整側邊欄 + 主內容 |
| 768-1279px | 收縮側邊欄（僅圖標）+ 主內容 |
| <768px | 底部 Tab 導航 + 全屏主內容 |

### 6.4 主題系統

基於現有 `next-themes`，擴展深色主題色板：

```css
/* 深色主題 - 行情專用色 */
--color-up: #ef4444;      /* 上漲紅色（港股慣例） */
--color-down: #22c55e;    /* 下跌綠色 */
--color-flat: #6b7280;    /* 平盤灰色 */
```

### 6.5 多語言

使用 `i18next`，支持三種語言：

| 語言代碼 | 語言 | 優先級 |
|----------|------|--------|
| `zh-TW` | 繁體中文 | 默認 |
| `zh-CN` | 簡體中文 | 支持 |
| `en` | English | 支持 |

翻譯文件結構：
```
client/locales/
  +-- zh-TW/
  |   +-- common.json
  |   +-- dashboard.json
  |   +-- fund.json
  |   +-- trading.json
  |   +-- report.json
  +-- zh-CN/
  |   +-- ...
  +-- en/
      +-- ...
```

---

## 七、安全設計

### 7.1 雙重認證（2FA）

- 客戶首次登入交易門戶後強制設置 2FA
- 支持 TOTP（Google Authenticator / Authy）
- 關鍵操作需二次驗證：出金、修改銀行賬戶、修改密碼

### 7.2 會話管理

- Session 超時：交易頁面 15 分鐘無操作自動登出
- 一般頁面 60 分鐘超時
- 同時最多 3 個活躍 Session
- 異地登入提醒（IP 變更通知）

### 7.3 IP 白名單（可選）

- 管理員可設置客戶 IP 白名單
- 非白名單 IP 登入需額外驗證
- 企業客戶可強制啟用

### 7.4 操作日誌

```sql
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  action VARCHAR(50) NOT NULL,          -- login, order_place, withdrawal, password_change, etc.
  resource VARCHAR(50),                  -- order, fund_transaction, account, etc.
  resourceId INT,
  details TEXT,                          -- JSON
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 八、完整數據庫 Schema 擴展彙總

### 新增表（10 張）

| 表名 | Phase | 用途 |
|------|-------|------|
| `client_accounts` | 1 | 客戶賬號 |
| `client_account_sequences` | 1 | 賬號序列 |
| `fund_transactions` | 3.1 | 出入金記錄 |
| `orders` | 3.2 | 訂單 |
| `holdings` | 3.2 | 持倉 |
| `trade_executions` | 3.2 | 成交記錄 |
| `watchlists` | 3.3 | 自選股 |
| `market_data_cache` | 3.3 | 行情緩存 |
| `audit_logs` | 3.1 | 操作日誌 |
| `reconciliation_logs` | 2 | 對賬記錄 |

### 修改表

| 表名 | 修改內容 |
|------|----------|
| `applications` | `status` 枚舉新增 `account_generated`、`active` |
| `users` | 新增 `twoFactorSecret`、`twoFactorEnabled`、`preferredLanguage`、`theme` 字段 |

---

## 九、環境變量新增

```env
# Phase 1
# （無新增，使用現有 RESEND_API_KEY）

# Phase 2
BOOKKEEPING_API_URL=https://cmf-bookkeeping-xxx.railway.app
BOOKKEEPING_API_KEY=sk_bookkeeping_xxx

# Phase 3
REDIS_URL=redis://xxx@xxx.upstash.io:6379        # Upstash Redis
YAHOO_FINANCE_API_KEY=xxx                          # 行情數據（如需付費版）
HTIFS_FIX_HOST=xxx                                 # HTIFS FIX 連接（後期）
HTIFS_FIX_PORT=xxx
HTIFS_SENDER_COMP_ID=CMF
HTIFS_TARGET_COMP_ID=HTIFS
```

---

## 十、測試策略

### 10.1 單元測試（vitest，現有框架）

- 賬號生成：編號格式正確、序列號遞增、並發安全
- 費用計算：各項費用計算準確
- 餘額計算：入金/出金/交易後餘額正確
- 持倉更新：買入/賣出後持倉數量和均價正確

### 10.2 集成測試

- 完整流程：開戶 → 審批 → 賬號生成 → 入金 → 下單 → 成交 → 持倉更新
- 跨系統：開戶系統 <-> 財務系統 API 調用
- 異常場景：餘額不足、重複下單、網絡超時

### 10.3 安全測試

- SQL 注入：所有用戶輸入均通過 Drizzle ORM 參數化查詢
- XSS：React 默認轉義 + 敏感字段額外校驗
- CSRF：tRPC mutation 自帶 CSRF 防護
- 權限越界：客戶 A 不能訪問客戶 B 的數據

---

## 十一、部署計劃

| 組件 | 平台 | 說明 |
|------|------|------|
| 前端 | Vercel | 現有部署不變，新增頁面自動構建 |
| 後端 API | Vercel（Serverless） | 現有 tRPC 不變 |
| WebSocket | Railway | WebSocket 需長連接，Vercel Serverless 不支持，單獨部署 |
| MySQL | Railway | 現有數據庫，新增表 |
| Redis | Upstash | 免費層足夠初期使用 |
| 文件存儲 | AWS S3 | 現有存儲不變 |
| 郵件 | Resend | 現有配置不變 |

### 部署注意事項

1. 每次推送前必須更新 `package.json` 版本號
2. 確認 `dist/` 不在 git 跟蹤中
3. `tsc --noEmit` 通過後方可推送
4. Railway 數據庫遷移使用 `drizzle-kit push`

---

## 十二、風險與應對

| 風險 | 影響 | 應對措施 |
|------|------|----------|
| 賬號生成並發衝突 | 重複賬號 | 數據庫事務 + FOR UPDATE 行鎖 + UNIQUE 約束 |
| 財務系統 API 不可用 | 賬號生成失敗 | 異步重試隊列，賬號先生成後補錄科目 |
| 行情數據源不穩定 | 持倉估值不準 | 多數據源降級、本地緩存兜底 |
| WebSocket 連接斷開 | 客戶收不到實時更新 | 自動重連 + 心跳檢測 + HTTP 輪詢降級 |
| Railway 構建失敗 | 部署中斷 | 嚴格 tsc 檢查、未使用 import 會導致構建失敗 |

---

## 十三、各 Agent 分工建議

| Agent | 負責模塊 | 說明 |
|-------|----------|------|
| Nova | Phase 1 全部 + Phase 2 開戶端 | 熟悉開戶系統代碼庫 |
| Icy | Phase 2 財務端 API | 熟悉 Bookkeeping 系統 |
| Qual | Phase 3.1 資金管理 | 出入金流程 |
| Nas | Phase 3.2 交易界面 | 訂單 + 持倉 |
| Imax | Phase 3.3 行情 + 報表 | 數據源對接 + PDF/Excel |
| Davvy | 前端 UI + 多語言 + 主題 | 全局樣式 + i18n |

---

## 十四、里程碑與驗收標準

### M1：Phase 1 完成（2026-05-18）
- [ ] 終審通過後自動生成客戶賬號
- [ ] 賬號格式符合規範（CMF-IND/CORP/JNT-YYYYMM-XXXX）
- [ ] 歡迎郵件成功發送（含賬號信息）
- [ ] 開戶確認函 PDF 正確生成
- [ ] 管理後台可查看/管理客戶賬號

### M2：Phase 2 完成（2026-06-01）
- [ ] 賬號生成同時在財務系統創建科目
- [ ] 科目代碼格式 2001-{客戶賬號}
- [ ] 餘額對賬功能正常運行

### M3：Phase 3.1 完成（2026-06-22）
- [ ] 客戶可提交入金/出金申請
- [ ] 管理員可審批出入金
- [ ] 審批通過後自動記賬
- [ ] 餘額實時更新
- [ ] 出入金郵件通知

### M4：Phase 3.2 完成（2026-07-20）
- [ ] 客戶可下買入/賣出訂單
- [ ] 訂單成交後持倉自動更新
- [ ] 費用計算正確
- [ ] 盈虧計算正確
- [ ] WebSocket 實時推送訂單狀態

### M5：Phase 3.3 完成（2026-08-03）
- [ ] 自選股功能正常
- [ ] 行情數據正常展示
- [ ] 月結單 PDF 正確生成
- [ ] 交易記錄可導出 Excel
- [ ] 多語言切換正常
- [ ] 深色/淺色主題正常

---

> **本文檔為全體 Agent 共享參考。每個 Phase 開始前，負責 Agent 需基於本方案編寫詳細的技術設計文檔（TDD），經 David 確認後方可開工。**
>
> **任何修改需同步更新本文檔版本號並通知所有 Agent。**
