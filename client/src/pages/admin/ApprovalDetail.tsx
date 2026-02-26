import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LogOut, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { translate, formatInvestmentObjectives, getRiskToleranceDescription } from "@/lib/translations";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [isProfessionalInvestor, setIsProfessionalInvestor] = useState<string>("");
  const [approvedRiskProfile, setApprovedRiskProfile] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showRiskWarningDialog, setShowRiskWarningDialog] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");

  const { data: applicationData, isLoading } = trpc.approval.getApplicationDetail.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  
  // 获取审批历史记录
  const { data: approvalHistory } = trpc.approval.getHistory.useQuery(
    { applicationId: Number(id) },
    { enabled: !!id }
  );

  // 初始化審批狀態：當applicationData載入時，設置初審人員已選擇的值
  useEffect(() => {
    if (applicationData?.application) {
      // 如果是待終審狀態，使用初審人員的選擇作為預設值
      if (applicationData.application.firstApprovalStatus === 'approved' && applicationData.application.secondApprovalStatus === 'pending') {
        setIsProfessionalInvestor(applicationData.application.isProfessionalInvestor ? 'yes' : 'no');
        setApprovedRiskProfile(applicationData.application.approvedRiskProfile || '');
      }
    }
  }, [applicationData]);

  // 初審mutation
  const firstApproveMutation = trpc.approval.firstApprove.useMutation({
    onSuccess: () => {
      toast.success("初審已批准");
      setLocation("/admin/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message || "初審批准失败");
    },
  });
  
  // 終審mutation
  const secondApproveMutation = trpc.approval.secondApprove.useMutation({
    onSuccess: () => {
      toast.success("終審已批准");
      setLocation("/admin/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message || "終審批准失败");
    },
  });

  const rejectMutation = trpc.approval.reject.useMutation({
    onSuccess: () => {
      toast.success("申请已拒绝");
      setShowRejectDialog(false);
      setLocation("/admin/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message || "拒绝失败");
    },
  });

  const returnMutation = trpc.approval.return.useMutation({
    onSuccess: () => {
      toast.success("申请已退回");
      setShowReturnDialog(false);
      setLocation("/admin/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message || "退回失败");
    },
  });

  const handleLogout = async () => {
    await logout();
    toast.success("已登出");
    setLocation("/admin");
  };

  const handleApprove = () => {
    if (!isProfessionalInvestor || !approvedRiskProfile) {
      toast.error("请完成所有审批选项");
      return;
    }
    
    // 检查风险评级是否与客户自评一致
    const riskAssessment = calculateRiskLevel(applicationData?.riskQuestionnaire);
    const customerRisk = riskAssessment.riskLevel;
    // 注意：审批人员选择的是R1-R5，但客户自评是新的风险等级格式，这里不再做直接比较
    // 如果需要比较，应该将R1-R5映射到新的风险等级
    confirmApprove();
  };
  
  const confirmApprove = () => {
    setShowRiskWarningDialog(false);
    
    // 根據申請狀態決定調用初審還是終審
    const isFirstApproval = !applicationData?.application?.firstApprovalStatus || applicationData.application.firstApprovalStatus !== 'approved';
    
    if (isFirstApproval) {
      // 初审
      firstApproveMutation.mutate({
        applicationId: Number(id),
        isProfessionalInvestor: isProfessionalInvestor === "yes",
        approvedRiskProfile: approvedRiskProfile as 'Lowest' | 'Low' | 'Low to Medium' | 'Medium' | 'Medium to High' | 'High',
        comments: approvalComments,
      });
    } else {
      // 終审
      secondApproveMutation.mutate({
        applicationId: Number(id),
        isProfessionalInvestor: isProfessionalInvestor === "yes",
        riskProfile: approvedRiskProfile as 'Lowest' | 'Low' | 'Low to Medium' | 'Medium' | 'Medium to High' | 'High',
        comments: approvalComments,
      });
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("请输入拒绝理由");
      return;
    }
    rejectMutation.mutate({
      applicationId: Number(id),
      rejectReason: rejectReason,
    });
  };

  const handleReturn = () => {
    if (!returnReason.trim()) {
      toast.error("请输入退回理由");
      return;
    }
    returnMutation.mutate({
      applicationId: Number(id),
      returnReason: returnReason,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">未找到申请信息</p>
          <Button onClick={() => setLocation("/admin/approvals")} className="mt-4">
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const application = applicationData.application;
  const personalBasicInfo = applicationData.basicInfo;
  const personalDetailedInfo = applicationData.detailedInfo;
  const occupationInfo = applicationData.occupation;
  const employmentDetails = applicationData.employment;
  const financialAndInvestment = applicationData.financial;
  const bankAccounts = applicationData.bankAccounts;
  const taxInformation = applicationData.taxInfo;
  const documents = applicationData.uploadedDocuments;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center cursor-pointer">
            <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            登出 / Log out
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin/approvals")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回列表
        </Button>

        {/* Application Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>申请信息</CardTitle>
            <CardDescription>
              申请编号：{application?.applicationNumber} | 提交时间：{application?.submittedAt ? new Date(application.submittedAt).toLocaleString("zh-HK") : "-"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Customer Preview (Similar to ApplicationPreview) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>客户申请预览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Basic Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2">个人基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>中文姓名</Label>
                  <p>{personalBasicInfo?.chineseName || "-"}</p>
                </div>
                <div>
                  <Label>英文姓名</Label>
                  <p>{personalBasicInfo?.englishName || "-"}</p>
                </div>
                <div>
                  <Label>性别</Label>
                  <p>{personalBasicInfo?.gender === 'male' ? '男' : personalBasicInfo?.gender === 'female' ? '女' : personalBasicInfo?.gender || "-"}</p>
                </div>
                <div>
                  <Label>出生日期</Label>
                  <p>{personalBasicInfo?.dateOfBirth ? new Date(personalBasicInfo.dateOfBirth).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <Label>出生地</Label>
                  <p>{personalBasicInfo?.placeOfBirth || "-"}</p>
                </div>
                <div>
                  <Label>国籍</Label>
                  <p>{personalBasicInfo?.nationality || "-"}</p>
                </div>
              </div>
            </div>

            {/* Personal Detailed Info */}
            {personalDetailedInfo && (
              <div>
                <h3 className="font-semibold text-lg mb-2">个人详细信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>证件类型</Label>
                    <p>{translate(personalDetailedInfo.idType) || "-"}</p>
                  </div>
                  <div>
                    <Label>证件号码</Label>
                    <p>{personalDetailedInfo.idNumber || "-"}</p>
                  </div>
                  <div>
                    <Label>证件签发地</Label>
                    <p>{personalDetailedInfo.idIssuingPlace || "-"}</p>
                  </div>
                  <div>
                    <Label>证件有效期</Label>
                    <p>{personalDetailedInfo.idIsPermanent ? '永久有效' : personalDetailedInfo.idExpiryDate ? new Date(personalDetailedInfo.idExpiryDate).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <Label>婚姻状况</Label>
                    <p>{personalDetailedInfo.maritalStatus || "-"}</p>
                  </div>
                  <div>
                    <Label>学历状况</Label>
                    <p>{personalDetailedInfo.educationLevel || "-"}</p>
                  </div>
                  <div>
                    <Label>电话</Label>
                    <p>{personalDetailedInfo.phoneCountryCode ? `+${personalDetailedInfo.phoneCountryCode} ${personalDetailedInfo.phoneNumber}` : personalDetailedInfo.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <Label>传真</Label>
                    <p>{personalDetailedInfo.faxNo || "-"}</p>
                  </div>
                  <div>
                    <Label>邮箱</Label>
                    <p>{personalDetailedInfo.email || "-"}</p>
                  </div>
                  <div>
                    <Label>手机号 Mobile Number</Label>
                    <p>{personalDetailedInfo.mobileCountryCode ? `+${personalDetailedInfo.mobileCountryCode} ${personalDetailedInfo.mobileNumber}` : personalDetailedInfo.mobileNumber || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>居住地址</Label>
                    <p>{personalDetailedInfo.residentialAddress || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>通讯地址 Billing Address</Label>
                    <p>{personalDetailedInfo.billingAddressType === 'residential' ? '与居住地址相同 Same as Residential Address' : personalDetailedInfo.billingAddressType === 'office' ? '办公地址 Office Address' : personalDetailedInfo.billingAddressOther || "-"}</p>
                  </div>
                  <div>
                    <Label>账单语言 Preferred Language</Label>
                    <p>{personalDetailedInfo.preferredLanguage === 'chinese' ? '中文 Chinese' : 'English'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Occupation Info */}
            {occupationInfo && (
              <div>
                <h3 className="font-semibold text-lg mb-2">职业信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>就业状态</Label>
                    <p>{occupationInfo.employmentStatus === 'employed' ? '受雇' : occupationInfo.employmentStatus === 'self_employed' ? '自雇' : occupationInfo.employmentStatus === 'student' ? '学生' : occupationInfo.employmentStatus === 'unemployed' ? '失业' : occupationInfo.employmentStatus || "-"}</p>
                  </div>
                  <div>
                    <Label>公司/业务名称</Label>
                    <p>{occupationInfo.companyName || "-"}</p>
                  </div>
                  <div>
                    <Label>职位</Label>
                    <p>{occupationInfo.position || "-"}</p>
                  </div>
                  <div>
                    <Label>从业年期</Label>
                    <p>{occupationInfo.yearsOfService ? `${occupationInfo.yearsOfService}年` : "-"}</p>
                  </div>
                  <div>
                    <Label>行业</Label>
                    <p>{occupationInfo.industry || "-"}</p>
                  </div>
                  <div>
                    <Label>办公电话</Label>
                    <p>{occupationInfo.officePhone || "-"}</p>
                  </div>
                  <div>
                    <Label>办公传真</Label>
                    <p>{occupationInfo.officeFaxNo || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>业务/公司地址</Label>
                    <p>{occupationInfo.companyAddress || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Info */}
            {financialAndInvestment && (
              <div>
                <h3 className="font-semibold text-lg mb-2">财务及投资信息</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">投资目标</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {formatInvestmentObjectives(financialAndInvestment.investmentObjectives)}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">投资经验</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md space-y-2">
                      {(() => {
                        try {
                          const experience = JSON.parse(financialAndInvestment.investmentExperience || '{}');
                          const experienceMap: Record<string, string> = {
                            'stocks': '股票',
                            'bonds': '债券',
                            'funds': '基金',
                            'derivatives': '衡生品',
                            'forex': '外汇',
                            'commodities': '商品'
                          };
                          const levelMap: Record<string, string> = {
                            'none': '无',
                            'limited': '有限',
                            'moderate': '中等',
                            'extensive': '丰富',
                            'less_than_1': '<1 Years/年',
                            '1_to_3': '1-3 Years/年',
                            '3_to_5': '3-5 Years/年',
                            'more_than_5': '>5 Years/年'
                          };
                          return Object.keys(experience).length > 0
                            ? Object.entries(experience).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{experienceMap[key] || key}:</span>
                                  <span className="font-medium">{levelMap[value as string] || String(value)}</span>
                                </div>
                              ))
                            : <span>-</span>;
                        } catch {
                          return <span>{financialAndInvestment.investmentExperience || '-'}</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">客户自评风险承受能力（基於风险评估问卷）</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {(() => {
                        const riskAssessment = calculateRiskLevel(applicationData?.riskQuestionnaire);
                        return (
                          <div>
                            <div className="font-semibold text-lg">{riskAssessment.riskLevel}</div>
                            <div className="text-sm text-gray-600 mt-1">{riskAssessment.riskDescription}</div>
                            <div className="text-xs text-gray-500 mt-2">总分：{riskAssessment.totalScore}</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* 完整的风险评估问卷详情 */}
                  {applicationData?.riskQuestionnaire && (
                    <div className="mt-4">
                      <Label className="font-medium">风险评估问卷详情 Risk Assessment Questionnaire Details</Label>
                      <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded-md">
                        {/* Q1-Q10 的问题和答案 */}
                        <div className="text-sm">
                          <div className="font-medium">Q1: 现在是否持有以下任何投资产品？</div>
                          <div className="ml-4 mt-1">{(() => {
                            try {
                              const q1 = JSON.parse(applicationData.riskQuestionnaire.q1_current_investments || '[]');
                              const options: Record<string, string> = {
                                'savings': '储蓄存款',
                                'bonds': '债券',
                                'derivatives': '衡生产品'
                              };
                              return q1.length > 0 ? q1.map((item: string) => options[item] || item).join('、') : '未选择';
                            } catch { return '未选择'; }
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q2: 预期投资年期？</div>
                          <div className="ml-4 mt-1">{(() => {
                            const options: Record<string, string> = {
                              'less_than_1': '少于1年',
                              '1_to_3': '1-3年',
                              'more_than_3': '3年以上'
                            };
                            return options[applicationData.riskQuestionnaire.q2_investment_period || ''] || '未选择';
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q3: 可以接受的年度价格波幅？</div>
                          <div className="ml-4 mt-1">{(() => {
                            const options: Record<string, string> = {
                              '10_percent': '10%',
                              '20_percent': '20%',
                              '30_percent': '30%以上'
                            };
                            return options[applicationData.riskQuestionnaire.q3_price_volatility || ''] || '未选择';
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q4: 资产净值中可作投资用途的百分比？</div>
                          <div className="ml-4 mt-1">{(() => {
                            const options: Record<string, string> = {
                              'less_than_10': '少于10%',
                              '10_to_20': '10%-20%',
                              '21_to_30': '21%-30%',
                              '31_to_50': '31%-50%',
                              'more_than_50': '50%以上'
                            };
                            return options[applicationData.riskQuestionnaire.q4_investment_percentage || ''] || '未选择';
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q5: 对金融投资的一般态度？</div>
                          <div className="ml-4 mt-1">{(() => {
                            const options: Record<string, string> = {
                              'no_volatility': '不接受任何波动',
                              'small_volatility': '接受较小波动',
                              'some_volatility': '接受一定波动',
                              'large_volatility': '接受较大波动',
                              'any_volatility': '接受任何波动'
                            };
                            return options[applicationData.riskQuestionnaire.q5_investment_attitude || ''] || '未选择';
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q6: 对衡生工具产品的认识？</div>
                          <div className="ml-4 mt-1">{(() => {
                            try {
                              const q6 = JSON.parse(applicationData.riskQuestionnaire.q6_derivatives_knowledge || '[]');
                              const options: Record<string, string> = {
                                'training': '曾接受相关培训',
                                'experience': '有相关工作经验',
                                'transactions': '有交易经验',
                                'no_knowledge': '没有相关知识'
                              };
                              return q6.length > 0 ? q6.map((item: string) => options[item] || item).join('、') : '未选择';
                            } catch { return '未选择'; }
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q7: 年龄组别？</div>
                          <div className="ml-4 mt-1">{(() => {
                            const options: Record<string, string> = {
                              '18_to_25': '18-25岁',
                              '26_to_35': '26-35岁',
                              '36_to_50': '36-50岁',
                              '51_to_64': '51-64岁',
                              '65_plus': '65岁以上'
                            };
                            return options[applicationData.riskQuestionnaire.q7_age_group || ''] || '未选择';
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q8: 教育程度？</div>
                          <div className="ml-4 mt-1">{(() => {
                            const options: Record<string, string> = {
                              'primary_or_below': '小学或以下',
                              'secondary': '中学',
                              'tertiary_or_above': '大专或以上'
                            };
                            return options[applicationData.riskQuestionnaire.q8_education_level || ''] || '未选择';
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q9: 投资知识来源？</div>
                          <div className="ml-4 mt-1">{(() => {
                            try {
                              const q9 = JSON.parse(applicationData.riskQuestionnaire.q9_investment_knowledge_sources || '[]');
                              const options: Record<string, string> = {
                                'no_interest': '没有兴趣',
                                'discussion': '与他人讨论',
                                'reading': '阅读相关资料',
                                'research': '自行研究'
                              };
                              return q9.length > 0 ? q9.map((item: string) => options[item] || item).join('、') : '未选择';
                            } catch { return '未选择'; }
                          })()}</div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">Q10: 流动资金需求？</div>
                          <div className="ml-4 mt-1">{(() => {
                            const options: Record<string, string> = {
                              'no_need': '没有需求',
                              'up_to_30': '最多30天',
                              '30_to_50': '30-50天',
                              'over_50': '50天以上'
                            };
                            return options[applicationData.riskQuestionnaire.q10_liquidity_needs || ''] || '未选择';
                          })()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Employment Details */}
            {employmentDetails && (
              <div>
                <h3 className="font-semibold text-lg mb-2">财务状况</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>收入来源</Label>
                    <p>{employmentDetails.incomeSource || "-"}</p>
                  </div>
                  <div>
                    <Label>年收入范围</Label>
                    <p>
                      {employmentDetails.annualIncome 
                        ? (typeof employmentDetails.annualIncome === 'number' 
                          ? `${(employmentDetails.annualIncome as number).toLocaleString()} 港币` 
                          : `${employmentDetails.annualIncome}`) 
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <Label>流动资产范围</Label>
                    <p>
                      {employmentDetails.liquidAsset 
                        ? (typeof employmentDetails.liquidAsset === 'number' 
                          ? `${(employmentDetails.liquidAsset as number).toLocaleString()} 港币` 
                          : `${employmentDetails.liquidAsset}`) 
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <Label>净资产范围</Label>
                    <p>
                      {employmentDetails.netWorth 
                        ? (typeof employmentDetails.netWorth === 'number' 
                          ? `${(employmentDetails.netWorth as number).toLocaleString()} 港币` 
                          : `${employmentDetails.netWorth}`) 
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Accounts */}
            {bankAccounts && bankAccounts.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">银行账户信息</h3>
                {bankAccounts.map((account, index) => (
                  <div key={account.id} className="mb-4 p-4 border rounded">
                    <p className="font-medium mb-2">账户 {index + 1}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>银行名称</Label>
                        <p>{account.bankName || "-"}</p>
                      </div>
                      <div>
                        <Label>账户类型</Label>
                        <p>{account.accountType === 'saving' ? '储蓄账户' : account.accountType === 'current' ? '活期账户' : account.accountType === 'checking' ? '支票账户' : account.accountType === 'others' ? '其他' : account.accountType || "-"}</p>
                      </div>
                      <div>
                        <Label>账户币种</Label>
                        <p>{account.accountCurrency || "-"}</p>
                      </div>
                      <div>
                        <Label>开户人姓名</Label>
                        <p>{account.accountHolderName || "-"}</p>
                      </div>
                      <div>
                        <Label>账号</Label>
                        <p>{account.accountNumber || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tax Information */}
            {taxInformation && (
              <div>
                <h3 className="font-semibold text-lg mb-2">税务信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>税务居民地</Label>
                    <p>{taxInformation.taxResidency || "-"}</p>
                  </div>
                  <div>
                    <Label>税务编号</Label>
                    <p>{taxInformation.taxIdNumber || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            {documents && documents.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">上传文件</h3>
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{doc.documentType}</p>
                        <p className="text-sm text-gray-500">{doc.fileName}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        查看
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Face Verification */}
            {applicationData.face && (
              <div>
                <h3 className="font-semibold text-lg mb-2">人臉識別</h3>
                <div className="space-y-4">
                  <div>
                    <Label>驗證狀態</Label>
                    <p className="mt-1">
                      {applicationData.face.verified ? (
                        <span className="text-green-600 font-medium">✓ 已驗證</span>
                      ) : (
                        <span className="text-gray-500">未驗證</span>
                      )}
                    </p>
                  </div>
                  {applicationData.face.verified && applicationData.face.verificationData && (() => {
                    try {
                      const data = JSON.parse(applicationData.face.verificationData);
                      return (
                        <>
                          {data.confidence && (
                            <div>
                              <Label>置信度</Label>
                              <p className="mt-1">{data.confidence.toFixed(2)}%</p>
                            </div>
                          )}
                          {data.verifiedAt && (
                            <div>
                              <Label>驗證時間</Label>
                              <p className="mt-1">{new Date(data.verifiedAt).toLocaleString('zh-CN')}</p>
                            </div>
                          )}
                          {data.faceImageUrl && (
                            <div>
                              <Label>人臉照片</Label>
                              <div className="mt-2">
                                <img 
                                  src={data.faceImageUrl} 
                                  alt="Face Verification" 
                                  className="max-w-xs rounded border"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Regulatory Declarations */}
            {applicationData.regulatory && (
              <div>
                <h3 className="font-semibold text-lg mb-2">监管声明</h3>
                <div className="space-y-4">
                  <div>
                    <Label>PEP声明（政治公众人物）</Label>
                    <p className="mt-1">
                      {applicationData.regulatory.isPEP ? '是' : '否'}
                    </p>
                  </div>
                  <div>
                    <Label>US Person声明（美国税务居民）</Label>
                    <p className="mt-1">
                      {applicationData.regulatory.isUSPerson ? '是' : '否'}
                    </p>
                  </div>
                  <div>
                    <Label>开户协议书同意</Label>
                    <p className="mt-1">
                      {applicationData.regulatory.agreementAccepted ? '已同意' : '未同意'}
                      {applicationData.regulatory.signedAt && (
                        <span className="ml-2 text-gray-500 text-sm">
                          签署时间：{new Date(applicationData.regulatory.signedAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label>签署姓名</Label>
                    <p className="mt-1">{applicationData.regulatory.signatureName || '-'}</p>
                  </div>
                  <div>
                    <Label>电子签名同意</Label>
                    <p className="mt-1">
                      {applicationData.regulatory.electronicSignatureConsent ? '已同意' : '未同意'}
                    </p>
                  </div>
                  <div>
                    <Label>AML合规同意</Label>
                    <p className="mt-1">
                      {applicationData.regulatory.amlComplianceConsent ? '已同意' : '未同意'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Actions or Approval Info */}
        {applicationData?.application?.status === 'approved' || 
         (applicationData?.application?.firstApprovalStatus === 'approved' && applicationData?.application?.secondApprovalStatus === 'approved') ? (
          /* 已批准的申请显示审批信息 */
          <Card>
            <CardHeader>
              <CardTitle>审批信息</CardTitle>
              <CardDescription>该申请已审批通过</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 初审记录 */}
              {applicationData?.application?.firstApprovalStatus === 'approved' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">初审记录</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">初审人员：</span>
                      <span className="font-medium">{applicationData.application.firstApprovalByName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CE No.：</span>
                      <span className="font-medium">{applicationData.application.firstApprovalByCeNo || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">初审时间：</span>
                      <span className="font-medium">
                        {applicationData.application.firstApprovalAt ? new Date(applicationData.application.firstApprovalAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        }) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">初审PI认定：</span>
                      <span className="font-medium">{applicationData.application.firstApprovalIsProfessionalInvestor ? '是' : '否'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">初审风险评级：</span>
                      <span className="font-medium">{getRiskToleranceDescription(applicationData.application.firstApprovalRiskProfile || '')}</span>
                    </div>
                    {applicationData.application.firstApprovalComments && (
                      <div className="pt-2 mt-2 border-t border-blue-200">
                        <p className="text-blue-700">
                          <strong>初审意见：</strong>{applicationData.application.firstApprovalComments}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 终审记录 */}
              {applicationData?.application?.secondApprovalStatus === 'approved' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">终审记录</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">终审人员：</span>
                      <span className="font-medium">{applicationData.application.secondApprovalByName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CE No.：</span>
                      <span className="font-medium">{applicationData.application.secondApprovalByCeNo || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">终审时间：</span>
                      <span className="font-medium">
                        {applicationData.application.secondApprovalAt ? new Date(applicationData.application.secondApprovalAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        }) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">终审PI认定：</span>
                      <span className="font-medium">{applicationData.application.isProfessionalInvestor ? '是' : '否'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">终审风险评级：</span>
                      <span className="font-medium">{getRiskToleranceDescription(applicationData.application.approvedRiskProfile || '')}</span>
                    </div>
                    {applicationData.application.secondApprovalComments && (
                      <div className="pt-2 mt-2 border-t border-green-200">
                        <p className="text-green-700">
                          <strong>终审意见：</strong>{applicationData.application.secondApprovalComments}
                        </p>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-green-200">
                      <p className="text-green-700">
                        <strong>审批结果：</strong>已发送通知邮件到 operation@cmfinancial.com
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : applicationData?.application?.firstApprovalStatus === 'approved' && applicationData?.application?.secondApprovalStatus === 'pending' ? (
          /* 待終審的申请顯示終審操作 */
          <Card>
            <CardHeader>
              <CardTitle>終審操作</CardTitle>
              <CardDescription>初審已通過，請進行終審</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 顯示初審信息 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">初審已通過</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">初審人員：</span>
                    <span className="font-medium">{applicationData.application.firstApprovalByName} (CE: {applicationData.application.firstApprovalByCeNo})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">初審時間：</span>
                    <span className="font-medium">
                      {applicationData.application.firstApprovalAt ? new Date(applicationData.application.firstApprovalAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">初審PI認定：</span>
                    <span className="font-medium">{applicationData.application.firstApprovalIsProfessionalInvestor ? '是' : '否'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">初審風險評級：</span>
                    <span className="font-medium">{applicationData.application.firstApprovalRiskProfile || 'N/A'}</span>
                  </div>
                  {applicationData.application.firstApprovalComments && (
                    <div className="pt-2 mt-2 border-t border-blue-200">
                      <p className="text-blue-700">
                        <strong>初審意見：</strong>{applicationData.application.firstApprovalComments}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Investor */}
              <div className="space-y-2">
                <Label>是否定義為專業投資者（PI）</Label>
                <RadioGroup value={isProfessionalInvestor} onValueChange={setIsProfessionalInvestor}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pi-yes" />
                    <Label htmlFor="pi-yes">是</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pi-no" />
                    <Label htmlFor="pi-no">否</Label>
                  </div>
                </RadioGroup>
                
                {/* PI認定差異提示 */}
                {applicationData.application.isProfessionalInvestor !== undefined && 
                 isProfessionalInvestor && 
                 ((applicationData.application.isProfessionalInvestor && isProfessionalInvestor === 'no') || 
                  (!applicationData.application.isProfessionalInvestor && isProfessionalInvestor === 'yes')) && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">PI認定與初審不一致</p>
                        <div className="mt-1 text-sm text-amber-700 space-y-1">
                          <p>初審人員認定：<span className="font-semibold">{applicationData.application.isProfessionalInvestor ? '是' : '否'}</span></p>
                          <p>當前選擇：<span className="font-semibold">{isProfessionalInvestor === 'yes' ? '是' : '否'}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Profile */}
              <div className="space-y-2">
                <Label>風險等級評估</Label>
                <Select value={approvedRiskProfile} onValueChange={setApprovedRiskProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇風險等級" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lowest">Lowest / 最低风险（分数范围：0-200）</SelectItem>
                    <SelectItem value="Low">Low / 低风险（分数范围：201-400）</SelectItem>
                    <SelectItem value="Low to Medium">Low to Medium / 低至中等风险（分数范围：401-500）</SelectItem>
                    <SelectItem value="Medium">Medium / 中等风险（分数范围：501-600）</SelectItem>
                    <SelectItem value="Medium to High">Medium to High / 中等至高风险（分数范围：601-700）</SelectItem>
                    <SelectItem value="High">High / 高风险（分数范围：701+）</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* 初審風險評級差異提示 */}
                {applicationData.application.approvedRiskProfile && approvedRiskProfile && applicationData.application.approvedRiskProfile !== approvedRiskProfile && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">風險評級與初審不一致</p>
                        <div className="mt-1 text-sm text-amber-700 space-y-1">
                          <p>初審人員評定：<span className="font-semibold">{getRiskToleranceDescription(applicationData.application.approvedRiskProfile)}</span></p>
                          <p>當前選擇：<span className="font-semibold">{getRiskToleranceDescription(approvedRiskProfile)}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={firstApproveMutation.isPending || secondApproveMutation.isPending || !isProfessionalInvestor || !approvedRiskProfile}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {(firstApproveMutation.isPending || secondApproveMutation.isPending) ? "處理中..." : 
                    (applicationData?.application?.firstApprovalStatus === 'approved' ? "終審批准" : "初審批准")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejectMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  拒絕
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReturnDialog(true)}
                  disabled={returnMutation.isPending}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  退回補充材料
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* 待初審的申请顯示初審操作 */
          <Card>
            <CardHeader>
              <CardTitle>审批操作</CardTitle>
              <CardDescription>请完成以下审批选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            {/* Professional Investor */}
            <div className="space-y-2">
              <Label>是否定义为专业投资者（PI）</Label>
              <RadioGroup value={isProfessionalInvestor} onValueChange={setIsProfessionalInvestor}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="pi-yes" />
                  <Label htmlFor="pi-yes">是</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="pi-no" />
                  <Label htmlFor="pi-no">否</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Risk Profile */}
            <div className="space-y-2">
              <Label>风险等级评估</Label>
              <Select value={approvedRiskProfile} onValueChange={setApprovedRiskProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择风险等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lowest">Lowest / 最低风险（分数范围：0-200）</SelectItem>
                  <SelectItem value="Low">Low / 低风险（分数范围：201-400）</SelectItem>
                  <SelectItem value="Low to Medium">Low to Medium / 低至中等风险（分数范围：401-500）</SelectItem>
                  <SelectItem value="Medium">Medium / 中等风险（分数范围：501-600）</SelectItem>
                  <SelectItem value="Medium to High">Medium to High / 中等至高风险（分数范围：601-700）</SelectItem>
                  <SelectItem value="High">High / 高风险（分数范围：701+）</SelectItem>
                </SelectContent>
              </Select>
              
              {/* 初審風險評級差異提示 */}
              {application?.firstApprovalStatus === 'approved' && application?.approvedRiskProfile && approvedRiskProfile && application.approvedRiskProfile !== approvedRiskProfile && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">風險評級與初審不一致</p>
                      <div className="mt-1 text-sm text-amber-700 space-y-1">
                        <p>初審人員評定：<span className="font-semibold">{getRiskToleranceDescription(application?.approvedRiskProfile || '')}</span></p>
                        <p>當前選擇：<span className="font-semibold">{getRiskToleranceDescription(approvedRiskProfile)}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 审批意见 */}
            <div className="space-y-2">
              <Label>审批意见（可选）</Label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="请输入审批意见..."
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleApprove}
                disabled={firstApproveMutation.isPending || secondApproveMutation.isPending || !isProfessionalInvestor || !approvedRiskProfile}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {(firstApproveMutation.isPending || secondApproveMutation.isPending) ? "处理中..." : 
                  (applicationData?.application?.firstApprovalStatus === 'approved' ? "終審批准" : "初審批准")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={rejectMutation.isPending}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                拒绝
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReturnDialog(true)}
                disabled={returnMutation.isPending}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                退回补充材料
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
            <DialogDescription>请输入拒绝理由</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入拒绝理由..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? "处理中..." : "确认拒绝"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>退回补充材料</DialogTitle>
            <DialogDescription>请输入退回理由</DialogDescription>
          </DialogHeader>
          <Textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="请输入需要补充的材料或修改的内容..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReturnDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleReturn}
              disabled={returnMutation.isPending || !returnReason.trim()}
            >
              {returnMutation.isPending ? "处理中..." : "确认退回"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Risk Warning Dialog */}
      <Dialog open={showRiskWarningDialog} onOpenChange={setShowRiskWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>风险评级不一致提示</DialogTitle>
            <DialogDescription>
              审批人员评定的风险等级与客户自评不一致
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 mt-0.5">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">风险评级差异</p>
                  <div className="mt-2 text-sm text-yellow-700 space-y-1">
                    <p>客户自评风险等级（基於风险评估问卷）：
                      <span className="font-semibold">
                        {calculateRiskLevel(applicationData?.riskQuestionnaire).riskLevel}
                      </span>
                    </p>
                    <p>审批人员评定风险等级：
                      <span className="font-semibold">
                        {getRiskToleranceDescription(approvedRiskProfile)}
                      </span>
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-yellow-700">
                    请确认您的评定是否正确。最终将以审批人员的评定为准。
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRiskWarningDialog(false)}>
              返回修改
            </Button>
            <Button onClick={confirmApprove} disabled={firstApproveMutation.isPending || secondApproveMutation.isPending}>
              {(firstApproveMutation.isPending || secondApproveMutation.isPending) ? "处理中..." : "确认批准"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
