import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { useLang } from '@/lib/i18n';

const estimatedAmountOptions = [
  { value: "<1m", label: "<HK$1,000,000" },
  { value: "1m-5m", label: "HK$1,000,000 - HK$5,000,000" },
  { value: "5m-10m", label: "HK$5,000,001 - HK$10,000,000" },
  { value: ">10m", label: ">HK$10,000,000" },
];

const riskVolatilityOptions = [
  { value: "10", label: "\u00b110%" },
  { value: "20", label: "\u00b120%" },
  { value: "30", label: "\u00b130%" },
];

interface Props {
  applicationId: number;
  stepNum: number;
}

export default function CorporateInvestment({ applicationId, stepNum }: Props) {
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const showReturnToPreview = useReturnToPreview();

  const investmentObjectivesList = [
    { value: "short_term", label: t('短線', 'Short Term', '短线') },
    { value: "medium_term", label: t('中線', 'Medium Term', '中线') },
    { value: "long_term", label: t('長線', 'Long Term', '长线') },
    { value: "capital_appreciation", label: t('資本增值', 'Capital Appreciation', '资本增值') },
    { value: "dividend_yield", label: t('股息回報', 'Dividend Yield', '股息回报') },
    { value: "hedging", label: t('對沖', 'Hedging', '对冲') },
    { value: "speculation", label: t('投機', 'Speculation', '投机') },
    { value: "other", label: t('其他', 'Other', '其他') },
  ];

  const investmentExperienceOptions = [
    { value: "nil", label: t('沒有', 'Nil', '没有') },
    { value: "<1y", label: t('少於1年', 'Less than a year', '少于1年') },
    { value: "1-5y", label: t('1-5年', '1-5 years', '1-5年') },
    { value: "6-10y", label: t('6-10年', '6-10 years', '6-10年') },
    { value: ">10y", label: t('10年以上', 'More than 10 years', '10年以上') },
  ];

  const derivativesKnowledgeOptions = [
    { value: "a", label: t('代表本公司作出投資決定的人，已接受有關衍生產品的性質或風險的培訓或課程（如由學術機構或金融機構所提供之網上課程或教室課程）', 'The person(s) who is/are responsible for making investment decisions for or on our behalf has/have undergone training or attended courses that provide general knowledge of nature or risk of derivatives (e.g. relevant online or classroom courses offered by academic institutions or financial institutions)', '代表本公司作出投资决定的人，已接受有关衍生产品的性质或风险的培训或课程（如由学术机构或金融机构所提供之网上课程或教室课程）') },
    { value: "b", label: t('代表本公司作出投資決定的人，已有相關之交易經驗，即於過去三年內已進行了五次或以上有關衍生產品交易。（如：衍生權證，牛熊證，股票/指數期貨及期權，商品結構性產品及交易所基金等，無論是否於交易所進行的交易）', 'The person(s) who is/are responsible for making investment decisions for or on our behalf has/have relevant trading experience, i.e. has/have executed 5 or more transactions in derivatives in the past 3 years (e.g. derivative warrants, CBBCs, stock/index futures and options, commodity structured products and ETFs, whether or not traded on an exchange)', '代表本公司作出投资决定的人，已有相关之交易经验，即于过去三年内已进行了五次或以上有关衍生产品交易。（如：衍生权证，牛熊证，股票/指数期货及期权，商品结构性产品及交易所基金等，无论是否于交易所进行的交易）') },
    { value: "c", label: t('代表本公司作出投資決定的人，現時或過去從事衍生產品有關的工作經驗。', 'The person(s) who is/are responsible for making investment decisions for or on our behalf has/have current or previous work experience related to derivatives.', '代表本公司作出投资决定的人，现时或过去从事衍生产品有关的工作经验。') },
    { value: "d", label: t('本公司對衍生產品沒有任何認識。', 'We do not have any knowledge of derivatives.', '本公司对衍生产品没有任何认识。') },
  ];

  const experiencedProductsList = [
    { value: "stocks", label: t('股票投資', 'Stocks', '股票投资') },
    { value: "derivative_warrants", label: t('衍生權證', 'Derivative Warrants', '衍生权证') },
    { value: "futures_options", label: t('期貨/期權', 'Futures/Options', '期货/期权') },
    { value: "forex_bullion", label: t('外匯/黃金', 'Forex/Bullion', '外汇/黄金') },
    { value: "bonds", label: t('債券', 'Bonds', '债券') },
    { value: "funds", label: t('基金', 'Funds', '基金') },
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

  const [investmentObjectives, setInvestmentObjectives] = useState<string[]>([]);
  const [investmentObjectivesOther, setInvestmentObjectivesOther] = useState("");
  const [estimatedInvestmentAmount, setEstimatedInvestmentAmount] = useState("");
  const [riskVolatility, setRiskVolatility] = useState("");
  const [investmentExperience, setInvestmentExperience] = useState("");
  const [knowledgeOfDerivatives, setKnowledgeOfDerivatives] = useState("");
  const [experiencedProducts, setExperiencedProducts] = useState<string[]>([]);
  const [experiencedProductsOther, setExperiencedProductsOther] = useState("");
  const [assetItems, setAssetItems] = useState<string[]>([]);
  const [assetItemsOther, setAssetItemsOther] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading } = trpc.corporateInvestment.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  useEffect(() => {
    if (existingData) {
      try {
        setInvestmentObjectives(JSON.parse(existingData.investmentObjectives || "[]"));
        setExperiencedProducts(JSON.parse(existingData.experiencedProducts || "[]"));
        setAssetItems(JSON.parse(existingData.assetItems || "[]"));
      } catch (e) {
        console.error(e);
      }
      setInvestmentObjectivesOther(existingData.investmentObjectivesOther || "");
      setEstimatedInvestmentAmount(existingData.estimatedInvestmentAmount || "");
      setRiskVolatility(existingData.riskVolatility || "");
      setInvestmentExperience(existingData.investmentExperience || "");
      setKnowledgeOfDerivatives(existingData.knowledgeOfDerivatives || "");
      setExperiencedProductsOther(existingData.experiencedProductsOther || "");
      setAssetItemsOther(existingData.assetItemsOther || "");
    }
  }, [existingData]);

  const saveMutation = trpc.corporateInvestment.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`)
  });

  const saveOnlyMutation = trpc.corporateInvestment.save.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success(t('保存成功', 'Saved successfully', '保存成功'));
    },
    onError: (error) => toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`)
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (investmentObjectives.length === 0) newErrors.investmentObjectives = t('請至少選擇一項', 'Please select at least one', '请至少选择一项');
    if (!estimatedInvestmentAmount) newErrors.estimatedInvestmentAmount = t('請選擇預計投資金額', 'Please select estimated investment amount', '请选择预计投资金额');
    if (!riskVolatility) newErrors.riskVolatility = t('請選擇可承受波幅', 'Please select risk volatility', '请选择可承受波幅');
    if (!investmentExperience) newErrors.investmentExperience = t('請選擇投資經驗', 'Please select investment experience', '请选择投资经验');
    if (!knowledgeOfDerivatives) newErrors.knowledgeOfDerivatives = t('請選擇對衍生產品認識', 'Please select knowledge of derivatives', '请选择对衍生产品认识');
    if (experiencedProducts.length === 0) newErrors.experiencedProducts = t('請至少選擇一項', 'Please select at least one', '请至少选择一项');
    if (assetItems.length === 0) newErrors.assetItems = t('請至少選擇一項', 'Please select at least one', '请至少选择一项');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPayload = () => ({
    applicationId,
    investmentObjectives,
    investmentObjectivesOther,
    estimatedInvestmentAmount,
    riskVolatility,
    investmentExperience,
    knowledgeOfDerivatives,
    experiencedProducts,
    experiencedProductsOther,
    assetItems,
    assetItemsOther,
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
        {/* 投資目標 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">{t('投資目標', 'Investment Objectives', '投资目标')} <span className="text-destructive">*</span></Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            {investmentObjectivesList.map(item => (
              <div key={item.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`objective-${item.value}`}
                  className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  checked={investmentObjectives.includes(item.value)}
                  onCheckedChange={() => setInvestmentObjectives(prev => prev.includes(item.value) ? prev.filter(v => v !== item.value) : [...prev, item.value])}
                />
                <Label htmlFor={`objective-${item.value}`} className="font-medium text-slate-700">{item.label}</Label>
              </div>
            ))}
          </div>
          {investmentObjectives.includes("other") && (
            <div className="flex gap-2 items-center">
              <Label className="text-sm text-slate-600">{t('其他說明', 'Other', '其他说明')}:</Label>
              <Input
                value={investmentObjectivesOther}
                onChange={e => setInvestmentObjectivesOther(e.target.value)}
                onBlur={() => setInvestmentObjectivesOther(convertToTraditional(investmentObjectivesOther))}
                placeholder={t('請輸入其他投資目標', 'Enter other investment objectives', '请输入其他投资目标')}
                className="flex-1"
              />
            </div>
          )}
          {errors.investmentObjectives && <p className="text-sm text-destructive">{errors.investmentObjectives}</p>}
        </div>

        {/* 預計投資金額 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">{t('預計投資金額', 'Estimated Investment Amount', '预计投资金额')} <span className="text-destructive">*</span></Label>
          </div>
          <Select value={estimatedInvestmentAmount} onValueChange={setEstimatedInvestmentAmount}>
            <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-blue-500"><SelectValue placeholder={t('選擇範圍', 'Select range', '选择范围')} /></SelectTrigger>
            <SelectContent>{estimatedAmountOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          {errors.estimatedInvestmentAmount && <p className="text-sm text-destructive">{errors.estimatedInvestmentAmount}</p>}
        </div>

        {/* 可承受波幅 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">{t('可承受波幅', 'Risk Volatility', '可承受波幅')} <span className="text-destructive">*</span></Label>
          </div>
          <RadioGroup value={riskVolatility} onValueChange={setRiskVolatility} className="flex gap-6">
            {riskVolatilityOptions.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`volatility-${opt.value}`} />
                <Label htmlFor={`volatility-${opt.value}`} className="font-medium text-slate-700">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {errors.riskVolatility && <p className="text-sm text-destructive">{errors.riskVolatility}</p>}
        </div>

        {/* 投資經驗 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">{t('投資經驗', 'Investment Experience', '投资经验')} <span className="text-destructive">*</span></Label>
          </div>
          <Select value={investmentExperience} onValueChange={setInvestmentExperience}>
            <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-blue-500"><SelectValue placeholder={t('選擇投資經驗', 'Select investment experience', '选择投资经验')} /></SelectTrigger>
            <SelectContent>{investmentExperienceOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          {errors.investmentExperience && <p className="text-sm text-destructive">{errors.investmentExperience}</p>}
        </div>

        {/* 衍生產品認識 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">{t('對衍生產品認識', 'Knowledge of Derivatives', '对衍生产品认识')} <span className="text-destructive">*</span></Label>
          </div>
          <RadioGroup value={knowledgeOfDerivatives} onValueChange={setKnowledgeOfDerivatives} className="space-y-3 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            {derivativesKnowledgeOptions.map(opt => (
              <div key={opt.value} className="flex items-start space-x-3">
                <RadioGroupItem value={opt.value} id={`derivatives-${opt.value}`} className="mt-1" />
                <Label htmlFor={`derivatives-${opt.value}`} className="font-medium text-slate-700 leading-relaxed">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {errors.knowledgeOfDerivatives && <p className="text-sm text-destructive">{errors.knowledgeOfDerivatives}</p>}
        </div>

        {/* 曾投資產品 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">{t('曾投資產品', 'Experienced Products', '曾投资产品')} <span className="text-destructive">*</span></Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            {experiencedProductsList.map(item => (
              <div key={item.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`inv-experienced-${item.value}`}
                  className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  checked={experiencedProducts.includes(item.value)}
                  onCheckedChange={() => setExperiencedProducts(prev => prev.includes(item.value) ? prev.filter(v => v !== item.value) : [...prev, item.value])}
                />
                <Label htmlFor={`inv-experienced-${item.value}`} className="font-medium text-slate-700">{item.label}</Label>
              </div>
            ))}
          </div>
          {experiencedProducts.includes("other") && (
            <div className="flex gap-2 items-center">
              <Label className="text-sm text-slate-600">{t('其他說明', 'Other', '其他说明')}:</Label>
              <Input
                value={experiencedProductsOther}
                onChange={e => setExperiencedProductsOther(e.target.value)}
                onBlur={() => setExperiencedProductsOther(convertToTraditional(experiencedProductsOther))}
                placeholder={t('請輸入其他投資產品', 'Enter other investment products', '请输入其他投资产品')}
                className="flex-1"
              />
            </div>
          )}
          {errors.experiencedProducts && <p className="text-sm text-destructive">{errors.experiencedProducts}</p>}
        </div>

        {/* 資產項目 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-800">{t('資產項目', 'Asset Items', '资产项目')} <span className="text-destructive">*</span></Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            {assetItemsList.map(item => (
              <div key={item.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`inv-asset-${item.value}`}
                  className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  checked={assetItems.includes(item.value)}
                  onCheckedChange={() => setAssetItems(prev => prev.includes(item.value) ? prev.filter(v => v !== item.value) : [...prev, item.value])}
                />
                <Label htmlFor={`inv-asset-${item.value}`} className="font-medium text-slate-700">{item.label}</Label>
              </div>
            ))}
          </div>
          {assetItems.includes("other") && (
            <div className="flex gap-2 items-center">
              <Label className="text-sm text-slate-600">{t('其他說明', 'Other', '其他说明')}:</Label>
              <Input
                value={assetItemsOther}
                onChange={e => setAssetItemsOther(e.target.value)}
                onBlur={() => setAssetItemsOther(convertToTraditional(assetItemsOther))}
                placeholder={t('請輸入其他資產項目', 'Enter other asset items', '请输入其他资产项目')}
                className="flex-1"
              />
            </div>
          )}
          {errors.assetItems && <p className="text-sm text-destructive">{errors.assetItems}</p>}
        </div>
      </div>
    </ApplicationWizard>
  );
}
