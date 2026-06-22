import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Plus, FileText, Loader2, LogOut, LayoutDashboard } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { TopHeader } from "@/components/TopHeader";
import { useLang } from '@/lib/i18n';

const statusLabels: Record<string, { zh: string; en: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { zh: "草稿", en: "Draft", variant: "secondary" },
  submitted: { zh: "已提交", en: "Submitted", variant: "default" },
  under_review: { zh: "審核中", en: "Under Review", variant: "outline" },
  approved: { zh: "已批准", en: "Approved", variant: "default" },
  rejected: { zh: "已拒絕", en: "Rejected", variant: "destructive" },
};

const accountTypeLabels: Record<string, { zh: string; en: string }> = {
  individual: { zh: "個人", en: "Individual" },
  joint: { zh: "聯名", en: "Joint" },
  corporate: { zh: "機構", en: "Corporate" },
};

const accountSubTypeLabels: Record<string, { zh: string; en: string }> = {
  cash: { zh: "現金", en: "Cash" },
  margin: { zh: "保證金", en: "Margin" },
  derivatives: { zh: "衍生品", en: "Derivatives" },
};

export default function Applications() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "submittedAt">("createdAt");
  const { t } = useLang();
  const { data: applications, isLoading } = trpc.application.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createMutation = trpc.application.create.useMutation({
    onSuccess: (data) => {
      setLocation(`/application/${data.applicationId}/step/1`);
    },
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleCreateApplication = () => {
    createMutation.mutate();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <TopHeader>
        <span className="text-sm text-muted-foreground">{t('歡迎', 'Welcome', '欢迎')}, {user?.name || user?.email}</span>
        <Button
          variant="default"
          size="sm"
          onClick={() => setLocation("/portal")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          {t('進入客戶端', 'Enter Portal', '进入客户端')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          {t('登出', 'Logout', '登出')}
        </Button>
      </TopHeader>

      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('我的開戶申請', 'My Applications', '我的开户申请')}</h1>
            <p className="text-muted-foreground">{t('管理您的開戶申請記錄', 'Manage your account opening applications', '管理您的开户申请记录')}</p>
          </div>
          <Button onClick={handleCreateApplication} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {t('新開戶申請', 'New Application', '新开户申请')}
          </Button>
        </div>

        {/* 筛选和排序控件 */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">{t('申請狀態', 'Status', '申请状态')}</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('全部', 'All', '全部')}</SelectItem>
                <SelectItem value="draft">{t('草稿', 'Draft', '草稿')}</SelectItem>
                <SelectItem value="submitted">{t('已提交', 'Submitted', '已提交')}</SelectItem>
                <SelectItem value="approved">{t('已審批', 'Approved', '已审批')}</SelectItem>
                <SelectItem value="rejected">{t('拒絕申請', 'Rejected', '拒绝申请')}</SelectItem>
                <SelectItem value="returned">{t('退回修改', 'Returned', '退回修改')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">{t('排序方式', 'Sort By', '排序方式')}</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "createdAt" | "submittedAt")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{t('創建時間', 'Created Time', '创建时间')}</SelectItem>
                <SelectItem value="submittedAt">{t('提交時間', 'Submitted Time', '提交时间')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 hidden">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('我的開戶申請', 'My Applications', '我的开户申请')}</h1>
            <p className="text-muted-foreground">{t('管理您的開戶申請記錄', 'Manage your account opening applications', '管理您的开户申请记录')}</p>
          </div>
          <Button onClick={handleCreateApplication} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {t('新開戶申請', 'New Application', '新开户申请')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="grid gap-4">
            {applications
              .filter(app => statusFilter === "all" || app.status === statusFilter)
              .sort((a, b) => {
                const dateA = sortBy === "createdAt" ? new Date(a.createdAt) : (a.submittedAt ? new Date(a.submittedAt) : new Date(0));
                const dateB = sortBy === "createdAt" ? new Date(b.createdAt) : (b.submittedAt ? new Date(b.submittedAt) : new Date(0));
                return dateB.getTime() - dateA.getTime();
              })
              .map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {app.applicationNumber || `${t('申請', 'Application', '申请')} #${app.id}`}
                        <Badge variant={statusLabels[app.status]?.variant || "secondary"}>
                          {statusLabels[app.status]?.zh || app.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {t('創建於', 'Created at', '创建于')} {new Date(app.createdAt).toLocaleString("zh-CN", {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (app.status === "draft") {
                          setLocation(`/application/${app.id}/step/${app.currentStep}`);
                        } else {
                          setLocation(`/application/${app.id}/preview`);
                        }
                      }}
                    >
                      {app.status === "draft" ? t('繼續填寫', 'Continue', '继续填写') : t('查看詳情', 'View Details', '查看详情')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{t('當前步驟', 'Current Step', '当前步骤')}: {app.currentStep}/12</span>
                    {app.submittedAt && (
                      <span>{t('提交於', 'Submitted at', '提交于')} {new Date(app.submittedAt).toLocaleString("zh-CN", {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('暫無開戶申請', 'No Applications Yet', '暂无开户申请')}</h3>
              <p className="text-muted-foreground mb-6">{t('點擊上方按鈕開始您的第一個開戶申請', 'Click the button above to start your first application', '点击上方按钮开始您的第一个开户申请')}</p>
              <Button onClick={handleCreateApplication} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('新開戶申請', 'New Application', '新开户申请')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
