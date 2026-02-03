import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
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

// 香港銀行列表（含3位代碼）- 完整列表
const hkBanks = [
  { code: "003", name: "渣打銀行（香港）有限公司" },
  { code: "004", name: "香港上海滙豐銀行有限公司" },
  { code: "005", name: "東亞匯理銀行" },
  { code: "006", name: "花旗銀行" },
  { code: "007", name: "摩根大通銀行" },
  { code: "009", name: "中國建設銀行（亞洲）股份有限公司" },
  { code: "012", name: "中國銀行（香港）有限公司" },
  { code: "015", name: "東亞銀行有限公司" },
  { code: "016", name: "星展銀行（香港）有限公司" },
  { code: "018", name: "中信銀行國際有限公司" },
  { code: "020", name: "招商永隆銀行有限公司" },
  { code: "022", name: "Oversea-Chinese Banking Corporation Limited" },
  { code: "024", name: "恒生銀行有限公司" },
  { code: "025", name: "上海商業銀行有限公司" },
  { code: "027", name: "交通銀行股份有限公司" },
  { code: "028", name: "大眾銀行(香港)有限公司" },
  { code: "035", name: "華僑銀行（香港）有限公司" },
  { code: "038", name: "大有銀行有限公司" },
  { code: "039", name: "集友銀行有限公司" },
  { code: "040", name: "大新銀行有限公司" },
  { code: "041", name: "創興銀行有限公司" },
  { code: "043", name: "南洋商業銀行有限公司" },
  { code: "045", name: "UCO Bank" },
  { code: "046", name: "KEB Hana Bank" },
  { code: "047", name: "三菱UFJ銀行" },
  { code: "049", name: "盤谷銀行" },
  { code: "050", name: "印度海外銀行" },
  { code: "054", name: "德意志銀行" },
  { code: "055", name: "美國銀行" },
  { code: "056", name: "法國巴黎銀行" },
  { code: "058", name: "印度銀行" },
  { code: "060", name: "巴基斯坦國民銀行" },
  { code: "061", name: "大生銀行有限公司" },
  { code: "063", name: "馬來亞銀行" },
  { code: "065", name: "三井住友銀行" },
  { code: "066", name: "印尼國家銀行" },
  { code: "067", name: "金融銀行有限公司" },
  { code: "071", name: "大華銀行有限公司" },
  { code: "072", name: "中國工商銀行（亞洲）有限公司" },
  { code: "074", name: "Barclays Bank Plc." },
  { code: "076", name: "加拿大豐業銀行" },
  { code: "080", name: "加拿大皇家銀行" },
  { code: "081", name: "法國興業銀行" },
  { code: "082", name: "印度國家銀行" },
  { code: "085", name: "多倫多道明銀行" },
  { code: "086", name: "滿地可銀行" },
  { code: "092", name: "加拿大帝國商業銀行" },
  { code: "103", name: "瑞士銀行" },
  { code: "106", name: "美國滙豐銀行" },
  { code: "109", name: "瑞穗銀行" },
  { code: "113", name: "德國中央合作銀行" },
  { code: "118", name: "友利銀行" },
  { code: "119", name: "Philippine National Bank" },
  { code: "128", name: "富邦銀行(香港)有限公司" },
  { code: "138", name: "三菱UFJ信託銀行" },
  { code: "139", name: "紐約梅隆銀行有限公司" },
  { code: "145", name: "ING Bank N.V." },
  { code: "147", name: "西班牙對外銀行" },
  { code: "152", name: "澳新銀行集團有限公司" },
  { code: "153", name: "澳洲聯邦銀行" },
  { code: "161", name: "義大利聯合聖保羅銀行股份有限公司" },
  { code: "170", name: "千葉銀行" },
  { code: "178", name: "比利時聯合銀行" },
  { code: "180", name: "富國銀行香港分行" },
  { code: "183", name: "荷蘭合作銀行" },
  { code: "185", name: "星展銀行香港分行" },
  { code: "186", name: "靜岡銀行" },
  { code: "198", name: "華南商業銀行股份有限公司" },
  { code: "199", name: "滋賀銀行" },
  { code: "201", name: "臺灣銀行股份有限公司" },
  { code: "202", name: "The Chugoku Bank Limited" },
  { code: "203", name: "第一商業銀行股份有限公司" },
  { code: "206", name: "彰化商業銀行股份有限公司" },
  { code: "210", name: "法國外貿銀行" },
  { code: "214", name: "中國工商銀行股份有限公司" },
  { code: "220", name: "美國道富銀行" },
  { code: "221", name: "中國建設銀行股份有限公司" },
  { code: "222", name: "中國農業銀行股份有限公司" },
  { code: "227", name: "Erste Group Bank AG" },
  { code: "229", name: "中國信託商業銀行股份有限公司" },
  { code: "230", name: "臺灣中小企業銀行股份有限公司" },
  { code: "236", name: "國泰世華商業銀行股份有限公司" },
  { code: "237", name: "瑞士盈豐銀行股份有限公司" },
  { code: "238", name: "招商銀行股份有限公司" },
  { code: "239", name: "台北富邦商業銀行股份有限公司" },
  { code: "241", name: "永豐商業銀行股份有限公司" },
  { code: "242", name: "兆豐國際商業銀行" },
  { code: "243", name: "玉山商業銀行股份有限公司" },
  { code: "245", name: "台新國際商業銀行股份有限公司" },
  { code: "248", name: "豐隆銀行有限公司" },
  { code: "249", name: "渣打銀行" },
  { code: "250", name: "花旗銀行(香港)有限公司" },
  { code: "251", name: "ICICI Bank Limited" },
  { code: "254", name: "Melli Bank plc" },
  { code: "258", name: "華美銀行" },
  { code: "260", name: "遠東國際商業銀行股份有限公司" },
  { code: "263", name: "國泰銀行" },
  { code: "264", name: "台灣土地銀行股份有限公司" },
  { code: "265", name: "合作金庫商業銀行股份有限公司" },
  { code: "267", name: "西班牙桑坦德銀行有限公司" },
  { code: "269", name: "上海商業儲蓄銀行股份有限公司" },
  { code: "271", name: "Industrial Bank of Korea" },
  { code: "272", name: "新加坡銀行有限公司" },
  { code: "273", name: "Shinhan Bank" },
  { code: "274", name: "王道商業銀行股份有限公司" },
  { code: "276", name: "國家開發銀行" },
  { code: "277", name: "First Abu Dhabi Bank PJSC" },
  { code: "278", name: "Bank J. Safra Sarasin Ltd" },
  { code: "308", name: "HDFC Bank Limited" },
  { code: "309", name: "Union Bancaire Privée, UBP SA" },
  { code: "316", name: "Skandinaviska Enskilda Banken AB" },
  { code: "320", name: "Bank Julius Baer & Co. Ltd." },
  { code: "324", name: "Credit Industriel et Commercial" },
  { code: "337", name: "臺灣新光商業銀行股份有限公司" },
  { code: "338", name: "中國銀行香港分行" },
  { code: "339", name: "CA Indosuez (Switzerland) SA" },
  { code: "342", name: "LGT 皇家銀行（香港）" },
  { code: "345", name: "上海浦東發展銀行股份有限公司" },
  { code: "353", name: "中國民生銀行股份有限公司" },
  { code: "359", name: "廣發銀行股份有限公司" },
  { code: "361", name: "渤海銀行股份有限公司" },
  { code: "364", name: "Banque Pictet & Cie SA" },
  { code: "365", name: "東莞銀行股份有限公司" },
  { code: "368", name: "中國光大銀行股份有限公司" },
  { code: "371", name: "三井住友信託銀行" },
  { code: "372", name: "上海銀行(香港)有限公司" },
  { code: "374", name: "CIMB Bank Berhad" },
  { code: "376", name: "農協銀行" },
  { code: "377", name: "興業銀行股份有限公司" },
  { code: "378", name: "元大商業銀行股份有限公司" },
  { code: "379", name: "Mashreq Bank - Public Shareholding Company" },
  { code: "381", name: "Kookmin Bank" },
  { code: "382", name: "交通銀行(香港)有限公司" },
  { code: "383", name: "浙商銀行股份有限公司" },
  { code: "384", name: "摩根士丹利銀行亞洲有限公司" },
  { code: "385", name: "平安銀行股份有限公司" },
  { code: "386", name: "華夏銀行股份有限公司" },
  { code: "387", name: "眾安銀行有限公司" },
  { code: "388", name: "理慧銀行有限公司" },
  { code: "389", name: "Mox Bank Limited" },
  { code: "390", name: "Welab Bank Limited" },
  { code: "391", name: "富融銀行有限公司" },
  { code: "392", name: "PAO Bank Limited" },
  { code: "393", name: "螞蟻銀行(香港)有限公司" },
  { code: "394", name: "卡塔爾國家銀行" },
  { code: "395", name: "天星銀行有限公司" },
  { code: "396", name: "The Korea Development Bank" },
  { code: "397", name: "中信銀行股份有限公司" },
  { code: "802", name: "Hong Kong Securities Clearing Company Limited" },
  { code: "810", name: "香港金融管理局-CMU Digital" },
];

export default function BankAccount() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

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
    setLocation(`/application/${applicationId}/step/10`);
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={9}
      showReturnToPreview={showReturnToPreview}
    >
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={9}
      onNext={handleNext}
      isNextDisabled={!bankAccounts || bankAccounts.length === 0}
    
      showReturnToPreview={showReturnToPreview}
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
