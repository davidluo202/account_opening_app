import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TopHeader } from "@/components/TopHeader";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const requestReset = trpc.approver.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSent(true);
    },
    onError: (err) => {
      toast.error(err.message || "发送失败，请稍后重试");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    requestReset.mutate({ email });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        {sent ? (
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold">邮件已发送</CardTitle>
              <CardDescription>
                如果该邮箱已注册，您将收到密码重置邮件。请检查您的收件箱（含垃圾邮件）。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setLocation("/login")}>
                返回登录
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
              <CardDescription>
                输入您的注册邮箱，我们将发送密码重置链接。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">注册邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={requestReset.isPending}>
                  <Mail className="h-4 w-4 mr-2" />
                  {requestReset.isPending ? "发送中..." : "发送重置链接"}
                </Button>
                <div className="text-sm text-center text-slate-500">
                  想起密码了？{" "}
                  <a href="/login" className="text-blue-600 hover:underline">返回登录</a>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
