import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Mail, Clock, CheckCircle } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  onEmailChange: (email: string) => void;
  onVerified: () => void;
  isApprover?: boolean;
  requiredDomain?: string;
  disabled?: boolean;
  autoCompleteDomain?: boolean; // 是否自动补全域名
}

export default function EmailVerification({
  email,
  onEmailChange,
  onVerified,
  isApprover = false,
  requiredDomain = "",
  disabled = false,
  autoCompleteDomain = false,
}: EmailVerificationProps) {
  const [emailError, setEmailError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  
  // 发送验证码
  const sendCodeMutation = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送至您的邮箱");
      setShowCodeInput(true);
      setCountdown(90); // 90秒倒计时
      setCanResend(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // 验证验证码
  const verifyCodeMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("邮箱验证成功！");
      setIsVerified(true);
      setShowCodeInput(false);
      onVerified();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && showCodeInput) {
      setCanResend(true);
    }
  }, [countdown, showCodeInput]);
  
  // 获取完整邮箱地址（如果启用自动补全）
  const getFullEmail = (inputEmail: string): string => {
    if (autoCompleteDomain && requiredDomain && !inputEmail.includes('@')) {
      return inputEmail + requiredDomain;
    }
    return inputEmail;
  };
  
  // 验证邮箱格式
  const validateEmail = (inputEmail: string): boolean => {
    const fullEmail = getFullEmail(inputEmail);
    
    if (!fullEmail) {
      setEmailError("请输入邮箱地址");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fullEmail)) {
      setEmailError("请输入有效的邮箱地址");
      return false;
    }
    
    if (requiredDomain && !fullEmail.endsWith(requiredDomain)) {
      setEmailError(`邮箱必须使用${requiredDomain}域名`);
      return false;
    }
    
    setEmailError("");
    return true;
  };
  
  // 发送验证码
  const handleSendCode = () => {
    const fullEmail = getFullEmail(email);
    if (!validateEmail(email)) return;
    
    // 如果启用自动补全，更新email状态为完整邮箱
    if (autoCompleteDomain && !email.includes('@')) {
      onEmailChange(fullEmail);
    }
    
    sendCodeMutation.mutate({
      email: fullEmail,
      isApprover,
    });
  };
  
  // 重发验证码
  const handleResendCode = () => {
    setVerificationCode("");
    handleSendCode();
  };
  
  // 验证验证码
  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      toast.error("请输入6位验证码");
      return;
    }
    
    const fullEmail = getFullEmail(email);
    verifyCodeMutation.mutate({
      email: fullEmail,
      code: verificationCode,
    });
  };
  
  // 格式化倒计时
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">
          邮箱地址 {requiredDomain && <span className="text-sm text-muted-foreground">({requiredDomain})</span>}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type={autoCompleteDomain ? "text" : "email"}
              placeholder={autoCompleteDomain ? "输入邮箱前缀（系统自动补全" + requiredDomain + "）" : (requiredDomain ? `your.name${requiredDomain}` : "your.email@example.com")}
              value={email}
              onChange={(e) => {
                onEmailChange(e.target.value);
                setEmailError("");
                setIsVerified(false);
              }}
              onBlur={() => validateEmail(email)}
              disabled={disabled || isVerified || showCodeInput}
              className="pl-10"
            />
            {isVerified && (
              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            )}
          </div>
          {!isVerified && !showCodeInput && (
            <Button
              onClick={handleSendCode}
              disabled={disabled || sendCodeMutation.isPending || !!emailError || !email}
            >
              {sendCodeMutation.isPending ? "发送中..." : "验证"}
            </Button>
          )}
        </div>
        {emailError && (
          <p className="text-sm text-destructive">{emailError}</p>
        )}
      </div>
      
      {showCodeInput && !isVerified && (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              验证码已发送至 <strong>{email}</strong>
              <br />
              {countdown > 0 ? (
                <span className="text-sm text-muted-foreground">
                  剩余时间: {formatCountdown(countdown)}
                </span>
              ) : (
                <span className="text-sm text-destructive">
                  验证码已过期，请重新发送
                </span>
              )}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="code">验证码</Label>
            <Input
              id="code"
              type="text"
              placeholder="输入6位验证码"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setVerificationCode(value);
              }}
              maxLength={6}
              className="text-center text-xl tracking-widest"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleVerifyCode}
              disabled={verifyCodeMutation.isPending || verificationCode.length !== 6}
              className="flex-1"
            >
              {verifyCodeMutation.isPending ? "验证中..." : "提交验证"}
            </Button>
            <Button
              onClick={handleResendCode}
              disabled={!canResend || sendCodeMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {sendCodeMutation.isPending ? "发送中..." : "重发"}
            </Button>
          </div>
          
          <Button
            onClick={() => {
              setShowCodeInput(false);
              setVerificationCode("");
              setCountdown(0);
            }}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            返回修改邮箱
          </Button>
        </div>
      )}
      
      {isVerified && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            邮箱已验证成功
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
