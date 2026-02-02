import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const investmentObjectiveOptions = [
  { value: "capital_growth", label: "資本增值 / Capital Growth" },
  { value: "income_generation", label: "收入產生 / Income Generation" },
  { value: "capital_preservation", label: "資本保值 / Capital Preservation" },
  { value: "speculation", label: "投機 / Speculation" },
  { value: "hedging", label: "對沖 / Hedging" },
];

const investmentProducts = [
  { key: "stocks", label: "股票 / Stocks" },
  { key: "bonds", label: "債券 / Bonds" },
  { key: "funds", label: "基金 / Funds" },
  { key: "derivatives", label: "衍生品 / Derivatives" },
  { key: "forex", label: "外匯 / Forex" },
  { key: "commodities", label: "商品 / Commodities" },
];

const experienceLevels = [
  { value: "none", label: "無經驗 / None" },
  { value: "less_than_1", label: "少於1年 / Less than 1 year" },
  { value: "1_to_3", label: "1-3年 / 1-3 years" },
  { value: "3_to_5", label: "3-5年 / 3-5 years" },
  { value: "more_than_5", label: "5年以上 / More than 5 years" },
];

const riskToleranceLevels = [
  { value: "R1", label: "R1 - 低风险 / Low Risk", description: "在一定的时间内，本金安全的不稳定性很低，基金净值会有轻度波动，或造成轻微的本金亏损" },
  { value: "R2", label: "R2 - 中低风险 / Medium-Low Risk", description: "在一定时间内，本金安全的不稳定性相对较低，基金净值会有较低波动，或造成较低的本金亏损" },
  { value: "R3", label: "R3 - 中风险 / Medium Risk", description: "在一定时间内，本金安全具有一定的不稳定性，基金净值会有适度波动，或造成一定的本金亏损" },
  { value: "R4", label: "R4 - 中高风险 / Medium-High Risk", description: "在一定时间内，本金安全的不稳定性相对较高，基金净值会有较高波动，或造成较大的本金亏损" },
  { value: "R5", label: "R5 - 高风险 / High Risk", description: "在一定的时间内，本金安全的不稳定性很高，基金净值会有高度波动，或造成很大的本金亏损" },
];

export default function FinancialAndInvestment() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  const [investmentObjectives, setInvestmentObjectives] = useState<string[]>([]);
  const [investmentExperience, setInvestmentExperience] = useState<Record<string, string>>({});
  const [riskTolerance, setRiskTolerance] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading: isLoadingData } = trpc.financial.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.financial.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/8`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      try {
        const objectives = JSON.parse(existingData.investmentObjectives || "[]");
        const experience = JSON.parse(existingData.investmentExperience || "{}");
        setInvestmentObjectives(objectives);
        setInvestmentExperience(experience);
        setRiskTolerance(existingData.riskTolerance);
      } catch (e) {
        console.error("Error parsing existing data:", e);
      }
    }
  }, [existingData]);

  const handleObjectiveToggle = (value: string) => {
    setInvestmentObjectives(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
    if (errors.investmentObjectives) {
      setErrors({ ...errors, investmentObjectives: "" });
    }
  };

  const handleExperienceChange = (product: string, level: string) => {
    setInvestmentExperience(prev => ({
      ...prev,
      [product]: level,
    }));
    if (errors.investmentExperience) {
      setErrors({ ...errors, investmentExperience: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (investmentObjectives.length === 0) {
      newErrors.investmentObjectives = "請至少選擇一項投資目的";
    }

    const hasExperience = Object.keys(investmentExperience).length > 0;
    if (!hasExperience) {
      newErrors.investmentExperience = "請至少填寫一項投資經驗";
    }

    if (!riskTolerance) {
      newErrors.riskTolerance = "請選擇風險承受能力";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    saveMutation.mutate({
      applicationId,
      investmentObjectives,
      investmentExperience,
      riskTolerance,
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={7}
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
      currentStep={7}
      onNext={handleNext}
      isNextLoading={saveMutation.isPending}
    
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-8">
        {/* 投資目的 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">
              投資目的 / Investment Objectives <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">請至少選擇一項</p>
          </div>
          <div className="space-y-3">
            {investmentObjectiveOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={investmentObjectives.includes(option.value)}
                  onCheckedChange={() => handleObjectiveToggle(option.value)}
                />
                <Label htmlFor={option.value} className="cursor-pointer font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.investmentObjectives && (
            <p className="text-sm text-destructive">{errors.investmentObjectives}</p>
          )}
        </div>

        {/* 投資經驗 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">
              投資經驗 / Investment Experience <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">請至少填寫一項投資產品的經驗</p>
          </div>
          <div className="space-y-4">
            {investmentProducts.map((product) => (
              <div key={product.key} className="grid md:grid-cols-[200px_1fr] gap-4 items-center">
                <Label htmlFor={product.key}>{product.label}</Label>
                <Select
                  value={investmentExperience[product.key] || ""}
                  onValueChange={(v) => handleExperienceChange(product.key, v)}
                >
                  <SelectTrigger id={product.key}>
                    <SelectValue placeholder="請選擇經驗年限" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          {errors.investmentExperience && (
            <p className="text-sm text-destructive">{errors.investmentExperience}</p>
          )}
        </div>

        {/* 風險承受能力 */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">
              風險承受能力 / Risk Tolerance <span className="text-destructive">*</span>
            </Label>
          </div>
          <div className="space-y-3">
            {riskToleranceLevels.map((level) => (
              <div
                key={level.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  riskTolerance === level.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                }`}
                onClick={() => {
                  setRiskTolerance(level.value);
                  if (errors.riskTolerance) setErrors({ ...errors, riskTolerance: "" });
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    riskTolerance === level.value ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {riskTolerance === level.value && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-muted-foreground">{level.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.riskTolerance && (
            <p className="text-sm text-destructive">{errors.riskTolerance}</p>
          )}
        </div>
      </div>
    </ApplicationWizard>
  );
}
