import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/login")} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回用户登录
          </Button>
          <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
          <CardDescription>
            目前用户端为测试/体验模式：登录按钮会自动注册账号，不需要找回密码。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>如果你忘记了密码，可以直接用同一个邮箱输入一个新密码再次登录（系统会自动创建/更新测试账号）。</p>
          <p>如需正式的“邮件重置密码”流程，我后续再补上用户端的完整实现。</p>
          <div className="pt-2">
            <Button onClick={() => setLocation("/login")} className="w-full">
              返回登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
