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

const investmentObjectivesList = [
  { value: "short_term", label: "短線 / Short Term" },
  { value: "medium_term", label: "中線 / Medium Term" },
  { value: "long_term", label: "长線 / Long Term" },
  { value: "capital_appreciation", label: "資本增值 / Capital Appreciation" },
  { value: "dividend_yield", label: "股息回報 / Dividend Yield" },
  { value: "hedging", label: "對沖 / Hedging" },
  { value: "speculation", label: "投機 / Speculation" },
  { value: "other", label: "其他 / Other" },
];

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

const investmentExperienceOptions = [
  { value: "nil", label: "沒有 / Nil" },
  { value: "<1y", label: "少於1年 / Less than a year" },
  { value: "1-5y", label: "1-5年 / 1-5 years" },
  { value: "6-10y", label: "6-10年 / 6-10 years" },
  { value: ">10y", label: "10年以上 / More than 10 years" },
];

const derivativesKnowledgeOptions = [
  { value: "a", label: "代表本公司作出投資決定的人，已接受有關衍生產品的性質或風險的培訓或課程（如由學術機構或金融機構所提供之網上課程或教室課程）/ The person(s) who is/are responsible for making investment decisions for or on our behalf has/have undergone training or attended courses that provide general knowledge of nature or risk of derivatives (e.g. relevant online or classroom courses offered by academic institutions or financial institutions)" },
  { value: "b", label: "代表本公司作出投資決定的人，已有相關之交易經驗，即於過去三年內已進行了五次或以上有關衍生產品交易。（如：衍生權證，牛熊證，股票/指數期貨及期權，商品結構性產品及交易所基金等，無論是否於交易所進行的交易）/ The person(s) who is/are responsible for making investment decisions for or on our behalf has/have relevant trading experience, i.e. has/have executed 5 or more transactions in derivatives in the past 3 years (e.g. derivative warrants, CBBCs, stock/index futures and options, commodity structured products and ETFs, whether or not traded on an exchange)" },
  { value: "c", label: "代表本公司作出投資決定的人，現時或過去從事衍生產品有關的工作經驗。/ The person(s) who is/are responsible for making investment decisions for or on our behalf has/have current or previous work experience related to derivatives." },
  { value: "d", label: "本公司對衍生產品沒有任何認識。/ We do not have any knowledge of derivatives." },
];

const experiencedProductsList = [
  { value: "stocks", label: "股票投資 / Stocks" },
  { value: "derivative_warrants", label: "衍生權證 / Derivative Warrants" },
  { value: "futures_options", label: "期貨/期權 / Futures/Options" },
  { value: "forex_bullion", label: "外匯/黃金 / Forex/Bullion" },
  { value: "bonds", label: "債券 / Bonds" },
  { value: "funds", label: "基金 / Funds" },
  { value: "other", label: "其他 / Other" },
];

const assetItemsList = [
  { value: "property", label: "房地產 / Property" },
  { value: "securities", label: "上市證券 / Listed Securities" },
  { value: "deposit", label: "存款 / Deposit" },
  { value: "bonds", label: "債券 / Bonds" },
  { value: "funds", label: "基金 / Funds" },
  { value: "other", label: "其他 / Other" },
];

interface Props {
  applicationId: number;
  stepNum: number;
}

export default function CorporateInvestment({ applicationId, stepNum }: Props) {
  const [, setLocation] = useLocation();
  const showReturnToPreview = useReturnToPreview();

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
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`保存失敗: ${error.message}`)
  });

  const saveOnlyMutation = trpc.corporateInvestment.save.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success("保存成功");
    },
    onError: (error) => toast.error(`保存失敗: ${error.message}`)
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (investmentObjectives.length === 0) newErrors.investmentObjectives = "請至少選擇一項";
    if (!estimatedInvestmentAmount) newErrors.estimatedInvestmentAmount = "請選擇預計投資金額";
    if (!riskVolatility) newErrors.riskVolatility = "請選擇可承受波幅";
    if (!investmentExperience) newErrors.investmentExperience = "請選擇投資經驗";
    if (!knowledgeOfDerivatives) newErrors.knowledgeOfDerivatives = "請選擇對衍生產品認識";
    if (experiencedProducts.length === 0) newErrors.experiencedProducts = "請至少選擇一項";
    if (assetItems.length === 0) newErrors.assetItems = "請至少選擇一項";
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
          <Label className="text-base font-semibold text-slate-800">投資目標 / Investment Objective <span className="text-destructive">*</span></Label>
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
              <Label className="text-sm text-slate-600">其他說明 / Other:</Label>
              <Input
                value={investmentObjectivesOther}
                onChange={e => setInvestmentObjectivesOther(e.target.value)}
                onBlur={() => setInvestmentObjectivesOther(convertToTraditional(investmentObjectivesOther))}
                placeholder="請輸入其他投資目標"
                className="flex-1"
              />
            </div>
          )}
          {errors.investmentObjectives && <p className="text-sm text-destructive">{errors.investmentObjectives}</p>}
        </div>

        {/* 預計投資金額 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-800">預計投資金額 / Estimated Investment Amount <span className="text-destructive">*</span></Label>
          <Select value={estimatedInvestmentAmount} onValueChange={setEstimatedInvestmentAmount}>
            <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-blue-500"><SelectValue placeholder="選擇範圍" /></SelectTrigger>
            <SelectContent>{estimatedAmountOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          {errors.estimatedInvestmentAmount && <p className="text-sm text-destructive">{errors.estimatedInvestmentAmount}</p>}
        </div>

        {/* 可承受波幅 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-800">可承受波幅 / Risk Volatility <span className="text-destructive">*</span></Label>
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
          <Label className="text-base font-semibold text-slate-800">投資經驗 / Investment Experience <span className="text-destructive">*</span></Label>
          <Select value={investmentExperience} onValueChange={setInvestmentExperience}>
            <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-blue-500"><SelectValue placeholder="選擇投資經驗" /></SelectTrigger>
            <SelectContent>{investmentExperienceOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          {errors.investmentExperience && <p className="text-sm text-destructive">{errors.investmentExperience}</p>}
        </div>

        {/* 衍生產品認識 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-800">對衍生產品認識 / Knowledge of Derivatives <span className="text-destructive">*</span></Label>
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
          <Label className="text-base font-semibold text-slate-800">曾投資產品 / Experienced Products <span className="text-destructive">*</span></Label>
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
              <Label className="text-sm text-slate-600">其他說明 / Other:</Label>
              <Input
                value={experiencedProductsOther}
                onChange={e => setExperiencedProductsOther(e.target.value)}
                onBlur={() => setExperiencedProductsOther(convertToTraditional(experiencedProductsOther))}
                placeholder="請輸入其他投資產品"
                className="flex-1"
              />
            </div>
          )}
          {errors.experiencedProducts && <p className="text-sm text-destructive">{errors.experiencedProducts}</p>}
        </div>

        {/* 資產項目 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-800">資產項目 / Asset Items <span className="text-destructive">*</span></Label>
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
              <Label className="text-sm text-slate-600">其他說明 / Other:</Label>
              <Input
                value={assetItemsOther}
                onChange={e => setAssetItemsOther(e.target.value)}
                onBlur={() => setAssetItemsOther(convertToTraditional(assetItemsOther))}
                placeholder="請輸入其他資產項目"
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
