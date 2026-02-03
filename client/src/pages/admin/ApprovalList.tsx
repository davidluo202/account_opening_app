import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

export default function ApprovalList() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: applications, isLoading } = trpc.approval.getPendingApplications.useQuery();

  const handleLogout = async () => {
    await logout();
    toast.success('已登出');
    setLocation('/admin');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '草稿', variant: 'secondary' as const },
      submitted: { label: '待審批', variant: 'default' as const },
      approved: { label: '已批准', variant: 'default' as const },
      rejected: { label: '已拒絕', variant: 'destructive' as const },
      returned: { label: '退回補充', variant: 'outline' as const },
    };
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center cursor-pointer">
            <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
          </a>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/approvers')}
              className="flex items-center gap-2"
            >
              权限管理
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/users')}
              className="flex items-center gap-2"
            >
              用户管理
            </Button>
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
        </div>
      </header>

      <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>待審批/已審批申請列表</CardTitle>
              <CardDescription>查看和審批客戶開戶申請</CardDescription>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="篩選狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部申請</SelectItem>
                  <SelectItem value="pending_first">待初審</SelectItem>
                  <SelectItem value="pending_second">待終審</SelectItem>
                  <SelectItem value="approved">已審批</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暫無待審批申請
            </div>
          ) : (() => {
            // 根據篩選條件過濾申請
            const filteredApplications = applications.filter(app => {
              if (statusFilter === 'all') return true;
              if (statusFilter === 'pending_first') {
                return app.firstApprovalStatus === 'pending' && app.status === 'submitted';
              }
              if (statusFilter === 'pending_second') {
                return app.firstApprovalStatus === 'approved' && app.secondApprovalStatus === 'pending' && app.status === 'under_review';
              }
              if (statusFilter === 'approved') {
                return app.status === 'approved' && app.secondApprovalStatus === 'approved';
              }
              return true;
            });

            if (filteredApplications.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  暫無符合條件的申請
                </div>
              );
            }

            return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申請編號</TableHead>
                  <TableHead>客戶姓名</TableHead>
                  <TableHead>提交時間</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.applicationNumber}</TableCell>
                    <TableCell>{app.customerName || '-'}</TableCell>
                    <TableCell>{formatDateTime(app.submittedAt)}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin/approvals/${app.id}`)}
                      >
                        查看詳情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            );
          })()}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
