import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const incomeSources = [
  { value: "salary", label: "薪金 / Salary" },
  { value: "business", label: "業務收入 / Business Income" },
  { value: "investment", label: "投資收益 / Investment Income" },
  { value: "rental", label: "租金收入 / Rental Income" },
  { value: "pension", label: "退休金 / Pension" },
  { value: "family", label: "家庭支持 / Family Support" },
  { value: "other", label: "其他 / Other" },
];

const annualIncomeRanges = [
  { value: "0-100000", label: "HKD 0 - 100,000" },
  { value: "100000-300000", label: "HKD 100,000 - 300,000" },
  { value: "300000-500000", label: "HKD 300,000 - 500,000" },
  { value: "500000-1000000", label: "HKD 500,000 - 1,000,000" },
  { value: "1000000-3000000", label: "HKD 1,000,000 - 3,000,000" },
  { value: "3000000+", label: "HKD 3,000,000+" },
];

const netWorthRanges = [
  { value: "0-500000", label: "HKD 0 - 500,000" },
  { value: "500000-1000000", label: "HKD 500,000 - 1,000,000" },
  { value: "1000000-3000000", label: "HKD 1,000,000 - 3,000,000" },
  { value: "3000000-5000000", label: "HKD 3,000,000 - 5,000,000" },
  { value: "5000000-10000000", label: "HKD 5,000,000 - 10,000,000" },
  { value: "10000000+", label: "HKD 10,000,000+" },
];

export default function EmploymentDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  const [selectedIncomeSources, setSelectedIncomeSources] = useState<string[]>([]);
  const [incomeSourceOther, setIncomeSourceOther] = useState("");
  const [formData, setFormData] = useState({
    incomeSource: "",
    annualIncome: "",
    liquidAsset: "", // 流動資產（必填）
    netWorth: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading: isLoadingData } = trpc.employment.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.employment.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/7`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.employment.save.useMutation({
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
      // Parse comma-separated incomeSource into array
      const rawIncomeSources = existingData.incomeSource || "";
      const parts = rawIncomeSources.split(",").map((s: string) => s.trim()).filter(Boolean);
      // Extract "other:..." detail if present
      const otherPart = parts.find((p: string) => p.startsWith("other:"));
      const cleanParts = parts.map((p: string) => p.startsWith("other:") ? "other" : p);
      setSelectedIncomeSources(cleanParts);
      if (otherPart) setIncomeSourceOther(otherPart.slice(6));
      setFormData({
        ...existingData,
        incomeSource: rawIncomeSources,
        liquidAsset: existingData.liquidAsset || "",
      });
    }
  }, [existingData]);

  const buildIncomeSourceValue = (sources: string[], otherText: string) => {
    return sources
      .map((s) => (s === "other" ? `other:${otherText}` : s))
      .join(",");
  };

  const handleIncomeSourceToggle = (value: string) => {
    setSelectedIncomeSources((prev) => {
      const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      const combined = buildIncomeSourceValue(next, incomeSourceOther);
      setFormData((fd) => ({ ...fd, incomeSource: combined }));
      return next;
    });
    if (errors.incomeSource) setErrors({ ...errors, incomeSource: "" });
  };

  const handleOtherTextChange = (text: string) => {
    setIncomeSourceOther(text);
    const combined = buildIncomeSourceValue(selectedIncomeSources, text);
    setFormData((fd) => ({ ...fd, incomeSource: combined }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedIncomeSources.length === 0) newErrors.incomeSource = "請選擇收入來源";
    if (!formData.annualIncome) newErrors.annualIncome = "請選擇年收入範圍";
    if (!formData.liquidAsset) newErrors.liquidAsset = "請選擇流動資產範圍";
    if (!formData.netWorth) newErrors.netWorth = "請選擇淨資產範圍";

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
      ...formData,
    });
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    saveMutation.mutate({
      applicationId,
      ...formData,
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={6}
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
      currentStep={6}
      onNext={handleNext}
      isNextLoading={saveMutation.isPending}
      onSave={handleSave}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>提示：</strong>所有金額幣種為港幣（HKD）
          </p>
        </div>

        {/* 收入來源 */}
        <div className="space-y-2">
          <Label>
            收入來源 / Income Source <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">可多選</p>
          <div className={`space-y-3 bg-slate-50 p-4 rounded-lg border ${errors.incomeSource ? "border-destructive" : "border-slate-200"}`}>
            {incomeSources.map((source) => (
              <div key={source.value}>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`income-${source.value}`}
                    checked={selectedIncomeSources.includes(source.value)}
                    onCheckedChange={() => handleIncomeSourceToggle(source.value)}
                    className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor={`income-${source.value}`} className="cursor-pointer font-normal">
                    {source.label}
                  </Label>
                  {source.value === "other" && selectedIncomeSources.includes("other") && (
                    <Input
                      value={incomeSourceOther}
                      onChange={(e) => handleOtherTextChange(e.target.value)}
                      placeholder="請填寫詳情"
                      className="ml-2 h-8 w-48 text-sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.incomeSource && <p className="text-sm text-destructive">{errors.incomeSource}</p>}
        </div>

        {/* 年收入範圍 */}
        <div className="space-y-2">
          <Label htmlFor="annualIncome">
            年收入範圍 / Annual Income Range <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.annualIncome} 
            onValueChange={(v) => {
              setFormData({ ...formData, annualIncome: v });
              if (errors.annualIncome) setErrors({ ...errors, annualIncome: "" });
            }}
          >
            <SelectTrigger className={errors.annualIncome ? "border-destructive" : ""}>
              <SelectValue placeholder="請選擇年收入範圍" />
            </SelectTrigger>
            <SelectContent>
              {annualIncomeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.annualIncome && <p className="text-sm text-destructive">{errors.annualIncome}</p>}
        </div>

        {/* 流動資產範圍 */}
        <div className="space-y-2">
          <Label htmlFor="liquidAsset">
            流動資產範圍 / Liquid Asset Range (HK$) <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.liquidAsset}
            onValueChange={(v) => {
              setFormData({ ...formData, liquidAsset: v });
              if (errors.liquidAsset) setErrors({ ...errors, liquidAsset: "" });
            }}
          >
            <SelectTrigger className={errors.liquidAsset ? "border-destructive" : ""}>
              <SelectValue placeholder="請選擇流動資產範圍" />
            </SelectTrigger>
            <SelectContent>
              {netWorthRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.liquidAsset && <p className="text-sm text-destructive">{errors.liquidAsset}</p>}
        </div>

        {/* 淨資產範圍 */}
        <div className="space-y-2">
          <Label htmlFor="netWorth">
            淨資產範圍 / Net Worth Range <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.netWorth} 
            onValueChange={(v) => {
              setFormData({ ...formData, netWorth: v });
              if (errors.netWorth) setErrors({ ...errors, netWorth: "" });
            }}
          >
            <SelectTrigger className={errors.netWorth ? "border-destructive" : ""}>
              <SelectValue placeholder="請選擇淨資產範圍" />
            </SelectTrigger>
            <SelectContent>
              {netWorthRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.netWorth && <p className="text-sm text-destructive">{errors.netWorth}</p>}
        </div>
      </div>
    </ApplicationWizard>
  );
}
