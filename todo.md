# 客户开户申请系统 - 任务清单

## 修复Case 4个人详细信息页面保存失败问题（2026-02-20）

**问题描述**：用户在Case 4（个人详细信息页面）完成输入后点击"下一步"，系统显示"保存失败...."错误。

**根本原因**：用户必须先验证邮箱才能进入下一步，但错误提示不够明显，用户没有注意到需要点击"验证"按钮。

**任务清单**：
- [x] 通过浏览器测试重现问题
- [x] 分析问题根源：用户必须先验证邮箱才能进入下一步
- [x] 改进用户体验：
  - [x] 改进错误提示："请点击右侧的【验证】按钮，完成邮箱验证后方可继续"
  - [x] 在邮箱字段标签旁边添加"（需验证）"提示
  - [x] 验证流程已存在，后端接口正常
- [x] 测试修复效果（UI改进已生效，邮箱字段显示“（需验证）”提示）
- [x] 保存checkpoint (version: 0a861704)

**后续优化**：
- [x] 添加验证码发送成功提示（“验证码已发送至您的邮箱，请查收！” + 子标题提示）
- [x] 高亮显示验证码输入框（border-2 border-primary + focus:ring + autoFocus）
- [x] 自动聚焦到验证码输入框，引导用户输入
- [x] 测试并保存checkpoint

---

## PDF样式优化（2026-02-11）

**目标**：改进PDF的排版和中文字体显示效果，使生成的PDF更加专业美观。

**任务清单**：
- [x] 分析当前PDF生成器的样式问题
- [x] 优化中文字体显示：
  - [x] 确保中文字体正确加载和渲染
  - [x] 调整字体大小层级（主标题20px、章节标题14px、正文10px）
  - [x] 改进中英文混排效果（英文副标题使用灰色）
- [x] 改进布局和间距：
  - [x] 优化段落间距和行距
  - [x] 改进章节分隔（添加分隔线）
  - [x] 调整页边距（已在代码中设置）
- [x] 优化表格和列表样式：
  - [x] 添加表格边框和背景色
  - [x] 改进银行账户列表显示（添加浅灰色背景框）
  - [x] 优化风险评估问卷的问答格式（总分和风险等级突出显示）
- [x] 添加页眉页脚：
  - [x] 添加公司Logo和名称（页眉Logo + 页脚公司名称）
  - [x] 添加页码（格式：1 / 10）
  - [x] 添加申请编号（页脚中间）
- [x] 测试并保存checkpoint (version: f7ff3f71)

---

## PDF生成器修复和清理（2026-02-11）
- [x] 用pdf-generator-v7.ts替换pdf-generator.ts
- [x] 删除所有旧版本PDF生成器文件
- [x] 更新routers.ts中的import语句
- [x] 保存checkpoint (version: 5921ffb9)


## 紧急修复：PDF文件与预览页面不一致问题（2026-02-26）

**问题描述**：
用户报告PDF文件中缺少关键信息，与预览页面不一致：
1. 风险评估部分：PDF中显示"R1 - 低风险"等旧版评级，但应该显示完整的10个问题+用户答案+总分+风险等级（不使用R1-R6评级）
2. 客户签名部分：PDF中显示"NA"，但应该显示客户的英文名（与预览页面一致）

**修复任务**：
- [x] 下载实际PDF文件，分析具体缺失的内容
- [x] 对比ApplicationPreview.tsx和pdf-generator.ts，找出数据映射问题：
  - [x] 签名字段名不匹配：routers.ts使用`signature`，PDF生成器期望`signatureName`
  - [x] 签名时间戳字段缺失：已添加`signatureTimestamp`字段
  - [x] 风险评估问卷数据传递逻辑已存在（routers.ts第354-368行）
  - [x] 所有字段已改为嵌套结构，与routers.ts和pdf-generator.ts完全一致
- [x] 修复风险评估问卷显示：
  - [x] 显示所有10个问题的完整文本
  - [x] 显示用户选择的答案（不显示分数）
  - [x] 显示总分
  - [x] 显示风险等级（基于总分计算，不使用R1-R6）
- [x] 修复客户签名显示：
  - [x] 使用客户的英文名（englishName）
  - [x] 不显示"NA"
- [x] 本地完整测试：
  - [x] 创建新申请并填写所有字段（使用已有草稿申请CMF-ACAPP-260206-001）
  - [x] 下载PDF文件（预览PDF和提交后S3 PDF）
  - [x] 逐项对比PDF与预览页面，确保完全一致
- [x] 修复代码位置：
  - [x] server/routers.ts第190-204行：在submit API中添加riskQuestionnaire数据
  - [x] server/routers.ts第436-467行：在generatePreviewPDF API中添加riskQuestionnaire数据
  - [x] server/pdf-generator.ts第599-600行：移除使用旧的inv.riskTolerance字段
  - [x] server/pdf-generator.ts第883行：修复签名显示逻辑
- [x] 验证结果：
  - [x] 预览PDF：正确显示10个问题+答案+总分540+风险等级Medium to High
  - [x] 提交后PDF：正确显示10个问题+答案+总分540+风险等级Medium to High
  - [x] 签名：正确显示客户英文名"Xintao Luo"（不再显示NA）
- [x] 保存checkpoint并提交给用户 (version: c0a367d5)


## 修复审批系统审查页面与客户预览页面不一致问题（2026-02-26）

**问题描述**：
客户服务同事进入审批系统对客户提交的申请记录打开审查时，审查页面与客户的预览页面不一致，缺少多个要素。同时需要添加初审人员意见字段，修复风险等级显示（不再使用R1-R6，而是使用新的6级评分系统），并确保所有邮件中的PDF文件与审批页面信息一致。

**任务清单**：
- - [x] 分析审批系统当前状态：
  - [x] 识别主要问题：风险等级使用旧的R1-R5系统，缺少审批意见字段
  - [x] 检查PDF生成器：已定义审批信息字段，但formatRiskTolerance函数需要更新
  - [x] 检查审批邮件中的PDF文件生成逻辑
- [x] 修复初审和终审页面显示问题：
  - [x] 添加审批意见输入框（approvalComments状态变量）
  - [x] 修复风险等级选项（使用新6级评分系统）
  - [x] 更新数据库schema（approvedRiskProfile字段类型）
  - [x] 迁移现有数据（R1-R5 -> Lowest/Low/Low to Medium/Medium/Medium to High/High）
  - [x] 修复前端审批表单的风险等级选项
  - [x] 修夏后端审批API的类型定义（firstApprove和secondApprove）
  - [x] 修夏db.ts中的updateApplicationApprovalInfo函数
  - [x] 修夏PDF生成器中的formatRiskTolerance函数
- [ ] 修复审批邮件中的PDF文件：
  - [ ] 初审通过后发送给compliance的PDF：包含初审人员的审批信息
  - [ ] 终审通过后发送给operation的PDF：包含初审和终审人员的审批信息
  - [ ] 拒绝/退回后发送给customer-services的PDF：包含审批人员的意见和理由
  - [ ] 确保PDF中的风险等级使用新的6级评分系统
- [ ] 完整测试：
  - [ ] 创建新申请并提交
  - [ ] 进行初审操作，检查初审页面显示和邮件PDF
  - [ ] 进行终审操作，检查终审页面显示和邮件PDF
  - [ ] 测试拒绝/退回操作，检查邮件PDF
- [ ] 保存checkpoint并提交给用户


## 补齐审批详情页面缺失的客户信息并完善审批记录显示（2026-02-26）

**问题描述**：
1. 初审人员看不到客户输入的手机号、通讯方式、账单语言、风险评估问卷的10个问题和客户选择等信息
2. 终审人员看不到初审人员的修改和审核意见
3. 最终预览页面和PDF中没有并列显示初审和终审的审批记录

**任务清单**：
- [x] 分析审批详情页面当前显示的内容并识别缺失字段
- [x] 补齐审批详情页面的客户信息显示：
  - [x] 添加手机号显示（mobileCountryCode + mobileNumber）
  - [x] 添加通讯地址显示（billingAddressType + billingAddressOther）
  - [x] 添加账单语言显示（preferredLanguage）
  - [x] 添加完整的风险评估问卷显示（10个问题+客户选择+总分+风险等级）
  - [x] 确保所有客户信息要素与预览页面一致
- [x] 在终审页面显示初审人员的审批信息：
  - [x] 显示初审人员的PI认定选择（已存在于ApprovalDetail.tsx第1068-1070行）
  - [x] 显示初审人员的风险等级选择（已存在于ApprovalDetail.tsx第1071-1074行）
  - [x] 显示初审人员的审批意见（已存在于ApprovalDetail.tsx第1075-1081行）
  - [x] 显示初审人员的姓名、CE No、审批时间（已存在于ApprovalDetail.tsx第1049-1066行）
- [x] 在最终预览页面和PDF中显示审批记录：
  - [x] 在客户预览页面添加审批记录章节（ApplicationPreview.tsx第991-1090行）
  - [x] 显示初审记录（审批人、CE No、PI认定、风险等级、审批意见、审批时间）
  - [x] 显示终审记录（审批人、PI认定、风险等级、审批意见、审批时间）
  - [x] PDF生成器已支持审批记录显示（pdf-generator.ts第906-948行）
  - [ ] 确保firstApprove/secondApprove API传递审批信息到PDF生成器（待实现）
- [ ] 完整测试并创建checkpoint


## 修复终审页面显示的初审人员审批信息错误（2026-02-26）

**问题描述**：
终审页面显示的初审人员审批信息不正确：
- 初审PI认定显示“否”（实际初审人员选了“是”）
- 初审风险评级显示“N/A”（应该显示初审人员选择的实际风险等级）

**任务清单**：
- [x] 检查终审页面的初审信息读取逻辑：
  - [x] 查看ApprovalDetail.tsx中显示初审PI认定的代码（第1069行）
  - [x] 查看ApprovalDetail.tsx中显示初审风险评级的代码（第1073行）
  - [x] 检查后端API返回的初审信息字段名称（firstApprovalIsProfessionalInvestor和firstApprovalRiskProfile）
- [x] 修复初审信息的字段映射和显示逻辑：
  - [x] 修复PI认定显示错误：将`isProfessionalInvestor`改为`firstApprovalIsProfessionalInvestor`
  - [x] 修复风险评级显示错误：将`approvedRiskProfile`改为`firstApprovalRiskProfile`
  - [x] 验证后端逻辑正确保存了初审字段（db.ts中updateFirstApproval函数）
- [x] 测试并创建checkpoint (version: 5f923f1d)


## 修复初审页面风险评级选择框仍使用R1-R5问题（2026-02-26）

**问题描述**：
初审页面的风险评级选择框还在使用R1-R5，需要改为新的6级评分系统（Lowest/Low/Low to Medium/Medium/Medium to High/High）。终审页面已经是正确的。

**任务清单**：
- [x] 查找初审页面的风险评级选择框代码位置（ApprovalDetail.tsx第1129-1133行）
- [x] 将R1-R5选项改为新的6级评分系统选项
- [x] 验证终审页面已经使用新的6级评分系统（第1219-1224行）
- [ ] 测试并创建checkpoint
