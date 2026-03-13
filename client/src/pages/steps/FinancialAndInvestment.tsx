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
import CorporateFinancial from "./CorporateFinancial";

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



export default function FinancialAndInvestment() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "7");
  const showReturnToPreview = useReturnToPreview();

  const [investmentObjectives, setInvestmentObjectives] = useState<string[]>([]);
  const [investmentExperience, setInvestmentExperience] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading: isLoadingData } = trpc.financial.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: accountSelection, isLoading: isSelectionLoading } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.financial.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.financial.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
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



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    saveOnlyMutation.mutate({
      applicationId,
      investmentObjectives,
      investmentExperience,

    });
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

    });
  };

  if (isLoadingData || isSelectionLoading) {
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

  if (accountSelection?.customerType === 'corporate') {
    return <CorporateFinancial applicationId={applicationId} stepNum={stepNum} />;
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={stepNum}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
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
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {investmentObjectiveOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <Checkbox
                  id={option.value}
                  checked={investmentObjectives.includes(option.value)}
                  onCheckedChange={() => handleObjectiveToggle(option.value)}
                  className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
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
            <Label className="text-base font-semibold text-slate-800">
              投資經驗 / Investment Experience <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-slate-600 mt-1">請至少填寫一項投資產品的經驗</p>
          </div>
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {investmentProducts.map((product) => (
              <div key={product.key} className="grid md:grid-cols-[200px_1fr] gap-4 items-center">
                <Label htmlFor={product.key} className="font-medium text-slate-700">{product.label}</Label>
                <Select
                  value={investmentExperience[product.key] || ""}
                  onValueChange={(v) => handleExperienceChange(product.key, v)}
                >
                  <SelectTrigger id={product.key} className="bg-white border-slate-300">
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


      </div>
    </ApplicationWizard>
  );
}
