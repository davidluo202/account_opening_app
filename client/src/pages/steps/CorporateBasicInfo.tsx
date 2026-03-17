import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { industryOptions } from "@/lib/industryOptions";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import EmailVerification from "@/components/EmailVerification";

const countries = [
  "中国", "香港", "澳门", "台湾", "美国", "加拿大", "英国", "澳大利亚", "新加坡", "日本", "韩国", "other"
];

const entityNatures = [
  "有限公司 / Limited Company",
  "無限公司 / Unlimited Company",
  "獨資經營 / Sole Proprietorship",
  "合夥企業 / Partnership",
  "信託 / Trust",
  "其他 / Other"
];

// Use the same industry list as Individual Account Opening → Occupation Info
const businessNatures = industryOptions;

const countryCodes = [
  { value: "+852", label: "+852 (香港)" },
  { value: "+86", label: "+86 (中國)" },
  { value: "+1", label: "+1 (美國/加拿大)" },
  { value: "+44", label: "+44 (英國)" },
  { value: "+65", label: "+65 (新加坡)" },
  { value: "+81", label: "+81 (日本)" },
  { value: "+82", label: "+82 (韓國)" },
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
    officeCountryCode: "+852",
    facsimileNo: "",
    contactName: "",
    contactTitle: "",
    contactPhone: "",
    contactCountryCode: "+852",
    contactEmail: "",
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);

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
    if (!existingData) return;

    const parseMergedPhone = (value?: string) => {
      if (!value) return { code: undefined as string | undefined, number: value };
      const m = value.trim().match(/^(\+\d+)\s*(\d+)$/);
      if (!m) return { code: undefined as string | undefined, number: value };
      return { code: m[1], number: m[2] };
    };

    const office = parseMergedPhone((existingData as any).officeNo);
    const contact = parseMergedPhone((existingData as any).contactPhone);

    setFormData({
      ...(existingData as any),
      // Split merged phones so UI shows country code in select, number in input
      officeCountryCode: office.code || (existingData as any).officeCountryCode || "+852",
      officeNo: office.number || "",
      contactCountryCode: contact.code || (existingData as any).contactCountryCode || "+852",
      contactPhone: contact.number || "",
    });
    setIsEmailVerified(!!(existingData as any)?.contactEmailVerified);
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyEnglishName.trim()) {
      newErrors.companyEnglishName = "請輸入公司英文名稱";
    } else if (!/^[A-Za-z\s]+$/.test(formData.companyEnglishName)) {
      newErrors.companyEnglishName = "公司英文名稱只能包含英文字母和空格，不能包含特殊符號";
    }

    if (
      formData.companyChineseName.trim() &&
      !/^[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+$/.test(formData.companyChineseName)
    ) {
      newErrors.companyChineseName = "公司中文名稱只能包含中文字（繁/簡會自動轉繁），不能包含特殊字符";
    }

    if (!formData.natureOfEntity.trim()) newErrors.natureOfEntity = "請選擇公司性質";
    if (!formData.natureOfBusiness.trim()) newErrors.natureOfBusiness = "請選擇業務性質";
    if (!formData.countryOfIncorporation) newErrors.countryOfIncorporation = "請選擇註冊國家";
    if (!formData.dateOfIncorporation) {
      newErrors.dateOfIncorporation = "請選擇註冊日期";
    } else {
      const selectedDate = new Date(formData.dateOfIncorporation);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.dateOfIncorporation = "註冊日期不能晚於今天";
      }
    }

    if (!formData.certificateOfIncorporationNo.trim()) {
      newErrors.certificateOfIncorporationNo = "請輸入公司註冊證書號碼";
    } else if (!/^\d+$/.test(formData.certificateOfIncorporationNo)) {
      newErrors.certificateOfIncorporationNo = "格式錯誤，只能採用阿拉伯數字";
    } else if (formData.certificateOfIncorporationNo.length > 8) {
      newErrors.certificateOfIncorporationNo = "不能超過8位";
    }

    // 商業登記號：7位（不足補0)
    if (formData.businessRegistrationNo.trim() && !/^\d+$/.test(formData.businessRegistrationNo)) {
      newErrors.businessRegistrationNo = "格式錯誤，只能採用阿拉伯數字";
    } else if (formData.businessRegistrationNo.length > 8) {
      newErrors.businessRegistrationNo = "不能超過8位";
    }

    if (!formData.registeredAddress.trim()) newErrors.registeredAddress = "請輸入註冊地址";
    if (!formData.businessAddress.trim()) newErrors.businessAddress = "請輸入營業地址";

    const validatePhone = (code: string, phone: string, field: string) => {
      if (!phone.trim()) {
        newErrors[field] = "請輸入電話號碼";
        return;
      }
      if (!/^\d+$/.test(phone)) {
        newErrors[field] = "只能輸入阿拉伯數字";
        return;
      }

      const lengthRules: Record<string, number> = {
        "+852": 8,  // 香港
        "+86": 11,  // 中國內地
        "+1": 10,   // 美國/加拿大（不含區號前綴，這裡按常見10位）
        "+44": 10,  // 英國（常見10位，不含0）
        "+65": 8,   // 新加坡
        "+81": 10,  // 日本（常見10位，不含0）
        "+82": 10,  // 韓國（常見10位，不含0）
      };

      const requiredLen = lengthRules[code];
      // 香港電話允許少於8位，其他嚴格校驗位數
      if (code === "+852") {
        if (phone.length > 8) {
          newErrors[field] = `電話號碼格式錯誤：${code} 不能超過8位`;
        }
      } else if (requiredLen && phone.length !== requiredLen) {
        newErrors[field] = `電話號碼格式錯誤：${code} 需輸入${requiredLen}位阿拉伯數字`;
      }
    };

    validatePhone(formData.officeCountryCode, formData.officeNo, 'officeNo');

    if (formData.facsimileNo.trim() && !/^[0-9+\s\-]+$/.test(formData.facsimileNo)) {
      newErrors.facsimileNo = "格式錯誤，只能包含數字、+、空格或-";
    }

    if (!formData.contactName.trim()) newErrors.contactName = "請輸入聯絡人姓名";
    if (!formData.contactTitle.trim()) newErrors.contactTitle = "請輸入職銜";

    validatePhone(formData.contactCountryCode, formData.contactPhone, 'contactPhone');

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "請輸入電郵地址";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "電郵格式不正確";
    }

    if (formData.contactEmail.trim() && !isEmailVerified) {
      newErrors.contactEmail = "請先完成電郵驗證";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      // Auto-scroll to first error
      const firstError = document.querySelector('.border-destructive');
      if (firstError) {
        (firstError as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstError as HTMLElement).focus();
      }
      return;
    }
    saveOnlyMutation.mutate({ applicationId, ...formData, contactEmailVerified: isEmailVerified });
  };



  const handleNext = () => {
    if (!validateForm()) {
      // Auto-scroll to first error
      const firstError = document.querySelector('.border-destructive');
      if (firstError) {
        (firstError as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstError as HTMLElement).focus();
      }
      return;
    }
    saveMutation.mutate({ applicationId, ...formData, contactEmailVerified: isEmailVerified });
  };

  const handleSCT = (text: string) => convertToTraditional(text);

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
              <div className="relative">
                <Input
                  id="companyEnglishName"
                  value={formData.companyEnglishName}
                  onChange={(e) => setFormData({ ...formData, companyEnglishName: e.target.value })}
                  placeholder="Enter Company English Name"
                  className={errors.companyEnglishName ? "border-destructive pr-10" : "pr-10"}
                />
                {formData.companyEnglishName.trim() && !errors.companyEnglishName && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.companyEnglishName && <p className="text-sm text-destructive">{errors.companyEnglishName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyChineseName">公司中文名稱 / Company Chinese Name</Label>
              <Input
                id="companyChineseName"
                value={formData.companyChineseName}
                onChange={(e) => setFormData({ ...formData, companyChineseName: e.target.value })}
                onBlur={() => setFormData({ ...formData, companyChineseName: handleSCT(formData.companyChineseName) })}
                placeholder="請輸入公司中文名稱"
                className={errors.companyChineseName ? "border-destructive" : ""}
              />
              {errors.companyChineseName && <p className="text-sm text-destructive">{errors.companyChineseName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="natureOfEntity">公司性質 / Nature of Entity <span className="text-destructive">*</span></Label>
              <Select value={formData.natureOfEntity} onValueChange={(v) => setFormData({ ...formData, natureOfEntity: v })}>
                <SelectTrigger className={errors.natureOfEntity ? "border-destructive" : ""}>
                  <SelectValue placeholder="請選擇公司性質" />
                </SelectTrigger>
                <SelectContent>
                  {entityNatures.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.natureOfEntity && <p className="text-sm text-destructive">{errors.natureOfEntity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="natureOfBusiness">業務性質 / Nature of Business <span className="text-destructive">*</span></Label>
              <Select value={formData.natureOfBusiness} onValueChange={(v) => setFormData({ ...formData, natureOfBusiness: v })}>
                <SelectTrigger className={errors.natureOfBusiness ? "border-destructive" : ""}>
                  <SelectValue placeholder="請選擇業務性質" />
                </SelectTrigger>
                <SelectContent>
                  {businessNatures.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {errors.countryOfIncorporation && <p className="text-sm text-destructive">{errors.countryOfIncorporation}</p>}
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
              {errors.dateOfIncorporation && <p className="text-sm text-destructive">{errors.dateOfIncorporation}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificateOfIncorporationNo">公司註冊證書號碼 / CI No. <span className="text-destructive">*</span></Label>
              <Input
                id="certificateOfIncorporationNo"
                value={formData.certificateOfIncorporationNo}
                onChange={(e) => setFormData({ ...formData, certificateOfIncorporationNo: e.target.value })}
                className={errors.certificateOfIncorporationNo ? "border-destructive" : ""}
              />
              {errors.certificateOfIncorporationNo && <p className="text-sm text-destructive">{errors.certificateOfIncorporationNo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessRegistrationNo">商業登記證號碼 / BR No.</Label>
              <Input
                id="businessRegistrationNo"
                value={formData.businessRegistrationNo}
                onChange={(e) => setFormData({ ...formData, businessRegistrationNo: e.target.value })}
                className={errors.businessRegistrationNo ? "border-destructive" : ""}
              />
              {errors.businessRegistrationNo && <p className="text-sm text-destructive">{errors.businessRegistrationNo}</p>}
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
                onBlur={() => setFormData({ ...formData, registeredAddress: handleSCT(formData.registeredAddress) })}
                className={errors.registeredAddress ? "border-destructive" : ""}
              />
              {errors.registeredAddress && <p className="text-sm text-destructive">{errors.registeredAddress}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAddress">營業地址 / Business Address <span className="text-destructive">*</span></Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                onBlur={() => setFormData({ ...formData, businessAddress: handleSCT(formData.businessAddress) })}
                className={errors.businessAddress ? "border-destructive" : ""}
              />
              {errors.businessAddress && <p className="text-sm text-destructive">{errors.businessAddress}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="officeNo">辦事處電話 / Office No. <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.officeCountryCode} 
                    onValueChange={(v) => setFormData({ ...formData, officeCountryCode: v })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    id="officeNo"
                    value={formData.officeNo}
                    onChange={(e) => setFormData({ ...formData, officeNo: e.target.value })}
                    className={errors.officeNo ? "border-destructive flex-1" : "flex-1"}
                  />
                </div>
                {errors.officeNo && <p className="text-sm text-destructive">{errors.officeNo}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facsimileNo">傳真號碼 / Fax No.</Label>
                <Input
                  id="facsimileNo"
                  value={formData.facsimileNo}
                  onChange={(e) => setFormData({ ...formData, facsimileNo: e.target.value })}
                  className={errors.facsimileNo ? "border-destructive" : ""}
                />
                {errors.facsimileNo && <p className="text-sm text-destructive">{errors.facsimileNo}</p>}
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
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value.toUpperCase() })}
                onBlur={() => setFormData({ ...formData, contactName: handleSCT(formData.contactName) })}
                className={errors.contactName ? "border-destructive" : ""}
              />
              {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactTitle">職銜 / Title <span className="text-destructive">*</span></Label>
              <Input
                id="contactTitle"
                value={formData.contactTitle}
                onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                onBlur={() => setFormData({ ...formData, contactTitle: handleSCT(formData.contactTitle) })}
                className={errors.contactTitle ? "border-destructive" : ""}
              />
              {errors.contactTitle && <p className="text-sm text-destructive">{errors.contactTitle}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">電話號碼 / Telephone No. <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.contactCountryCode} 
                  onValueChange={(v) => setFormData({ ...formData, contactCountryCode: v })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className={errors.contactPhone ? "border-destructive flex-1" : "flex-1"}
                />
              </div>
              {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone}</p>}
            </div>

            <div className="space-y-2">
              <Label>電郵地址 / E-mail <span className="text-destructive">*</span></Label>
              <EmailVerification
                email={formData.contactEmail}
                onEmailChange={(email) => {
                  setFormData({ ...formData, contactEmail: email });
                  setIsEmailVerified(false);
                }}
                onVerified={() => setIsEmailVerified(true)}
                disabled={false}
              />
              {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
            </div>

          </div>
        </div>
      </div>
    </ApplicationWizard>
  );
}
