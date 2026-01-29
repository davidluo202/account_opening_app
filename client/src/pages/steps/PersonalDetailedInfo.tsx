import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { validateHKID, validateChinaIDWithMatch, validateIDExpiry } from "@/lib/validators";

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

  // 获取用户基本信息（用于匹配身份证信息）
  const { data: basicInfo } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const [formData, setFormData] = useState({
    idType: "",
    idNumber: "",
    idIssuingPlace: "",
    idExpiryDate: "",
    idIsPermanent: false,
    maritalStatus: "",
    educationLevel: "",
    email: "",
    phoneCountryCode: "+852",
    phoneNumber: "",
    faxNo: "", // 传真号码（可选）
    residentialAddress: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const { data: existingData, isLoading: isLoadingData } = trpc.personalDetailed.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.personalDetailed.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/5`);
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
        faxNo: existingData.faxNo || "", // 处理可选字段
      });
      // 从数据库读取邮箱验证状态
      if (existingData.emailVerified) {
        setEmailVerified(true);
      }
    }
  }, [existingData]);

  // 倒计时器
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerificationCodeMutation = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送至您的邮箱");
      setShowVerificationInput(true);
      setCountdown(300); // 5分钟倒计时
      setIsSendingCode(false);
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
      newErrors.email = "請先驗證郵箱地址";
    }

    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "請輸入電話號碼";
    if (!formData.residentialAddress.trim()) newErrors.residentialAddress = "請輸入居住地址";

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
      ...formData,
      idExpiryDate: formData.idIsPermanent ? undefined : formData.idExpiryDate,
      emailVerified, // 保存邮箱验证状态
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={4}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={4}
      onNext={handleNext}
      isNextLoading={saveMutation.isPending}
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

          {/* 證件簽發地 */}
          <div className="space-y-2">
            <Label htmlFor="idIssuingPlace">
              證件簽發地 / Issuing Place <span className="text-destructive">*</span>
            </Label>
            <Input
              id="idIssuingPlace"
              value={formData.idIssuingPlace}
              onChange={(e) => {
                setFormData({ ...formData, idIssuingPlace: e.target.value });
                if (errors.idIssuingPlace) setErrors({ ...errors, idIssuingPlace: "" });
              }}
              onBlur={() => {
                // 失焦时自动转换简体为繁体
                const converted = convertToTraditional(formData.idIssuingPlace);
                if (converted !== formData.idIssuingPlace) {
                  setFormData({ ...formData, idIssuingPlace: converted });
                }
              }}
              placeholder="請輸入證件簽發地"
              className={errors.idIssuingPlace ? "border-destructive" : ""}
            />
            {errors.idIssuingPlace && <p className="text-sm text-destructive">{errors.idIssuingPlace}</p>}
          </div>
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

        {/* 電子郵箱 */}
        <div className="space-y-2">
          <Label htmlFor="email">
            電子郵箱 / Email <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: "" });
                setEmailVerified(false);
              }}
              placeholder="example@email.com"
              className={errors.email ? "border-destructive" : ""}
              disabled={emailVerified}
            />
            {!emailVerified && (
              <button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={isSendingCode || countdown > 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSendingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : countdown > 0 ? (
                  `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                ) : (
                  "驗證"
                )}
              </button>
            )}
            {emailVerified && (
              <span className="flex items-center text-green-600 whitespace-nowrap">
                ✓ 已驗證
              </span>
            )}
          </div>
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          
          {/* 验证码输入 */}
          {showVerificationInput && !emailVerified && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="verificationCode">
                驗證碼 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="verificationCode"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="請輸入6位數字驗證碼"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {verifyCodeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "確認"
                  )}
                </button>
                {countdown > 0 && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={countdown > 0 || isSendingCode}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    重發
                  </button>
                )}
              </div>
              {countdown > 0 && (
                <p className="text-sm text-muted-foreground">
                  驗證碼將在 {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')} 後過期
                </p>
              )}
            </div>
          )}
        </div>

        {/* 電話號碼 */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            電話號碼 / Phone Number <span className="text-destructive">*</span>
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
              placeholder="請輸入電話號碼"
              className={`flex-1 ${errors.phoneNumber ? "border-destructive" : ""}`}
            />
          </div>
          {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
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
            <Input
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
              className={errors.residentialAddress ? "border-destructive" : ""}
            />
          {errors.residentialAddress && <p className="text-sm text-destructive">{errors.residentialAddress}</p>}
        </div>
      </div>
    </ApplicationWizard>
  );
}
