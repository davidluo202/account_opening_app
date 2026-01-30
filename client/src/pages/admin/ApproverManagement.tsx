import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ApproverManagement() {
  const utils = trpc.useUtils();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    userId: "",
    employeeName: "",
    ceNumber: "",
    role: "approver" as "approver" | "manager",
  });

  // 获取审批人员列表
  const { data: approvers, isLoading } = trpc.approver.list.useQuery();

  // 添加审批人员
  const addMutation = trpc.approver.add.useMutation({
    onSuccess: () => {
      toast.success("审批人员已成功添加");
      setIsAddDialogOpen(false);
      resetForm();
      utils.approver.list.invalidate();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 更新审批人员
  const updateMutation = trpc.approver.update.useMutation({
    onSuccess: () => {
      toast.success("审批人员信息已更新");
      setIsEditDialogOpen(false);
      setSelectedApprover(null);
      utils.approver.list.invalidate();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除审批人员
  const deleteMutation = trpc.approver.delete.useMutation({
    onSuccess: () => {
      toast.success("审批人员已删除");
      utils.approver.list.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      userId: "",
      employeeName: "",
      ceNumber: "",
      role: "approver",
    });
  };

  const handleAdd = () => {
    if (!formData.userId || !formData.employeeName || !formData.ceNumber) {
      toast.error("请填写所有必填字段");
      return;
    }

    addMutation.mutate({
      userId: parseInt(formData.userId),
      employeeName: formData.employeeName,
      ceNumber: formData.ceNumber,
      role: formData.role,
    });
  };

  const handleEdit = (approver: any) => {
    setSelectedApprover(approver);
    setFormData({
      userId: approver.userId.toString(),
      employeeName: approver.employeeName,
      ceNumber: approver.ceNumber,
      role: approver.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedApprover) return;

    updateMutation.mutate({
      id: selectedApprover.id,
      employeeName: formData.employeeName,
      ceNumber: formData.ceNumber,
      role: formData.role,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除此审批人员吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleActive = (approver: any) => {
    updateMutation.mutate({
      id: approver.id,
      isActive: !approver.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center cursor-pointer">
            <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
          </a>
          <div className="flex items-center gap-4">
            <a href="/admin/approvals" className="text-gray-600 hover:text-gray-900">
              审批列表
            </a>
            <span className="text-blue-600 font-medium">权限管理</span>
            <a href="/admin/users" className="text-gray-600 hover:text-gray-900">
              用户管理
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">审批人员管理</h1>
          <p className="text-muted-foreground mt-2">管理系统审批人员和权限</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加审批人员
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>员工姓名</TableHead>
              <TableHead>CE No.</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>关联用户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvers && approvers.length > 0 ? (
              approvers.map((approver) => (
                <TableRow key={approver.id}>
                  <TableCell className="font-medium">{approver.employeeName}</TableCell>
                  <TableCell>{approver.ceNumber}</TableCell>
                  <TableCell>
                    <Badge variant={approver.role === "manager" ? "default" : "secondary"}>
                      {approver.role === "manager" ? "经理" : "审批员"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {approver.user ? approver.user.name || approver.user.email : "未关联"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(approver)}
                    >
                      <Badge variant={approver.isActive ? "default" : "destructive"}>
                        {approver.isActive ? "激活" : "停用"}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell>
                    {new Date(approver.createdAt).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(approver)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(approver.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  暂无审批人员
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      {/* 添加审批人员对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加审批人员</DialogTitle>
            <DialogDescription>
              填写审批人员的基本信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">用户ID *</Label>
              <Input
                id="userId"
                type="number"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="输入用户ID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employeeName">员工姓名 *</Label>
              <Input
                id="employeeName"
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                placeholder="输入员工姓名"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ceNumber">CE No. *</Label>
              <Input
                id="ceNumber"
                value={formData.ceNumber}
                onChange={(e) => setFormData({ ...formData, ceNumber: e.target.value })}
                placeholder="输入CE编号"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">角色</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "approver" | "manager") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approver">审批员</SelectItem>
                  <SelectItem value="manager">经理</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑审批人员对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑审批人员</DialogTitle>
            <DialogDescription>
              修改审批人员的信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-employeeName">员工姓名</Label>
              <Input
                id="edit-employeeName"
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-ceNumber">CE No.</Label>
              <Input
                id="edit-ceNumber"
                value={formData.ceNumber}
                onChange={(e) => setFormData({ ...formData, ceNumber: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">角色</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "approver" | "manager") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approver">审批员</SelectItem>
                  <SelectItem value="manager">经理</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
