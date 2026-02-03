import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TaxInfo() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  const [formData, setFormData] = useState({
    taxResidency: "",
    taxIdNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取个人基本信息以自动填充税务居住地和证件号码
  const { data: basicInfo } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: detailedInfo } = trpc.personalDetailed.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: existingData, isLoading: isLoadingData } = trpc.tax.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.tax.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/11`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.tax.save.useMutation({
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
    // 優先從basicInfo和detailedInfo自動同步最新數據
    if (basicInfo && detailedInfo) {
      setFormData({
        taxResidency: basicInfo.nationality,
        taxIdNumber: detailedInfo.idNumber,
      });
    } else if (existingData) {
      // 如果沒有basicInfo和detailedInfo，則使用已保存的數據
      setFormData(existingData);
    }
  }, [basicInfo, detailedInfo, existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.taxResidency.trim()) newErrors.taxResidency = "請輸入稅務居住地";
    if (!formData.taxIdNumber.trim()) newErrors.taxIdNumber = "請輸入稅務識別號";

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
      <ApplicationWizard applicationId={applicationId} currentStep={10}
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
      currentStep={10}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>提示：</strong>以下信息已從您的個人資料中自動導入，請確認或修改
          </p>
        </div>

        {/* 稅務居住地 */}
        <div className="space-y-2">
          <Label htmlFor="taxResidency">
            稅務居住地 / Tax Residency <span className="text-destructive">*</span>
          </Label>
          <Input
            id="taxResidency"
            value={formData.taxResidency}
            onChange={(e) => {
              setFormData({ ...formData, taxResidency: e.target.value });
              if (errors.taxResidency) setErrors({ ...errors, taxResidency: "" });
            }}
            placeholder="請輸入稅務居住地"
            className={errors.taxResidency ? "border-destructive" : ""}
          />
          {errors.taxResidency && <p className="text-sm text-destructive">{errors.taxResidency}</p>}
          <p className="text-sm text-muted-foreground">默認為您的國籍</p>
        </div>

        {/* 稅務識別號 */}
        <div className="space-y-2">
          <Label htmlFor="taxIdNumber">
            稅務識別號 / Tax ID Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="taxIdNumber"
            value={formData.taxIdNumber}
            onChange={(e) => {
              setFormData({ ...formData, taxIdNumber: e.target.value });
              if (errors.taxIdNumber) setErrors({ ...errors, taxIdNumber: "" });
            }}
            placeholder="請輸入稅務識別號"
            className={errors.taxIdNumber ? "border-destructive" : ""}
          />
          {errors.taxIdNumber && <p className="text-sm text-destructive">{errors.taxIdNumber}</p>}
          <p className="text-sm text-muted-foreground">默認為您的證件號碼</p>
        </div>
      </div>
    </ApplicationWizard>
  );
}
