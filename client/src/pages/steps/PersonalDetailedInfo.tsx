import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { validateHKID, validateChinaIDWithMatch, validateIDExpiry } from "@/lib/validators";
import { useLang } from '@/lib/i18n';

export default function PersonalDetailedInfo() {
  const { t } = useLang();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();
  const { user } = useAuth();

  const idIssuingCountries = [
    { value: "HK", label: t("香港", "Hong Kong") },
    { value: "CN", label: t("中國內地", "Chinese Mainland", "中国内地") },
    { value: "MO", label: t("澳門", "Macau", "澳门") },
    { value: "TW", label: t("台灣", "Taiwan", "台湾") },
    { value: "US", label: t("美國", "United States", "美国") },
    { value: "GB", label: t("英國", "United Kingdom", "英国") },
    { value: "SG", label: t("新加坡", "Singapore") },
    { value: "AU", label: t("澳洲", "Australia") },
    { value: "CA", label: t("加拿大", "Canada") },
    { value: "JP", label: t("日本", "Japan") },
    { value: "OTHER", label: t("其他", "Other") },
  ];

  const idTypes = [
    { value: "hkid", label: t("香港身份證", "HKID", "香港身份证") },
    { value: "passport", label: t("護照", "Passport", "护照") },
    { value: "mainland_id", label: t("中國大陸身份證", "Mainland ID", "中国大陆身份证") },
    { value: "other", label: t("其他", "Other") },
  ];

  const maritalStatuses = [
    { value: "single", label: t("單身", "Single", "单身") },
    { value: "married", label: t("已婚", "Married") },
    { value: "divorced", label: t("離異", "Divorced", "离异") },
    { value: "widowed", label: t("喪偶", "Widowed", "丧偶") },
  ];

  const educationLevels = [
    { value: "high_school", label: t("中學", "High School", "中学") },
    { value: "associate", label: t("副學士", "Associate Degree", "副学士") },
    { value: "bachelor", label: t("學士", "Bachelor", "学士") },
    { value: "master", label: t("碩士", "Master", "硕士") },
    { value: "doctorate", label: t("博士", "Doctorate") },
    { value: "other", label: t("其他", "Other") },
  ];

  const countryCodes = [
    { value: "+852", label: t("+852 (香港)", "+852 (HK)") },
    { value: "+86", label: t("+86 (中國)", "+86 (CN)", "+86 (中国)") },
    { value: "+1", label: t("+1 (美國/加拿大)", "+1 (US/CA)", "+1 (美国/加拿大)") },
    { value: "+44", label: t("+44 (英國)", "+44 (UK)", "+44 (英国)") },
    { value: "+65", label: t("+65 (新加坡)", "+65 (SG)") },
    { value: "+81", label: t("+81 (日本)", "+81 (JP)") },
    { value: "+82", label: t("+82 (韓國)", "+82 (KR)", "+82 (韩国)") },
  ];

  // Check if joint account
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isJoint = accountSelection?.customerType === 'joint';

  // 獲取用戶基本信息（用於匹配身份證信息）
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
    // 住宅電話（可選）
    phoneCountryCode: "+852",
    phoneNumber: "",
    // 手機號碼（必填）
    mobileCountryCode: "+852",
    mobileNumber: "",
    faxNo: "", // 傳真號碼（可選）
    residentialAddress: "",
    // 賬單通訊地址
    billingAddressType: "residential" as "residential" | "office" | "other",
    billingAddressOther: "",
    // 賬單首選語言
    preferredLanguage: "chinese" as "chinese" | "english",
  });

  // Joint account: second holder
  const [secondHolder, setSecondHolder] = useState({
    idType: "",
    idNumber: "",
    idIssuingCountry: "",
    idIssuingPlaceOther: "",
    idExpiryDate: "",
    idIsPermanent: false,
    maritalStatus: "",
    educationLevel: "",
    mobileCountryCode: "+852",
    mobileNumber: "",
    residentialAddress: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // SMS phone verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'personalDetailed' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      setSecondHolder(prev => ({ ...prev, ...(existingSecondHolder as any) }));
    }
  }, [existingSecondHolder]);

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
        toast.success(t("保存成功", "Saved successfully", "保存成功"));
        setLocation(`/application/${applicationId}/step/4`);
      }
    },
    onError: (error) => {
      toast.error(t(`保存失敗: ${error.message}`, `Save failed: ${error.message}`, `保存失败: ${error.message}`));
    },
  });

  const saveOnlyMutation = trpc.personalDetailed.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("保存成功", "Saved successfully", "保存成功"));
      }
    },
    onError: (error) => {
      toast.error(t(`保存失敗: ${error.message}`, `Save failed: ${error.message}`, `保存失败: ${error.message}`));
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        ...existingData,
        idIsPermanent: !!existingData.idIsPermanent,
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
      // 從數據庫讀取郵箱驗證狀態
      if (existingData.emailVerified) {
        setEmailVerified(true);
      } else if (!existingData.email && user?.email) {
        // 註冊時已驗證過電郵，自動標記為已驗證
        setEmailVerified(true);
      }
      // 從數據庫讀取手機驗證狀態
      if ((existingData as any).phoneVerified) {
        setPhoneVerified(true);
      }
    } else if (user?.email) {
      // 首次進入，用註冊電郵預填
      setFormData(prev => ({ ...prev, email: user.email }) as any);
      setEmailVerified(true);
    }
  }, [existingData, user]);

  // 倒計時器 (email)
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 倒計時器 (SMS)
  useEffect(() => {
    if (smsCountdown > 0) {
      const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [smsCountdown]);

  const sendVerificationCodeMutation = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      toast.success(t("驗證碼已發送至您的郵箱，請查收！", "Verification code sent to your email!", "验证码已发送至您的邮箱，请查收！"), {
        duration: 5000,
        description: t("請在下方輸入框中輸入6位數字驗證碼", "Please enter the 6-digit code below", "请在下方输入框中输入6位数字验证码")
      });
      setShowVerificationInput(true);
      setCountdown(90);
      setIsSendingCode(false);
      setTimeout(() => {
        document.getElementById('verificationCode')?.focus();
      }, 100);
    },
    onError: (error) => {
      toast.error(t(`發送失敗: ${error.message}`, `Send failed: ${error.message}`, `发送失败: ${error.message}`));
      setIsSendingCode(false);
    },
  });

  const verifyCodeMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: () => {
      toast.success(t("郵箱驗證成功", "Email verified successfully", "邮箱验证成功"));
      setEmailVerified(true);
      setShowVerificationInput(false);
      setCountdown(0);
    },
    onError: (error) => {
      toast.error(t(`驗證失敗: ${error.message}`, `Verification failed: ${error.message}`, `验证失败: ${error.message}`));
    },
  });

  const handleSendVerificationCode = () => {
    if (!formData.email.trim()) {
      toast.error(t("請先輸入郵箱地址", "Please enter your email address first", "请先输入邮箱地址"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t("請輸入有效的郵箱地址", "Please enter a valid email address", "请输入有效的邮箱地址"));
      return;
    }
    setIsSendingCode(true);
    sendVerificationCodeMutation.mutate({ email: formData.email });
  };

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      toast.error(t("請輸入驗證碼", "Please enter the verification code", "请输入验证码"));
      return;
    }
    if (verificationCode.length !== 6) {
      toast.error(t("驗證碼必須為6位數字", "Verification code must be 6 digits", "验证码必须为6位数字"));
      return;
    }
    verifyCodeMutation.mutate({ email: formData.email, code: verificationCode });
  };

  // SMS verification mutations
  const sendSmsMutation = trpc.sms.sendVerification.useMutation({
    onSuccess: () => {
      toast.success(t("驗證碼已發送至您的手機，請查收！", "Verification code sent to your phone!", "验证码已发送至您的手机，请查收！"), { duration: 5000 });
      setShowSmsInput(true);
      setSmsCountdown(90);
      setIsSendingSms(false);
      setTimeout(() => {
        document.getElementById('smsCode')?.focus();
      }, 100);
    },
    onError: (error) => {
      toast.error(t(`發送失敗: ${error.message}`, `Send failed: ${error.message}`, `发送失败: ${error.message}`));
      setIsSendingSms(false);
    },
  });

  const checkSmsMutation = trpc.sms.checkVerification.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("手機號碼驗證成功", "Phone number verified successfully", "手机号码验证成功"));
        setPhoneVerified(true);
        setShowSmsInput(false);
        setSmsCountdown(0);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(t(`驗證失敗: ${error.message}`, `Verification failed: ${error.message}`, `验证失败: ${error.message}`));
    },
  });

  const handleSendSmsCode = () => {
    if (!formData.mobileNumber.trim()) {
      toast.error(t("請先輸入手機號碼", "Please enter your mobile number first", "请先输入手机号码"));
      return;
    }
    setIsSendingSms(true);
    const fullPhone = formData.mobileCountryCode + formData.mobileNumber;
    sendSmsMutation.mutate({ phoneNumber: fullPhone });
  };

  const handleVerifySmsCode = () => {
    if (!smsCode.trim()) {
      toast.error(t("請輸入驗證碼", "Please enter the verification code", "请输入验证码"));
      return;
    }
    if (smsCode.length !== 6) {
      toast.error(t("驗證碼必須為6位數字", "Verification code must be 6 digits", "验证码必须为6位数字"));
      return;
    }
    const fullPhone = formData.mobileCountryCode + formData.mobileNumber;
    checkSmsMutation.mutate({
      phoneNumber: fullPhone,
      code: smsCode,
      applicationId,
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.idType) newErrors.idType = t("請選擇證件類型", "Please select ID type", "请选择证件类型");

    // 證件號碼校驗
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = t("請輸入證件號碼", "Please enter ID number", "请输入证件号码");
    } else {
      // 根據證件類型進行格式校驗
      if (formData.idType === 'hkid') {
        const hkidResult = validateHKID(formData.idNumber);
        if (!hkidResult.valid) {
          newErrors.idNumber = hkidResult.message || t('香港身份證格式不正確', 'Invalid HKID format', '香港身份证格式不正确');
        }
      } else if (formData.idType === 'mainland_id') {
        const cnidResult = validateChinaIDWithMatch(
          formData.idNumber,
          basicInfo?.dateOfBirth,
          basicInfo?.gender as 'male' | 'female' | 'other' | undefined
        );
        if (!cnidResult.valid) {
          newErrors.idNumber = cnidResult.message || t('大陸身份證格式不正確', 'Invalid Mainland ID format', '大陆身份证格式不正确');
        }
      }
    }
    if (!formData.idIssuingCountry) newErrors.idIssuingCountry = t("請選擇證件簽發國家/地區", "Please select issuing country/region", "请选择证件签发国家/地区");
    if (formData.idIssuingCountry === "OTHER" && !formData.idIssuingPlaceOther?.trim()) {
      newErrors.idIssuingPlaceOther = t("請輸入證件簽發國家/地區", "Please enter issuing country/region", "请输入证件签发国家/地区");
    }

    if (!formData.idIsPermanent) {
      if (!formData.idExpiryDate) {
        newErrors.idExpiryDate = t("請選擇證件有效期", "Please select ID expiry date", "请选择证件有效期");
      } else {
        const expiryResult = validateIDExpiry(formData.idExpiryDate);
        if (!expiryResult.valid) {
          newErrors.idExpiryDate = expiryResult.message || t('證件有效期必須大於1年', 'ID must be valid for more than 1 year', '证件有效期必须大于1年');
        }
      }
    }

    if (!formData.maritalStatus) newErrors.maritalStatus = t("請選擇婚姻狀況", "Please select marital status", "请选择婚姻状况");
    if (!formData.educationLevel) newErrors.educationLevel = t("請選擇學歷", "Please select education level", "请选择学历");

    // 郵箱校驗
    if (!formData.email.trim()) {
      newErrors.email = t("請輸入電郵地址", "Please enter email address", "请输入电邮地址");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("請輸入有效的電郵地址", "Please enter a valid email address", "请输入有效的电邮地址");
    }

    // 手機號碼必填
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = t("請輸入手機號碼", "Please enter mobile number", "请输入手机号码");

    if (!formData.residentialAddress.trim()) newErrors.residentialAddress = t("請輸入住宅地址", "Please enter residential address", "请输入住宅地址");

    // 賬單通訊地址驗證
    if (formData.billingAddressType === "other" && !formData.billingAddressOther.trim()) {
      newErrors.billingAddressOther = t("請輸入賬單通訊地址", "Please enter billing address", "请输入账单通讯地址");
    }

    // 聯名賬戶：驗證第二持有人
    if (isJoint) {
      if (!secondHolder.idType) newErrors.secondIdType = t("請填寫第二持有人的證件類型", "Please select second holder's ID type", "请填写第二持有人的证件类型");
      if (!secondHolder.idNumber.trim()) newErrors.secondIdNumber = t("請填寫第二持有人的證件號碼", "Please enter second holder's ID number", "请填写第二持有人的证件号码");
      if (!secondHolder.idIssuingCountry) newErrors.secondIdIssuingCountry = t("請填寫第二持有人的證件簽發國家/地區", "Please select second holder's issuing country/region", "请填写第二持有人的证件签发国家/地区");
      if (secondHolder.idIssuingCountry === "OTHER" && !secondHolder.idIssuingPlaceOther?.trim()) {
        newErrors.secondIdIssuingPlaceOther = t("請填寫第二持有人的證件簽發國家/地區", "Please enter second holder's issuing country/region", "请填写第二持有人的证件签发国家/地区");
      }
      if (!secondHolder.idIsPermanent && !secondHolder.idExpiryDate) {
        newErrors.secondIdExpiryDate = t("請填寫第二持有人的證件有效期", "Please select second holder's ID expiry date", "请填写第二持有人的证件有效期");
      }
      if (!secondHolder.maritalStatus) newErrors.secondMaritalStatus = t("請填寫第二持有人的婚姻狀況", "Please select second holder's marital status", "请填写第二持有人的婚姻状况");
      if (!secondHolder.educationLevel) newErrors.secondEducationLevel = t("請填寫第二持有人的學歷", "Please select second holder's education level", "请填写第二持有人的学历");
      if (!secondHolder.mobileNumber.trim()) newErrors.secondMobileNumber = t("請填寫第二持有人的手機號碼", "Please enter second holder's mobile number", "请填写第二持有人的手机号码");
      if (!secondHolder.residentialAddress.trim()) newErrors.secondResidentialAddress = t("請填寫第二持有人的住宅地址", "Please enter second holder's residential address", "请填写第二持有人的住宅地址");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error(t("請檢查表單中的錯誤", "Please check the form for errors", "请检查表单中的错误"));
      return;
    }

    saveOnlyMutation.mutate({
      applicationId,
      ...formData,
      idIsPermanent: !!formData.idIsPermanent,
      idExpiryDate: formData.idIsPermanent ? undefined : formData.idExpiryDate,
      emailVerified,
    });
    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'personalDetailed', data: secondHolder });
    }
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error(t("請檢查表單中的錯誤", "Please check the form for errors", "请检查表单中的错误"));
      return;
    }

    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'personalDetailed', data: secondHolder });
    }
    saveMutation.mutate({
      applicationId,
      ...formData,
      idIsPermanent: !!formData.idIsPermanent,
      idExpiryDate: formData.idIsPermanent ? undefined : formData.idExpiryDate,
      emailVerified,
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
        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">{t('賬戶主要持有人', 'Primary Account Holder', '账户主要持有人')}</h3>
        )}
        {/* 身份證件類型 */}
        <div className="space-y-2">
          <Label htmlFor="idType">
            {t('身份證件類型', 'ID Type', '身份证件类型')} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.idType}
            onValueChange={(v) => {
              setFormData({ ...formData, idType: v });
              if (errors.idType) setErrors({ ...errors, idType: "" });
            }}
          >
            <SelectTrigger className={errors.idType ? "border-destructive" : ""}>
              <SelectValue placeholder={t('請選擇證件類型', 'Please select ID type', '请选择证件类型')} />
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
              {t('證件號碼', 'ID Number', '证件号码')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => {
                let val = e.target.value.replace(/（/g, '(').replace(/）/g, ')').toUpperCase();
                // 大陸身份證只允許數字和X，最多18位
                if (formData.idType === 'mainland_id') {
                  val = val.replace(/[^\dX]/g, '').slice(0, 18);
                }
                setFormData({ ...formData, idNumber: val });
                if (errors.idNumber) setErrors({ ...errors, idNumber: "" });
              }}
              placeholder={formData.idType === 'mainland_id' ? t('請輸入18位身份證號碼', 'Please enter 18-digit ID number', '请输入18位身份证号码') : t('請輸入證件號碼', 'Please enter ID number', '请输入证件号码')}
              maxLength={formData.idType === 'mainland_id' ? 18 : undefined}
              className={errors.idNumber ? "border-destructive" : ""}
            />
            {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber}</p>}
          </div>

          {/* 證件簽發國家/地區 */}
          <div className="space-y-2">
            <Label htmlFor="idIssuingCountry">
              {t('證件簽發國家/地區', 'Issuing Country/Region', '证件签发国家/地区')} <span className="text-destructive">*</span>
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
                <SelectValue placeholder={t('請選擇國家/地區', 'Please select country/region', '请选择国家/地区')} />
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
                {t('請輸入國家/地區', 'Please enter country/region', '请输入国家/地区')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="idIssuingPlaceOther"
                value={formData.idIssuingPlaceOther}
                onChange={(e) => {
                  setFormData({ ...formData, idIssuingPlaceOther: e.target.value });
                  if (errors.idIssuingPlaceOther) setErrors({ ...errors, idIssuingPlaceOther: "" });
                }}
                placeholder={t('請輸入國家/地區', 'Please enter country/region', '请输入国家/地区')}
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
              {t('證件長期有效', 'Permanent', '证件长期有效')}
            </Label>
          </div>

          {!formData.idIsPermanent && (
            <>
              <Label htmlFor="idExpiryDate">
                {t('證件有效期', 'Expiry Date', '证件有效期')} <span className="text-destructive">*</span>
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
              {t('婚姻狀況', 'Marital Status', '婚姻状况')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(v) => {
                setFormData({ ...formData, maritalStatus: v });
                if (errors.maritalStatus) setErrors({ ...errors, maritalStatus: "" });
              }}
            >
              <SelectTrigger className={errors.maritalStatus ? "border-destructive" : ""}>
                <SelectValue placeholder={t('請選擇婚姻狀況', 'Please select marital status', '请选择婚姻状况')} />
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
              {t('學歷', 'Education Level', '学历')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.educationLevel}
              onValueChange={(v) => {
                setFormData({ ...formData, educationLevel: v });
                if (errors.educationLevel) setErrors({ ...errors, educationLevel: "" });
              }}
            >
              <SelectTrigger className={errors.educationLevel ? "border-destructive" : ""}>
                <SelectValue placeholder={t('請選擇學歷', 'Please select education level', '请选择学历')} />
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
              {t('電郵地址', 'Email', '电邮地址')} <span className="text-destructive">*</span>
              <span className="text-sm text-green-600 ml-2">{t('（已於註冊時驗證）', '(Verified during registration)', '（已于注册时验证）')}</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              placeholder="example@email.com"
              className="bg-green-50 border-green-300"
              disabled
            />
            <p className="text-xs text-muted-foreground">{t('此電郵地址自動套用您註冊時驗證的電郵', 'This email is automatically applied from your registration', '此电邮地址自动套用您注册时验证的电邮')}</p>
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        {/* 住宅電話 */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            {t('住宅電話', 'Residential Phone', '住宅电话')}
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
              placeholder={t('請輸入住宅電話', 'Please enter residential phone', '请输入住宅电话')}
              className={`flex-1 ${errors.phoneNumber ? "border-destructive" : ""}`}
            />
          </div>
          {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
        </div>

        {/* 手機號碼 */}
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">
            {t('手機號碼', 'Mobile Number', '手机号码')} <span className="text-destructive">*</span>
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
              placeholder={t('請輸入手機號碼', 'Please enter mobile number', '请输入手机号码')}
              className={`flex-1 ${errors.mobileNumber ? "border-destructive" : ""}`}
            />
          </div>
          {errors.mobileNumber && <p className="text-sm text-destructive">{errors.mobileNumber}</p>}

          {/* SMS Verification */}
          {phoneVerified ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {t('手機號碼已驗證', 'Phone number verified', '手机号码已验证')}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSendingSms || smsCountdown > 0 || !formData.mobileNumber.trim()}
                  onClick={handleSendSmsCode}
                >
                  {isSendingSms ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" />{t('發送中...', 'Sending...', '发送中...')}</>
                  ) : smsCountdown > 0 ? (
                    `${smsCountdown}s ${t('後重發', 'to resend', '后重发')}`
                  ) : (
                    t('發送短信驗證碼', 'Send SMS code', '发送短信验证码')
                  )}
                </Button>
              </div>
              {showSmsInput && (
                <div className="flex gap-2 items-center">
                  <Input
                    id="smsCode"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={t('請輸入6位驗證碼', 'Enter 6-digit code', '请输入6位验证码')}
                    className="w-[200px]"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={smsCode.length !== 6 || checkSmsMutation.isPending}
                    onClick={handleVerifySmsCode}
                  >
                    {checkSmsMutation.isPending ? (
                      <><Loader2 className="mr-1 h-3 w-3 animate-spin" />{t('驗證中...', 'Verifying...', '验证中...')}</>
                    ) : (
                      t('驗證', 'Verify', '验证')
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 傳真號碼 */}
        <div className="space-y-2">
          <Label htmlFor="faxNo">
            {t('傳真號碼', 'Fax Number', '传真号码')}
          </Label>
          <Input
            id="faxNo"
            value={formData.faxNo}
            onChange={(e) => setFormData({ ...formData, faxNo: e.target.value })}
            placeholder={t('請輸入傳真號碼', 'Please enter fax number', '请输入传真号码')}
          />
        </div>

        {/* 住宅地址 */}
        <div className="space-y-2">
          <Label htmlFor="residentialAddress">
            {t('住宅地址', 'Residential Address', '住宅地址')} <span className="text-destructive">*</span>
          </Label>
            <Textarea
              id="residentialAddress"
              value={formData.residentialAddress}
              onChange={(e) => {
                setFormData({ ...formData, residentialAddress: e.target.value });
                if (errors.residentialAddress) setErrors({ ...errors, residentialAddress: "" });
              }}
              onBlur={() => {
                // 失焦時自動轉換簡體為繁體
                const converted = convertToTraditional(formData.residentialAddress);
                if (converted !== formData.residentialAddress) {
                  setFormData({ ...formData, residentialAddress: converted });
                }
              }}
              placeholder={t('請輸入完整住宅地址', 'Please enter full residential address', '请输入完整住宅地址')}
              rows={3}
              className={errors.residentialAddress ? "border-destructive" : ""}
            />
          {errors.residentialAddress && <p className="text-sm text-destructive">{errors.residentialAddress}</p>}
        </div>

        {/* 賬單通訊地址 */}
        <div className="space-y-2">
          <Label>
            {t('賬單通訊地址', 'Billing Address', '账单通讯地址')} <span className="text-destructive">*</span>
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
                <span>{t('住宅住址', 'Residential Address', '住宅住址')}</span>
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
                <span>{t('辦公地址', 'Office Address', '办公地址')}</span>
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
                <span>{t('其他', 'Other')}</span>
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
                placeholder={t('請輸入完整賬單通訊地址', 'Please enter full billing address', '请输入完整账单通讯地址')}
                rows={3}
                className={errors.billingAddressOther ? "border-destructive" : ""}
              />
            )}
            {errors.billingAddressOther && <p className="text-sm text-destructive">{errors.billingAddressOther}</p>}
          </div>
        </div>

        {/* 賬單首選語言 */}
        <div className="space-y-2">
          <Label>
            {t('賬單首選語言', 'Preferred Language for Statements', '账单首选语言')} <span className="text-destructive">*</span>
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
              <span>{t('中文', 'Chinese')}</span>
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
              <span>{t('英文', 'English')}</span>
            </label>
          </div>
        </div>

        {/* 聯名賬戶：第二持有人 */}
        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mt-8 mb-2">{t('賬戶第二持有人', 'Second Account Holder', '账户第二持有人')}</h3>
            {/* 身份證件類型 */}
            <div className="space-y-2">
              <Label>
                {t('身份證件類型', 'ID Type', '身份证件类型')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={secondHolder.idType}
                onValueChange={(v) => {
                  setSecondHolder({ ...secondHolder, idType: v });
                  if (errors.secondIdType) setErrors({ ...errors, secondIdType: "" });
                }}
              >
                <SelectTrigger className={errors.secondIdType ? "border-destructive" : ""}>
                  <SelectValue placeholder={t('請選擇證件類型', 'Please select ID type', '请选择证件类型')} />
                </SelectTrigger>
                <SelectContent>
                  {idTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.secondIdType && <p className="text-sm text-destructive">{errors.secondIdType}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 證件號碼 */}
              <div className="space-y-2">
                <Label>
                  {t('證件號碼', 'ID Number', '证件号码')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={secondHolder.idNumber}
                  onChange={(e) => {
                    let val = e.target.value.replace(/（/g, '(').replace(/）/g, ')').toUpperCase();
                    if (secondHolder.idType === 'mainland_id') {
                      val = val.replace(/[^\dX]/g, '').slice(0, 18);
                    }
                    setSecondHolder({ ...secondHolder, idNumber: val });
                    if (errors.secondIdNumber) setErrors({ ...errors, secondIdNumber: "" });
                  }}
                  placeholder={secondHolder.idType === 'mainland_id' ? t('請輸入18位身份證號碼', 'Please enter 18-digit ID number', '请输入18位身份证号码') : t('請輸入證件號碼', 'Please enter ID number', '请输入证件号码')}
                  maxLength={secondHolder.idType === 'mainland_id' ? 18 : undefined}
                  className={errors.secondIdNumber ? "border-destructive" : ""}
                />
                {errors.secondIdNumber && <p className="text-sm text-destructive">{errors.secondIdNumber}</p>}
              </div>

              {/* 證件簽發國家/地區 */}
              <div className="space-y-2">
                <Label>
                  {t('證件簽發國家/地區', 'Issuing Country/Region', '证件签发国家/地区')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={secondHolder.idIssuingCountry}
                  onValueChange={(v) => {
                    setSecondHolder({ ...secondHolder, idIssuingCountry: v, idIssuingPlaceOther: "" });
                    if (errors.secondIdIssuingCountry) setErrors({ ...errors, secondIdIssuingCountry: "" });
                  }}
                >
                  <SelectTrigger className={errors.secondIdIssuingCountry ? "border-destructive" : ""}>
                    <SelectValue placeholder={t('請選擇國家/地區', 'Please select country/region', '请选择国家/地区')} />
                  </SelectTrigger>
                  <SelectContent>
                    {idIssuingCountries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.secondIdIssuingCountry && <p className="text-sm text-destructive">{errors.secondIdIssuingCountry}</p>}
              </div>

              {secondHolder.idIssuingCountry === "OTHER" && (
                <div className="space-y-2">
                  <Label>
                    {t('請輸入國家/地區', 'Please enter country/region', '请输入国家/地区')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={secondHolder.idIssuingPlaceOther}
                    onChange={(e) => {
                      setSecondHolder({ ...secondHolder, idIssuingPlaceOther: e.target.value });
                      if (errors.secondIdIssuingPlaceOther) setErrors({ ...errors, secondIdIssuingPlaceOther: "" });
                    }}
                    placeholder={t('請輸入國家/地區', 'Please enter country/region', '请输入国家/地区')}
                    className={errors.secondIdIssuingPlaceOther ? "border-destructive" : ""}
                  />
                  {errors.secondIdIssuingPlaceOther && <p className="text-sm text-destructive">{errors.secondIdIssuingPlaceOther}</p>}
                </div>
              )}
            </div>

            {/* 證件有效期 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="secondIdIsPermanent"
                  checked={secondHolder.idIsPermanent}
                  onCheckedChange={(checked) => setSecondHolder({ ...secondHolder, idIsPermanent: checked as boolean, idExpiryDate: "" })}
                />
                <Label htmlFor="secondIdIsPermanent" className="cursor-pointer">
                  {t('證件長期有效', 'Permanent', '证件长期有效')}
                </Label>
              </div>
              {!secondHolder.idIsPermanent && (
                <>
                  <Label>
                    {t('證件有效期', 'Expiry Date', '证件有效期')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={secondHolder.idExpiryDate}
                    onChange={(e) => {
                      setSecondHolder({ ...secondHolder, idExpiryDate: e.target.value });
                      if (errors.secondIdExpiryDate) setErrors({ ...errors, secondIdExpiryDate: "" });
                    }}
                    className={errors.secondIdExpiryDate ? "border-destructive" : ""}
                  />
                  {errors.secondIdExpiryDate && <p className="text-sm text-destructive">{errors.secondIdExpiryDate}</p>}
                </>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 婚姻狀況 */}
              <div className="space-y-2">
                <Label>
                  {t('婚姻狀況', 'Marital Status', '婚姻状况')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={secondHolder.maritalStatus}
                  onValueChange={(v) => {
                    setSecondHolder({ ...secondHolder, maritalStatus: v });
                    if (errors.secondMaritalStatus) setErrors({ ...errors, secondMaritalStatus: "" });
                  }}
                >
                  <SelectTrigger className={errors.secondMaritalStatus ? "border-destructive" : ""}>
                    <SelectValue placeholder={t('請選擇婚姻狀況', 'Please select marital status', '请选择婚姻状况')} />
                  </SelectTrigger>
                  <SelectContent>
                    {maritalStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.secondMaritalStatus && <p className="text-sm text-destructive">{errors.secondMaritalStatus}</p>}
              </div>

              {/* 學歷 */}
              <div className="space-y-2">
                <Label>
                  {t('學歷', 'Education Level', '学历')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={secondHolder.educationLevel}
                  onValueChange={(v) => {
                    setSecondHolder({ ...secondHolder, educationLevel: v });
                    if (errors.secondEducationLevel) setErrors({ ...errors, secondEducationLevel: "" });
                  }}
                >
                  <SelectTrigger className={errors.secondEducationLevel ? "border-destructive" : ""}>
                    <SelectValue placeholder={t('請選擇學歷', 'Please select education level', '请选择学历')} />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.secondEducationLevel && <p className="text-sm text-destructive">{errors.secondEducationLevel}</p>}
              </div>
            </div>

            {/* 手機號碼 */}
            <div className="space-y-2">
              <Label>
                {t('手機號碼', 'Mobile Number', '手机号码')} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={secondHolder.mobileCountryCode}
                  onValueChange={(v) => setSecondHolder({ ...secondHolder, mobileCountryCode: v })}
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
                  value={secondHolder.mobileNumber}
                  onChange={(e) => {
                    setSecondHolder({ ...secondHolder, mobileNumber: e.target.value });
                    if (errors.secondMobileNumber) setErrors({ ...errors, secondMobileNumber: "" });
                  }}
                  placeholder={t('請輸入手機號碼', 'Please enter mobile number', '请输入手机号码')}
                  className={`flex-1 ${errors.secondMobileNumber ? "border-destructive" : ""}`}
                />
              </div>
              {errors.secondMobileNumber && <p className="text-sm text-destructive">{errors.secondMobileNumber}</p>}
            </div>

            {/* 住宅地址 */}
            <div className="space-y-2">
              <Label>
                {t('住宅地址', 'Residential Address', '住宅地址')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={secondHolder.residentialAddress}
                onChange={(e) => {
                  setSecondHolder({ ...secondHolder, residentialAddress: e.target.value });
                  if (errors.secondResidentialAddress) setErrors({ ...errors, secondResidentialAddress: "" });
                }}
                onBlur={() => {
                  const converted = convertToTraditional(secondHolder.residentialAddress);
                  if (converted !== secondHolder.residentialAddress) {
                    setSecondHolder({ ...secondHolder, residentialAddress: converted });
                  }
                }}
                placeholder={t('請輸入完整住宅地址', 'Please enter full residential address', '请输入完整住宅地址')}
                rows={3}
                className={errors.secondResidentialAddress ? "border-destructive" : ""}
              />
              {errors.secondResidentialAddress && <p className="text-sm text-destructive">{errors.secondResidentialAddress}</p>}
            </div>
          </>
        )}
      </div>
    </ApplicationWizard>
  );
}
