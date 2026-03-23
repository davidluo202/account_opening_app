import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TopHeader } from "@/components/TopHeader";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error("无效的重置链接");
      setTimeout(() => setLocation("/login"), 2000);
    }
  }, [setLocation]);

  const resetPasswordMutation = trpc.approver.resetPassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "密码重置成功");
      setResetSuccess(true);
      setTimeout(() => setLocation("/login"), 3000);
    },
    onError: (error) => {
      toast.error(error.message || "重置失败，请重试");
    },
  });

  const handleSubmit = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("密码长度至少为6位");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    resetPasswordMutation.mutate({ token, newPassword });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">重置密码</CardTitle>
            <CardDescription>请输入您的新密码</CardDescription>
          </CardHeader>
          <CardContent>
            {!resetSuccess ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="请输入新密码（至少6位）"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="请再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newPassword && confirmPassword) handleSubmit();
                    }}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {resetPasswordMutation.isPending ? "重置中..." : "重置密码"}
                </Button>
                <div className="text-sm text-center text-slate-500">
                  <a href="/login" className="text-blue-600 hover:underline">返回登录</a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-2">密码重置成功！</p>
                  <p className="text-sm text-green-700">
                    您的密码已成功重置。页面将在3秒后自动跳转到登录页面。
                  </p>
                </div>
                <Button onClick={() => setLocation("/login")} className="w-full">
                  立即前往登录
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
