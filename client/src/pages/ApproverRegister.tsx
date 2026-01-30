import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import EmailVerification from "@/components/EmailVerification";
import { CheckCircle } from "lucide-react";

export default function ApproverRegister() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  
  const handleVerified = () => {
    setIsVerified(true);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">审批人员注册</CardTitle>
          <CardDescription>
            使用公司邮箱（@cmfinancial.com）完成注册验证
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isVerified ? (
            <div className="space-y-4">
              <EmailVerification
                email={email}
                onEmailChange={setEmail}
                onVerified={handleVerified}
                isApprover={true}
                requiredDomain="@cmfinancial.com"
                autoCompleteDomain={true}
              />
              
              <Alert>
                <AlertDescription>
                  我们将向您的公司邮箱发送6位数字验证码，请在5分钟内完成验证。
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">邮箱验证成功！</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  您的邮箱 <strong>{email}</strong> 已通过验证
                </p>
              </div>
              
              <Alert>
                <AlertDescription>
                  请联系系统管理员将您添加为审批人员，并提供以下信息：
                  <ul className="list-disc list-inside mt-2 text-left">
                    <li>员工姓名</li>
                    <li>CE编号</li>
                    <li>审批角色（审批员/经理）</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => setLocation("/")}
                className="w-full"
              >
                返回首页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
