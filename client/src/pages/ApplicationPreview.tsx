import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Save, FileDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { translate, formatInvestmentExperience as formatInvExp, formatInvestmentObjectives, formatAmount, getRiskToleranceDescription } from "@/lib/translations";
import { convertToTraditional } from "@/lib/converter";

// 使用翻譯工具中的函數
const formatInvestmentExperience = formatInvExp;

// 簡體轉繁體輔助函數
const toTraditional = (text: string | undefined | null): string => {
  if (!text) return "-";
  return convertToTraditional(text);
};

// 計算風險評估問卷的風險等級
const calculateRiskLevel = (riskQuestionnaire: any): { totalScore: number; riskLevel: string; riskDescription: string } => {
  if (!riskQuestionnaire) {
    return { totalScore: 0, riskLevel: "未完成風險評估", riskDescription: "" };
  }

  let score = 0;

  // Q1: 現在是否持有以下任何投資產品？（每個選項40分）
  try {
    const q1 = JSON.parse(riskQuestionnaire.q1_current_investments || '[]');
    if (q1.includes("savings")) score += 40;
    if (q1.includes("bonds")) score += 40;
    if (q1.includes("derivatives")) score += 40;
  } catch (e) {}

  // Q2: 預期投資年期（A=10分，B=30分，C=50分）
  if (riskQuestionnaire.q2_investment_period === "less_than_1") score += 10;
  else if (riskQuestionnaire.q2_investment_period === "1_to_3") score += 30;
  else if (riskQuestionnaire.q2_investment_period === "more_than_3") score += 50;

  // Q3: 可以接受的年度價格波幅（A=10分，B=30分，C=50分）
  if (riskQuestionnaire.q3_price_volatility === "10_percent") score += 10;
  else if (riskQuestionnaire.q3_price_volatility === "20_percent") score += 30;
  else if (riskQuestionnaire.q3_price_volatility === "30_percent") score += 50;

  // Q4: 資產淨值中可作投資用途的百分比（A=10分，B=20分，C=30分，D=40分，E=50分）
  if (riskQuestionnaire.q4_investment_percentage === "less_than_10") score += 10;
  else if (riskQuestionnaire.q4_investment_percentage === "10_to_20") score += 20;
  else if (riskQuestionnaire.q4_investment_percentage === "21_to_30") score += 30;
  else if (riskQuestionnaire.q4_investment_percentage === "31_to_50") score += 40;
  else if (riskQuestionnaire.q4_investment_percentage === "more_than_50") score += 50;

  // Q5: 對金融投資的一般態度（A=10分，B=20分，C=30分，D=40分，E=50分）
  if (riskQuestionnaire.q5_investment_attitude === "no_volatility") score += 10;
  else if (riskQuestionnaire.q5_investment_attitude === "small_volatility") score += 20;
  else if (riskQuestionnaire.q5_investment_attitude === "some_volatility") score += 30;
  else if (riskQuestionnaire.q5_investment_attitude === "large_volatility") score += 40;
  else if (riskQuestionnaire.q5_investment_attitude === "any_volatility") score += 50;

  // Q6: 對衍生工具產品的認識（A/B/C各40分，D=0分）
  try {
    const q6 = JSON.parse(riskQuestionnaire.q6_derivatives_knowledge || '[]');
    if (q6.includes("training")) score += 40;
    if (q6.includes("experience")) score += 40;
    if (q6.includes("transactions")) score += 40;
    if (q6.includes("no_knowledge")) score += 0;
  } catch (e) {}

  // Q7: 年齡組別（A=20分，B=30分，C=40分，D=20分，E=10分）
  if (riskQuestionnaire.q7_age_group === "18_to_25") score += 20;
  else if (riskQuestionnaire.q7_age_group === "26_to_35") score += 30;
  else if (riskQuestionnaire.q7_age_group === "36_to_50") score += 40;
  else if (riskQuestionnaire.q7_age_group === "51_to_64") score += 20;
  else if (riskQuestionnaire.q7_age_group === "65_plus") score += 10;

  // Q8: 教育程度（A=10分，B=30分，C=50分）
  if (riskQuestionnaire.q8_education_level === "primary_or_below") score += 10;
  else if (riskQuestionnaire.q8_education_level === "secondary") score += 30;
  else if (riskQuestionnaire.q8_education_level === "tertiary_or_above") score += 50;

  // Q9: 投資知識來源（A=0分，B/C/D各40分）
  try {
    const q9 = JSON.parse(riskQuestionnaire.q9_investment_knowledge_sources || '[]');
    if (q9.includes("no_interest")) score += 0;
    if (q9.includes("discussion")) score += 40;
    if (q9.includes("reading")) score += 40;
    if (q9.includes("research")) score += 40;
  } catch (e) {}

  // Q10: 流動資金需求（A=50分，B=30分，C=20分，D=10分）
  if (riskQuestionnaire.q10_liquidity_needs === "no_need") score += 50;
  else if (riskQuestionnaire.q10_liquidity_needs === "up_to_30") score += 30;
  else if (riskQuestionnaire.q10_liquidity_needs === "30_to_50") score += 20;
  else if (riskQuestionnaire.q10_liquidity_needs === "over_50") score += 10;

  // 判定風險等級（根據總分直接對應風險水平）
  let riskLevel = "";
  let riskDescription = "";
  
  if (score <= 99) {
    riskLevel = "Lowest / 最低";
    riskDescription = "You tend to prefer investments with a lowest risk of a decline in value. You are much more interested in preserving the value of your investment than receiving a return on your capital. 您倾向投資跌下降風險最低的投資。您對保存您投資值的興趣遠大於獲取您的資本回報。";
  } else if (score <= 199) {
    riskLevel = "Low / 低";
    riskDescription = "You tend to prefer investments with a low risk of a decline in value. You are more interested in preserving the value of your investment than receiving a return on your capital. 您倾向投資跌下降風險低的投資。您對保存您投資值的興趣大於獲取您的資本回報。";
  } else if (score <= 299) {
    riskLevel = "Low to Medium / 低至中等";
    riskDescription = "You tend to prefer investments with lower risk of a decline in value. However, you do recognize that in order to achieve higher returns, some risks must be incurred and you are prepared to tolerate some fluctuations and volatility in your investment. 您倾向投資跌下降風險較低的投資。然而您亦明白在您達到較高投資回報的過程中必須使一些風險，而您亦已準備接受一些投資上的波動及波幅。";
  } else if (score <= 399) {
    riskLevel = "Medium / 中等";
    riskDescription = "You are willing to place reasonable emphasis on growth investments and are aware that these are liable to fluctuate in value. You can tolerate some fluctuations and volatility, but you tend to stay away from the possibility of dramatic or frequent changes in value. 您著重投資增長的投資值的波動。您雖可以承受一些波動和變動，但您不希望看到有大波動或頁繁變動。";
  } else if (score <= 599) {
    riskLevel = "Medium to High / 中等至高";
    riskDescription = "You have an above-average tolerance to risk and are willing to accept a greater chance of decline in value for the potentially higher returns. 您對風險的承受程度較平均高並願意接受大機會的投資跌值去賺取較高的潛在回報。";
  } else {
    riskLevel = "High / 高";
    riskDescription = "You are willing, and usually eager, to accept a greater chance of a decline in value for potentially higher returns. 您願意並通常渴望接受大機會的投資跌值去賺取較高的潛在回報。";
  }

  return { totalScore: score, riskLevel, riskDescription };
};

/**
 * 申請预览页面 - 参照CMF003申請表的专业表格布局
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

  // 获取完整申請数据
  const { data: completeData, isLoading, refetch } = trpc.application.getComplete.useQuery(
    { id: applicationId },
    { enabled: !!applicationId && isAuthenticated }
  );

  // 生成申請编号
  const generateNumberMutation = trpc.application.generateNumber.useMutation({
    onSuccess: () => {
      toast.success("申請编号已生成");
      setHasGeneratedNumber(true);
      refetch();
    },
    onError: (error) => {
      toast.error(`生成申請编号失败: ${error.message}`);
    },
  });

  // 提交申請
  const submitMutation = trpc.application.submit.useMutation({
    onSuccess: (data) => {
      // 显示成功对话框，而不是直接跳转
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      }
      setShowSuccessDialog(true);
    },
    onError: (error) => {
      toast.error(`提交失敗: ${error.message}`);
    },
  });

  // 下载PDF
  const downloadPDFMutation = trpc.application.generatePreviewPDF.useMutation({
    onSuccess: (data) => {
      if (data.pdfData && data.fileName) {
        // 将base64转换为Blob
        const byteCharacters = atob(data.pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // 创建一个隐藏的a标签来触发下载
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放内存
        URL.revokeObjectURL(link.href);
        
        toast.success("申請表PDF已保存到本地");
      }
    },
    onError: (error) => {
      toast.error(`生成PDF失败: ${error.message}`);
    },
  });

  const handleDownloadPDF = () => {
    if (!applicationId) return;
    downloadPDFMutation.mutate({ applicationId: Number(applicationId) });
  };

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
          <p className="text-lg mb-4">未找到申請数据</p>
          <Button onClick={() => setLocation("/applications")}>返回申請列表</Button>
        </Card>
      </div>
    );
  }

  const { application, accountSelection, basicInfo: personalBasic, corporateBasic, detailedInfo: personalDetailed, occupation, employment, financial, corporateFinancial, bankAccounts, taxInfo, riskQuestionnaire, uploadedDocuments: documents, face: faceVerification, regulatory, relatedParties } = completeData;

  // 判断是否为機構客戶
  const isCorporate = accountSelection?.customerType === 'corporate';

  const handleSaveAndGenerateNumber = () => {
    if (!application?.applicationNumber) {
      generateNumberMutation.mutate({ id: applicationId });
    } else {
      toast.info("申請编号已存在");
    }
  };

  const handleSubmit = () => {
    if (!application?.applicationNumber) {
      toast.error("請先保存並生成申請編號");
      return;
    }
    if (application?.status === "submitted") {
      toast.info("申請已提交，无需重复提交");
      return;
    }
    // 显示签名对话框
    setSignatureName(completeData?.basicInfo?.englishName || "");
    setShowSignatureDialog(true);
  };

  const handleConfirmSignature = () => {
    if (!signatureName.trim()) {
      toast.error("請輸入簽名姓名");
      return;
    }
    submitMutation.mutate({ 
      id: applicationId,
      signatureName: signatureName.trim(),
      signatureData: "", // 电子签名数据（如果需要）
    });
    setShowSignatureDialog(false);
  };

    // 根據客戶類型轉換步驟編號
  const getCorporateStep = (individualStep: number): number => {
    const mapping: Record<number, number> = {
      2: 2,   // PersonalBasic -> CorporateBasic
      3: 3,   // PersonalDetailed -> FinancialAndInvestment
      4: 4,   // Occupation -> Occupation (same)
      5: 5,   // Employment -> RiskQuestionnaire
      6: 6,   // Financial -> BankAccount
      7: 7,   // Risk -> TaxInfo
      8: 8,   // Bank -> DocumentUpload
      9: 9,   // Tax -> RegulatoryDeclaration
      10: 9,  // Doc -> RegulatoryDeclaration
      11: 9,  // Face -> RegulatoryDeclaration
      12: 9,  // Regulatory -> RegulatoryDeclaration
    };
    return mapping[individualStep] || individualStep;
  };

  const handleEdit = (step: number) => {
    // 機構客戶需要轉換步驟編號
    const actualStep = accountSelection?.customerType === 'corporate' ? getCorporateStep(step) : step;
    setLocation(`/application/${applicationId}/step/${actualStep}?returnToPreview=true`);
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

  // 格式化金额區間（顯示完整區間）
  const formatAmountRange = (range: string | null | undefined) => {
    if (!range) return "-";
    // 如果包含連字符，表示是區間
    if (range.includes("-")) {
      const parts = range.split("-");
      if (parts.length === 2) {
        const start = parseInt(parts[0]);
        const end = parts[1].includes("+") ? parts[1] : parseInt(parts[1]);
        if (!isNaN(start)) {
          if (typeof end === "number" && !isNaN(end)) {
            return `HKD ${start.toLocaleString('en-US')} - ${end.toLocaleString('en-US')}`;
          } else if (typeof end === "string" && end.includes("+")) {
            return `HKD ${start.toLocaleString('en-US')}+`;
          }
        }
      }
    }
    // 如果包含+號，表示以上
    if (range.includes("+")) {
      const num = parseInt(range.replace("+", ""));
      if (!isNaN(num)) {
        return `HKD ${num.toLocaleString('en-US')}+`;
      }
    }
    // 如果是單一數字，直接格式化
    const num = parseInt(range);
    if (!isNaN(num)) {
      return `HKD ${num.toLocaleString('en-US')}`;
    }
    return range;
  };

  const formatAssetItems = (val: string | null | undefined) => {
    if (!val) return "-";
    try {
      const arr = JSON.parse(val);
      if (!Array.isArray(arr) || arr.length === 0) return "-";
      const map: Record<string, string> = {
        "property": "房地產 / Property",
        "securities": "上市證券 / Listed Securities",
        "deposit": "存款 / Deposit",
        "bonds": "債券 / Bonds",
        "funds": "基金 / Funds",
        "other": "其他 / Other",
      };
      return arr.map(k => map[k] || k).join(", ");
    } catch { return val; }
  };

  const formatSourceOfWealth = (val: string | null | undefined) => {
    if (!val) return "-";
    try {
      const arr = JSON.parse(val);
      if (!Array.isArray(arr) || arr.length === 0) return "-";
      const map: Record<string, string> = {
        "operation": "營業收入 / Operation Income",
        "investment": "投資收益 / Investment Income",
        "interest": "利息收入 / Interest Income",
        "dividend": "股息收入 / Dividend Income",
        "shareholder": "股東出資 / Shareholder Contribution",
        "rental": "租金收入 / Rental Income",
        "borrowing": "貸款 / External Borrowing",
        "other": "其他 / Other",
      };
      return arr.map(k => map[k] || k).join(", ");
    } catch { return val; }
  };

  const formatValueRange = (val: string | null | undefined) => {
    if (!val) return "-";
    const map: Record<string, string> = {
      "<1m": "<HK$1,000,000",
      "1m-5m": "HK$1,000,000 - HK$5,000,000",
      "5m-10m": "HK$5,000,001 - HK$10,000,000",
      ">10m": ">HK$10,000,000"
    };
    return map[val] || val;
  };

  // 使用統一的翻譯函數
  const translateCustomerType = translate;
  const translateAccountType = translate;
  const translateGender = translate;
  const translateIdType = translate;
  const translateMaritalStatus = translate;
  const translateEducationLevel = translate;
  const translateEmploymentStatus = translate;
  const translateBankAccountType = translate;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <a href="/" className="flex items-center">
            <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
          </a>
          <Button variant="ghost" onClick={() => setLocation("/applications")}>
            返回申請列表
          </Button>
        </div>
      </header>

      <div className="container max-w-5xl py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">申請预览</h1>
          <p className="text-gray-600 mt-2">請仔細核對以下信息，確認無誤後提交申請</p>
        </div>

        {/* 申請编号和状态 */}
        <Card className="p-6 mb-6 bg-white border-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">申請编号 Application No.</p>
              <p className="text-2xl font-bold text-primary">
                {application?.applicationNumber || "未生成"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">申請状态 Status</p>
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
        <Card className="p-0 mb-6 overflow-hidden overflow-x-auto">
          {/* 标题 */}
          <div className="bg-primary text-white p-4 text-center">
            <h2 className="text-xl font-bold">{isCorporate ? '客戶開戶申請表（機構）' : '客戶開戶申請表（個人/聯名）'}</h2>
            <p className="text-sm">{isCorporate ? 'Customer Account Opening Form (Corporate)' : 'Customer Account Opening Form (Ind/Joint)'}</p>
          </div>

          {/* 賬戶类型 */}
          <div className="border-b">
            <table className="w-full min-w-[600px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/3 border-r">客戶类型 Customer Type</td>
                  <td className="p-3">{translateCustomerType(accountSelection?.customerType)}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/3 border-l">賬戶类型 Account Type</td>
                  <td className="p-3">{translateAccountType(accountSelection?.accountType)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 個人/機構基本信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>1. {isCorporate ? '機構基本信息 Corporate Basic Information' : '個人基本信息 Personal Basic Information'}</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(2)}>
                  編輯
                </Button>
              </h3>
            </div>
            {isCorporate ? (
            <table className="w-full min-w-[800px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">公司中文名稱 Company Name (Chinese)</td>
                  <td className="p-3 w-3/4" colSpan={3}>{corporateBasic?.companyChineseName || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">公司英文名稱 Company Name (English)</td>
                  <td className="p-3" colSpan={3}>{corporateBasic?.companyEnglishName || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">成立地點 Country of Incorporation</td>
                  <td className="p-3 w-1/4 border-r">{corporateBasic?.countryOfIncorporation || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">成立日期 Date of Incorporation</td>
                  <td className="p-3">{formatDate(corporateBasic?.dateOfIncorporation)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">公司註冊編號 CI Number</td>
                  <td className="p-3 w-1/4 border-r">{corporateBasic?.certificateOfIncorporationNo || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">商業登記號 BR Number</td>
                  <td className="p-3">{corporateBasic?.businessRegistrationNo || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">實體性質 Nature of Entity</td>
                  <td className="p-3" colSpan={3}>{corporateBasic?.natureOfEntity || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">業務性質 Nature of Business</td>
                  <td className="p-3" colSpan={3}>{corporateBasic?.natureOfBusiness || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">註冊地址 Registered Address</td>
                  <td className="p-3" colSpan={3}>{corporateBasic?.registeredAddress || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">業務地址 Business Address</td>
                  <td className="p-3" colSpan={3}>{corporateBasic?.businessAddress || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">辦公電話 Office Phone</td>
                  <td className="p-3 w-1/4 border-r">{corporateBasic?.officeNo || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">傳真號碼 Fax</td>
                  <td className="p-3">{corporateBasic?.facsimileNo || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">聯絡人姓名 Contact Name</td>
                  <td className="p-3 w-1/4 border-r">{corporateBasic?.contactName || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">聯絡人職銜 Contact Title</td>
                  <td className="p-3">{corporateBasic?.contactTitle || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">聯絡電話 Contact Phone</td>
                  <td className="p-3 w-1/4 border-r">{corporateBasic?.contactPhone || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">電子郵箱 Email</td>
                  <td className="p-3">{corporateBasic?.contactEmail || "-"}</td>
                </tr>
              </tbody>
            </table>
            ) : (
            <table className="w-full min-w-[800px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">中文姓名 Name (Chinese)</td>
                  <td className="p-3 w-1/4 border-r">{personalBasic?.chineseName || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">英文姓名 Name (English)</td>
                  <td className="p-3 w-1/4">{personalBasic?.englishName || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">性別 Gender</td>
                  <td className="p-3 border-r">{translateGender(personalBasic?.gender)}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">出生日期 Date of Birth</td>
                  <td className="p-3">{formatDate(personalBasic?.dateOfBirth)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">出生地 Place of Birth</td>
                  <td className="p-3 border-r">{personalBasic?.placeOfBirth || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">國籍 Nationality</td>
                  <td className="p-3">{personalBasic?.nationality || "-"}</td>
                </tr>
              </tbody>
            </table>
            )}
          </div>

          {/* 機構：关联人士信息 / 個人：詳細信息 */}
          {isCorporate ? (
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>2. 關聯人士信息 Related Parties</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(4)}>
                  編輯
                </Button>
              </h3>
            </div>
            {relatedParties && relatedParties.length > 0 ? (
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left border-r">姓名 Name</th>
                    <th className="p-3 text-left border-r">關係類型 Relationship</th>
                    <th className="p-3 text-left border-r">證件號碼 ID Number</th>
                    <th className="p-3 text-left">電話 Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedParties.map((party: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 border-r">{party.name || "-"}</td>
                      <td className="p-3 border-r">
                        {party.relationshipType === 'director' ? '董事 Director' : 
                         party.relationshipType === 'shareholder' ? '股東 Shareholder' : 
                         party.relationshipType === 'beneficial_owner' ? '最終受益人 Beneficial Owner' : 
                         party.relationshipType === 'authorized_signatory' ? '授權簽署人 Authorized Signatory' : 
                         party.relationshipType || "-"}
                      </td>
                      <td className="p-3 border-r">{party.idNumber || "-"}</td>
                      <td className="p-3">{party.phone ? `${party.phoneCountryCode || '+852'} ${party.phone}` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">未添加關聯人士</div>
            )}
          </div>
          ) : (
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>2. 個人詳細信息 Personal Detailed Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(4)}>
                  編輯
                </Button>
              </h3>
            </div>
            <table className="w-full min-w-[800px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">證件类型 ID Type</td>
                  <td className="p-3 w-1/4 border-r">{translateIdType(personalDetailed?.idType)}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">證件号码 ID Number</td>
                  <td className="p-3 w-1/4">{personalDetailed?.idNumber || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">簽發地 Issuing Place</td>
                  <td className="p-3 border-r">{personalDetailed?.idIssuingPlace || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">有效期 Expiry Date</td>
                  <td className="p-3">
                    {personalDetailed?.idIsPermanent ? "長期有效" : formatDate(personalDetailed?.idExpiryDate)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">婚姻狀況 Marital Status</td>
                  <td className="p-3 border-r">{translateMaritalStatus(personalDetailed?.maritalStatus)}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">学历 Education</td>
                  <td className="p-3">{translateEducationLevel(personalDetailed?.educationLevel)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">電子郵箱 Email</td>
                  <td className="p-3 border-r">{personalDetailed?.email || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">電話 Phone</td>
                  <td className="p-3">
                    {personalDetailed?.phoneCountryCode && personalDetailed?.phoneNumber
                      ? `${personalDetailed.phoneCountryCode} ${personalDetailed.phoneNumber}`
                      : "-"}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">手機號碼 Mobile</td>
                  <td className="p-3 border-r">
                    {personalDetailed?.mobileCountryCode && personalDetailed?.mobileNumber
                      ? `${personalDetailed.mobileCountryCode} ${personalDetailed.mobileNumber}`
                      : "-"}
                  </td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">传真 Fax</td>
                  <td className="p-3">{personalDetailed?.faxNo || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">住宅地址 Residential Address</td>
                  <td className="p-3" colSpan={3}>{personalDetailed?.residentialAddress || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">賬單通訊地址 Billing Address</td>
                  <td className="p-3" colSpan={3}>
                    {personalDetailed?.billingAddressType === "residential" && "住宅地址 (Residential Address)"}
                    {personalDetailed?.billingAddressType === "office" && "辦公地址 (Office Address)"}
                    {personalDetailed?.billingAddressType === "other" && (
                      <span>其他 (Other): {personalDetailed?.billingAddressOther || "-"}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">賬單首選語言 Preferred Language</td>
                  <td className="p-3" colSpan={3}>
                    {personalDetailed?.preferredLanguage === "chinese" ? "中文 (Chinese)" : "英文 (English)"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}

          {/* 職業信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>3. 職業信息 Occupation Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(5)}>
                  編輯
                </Button>
              </h3>
            </div>
            <table className="w-full min-w-[800px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">就业状况 Employment Status</td>
                  <td className="p-3" colSpan={3}>{translateEmploymentStatus(occupation?.employmentStatus)}</td>
                </tr>
                {occupation?.employmentStatus === "employed" || occupation?.employmentStatus === "self_employed" ? (
                  <>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">公司名稱 Company Name</td>
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
                      <td className="p-3 bg-gray-50 font-semibold border-r">辦公地址 Office Address</td>
                      <td className="p-3" colSpan={3}>{occupation?.companyAddress || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">办公電話 Office Phone</td>
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
                  編輯
                </Button>
              </h3>
            </div>
            <table className="w-full min-w-[800px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">收入来源 Income Source</td>
                  <td className="p-3 w-1/4 border-r">{translate(employment?.incomeSource) || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">年收入 Annual Income</td>
                  <td className="p-3 w-1/4">{formatAmountRange(employment?.annualIncome)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">流动资产 Liquid Asset</td>
                  <td className="p-3 border-r">{formatAmountRange(employment?.liquidAsset)}</td>
                  <td className="p-3 bg-gray-50 font-semibold border-r">净资产 Net Worth</td>
                  <td className="p-3">{formatAmountRange(employment?.netWorth)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 投資信息 - 機構或個人信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>5. {isCorporate ? '公司財務與投資概況 Financial & Investment' : '投資信息 Investment Information'}</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(7)}>
                  編輯
                </Button>
              </h3>
            </div>
            <table className="w-full min-w-[800px]">
              <tbody>
                {isCorporate ? (
                  // 機構财务信息
                  <>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">法定股本<br/>Authorized Share Capital</td>
                      <td className="p-3 w-1/4 border-r">{corporateFinancial?.authorizedShareCapital ? `${corporateFinancial.authorizedShareCapital} 萬港元` : "-"}</td>
                      <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">已發行及繳足股本<br/>Issued Share Capital</td>
                      <td className="p-3">{corporateFinancial?.issuedShareCapital ? `${corporateFinancial.issuedShareCapital} 萬港元` : "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">初始財富來源<br/>Initial Source of Wealth</td>
                      <td className="p-3" colSpan={3}>{formatSourceOfWealth(corporateFinancial?.initialSourceOfWealth)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">淨資產值<br/>Net Asset Value</td>
                      <td className="p-3 border-r">{formatValueRange(corporateFinancial?.netAssetValue)}</td>
                      <td className="p-3 bg-gray-50 font-semibold border-r">淨資產審計時間<br/>Net Asset Audit Date</td>
                      <td className="p-3">{corporateFinancial?.netAssetAuditDate || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">稅後盈利<br/>Profit After Tax</td>
                      <td className="p-3 border-r">{formatValueRange(corporateFinancial?.profitAfterTax)}</td>
                      <td className="p-3 bg-gray-50 font-semibold border-r">稅後盈利審計時間<br/>Profit Audit Date</td>
                      <td className="p-3">{corporateFinancial?.profitAuditDate || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">資產項目<br/>Asset Items</td>
                      <td className="p-3" colSpan={3}>{formatAssetItems(corporateFinancial?.assetItems)}</td>
                    </tr>
                  </>
                ) : (
                  // 個人投資信息
                  <>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">投資目的 Investment Objective</td>
                      <td className="p-3" colSpan={3}>{formatInvestmentObjectives(financial?.investmentObjectives) || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">投資经验 Investment Experience</td>
                      <td className="p-3" colSpan={3}>{formatInvestmentExperience(financial?.investmentExperience)}</td>
                    </tr>
                  </>
                )}
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">風險承受能力 Risk Tolerance</td>
                  <td className="p-3" colSpan={3}>
                    {riskQuestionnaire ? (
                      <div>
                        <div className="font-semibold">{calculateRiskLevel(riskQuestionnaire).riskLevel}</div>
                        <div className="text-sm text-gray-600 mt-1">{calculateRiskLevel(riskQuestionnaire).riskDescription}</div>
                        <div className="text-xs text-gray-500 mt-1">（基於風險評估問卷總分: {calculateRiskLevel(riskQuestionnaire).totalScore}）</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">未完成風險評估問卷</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 銀行賬戶 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>6. 銀行賬戶 Bank Account</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(8)}>
                  編輯
                </Button>
              </h3>
            </div>
            {bankAccounts && bankAccounts.length > 0 ? (
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left border-r">銀行名稱 Bank Name</th>
                    <th className="p-3 text-left border-r">賬戶类型 Account Type</th>
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
              <div className="p-6 text-center text-gray-500">未添加銀行賬戶</div>
            )}
          </div>

          {/* 稅務信息 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>7. 稅務信息 Tax Information</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(9)}>
                  編輯
                </Button>
              </h3>
            </div>
            <table className="w-full min-w-[800px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">稅務居民国家 Tax Residency</td>
                  <td className="p-3 w-1/4 border-r">{taxInfo?.taxResidency || "-"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">稅務识别号 TIN</td>
                  <td className="p-3 w-1/4">{taxInfo?.taxIdNumber || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 風險評估問卷 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>8. 風險評估問卷 Risk Assessment Questionnaire</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(8)}>
                  編輯
                </Button>
              </h3>
            </div>
            {riskQuestionnaire ? (
              <div className="p-6 space-y-6">
                {/* 問卷答案详情 */}
                <table className="w-full min-w-[800px] border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left border-r w-1/3">问题 Question</th>
                      <th className="p-3 text-left w-2/3">答案 Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Q1 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q1. 現在是否持有以下任何投資產品？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q1_current_investments ? 
                          JSON.parse(riskQuestionnaire.q1_current_investments).map((item: string) => {
                            if (item === "savings") return "儲蓄/定期儲蓄/存款證/保本產品";
                            if (item === "bonds") return "债券/證券/單位信託基金/投資相連保險計劃";
                            if (item === "derivatives") return "期貨/期權/衔生產品/結構性投資產品/掛鉤存款/槓桿式外匯投資";
                            return item;
                          }).join(", ") 
                          : "-"}
                      </td>
                    </tr>
                    {/* Q2 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q2. 預期投資年期是多少？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q2_investment_period === "less_than_1" && "沒有或少於1年"}
                        {riskQuestionnaire.q2_investment_period === "1_to_3" && "1-3年"}
                        {riskQuestionnaire.q2_investment_period === "more_than_3" && "多於3年"}
                        {!riskQuestionnaire.q2_investment_period && "-"}
                      </td>
                    </tr>
                    {/* Q3 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q3. 可以接受以下哪個年度價格波幅？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q3_price_volatility === "10_percent" && "價格波幅介乎-10%至+10%"}
                        {riskQuestionnaire.q3_price_volatility === "20_percent" && "價格波幅介乎-20%至+20%"}
                        {riskQuestionnaire.q3_price_volatility === "30_percent" && "價格波幅多於-30%至多於+30%"}
                        {!riskQuestionnaire.q3_price_volatility && "-"}
                      </td>
                    </tr>
                    {/* Q4 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q4. 在現時資產淫值中(撤除自住物業價值)，有多少個百分比可作投資用途？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q4_investment_percentage === "less_than_10" && "少於10%"}
                        {riskQuestionnaire.q4_investment_percentage === "10_to_20" && "介乎10%至20%"}
                        {riskQuestionnaire.q4_investment_percentage === "21_to_30" && "介乎21%至30%"}
                        {riskQuestionnaire.q4_investment_percentage === "31_to_50" && "介乎31%至50%"}
                        {riskQuestionnaire.q4_investment_percentage === "more_than_50" && "多於50%"}
                        {!riskQuestionnaire.q4_investment_percentage && "-"}
                      </td>
                    </tr>
                    {/* Q5 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q5. 以下哪一句子最能貼切描述您對金融投資的一般態度？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q5_investment_attitude === "no_volatility" && "不能接受任何價格波動，並且對賭取投資回報不感興趣"}
                        {riskQuestionnaire.q5_investment_attitude === "small_volatility" && "只能接受較小幅度的價格波動，並且僅希望賭取稍高於銀行存款利率的回報"}
                        {riskQuestionnaire.q5_investment_attitude === "some_volatility" && "可接受若干價格波幅，並希望賭取高於銀行存款利率的回報"}
                        {riskQuestionnaire.q5_investment_attitude === "large_volatility" && "可接受大幅度的價格波動，並希望賭取與股市指數表現相若的回報"}
                        {riskQuestionnaire.q5_investment_attitude === "any_volatility" && "可接受任何幅度的價格波動，並希望回報能跑贏股市指數"}
                        {!riskQuestionnaire.q5_investment_attitude && "-"}
                      </td>
                    </tr>
                    {/* Q6 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q6. 對衔生工具產品的認識</td>
                      <td className="p-3">
                        {riskQuestionnaire.q6_derivatives_knowledge ? 
                          JSON.parse(riskQuestionnaire.q6_derivatives_knowledge).map((item: string) => {
                            if (item === "training") return "曾接受有關衔生產品的培訓或修讀相關課程";
                            if (item === "experience") return "現時或過去擁有與衔生產品有關的工作經驗";
                            if (item === "transactions") return "於過往3年曾執行5次或以上有關衔生產品的交易";
                            if (item === "no_knowledge") return "沒有衔生工具之認識";
                            return item;
                          }).join(", ") 
                          : "-"}
                      </td>
                    </tr>
                    {/* Q7 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q7. 您屬於以下哪個年齡組別？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q7_age_group === "18_to_25" && "介乎18至25歲"}
                        {riskQuestionnaire.q7_age_group === "26_to_35" && "介乎26至35歲"}
                        {riskQuestionnaire.q7_age_group === "36_to_50" && "介乎36至50歲"}
                        {riskQuestionnaire.q7_age_group === "51_to_64" && "介乎51至64歲"}
                        {riskQuestionnaire.q7_age_group === "65_plus" && "65歲或以上"}
                        {!riskQuestionnaire.q7_age_group && "-"}
                      </td>
                    </tr>
                    {/* Q8 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q8. 您的教育程度</td>
                      <td className="p-3">
                        {riskQuestionnaire.q8_education_level === "primary_or_below" && "A. 小學或以下學歷"}
                        {riskQuestionnaire.q8_education_level === "secondary" && "B. 中學"}
                        {riskQuestionnaire.q8_education_level === "tertiary_or_above" && "C. 大專或以上學歷"}
                        {!riskQuestionnaire.q8_education_level && "-"}
                      </td>
                    </tr>
                    {/* Q9 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q9. 您曾經或現時從以下哪些途徑汲取投資知識？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q9_investment_knowledge_sources ? 
                          JSON.parse(riskQuestionnaire.q9_investment_knowledge_sources).map((item: string) => {
                            if (item === "no_interest") return "從未汲取及/或沒有興趣汲取任何投資知識";
                            if (item === "discussion") return "與親友及/或同事討論投資或理財話題";
                            if (item === "reading") return "閱讀及/或收聽有關投資或財經新聞";
                            if (item === "research") return "研究投資或財務相關事宜，或參加投資或財務相關課程、論壇、簡報會、研討會或工作坊";
                            return item;
                          }).join(", ") 
                          : "-"}
                      </td>
                    </tr>
                    {/* Q10 */}
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-semibold border-r">Q10. 您需要將多少投資兌現，以滿足突發事件的流動資金需求？</td>
                      <td className="p-3">
                        {riskQuestionnaire.q10_liquidity_needs === "no_need" && "不需要出售任何投資"}
                        {riskQuestionnaire.q10_liquidity_needs === "up_to_30" && "我會出售不超過30%的投資"}
                        {riskQuestionnaire.q10_liquidity_needs === "30_to_50" && "我會出售超過30%但不到50%的投資"}
                        {riskQuestionnaire.q10_liquidity_needs === "over_50" && "我會出售超過50%的投資"}
                        {!riskQuestionnaire.q10_liquidity_needs && "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">未填写風險評估問卷</div>
            )}
          </div>

          {/* 文件上传 */}
          <div className="border-b">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-bold flex items-center justify-between">
                <span>8. 文件上传 Document Upload</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(10)}>
                  編輯
                </Button>
              </h3>
            </div>
            {documents && documents.length > 0 ? (
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left border-r">文件类型 Document Type</th>
                    <th className="p-3 text-left border-r">文件名 File Name</th>
                    <th className="p-3 text-left">操作 Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 border-r">{translate(doc.documentType)}</td>
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
                  編輯
                </Button>
              </h3>
            </div>
            <table className="w-full min-w-[800px]">
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
                  編輯
                </Button>
              </h3>
            </div>
            <table className="w-full min-w-[800px]">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">是否为PEP</td>
                  <td className="p-3 w-1/4 border-r">{regulatory?.isPEP ? "是" : "否"}</td>
                  <td className="p-3 bg-gray-50 font-semibold w-1/4 border-r">是否为US Person</td>
                  <td className="p-3 w-1/4">{regulatory?.isUSPerson ? "是" : "否"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">已閱讀開戶協議 Read Agreement</td>
                  <td className="p-3" colSpan={3}>
                    {regulatory?.agreementRead ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        是
                      </span>
                    ) : (
                      <span className="text-gray-500">否</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">接受電子交易條例 ETO Consent</td>
                  <td className="p-3" colSpan={3}>
                    {regulatory?.electronicSignatureConsent ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        已接受
                      </span>
                    ) : (
                      <span className="text-gray-500">未接受</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">接受反洗錢和合規監管 AML Consent</td>
                  <td className="p-3" colSpan={3}>
                    {regulatory?.amlComplianceConsent ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        已接受
                      </span>
                    ) : (
                      <span className="text-gray-500">未接受</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-semibold border-r">風險評估確認 Risk Assessment Consent</td>
                  <td className="p-3" colSpan={3}>
                    {regulatory?.riskAssessmentConsent ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        已確認
                      </span>
                    ) : (
                      <span className="text-gray-500">未確認</span>
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

        {/* 审批记录 Approval Records */}
        {(application?.firstApprovalStatus === 'approved' || application?.secondApprovalStatus === 'approved') && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">审批记录 Approval Records</h2>
            
            {/* 初审记录 */}
            {application?.firstApprovalStatus === 'approved' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">初审记录 First Approval</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">审批人员 Approver：</span>
                    <span className="font-medium ml-2">{application.firstApprovalByName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CE号码 CE Number：</span>
                    <span className="font-medium ml-2">{application.firstApprovalByCeNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">专业投資者认定 Professional Investor：</span>
                    <span className="font-medium ml-2">{application.isProfessionalInvestor ? '是 Yes' : '否 No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">風險评级 Risk Profile：</span>
                    <span className="font-medium ml-2">{application.approvedRiskProfile ? getRiskToleranceDescription(application.approvedRiskProfile) : 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">审批时间 Approval Time：</span>
                    <span className="font-medium ml-2">
                      {application.firstApprovalAt ? new Date(application.firstApprovalAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : 'N/A'}
                    </span>
                  </div>
                  {application.firstApprovalComments && (
                    <div className="col-span-2 pt-2 border-t border-blue-200">
                      <span className="text-gray-600">审批意见 Comments：</span>
                      <p className="mt-1 text-blue-700">{application.firstApprovalComments}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 终审记录 */}
            {application?.secondApprovalStatus === 'approved' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-lg font-semibold mb-3 text-green-800">终审记录 Final Approval</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">审批人员 Approver：</span>
                    <span className="font-medium ml-2">{application.secondApprovalByName || 'N/A'}</span>
                  </div>
                  {application.secondApprovalByCeNo && (
                    <div>
                      <span className="text-gray-600">CE号码 CE Number：</span>
                      <span className="font-medium ml-2">{application.secondApprovalByCeNo}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">专业投資者认定 Professional Investor：</span>
                    <span className="font-medium ml-2">{application.isProfessionalInvestor ? '是 Yes' : '否 No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">風險评级 Risk Profile：</span>
                    <span className="font-medium ml-2">{application.approvedRiskProfile ? getRiskToleranceDescription(application.approvedRiskProfile) : 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">审批时间 Approval Time：</span>
                    <span className="font-medium ml-2">
                      {application.secondApprovalAt ? new Date(application.secondApprovalAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : 'N/A'}
                    </span>
                  </div>
                  {application.secondApprovalComments && (
                    <div className="col-span-2 pt-2 border-t border-green-200">
                      <span className="text-gray-600">审批意见 Comments：</span>
                      <p className="mt-1 text-green-700">{application.secondApprovalComments}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

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
                {generateNumberMutation.isPending ? "生成中..." : "保存並生成申請編號"}
              </Button>
            )}

            {application?.applicationNumber && (
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadPDFMutation.isPending}
                variant="outline"
              >
                <FileDown className="h-4 w-4 mr-2" />
                {downloadPDFMutation.isPending ? "生成中..." : "保存为PDF"}
              </Button>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!application?.applicationNumber || application?.status === "submitted" || submitMutation.isPending}
              size="lg"
            >
              {submitMutation.isPending ? "提交中..." : "提交申請"}
            </Button>
          </div>
        </div>

        {/* 提示信息 */}
        {!application?.applicationNumber && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>提示：</strong>請先點擊“保存並生成申請編號”按钮，生成申請編號後才能提交申請。
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
              請輸入您的姓名以完成電子簽署。此签名具有法律效力，以香港《电子交易条例》（第553章）为基准。
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
                placeholder="請輸入您的英文姓名"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-1">电子签署声明：</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>本人同意使用电子签署方式签署本申請表</li>
                <li>此电子签署具有与手写签名同等的法律效力</li>
                <li>签署时间将自动记录并包含在申請表中</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmSignature} disabled={!signatureName.trim()}>
              確認簽署並提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 提交成功对话框 */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        if (!open) {
          // 关闭对话框时跳转到列表页
          setLocation("/applications");
        }
        setShowSuccessDialog(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-green-600 flex items-center">
              <Check className="h-6 w-6 mr-2" />
              申請已成功提交！
            </DialogTitle>
            <DialogDescription className="text-base">
              感谢您的申請，我们已收到您的开户申請。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">申請编号：{application?.applicationNumber}</h4>
              <p className="text-sm text-gray-600">
                我们已将确认邮件发送至您的邮箱：<strong>{personalDetailed?.email}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                邮件中包含您的申請表PDF文件，请注意查收。
              </p>
            </div>
            
            {pdfUrl && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">下载申請表PDF</h4>
                <p className="text-sm text-gray-600 mb-3">
                  您也可以直接下载申請表PDF文件供存档使用。
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="w-full"
                >
                  下载申請表PDF
                </Button>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">后续流程：</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>我们的客戶服务团队将在<strong>1-2个工作日</strong>内审核您的申請</li>
                <li>审核通过后，我们将通过邮件通知您</li>
                <li>如需补充資料，我们会及时与您聯繫</li>
              </ol>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              setShowSuccessDialog(false);
              setLocation("/applications");
            }}>
              返回申請列表
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
