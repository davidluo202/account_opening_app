import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      
      if (!response.ok) {
        throw new Error("登录失败");
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success("登录成功");
        window.location.href = "/applications"; // 强制刷新加载状态
      } else {
        toast.error("登录失败，请检查账号密码");
      }
    } catch (error) {
      toast.error("登录失败，请检查网络或账号密码");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">登入开户系统</CardTitle>
          <CardDescription>
            请输入您的邮箱和密码登录
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  忘记密码？
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
              {isLoading ? "登录中..." : "登入 / 自动注册"}
            </Button>
            <div className="text-sm text-center text-slate-500 bg-blue-50 p-3 rounded-md">
              <span className="font-semibold text-blue-700">🔧 测试模式说明：</span><br/>
              无需专门注册！输入<strong className="text-blue-600">任意新邮箱</strong>和密码，点击上方按钮即可<strong className="text-blue-600">自动注册并瞬间登入</strong>。
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
