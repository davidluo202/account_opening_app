import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { useLang } from '@/lib/i18n';

// Convert YYYY-MM to MM/YYYY for display
const toMMYYYY = (val: string) => {
  if (!val) return "";
  const m = val.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[2]}/${m[1]}`;
  return val;
};

// Convert MM/YYYY to YYYY-MM for storage
const toYYYYMM = (val: string) => {
  const m = val.match(/^(\d{2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1]}`;
  return val;
};

// Format input as user types: auto-insert slash after 2 digits
const formatDateInput = (raw: string, prev: string) => {
  // Strip non-digit/slash chars
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 6)}`;
};

const valueRanges = [
  { value: "<1m", label: "<HK$1,000,000" },
  { value: "1m-5m", label: "HK$1,000,000 - HK$5,000,000" },
  { value: "5m-10m", label: "HK$5,000,001 - HK$10,000,000" },
  { value: ">10m", label: ">HK$10,000,000" },
];

interface Props {
  applicationId: number;
  stepNum: number;
}

export default function CorporateFinancial({ applicationId, stepNum }: Props) {
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const showReturnToPreview = useReturnToPreview();

  const incomeSources = [
    { value: "operation", label: t('營業收入', 'Operation Income', '营业收入') },
    { value: "investment", label: t('投資收益', 'Investment Income', '投资收益') },
    { value: "interest", label: t('利息收入', 'Interest Income', '利息收入') },
    { value: "dividend", label: t('股息收入', 'Dividend Income', '股息收入') },
    { value: "shareholder", label: t('股東出資', 'Shareholder Contribution', '股东出资') },
    { value: "rental", label: t('租金收入', 'Rental Income', '租金收入') },
    { value: "borrowing", label: t('貸款', 'External Borrowing', '贷款') },
    { value: "other", label: t('其他', 'Other', '其他') },
  ];

  const assetItemsList = [
    { value: "property", label: t('房地產', 'Property', '房地产') },
    { value: "securities", label: t('上市證券', 'Listed Securities', '上市证券') },
    { value: "deposit", label: t('存款', 'Deposit', '存款') },
    { value: "bonds", label: t('債券', 'Bonds', '债券') },
    { value: "funds", label: t('基金', 'Funds', '基金') },
    { value: "other", label: t('其他', 'Other', '其他') },
  ];

  const experiencedProductsList = [
    { value: "property", label: t('房地產', 'Property', '房地产') },
    { value: "securities", label: t('上市證券', 'Listed Securities', '上市证券') },
    { value: "deposit", label: t('存款', 'Deposit', '存款') },
    { value: "bonds", label: t('債券', 'Bonds', '债券') },
    { value: "funds", label: t('基金', 'Funds', '基金') },
    { value: "other", label: t('其他', 'Other', '其他') },
  ];

  const [authorizedShareCapital, setAuthorizedShareCapital] = useState("");
  const [issuedShareCapital, setIssuedShareCapital] = useState("");
  const [initialSourceOfWealth, setInitialSourceOfWealth] = useState<string[]>([]);
  const [netAssetValue, setNetAssetValue] = useState("");
  const [netAssetAuditDate, setNetAssetAuditDate] = useState("");
  const [netAssetAuditDateDisplay, setNetAssetAuditDateDisplay] = useState("");
  const [profitAfterTax, setProfitAfterTax] = useState("");
  const [profitAuditDate, setProfitAuditDate] = useState("");
  const [profitAuditDateDisplay, setProfitAuditDateDisplay] = useState("");
  const [assetItems, setAssetItems] = useState<string[]>([]);
  const [experiencedProducts, setExperiencedProducts] = useState<string[]>([]);
  const [experiencedProductsOther, setExperiencedProductsOther] = useState("");
  const [assetItemsOther, setAssetItemsOther] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading } = trpc.corporateFinancial.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  useEffect(() => {
    if (existingData) {
      setAuthorizedShareCapital(existingData.authorizedShareCapital || "");
      setIssuedShareCapital(existingData.issuedShareCapital || "");
      setNetAssetValue(existingData.netAssetValue || "");
      setNetAssetAuditDate(existingData.netAssetAuditDate || "");
      setNetAssetAuditDateDisplay(toMMYYYY(existingData.netAssetAuditDate || ""));
      setProfitAfterTax(existingData.profitAfterTax || "");
      setProfitAuditDate(existingData.profitAuditDate || "");
      setProfitAuditDateDisplay(toMMYYYY(existingData.profitAuditDate || ""));
      try {
        setInitialSourceOfWealth(JSON.parse(existingData.initialSourceOfWealth || "[]"));
        setAssetItems(JSON.parse(existingData.assetItems || "[]"));
        setExperiencedProducts(JSON.parse(existingData.experiencedProducts || "[]"));
      } catch (e) {
        console.error(e);
      }
    }
  }, [existingData]);

  const saveMutation = trpc.corporateFinancial.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`)
  });

  const saveOnlyMutation = trpc.corporateFinancial.save.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success(t('保存成功', 'Saved successfully', '保存成功'));
    },
    onError: (error) => toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`)
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!authorizedShareCapital) newErrors.authorizedShareCapital = t('此欄位必填', 'This field is required', '此栏位必填');
    if (!issuedShareCapital) newErrors.issuedShareCapital = t('此欄位必填', 'This field is required', '此栏位必填');
    if (initialSourceOfWealth.length === 0) newErrors.initialSourceOfWealth = t('請至少選擇一項', 'Please select at least one', '请至少选择一项');
    if (!netAssetValue) newErrors.netAssetValue = t('請選擇淨資產值', 'Please select net asset value', '请选择净资产值');
    if (!netAssetAuditDate) newErrors.netAssetAuditDate = t('請填寫淨資產審計時間', 'Please enter net asset audit date', '请填写净资产审计时间');
    if (!profitAfterTax) newErrors.profitAfterTax = t('請選擇稅後盈利', 'Please select profit after tax', '请选择税后盈利');
    if (!profitAuditDate) newErrors.profitAuditDate = t('請填寫稅後盈利審計時間', 'Please enter profit audit date', '请填写税后盈利审计时间');
    // 曾投資產品和資產項目已移至步驟4
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPayload = () => ({
    applicationId,
    authorizedShareCapital,
    issuedShareCapital,
    initialSourceOfWealth,
    netAssetValue,
    netAssetAuditDate,
    profitAfterTax,
    profitAuditDate,
    assetItems,
    assetItemsOther,
    experiencedProducts,
    experiencedProductsOther,
  });

  if (isLoading) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={stepNum} showReturnToPreview={showReturnToPreview}>
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={stepNum}
      onNext={() => validate() && saveMutation.mutate(getPayload())}
      onSave={() => validate() && saveOnlyMutation.mutate(getPayload())}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-800">{t('法定股本', 'Authorized Share Capital', '法定股本')} <span className="text-destructive">*</span></Label>
          <div className="flex items-center gap-2">
            <Input 
              className="bg-yellow-50 border-2 border-yellow-300 focus:border-blue-500 font-semibold" 
              value={authorizedShareCapital} 
              onChange={e => setAuthorizedShareCapital(e.target.value)}
              placeholder={t('請輸入金額', 'Enter amount', '请输入金额')}
            />
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">{t('萬港元', '0,000 HKD', '万港元')}</span>
          </div>
          {errors.authorizedShareCapital && <p className="text-sm text-destructive">{errors.authorizedShareCapital}</p>}
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-800">{t('已發行及繳足股本', 'Issued Share Capital', '已发行及缴足股本')} <span className="text-destructive">*</span></Label>
          <div className="flex items-center gap-2">
            <Input 
              className="bg-yellow-50 border-2 border-yellow-300 focus:border-blue-500 font-semibold" 
              value={issuedShareCapital} 
              onChange={e => setIssuedShareCapital(e.target.value)}
              placeholder={t('請輸入金額', 'Enter amount', '请输入金额')}
            />
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">{t('萬港元', '0,000 HKD', '万港元')}</span>
          </div>
          {errors.issuedShareCapital && <p className="text-sm text-destructive">{errors.issuedShareCapital}</p>}
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-800">{t('初始財富來源', 'Initial Source of Wealth', '初始财富来源')} <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            {incomeSources.map(src => (
              <div key={src.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`wealth-${src.value}`}
                  className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  checked={initialSourceOfWealth.includes(src.value)}
                  onCheckedChange={() => setInitialSourceOfWealth(prev => prev.includes(src.value) ? prev.filter(v => v !== src.value) : [...prev, src.value])}
                />
                <Label htmlFor={`wealth-${src.value}`} className="font-medium text-slate-700">{src.label}</Label>
              </div>
            ))}
          </div>
          {errors.initialSourceOfWealth && <p className="text-sm text-destructive">{errors.initialSourceOfWealth}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold text-slate-800">{t('淨資產值', 'Net Asset Value', '净资产值')} <span className="text-destructive">*</span></Label>
            <Select value={netAssetValue} onValueChange={setNetAssetValue}>
              <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-blue-500"><SelectValue placeholder={t('選擇範圍', 'Select range', '选择范围')} /></SelectTrigger>
              <SelectContent>{valueRanges.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.netAssetValue && <p className="text-sm text-destructive">{errors.netAssetValue}</p>}
          </div>
          <div className="space-y-4">
            <Label className="text-base font-semibold text-slate-800">{t('淨資產審計時間 (MM/YYYY)', 'Net Asset Audit Date (MM/YYYY)', '净资产审计时间 (MM/YYYY)')} <span className="text-destructive">*</span></Label>
            <Input 
              type="text"
              className="bg-white border-2 border-slate-300 focus:border-blue-500" 
              value={netAssetAuditDateDisplay}
              placeholder="MM/YYYY"
              maxLength={7}
              onChange={e => {
                const formatted = formatDateInput(e.target.value, netAssetAuditDateDisplay);
                setNetAssetAuditDateDisplay(formatted);
                setNetAssetAuditDate(toYYYYMM(formatted));
              }}
            />
            {errors.netAssetAuditDate && <p className="text-sm text-destructive">{errors.netAssetAuditDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold text-slate-800">{t('稅後盈利', 'Profit After Tax', '税后盈利')} <span className="text-destructive">*</span></Label>
            <Select value={profitAfterTax} onValueChange={setProfitAfterTax}>
              <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-blue-500"><SelectValue placeholder={t('選擇範圍', 'Select range', '选择范围')} /></SelectTrigger>
              <SelectContent>{valueRanges.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.profitAfterTax && <p className="text-sm text-destructive">{errors.profitAfterTax}</p>}
          </div>
          <div className="space-y-4">
            <Label className="text-base font-semibold text-slate-800">{t('稅後盈利審計時間 (MM/YYYY)', 'Profit Audit Date (MM/YYYY)', '税后盈利审计时间 (MM/YYYY)')} <span className="text-destructive">*</span></Label>
            <Input 
              type="text"
              className="bg-white border-2 border-slate-300 focus:border-blue-500" 
              value={profitAuditDateDisplay}
              placeholder="MM/YYYY"
              maxLength={7}
              onChange={e => {
                const formatted = formatDateInput(e.target.value, profitAuditDateDisplay);
                setProfitAuditDateDisplay(formatted);
                setProfitAuditDate(toYYYYMM(formatted));
              }}
            />
            {errors.profitAuditDate && <p className="text-sm text-destructive">{errors.profitAuditDate}</p>}
          </div>
        </div>

        {/* 曾投資產品和資產項目已移至步驟4「公司投資經驗與目標」 */}
      </div>
    </ApplicationWizard>
  );
}
