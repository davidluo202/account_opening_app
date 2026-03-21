import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AdminForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const requestResetMutation = trpc.approver.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "密码重置邮件已发送");
      setEmailSent(true);
    },
    onError: (error) => {
      toast.error(error.message || "发送失败，请稍后重试");
    },
  });

  const handleSubmit = () => {
    let fullEmail = email;
    if (!email.includes("@")) {
      fullEmail = email + "@cmfinancial.com";
      setEmail(fullEmail);
    }

    if (!fullEmail || !fullEmail.endsWith("@cmfinancial.com")) {
      toast.error("请输入有效的@cmfinancial.com邮箱地址");
      return;
    }

    requestResetMutation.mutate({ email: fullEmail });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="w-fit mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回审批登录
            </Button>
            <CardTitle className="text-2xl font-bold">审批人员忘记密码</CardTitle>
            <CardDescription>输入审批人员邮箱，我们将发送密码重置链接到邮箱</CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="输入邮箱前缀（系统自动补全@cmfinancial.com）"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && email) {
                        handleSubmit();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={requestResetMutation.isPending || !email}
                  className="w-full"
                  size="lg"
                >
                  {requestResetMutation.isPending ? "发送中..." : "发送重置邮件"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-2">邮件已发送！</p>
                  <p className="text-sm text-green-700">
                    我们已向 <strong>{email}</strong> 发送了密码重置邮件。
                  </p>
                </div>

                <Button variant="ghost" onClick={() => setLocation("/admin")} className="w-full">
                  返回审批登录
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
