import { useState } from "react";
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

  const { data: applicationData, isLoading } = trpc.approval.getApplicationDetail.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  
  // 获取审批历史记录
  const { data: approvalHistory } = trpc.approval.getHistory.useQuery(
    { applicationId: Number(id) },
    { enabled: !!id }
  );

  const approveMutation = trpc.approval.firstApprove.useMutation({
    onSuccess: () => {
      toast.success("申请已批准");
      setLocation("/admin/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message || "批准失败");
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
    const customerRisk = applicationData?.financial?.riskTolerance;
    if (customerRisk && customerRisk !== approvedRiskProfile) {
      setShowRiskWarningDialog(true);
    } else {
      confirmApprove();
    }
  };
  
  const confirmApprove = () => {
    setShowRiskWarningDialog(false);
    approveMutation.mutate({
      applicationId: Number(id),
      isProfessionalInvestor: isProfessionalInvestor === "yes",
      approvedRiskProfile: approvedRiskProfile as 'low' | 'medium' | 'high',
    });
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
  const taxInformation = applicationData.tax;
  const documents = applicationData.documents;

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
                    <p>{personalDetailedInfo.idType || "-"}</p>
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
                  <div className="col-span-2">
                    <Label>居住地址</Label>
                    <p>{personalDetailedInfo.residentialAddress || "-"}</p>
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
                      {(() => {
                        try {
                          const objectives = JSON.parse(financialAndInvestment.investmentObjectives || '[]');
                          const objectiveMap: Record<string, string> = {
                            'capital_preservation': '资本保值',
                            'income': '收益',
                            'growth': '增值',
                            'speculation': '投机'
                          };
                          return objectives.length > 0 
                            ? objectives.map((obj: string) => objectiveMap[obj] || obj).join('、')
                            : '-';
                        } catch {
                          return financialAndInvestment.investmentObjectives || '-';
                        }
                      })()}
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
                    <Label className="font-medium">客户自评风险承受能力</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {(() => {
                        const riskMap: Record<string, string> = {
                          'low': '低风险',
                          'medium': '中等风险',
                          'high': '高风险'
                        };
                        return riskMap[financialAndInvestment.riskTolerance || ''] || financialAndInvestment.riskTolerance || '-';
                      })()}
                    </div>
                  </div>
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
                  {documents.map((doc) => (
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
        {applicationData?.application?.status === 'approved' ? (
          /* 已批准的申请显示审批信息 */
          <Card>
            <CardHeader>
              <CardTitle>审批信息</CardTitle>
              <CardDescription>该申请已审批通过</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvalHistory && approvalHistory.length > 0 && (() => {
                const latestApproval = approvalHistory[0];
                return (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">审批已通过</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">审批人员ID：</span>
                          <span className="font-medium">{latestApproval.approverEmail ? latestApproval.approverEmail.split('@')[0] : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">专业投资者（PI）：</span>
                          <span className="font-medium">{applicationData.application.isProfessionalInvestor ? '是' : '否'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">风险评级：</span>
                          <span className="font-medium">
                            {(() => {
                              const riskMap: Record<string, string> = {
                                'low': '低风险',
                                'medium': '中等风险',
                                'high': '高风险'
                              };
                              return riskMap[applicationData.application.approvedRiskProfile || ''] || '-';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">审批时间：</span>
                          <span className="font-medium">
                            {new Date(latestApproval.createdAt).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-green-200">
                          <p className="text-green-700">
                            <strong>审批结果：</strong>已发送通知邮件到 operation@cmfinancial.com
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        ) : (
          /* 待审批的申请显示审批操作 */
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
              <Label>风险偏好评估</Label>
              <Select value={approvedRiskProfile} onValueChange={setApprovedRiskProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择风险偏好" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending || !isProfessionalInvestor || !approvedRiskProfile}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {approveMutation.isPending ? "处理中..." : "批准"}
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
                    <p>客户自评风险等级：
                      <span className="font-semibold">
                        {(() => {
                          const riskMap: Record<string, string> = {
                            'low': '低风险',
                            'medium': '中等风险',
                            'high': '高风险'
                          };
                          return riskMap[applicationData?.financial?.riskTolerance || ''] || '-';
                        })()}
                      </span>
                    </p>
                    <p>审批人员评定风险等级：
                      <span className="font-semibold">
                        {(() => {
                          const riskMap: Record<string, string> = {
                            'low': '低风险',
                            'medium': '中等风险',
                            'high': '高风险'
                          };
                          return riskMap[approvedRiskProfile] || '-';
                        })()}
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
            <Button onClick={confirmApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? "处理中..." : "确认批准"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
