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
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "10");
  const showReturnToPreview = useReturnToPreview();

  const [formData, setFormData] = useState({
    taxResidency: "",
    taxIdNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取个人/机构基本信息以自动填充税务居住地和证件号码
  const { data: basicInfo } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const { data: corporateInfo } = trpc.corporateBasic.get.useQuery(
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
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
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
    // 優先使用已保存數據，若無已保存數據則用默認值填充
    if (existingData && (existingData.taxResidency || existingData.taxIdNumber)) {
      setFormData(existingData);
    } else if (corporateInfo) {
      // 機構：納稅居住國=註冊國家，稅務編號=商業登記證號碼
      setFormData({
        taxResidency: corporateInfo.countryOfIncorporation,
        taxIdNumber: corporateInfo.businessRegistrationNo,
      });
    } else if (basicInfo && detailedInfo) {
      // 個人：從基本信息獲取
      setFormData({
        taxResidency: basicInfo.nationality,
        taxIdNumber: detailedInfo.idNumber,
      });
    }
  }, [basicInfo, detailedInfo, corporateInfo, existingData]);

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
