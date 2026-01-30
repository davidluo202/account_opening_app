import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
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
    // 自动补全邮箱域名
    let fullEmail = email;
    if (!email.includes('@')) {
      fullEmail = email + '@cmfinancial.com';
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
      {/* Logo Header */}
      <div className="absolute top-8 left-8">
        <a href="/" className="flex items-center cursor-pointer">
          <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
        </a>
      </div>

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
              返回登录
            </Button>
            <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
            <CardDescription>
              输入您的邮箱地址，我们将发送密码重置链接到您的邮箱
            </CardDescription>
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
                      if (e.key === 'Enter' && email) {
                        handleSubmit();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    例如：输入 "xluo" 即可，系统会自动补全为 xluo@cmfinancial.com
                  </p>
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
                    请检查您的收件箱并点击邮件中的链接来重置密码。
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    重置链接将在1小时后过期。
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    className="w-full"
                  >
                    重新发送
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/admin")}
                    className="w-full"
                  >
                    返回登录
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
