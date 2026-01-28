import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";

const currencies = [
  { value: "HKD", label: "港幣 / HKD" },
  { value: "USD", label: "美元 / USD" },
  { value: "CNY", label: "人民幣 / CNY" },
  { value: "EUR", label: "歐元 / EUR" },
  { value: "GBP", label: "英鎊 / GBP" },
  { value: "JPY", label: "日元 / JPY" },
];

export default function BankAccount() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountCurrency: "HKD",
    accountNumber: "",
    accountHolderName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取个人基本信息以自动填充账户持有人姓名
  const { data: basicInfo } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: bankAccounts, isLoading: isLoadingData, refetch } = trpc.bankAccount.list.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const addMutation = trpc.bankAccount.add.useMutation({
    onSuccess: () => {
      toast.success("銀行賬戶已添加");
      setFormData({
        bankName: "",
        accountCurrency: "HKD",
        accountNumber: "",
        accountHolderName: basicInfo?.englishName || "",
      });
      setIsAdding(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`添加失敗: ${error.message}`);
    },
  });

  const deleteMutation = trpc.bankAccount.delete.useMutation({
    onSuccess: () => {
      toast.success("銀行賬戶已刪除");
      refetch();
    },
    onError: (error) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });



  useEffect(() => {
    if (basicInfo && !formData.accountHolderName) {
      setFormData(prev => ({
        ...prev,
        accountHolderName: basicInfo.englishName,
      }));
    }
  }, [basicInfo]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bankName.trim()) newErrors.bankName = "請輸入銀行名稱";
    if (!formData.accountNumber.trim()) newErrors.accountNumber = "請輸入賬戶號碼";
    if (!formData.accountHolderName.trim()) newErrors.accountHolderName = "請輸入賬戶持有人姓名";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    addMutation.mutate({
      applicationId,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此銀行賬戶嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleNext = () => {
    if (!bankAccounts || bankAccounts.length === 0) {
      toast.error("請至少添加一個銀行賬戶");
      return;
    }
    setLocation(`/application/${applicationId}/step/9`);
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={8}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={8}
      onNext={handleNext}
      isNextDisabled={!bankAccounts || bankAccounts.length === 0}
    >
      <div className="space-y-6">
        {/* 已添加的銀行賬戶列表 */}
        {bankAccounts && bankAccounts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">已添加的銀行賬戶</h4>
            {bankAccounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium">{account.bankName}</div>
                    <div className="text-sm text-muted-foreground">
                      賬戶號碼: {account.accountNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      幣種: {account.accountCurrency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      持有人: {account.accountHolderName}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 添加新銀行賬戶 */}
        {!isAdding ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加銀行賬戶
          </Button>
        ) : (
          <Card className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">添加新銀行賬戶</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setErrors({});
                }}
              >
                取消
              </Button>
            </div>

            {/* 銀行名稱 */}
            <div className="space-y-2">
              <Label htmlFor="bankName">
                銀行名稱 / Bank Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => {
                  setFormData({ ...formData, bankName: e.target.value });
                  if (errors.bankName) setErrors({ ...errors, bankName: "" });
                }}
                placeholder="請輸入銀行名稱"
                className={errors.bankName ? "border-destructive" : ""}
              />
              {errors.bankName && <p className="text-sm text-destructive">{errors.bankName}</p>}
            </div>

            {/* 賬戶幣種 */}
            <div className="space-y-2">
              <Label htmlFor="accountCurrency">
                賬戶幣種 / Currency <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.accountCurrency} 
                onValueChange={(v) => setFormData({ ...formData, accountCurrency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 賬戶號碼 */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                賬戶號碼 / Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => {
                  setFormData({ ...formData, accountNumber: e.target.value });
                  if (errors.accountNumber) setErrors({ ...errors, accountNumber: "" });
                }}
                placeholder="請輸入賬戶號碼"
                className={errors.accountNumber ? "border-destructive" : ""}
              />
              {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber}</p>}
            </div>

            {/* 賬戶持有人姓名 */}
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">
                賬戶持有人姓名 / Account Holder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => {
                  setFormData({ ...formData, accountHolderName: e.target.value });
                  if (errors.accountHolderName) setErrors({ ...errors, accountHolderName: "" });
                }}
                placeholder="請輸入賬戶持有人姓名"
                className={errors.accountHolderName ? "border-destructive" : ""}
              />
              {errors.accountHolderName && <p className="text-sm text-destructive">{errors.accountHolderName}</p>}
              <p className="text-sm text-muted-foreground">默認為您的英文姓名</p>
            </div>

            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="w-full"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存銀行賬戶"
              )}
            </Button>
          </Card>
        )}

        {bankAccounts && bankAccounts.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            尚未添加銀行賬戶，請點擊上方按鈕添加
          </div>
        )}
      </div>
    </ApplicationWizard>
  );
}
