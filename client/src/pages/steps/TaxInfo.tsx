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

  // Check if joint account
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isJoint = accountSelection?.customerType === 'joint';

  const [formData, setFormData] = useState({
    taxResidency: "",
    taxIdNumber: "",
    noTaxId: false, // 沒有稅務編號
    noTaxIdReason: "", // 沒有稅務編號的理由
  });

  // Joint account: second holder
  const [secondHolder, setSecondHolder] = useState({
    taxResidency: "",
    taxIdNumber: "",
    noTaxId: false,
    noTaxIdReason: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'taxInfo' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      setSecondHolder(prev => ({ ...prev, ...(existingSecondHolder as any) }));
    }
  }, [existingSecondHolder]);

  // 獲取個人/機構基本信息以自動填充稅務居住地和證件號碼
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
      setFormData(existingData as any);
    } else if (corporateInfo) {
      // 機構：納稅居住國=註冊國家（若選擇"other"則用補充說明），稅務編號=商業登記證號碼
      const taxResidency = corporateInfo.countryOfIncorporation === "other"
        ? (corporateInfo as any).countryOfIncorporationOther
        : corporateInfo.countryOfIncorporation;
      setFormData({
        taxResidency: taxResidency || "",
        taxIdNumber: corporateInfo.businessRegistrationNo,
      } as any);
    } else if (basicInfo && detailedInfo) {
      // 個人：從基本信息獲取
      setFormData({
        taxResidency: basicInfo.nationality,
        taxIdNumber: detailedInfo.idNumber,
      } as any);
    }
  }, [basicInfo, detailedInfo, corporateInfo, existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.taxResidency.trim()) newErrors.taxResidency = "請輸入居留司法管轄區";
    if (!formData.noTaxId && !formData.taxIdNumber.trim()) newErrors.taxIdNumber = "請輸入稅務識別號";
    if (formData.noTaxId && !formData.noTaxIdReason.trim()) newErrors.noTaxIdReason = "請輸入沒有稅務編號的理由";

    // 聯名賬戶：驗證第二持有人
    if (isJoint) {
      if (!secondHolder.taxResidency.trim()) newErrors.secondTaxResidency = "請填寫第二持有人的居留司法管轄區";
      if (!secondHolder.noTaxId && !secondHolder.taxIdNumber.trim()) newErrors.secondTaxIdNumber = "請填寫第二持有人的稅務識別號";
      if (secondHolder.noTaxId && !secondHolder.noTaxIdReason.trim()) newErrors.secondNoTaxIdReason = "請填寫第二持有人的沒有稅務編號理由";
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
      ...formData,
    });
    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'taxInfo', data: secondHolder });
    }
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'taxInfo', data: secondHolder });
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
            <strong>提示：</strong>以下信息已從{corporateInfo ? "公司資料" : "您的個人資料"}中自動導入，請確認或修改
          </p>
        </div>

        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">賬戶主要持有人 / Primary Account Holder</h3>
        )}

        {/* 稅務居住地 */}
        <div className="space-y-2">
          <Label htmlFor="taxResidency">
            居留司法管轄區 / Jurisdiction(s) of Residence <span className="text-destructive">*</span>
          </Label>
          <Input
            id="taxResidency"
            value={formData.taxResidency}
            onChange={(e) => {
              setFormData({ ...formData, taxResidency: e.target.value });
              if (errors.taxResidency) setErrors({ ...errors, taxResidency: "" });
            }}
            placeholder="請輸入居留司法管轄區"
            className={errors.taxResidency ? "border-destructive" : ""}
          />
          {errors.taxResidency && <p className="text-sm text-destructive">{errors.taxResidency}</p>}
          <p className="text-sm text-muted-foreground">{corporateInfo ? "默認為公司註冊國家或地區" : "默認為您的國籍"}</p>
        </div>

        {/* 稅務識別號 */}
        <div className="space-y-2">
          <Label htmlFor="taxIdNumber">
            稅務識別號 / Tax Identification Number（"TIN"）<span className="text-destructive">*</span>
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
          <p className="text-sm text-muted-foreground">{corporateInfo ? "默認為商業登記證號碼" : "默認為您的證件號碼"}</p>
        </div>

        {/* 沒有稅務編號 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="noTaxId"
              checked={formData.noTaxId}
              onChange={(e) => {
                setFormData({ ...formData, noTaxId: e.target.checked, taxIdNumber: e.target.checked ? "" : formData.taxIdNumber, noTaxIdReason: "" });
                if (errors.taxIdNumber) setErrors({ ...errors, taxIdNumber: "" });
                if (errors.noTaxIdReason) setErrors({ ...errors, noTaxIdReason: "" });
              }}
              className="w-4 h-4"
            />
            <Label htmlFor="noTaxId" className="cursor-pointer">沒有稅務識別號 / No TIN</Label>
          </div>
          {formData.noTaxId && (
            <div className="space-y-2">
              <Label htmlFor="noTaxIdReason">
                請說明理由 / Please provide reason <span className="text-destructive">*</span>
              </Label>
              <Input
                id="noTaxIdReason"
                value={formData.noTaxIdReason}
                onChange={(e) => {
                  setFormData({ ...formData, noTaxIdReason: e.target.value });
                  if (errors.noTaxIdReason) setErrors({ ...errors, noTaxIdReason: "" });
                }}
                placeholder="請輸入理由"
                className={errors.noTaxIdReason ? "border-destructive" : ""}
              />
              {errors.noTaxIdReason && <p className="text-sm text-destructive">{errors.noTaxIdReason}</p>}
            </div>
          )}
        </div>

        {/* 聯名賬戶：第二持有人 */}
        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mt-8 mb-2">賬戶第二持有人 / Second Account Holder</h3>

            {/* 稅務居住地 */}
            <div className="space-y-2">
              <Label>
                居留司法管轄區 / Jurisdiction(s) of Residence <span className="text-destructive">*</span>
              </Label>
              <Input
                value={secondHolder.taxResidency}
                onChange={(e) => {
                  setSecondHolder({ ...secondHolder, taxResidency: e.target.value });
                  if (errors.secondTaxResidency) setErrors({ ...errors, secondTaxResidency: "" });
                }}
                placeholder="請輸入居留司法管轄區"
                className={errors.secondTaxResidency ? "border-destructive" : ""}
              />
              {errors.secondTaxResidency && <p className="text-sm text-destructive">{errors.secondTaxResidency}</p>}
            </div>

            {/* 稅務識別號 */}
            <div className="space-y-2">
              <Label>
                稅務識別號 / Tax Identification Number（"TIN"）<span className="text-destructive">*</span>
              </Label>
              <Input
                value={secondHolder.taxIdNumber}
                onChange={(e) => {
                  setSecondHolder({ ...secondHolder, taxIdNumber: e.target.value });
                  if (errors.secondTaxIdNumber) setErrors({ ...errors, secondTaxIdNumber: "" });
                }}
                placeholder="請輸入稅務識別號"
                className={errors.secondTaxIdNumber ? "border-destructive" : ""}
              />
              {errors.secondTaxIdNumber && <p className="text-sm text-destructive">{errors.secondTaxIdNumber}</p>}
            </div>

            {/* 沒有稅務編號 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="secondNoTaxId"
                  checked={secondHolder.noTaxId}
                  onChange={(e) => setSecondHolder({ ...secondHolder, noTaxId: e.target.checked, taxIdNumber: e.target.checked ? "" : secondHolder.taxIdNumber, noTaxIdReason: "" })}
                  className="w-4 h-4"
                />
                <Label htmlFor="secondNoTaxId" className="cursor-pointer">沒有稅務識別號 / No TIN</Label>
              </div>
              {secondHolder.noTaxId && (
                <div className="space-y-2">
                  <Label>
                    請說明理由 / Please provide reason <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={secondHolder.noTaxIdReason}
                    onChange={(e) => {
                      setSecondHolder({ ...secondHolder, noTaxIdReason: e.target.value });
                      if (errors.secondNoTaxIdReason) setErrors({ ...errors, secondNoTaxIdReason: "" });
                    }}
                    placeholder="請輸入理由"
                    className={errors.secondNoTaxIdReason ? "border-destructive" : ""}
                  />
                  {errors.secondNoTaxIdReason && <p className="text-sm text-destructive">{errors.secondNoTaxIdReason}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ApplicationWizard>
  );
}
