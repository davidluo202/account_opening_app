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
import { convertToTraditional } from "@/lib/converter";

const currencies = [
  { value: "HKD", label: "港幣 / HKD" },
  { value: "USD", label: "美元 / USD" },
  { value: "CNY", label: "人民幣 / CNY" },
  { value: "EUR", label: "歐元 / EUR" },
  { value: "GBP", label: "英鎊 / GBP" },
  { value: "JPY", label: "日元 / JPY" },
];

const accountTypes = [
  { value: "saving", label: "储蓄账户 / Saving" },
  { value: "current", label: "活期账户 / Current" },
  { value: "checking", label: "支票账户 / Checking" },
  { value: "others", label: "其他 / Others" },
];

// 香港銀行列表（含3位代碼）
const hkBanks = [
  { code: "004", name: "渣打銀行 / The Hongkong and Shanghai Banking Corporation Limited" },
  { code: "009", name: "中國銀行 / Bank of China (Hong Kong) Limited" },
  { code: "012", name: "恒生銀行 / Hang Seng Bank Limited" },
  { code: "015", name: "東亞銀行 / The Bank of East Asia, Limited" },
  { code: "018", name: "渣打清算有限公司 / The Hongkong and Shanghai Banking Corporation Limited" },
  { code: "024", name: "恆隆銀行 / Hang Lung Bank Limited" },
  { code: "025", name: "上海商業銀行 / Shanghai Commercial Bank Limited" },
  { code: "027", name: "永亞銀行 / Wing Lung Bank Limited" },
  { code: "028", name: "公理銀行 / Public Bank (Hong Kong) Limited" },
  { code: "035", name: "華南銀行 / Wah Nam Bank Limited" },
  { code: "038", name: "大新銀行 / Dah Sing Bank, Limited" },
  { code: "039", name: "道亨銀行 / Dao Heng Bank Limited" },
  { code: "040", name: "建設銀行 / China Construction Bank (Asia) Corporation Limited" },
  { code: "041", name: "集友銀行 / Chiyu Banking Corporation Limited" },
  { code: "043", name: "南洋商業銀行 / Nanyang Commercial Bank, Limited" },
  { code: "061", name: "花旗銀行 / Citibank (Hong Kong) Limited" },
  { code: "128", name: "富邦銀行 / Fubon Bank (Hong Kong) Limited" },
  { code: "250", name: "招商永隆銀行 / CMB Wing Lung Bank Limited" },
  { code: "251", name: "交通銀行 / Bank of Communications (Hong Kong) Limited" },
  { code: "253", name: "中信銀行 / China CITIC Bank International Limited" },
  { code: "254", name: "工商銀行 / Industrial and Commercial Bank of China (Asia) Limited" },
];

export default function BankAccount() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");

  const [isAdding, setIsAdding] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    bankName: "",
    bankCode: "", // 銀行代碼
    accountType: "saving", // 默认为Saving
    accountCurrency: "HKD",
    accountNumber: "",
    accountHolderName: "",
    bankLocation: "HK", // 默认香港
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
        bankCode: "",
        accountType: "saving",
        accountCurrency: "HKD",
        accountNumber: "",
        accountHolderName: basicInfo?.englishName || "",
        bankLocation: "HK",
      });
      setBankSearchQuery("");
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

  // 简繁体转换处理函数
  const handleChineseBlur = (field: string, value: string) => {
    const converted = convertToTraditional(value);
    if (converted !== value) {
      setFormData(prev => ({ ...prev, [field]: converted }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bankName.trim()) newErrors.bankName = "請輸入銀行名稱";
    
    // 验证账号
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "請輸入賬戶號碼";
    } else {
      const accountNum = formData.accountNumber.replace(/[^0-9]/g, ''); // 只保留数字
      
      if (formData.bankLocation === "CN") {
        // 大陆银行账号：16-19位
        if (accountNum.length < 16 || accountNum.length > 19) {
          newErrors.accountNumber = "大陸銀行賬戶號碼應為16-19位數字";
        }
      } else if (formData.bankLocation === "HK") {
        // 香港银行账号：9-12位
        if (accountNum.length < 9 || accountNum.length > 12) {
          newErrors.accountNumber = "香港銀行賬戶號碼應為9-12位數字";
        }
      }
    }
    
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
      bankName: formData.bankName,
      bankLocation: formData.bankLocation as "HK" | "CN" | "OTHER",
      accountType: formData.accountType as "saving" | "current" | "checking" | "others",
      accountCurrency: formData.accountCurrency,
      accountNumber: formData.accountNumber,
      accountHolderName: formData.accountHolderName,
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
                      账户类型: {account.accountType === "saving" ? "储蓄" : account.accountType === "current" ? "活期" : account.accountType === "checking" ? "支票" : "其他"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      币种: {account.accountCurrency}
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

            {/* 银行所在地 */}
            <div className="space-y-2">
              <Label htmlFor="bankLocation">
                银行所在地 / Bank Location <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.bankLocation} 
                onValueChange={(v) => {
                  setFormData({ ...formData, bankLocation: v, bankName: "", bankCode: "" });
                  setBankSearchQuery("");
                  // 清除账号验证错误，因为所在地改变了
                  if (errors.accountNumber) setErrors({ ...errors, accountNumber: "" });
                  if (errors.bankName) setErrors({ ...errors, bankName: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HK">香港 / Hong Kong</SelectItem>
                  <SelectItem value="CN">大陆 / Mainland China</SelectItem>
                  <SelectItem value="OTHER">其他 / Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 银行名称 */}
            <div className="space-y-2">
              <Label htmlFor="bankName">
                银行名称 / Bank Name <span className="text-destructive">*</span>
              </Label>
              {formData.bankLocation === "HK" ? (
                <>
                  {/* 搜索输入框 */}
                  <Input
                    placeholder="输入银行名称或代码搜索..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  {/* 银行下拉选择 */}
                  <Select 
                    value={formData.bankCode}
                    onValueChange={(code) => {
                      const bank = hkBanks.find(b => b.code === code);
                      if (bank) {
                        setFormData({ ...formData, bankCode: code, bankName: bank.name });
                        if (errors.bankName) setErrors({ ...errors, bankName: "" });
                      }
                    }}
                  >
                    <SelectTrigger className={errors.bankName ? "border-destructive" : ""}>
                      <SelectValue placeholder="选择银行" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {hkBanks
                        .filter(bank => 
                          bankSearchQuery === "" || 
                          bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                          bank.code.includes(bankSearchQuery)
                        )
                        .map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.code} - {bank.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => {
                    setFormData({ ...formData, bankName: e.target.value });
                    if (errors.bankName) setErrors({ ...errors, bankName: "" });
                  }}
                  onBlur={(e) => handleChineseBlur('bankName', e.target.value)}
                  placeholder="请输入银行名称"
                  className={errors.bankName ? "border-destructive" : ""}
                />
              )}
              {errors.bankName && <p className="text-sm text-destructive">{errors.bankName}</p>}
            </div>

            {/* 账户类型 */}
            <div className="space-y-2">
              <Label htmlFor="accountType">
                账户类型 / Account Type (可选)
              </Label>
              <Select 
                value={formData.accountType} 
                onValueChange={(v) => setFormData({ ...formData, accountType: v as "saving" | "current" | "others" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 账户币种 */}
            <div className="space-y-2">
              <Label htmlFor="accountCurrency">
                账户币种 / Currency <span className="text-destructive">*</span>
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
