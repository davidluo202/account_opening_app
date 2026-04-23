import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { TopHeader } from "@/components/TopHeader";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Email verification state
  const [verificationStep, setVerificationStep] = useState<"input" | "verify" | "verified">("input");
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const sendCodeMutation = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      toast.success("驗證碼已發送至您的電郵");
      setVerificationStep("verify");
      startCountdown();
    },
    onError: (err) => {
      toast.error(err.message || "發送驗證碼失敗");
    },
  });

  const verifyCodeMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("電郵驗證成功！");
      setVerificationStep("verified");
    },
    onError: (err) => {
      toast.error(err.message || "驗證碼無效或已過期");
    },
  });

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (user) {
    setLocation("/applications");
    return null;
  }

  const handleSendCode = () => {
    if (!email || !email.includes("@")) {
      toast.error("請輸入有效的電郵地址");
      return;
    }
    sendCodeMutation.mutate({ email });
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      toast.error("請輸入6位數驗證碼");
      return;
    }
    verifyCodeMutation.mutate({ email, code: verificationCode });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationStep !== "verified") {
      toast.error("請先完成電郵驗證");
      return;
    }

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
        throw new Error(data.error || "註冊失敗");
      }

      if (data.success) {
        toast.success("註冊成功");
        window.location.href = "/applications";
      } else {
        toast.error(data.error || "註冊失敗，請檢查填寫資訊");
      }
    } catch (error: any) {
      toast.error(error.message || "註冊失敗，請檢查網絡或填寫資訊");
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
            <CardTitle className="text-2xl font-bold">註冊新賬號</CardTitle>
            <CardDescription>
              請輸入您的資訊以建立開戶系統賬號
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  請確認您的電郵地址正確無誤。此電郵將用作開戶平台的登入，並作為接收開戶申請確認及其他重要通知的主要聯絡電郵。
                </AlertDescription>
              </Alert>

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
                <Label htmlFor="email">電郵地址 <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="text"
                    inputMode="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (verificationStep !== "input") {
                        setVerificationStep("input");
                        setVerificationCode("");
                      }
                    }}
                    required
                    disabled={verificationStep === "verified"}
                    className={verificationStep === "verified" ? "bg-green-50 border-green-300" : ""}
                  />
                  {verificationStep === "verified" ? (
                    <div className="flex items-center gap-1 text-green-600 whitespace-nowrap px-3">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">已驗證</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendCode}
                      disabled={sendCodeMutation.isPending || countdown > 0 || !email}
                      className="whitespace-nowrap"
                    >
                      {sendCodeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : countdown > 0 ? (
                        `${countdown}秒`
                      ) : verificationStep === "verify" ? (
                        "重新發送"
                      ) : (
                        "發送驗證碼"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {verificationStep === "verify" && (
                <div className="space-y-2">
                  <Label htmlFor="code">驗證碼</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      placeholder="請輸入6位數驗證碼"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setVerificationCode(val);
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifyCodeMutation.isPending || verificationCode.length !== 6}
                    >
                      {verifyCodeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "驗證"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">驗證碼已發送至您的電郵，有效期5分鐘</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="請輸入密碼（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading || verificationStep !== "verified"}>
                {isLoading ? "註冊中..." : "立即註冊"}
              </Button>
              <div className="text-sm text-center text-slate-500">
                已有賬號？{" "}
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
