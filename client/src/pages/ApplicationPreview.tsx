import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

/**
 * 申请预览页面 - 参照CMF003申请表的专业表格布局
 */
export default function ApplicationPreview() {
  const [, params] = useRoute("/application/:id/preview");
  const applicationId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [hasGeneratedNumber, setHasGeneratedNumber] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [signatureMethod, setSignatureMethod] = useState<"typed" | "iamsmart">("typed");

  // 获取完整申请数据
  const { data: completeData, isLoading, refetch } = trpc.application.getComplete.useQuery(
    { id: applicationId },
    { enabled: !!applicationId && isAuthenticated }
  );

  // 生成申请编号
  const generateNumberMutation = trpc.application.generateNumber.useMutation({
    onSuccess: () => {
      toast.success("申请编号已生成");
      setHasGeneratedNumber(true);
      refetch();
    },
    onError: (error) => {
      toast.error(`生成申请编号失败: ${error.message}`);
    },
  });

  // 提交申请
  const submitMutation = trpc.application.submit.useMutation({
    onSuccess: (data) => {
      // 显示成功对话框，而不是直接跳转
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      }
      setShowSuccessDialog(true);
    },
    onError: (error) => {
      toast.error(`提交失败: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!completeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg mb-4">未找到申请数据</p>
          <Button onClick={() => setLocation("/applications")}>返回申请列表</Button>
        </Card>
      </div>
    );
  }

  const { application, accountSelection, basicInfo: personalBasic, detailedInfo: personalDetailed, occupation, employment, financial, bankAccounts, tax: taxInfo, documents, face: faceVerification, regulatory } = completeData;

  const handleSaveAndGenerateNumber = () => {
    if (!application?.applicationNumber) {
      generateNumberMutation.mutate({ id: applicationId });
    } else {
      toast.info("申请编号已存在");
    }
  };

  const handleSubmit = () => {
    if (!application?.applicationNumber) {
      toast.error("请先保存并生成申请编号");
      return;
    }
    if (application?.status === "submitted") {
      toast.info("申请已提交，无需重复提交");
      return;
    }
    // 显示签名对话框
    setSignatureName(completeData?.basicInfo?.englishName || "");
    setShowSignatureDialog(true);
  };

  const handleConfirmSignature = () => {
    if (!signatureName.trim()) {
      toast.error("请输入签名姓名");
      return;
    }
    submitMutation.mutate({ 
      id: applicationId,
      signatureName: signatureName.trim(),
      signatureMethod,
    });
    setShowSignatureDialog(false);
  };

  const handleEdit = (step: number) => {
    setLocation(`/application/${applicationId}/step/${step}`);
  };

  // 格式化日期
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("zh-CN");
  };

  // 格式化金额（添加千分号）
  const formatAmount = (amount: string | number | null | undefined) => {
    if (!amount) return "-";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "-";
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // 翻译函数
  const translateCustomerType = (type: string | null | undefined) => {
    if (!type) return "-";
    const map: Record<string, string> = {
      individual: "个人账户",
      joint: "联名账户",
      corporate: "机构账户",
    };
    return map[type] || type;
  };

  const translateAccountType = (type: string | null | undefined) => {
    if (!type) return "-";
    const map: Record<string, string> = {
      cash: "现金账户",
      margin: "保证金账户",
      derivatives: "衍生品账户",
    };
    return map[type] || type;
  };

  const translateGender = (gender: string | null | undefined) => {
    if (!gender) return "-";
    const map: Record<string, string> = {
      male: "男",
      female: "女",
      other: "其他",
    };
    return map[gender] || gender;
  };

  const translateIdType = (type: string | null | undefined) => {
    if (!type) return "-";
    const map: Record<string, string> = {
      hkid: "香港身份证",
      passport: "护照",
      other: "其他",
    };
    return map[type] || type;
  };

  const translateMaritalStatus = (status: string | null | undefined) => {
    if (!status) return "-";
    const map: Record<string, string> = {
      single: "单身",
      married: "已婚",
      divorced: "离婚",
      widowed: "丧偶",
    };
    return map[status] || status;
  };

  const translateEducationLevel = (level: string | null | undefined) => {
    if (!level) return "-";
    const map: Record<string, string> = {
      high_school: "高中",
      associate: "专科",
      bachelor: "本科",
      master: "硕士",
      doctorate: "博士",
      other: "其他",
    };
    return map[level] || level;
  };

  const translateEmploymentStatus = (status: string | null | undefined) => {
    if (!status) return "-";
    const map: Record<string, string> = {
      employed: "受雇",
      self_employed: "自雇",
      student: "学生",
      unemployed: "无业",
      retired: "退休",
    };
    return map[status] || status;
  };

  const translateBankAccountType = (type: string | null | undefined) => {
    if (!type) return "-";
    const map: Record<string, string> = {
      saving: "储蓄账户",
      current: "支票账户",
      other: "其他",
    };
    return map[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <a href="/" className="flex items-center">
            <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
          </a>
          <Button variant="ghost" onClick={() => setLocation("/applications")}>
            返回申请列表
          </Button>
        </div>
      </header>

      <div className="container max-w-5xl py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">申请预览</h1>
          <p className="text-gray-600 mt-2">请仔细核对以下信息，确认无误后提交申请</p>
        </div>

        {/* 申请编号和状态 */}
        <Card className="p-6 mb-6 bg-white border-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">申请编号 Application No.</p>
              <p className="text-2xl font-bold text-primary">
                {application?.applicationNumber || "未生成"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">申请状态 Status</p>
              <p className="text-2xl font-bold">
                {application?.status === "draft" && "草稿"}
                {application?.status === "submitted" && "已提交"}
                {application?.status === "approved" && "已批准"}
                {application?.status === "rejected" && "已拒绝"}
              </p>
            </div>
          </div>
        </Card>

        {/* CMF003风格的表格展示 */}
        <Card className="p-0 mb-6 overflow-hidden">
          {/* 标题 */}
          <div className="bg-primary text-white p-4 text-center">
            <h2 className="text-xl font-bold">客户開戶申請表（個人/聯名）</h2>
            <p className="text-sm">Customer Account Opening Form (Ind/Joint)</p>
          </div>

          {/* 账户类型 */}
          <div className="border-b">
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/3 border-r">客户类型 Customer Type</td>
                  <td className="p-3">{translateCustomerType(accountSelection?.customerType)}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/3 border-l">账户类型 Account Type</td>
                  <td className="p-3">{translateAccountType(accountSelection?.accountType)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 个人基本信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>1. 个人基本信息 Personal Basic Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(3)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">中文姓名 Name (Chinese)</td>
                  <td className="p-3 w-1/4 border-r">{personalBasic?.chineseName || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">英文姓名 Name (English)</td>
                  <td className="p-3 w-1/4">{personalBasic?.englishName || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">性别 Gender</td>
                  <td className="p-3 border-r">{translateGender(personalBasic?.gender)}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">出生日期 Date of Birth</td>
                  <td className="p-3">{formatDate(personalBasic?.dateOfBirth)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">出生地 Place of Birth</td>
                  <td className="p-3 border-r">{personalBasic?.placeOfBirth || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">国籍 Nationality</td>
                  <td className="p-3">{personalBasic?.nationality || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 个人详细信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>2. 个人详细信息 Personal Detailed Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(4)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">证件类型 ID Type</td>
                  <td className="p-3 w-1/4 border-r">{translateIdType(personalDetailed?.idType)}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">证件号码 ID Number</td>
                  <td className="p-3 w-1/4">{personalDetailed?.idNumber || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">签发地 Issuing Place</td>
                  <td className="p-3 border-r">{personalDetailed?.idIssuingPlace || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">有效期 Expiry Date</td>
                  <td className="p-3">
                    {personalDetailed?.idIsPermanent ? "长期有效" : formatDate(personalDetailed?.idExpiryDate)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">婚姻状况 Marital Status</td>
                  <td className="p-3 border-r">{translateMaritalStatus(personalDetailed?.maritalStatus)}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">学历 Education</td>
                  <td className="p-3">{translateEducationLevel(personalDetailed?.educationLevel)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">电子邮箱 Email</td>
                  <td className="p-3 border-r">{personalDetailed?.email || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">电话 Phone</td>
                  <td className="p-3">
                    {personalDetailed?.phoneCountryCode && personalDetailed?.phoneNumber
                      ? `${personalDetailed.phoneCountryCode} ${personalDetailed.phoneNumber}`
                      : "-"}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">传真 Fax</td>
                  <td className="p-3 border-r">{personalDetailed?.faxNo || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r" colSpan={2}></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">住宅地址 Residential Address</td>
                  <td className="p-3" colSpan={3}>{personalDetailed?.residentialAddress || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 职业信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>3. 职业信息 Occupation Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(5)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">就业状况 Employment Status</td>
                  <td className="p-3" colSpan={3}>{translateEmploymentStatus(occupation?.employmentStatus)}</td>
                </tr>
                {occupation?.employmentStatus === "employed" || occupation?.employmentStatus === "self_employed" ? (
                  <>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">公司名称 Company Name</td>
                      <td className="p-3 border-r">{occupation?.companyName || "-"}</td>
                      <td className="p-3 bg-gray-50 font-semibold border-r">职位 Position</td>
                      <td className="p-3">{occupation?.position || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">从业年限 Years of Service</td>
                      <td className="p-3 border-r">{occupation?.yearsOfService || "-"}</td>
                      <td className="p-3 bg-gray-50 font-semibold border-r">行业 Industry</td>
                      <td className="p-3">{occupation?.industry || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">办公地址 Office Address</td>
                      <td className="p-3" colSpan={3}>{occupation?.companyAddress || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">办公电话 Office Phone</td>
                      <td className="p-3 border-r">{occupation?.officePhone || "-"}</td>
                      <td className="p-3 bg-gray-50 font-semibold border-r">办公传真 Office Fax</td>
                      <td className="p-3">{occupation?.officeFaxNo || "-"}</td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* 财务状况 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>4. 财务状况 Financial Status</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(6)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">收入来源 Income Source</td>
                  <td className="p-3 w-1/4 border-r">{employment?.incomeSource || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">年收入 Annual Income (HKD)</td>
                  <td className="p-3 w-1/4">{formatAmount(employment?.annualIncome)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">流动资产 Liquid Asset (HKD)</td>
                  <td className="p-3 border-r">{formatAmount(employment?.liquidAsset)}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">净资产 Net Worth (HKD)</td>
                  <td className="p-3">{formatAmount(employment?.netWorth)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 投资信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>5. 投资信息 Investment Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(7)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">投资目的 Investment Objective</td>
                  <td className="p-3" colSpan={3}>{financial?.investmentObjectives || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">投资经验 Investment Experience</td>
                  <td className="p-3" colSpan={3}>{financial?.investmentExperience || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">风险承受能力 Risk Tolerance</td>
                  <td className="p-3" colSpan={3}>{financial?.riskTolerance || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 银行账户 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>6. 银行账户 Bank Account</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(8)}>
                  编辑
                </Button>
              </h3>
            </div>
            {bankAccounts && bankAccounts.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left border-r">银行名称 Bank Name</th>
                    <th className="p-3 text-left border-r">账户类型 Account Type</th>
                    <th className="p-3 text-left border-r">币种 Currency</th>
                    <th className="p-3 text-left border-r">账号 Account Number</th>
                    <th className="p-3 text-left">持有人 Holder Name</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((account, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 border-r">{account.bankName}</td>
                      <td className="p-3 border-r">{translateBankAccountType(account.accountType)}</td>
                      <td className="p-3 border-r">{account.accountCurrency}</td>
                      <td className="p-3 border-r">{account.accountNumber}</td>
                      <td className="p-3">{account.accountHolderName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">未添加银行账户</div>
            )}
          </div>

          {/* 税务信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>7. 税务信息 Tax Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(9)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">税务居民国家 Tax Residency</td>
                  <td className="p-3 w-1/4 border-r">{taxInfo?.taxResidency || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">税务识别号 TIN</td>
                  <td className="p-3 w-1/4">{taxInfo?.taxIdNumber || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 文件上传 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>8. 文件上传 Document Upload</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(10)}>
                  编辑
                </Button>
              </h3>
            </div>
            {documents && documents.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left border-r">文件类型 Document Type</th>
                    <th className="p-3 text-left border-r">文件名 File Name</th>
                    <th className="p-3 text-left">操作 Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 border-r">{doc.documentType}</td>
                      <td className="p-3 border-r">{doc.fileName}</td>
                      <td className="p-3">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          查看
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">未上传文件</div>
            )}
          </div>

          {/* 人脸识别 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>9. 人脸识别 Face Verification</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(11)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">验证状态 Verification Status</td>
                  <td className="p-3" colSpan={3}>
                    {faceVerification?.verified ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        已完成
                      </span>
                    ) : (
                      <span className="text-gray-500">未完成</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 监管声明 */}
          <div>
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>10. 监管声明 Regulatory Declaration</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(12)}>
                  编辑
                </Button>
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">是否为PEP</td>
                  <td className="p-3 w-1/4 border-r">{regulatory?.isPEP ? "是" : "否"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">是否为US Person</td>
                  <td className="p-3 w-1/4">{regulatory?.isUSPerson ? "是" : "否"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">协议签署 Agreement</td>
                  <td className="p-3" colSpan={3}>
                    {regulatory?.agreementAccepted ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        已同意并签署
                      </span>
                    ) : (
                      <span className="text-gray-500">未签署</span>
                    )}
                  </td>
                </tr>
                {regulatory?.signatureName && (
                  <tr className="border-b">
                    <td className="p-3 bg-gray-50 font-semibold border-r">签名 Signature</td>
                    <td className="p-3" colSpan={3}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{regulatory.signatureName}</span>
                        {regulatory.signedAt && (
                          <span className="text-sm text-gray-500 mt-1">
                            签署时间: {new Date(regulatory.signedAt).toLocaleString('zh-CN', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center gap-4">
          <Button variant="outline" onClick={() => setLocation(`/application/${applicationId}/step/12`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            上一步
          </Button>

          <div className="flex gap-4">
            {!application?.applicationNumber && (
              <Button
                onClick={handleSaveAndGenerateNumber}
                disabled={generateNumberMutation.isPending || hasGeneratedNumber || !application}
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                {generateNumberMutation.isPending ? "生成中..." : "保存并生成申请编号"}
              </Button>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!application?.applicationNumber || application?.status === "submitted" || submitMutation.isPending}
              size="lg"
            >
              {submitMutation.isPending ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </div>

        {/* 提示信息 */}
        {!application?.applicationNumber && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>提示：</strong>请先点击“保存并生成申请编号”按钮，生成申请编号后才能提交申请。
            </p>
          </div>
        )}
      </div>
      
      {/* 签名对话框 */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>电子签署 Electronic Signature</DialogTitle>
            <DialogDescription>
              请输入您的姓名以完成电子签署。此签名具有法律效力，以香港《电子交易条例》（第553章）为基准。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">签名方式 Signature Method</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="typed"
                    checked={signatureMethod === "typed"}
                    onChange={(e) => setSignatureMethod(e.target.value as "typed")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">输入姓名 Typed Name</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="iamsmart"
                    checked={signatureMethod === "iamsmart"}
                    onChange={(e) => setSignatureMethod(e.target.value as "iamsmart")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">iAM Smart 智方便</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">签名姓名 Signatory Name *</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="请输入您的英文姓名"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-1">电子签署声明：</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>本人同意使用电子签署方式签署本申请表</li>
                <li>此电子签署具有与手写签名同等的法律效力</li>
                <li>签署时间将自动记录并包含在申请表中</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmSignature} disabled={!signatureName.trim()}>
              确认签署并提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 提交成功对话框 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-green-600 flex items-center">
              <Check className="h-6 w-6 mr-2" />
              申请已成功提交！
            </DialogTitle>
            <DialogDescription className="text-base">
              感谢您的申请，我们已收到您的开户申请。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">申请编号：{application?.applicationNumber}</h4>
              <p className="text-sm text-gray-600">
                我们已将确认邮件发送至您的邮箱：<strong>{personalDetailed?.email}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                邮件中包含您的申请表PDF文件，请注意查收。
              </p>
            </div>
            
            {pdfUrl && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">下载申请表PDF</h4>
                <p className="text-sm text-gray-600 mb-3">
                  您也可以直接下载申请表PDF文件供存档使用。
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="w-full"
                >
                  下载申请表PDF
                </Button>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">后续流程：</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>我们的客户服务团队将在<strong>1-2个工作日</strong>内审核您的申请</li>
                <li>审核通过后，我们将通过邮件通知您</li>
                <li>如需补充资料，我们会及时与您联系</li>
              </ol>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              setShowSuccessDialog(false);
              setLocation("/applications");
            }}>
              返回申请列表
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
