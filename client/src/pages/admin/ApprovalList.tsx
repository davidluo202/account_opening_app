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
import { Loader2 } from 'lucide-react';

export default function ApprovalList() {
  const [, setLocation] = useLocation();
  const { data: applications, isLoading } = trpc.approval.getPendingApplications.useQuery();

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
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>待審批申請列表</CardTitle>
          <CardDescription>查看和審批客戶開戶申請</CardDescription>
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
          ) : (
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
                {applications.map((app) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
