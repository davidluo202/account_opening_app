import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";

const employmentStatuses = [
  { value: "employed", label: "受僱 / Employed" },
  { value: "self_employed", label: "自僱 / Self-Employed" },
  { value: "student", label: "學生 / Student" },
  { value: "unemployed", label: "無業 / Unemployed" },
];

const industries = [
  "金融服務 / Financial Services",
  "資訊科技 / IT",
  "醫療保健 / Healthcare",
  "教育 / Education",
  "零售 / Retail",
  "製造業 / Manufacturing",
  "房地產 / Real Estate",
  "法律 / Legal",
  "會計 / Accounting",
  "其他 / Other",
];

export default function OccupationInfo() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  const [formData, setFormData] = useState({
    employmentStatus: "" as "employed" | "self_employed" | "student" | "unemployed" | "",
    companyName: "",
    position: "",
    yearsOfService: "",
    industry: "",
    companyAddress: "",
    officePhone: "",
    officeFaxNo: "", // 办公传真（可选）
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading: isLoadingData } = trpc.occupation.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.occupation.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/6`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.occupation.save.useMutation({
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
      setFormData({
        ...existingData,
        companyName: existingData.companyName || "",
        position: existingData.position || "",
        yearsOfService: existingData.yearsOfService?.toString() || "",
        industry: existingData.industry || "",
        companyAddress: existingData.companyAddress || "",
        officePhone: existingData.officePhone || "",
        officeFaxNo: existingData.officeFaxNo || "", // 处理可选字段
      });
    }
  }, [existingData]);

  const needsEmploymentDetails = formData.employmentStatus === "employed" || formData.employmentStatus === "self_employed";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employmentStatus) {
      newErrors.employmentStatus = "請選擇就業狀況";
    }

    if (needsEmploymentDetails) {
      if (!formData.companyName?.trim()) newErrors.companyName = "請輸入公司名稱";
      if (!formData.position?.trim()) newErrors.position = "請輸入職務名稱";
      const years = parseInt(formData.yearsOfService);
      if (!formData.yearsOfService || isNaN(years) || years <= 0) {
        newErrors.yearsOfService = "請輸入有效的從業年限";
      }
      if (!formData.industry) newErrors.industry = "請選擇行業";
      if (!formData.companyAddress?.trim()) newErrors.companyAddress = "請輸入公司地址";
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
      employmentStatus: formData.employmentStatus as "employed" | "self_employed" | "student" | "unemployed",
      companyName: formData.companyName,
      position: formData.position,
      yearsOfService: formData.yearsOfService ? parseInt(formData.yearsOfService) : undefined,
      industry: formData.industry,
      companyAddress: formData.companyAddress,
      officePhone: formData.officePhone,
      officeFaxNo: formData.officeFaxNo,
    });
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    saveMutation.mutate({
      applicationId,
      employmentStatus: formData.employmentStatus as any,
      companyName: needsEmploymentDetails ? formData.companyName : undefined,
      position: needsEmploymentDetails ? formData.position : undefined,
      yearsOfService: needsEmploymentDetails ? parseInt(formData.yearsOfService) : undefined,
      industry: needsEmploymentDetails ? formData.industry : undefined,
      companyAddress: needsEmploymentDetails ? formData.companyAddress : undefined,
      officePhone: needsEmploymentDetails ? formData.officePhone : undefined,
      officeFaxNo: needsEmploymentDetails ? formData.officeFaxNo : undefined, // 添加办公传真字段
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={5}
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
      currentStep={5}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        {/* 就業狀況 */}
        <div className="space-y-2">
          <Label htmlFor="employmentStatus">
            就業狀況 / Employment Status <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.employmentStatus} 
            onValueChange={(v) => {
              setFormData({ ...formData, employmentStatus: v as any });
              if (errors.employmentStatus) setErrors({ ...errors, employmentStatus: "" });
            }}
          >
            <SelectTrigger className={errors.employmentStatus ? "border-destructive" : ""}>
              <SelectValue placeholder="請選擇就業狀況" />
            </SelectTrigger>
            <SelectContent>
              {employmentStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employmentStatus && <p className="text-sm text-destructive">{errors.employmentStatus}</p>}
        </div>

        {/* 受僱/自僱詳情 */}
        {needsEmploymentDetails && (
          <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-lg">
              {formData.employmentStatus === "employed" ? "僱傭詳情 / Employment Details" : "自僱詳情 / Self-Employment Details"}
            </h4>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 公司名稱 */}
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  {formData.employmentStatus === "employed" ? "公司名稱 / Company Name" : "業務名稱 / Business Name"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    setFormData({ ...formData, companyName: e.target.value });
                    if (errors.companyName) setErrors({ ...errors, companyName: "" });
                  }}
                  onBlur={(e) => {
                    const converted = convertToTraditional(e.target.value);
                    if (converted !== e.target.value) {
                      setFormData({ ...formData, companyName: converted });
                    }
                  }}
                  placeholder="請輸入名稱"
                  className={errors.companyName ? "border-destructive" : ""}
                />
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
              </div>

              {/* 職務名稱 */}
              <div className="space-y-2">
                <Label htmlFor="position">
                  職務名稱 / Position <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => {
                    setFormData({ ...formData, position: e.target.value });
                    if (errors.position) setErrors({ ...errors, position: "" });
                  }}
                  onBlur={(e) => {
                    const converted = convertToTraditional(e.target.value);
                    if (converted !== e.target.value) {
                      setFormData({ ...formData, position: converted });
                    }
                  }}
                  placeholder="請輸入職務"
                  className={errors.position ? "border-destructive" : ""}
                />
                {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 從業年限 */}
              <div className="space-y-2">
                <Label htmlFor="yearsOfService">
                  從業年限 / Years of Service <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.yearsOfService}
                  onChange={(e) => {
                    setFormData({ ...formData, yearsOfService: e.target.value });
                    if (errors.yearsOfService) setErrors({ ...errors, yearsOfService: "" });
                  }}
                  placeholder="請輸入年限（例如：5）"
                  className={errors.yearsOfService ? "border-destructive" : ""}
                />
                {errors.yearsOfService && <p className="text-sm text-destructive">{errors.yearsOfService}</p>}
              </div>

              {/* 行業 */}
              <div className="space-y-2">
                <Label htmlFor="industry">
                  行業 / Industry <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.industry} 
                  onValueChange={(v) => {
                    setFormData({ ...formData, industry: v });
                    if (errors.industry) setErrors({ ...errors, industry: "" });
                  }}
                >
                  <SelectTrigger className={errors.industry ? "border-destructive" : ""}>
                    <SelectValue placeholder="請選擇行業" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && <p className="text-sm text-destructive">{errors.industry}</p>}
              </div>
            </div>

            {/* 公司地址 */}
            <div className="space-y-2">
              <Label htmlFor="companyAddress">
                {formData.employmentStatus === "employed" ? "公司地址 / Company Address" : "業務地址 / Business Address"} <span className="text-destructive">*</span>
              </Label>
                <Textarea
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, companyAddress: e.target.value });
                    if (errors.companyAddress) setErrors({ ...errors, companyAddress: "" });
                  }}
                  onBlur={(e) => {
                    const converted = convertToTraditional(e.target.value);
                    if (converted !== e.target.value) {
                      setFormData({ ...formData, companyAddress: converted });
                    }
                  }}
                  placeholder="請輸入地址"
                  rows={3}
                  className={errors.companyAddress ? "border-destructive" : ""}
                />
              {errors.companyAddress && <p className="text-sm text-destructive">{errors.companyAddress}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 辦公电话 */}
              <div className="space-y-2">
                <Label htmlFor="officePhone">
                  辦公电话 / Office Phone (可选)
                </Label>
                <Input
                  id="officePhone"
                  value={formData.officePhone}
                  onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })}
                  placeholder="请输入辦公电话"
                />
              </div>

              {/* 辦公传真 */}
              <div className="space-y-2">
                <Label htmlFor="officeFaxNo">
                  辦公传真 / Office Fax (可选)
                </Label>
                <Input
                  id="officeFaxNo"
                  value={formData.officeFaxNo}
                  onChange={(e) => setFormData({ ...formData, officeFaxNo: e.target.value })}
                  placeholder="请输入辦公传真"
                />
              </div>
            </div>
          </div>
        )}

        {(formData.employmentStatus === "student" || formData.employmentStatus === "unemployed") && (
          <div className="p-6 bg-muted/50 rounded-lg text-center text-muted-foreground">
            無需填寫額外信息
          </div>
        )}
      </div>
    </ApplicationWizard>
  );
}
