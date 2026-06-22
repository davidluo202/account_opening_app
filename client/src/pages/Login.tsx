import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { TopHeader } from "@/components/TopHeader";
import { useLang } from '@/lib/i18n';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useLang();

  if (user) {
    setLocation("/applications");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Server error");
      }

      if (!response.ok) {
        throw new Error(data.error || t('登入失敗', 'Login failed', '登入失败'));
      }

      if (data.success) {
        toast.success(t('登入成功', 'Login successful', '登入成功'));
        window.location.href = "/applications";
      } else {
        toast.error(data.error || t('登入失敗，請檢查賬號密碼', 'Login failed, please check your credentials', '登入失败，请检查账号密码'));
      }
    } catch (error: any) {
      toast.error(error.message || t('登入失敗，請檢查網絡或賬號密碼', 'Login failed, please check your network or credentials', '登入失败，请检查网络或账号密码'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t('登入', 'Login', '登入')}</CardTitle>
            <CardDescription>
              {t('請輸入您的電郵地址和密碼登入', 'Please enter your email and password to login', '请输入您的电邮地址和密码登入')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('電郵地址', 'Email', '电邮地址')}</Label>
                <Input
                  id="email"
                  type="text"
                  inputMode="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('密碼', 'Password', '密码')}</Label>
                  <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    {t('忘記密碼？', 'Forgot password?', '忘记密码？')}
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? t('登入中...', 'Logging in...', '登入中...') : t('登入', 'Login', '登入')}
              </Button>
              <div className="text-sm text-center text-slate-500">
                {t('還沒有賬號？', "Don't have an account? ", '还没有账号？')}{" "}
                <a href="/register" className="text-blue-600 hover:underline">
                  {t('立即註冊', 'Register now', '立即注册')}
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
