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
import { useLang } from '@/lib/i18n';

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
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "9");
  const showReturnToPreview = useReturnToPreview();
  const { t } = useLang();

  const currencies = [
    { value: "HKD", label: t('港幣 / HKD', 'HKD', '港币 / HKD') },
    { value: "USD", label: t('美元 / USD', 'USD', '美元 / USD') },
    { value: "CNY", label: t('人民幣 / CNY', 'CNY', '人民币 / CNY') },
    { value: "EUR", label: t('歐元 / EUR', 'EUR', '欧元 / EUR') },
    { value: "GBP", label: t('英鎊 / GBP', 'GBP', '英镑 / GBP') },
    { value: "JPY", label: t('日元 / JPY', 'JPY', '日元 / JPY') },
  ];

  const accountTypes = [
    { value: "saving", label: t('儲蓄賬戶 / Saving', 'Saving', '储蓄账户 / Saving') },
    { value: "current", label: t('活期賬戶 / Current', 'Current', '活期账户 / Current') },
    { value: "checking", label: t('支票賬戶 / Checking', 'Checking', '支票账户 / Checking') },
    { value: "others", label: t('其他 / Others', 'Others', '其他 / Others') },
  ];

  // Check if joint account
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isJoint = accountSelection?.customerType === 'joint';

  // Joint account: second holder bank accounts
  const [secondHolderAccounts, setSecondHolderAccounts] = useState<Array<{
    bankName: string;
    swiftCode: string;
    accountType: string;
    accountCurrency: string;
    accountNumber: string;
    accountHolderName: string;
  }>>([]);
  const [isAddingSecond, setIsAddingSecond] = useState(false);
  const [secondFormData, setSecondFormData] = useState({
    bankLocation: "HK",
    bankName: "",
    bankCode: "",
    swiftCode: "",
    accountType: "saving",
    accountCurrency: "HKD",
    accountNumber: "",
    accountHolderName: "",
  });
  const [secondBankSearchQuery, setSecondBankSearchQuery] = useState("");

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'bankAccount' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      const sh = existingSecondHolder as any;
      if (sh.secondHolderAccounts) setSecondHolderAccounts(sh.secondHolderAccounts);
    }
  }, [existingSecondHolder]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    bankName: "",
    bankCode: "", // 銀行代碼
    swiftCode: "", // SWIFT Code
    accountType: "saving", // 默认为Saving
    accountCurrency: "HKD",
    accountNumber: "",
    accountHolderName: "",
    accountHolderAddress: "", // 持有人地址
    bankLocation: "HK", // 默认香港
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取个人/机构基本信息以自动填充账户持有人姓名
  const { data: basicInfo } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const { data: corporateInfo } = trpc.corporateBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  // 機構賬戶名默認為機構英文名
  const defaultHolderName = corporateInfo?.companyEnglishName || "";

  const { data: bankAccounts, isLoading: isLoadingData, refetch } = trpc.bankAccount.list.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const addMutation = trpc.bankAccount.add.useMutation({
    onSuccess: () => {
      toast.success(editingId ? t('銀行賬戶已更新', 'Bank account updated', '银行账户已更新') : t('銀行賬戶已添加', 'Bank account added', '银行账户已添加'));
      setFormData({
        bankName: "",
        bankCode: "",
        swiftCode: "",
        accountType: "saving",
        accountCurrency: "HKD",
        accountNumber: "",
        accountHolderName: defaultHolderName,
        accountHolderAddress: "",
        bankLocation: "HK",
      });
      setBankSearchQuery("");
      setIsAdding(false);
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`${editingId ? t('更新', 'Update', '更新') : t('添加', 'Add', '添加')}${t('失敗', ' failed', '失败')}: ${error.message}`);
    },
  });

  const deleteMutation = trpc.bankAccount.delete.useMutation({
    onSuccess: () => {
      toast.success(t('銀行賬戶已刪除', 'Bank account deleted', '银行账户已删除'));
      refetch();
    },
    onError: (error) => {
      toast.error(`${t('刪除失敗', 'Delete failed', '删除失败')}: ${error.message}`);
    },
  });

  const handleEdit = (account: any) => {
    setIsAdding(true);
    setEditingId(account.id);
    setErrors({});

    setFormData({
      bankName: account.bankName || "",
      bankCode: "", // 暫不回填 HK bankCode（僅作選擇用）
      swiftCode: account.swiftCode || "",
      accountType: (account.accountType || "saving") as any,
      accountCurrency: account.accountCurrency || "HKD",
      accountNumber: account.accountNumber || "",
      accountHolderName: account.accountHolderName || defaultHolderName,
      accountHolderAddress: account.accountHolderAddress || "",
      bankLocation: (account.bankLocation || "HK") as any,
    });

    setBankSearchQuery("");
  };



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

    if (!formData.bankName.trim()) newErrors.bankName = t('請輸入銀行名稱', 'Please enter bank name', '请输入银行名称');

    // 驗證賬號
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = t('請輸入賬戶號碼', 'Please enter account number', '请输入账户号码');
    } else {
      const accountNum = formData.accountNumber.replace(/[^0-9]/g, ''); // 只保留数字

      if (formData.bankLocation === "CN") {
        // 大陆银行账号：16-19位
        if (accountNum.length < 16 || accountNum.length > 19) {
          newErrors.accountNumber = t('大陸銀行賬戶號碼應為16-19位數字', 'Mainland bank account number should be 16-19 digits', '大陆银行账户号码应为16-19位数字');
        }
      } else if (formData.bankLocation === "HK") {
        // 香港银行账号：9-12位
        if (accountNum.length < 9 || accountNum.length > 12) {
          newErrors.accountNumber = t('香港銀行賬戶號碼應為9-12位數字', 'Hong Kong bank account number should be 9-12 digits', '香港银行账户号码应为9-12位数字');
        }
      }
    }

    if (!formData.accountHolderName.trim()) newErrors.accountHolderName = t('請輸入賬戶持有人姓名', 'Please enter account holder name', '请输入账户持有人姓名');

    // SWIFT Code 驗證：必填，8-11位英文和數字
    if (!formData.swiftCode.trim()) {
      newErrors.swiftCode = t('請輸入SWIFT代碼', 'Please enter SWIFT code', '请输入SWIFT代码');
    } else if (!/^[A-Z0-9]{8,11}$/i.test(formData.swiftCode)) {
      newErrors.swiftCode = t('SWIFT代碼應為8-11位英文或數字', 'SWIFT code should be 8-11 alphanumeric characters', 'SWIFT代码应为8-11位英文或数字');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) {
      toast.error(t('請檢查表單中的錯誤', 'Please check form errors', '请检查表单中的错误'));
      return;
    }

    // 目前後端未提供 update API；先用「刪除 + 新增」達到可編輯效果
    // 注意：會生成新 id（如需保留同一條記錄 id，需新增 update 接口）
    const doAdd = () =>
      addMutation.mutate({
        applicationId,
        bankName: formData.bankName,
        bankLocation: formData.bankLocation as "HK" | "CN" | "OTHER",
        accountType: formData.accountType as "saving" | "current" | "checking" | "others",
        accountCurrency: formData.accountCurrency,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        accountHolderAddress: formData.accountHolderAddress,
        swiftCode: formData.swiftCode,
      });

    if (editingId) {
      deleteMutation.mutate(
        { id: editingId },
        {
          onSuccess: () => doAdd(),
        }
      );
      return;
    }

    doAdd();
  };

  const handleDelete = (id: number) => {
    if (confirm(t('確定要刪除此銀行賬戶嗎？', 'Are you sure you want to delete this bank account?', '确定要删除此银行账户吗？'))) {
      deleteMutation.mutate({ id });
    }
  };

const handleNext = () => {
    if (!bankAccounts || bankAccounts.length === 0) {
      toast.error(t('請至少添加一個銀行賬戶', 'Please add at least one bank account', '请至少添加一个银行账户'));
      return;
    }
    if (isJoint && secondHolderAccounts.length === 0) {
      toast.error(t('請填寫第二持有人的銀行賬戶（至少一個）', 'Please add at least one bank account for the second holder', '请填写第二持有人的银行账户（至少一个）'));
      return;
    }
    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'bankAccount', data: { secondHolderAccounts } });
    }
    setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={stepNum}
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
      currentStep={stepNum}
      onNext={handleNext}
      isNextDisabled={!bankAccounts || bankAccounts.length === 0}
    
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">{t('賬戶主要持有人', 'Primary Account Holder', '账户主要持有人')}</h3>
        )}

        {/* 已添加的銀行賬戶列表 */}
        {bankAccounts && bankAccounts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">{t('已添加的銀行賬戶', 'Added Bank Accounts', '已添加的银行账户')}</h4>
            {bankAccounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium">{account.bankName}</div>
                    <div className="text-sm text-muted-foreground">
                      SWIFT Code: {account.swiftCode || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('賬戶號碼', 'Account Number', '账户号码')}: {account.accountNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('賬戶類型', 'Account Type', '账户类型')}: {account.accountType === "saving" ? t('儲蓄', 'Saving', '储蓄') : account.accountType === "current" ? t('活期', 'Current', '活期') : account.accountType === "checking" ? t('支票', 'Checking', '支票') : t('其他', 'Others', '其他')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('幣種', 'Currency', '币种')}: {account.accountCurrency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('持有人', 'Holder', '持有人')}: {account.accountHolderName}
                    </div>
                    {account.accountHolderAddress && (
                      <div className="text-sm text-muted-foreground">
                        {t('持有人地址', 'Holder Address', '持有人地址')}: {account.accountHolderAddress}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(account)}
                      disabled={deleteMutation.isPending || addMutation.isPending}
                      title={t('編輯', 'Edit', '编辑')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      disabled={deleteMutation.isPending}
                      title={t('刪除', 'Delete', '删除')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
            {t('添加銀行賬戶', 'Add Bank Account', '添加银行账户')}
          </Button>
        ) : (
          <Card className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">{editingId ? t('編輯銀行賬戶', 'Edit Bank Account', '编辑银行账户') : t('添加新銀行賬戶', 'Add New Bank Account', '添加新银行账户')}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setErrors({});
                }}
              >
                {t('取消', 'Cancel', '取消')}
              </Button>
            </div>

            {/* 银行所在地 */}
            <div className="space-y-2">
              <Label htmlFor="bankLocation">
                {t('銀行所在地', 'Bank Location', '银行所在地')} <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.bankLocation} 
                onValueChange={(v) => {
                  setFormData({ ...formData, bankLocation: v, bankName: "", bankCode: "" });
                  setBankSearchQuery("");
                  // 清除賬號驗證錯誤，因為所在地改變了
                  if (errors.accountNumber) setErrors({ ...errors, accountNumber: "" });
                  if (errors.bankName) setErrors({ ...errors, bankName: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HK">{t('香港', 'Hong Kong', '香港')}</SelectItem>
                  <SelectItem value="CN">{t('中國內地', 'Chinese Mainland', '中国内地')}</SelectItem>
                  <SelectItem value="OTHER">{t('其他', 'Other', '其他')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 银行名称 */}
            <div className="space-y-2">
              <Label htmlFor="bankName">
                {t('銀行名稱', 'Bank Name', '银行名称')} <span className="text-destructive">*</span>
              </Label>
              {formData.bankLocation === "HK" ? (
                <>
                  {/* 搜索輸入框 */}
                  <Input
                    placeholder={t('輸入銀行名稱或代碼搜索...', 'Search by bank name or code...', '输入银行名称或代码搜索...')}
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  {/* 銀行下拉選擇 */}
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
                      <SelectValue placeholder={t('選擇銀行', 'Select Bank', '选择银行')} />
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
                  placeholder={t('請輸入銀行名稱', 'Please enter bank name', '请输入银行名称')}
                  className={errors.bankName ? "border-destructive" : ""}
                />
              )}
              {errors.bankName && <p className="text-sm text-destructive">{errors.bankName}</p>}
            </div>

            {/* SWIFT Code */}
            <div className="space-y-2">
              <Label htmlFor="swiftCode">
                {t('SWIFT 代碼', 'SWIFT Code', 'SWIFT 代码')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="swiftCode"
                value={formData.swiftCode}
                onChange={(e) => {
                  setFormData({ ...formData, swiftCode: e.target.value.toUpperCase() });
                  if (errors.swiftCode) setErrors({ ...errors, swiftCode: "" });
                }}
                onBlur={() => {
                  // 失焦时转换为大写
                  if (formData.swiftCode) {
                    setFormData({ ...formData, swiftCode: formData.swiftCode.toUpperCase() });
                  }
                }}
                placeholder={t('請輸入8-11位SWIFT Code', 'Enter 8-11 digit SWIFT Code', '请输入8-11位SWIFT Code')}
                className={errors.swiftCode ? "border-destructive" : ""}
                maxLength={11}
              />
              {errors.swiftCode && <p className="text-sm text-destructive">{errors.swiftCode}</p>}
            </div>

            {/* 账户类型 */}
            <div className="space-y-2">
              <Label htmlFor="accountType">
                {t('賬戶類型', 'Account Type', '账户类型')} <span className="text-destructive">*</span>
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
                {t('賬戶幣種', 'Currency', '账户币种')} <span className="text-destructive">*</span>
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
                {t('賬戶號碼', 'Account Number', '账户号码')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => {
                  setFormData({ ...formData, accountNumber: e.target.value });
                  if (errors.accountNumber) setErrors({ ...errors, accountNumber: "" });
                }}
                placeholder={t('請輸入賬戶號碼', 'Please enter account number', '请输入账户号码')}
                className={errors.accountNumber ? "border-destructive" : ""}
              />
              {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber}</p>}
            </div>

            {/* 賬戶持有人姓名 */}
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">
                {t('賬戶持有人姓名', 'Account Holder Name', '账户持有人姓名')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[A-Za-z\s''\-,.]+$/.test(val)) {
                    setFormData({ ...formData, accountHolderName: val });
                    if (errors.accountHolderName) setErrors({ ...errors, accountHolderName: "" });
                  }
                }}
                onBlur={() => {
                  const val = formData.accountHolderName;
                  if (val && /^[A-Za-z\s''\-,.]+$/.test(val)) {
                    setFormData({ ...formData, accountHolderName: val.toUpperCase() });
                  }
                }}
                placeholder={t('請輸入賬戶持有人英文姓名', 'Please enter account holder name in English', '请输入账户持有人英文姓名')}
                className={errors.accountHolderName ? "border-destructive" : ""}
              />
              {errors.accountHolderName && <p className="text-sm text-destructive">{errors.accountHolderName}</p>}
            </div>

            {/* 持有人地址 */}
            <div className="space-y-2">
              <Label htmlFor="accountHolderAddress">
                {t('持有人地址', 'Holder Address', '持有人地址')}
              </Label>
              <Input
                id="accountHolderAddress"
                value={formData.accountHolderAddress}
                onChange={(e) => setFormData({ ...formData, accountHolderAddress: e.target.value })}
                placeholder={t('請輸入持有人地址', 'Please enter holder address', '请输入持有人地址')}
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="w-full"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('保存中...', 'Saving...', '保存中...')}
                </>
              ) : (
                t('保存銀行賬戶', 'Save Bank Account', '保存银行账户')
              )}
            </Button>
          </Card>
        )}

        {bankAccounts && bankAccounts.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            {t('尚未添加銀行賬戶，請點擊上方按鈕添加', 'No bank accounts added yet. Please click the button above to add one.', '尚未添加银行账户，请点击上方按钮添加')}
          </div>
        )}

        {/* 聯名賬戶：第二持有人 */}
        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mt-8 mb-2">{t('賬戶第二持有人', 'Second Account Holder', '账户第二持有人')}</h3>

            {/* 已添加的第二持有人銀行賬戶 */}
            {secondHolderAccounts.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">{t('已添加的銀行賬戶', 'Added Bank Accounts', '已添加的银行账户')}</h4>
                {secondHolderAccounts.map((account, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-medium">{account.bankName}</div>
                        <div className="text-sm text-muted-foreground">SWIFT Code: {account.swiftCode || '-'}</div>
                        <div className="text-sm text-muted-foreground">{t('賬戶號碼', 'Account Number', '账户号码')}: {account.accountNumber}</div>
                        <div className="text-sm text-muted-foreground">{t('幣種', 'Currency', '币种')}: {account.accountCurrency}</div>
                        <div className="text-sm text-muted-foreground">{t('持有人', 'Holder', '持有人')}: {account.accountHolderName}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSecondHolderAccounts(prev => prev.filter((_, i) => i !== idx));
                      }} title={t('刪除', 'Delete', '删除')}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!isAddingSecond ? (
              <Button variant="outline" className="w-full" onClick={() => setIsAddingSecond(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('添加第二持有人銀行賬戶', 'Add Second Holder Bank Account', '添加第二持有人银行账户')}
              </Button>
            ) : (
              <Card className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{t('添加銀行賬戶', 'Add Bank Account', '添加银行账户')}</h4>
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingSecond(false)}>{t('取消', 'Cancel', '取消')}</Button>
                </div>

                <div className="space-y-2">
                  <Label>{t('銀行所在地', 'Bank Location', '银行所在地')} <span className="text-destructive">*</span></Label>
                  <Select value={secondFormData.bankLocation}
                    onValueChange={(v) => {
                      setSecondFormData({ ...secondFormData, bankLocation: v, bankName: "", bankCode: "" });
                      setSecondBankSearchQuery("");
                    }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HK">{t('香港', 'Hong Kong', '香港')}</SelectItem>
                      <SelectItem value="OTHER">{t('其他', 'Other', '其他')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('銀行名稱', 'Bank Name', '银行名称')} <span className="text-destructive">*</span></Label>
                  {secondFormData.bankLocation === "HK" ? (
                    <>
                      <Input
                        placeholder={t('輸入銀行名稱或代碼搜索...', 'Search by bank name or code...', '输入银行名称或代码搜索...')}
                        value={secondBankSearchQuery}
                        onChange={(e) => setSecondBankSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <Select value={secondFormData.bankCode}
                        onValueChange={(code) => {
                          const bank = hkBanks.find(b => b.code === code);
                          if (bank) setSecondFormData({ ...secondFormData, bankCode: code, bankName: bank.name });
                        }}>
                        <SelectTrigger><SelectValue placeholder={t('選擇銀行', 'Select Bank', '选择银行')} /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {hkBanks
                            .filter(bank => secondBankSearchQuery === "" || bank.name.toLowerCase().includes(secondBankSearchQuery.toLowerCase()) || bank.code.includes(secondBankSearchQuery))
                            .map((bank) => (<SelectItem key={bank.code} value={bank.code}>{bank.code} - {bank.name}</SelectItem>))
                          }
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <Input value={secondFormData.bankName}
                      onChange={(e) => setSecondFormData({ ...secondFormData, bankName: e.target.value })}
                      placeholder={t('請輸入銀行名稱', 'Please enter bank name', '请输入银行名称')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('SWIFT 代碼', 'SWIFT Code', 'SWIFT 代码')} <span className="text-destructive">*</span></Label>
                  <Input value={secondFormData.swiftCode}
                    onChange={(e) => setSecondFormData({ ...secondFormData, swiftCode: e.target.value.toUpperCase() })}
                    placeholder={t('請輸入SWIFT Code', 'Please enter SWIFT Code', '请输入SWIFT Code')} maxLength={11} />
                </div>

                <div className="space-y-2">
                  <Label>{t('賬戶幣種', 'Currency', '账户币种')} <span className="text-destructive">*</span></Label>
                  <Select value={secondFormData.accountCurrency}
                    onValueChange={(v) => setSecondFormData({ ...secondFormData, accountCurrency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('賬戶號碼', 'Account Number', '账户号码')} <span className="text-destructive">*</span></Label>
                  <Input value={secondFormData.accountNumber}
                    onChange={(e) => setSecondFormData({ ...secondFormData, accountNumber: e.target.value })}
                    placeholder={t('請輸入賬戶號碼', 'Please enter account number', '请输入账户号码')} />
                </div>

                <div className="space-y-2">
                  <Label>{t('賬戶持有人姓名', 'Account Holder Name', '账户持有人姓名')} <span className="text-destructive">*</span></Label>
                  <Input value={secondFormData.accountHolderName}
                    onChange={(e) => setSecondFormData({ ...secondFormData, accountHolderName: e.target.value })}
                    placeholder={t('請輸入賬戶持有人姓名', 'Please enter account holder name', '请输入账户持有人姓名')} />
                </div>

                <Button className="w-full" onClick={() => {
                  if (!secondFormData.bankName.trim() || !secondFormData.accountNumber.trim() || !secondFormData.accountHolderName.trim()) {
                    toast.error(t('請填寫必填項', 'Please fill in required fields', '请填写必填项'));
                    return;
                  }
                  setSecondHolderAccounts(prev => [...prev, { ...secondFormData }]);
                  setSecondFormData({ bankLocation: "HK", bankName: "", bankCode: "", swiftCode: "", accountType: "saving", accountCurrency: "HKD", accountNumber: "", accountHolderName: "" });
                  setSecondBankSearchQuery("");
                  setIsAddingSecond(false);
                }}>
                  {t('保存銀行賬戶', 'Save Bank Account', '保存银行账户')}
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </ApplicationWizard>
  );
}
