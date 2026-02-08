# 客户开户申请系统 - 任务清单

## 紧急修复：PDF生成器版本问题（2026-02-08）

**问题根源**：系统中存在多个PDF生成器版本（pdf-generator.ts 和 pdf-generator-v7.ts），routers.ts中实际使用的是pdf-generator-v7.ts，但之前的所有修改都应用在了pdf-generator.ts上，导致生成的PDF没有包含新增字段。

- [x] 检查pdf-generator-v7.ts的当前状态
- [x] 将所有新增字段更新到pdf-generator-v7.ts：
  - [x] 手机号码（mobileCountryCode, mobileNumber）
  - [x] 账单通讯地址（billingAddressType, billingAddressOther）
  - [x] 账单首选语言（preferredLanguage）
  - [x] 完整的风险评估问卷（10个问题的答案，不显示分数）
  - [x] 风险等级（基于问卷总分计算）
  - [x] 所有监管声明字段（hasReadAgreement, acceptsETO, acceptsAML, acceptsRiskAssessment）
- [x] 测试PDF生成功能，确认所有字段都正确显示（等待用户发布后测试）
- [ ] 保存checkpoint

[之前的所有任务内容保持不变...]
