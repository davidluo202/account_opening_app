import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";

const countries = [
  "中国", "香港", "澳门", "台湾", "美国", "加拿大", "英国", "澳大利亚", "新加坡", "日本", "韩国", "other"
];

export default function CorporateBasicInfo() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  const [formData, setFormData] = useState({
    companyEnglishName: "",
    companyChineseName: "",
    natureOfEntity: "",
    natureOfBusiness: "",
    countryOfIncorporation: "",
    dateOfIncorporation: "",
    certificateOfIncorporationNo: "",
    businessRegistrationNo: "",
    registeredAddress: "",
    businessAddress: "",
    officeNo: "",
    facsimileNo: "",
    contactName: "",
    contactTitle: "",
    contactPhone: "",
    contactEmail: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading: isLoadingData } = trpc.corporateBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.corporateBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/3`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.corporateBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyEnglishName.trim()) newErrors.companyEnglishName = "請輸入公司英文名稱";
    if (!formData.natureOfEntity.trim()) newErrors.natureOfEntity = "請輸入公司性質";
    if (!formData.natureOfBusiness.trim()) newErrors.natureOfBusiness = "請輸入業務性質";
    if (!formData.countryOfIncorporation) newErrors.countryOfIncorporation = "請選擇註冊國家";
    if (!formData.dateOfIncorporation) newErrors.dateOfIncorporation = "請選擇註冊日期";
    if (!formData.certificateOfIncorporationNo.trim()) newErrors.certificateOfIncorporationNo = "請輸入公司註冊證書號碼";
    if (!formData.registeredAddress.trim()) newErrors.registeredAddress = "請輸入註冊地址";
    if (!formData.businessAddress.trim()) newErrors.businessAddress = "請輸入營業地址";
    if (!formData.officeNo.trim()) newErrors.officeNo = "請輸入辦事處電話";
    if (!formData.contactName.trim()) newErrors.contactName = "請輸入聯絡人姓名";
    if (!formData.contactTitle.trim()) newErrors.contactTitle = "請輸入職銜";
    if (!formData.contactPhone.trim()) newErrors.contactPhone = "請輸入電話號碼";
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "請輸入電郵地址";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "電郵格式不正確";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }
    saveOnlyMutation.mutate({ applicationId, ...formData });
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }
    saveMutation.mutate({ applicationId, ...formData });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={2} showReturnToPreview={showReturnToPreview}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={2}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-8">
        {/* 公司識別信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">公司識別信息 / Company Identification</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyEnglishName">公司英文名稱 / Company English Name <span className="text-destructive">*</span></Label>
              <Input
                id="companyEnglishName"
                value={formData.companyEnglishName}
                onChange={(e) => setFormData({ ...formData, companyEnglishName: e.target.value })}
                placeholder="Enter Company English Name"
                className={errors.companyEnglishName ? "border-destructive" : ""}
              />
              {errors.companyEnglishName && <p className="text-sm text-destructive">{errors.companyEnglishName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyChineseName">公司中文名稱 / Company Chinese Name</Label>
              <Input
                id="companyChineseName"
                value={formData.companyChineseName}
                onChange={(e) => setFormData({ ...formData, companyChineseName: e.target.value })}
                onBlur={() => setFormData({ ...formData, companyChineseName: convertToTraditional(formData.companyChineseName) })}
                placeholder="請輸入公司中文名稱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="natureOfEntity">公司性質 / Nature of Entity <span className="text-destructive">*</span></Label>
              <Input
                id="natureOfEntity"
                value={formData.natureOfEntity}
                onChange={(e) => setFormData({ ...formData, natureOfEntity: e.target.value })}
                placeholder="例如：有限公司"
                className={errors.natureOfEntity ? "border-destructive" : ""}
              />
              {errors.natureOfEntity && <p className="text-sm text-destructive">{errors.natureOfEntity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="natureOfBusiness">業務性質 / Nature of Business <span className="text-destructive">*</span></Label>
              <Input
                id="natureOfBusiness"
                value={formData.natureOfBusiness}
                onChange={(e) => setFormData({ ...formData, natureOfBusiness: e.target.value })}
                placeholder="例如：投資控股"
                className={errors.natureOfBusiness ? "border-destructive" : ""}
              />
              {errors.natureOfBusiness && <p className="text-sm text-destructive">{errors.natureOfBusiness}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="countryOfIncorporation">註冊國家 / Country of Incorporation <span className="text-destructive">*</span></Label>
              <Select value={formData.countryOfIncorporation} onValueChange={(v) => setFormData({ ...formData, countryOfIncorporation: v })}>
                <SelectTrigger className={errors.countryOfIncorporation ? "border-destructive" : ""}>
                  <SelectValue placeholder="請選擇國家" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c === "other" ? "其他 / Other" : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfIncorporation">註冊日期 / Date of Incorporation <span className="text-destructive">*</span></Label>
              <Input
                id="dateOfIncorporation"
                type="date"
                value={formData.dateOfIncorporation}
                onChange={(e) => setFormData({ ...formData, dateOfIncorporation: e.target.value })}
                className={errors.dateOfIncorporation ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificateOfIncorporationNo">公司註冊證書號碼 / CI No. <span className="text-destructive">*</span></Label>
              <Input
                id="certificateOfIncorporationNo"
                value={formData.certificateOfIncorporationNo}
                onChange={(e) => setFormData({ ...formData, certificateOfIncorporationNo: e.target.value })}
                className={errors.certificateOfIncorporationNo ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessRegistrationNo">商業登記證號碼 / BR No.</Label>
              <Input
                id="businessRegistrationNo"
                value={formData.businessRegistrationNo}
                onChange={(e) => setFormData({ ...formData, businessRegistrationNo: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 地址與聯繫方式 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">地址與聯繫方式 / Address & Contact</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registeredAddress">註冊地址 / Registered Address <span className="text-destructive">*</span></Label>
              <Input
                id="registeredAddress"
                value={formData.registeredAddress}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                className={errors.registeredAddress ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAddress">營業地址 / Business Address <span className="text-destructive">*</span></Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                className={errors.businessAddress ? "border-destructive" : ""}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="officeNo">辦事處電話 / Office No. <span className="text-destructive">*</span></Label>
                <Input
                  id="officeNo"
                  value={formData.officeNo}
                  onChange={(e) => setFormData({ ...formData, officeNo: e.target.value })}
                  className={errors.officeNo ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facsimileNo">傳真號碼 / Facsimile No.</Label>
                <Input
                  id="facsimileNo"
                  value={formData.facsimileNo}
                  onChange={(e) => setFormData({ ...formData, facsimileNo: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 賬戶聯絡人 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">賬戶聯絡人 / Account Contact Person</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactName">姓名 / Name <span className="text-destructive">*</span></Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className={errors.contactName ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactTitle">職銜 / Title <span className="text-destructive">*</span></Label>
              <Input
                id="contactTitle"
                value={formData.contactTitle}
                onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                className={errors.contactTitle ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">電話號碼 / Telephone No. <span className="text-destructive">*</span></Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className={errors.contactPhone ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">電郵地址 / E-mail <span className="text-destructive">*</span></Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className={errors.contactEmail ? "border-destructive" : ""}
              />
              {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
            </div>
          </div>
        </div>
      </div>
    </ApplicationWizard>
  );
}
