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
  const [reason, setReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  const { data: applicationData, isLoading } = trpc.approval.getApplicationDetail.useQuery(
    { applicationId: Number(id) },
    { enabled: !!id }
  );

  const approveMutation = trpc.approval.approveApplication.useMutation({
    onSuccess: () => {
      toast.success("申请已批准");
      setLocation("/admin/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message || "批准失败");
    },
  });

  const rejectMutation = trpc.approval.rejectApplication.useMutation({
    onSuccess: () => {
      toast.success("申请已拒绝");
      setShowRejectDialog(false);
      setLocation("/admin/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message || "拒绝失败");
    },
  });

  const returnMutation = trpc.approval.returnApplication.useMutation({
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
    approveMutation.mutate({
      applicationId: Number(id),
      isProfessionalInvestor: isProfessionalInvestor === "yes",
      approvedRiskProfile,
    });
  };

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error("请输入拒绝理由");
      return;
    }
    rejectMutation.mutate({
      applicationId: Number(id),
      reason,
    });
  };

  const handleReturn = () => {
    if (!reason.trim()) {
      toast.error("请输入退回理由");
      return;
    }
    returnMutation.mutate({
      applicationId: Number(id),
      reason,
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
  const personalBasicInfo = applicationData.personalBasicInfo;
  const personalDetailedInfo = applicationData.personalDetailedInfo;
  const occupationInfo = applicationData.occupation;
  const employmentDetails = applicationData.employment;
  const financialAndInvestment = applicationData.financial;
  const bankAccounts = applicationData.bankAccounts;
  const documents = applicationData.documents;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/admin" className="flex items-center cursor-pointer">
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
                  <Label>身份证号</Label>
                  <p>{personalBasicInfo?.idNumber || "-"}</p>
                </div>
                <div>
                  <Label>出生日期</Label>
                  <p>{personalBasicInfo?.dateOfBirth ? new Date(personalBasicInfo.dateOfBirth).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </div>

            {/* Personal Detailed Info */}
            {personalDetailedInfo && (
              <div>
                <h3 className="font-semibold text-lg mb-2">个人详细信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>电话</Label>
                    <p>{personalDetailedInfo.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <Label>邮箱</Label>
                    <p>{personalDetailedInfo.email || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>地址</Label>
                    <p>{personalDetailedInfo.address || "-"}</p>
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
                    <Label>职业</Label>
                    <p>{occupationInfo.occupation || "-"}</p>
                  </div>
                  <div>
                    <Label>行业</Label>
                    <p>{occupationInfo.industry || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Info */}
            {financialAndInvestment && (
              <div>
                <h3 className="font-semibold text-lg mb-2">财务及投资信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>投资目标</Label>
                    <p>{financialAndInvestment.investmentObjectives || "-"}</p>
                  </div>
                  <div>
                    <Label>投资经验</Label>
                    <p>{financialAndInvestment.investmentExperience || "-"}</p>
                  </div>
                  <div>
                    <Label>风险承受能力</Label>
                    <p>{financialAndInvestment.riskTolerance || "-"}</p>
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
                        <p>{account.accountType || "-"}</p>
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
          </CardContent>
        </Card>

        {/* Approval Section */}
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
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
            <DialogDescription>请输入拒绝理由</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
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
              disabled={rejectMutation.isPending || !reason.trim()}
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
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入需要补充的材料或修改的内容..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReturnDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleReturn}
              disabled={returnMutation.isPending || !reason.trim()}
            >
              {returnMutation.isPending ? "处理中..." : "确认退回"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
