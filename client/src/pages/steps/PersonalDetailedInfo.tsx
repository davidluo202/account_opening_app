import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { validateHKID, validateChinaIDWithMatch, validateIDExpiry } from "@/lib/validators";

const idIssuingCountries = [
  { value: "HK", label: "香港 Hong Kong" },
  { value: "CN", label: "中國內地 Chinese Mainland" },
  { value: "MO", label: "澳門 Macau" },
  { value: "TW", label: "台灣 Taiwan" },
  { value: "US", label: "美國 United States" },
  { value: "GB", label: "英國 United Kingdom" },
  { value: "SG", label: "新加坡 Singapore" },
  { value: "AU", label: "澳洲 Australia" },
  { value: "CA", label: "加拿大 Canada" },
  { value: "JP", label: "日本 Japan" },
  { value: "OTHER", label: "其他 Other" },
];

const idTypes = [
  { value: "hkid", label: "香港身份證 / HKID" },
  { value: "passport", label: "護照 / Passport" },
  { value: "mainland_id", label: "中國大陸身份證 / Mainland ID" },
  { value: "other", label: "其他 / Other" },
];

const maritalStatuses = [
  { value: "single", label: "單身 / Single" },
  { value: "married", label: "已婚 / Married" },
  { value: "divorced", label: "離異 / Divorced" },
  { value: "widowed", label: "喪偶 / Widowed" },
];

const educationLevels = [
  { value: "high_school", label: "中學 / High School" },
  { value: "associate", label: "副學士 / Associate Degree" },
  { value: "bachelor", label: "學士 / Bachelor" },
  { value: "master", label: "碩士 / Master" },
  { value: "doctorate", label: "博士 / Doctorate" },
  { value: "other", label: "其他 / Other" },
];

const countryCodes = [
  { value: "+852", label: "+852 (香港)" },
  { value: "+86", label: "+86 (中國)" },
  { value: "+1", label: "+1 (美國/加拿大)" },
  { value: "+44", label: "+44 (英國)" },
  { value: "+65", label: "+65 (新加坡)" },
  { value: "+81", label: "+81 (日本)" },
  { value: "+82", label: "+82 (韓國)" },
];

export default function PersonalDetailedInfo() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();
  const { user } = useAuth();

  // 获取用户基本信息（用于匹配身份证信息）
  const { data: basicInfo, error: basicInfoError } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { 
      enabled: !!applicationId,
      retry: 1,
    }
  );

  // Log error for debugging
  if (basicInfoError) {
    console.error("Error fetching basic info:", basicInfoError);
  }

  const [formData, setFormData] = useState({
    idType: "",
    idNumber: "",
    idIssuingCountry: "",
    idIssuingPlaceOther: "",
    idIssuingPlace: "",
    idExpiryDate: "",
    idIsPermanent: false,
    maritalStatus: "",
    educationLevel: "",
    email: "",
    // 住宅电话（可选）
    phoneCountryCode: "+852",
    phoneNumber: "",
    // 手机号码（必填）
    mobileCountryCode: "+852",
    mobileNumber: "",
    faxNo: "", // 传真号码（可选）
    residentialAddress: "",
    // 账单通讯地址
    billingAddressType: "residential" as "residential" | "office" | "other",
    billingAddressOther: "",
    // 账单首选语言
    preferredLanguage: "chinese" as "chinese" | "english",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const { data: existingData, isLoading: isLoadingData, error: detailedInfoError } = trpc.personalDetailed.get.useQuery(
    { applicationId },
    { 
      enabled: !!applicationId,
      retry: 1,
    }
  );

  // Log error for debugging
  if (detailedInfoError) {
    console.error("Error fetching detailed info:", detailedInfoError);
  }

  const saveMutation = trpc.personalDetailed.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/4`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.personalDetailed.save.useMutation({
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
      setFormData({
        ...existingData,
        idExpiryDate: existingData.idExpiryDate || "",
        faxNo: existingData.faxNo || "",
        phoneCountryCode: existingData.phoneCountryCode || "+852",
        phoneNumber: existingData.phoneNumber || "",
        billingAddressOther: existingData.billingAddressOther || "",
        idIssuingCountry: existingData.idIssuingCountry || "",
        idIssuingPlaceOther: existingData.idIssuingPlaceOther || "",
        // 如果表格中尚無電郵，自動填入註冊時驗證過的電郵
        email: existingData.email || (user?.email ?? ""),
      });
      // 从数据库读取邮箱验证状态
      if (existingData.emailVerified) {
        setEmailVerified(true);
      } else if (!existingData.email && user?.email) {
        // 註冊時已驗證過電郵，自動標記為已驗證
        setEmailVerified(true);
      }
    } else if (user?.email) {
      // 首次進入，用註冊電郵預填
      setFormData(prev => ({ ...prev, email: user.email }));
      setEmailVerified(true);
    }
  }, [existingData, user]);

  // 倒计时器
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerificationCodeMutation = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送至您的邮箱，请查收！", {
        duration: 5000, // 显示5秒
        description: "请在下方输入框中输入6位数字验证码"
      });
      setShowVerificationInput(true);
      setCountdown(90); // 90秒倒计时
      setIsSendingCode(false);
      // 自动聚焦到验证码输入框
      setTimeout(() => {
        document.getElementById('verificationCode')?.focus();
      }, 100);
    },
    onError: (error) => {
      toast.error(`发送失败: ${error.message}`);
      setIsSendingCode(false);
    },
  });

  const verifyCodeMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("邮箱验证成功");
      setEmailVerified(true);
      setShowVerificationInput(false);
      setCountdown(0);
    },
    onError: (error) => {
      toast.error(`验证失败: ${error.message}`);
    },
  });

  const handleSendVerificationCode = () => {
    if (!formData.email.trim()) {
      toast.error("请先输入邮箱地址");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }
    setIsSendingCode(true);
    sendVerificationCodeMutation.mutate({ email: formData.email });
  };

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      toast.error("请输入验证码");
      return;
    }
    if (verificationCode.length !== 6) {
      toast.error("验证码必须为6位数字");
      return;
    }
    verifyCodeMutation.mutate({ email: formData.email, code: verificationCode });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.idType) newErrors.idType = "請選擇證件類型";
    
    // 證件號碼校驗
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "請輸入證件號碼";
    } else {
      // 根據證件類型進行格式校驗
      if (formData.idType === 'hkid') {
        const hkidResult = validateHKID(formData.idNumber);
        if (!hkidResult.valid) {
          newErrors.idNumber = hkidResult.message || '香港身份證格式不正確';
        }
      } else if (formData.idType === 'mainland_id') {
        // 使用增强的校验函数，匹配出生日期和性别
        const cnidResult = validateChinaIDWithMatch(
          formData.idNumber,
          basicInfo?.dateOfBirth,
          basicInfo?.gender as 'male' | 'female' | 'other' | undefined
        );
        if (!cnidResult.valid) {
          newErrors.idNumber = cnidResult.message || '大陸身份證格式不正確';
        }
      }
    }
    if (!formData.idIssuingPlace.trim()) newErrors.idIssuingPlace = "請輸入證件簽發地";
    if (formData.idIssuingCountry === "OTHER" && !formData.idIssuingPlaceOther?.trim()) {
      newErrors.idIssuingPlaceOther = "請輸入證件簽發國家/地區";
    }
    
    // 使用validators.ts中的證件有效期校驗
    if (!formData.idIsPermanent) {
      if (!formData.idExpiryDate) {
        newErrors.idExpiryDate = "請選擇證件有效期";
      } else {
        const expiryResult = validateIDExpiry(formData.idExpiryDate);
        if (!expiryResult.valid) {
          newErrors.idExpiryDate = expiryResult.message || '證件有效期必須大於1年';
        }
      }
    }

    if (!formData.maritalStatus) newErrors.maritalStatus = "請選擇婚姻狀況";
    if (!formData.educationLevel) newErrors.educationLevel = "請選擇學歷";
    
    // 邮箱校验
    if (!formData.email.trim()) {
      newErrors.email = "請輸入電子郵箱";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "請輸入有效的電子郵箱地址";
    } else if (!emailVerified) {
      newErrors.email = "請點擊右側的【驗證】按鈕，完成郵箱驗證後方可繼續";
    }

    // 手机号码必填
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "请输入手机号码";
    // 住宅电话可选，不需要验证
    
    if (!formData.residentialAddress.trim()) newErrors.residentialAddress = "请输入居住地址";
    
    // 账单通讯地址验证
    if (formData.billingAddressType === "other" && !formData.billingAddressOther.trim()) {
      newErrors.billingAddressOther = "请输入账单通讯地址";
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
      idExpiryDate: formData.idIsPermanent ? undefined : formData.idExpiryDate,
      emailVerified, // 保存邮箱验证状态
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
      idExpiryDate: formData.idIsPermanent ? undefined : formData.idExpiryDate,
      emailVerified, // 保存邮箱验证状态
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={3}
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
      currentStep={3}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        {/* 身份證件類型 */}
        <div className="space-y-2">
          <Label htmlFor="idType">
            身份證件類型 / ID Type <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.idType} 
            onValueChange={(v) => {
              setFormData({ ...formData, idType: v });
              if (errors.idType) setErrors({ ...errors, idType: "" });
            }}
          >
            <SelectTrigger className={errors.idType ? "border-destructive" : ""}>
              <SelectValue placeholder="請選擇證件類型" />
            </SelectTrigger>
            <SelectContent>
              {idTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.idType && <p className="text-sm text-destructive">{errors.idType}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 證件號碼 */}
          <div className="space-y-2">
            <Label htmlFor="idNumber">
              證件號碼 / ID Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => {
                setFormData({ ...formData, idNumber: e.target.value });
                if (errors.idNumber) setErrors({ ...errors, idNumber: "" });
              }}
              placeholder="請輸入證件號碼"
              className={errors.idNumber ? "border-destructive" : ""}
            />
            {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber}</p>}
          </div>

          {/* 證件簽發國家/地區 */}
          <div className="space-y-2">
            <Label htmlFor="idIssuingCountry">
              證件簽發國家/地區 / Issuing Country <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.idIssuingCountry}
              onValueChange={(v) => {
                setFormData({ ...formData, idIssuingCountry: v, idIssuingPlaceOther: "" });
                if (errors.idIssuingCountry) setErrors({ ...errors, idIssuingCountry: "" });
                if (errors.idIssuingPlaceOther) setErrors({ ...errors, idIssuingPlaceOther: "" });
              }}
            >
              <SelectTrigger className={errors.idIssuingCountry ? "border-destructive" : ""}>
                <SelectValue placeholder="請選擇國家/地區" />
              </SelectTrigger>
              <SelectContent>
                {idIssuingCountries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.idIssuingCountry && <p className="text-sm text-destructive">{errors.idIssuingCountry}</p>}
          </div>

          {/* 當選擇"其他"時顯示輸入框 */}
          {formData.idIssuingCountry === "OTHER" && (
            <div className="space-y-2">
              <Label htmlFor="idIssuingPlaceOther">
                請輸入國家/地區 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="idIssuingPlaceOther"
                value={formData.idIssuingPlaceOther}
                onChange={(e) => {
                  setFormData({ ...formData, idIssuingPlaceOther: e.target.value });
                  if (errors.idIssuingPlaceOther) setErrors({ ...errors, idIssuingPlaceOther: "" });
                }}
                placeholder="請輸入國家/地區"
                className={errors.idIssuingPlaceOther ? "border-destructive" : ""}
              />
              {errors.idIssuingPlaceOther && <p className="text-sm text-destructive">{errors.idIssuingPlaceOther}</p>}
            </div>
          )}
        </div>

        {/* 證件有效期 */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="idIsPermanent"
              checked={formData.idIsPermanent}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, idIsPermanent: checked as boolean, idExpiryDate: "" });
                if (errors.idExpiryDate) setErrors({ ...errors, idExpiryDate: "" });
              }}
            />
            <Label htmlFor="idIsPermanent" className="cursor-pointer">
              證件長期有效 / Permanent
            </Label>
          </div>
          
          {!formData.idIsPermanent && (
            <>
              <Label htmlFor="idExpiryDate">
                證件有效期 / Expiry Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="idExpiryDate"
                type="date"
                value={formData.idExpiryDate}
                onChange={(e) => {
                  setFormData({ ...formData, idExpiryDate: e.target.value });
                  if (errors.idExpiryDate) setErrors({ ...errors, idExpiryDate: "" });
                }}
                className={errors.idExpiryDate ? "border-destructive" : ""}
              />
              {errors.idExpiryDate && <p className="text-sm text-destructive">{errors.idExpiryDate}</p>}
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 婚姻狀況 */}
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">
              婚姻狀況 / Marital Status <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.maritalStatus} 
              onValueChange={(v) => {
                setFormData({ ...formData, maritalStatus: v });
                if (errors.maritalStatus) setErrors({ ...errors, maritalStatus: "" });
              }}
            >
              <SelectTrigger className={errors.maritalStatus ? "border-destructive" : ""}>
                <SelectValue placeholder="請選擇婚姻狀況" />
              </SelectTrigger>
              <SelectContent>
                {maritalStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.maritalStatus && <p className="text-sm text-destructive">{errors.maritalStatus}</p>}
          </div>

          {/* 學歷 */}
          <div className="space-y-2">
            <Label htmlFor="educationLevel">
              學歷 / Education Level <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.educationLevel} 
              onValueChange={(v) => {
                setFormData({ ...formData, educationLevel: v });
                if (errors.educationLevel) setErrors({ ...errors, educationLevel: "" });
              }}
            >
              <SelectTrigger className={errors.educationLevel ? "border-destructive" : ""}>
                <SelectValue placeholder="請選擇學歷" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.educationLevel && <p className="text-sm text-destructive">{errors.educationLevel}</p>}
          </div>
        </div>

        {/* 電郵地址 */}
        <div className="space-y-2">
            <Label htmlFor="email">
              電郵地址 / Email <span className="text-destructive">*</span>
              <span className="text-sm text-green-600 ml-2">（已於註冊時驗證）</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              placeholder="example@email.com"
              className="bg-green-50 border-green-300"
              disabled
            />
            <p className="text-xs text-muted-foreground">此電郵地址自動套用您註冊時驗證的電郵</p>
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        {/* 住宅电话 */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            住宅電話 / Residential Phone (可選)
          </Label>
          <div className="flex gap-2">
            <Select 
              value={formData.phoneCountryCode} 
              onValueChange={(v) => setFormData({ ...formData, phoneCountryCode: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((code) => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => {
                setFormData({ ...formData, phoneNumber: e.target.value });
                if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: "" });
              }}
              placeholder="请输入住宅电话"
              className={`flex-1 ${errors.phoneNumber ? "border-destructive" : ""}`}
            />
          </div>
          {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
        </div>

        {/* 手机号码 */}
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">
            手机号码 / Mobile Number <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Select 
              value={formData.mobileCountryCode} 
              onValueChange={(v) => setFormData({ ...formData, mobileCountryCode: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((code) => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="mobileNumber"
              value={formData.mobileNumber}
              onChange={(e) => {
                setFormData({ ...formData, mobileNumber: e.target.value });
                if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: "" });
              }}
              placeholder="请输入手机号码"
              className={`flex-1 ${errors.mobileNumber ? "border-destructive" : ""}`}
            />
          </div>
          {errors.mobileNumber && <p className="text-sm text-destructive">{errors.mobileNumber}</p>}
        </div>

        {/* 传真号码 */}
        <div className="space-y-2">
          <Label htmlFor="faxNo">
            传真号码 / Fax Number (可选)
          </Label>
          <Input
            id="faxNo"
            value={formData.faxNo}
            onChange={(e) => setFormData({ ...formData, faxNo: e.target.value })}
            placeholder="请输入传真号码（可选）"
          />
        </div>

        {/* 居住地址 */}
        <div className="space-y-2">
          <Label htmlFor="residentialAddress">
            居住地址 / Residential Address <span className="text-destructive">*</span>
          </Label>
            <Textarea
              id="residentialAddress"
              value={formData.residentialAddress}
              onChange={(e) => {
                setFormData({ ...formData, residentialAddress: e.target.value });
                if (errors.residentialAddress) setErrors({ ...errors, residentialAddress: "" });
              }}
              onBlur={() => {
                // 失焦时自动转换简体为繁体
                const converted = convertToTraditional(formData.residentialAddress);
                if (converted !== formData.residentialAddress) {
                  setFormData({ ...formData, residentialAddress: converted });
                }
              }}
              placeholder="請輸入完整居住地址"
              rows={3}
              className={errors.residentialAddress ? "border-destructive" : ""}
            />
          {errors.residentialAddress && <p className="text-sm text-destructive">{errors.residentialAddress}</p>}
        </div>

        {/* 账单通讯地址 */}
        <div className="space-y-2">
          <Label>
            账单通讯地址 / Billing Address <span className="text-destructive">*</span>
          </Label>
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="billingAddressType"
                  value="residential"
                  checked={formData.billingAddressType === "residential"}
                  onChange={(e) => setFormData({ ...formData, billingAddressType: e.target.value as "residential" | "office" | "other" })}
                  className="w-4 h-4"
                />
                <span>住宅住址 / Residential Address</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="billingAddressType"
                  value="office"
                  checked={formData.billingAddressType === "office"}
                  onChange={(e) => setFormData({ ...formData, billingAddressType: e.target.value as "residential" | "office" | "other" })}
                  className="w-4 h-4"
                />
                <span>办公地址 / Office Address</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="billingAddressType"
                  value="other"
                  checked={formData.billingAddressType === "other"}
                  onChange={(e) => setFormData({ ...formData, billingAddressType: e.target.value as "residential" | "office" | "other" })}
                  className="w-4 h-4"
                />
                <span>其他 / Other</span>
              </label>
            </div>
            {formData.billingAddressType === "other" && (
              <Textarea
                value={formData.billingAddressOther}
                onChange={(e) => {
                  setFormData({ ...formData, billingAddressOther: e.target.value });
                  if (errors.billingAddressOther) setErrors({ ...errors, billingAddressOther: "" });
                }}
                onBlur={() => {
                  const converted = convertToTraditional(formData.billingAddressOther);
                  if (converted !== formData.billingAddressOther) {
                    setFormData({ ...formData, billingAddressOther: converted });
                  }
                }}
                placeholder="请输入完整账单通讯地址"
                rows={3}
                className={errors.billingAddressOther ? "border-destructive" : ""}
              />
            )}
            {errors.billingAddressOther && <p className="text-sm text-destructive">{errors.billingAddressOther}</p>}
          </div>
        </div>

        {/* 账单首选语言 */}
        <div className="space-y-2">
          <Label>
            账单首选语言 / Preferred Language for Statements <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="preferredLanguage"
                value="chinese"
                checked={formData.preferredLanguage === "chinese"}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as "chinese" | "english" })}
                className="w-4 h-4"
              />
              <span>中文 / Chinese</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="preferredLanguage"
                value="english"
                checked={formData.preferredLanguage === "english"}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as "chinese" | "english" })}
                className="w-4 h-4"
              />
              <span>英文 / English</span>
            </label>
          </div>
        </div>
      </div>
    </ApplicationWizard>
  );
}
