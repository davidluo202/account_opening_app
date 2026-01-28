# CMF003 vs 现有系统字段对比

## 已实现的字段 ✅

### A. Personal Information (Case 3-4)
- ✅ Name in English
- ✅ Name in Chinese (中文姓名)
- ✅ Gender (性别)
- ✅ Date of Birth (出生日期)
- ✅ Place of Birth (出生地)
- ✅ Nationality (国籍)
- ✅ HKID/Passport No. (身份证/护照号码)
- ✅ Country of Issue (签发国家)
- ✅ ID Expiry Date (证件有效期)
- ✅ Marital Status (婚姻状况)
- ✅ Education Level (学历)
- ✅ Residential Address (住宅地址)
- ✅ Phone (电话)
- ✅ Email (电邮)
- ✅ Mobile (手提电话)

### B. Employment (Case 5-6)
- ✅ Employment Status (受雇/自雇/学生/退休/家庭主妇/其他)
- ✅ Employer Name (雇主名称)
- ✅ Occupation/Business Nature (职业/工作性质)
- ✅ Position (职位)
- ✅ Years in Occupation (工作年数)
- ✅ Office Address (办公室地址)
- ✅ Office Phone (公司电话)

### C. Financial Situation (Case 6-7)
- ✅ Annual Income (年收入)
- ✅ Net Worth (资产净值)
- ✅ Source of Income (收入来源)

### D. Investment (Case 7)
- ✅ Investment Objectives (投资目的)
- ✅ Investment Experience (投资经验)

### E. Bank Reference (Case 8)
- ✅ Bank Name (银行名称)
- ✅ Account Name (账户名称)
- ✅ Account No. (账号)
- ✅ Account Currency (账户币种)

## 需要补充的字段 ⚠️

### 1. Personal Information 补充
- ❌ **Fax No. (传真号码)** - CMF003中有，现有系统缺失
- ❌ **ID Type详细分类** - 现有系统只有"身份证/护照/其他"，CMF003可能有更详细分类

### 2. Bank Reference 补充
- ❌ **A/C Type (账户类型)** - CMF003有 Saving/Current/Others 选项，现有系统缺失
- ⚠️ 现有系统的"账户币种"字段在CMF003中未明确显示，需确认是否保留

### 3. Financial Situation 补充
- ❌ **Liquid Asset 流动资产 (HK$)** - CMF003中单独列出，现有系统缺失
- ⚠️ 现有系统的"净资产"需要明确是否包含流动资产

### 4. Correspondence Address (通讯地址)
- ❌ **Correspondence Address** - CMF003有单独的通讯地址字段
- ❌ **Statements Language Preference** - 英文/中文结单语言选择
- ❌ **Statement Delivery Method** - 邮寄到通讯地址或电邮

### 5. Office Fax (办公传真)
- ❌ **Office Fax No.** - CMF003中有，现有系统缺失

## 建议的改进方案

### 优先级1 (必须补充)
1. **添加传真号码字段** (个人和办公)
2. **添加银行账户类型** (Saving/Current/Others)
3. **添加流动资产字段**
4. **添加通讯地址相关字段**

### 优先级2 (可选补充)
1. 结单语言偏好
2. 结单发送方式

### 数据库Schema需要更新的表
1. `personal_detailed_info` - 添加 `faxNo` 字段
2. `employment_details` - 添加 `officeFaxNo` 字段
3. `bank_accounts` - 添加 `accountType` 字段 (saving/current/others)
4. `financial_investment` - 添加 `liquidAsset` 字段
5. 新增 `correspondence_info` 表 - 存储通讯地址和偏好设置
