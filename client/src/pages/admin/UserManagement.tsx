import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, ShieldOff, Info, Search, KeyRound } from "lucide-react";

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showApproverInfoDialog, setShowApproverInfoDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [approverFilter, setApproverFilter] = useState<"all" | "yes" | "no">("all");

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.user.list.useQuery();
  const { data: approverInfo } = trpc.user.getApproverInfo.useQuery(
    { userId: selectedUser! },
    { enabled: !!selectedUser && showApproverInfoDialog }
  );

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success("用户角色更新成功");
      setShowRoleDialog(false);
      utils.user.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "更新用户角色失败");
    },
  });

  const resetPasswordMutation = trpc.approver.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "密码重置邮件已发送");
    },
    onError: (error) => {
      toast.error(error.message || "发送失败");
    },
  });



  const handleUpdateRole = (userId: number, newRole: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };



  const handleShowApproverInfo = (userId: number) => {
    setSelectedUser(userId);
    setShowApproverInfoDialog(true);
  };

  const selectedUserData = users?.find((u) => u.id === selectedUser);

  // 筛选和搜索逻辑
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user) => {
      // 搜索过滤
      const matchesSearch = searchTerm === "" || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 角色过滤
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      // 审批人员过滤（暂时无法判断，需要额外查询）
      // 这里简化处理，只做搜索和角色过滤
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-16">
          <a href="/" className="flex items-center cursor-pointer">
            <img src="/logo-zh.png" alt="誠港金融" className="h-10" />
          </a>
          <div className="flex items-center gap-4">
            <a href="/admin/approvals" className="text-gray-600 hover:text-gray-900">
              审批列表
            </a>
            <a href="/admin/approvers" className="text-gray-600 hover:text-gray-900">
              权限管理
            </a>
            <span className="text-blue-600 font-medium">用户管理</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>用户管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 搜索和筛选 */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索邮箱或姓名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="角色筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>审批人员状态</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.name || "-"}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "管理员" : "普通用户"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowApproverInfo(user.id)}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user.id);
                              setShowRoleDialog(true);
                            }}
                          >
                            {user.role === "admin" ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-1" />
                                降级
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-1" />
                                提升
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (user.email) {
                                resetPasswordMutation.mutate({ email: user.email });
                              } else {
                                toast.error("该用户没有邮箱地址");
                              }
                            }}
                            disabled={!user.email || resetPasswordMutation.isPending}
                          >
                            <KeyRound className="h-4 w-4 mr-1" />
                            重置密码
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">暂无用户数据</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Update Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新用户角色</DialogTitle>
            <DialogDescription>
              您确定要将用户 <strong>{selectedUserData?.name || selectedUserData?.email}</strong> 的角色更改为{" "}
              <strong>{selectedUserData?.role === "admin" ? "普通用户" : "管理员"}</strong> 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUpdateRole(
                    selectedUser,
                    selectedUserData?.role === "admin" ? "user" : "admin"
                  );
                }
              }}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Approver Info Dialog */}
      <Dialog open={showApproverInfoDialog} onOpenChange={setShowApproverInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审批人员信息</DialogTitle>
          </DialogHeader>
          {approverInfo ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">姓名</p>
                    <p className="font-medium">{approverInfo.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CE号码</p>
                    <p className="font-medium">{approverInfo.ceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">状态</p>
                    <Badge variant={approverInfo.isActive ? "default" : "secondary"}>
                      {approverInfo.isActive ? "激活" : "停用"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">创建时间</p>
                    <p className="text-sm">
                      {new Date(approverInfo.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              该用户不是审批人员
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowApproverInfoDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
