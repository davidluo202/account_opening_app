import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AdminForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const requestResetMutation = trpc.approver.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "密碼重置郵件已發送");
      setEmailSent(true);
    },
    onError: (error) => {
      toast.error(error.message || "發送失敗，請稍後重試");
    },
  });

  const handleSubmit = () => {
    let fullEmail = email;
    if (!email.includes("@")) {
      fullEmail = email + "@cmfinancial.com";
      setEmail(fullEmail);
    }

    if (!fullEmail || !fullEmail.endsWith("@cmfinancial.com")) {
      toast.error("請輸入有效的@cmfinancial.com郵箱地址");
      return;
    }

    requestResetMutation.mutate({ email: fullEmail });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
              返回審批登錄
            </Button>
            <CardTitle className="text-2xl font-bold">審批人員忘記密碼</CardTitle>
            <CardDescription>輸入審批人員郵箱，我們將發送密碼重置鏈接到郵箱</CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">郵箱地址</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="輸入郵箱前綴（系統自動補全@cmfinancial.com）"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && email) {
                        handleSubmit();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={requestResetMutation.isPending || !email}
                  className="w-full"
                  size="lg"
                >
                  {requestResetMutation.isPending ? "發送中..." : "發送重置郵件"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-2">郵件已發送！</p>
                  <p className="text-sm text-green-700">
                    我們已向 <strong>{email}</strong> 發送了密碼重置郵件。
                  </p>
                </div>

                <Button variant="ghost" onClick={() => setLocation("/admin")} className="w-full">
                  返回審批登錄
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
