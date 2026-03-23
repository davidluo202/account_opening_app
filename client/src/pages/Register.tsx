import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { TopHeader } from "@/components/TopHeader";

export default function Register() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    setLocation("/applications");
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Server error");
      }

      if (!response.ok) {
        throw new Error(data.error || "注册失败");
      }

      if (data.success) {
        toast.success("注册成功");
        window.location.href = "/applications";
      } else {
        toast.error(data.error || "注册失败，请检查填写信息");
      }
    } catch (error: any) {
      toast.error(error.message || "注册失败，请检查网络或填写信息");
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
            <CardTitle className="text-2xl font-bold">注册新账号</CardTitle>
            <CardDescription>
              请输入您的信息以创建开户系统账号
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="您的姓名" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
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
                <Label htmlFor="password">密码</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="请输入密码（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "注册中..." : "立即注册"}
              </Button>
              <div className="text-sm text-center text-slate-500">
                已有账号？{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  返回登入
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
