import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminHome() {
  const [, setLocation] = useLocation();
  const [loginMethod, setLoginMethod] = useState<"password" | "code">("password");
  
  // 密码登录状态
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 验证码登录状态
  const [codeEmail, setCodeEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // 密码登录mutation
  const passwordLoginMutation = trpc.approver.loginWithPassword.useMutation({
    onSuccess: () => {
      toast.success("登录成功");
      setLocation("/admin/approvals");
    },
    onError: (error) => {
      toast.error(error.message || "登录失败");
    },
  });

  // 验证码登录mutations
  const sendCodeMutation = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送到您的邮箱");
      setCodeSent(true);
      setCountdown(90); // 90秒倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "发送验证码失败");
    },
  });

  const verifyCodeMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("验证成功");
      setLocation("/admin/approvals");
    },
    onError: (error) => {
      toast.error(error.message || "验证失败");
    },
  });

  // 密码登录处理
  const handlePasswordLogin = () => {
    // 自动补全邮箱域名
    let fullEmail = passwordEmail;
    if (!passwordEmail.includes('@')) {
      fullEmail = passwordEmail + '@cmfinancial.com';
      setPasswordEmail(fullEmail);
    }
    
    if (!fullEmail || !fullEmail.endsWith("@cmfinancial.com")) {
      toast.error("请输入有效的@cmfinancial.com邮箱地址");
      return;
    }
    
    if (!password) {
      toast.error("请输入密码");
      return;
    }
    
    passwordLoginMutation.mutate({ email: fullEmail, password });
  };

  // 验证码登录处理
  const handleSendCode = () => {
    // 自动补全邮箱域名
    let fullEmail = codeEmail;
    if (!codeEmail.includes('@')) {
      fullEmail = codeEmail + '@cmfinancial.com';
      setCodeEmail(fullEmail);
    }
    
    if (!fullEmail || !fullEmail.endsWith("@cmfinancial.com")) {
      toast.error("请输入有效的@cmfinancial.com邮箱地址");
      return;
    }
    sendCodeMutation.mutate({ email: fullEmail, isApprover: true });
  };

  const handleVerify = () => {
    if (!verificationCode) {
      toast.error("请输入验证码");
      return;
    }
    setIsVerifying(true);
    verifyCodeMutation.mutate(
      { email: codeEmail, code: verificationCode },
      {
        onSettled: () => setIsVerifying(false),
      }
    );
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
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              客户开户审批系统
            </CardTitle>
            <CardDescription className="text-base">
              诚港金融 - 合规审批平台
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "password" | "code")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="password">密码登录</TabsTrigger>
                <TabsTrigger value="code">验证码登录</TabsTrigger>
              </TabsList>

              {/* 密码登录 */}
              <TabsContent value="password" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password-email">审批人员邮箱</Label>
                  <Input
                    id="password-email"
                    type="text"
                    placeholder="输入邮箱前缀（系统自动补全@cmfinancial.com）"
                    value={passwordEmail}
                    onChange={(e) => setPasswordEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        document.getElementById('password-input')?.focus();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    例如：输入 "xluo" 即可，系统会自动补全为 xluo@cmfinancial.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-input">密码</Label>
                  <Input
                    id="password-input"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && passwordEmail && password) {
                        handlePasswordLogin();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handlePasswordLogin}
                  disabled={passwordLoginMutation.isPending || !passwordEmail || !password}
                  className="w-full"
                  size="lg"
                >
                  {passwordLoginMutation.isPending ? "登录中..." : "登录"}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm text-blue-600"
                    onClick={() => setLocation("/forgot-password")}
                  >
                    忘记密码？
                  </Button>
                </div>
              </TabsContent>

              {/* 验证码登录 */}
              <TabsContent value="code" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code-email">审批人员邮箱</Label>
                  <Input
                    id="code-email"
                    type="text"
                    placeholder="输入邮箱前缀（系统自动补全@cmfinancial.com）"
                    value={codeEmail}
                    onChange={(e) => setCodeEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !codeSent && codeEmail) {
                        handleSendCode();
                      }
                    }}
                    disabled={codeSent}
                  />
                  <p className="text-xs text-muted-foreground">
                    例如：输入 "xluo" 即可，系统会自动补全为 xluo@cmfinancial.com
                  </p>
                </div>

                {!codeSent ? (
                  <Button
                    onClick={handleSendCode}
                    disabled={sendCodeMutation.isPending || !codeEmail}
                    className="w-full"
                    size="lg"
                  >
                    {sendCodeMutation.isPending ? "发送中..." : "发送验证码"}
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="code">验证码</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="请输入6位验证码"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && verificationCode) {
                            handleVerify();
                          }
                        }}
                        maxLength={6}
                      />
                      <p className="text-sm text-gray-500">
                        验证码已发送到您的邮箱
                        {countdown > 0 && ` (${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")})`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleVerify}
                        disabled={isVerifying || !verificationCode}
                        className="flex-1"
                        size="lg"
                      >
                        {isVerifying ? "验证中..." : "确认验证"}
                      </Button>
                      {countdown === 0 && (
                        <Button
                          onClick={handleSendCode}
                          disabled={sendCodeMutation.isPending}
                          variant="outline"
                          size="lg"
                        >
                          重新发送
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="pt-4 mt-4 border-t text-center text-sm text-gray-500">
              <p>仅限@cmfinancial.com域名邮箱访问</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
