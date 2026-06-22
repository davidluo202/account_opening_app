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
import { useAuth } from "@/_core/hooks/useAuth";
import { useLang } from '@/lib/i18n';

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
  const { t } = useLang();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    companyEnglishName: "",
    companyChineseName: "",
    natureOfEntity: "",
    natureOfEntityOther: "",
    natureOfBusiness: "",
    natureOfBusinessOther: "",
    countryOfIncorporation: "",
    countryOfIncorporationOther: "",
    dateOfIncorporation: "",
    certificateOfIncorporationNo: "",
    jurisdictionOfResidence: "",
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
    // 機構專業投資者專用
    website: "",
    isRegulated: "no",
    regulatorName: "",
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
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/3`);
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.corporateBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
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
        // 自動套用註冊電郵（如果表格中沒有已保存的電郵）
        contactEmail: (existingData as any)?.contactEmail || user?.email || "",
      });
    } else if (user?.email) {
      // 首次進入，用註冊電郵預填
      setFormData(prev => ({ ...prev, contactEmail: user.email }) as any);
    }
    setIsEmailVerified(true); // 註冊時已驗證
  }, [existingData, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyEnglishName.trim()) {
      newErrors.companyEnglishName = t('請輸入公司英文名稱', 'Please enter company English name', '请输入公司英文名称');
    } else if (!/^[A-Za-z\s]+$/.test(formData.companyEnglishName)) {
      newErrors.companyEnglishName = t('公司英文名稱只能包含英文字母和空格，不能包含特殊符號', 'Company English name can only contain letters and spaces', '公司英文名称只能包含英文字母和空格，不能包含特殊符号');
    }

    if (
      formData.companyChineseName.trim() &&
      !/^[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+$/.test(formData.companyChineseName)
    ) {
      newErrors.companyChineseName = t('公司中文名稱只能包含中文字（繁/簡會自動轉繁），不能包含特殊字符', 'Company Chinese name can only contain Chinese characters', '公司中文名称只能包含中文字（繁/简会自动转繁），不能包含特殊字符');
    }

    if (!formData.natureOfEntity.trim()) newErrors.natureOfEntity = t('請選擇公司性質', 'Please select nature of entity', '请选择公司性质');
    if (!formData.natureOfBusiness.trim()) newErrors.natureOfBusiness = t('請選擇工作性質', 'Please select nature of business', '请选择工作性质');
    if (!formData.countryOfIncorporation) newErrors.countryOfIncorporation = t('請選擇註冊國家', 'Please select country of incorporation', '请选择注册国家');
    if (!formData.dateOfIncorporation) {
      newErrors.dateOfIncorporation = t('請選擇註冊日期', 'Please select date of incorporation', '请选择注册日期');
    } else {
      const selectedDate = new Date(formData.dateOfIncorporation);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.dateOfIncorporation = t('註冊日期不能晚於今天', 'Date of incorporation cannot be later than today', '注册日期不能晚于今天');
      }
    }

    if (!formData.certificateOfIncorporationNo.trim()) {
      newErrors.certificateOfIncorporationNo = t('請輸入公司註冊證書號碼', 'Please enter certificate of incorporation number', '请输入公司注册证书号码');
    } else if (!/^\d+$/.test(formData.certificateOfIncorporationNo)) {
      newErrors.certificateOfIncorporationNo = t('格式錯誤，只能採用阿拉伯數字', 'Invalid format, only digits allowed', '格式错误，只能采用阿拉伯数字');
    } else if (formData.certificateOfIncorporationNo.length > 8) {
      newErrors.certificateOfIncorporationNo = t('不能超過8位', 'Cannot exceed 8 digits', '不能超过8位');
    }

    // 商業登記號：若註冊國家為香港則必填
    if (formData.countryOfIncorporation === "香港" && !formData.businessRegistrationNo.trim()) {
      newErrors.businessRegistrationNo = t('請輸入商業登記證號碼', 'Please enter business registration number', '请输入商业登记证号码');
    } else if (formData.businessRegistrationNo.trim() && !/^\d+$/.test(formData.businessRegistrationNo)) {
      newErrors.businessRegistrationNo = t('格式錯誤，只能採用阿拉伯數字', 'Invalid format, only digits allowed', '格式错误，只能采用阿拉伯数字');
    } else if (formData.businessRegistrationNo.length > 8) {
      newErrors.businessRegistrationNo = t('不能超過8位', 'Cannot exceed 8 digits', '不能超过8位');
    }

    if (!formData.registeredAddress.trim()) newErrors.registeredAddress = t('請輸入註冊地址', 'Please enter registered address', '请输入注册地址');
    if (!formData.businessAddress.trim()) newErrors.businessAddress = t('請輸入營業地址', 'Please enter business address', '请输入营业地址');

    const validatePhone = (code: string, phone: string, field: string) => {
      if (!phone.trim()) {
        newErrors[field] = t('請輸入電話號碼', 'Please enter phone number', '请输入电话号码');
        return;
      }
      if (!/^\d+$/.test(phone)) {
        newErrors[field] = t('只能輸入阿拉伯數字', 'Only digits allowed', '只能输入阿拉伯数字');
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
          newErrors[field] = t(`電話號碼格式錯誤：${code} 不能超過8位`, `Invalid phone format: ${code} cannot exceed 8 digits`, `电话号码格式错误：${code} 不能超过8位`);
        }
      } else if (requiredLen && phone.length !== requiredLen) {
        newErrors[field] = t(`電話號碼格式錯誤：${code} 需輸入${requiredLen}位阿拉伯數字`, `Invalid phone format: ${code} requires ${requiredLen} digits`, `电话号码格式错误：${code} 需输入${requiredLen}位阿拉伯数字`);
      }
    };

    validatePhone(formData.officeCountryCode, formData.officeNo, 'officeNo');

    if (formData.facsimileNo.trim() && !/^[0-9+\s\-]+$/.test(formData.facsimileNo)) {
      newErrors.facsimileNo = t('格式錯誤，只能包含數字、+、空格或-', 'Invalid format, only digits, +, spaces or - allowed', '格式错误，只能包含数字、+、空格或-');
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = t(‘請輸入聯絡人姓名’, ‘Please enter contact name’, ‘请输入联络人姓名’);
    } else if (!/^[A-Za-z\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\s·\-’’,]+$/.test(formData.contactName)) {
      newErrors.contactName = t(‘姓名只允許中文（繁/簡會自動轉繁）、英文字母、空格、·、-、\’、英文逗號,；不允許數字及其他符號’, ‘Name only allows Chinese, English letters, spaces, middle dot, hyphen, apostrophe and comma’, ‘姓名只允许中文（繁/简会自动转繁）、英文字母、空格、·、-、\’、英文逗号,；不允许数字及其他符号’);
    }
    if (!formData.contactTitle.trim()) newErrors.contactTitle = t(‘請輸入職銜’, ‘Please enter title’, ‘请输入职衔’);

    validatePhone(formData.contactCountryCode, formData.contactPhone, 'contactPhone');

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = t('請輸入電郵地址', 'Please enter email address', '请输入电邮地址');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = t('電郵格式不正確', 'Invalid email format', '电邮格式不正确');
    }

    // 電郵自動套用註冊電郵，無需再次驗證

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
          <h3 className="text-lg font-semibold border-b pb-2">{t('公司識別信息', 'Company Identification', '公司识别信息')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyEnglishName">{t('公司英文名稱', 'Company English Name', '公司英文名称')} <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="companyEnglishName"
                  value={formData.companyEnglishName}
                  onChange={(e) => setFormData({ ...formData, companyEnglishName: e.target.value })}
                  placeholder={t('請輸入公司英文名稱', 'Enter Company English Name', '请输入公司英文名称')}
                  className={errors.companyEnglishName ? "border-destructive pr-10" : "pr-10"}
                />
                {formData.companyEnglishName.trim() && !errors.companyEnglishName && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.companyEnglishName && <p className="text-sm text-destructive">{errors.companyEnglishName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyChineseName">{t('公司中文名稱', 'Company Chinese Name', '公司中文名称')}</Label>
              <Input
                id="companyChineseName"
                value={formData.companyChineseName}
                onChange={(e) => setFormData({ ...formData, companyChineseName: e.target.value })}
                onBlur={() => setFormData({ ...formData, companyChineseName: handleSCT(formData.companyChineseName) })}
                placeholder={t('請輸入公司中文名稱', 'Enter Company Chinese Name', '请输入公司中文名称')}
                className={errors.companyChineseName ? "border-destructive" : ""}
              />
              {errors.companyChineseName && <p className="text-sm text-destructive">{errors.companyChineseName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="natureOfEntity">{t('公司性質', 'Nature of Entity', '公司性质')} <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select value={formData.natureOfEntity} onValueChange={(v) => setFormData({ ...formData, natureOfEntity: v })}>
                  <SelectTrigger className={errors.natureOfEntity ? "border-destructive" : ""}>
                    <SelectValue placeholder={t('請選擇公司性質', 'Select nature of entity', '请选择公司性质')} />
                  </SelectTrigger>
                  <SelectContent>
                    {entityNatures.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.natureOfEntity === "其他 / Other" && (
                  <Input
                    value={formData.natureOfEntityOther}
                    onChange={(e) => setFormData({ ...formData, natureOfEntityOther: e.target.value })}
                    onBlur={() => setFormData({ ...formData, natureOfEntityOther: convertToTraditional(formData.natureOfEntityOther) })}
                    placeholder={t('請輸入公司性質', 'Enter nature of entity', '请输入公司性质')}
                    className="flex-1"
                  />
                )}
              </div>
              {errors.natureOfEntity && <p className="text-sm text-destructive">{errors.natureOfEntity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="natureOfBusiness">{t('工作性質', 'Nature of Business', '工作性质')} <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select value={formData.natureOfBusiness} onValueChange={(v) => setFormData({ ...formData, natureOfBusiness: v })}>
                  <SelectTrigger className={errors.natureOfBusiness ? "border-destructive" : ""}>
                    <SelectValue placeholder={t('請選擇工作性質', 'Select nature of business', '请选择工作性质')} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessNatures.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.natureOfBusiness === "其他 / Other" && (
                  <Input
                    value={formData.natureOfBusinessOther}
                    onChange={(e) => setFormData({ ...formData, natureOfBusinessOther: e.target.value })}
                    onBlur={() => setFormData({ ...formData, natureOfBusinessOther: convertToTraditional(formData.natureOfBusinessOther) })}
                    placeholder={t('請輸入工作性質', 'Enter nature of business', '请输入工作性质')}
                    className="flex-1"
                  />
                )}
              </div>
              {errors.natureOfBusiness && <p className="text-sm text-destructive">{errors.natureOfBusiness}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="countryOfIncorporation">{t('註冊國家', 'Country of Incorporation', '注册国家')} <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select value={formData.countryOfIncorporation} onValueChange={(v) => setFormData({ ...formData, countryOfIncorporation: v })}>
                  <SelectTrigger className={errors.countryOfIncorporation ? "border-destructive" : ""}>
                    <SelectValue placeholder={t('請選擇國家', 'Select country', '请选择国家')} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c === "other" ? t('其他', 'Other', '其他') : c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.countryOfIncorporation === "other" && (
                  <Input
                    value={formData.countryOfIncorporationOther}
                    onChange={(e) => setFormData({ ...formData, countryOfIncorporationOther: e.target.value })}
                    placeholder={t('請輸入國家', 'Enter country', '请输入国家')}
                    className="flex-1"
                  />
                )}
              </div>
              {errors.countryOfIncorporation && <p className="text-sm text-destructive">{errors.countryOfIncorporation}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfIncorporation">{t('註冊日期', 'Date of Incorporation', '注册日期')} <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="certificateOfIncorporationNo">{t('公司註冊證書號碼', 'Certificate of Incorporation', '公司注册证书号码')} <span className="text-destructive">*</span></Label>
              <Input
                id="certificateOfIncorporationNo"
                value={formData.certificateOfIncorporationNo}
                onChange={(e) => setFormData({ ...formData, certificateOfIncorporationNo: e.target.value })}
                className={errors.certificateOfIncorporationNo ? "border-destructive" : ""}
              />
              {errors.certificateOfIncorporationNo && <p className="text-sm text-destructive">{errors.certificateOfIncorporationNo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessRegistrationNo">{t('商業登記證號碼', 'Business Registration No.', '商业登记证号码')}</Label>
              <Input
                id="businessRegistrationNo"
                value={formData.businessRegistrationNo}
                onChange={(e) => setFormData({ ...formData, businessRegistrationNo: e.target.value })}
                className={errors.businessRegistrationNo ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">{t('只適用於香港登記公司', 'For Hong Kong Registration Company only', '只适用于香港登记公司')}</p>
              {errors.businessRegistrationNo && <p className="text-sm text-destructive">{errors.businessRegistrationNo}</p>}
            </div>
          </div>
        </div>

        {/* 地址與聯繫方式 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">{t('地址與聯繫方式', 'Address & Contact', '地址与联系方式')}</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registeredAddress">{t('註冊地址', 'Registered Address', '注册地址')} <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="businessAddress">{t('營業地址', 'Business Address', '营业地址')} <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="officeNo">{t('辦事處電話', 'Office No.', '办事处电话')} <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="facsimileNo">{t('傳真號碼', 'Fax No.', '传真号码')}</Label>
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
          <h3 className="text-lg font-semibold border-b pb-2">{t('賬戶聯絡人', 'Account Contact Person', '账户联络人')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactName">{t('姓名', 'Name', '姓名')} <span className="text-destructive">*</span></Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => {
                  // 只允許：中文（繁/簡）、英文字母、空格、·、-、’、英文逗號 ,
                  // 其餘（數字/其他符號/全形符號）一律移除
                  const raw = e.target.value;
                  const filtered = raw.replace(/[^A-Za-z\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\s·\-’',]/g, "");
                  setFormData({ ...formData, contactName: filtered });
                }}
                onBlur={() => setFormData({ ...formData, contactName: handleSCT(formData.contactName) })}
                className={errors.contactName ? "border-destructive" : ""}
              />
              {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactTitle">{t('職銜', 'Title', '职衔')} <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="contactPhone">{t('電話號碼', 'Telephone No.', '电话号码')} <span className="text-destructive">*</span></Label>
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
              <Label>{t('電郵地址', 'E-mail', '电邮地址')} <span className="text-destructive">*</span>
                <span className="text-sm text-green-600 ml-2">{t('（已於註冊時驗證）', '(Verified during registration)', '（已于注册时验证）')}</span>
              </Label>
              <Input
                value={formData.contactEmail}
                placeholder="your.email@example.com"
                className="bg-green-50 border-green-300"
                disabled
              />
              <p className="text-xs text-muted-foreground">{t('此電郵地址自動套用您註冊時驗證的電郵', 'This email is auto-filled from your verified registration email', '此电邮地址自动套用您注册时验证的电邮')}</p>
              {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
            </div>

          </div>
        </div>

      </div>
    </ApplicationWizard>
  );
}
