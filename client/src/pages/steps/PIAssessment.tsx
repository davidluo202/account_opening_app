import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLang } from '@/lib/i18n';

const piClassificationOptions = [
  { value: "type_a", label: "Type A: 個人 Individual — 投資組合 ≥ HK$8M" },
  { value: "type_b", label: "Type B: 法團/合夥 Corporate/Partnership — 投資組合 ≥ HK$8M 或 總資產 ≥ HK$40M" },
  { value: "type_c", label: "Type C: 信託法團 Trust Corporation — 總資產 ≥ HK$40M" },
  { value: "type_d", label: "Type D: 其他法團 Other Corporation — 唯一業務為持有投資" },
];

const productsList = [
  { value: "equities", label: "股票 Equities" },
  { value: "futures_options", label: "期貨及期權 Futures/Options" },
  { value: "cbb", label: "牛熊證 CBBCs" },
  { value: "funds", label: "基金 Funds" },
  { value: "bonds", label: "債券 Bonds" },
  { value: "equity_linked", label: "股票掛鈎產品 Equity-linked" },
  { value: "others", label: "其他 Others" },
];

const regionOptions = [
  { value: "hong_kong", label: "香港" },
  { value: "mainland_china", label: "中國內地" },
  { value: "usa", label: "美國" },
  { value: "europe", label: "歐洲" },
  { value: "other", label: "其他" },
];

const yearsOfExperienceOptions = [
  { value: "<2", label: "少於2年 < 2 years" },
  { value: "2-5", label: "2-5年 2-5 years" },
  { value: "5-10", label: "5-10年 5-10 years" },
  { value: ">10", label: "10年以上 > 10 years" },
];

const portfolioValueOptions = [
  { value: "a", label: "A: < HK$500,000" },
  { value: "b", label: "B: HK$500,001 – HK$999,999" },
  { value: "c", label: "C: HK$1,000,000 – HK$7,999,999" },
  { value: "d", label: "D: HK$8,000,000 – HK$39,999,999" },
  { value: "e", label: "E: > HK$40,000,000" },
];

interface ProductExperience {
  hasExperience: boolean;
  tradingRegion: string;
}

interface Props {
  applicationId: number;
  stepNum: number;
}

export default function PIAssessment({ applicationId, stepNum }: Props) {
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const showReturnToPreview = useReturnToPreview();

  const [piClassification, setPiClassification] = useState("");
  const [productExperiences, setProductExperiences] = useState<Record<string, ProductExperience>>(() => {
    const init: Record<string, ProductExperience> = {};
    productsList.forEach(p => { init[p.value] = { hasExperience: false, tradingRegion: "" }; });
    return init;
  });
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [portfolioValue, setPortfolioValue] = useState("");
  const [signorName, setSignorName] = useState("");
  const [signorTitle, setSignorTitle] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading } = trpc.piAssessment.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  useEffect(() => {
    if (existingData?.assessment_data) {
      try {
        const parsed = typeof existingData.assessment_data === 'string'
          ? JSON.parse(existingData.assessment_data)
          : existingData.assessment_data;
        if (parsed.piClassification) setPiClassification(parsed.piClassification);
        if (parsed.productExperiences) setProductExperiences(parsed.productExperiences);
        if (parsed.yearsOfExperience) setYearsOfExperience(parsed.yearsOfExperience);
        if (parsed.portfolioValue) setPortfolioValue(parsed.portfolioValue);
        if (parsed.signorName) setSignorName(parsed.signorName);
        if (parsed.signorTitle) setSignorTitle(parsed.signorTitle);
      } catch (e) {
        console.error("Failed to parse PI assessment data:", e);
      }
    }
  }, [existingData]);

  const saveMutation = trpc.piAssessment.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`)
  });

  const saveOnlyMutation = trpc.piAssessment.save.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success(t('保存成功', 'Saved successfully', '保存成功'));
    },
    onError: (error) => toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`)
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!piClassification) newErrors.piClassification = t('請選擇專業投資者類別', 'Please select PI classification', '请选择专业投资者类别');
    if (!yearsOfExperience) newErrors.yearsOfExperience = t('請選擇投資經驗年限', 'Please select years of experience', '请选择投资经验年限');
    if (!portfolioValue) newErrors.portfolioValue = t('請選擇投資組合總值', 'Please select portfolio value', '请选择投资组合总值');
    if (!signorName.trim()) newErrors.signorName = t('請填寫授權簽署人姓名', 'Please enter authorized signor name', '请填写授权签署人姓名');
    if (!signorTitle.trim()) newErrors.signorTitle = t('請填寫授權簽署人職銜', 'Please enter authorized signor title', '请填写授权签署人职衔');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPayload = () => ({
    applicationId,
    assessmentData: JSON.stringify({
      piClassification,
      productExperiences,
      yearsOfExperience,
      portfolioValue,
      signorName,
      signorTitle,
    }),
  });

  const updateProductExperience = (productKey: string, field: keyof ProductExperience, value: any) => {
    setProductExperiences(prev => ({
      ...prev,
      [productKey]: { ...prev[productKey], [field]: value },
    }));
  };

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
        {/* Section 1: PI Classification */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">
              {t('專業投資者類別', 'PI Classification', '专业投资者类别')} <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">{t('根據CMF009表格選擇適用類別', 'Select applicable category per CMF009 form', '根据CMF009表格选择适用类别')}</p>
          </div>
          <RadioGroup value={piClassification} onValueChange={setPiClassification} className="space-y-3 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            {piClassificationOptions.map(opt => (
              <div key={opt.value} className="flex items-start space-x-3">
                <RadioGroupItem value={opt.value} id={`pi-class-${opt.value}`} className="mt-1" />
                <Label htmlFor={`pi-class-${opt.value}`} className="font-medium text-slate-700 leading-relaxed">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {errors.piClassification && <p className="text-sm text-destructive">{errors.piClassification}</p>}
        </div>

        {/* Section 2: Investment Experience per Product */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">
              {t('投資產品經驗', 'Investment Product Experience', '投资产品经验')}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">{t('過往交易經驗（過去1年曾有≥5次交易）', 'Past trading experience (≥5 transactions in the past year)', '过往交易经验（过去1年曾有≥5次交易）')}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-200 space-y-4">
            {productsList.map(product => (
              <div key={product.value} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white rounded-md border">
                <div className="flex items-center space-x-3 min-w-[200px]">
                  <Checkbox
                    id={`exp-${product.value}`}
                    className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    checked={productExperiences[product.value]?.hasExperience || false}
                    onCheckedChange={(checked) => updateProductExperience(product.value, 'hasExperience', !!checked)}
                  />
                  <Label htmlFor={`exp-${product.value}`} className="font-medium text-slate-700">{product.label}</Label>
                </div>
                {productExperiences[product.value]?.hasExperience && (
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Label className="text-sm text-slate-600 whitespace-nowrap">{t('交易地區', 'Trading Region', '交易地区')}:</Label>
                    <Select
                      value={productExperiences[product.value]?.tradingRegion || ""}
                      onValueChange={(val) => updateProductExperience(product.value, 'tradingRegion', val)}
                    >
                      <SelectTrigger className="w-[160px] bg-white border-2 border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder={t('選擇地區', 'Select region', '选择地区')} />
                      </SelectTrigger>
                      <SelectContent>
                        {regionOptions.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Years of Experience */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">
              {t('投資經驗年限', 'Years of Investment Experience', '投资经验年限')} <span className="text-destructive">*</span>
            </Label>
          </div>
          <RadioGroup value={yearsOfExperience} onValueChange={setYearsOfExperience} className="flex flex-wrap gap-6">
            {yearsOfExperienceOptions.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`years-${opt.value}`} />
                <Label htmlFor={`years-${opt.value}`} className="font-medium text-slate-700">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {errors.yearsOfExperience && <p className="text-sm text-destructive">{errors.yearsOfExperience}</p>}
        </div>

        {/* Section 4: Portfolio Value */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">
              {t('投資組合總值 (HKD)', 'Total Portfolio Value (HKD)', '投资组合总值 (HKD)')} <span className="text-destructive">*</span>
            </Label>
          </div>
          <RadioGroup value={portfolioValue} onValueChange={setPortfolioValue} className="space-y-3 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            {portfolioValueOptions.map(opt => (
              <div key={opt.value} className="flex items-center space-x-3">
                <RadioGroupItem value={opt.value} id={`portfolio-${opt.value}`} />
                <Label htmlFor={`portfolio-${opt.value}`} className="font-medium text-slate-700">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {errors.portfolioValue && <p className="text-sm text-destructive">{errors.portfolioValue}</p>}
        </div>

        {/* Section 5: Authorized Signor */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">
              {t('授權簽署人', 'Authorized Signor', '授权签署人')} <span className="text-destructive">*</span>
            </Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">{t('姓名', 'Name', '姓名')}</Label>
              <Input
                value={signorName}
                onChange={e => setSignorName(e.target.value)}
                placeholder={t('請輸入授權簽署人姓名', 'Enter authorized signor name', '请输入授权签署人姓名')}
                className="max-w-md"
              />
              {errors.signorName && <p className="text-sm text-destructive">{errors.signorName}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">{t('職銜', 'Title', '职衔')}</Label>
              <Input
                value={signorTitle}
                onChange={e => setSignorTitle(e.target.value)}
                placeholder={t('請輸入授權簽署人職銜', 'Enter authorized signor title', '请输入授权签署人职衔')}
                className="max-w-md"
              />
              {errors.signorTitle && <p className="text-sm text-destructive">{errors.signorTitle}</p>}
            </div>
          </div>
        </div>
      </div>
    </ApplicationWizard>
  );
}
