# 誠港金融開戶系統綜合開發計劃 v3.0

> **版本**：v3.0  
> **編制日期**：2026-05-04  
> **計劃週期**：2026-05-08 ~ 2026-07-02（8週）  
> **適用範圍**：Account Opening App + CMF-Bookkeeping + 客戶交易門戶 + 7大數據庫  
> **公司背景**：誠港金融 CMF Financial，香港持牌券商，持有SFC第1類（證券交易）、第4類（就證券提供意見）、第9類（資產管理）牌照  
> **技術棧**：TypeScript + React 19 + tRPC 11 + Drizzle ORM 0.44 + MySQL（Railway）+ Vercel  
> **資源分配**：Claude（主力編碼）、Hermes（代碼審計）、Nova（合規建議+開戶業務）、Qual（測試）

---

## 1. 總體架構（一頁概覽）

### 1.1 七大數據庫關係

```
┌──────────────────────────────────────────────────────────────────┐
│                    CMF 核心系統架構（7大數據庫）                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│   │ 1.Clients│───▶│2.Trading │───▶│3.Custody │                   │
│   │ 客戶數據庫│    │ 交易數據庫│    │ 託管數據庫│                   │
│   │          │    │          │    │（持倉）   │                   │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘                   │
│        │               │               │                         │
│        │         ┌─────┴──────┐        │                         │
│        │         ▼            ▼        ▼                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│   │ 5.Staff  │  │4.Counter │  │6.Account │                      │
│   │ 員工數據庫│  │  party   │  │  ing     │                      │
│   │（審批權限）│  │ 同業數據庫│  │ 會計數據庫│                      │
│   └──────────┘  └──────────┘  └──────────┘                      │
│                                    │                             │
│                              ┌─────┴─────┐                      │
│                              │7.Market   │                      │
│                              │  Data     │                      │
│                              │ 行情數據庫 │                      │
│                              └───────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

**數據庫職責說明：**

| # | 數據庫 | 職責 | 核心表 | 主鍵前綴 |
|---|--------|------|--------|----------|
| 1 | Clients（客戶） | 開戶申請、KYC、風險評估、客戶賬號 | applications, client_accounts, bank_accounts | CA- |
| 2 | Trading（交易） | 訂單、成交記錄、費用計算 | orders, trade_executions | ORD-/TX- |
| 3 | Custody（託管） | 客戶持倉、資產明細、盈虧追蹤 | holdings, positions | HL- |
| 4 | Counterparty（同業） | 交易對手、結算行、託管行 | counterparties, interbank_accounts | CB- |
| 5 | Staff（員工） | 員工信息、CE號、審批權限 | employees, roles, approvers | EMP- |
| 6 | Accounting（會計） | 總賬GL、日記賬JE、科目表COA | general_ledger, journal_entries, chart_of_accounts | GL-/JE- |
| 7 | Market Data（行情） | 實時報價、K線、自選股 | market_data_cache, watchlists | — |

**跨庫關聯方式：**
- 所有數據庫通過 `clientAccountId` / `accountNumber` 關聯到 Clients 庫
- Trading → Custody：成交後自動更新持倉
- Trading → Accounting：成交後自動生成會計分錄
- Clients → Accounting：開戶後自動創建客戶存款科目（2001子科目）
- Staff → Clients：審批人員CE號關聯審批記錄
- Counterparty → Trading：OTC交易關聯交易對手
- Market Data → Custody：行情更新驅動持倉估值

### 1.2 系統間集成方式

```
開戶系統（Vercel）──REST API──▶ 財務系統 CMF-Bookkeeping（Railway）
       │                              │
       │ tRPC                    REST /api/integration/*
       ▼                              ▼
  MySQL Railway DB              MySQL Railway DB
  （Clients/Trading/            （Accounting）
   Custody/Staff/
   Counterparty/MarketData）
```

- **前後端通信**：tRPC 11（類型安全RPC）
- **系統間通信**：REST API + 共享API Key（`BOOKKEEPING_API_KEY`）
- **實時推送**：WebSocket（ws庫，部署在Railway，行情/訂單狀態）
- **緩存**：Upstash Redis（行情數據、Session）
- **文件存儲**：AWS S3（文件上傳、PDF）
- **郵件**：Resend API

### 1.3 技術棧確認

| 層級 | 技術 | 版本/服務 |
|------|------|-----------|
| 前端框架 | React | 19 |
| 類型系統 | TypeScript | 嚴格模式 |
| API層 | tRPC | 11 |
| ORM | Drizzle | 0.44 |
| 數據庫 | MySQL 8 | Railway託管 |
| 緩存 | Redis | Upstash |
| 部署-前端 | Vercel | Serverless |
| 部署-WebSocket | Railway | 長連接 |
| 部署-DB | Railway | MySQL |
| 圖表 | recharts + TradingView Lightweight Charts | K線圖 |
| PDF | pdfkit / pdfmake | 已有 |
| Excel | exceljs | 新增 |
| 人臉識別 | Face++ | 已有 |
| 國際化 | i18next | 繁中/簡中/英 |
| 2FA | otpauth | TOTP |

---

## 2. 開發計劃（按週排列，8週衝刺）

> **原計劃13週，壓縮至8週。** 核心策略：Phase 1+2合併（數據庫框架與賬號生成同步推進）、交易與持倉並行開發、行情和報表壓縮為1週。

---

### Week 1（5/8 - 5/14）：賬號自動生成 + 歡迎郵件 + 7大DB框架

**目標**：終審通過後自動生成客戶賬號，同時搭建全部7個數據庫的Schema框架。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 5/8 (四) | ① 創建 `client_accounts` + `client_account_sequences` 表遷移；② 擴展 `applications.status` 枚舉（新增 `account_generated`、`active`）；③ Drizzle schema定義 | `drizzle-kit push` 成功，表結構正確 |
| 5/9 (五) | ① 實現賬號生成服務 `account-generation.ts`（含事務+行鎖）；② 序列號原子操作（FOR UPDATE）；③ 支持可配置起始序列號（對接公司現有編號規則） | 生成格式 `CMF-IND/JNT/CORP-YYYYMM-XXXX`，並發安全 |
| 5/10 (六) | ① 7大數據庫Schema框架設計：Counterparty表（`counterparties`）、Staff擴展表（`employees`含CE號）；② Holdings表設計（含 `assetType` 枚舉：equity/bond/derivative/fund/crypto/rwa） | 全部7個DB的核心表定義完成 |
| 5/11 (日) | 緩衝日 / 代碼review | — |
| 5/12 (一) | ① 開戶確認函PDF模板（中英雙語，含CMF抬頭、賬號、類型、日期、合規聲明）；② 歡迎郵件模板（Resend，含賬號、確認函下載鏈接、入金指引） | PDF正確生成，郵件發送成功 |
| 5/13 (二) | ① 將賬號生成集成到 `secondApprove` mutation 末尾；② 自動觸發確認函PDF生成 + S3上傳；③ 自動發送歡迎郵件 | 終審通過 → 賬號生成 → PDF → 郵件，全流程自動 |
| 5/14 (三) | ① 管理後台新增「客戶賬號管理」頁面（列表、搜索、篩選、啟用/停用）；② 審批列表新增「賬號狀態」列；③ tRPC `clientAccount` router（list/getByApplicationId/activate/suspend） | 管理員可查看、搜索、管理所有客戶賬號 |

**本週新增表**：`client_accounts`、`client_account_sequences`、`counterparties`、`employees`（擴展）、`holdings`（框架）

---

### Week 2（5/15 - 5/21）：財務系統對接 + 資金管理基礎

**目標**：開戶後自動在財務系統創建科目；完成入金/出金基礎架構。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 5/15 (四) | ① 財務系統新增4個Integration API端點（create-client-account / client-balance / journal-entry / client-transactions）；② API Key認證中間件 | 4個端點可調用，鑒權正確 |
| 5/16 (五) | ① 實現 `bookkeeping-client.ts` REST客戶端；② 賬號生成流程追加：自動調用財務系統創建科目（2001-{客戶賬號}） | 開戶→賬號生成→財務科目自動創建 |
| 5/17 (六) | ① 創建 `fund_transactions` 表（含deposit/withdrawal、狀態機、審批字段、財務系統journalEntryId）；② 資金交易序列號（FT-YYYYMMDD-XXXX） | 表結構完整 |
| 5/18 (日) | 緩衝日 / Week 1集成測試 | 端到端：開戶→審批→賬號→科目 |
| 5/19 (一) | ① 入金申請功能（客戶端：選擇方式bank_transfer/cheque/fps + 金額 + 上傳憑證）；② tRPC `fund.deposit` mutation | 客戶可提交入金申請 |
| 5/20 (二) | ① 出金申請功能（客戶端：選擇銀行賬戶 + 金額 + 餘額校驗）；② tRPC `fund.withdraw` mutation；③ 管理員審批列表 + 審批/拒絕操作 | 客戶可申請出金，管理員可審批 |
| 5/21 (三) | ① 入金/出金審批通過後自動記賬（DR/CR分錄調用財務系統）；② 客戶餘額查詢（`fund.getBalance`）；③ 出入金郵件通知 | 審批→記賬→餘額更新→通知全自動 |

**本週新增表**：`fund_transactions`、`reconciliation_logs`（框架）

---

### Week 3（5/22 - 5/28）：資金管理完善 + 對賬機制

**目標**：完善資金管理全流程，建立每日對賬機制，客戶端資金頁面完整可用。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 5/22 (四) | ① 客戶餘額詳情介面（totalBalance/availableBalance/marginBalance/unrealizedPnL/buyingPower）；② 前端Dashboard資金概覽卡片 | 客戶登入可見資金概覽 |
| 5/23 (五) | ① 資金流水頁面（分頁、篩選：入金/出金/全部，時間範圍）；② `fund.getTransactions` 分頁查詢 | 客戶可查詢完整資金流水 |
| 5/24 (六) | ① 每日對賬任務（比對fund_transactions累計 vs 財務系統GL餘額）；② `reconciliation_logs` 表實現；③ 差異告警郵件 | 凌晨2:00自動對賬，差異自動告警 |
| 5/25 (日) | 緩衝日 | — |
| 5/26 (一) | ① 操作日誌表 `audit_logs` 實現；② 關鍵操作自動記錄（登入、出入金、審批、密碼修改）；③ 管理後台操作日誌查詢頁面 | 所有關鍵操作可追溯 |
| 5/27 (二) | ① 2FA雙重認證實現（otpauth + QR Code）；② 首次登入交易門戶強制設置2FA；③ 出金/改密碼/改銀行賬戶需二次驗證 | 2FA全流程可用 |
| 5/28 (三) | ① 資金管理模塊完整集成測試；② 異常場景測試（餘額不足、重複申請、API超時重試）；③ 修復所有P0/P1 bug | 資金管理模塊達到可上線標準 |

**本週新增表**：`audit_logs`（完整實現）

---

### Week 4（5/29 - 6/4）：交易下單 + 訂單管理

**目標**：客戶可下單（買入/賣出），訂單狀態管理，費用自動計算。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 5/29 (四) | ① 創建 `orders` 表（含symbol/side/orderType/quantity/price/status/費用字段）；② 訂單序列號（ORD-YYYYMMDD-XXXX）；③ 創建 `trade_executions` 表 | 表結構完整，遷移成功 |
| 5/30 (五) | ① 下單服務：前端校驗（餘額/持倉）→ 後端校驗 → 生成訂單；② 費用計算引擎（佣金0.25%最低HK$100、印花稅0.13%、交易費0.00565%、結算費0.002%、SFC徵費0.0027%、FRC徵費0.00015%） | 下單成功，費用計算準確 |
| 5/31 (六) | ① 下單前端頁面（股票搜索 + 買賣方向 + 訂單類型market/limit/stop/stop_limit + 數量 + 價格 + 預估費用展示）；② 下單確認彈窗 | 客戶可通過UI下單 |
| 6/1 (日) | 緩衝日 | — |
| 6/2 (一) | ① 訂單狀態流轉（pending→submitted→partial_filled→filled→cancelled/rejected/expired）；② 手動確認成交（Phase 1暫不對接HTIFS，管理員手動確認）；③ 成交後自動記賬（DR/CR分錄） | 訂單狀態正確流轉 |
| 6/3 (二) | ① 委託查詢頁面（待成交/全部）；② 歷史成交記錄頁面（分頁、篩選）；③ tRPC `order` router完整實現 | 客戶可查詢所有訂單和成交 |
| 6/4 (三) | ① 撤單功能；② 訂單狀態WebSocket推送（初始化ws服務，Railway部署）；③ 心跳檢測 + 自動重連 | 撤單可用，狀態實時推送 |

**本週新增表**：`orders`、`trade_executions`

---

### Week 5（6/5 - 6/11）：持倉管理 + 資產託管

**目標**：成交後自動更新持倉，持倉頁面完整展示，支持多資產類型。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 6/5 (四) | ① Holdings表完整實現（含assetType枚舉：equity/bond/derivative/fund/crypto/rwa）；② 成交回報 → 持倉自動更新邏輯（買入增加、賣出減少、均價重算） | 成交後持倉數據正確更新 |
| 6/6 (五) | ① 持倉概覽頁面（表格：代碼、名稱、類型、數量、均價、現價、市值、盈虧、佔比）；② 未實現/已實現盈虧分開展示 | 持倉頁面完整可用 |
| 6/7 (六) | ① 持倉分布餅圖（按行業/板塊/資產類型）；② 收益曲線折線圖（日/週/月/年）；③ tRPC `portfolio` router完整實現 | 圖表正確展示 |
| 6/8 (日) | 緩衝日 | — |
| 6/9 (一) | ① 統一資產介面 `UnifiedPosition`（支持capital_market/crypto/rwa三個資產池）；② 數字資產錢包表 `crypto_wallets` Schema預留（暫不實現業務邏輯）；③ RWA資產表 `rwa_assets` Schema預留 | Schema遷移成功，未來擴展就緒 |
| 6/10 (二) | ① 持倉估值定時更新任務（每5分鐘從行情源更新currentPrice/marketValue/unrealizedPnL）；② 持倉快照表（每日收盤後保存，用於收益曲線） | 持倉估值自動更新 |
| 6/11 (三) | ① 交易+持倉完整集成測試（下單→成交→持倉更新→記賬→餘額變動）；② 邊界場景（清倉、加倉、部分成交）；③ 性能測試 | 交易持倉全流程無bug |

**本週新增/完善表**：`holdings`（完整）、`crypto_wallets`（預留）、`rwa_assets`（預留）、`position_snapshots`

---

### Week 6（6/12 - 6/18）：行情系統 + 客戶端UI完善

**目標**：接入行情數據源，自選股功能，全面完善客戶端UI和用戶體驗。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 6/12 (四) | ① `market_data_cache` 表實現；② Yahoo Finance API對接（15分鐘延遲行情，港股數據）；③ 行情數據定時拉取（每30秒） | 港股行情數據正常獲取和緩存 |
| 6/13 (五) | ① `watchlists` 表實現；② 自選股功能（添加/刪除/排序）；③ 自選股行情展示（代碼、名稱、現價、漲跌、漲跌幅、成交量） | 自選股完整可用 |
| 6/14 (六) | ① 行情詳情頁（個股：K線圖用TradingView Lightweight Charts、分時圖、基本面數據PE/PB/股息率）；② WebSocket行情推送（每5秒推送自選股更新） | 個股頁面數據豐富 |
| 6/15 (日) | 緩衝日 | — |
| 6/16 (一) | ① 客戶端整體佈局完善（頂部導航、側邊欄、底部狀態欄）；② 響應式設計（>=1280px完整側邊欄、768-1279px收縮側邊欄、<768px底部Tab） | 三種屏幕尺寸佈局正確 |
| 6/17 (二) | ① 深色/淺色主題完善（行情專用色：上漲紅#ef4444、下跌綠#22c55e，港股慣例）；② 市場概覽頁面（恆指、國指、主板成交額、板塊熱力圖） | 主題切換正常，市場頁面完整 |
| 6/18 (三) | ① i18next國際化完整實現（繁中zh-TW為默認、簡中zh-CN、英文en）；② 全部頁面翻譯文件（common/dashboard/fund/trading/report） | 三語切換無遺漏 |

**本週新增表**：`market_data_cache`、`watchlists`

---

### Week 7（6/19 - 6/25）：報表系統 + PDF/Excel導出

**目標**：月結單、稅務報告、交易記錄導出，完成全部報表需求。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 6/19 (四) | ① 月結單PDF模板設計（CMF抬頭、賬戶摘要、當月交易記錄、持倉明細、費用明細、期末餘額，中英雙語）；② `report.generateMonthlyStatement` mutation | 月結單PDF格式正確、數據準確 |
| 6/20 (五) | ① 月結單自動生成任務（每月1日凌晨生成上月月結單，S3存儲，郵件通知客戶）；② 歷史月結單列表頁面（按月份查看、下載） | 自動生成+通知可用 |
| 6/21 (六) | ① 交易記錄Excel導出（exceljs，支持時段篩選，含全部費用明細）；② 持倉報告PDF（截至指定日期的持倉快照） | Excel/PDF正確導出 |
| 6/22 (日) | 緩衝日 | — |
| 6/23 (一) | ① 稅務報告PDF/Excel（年度資本收益/損失彙總、股息收入、費用扣除）；② `report.generateTaxReport` mutation | 稅務報告數據準確 |
| 6/24 (二) | ① 報表中心頁面（按類型分類：月結單/稅務/交易/持倉）；② 批量導出功能；③ tRPC `report` router完整實現 | 報表中心UI完整 |
| 6/25 (三) | ① 報表模塊集成測試；② 各類型報表數據準確性驗證；③ 大數據量性能測試（1000筆交易導出） | 報表模塊達到上線標準 |

---

### Week 8（6/26 - 7/2）：加密貨幣/RWA預留 + 安全加固 + 上線

**目標**：未來擴展準備就緒，安全加固完成，系統達到上線標準。

| 日期 | 任務 | 驗收標準 |
|------|------|----------|
| 6/26 (四) | ① `crypto_wallets` 業務邏輯預留（錢包創建、餘額查詢、充幣/提幣介面定義，暫不接真實區塊鏈）；② `rwa_assets` 管理介面預留（資產登記、代幣化標準ERC-721/1155、元數據） | 介面定義完整，可隨時啟用 |
| 6/27 (五) | ① 會話管理強化（交易頁15分鐘超時、一般頁60分鐘、最多3個Session、異地登入IP變更提醒）；② IP白名單功能（可選啟用，企業客戶可強制）；③ CSRF/XSS/SQL注入防護驗證 | 安全策略全部生效 |
| 6/28 (六) | ① 全系統端到端測試：開戶→審批→賬號→科目→入金→下單→成交→持倉→出金→月結單；② 跨系統測試（開戶↔財務） | 全流程無阻斷 |
| 6/29 (日) | 緩衝日 | — |
| 6/30 (一) | ① 性能優化（慢查詢、索引優化、Redis緩存命中率）；② 部署checklist（版本號更新、dist不入git、tsc --noEmit通過）；③ 環境變量配置確認 | 性能達標 |
| 7/1 (二) | ① Staging環境部署 + 冒煙測試；② David最終驗收 | Staging驗收通過 |
| 7/2 (三) | ① 生產部署；② 監控告警配置；③ 上線公告 | **正式上線** |

---

## 3. 每階段驗收標準（具體可測試清單）

### M1：Week 1-2 完成（5/21）— 賬號生成 + 財務對接 + 資金基礎

- [ ] 終審通過後5秒內自動生成客戶賬號
- [ ] 賬號格式符合規範：`CMF-IND/CORP/JNT-YYYYMM-XXXX`
- [ ] 序列號支持從指定數字開始（對接公司現有編號）
- [ ] 並發測試：10個同時審批不產生重複賬號
- [ ] 開戶確認函PDF正確生成（中英雙語，含CMF抬頭）
- [ ] 歡迎郵件成功發送（含賬號、確認函下載鏈接）
- [ ] 管理後台「客戶賬號管理」頁面可用（搜索、篩選、啟用/停用）
- [ ] 財務系統自動創建科目（2001-{客戶賬號}）
- [ ] 科目餘額查詢API返回正確
- [ ] 入金申請提交 → 管理員審批 → 記賬 → 餘額更新全流程通過
- [ ] 出金申請提交 → 餘額校驗 → 審批 → 記賬全流程通過
- [ ] 出入金郵件通知正常發送

### M2：Week 3 完成（5/28）— 資金管理完整

- [ ] 客戶Dashboard顯示完整資金概覽（總資產/可用/保證金/盈虧/購買力）
- [ ] 資金流水分頁查詢、篩選正常
- [ ] 每日對賬任務自動執行，差異告警郵件正確發送
- [ ] 操作日誌記錄完整，管理後台可查詢
- [ ] 2FA設置流程完整（QR Code → 驗證 → 啟用）
- [ ] 出金/改密碼/改銀行賬戶觸發2FA驗證
- [ ] 餘額不足出金被正確攔截，錯誤提示清晰

### M3：Week 4-5 完成（6/11）— 交易 + 持倉

- [ ] 客戶可搜索股票 → 下單（市價/限價/止損/止損限價）
- [ ] 費用計算準確（佣金、印花稅、交易費、結算費、SFC徵費、FRC徵費）
- [ ] 買入餘額校驗：可用餘額 >= 預估金額+費用
- [ ] 賣出持倉校驗：持倉數量 >= 賣出數量
- [ ] 訂單狀態正確流轉：pending → submitted → filled / cancelled
- [ ] 成交後持倉自動更新（數量、均價、盈虧）
- [ ] 撤單功能正常
- [ ] WebSocket推送訂單狀態變化
- [ ] 持倉頁面數據完整（含餅圖、收益曲線）
- [ ] 統一資產介面已定義crypto/rwa類型
- [ ] `crypto_wallets` 和 `rwa_assets` Schema已遷移

### M4：Week 6 完成（6/18）— 行情 + UI

- [ ] 港股行情數據正常展示（15分鐘延遲）
- [ ] 自選股添加/刪除/排序正常
- [ ] K線圖（TradingView）正常渲染
- [ ] 響應式佈局三種斷點正確
- [ ] 深色/淺色主題切換正常
- [ ] 行情色彩符合港股慣例（紅漲綠跌）
- [ ] 三語切換（繁中/簡中/英）無遺漏

### M5：Week 7-8 完成（7/2）— 報表 + 安全 + 上線

- [ ] 月結單PDF格式正確、數據準確
- [ ] 月結單每月1日自動生成+郵件通知
- [ ] 交易記錄Excel導出正確
- [ ] 稅務報告數據準確
- [ ] 會話超時策略生效（15分鐘/60分鐘）
- [ ] IP白名單功能可用
- [ ] 全流程端到端測試通過
- [ ] 生產環境部署成功

---

## 4. 風險與應對

| # | 風險 | 影響程度 | 概率 | 應對措施 |
|---|------|----------|------|----------|
| 1 | 賬號生成並發衝突 | 高（重複賬號） | 低 | MySQL事務 + `SELECT FOR UPDATE` 行鎖 + `UNIQUE` 約束三重保障 |
| 2 | 財務系統API不可用 | 中（賬號生成卡住） | 中 | 異步重試隊列；賬號先生成，科目異步補建；財務對接失敗不阻斷開戶 |
| 3 | 行情數據源不穩定 | 低（估值暫停更新） | 中 | Yahoo Finance為主，東方財富備用；Redis緩存最後有效值兜底 |
| 4 | WebSocket連接斷開 | 低（客戶體驗下降） | 高 | 自動重連（指數退避）+ 心跳檢測 + HTTP輪詢降級方案 |
| 5 | Railway構建失敗 | 高（部署中斷） | 中 | 嚴格tsc檢查（`tsc --noEmit`）；未使用import立即刪除；推送前本地驗證 |
| 6 | 公司帳戶編號規則未確認 | 中（序列號起點不確定） | 中 | 設計為可配置（`startSequence`參數化），待公司確認後即時調整 |
| 7 | SFC合規要求變更 | 高（功能需修改） | 低 | Nova持續追蹤監管動態；關鍵合規點（KYC/AML/風險評估）模塊化，可獨立更新 |
| 8 | 8週計劃過於激進 | 中（延期） | 中 | 每週緩衝日吸收延遲；優先級排序：Week 1-4為MVP必須，Week 5-8可延後 |
| 9 | 跨系統數據不一致 | 高（資金差異） | 中 | 每日自動對賬 + 告警；唯一事務ID追蹤；審計日誌完整記錄 |
| 10 | 加密貨幣/RWA合規不確定 | — | 高 | 僅做Schema預留和介面定義，不實現業務邏輯；待SFC明確政策後再啟動 |

**優先級降級策略**（若時間不夠）：
1. **必須完成**（Week 1-4）：賬號生成 + 財務對接 + 資金管理 + 交易下單 = 最小可用產品
2. **高優先級**（Week 5-6）：持倉管理 + 行情系統 = 完整交易體驗
3. **可延後**（Week 7-8）：報表導出 + crypto/RWA預留 + 安全加固 = 錦上添花

---

## 5. 資源分配

### 5.1 角色與職責

| 角色 | 負責內容 | 具體模塊 |
|------|----------|----------|
| **Claude**（主力編碼） | 全部代碼實現 | 賬號生成、財務對接、資金管理、交易、持倉、行情、報表、前後端全棧 |
| **Hermes**（代碼審計） | 代碼質量 + 安全審計 | 每週代碼review；重點審計：資金操作、認證鑒權、SQL安全 |
| **Nova**（合規建議） | 業務規則 + SFC合規 | 開戶流程合規性、費用計算規則確認、客戶協議條款、SFC報表要求 |
| **Qual**（測試） | 測試用例 + 執行 | 單元測試（vitest）、集成測試、端到端測試、邊界場景測試 |

### 5.2 每週協作節奏

| 時間 | 活動 | 參與者 |
|------|------|--------|
| 每週一早 | 本週目標確認 + 上週review | David + 全體 |
| 每日 | Claude編碼 + 提交 | Claude |
| 每週三 | Hermes代碼審計反饋 | Hermes |
| 每週五 | Qual測試報告 + bug修復 | Qual + Claude |
| 關鍵節點 | Nova合規確認 | Nova |

### 5.3 部署規範

每次推送前必須：
1. 更新 `package.json` 版本號（格式：`v1.X.YYMMDD`）
2. 確認 `dist/` 不在git跟蹤中（`.gitignore`）
3. `tsc --noEmit` 通過，無未使用import
4. 本地 `pnpm build` 成功
5. Railway數據庫遷移使用 `drizzle-kit push`

### 5.4 環境變量新增清單

```env
# Week 2：財務對接
BOOKKEEPING_API_URL=https://cmf-bookkeeping-xxx.railway.app
BOOKKEEPING_API_KEY=sk_bookkeeping_xxx

# Week 4：WebSocket
WS_PORT=8080

# Week 5：Redis緩存
REDIS_URL=redis://xxx@xxx.upstash.io:6379

# Week 6：行情
YAHOO_FINANCE_API_KEY=xxx

# 未來：HTIFS FIX交易
HTIFS_FIX_HOST=xxx
HTIFS_FIX_PORT=xxx
HTIFS_SENDER_COMP_ID=CMF
HTIFS_TARGET_COMP_ID=HTIFS
```

---

## 6. 數據庫Schema新增表彙總（共16張）

| # | 表名 | Week | 數據庫歸屬 | 用途 |
|---|------|------|------------|------|
| 1 | `client_accounts` | 1 | Clients | 客戶賬號 |
| 2 | `client_account_sequences` | 1 | Clients | 賬號序列號 |
| 3 | `counterparties` | 1 | Counterparty | 交易對手/同業 |
| 4 | `employees` | 1 | Staff | 員工信息+CE號（擴展現有approvers） |
| 5 | `fund_transactions` | 2 | Clients | 出入金記錄 |
| 6 | `reconciliation_logs` | 3 | Accounting | 對賬記錄 |
| 7 | `audit_logs` | 3 | Staff | 操作日誌 |
| 8 | `orders` | 4 | Trading | 訂單 |
| 9 | `trade_executions` | 4 | Trading | 成交記錄 |
| 10 | `holdings` | 5 | Custody | 持倉 |
| 11 | `position_snapshots` | 5 | Custody | 持倉快照 |
| 12 | `crypto_wallets` | 5 | Custody | 數字資產錢包（預留） |
| 13 | `rwa_assets` | 5 | Custody | RWA資產（預留） |
| 14 | `market_data_cache` | 6 | Market Data | 行情緩存 |
| 15 | `watchlists` | 6 | Market Data | 自選股 |
| 16 | `users`（修改） | 3 | Clients | 新增twoFactorSecret/twoFactorEnabled/preferredLanguage/theme |

**現有 `applications` 表修改**：`status` 枚舉新增 `account_generated`、`active`

---

## 7. 加密貨幣/RWA擴展路線（未來）

### 7.1 合規前提

CMF目前持有SFC第1/4/9類牌照。加密貨幣交易需額外取得SFC「虛擬資產交易平台」（VATP）牌照或相關豁免。RWA代幣化需要符合《證券及期貨條例》對「證券」的定義。

### 7.2 技術預留

| 項目 | 本次實現 | 未來啟用 |
|------|----------|----------|
| Holdings.assetType | 枚舉包含 `crypto`、`rwa` | 啟用對應業務邏輯 |
| crypto_wallets表 | Schema已遷移 | 接入區塊鏈節點（BTC/ETH/Stablecoin） |
| rwa_assets表 | Schema已遷移 | 接入代幣化平台（ERC-721/1155） |
| UnifiedPosition介面 | 定義了三個資產池 | 統一持倉展示 |
| 費用計算引擎 | 模塊化設計 | 新增crypto/rwa費率規則 |

### 7.3 預計啟動條件

- SFC發出明確指引或牌照
- CMF管理層決策啟動
- 合作託管商確認（如OSL、HashKey）
- 預計最早2027年Q1

---

> **本文檔為CMF開戶系統升級的統一開發計劃。所有Agent基於此計劃執行。**
>
> **任何修改需更新版本號並通知David。**
>
> **最後更新：2026-05-04 | 版本：v3.0**
