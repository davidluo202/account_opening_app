import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { convertToTraditional } from "@/lib/converter";
import { useLang } from '@/lib/i18n';

interface RelatedParty {
  id: string;
  relationshipType: "director" | "shareholder" | "beneficial_owner" | "authorized_signatory" | "other";
  relationshipTypeOther?: string;
  isDefaultContact: boolean;
  name: string;
  englishName: string;
  gender: "male" | "female" | "other" | "";
  dateOfBirth: string;
  idType: "hkid" | "passport" | "mainland_id" | "other" | "";
  idTypeOther?: string;
  idIssuingPlace: string;
  idIssuingPlaceOther?: string;
  idNumber: string;
  phoneCountryCode: string;
  phone: string;
  email: string;
  address: string;
}

const countryCodesData = [
  { value: "+852", tLabel: ['香港', 'Hong Kong', '香港'] as const, length: 8 },
  { value: "+86", tLabel: ['中國內地', 'Chinese Mainland', '中国内地'] as const, length: 11 },
  { value: "+853", tLabel: ['澳門', 'Macau', '澳门'] as const, length: 8 },
  { value: "+886", tLabel: ['台灣', 'Taiwan', '台湾'] as const, length: 9 },
  { value: "+1", tLabel: ['美國/加拿大', 'US/Canada', '美国/加拿大'] as const, length: 10 },
  { value: "+44", tLabel: ['英國', 'UK', '英国'] as const, length: 10 },
  { value: "+65", tLabel: ['新加坡', 'Singapore', '新加坡'] as const, length: 8 },
  { value: "+81", tLabel: ['日本', 'Japan', '日本'] as const, length: 10 },
  { value: "+61", tLabel: ['澳洲', 'Australia', '澳洲'] as const, length: 9 },
];

const idIssuingCountriesData = [
  { value: "HK", tLabel: ['香港', 'Hong Kong', '香港'] as const },
  { value: "CN", tLabel: ['中國內地', 'Chinese Mainland', '中国内地'] as const },
  { value: "MO", tLabel: ['澳門', 'Macau', '澳门'] as const },
  { value: "TW", tLabel: ['台灣', 'Taiwan', '台湾'] as const },
  { value: "US", tLabel: ['美國', 'United States', '美国'] as const },
  { value: "GB", tLabel: ['英國', 'United Kingdom', '英国'] as const },
  { value: "SG", tLabel: ['新加坡', 'Singapore', '新加坡'] as const },
  { value: "AU", tLabel: ['澳洲', 'Australia', '澳洲'] as const },
  { value: "CA", tLabel: ['加拿大', 'Canada', '加拿大'] as const },
  { value: "JP", tLabel: ['日本', 'Japan', '日本'] as const },
  { value: "OTHER", tLabel: ['其他', 'Other', '其他'] as const },
];

const defaultParty = (): RelatedParty => ({
  id: crypto.randomUUID(),
  relationshipType: "director",
  relationshipTypeOther: "",
  isDefaultContact: false,
  name: "",
  englishName: "",
  gender: "",
  dateOfBirth: "",
  idType: "",
  idTypeOther: "",
  idIssuingPlace: "",
  idIssuingPlaceOther: "",
  idNumber: "",
  phoneCountryCode: "+852",
  phone: "",
  email: "",
  address: "",
});

// Helper function to check if age is at least 18
const isAgeAtLeast18 = (dateOfBirth: string): boolean => {
  if (!dateOfBirth) return false;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
};

// Validate phone number based on country code
const validatePhone = (phone: string, countryCode: string): boolean => {
  if (!phone) return true; // Optional field
  const expectedLength = countryCodesData.find(c => c.value === countryCode)?.length;
  if (!expectedLength) return true;
  return phone.replace(/\D/g, '').length === expectedLength;
};

export default function CorporateRelatedParties() {
  const { t } = useLang();
  const countryCodes = countryCodesData.map(c => ({ value: c.value, label: `${c.value} ${t(c.tLabel[0], c.tLabel[1], c.tLabel[2])}`, length: c.length }));
  const idIssuingCountries = idIssuingCountriesData.map(c => ({ value: c.value, label: t(c.tLabel[0], c.tLabel[1], c.tLabel[2]) }));
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const draftStorageKey = `corporateRelatedParties:draft:${params.id || "0"}`;
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "5");
  const showReturnToPreview = useReturnToPreview();

  // List of saved parties
  const [savedParties, setSavedParties] = useState<RelatedParty[]>([]);
  // Current form party being edited
  const [currentParty, setCurrentParty] = useState<RelatedParty>(defaultParty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [missingTypes, setMissingTypes] = useState<string[]>([]);

  const { data: existingData, isLoading: isLoadingData } = trpc.corporateRelatedParties.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: corporateBasicInfo } = trpc.corporateBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  useEffect(() => {
    // existingData may be an array directly (backend returns the array itself)
    // or an object with a relatedParties property — handle both
    const parties = Array.isArray(existingData)
      ? existingData
      : (existingData as any)?.relatedParties;
    if (parties && Array.isArray(parties) && parties.length > 0) {
      setSavedParties(parties as RelatedParty[]);
    }
  }, [existingData]);

  // Restore draft (unsaved current form) from localStorage so it won't be lost when user navigates back/forward
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (raw) {
        const draft = JSON.parse(raw) as RelatedParty;
        if (draft && typeof draft === "object") {
          setCurrentParty({ ...defaultParty(), ...draft });
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // Initialize with default contact from corporate basic info if no saved parties (only when there is no draft)
  useEffect(() => {
    if (!isLoadingData && savedParties.length === 0 && corporateBasicInfo) {
      // If user already has a draft, don't overwrite it
      try {
        const raw = localStorage.getItem(draftStorageKey);
        if (raw) return;
      } catch {
        // ignore
      }
      // 解析可能包含區號的電話號碼
      let contactPhone = corporateBasicInfo.contactPhone || "";
      let countryCode = "+852";
      const m = contactPhone.trim().match(/^(\+\d+)\s*(\d+)$/);
      if (m) {
        countryCode = m[1];
        contactPhone = m[2];
      }

      setCurrentParty({
        ...defaultParty(),
        isDefaultContact: true,
        name: corporateBasicInfo.contactName || "",
        phoneCountryCode: countryCode,
        phone: contactPhone,
        email: corporateBasicInfo.contactEmail || "",
      });
    }
  }, [isLoadingData, savedParties.length, corporateBasicInfo, draftStorageKey]);

  // Persist current draft to localStorage (debounced)
  useEffect(() => {
    const hasAnyValue = Object.entries(currentParty).some(([k, v]) => {
      if (k === "id") return false;
      if (typeof v === "boolean") return v;
      return String(v || "").trim().length > 0;
    });

    const t = setTimeout(() => {
      try {
        if (!hasAnyValue) {
          localStorage.removeItem(draftStorageKey);
        } else {
          localStorage.setItem(draftStorageKey, JSON.stringify(currentParty));
        }
      } catch {
        // ignore
      }
    }, 300);

    return () => clearTimeout(t);
  }, [currentParty, draftStorageKey]);

  const utils = trpc.useContext();

  const saveMutation = trpc.corporateRelatedParties.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        utils.corporateRelatedParties.get.invalidate({ applicationId });
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`)
  });

  const saveOnlyMutation = trpc.corporateRelatedParties.save.useMutation({
    onSuccess: (result) => {
      // 靜默保存，不提示
      utils.corporateRelatedParties.get.invalidate({ applicationId });
    },
    onError: (error) => toast.error(`${t('自動保存失敗', 'Auto-save failed', '自动保存失败')}: ${error.message}`)
  });

  const validateParty = (party: RelatedParty, forSave: boolean = false) => {
    const errs: Record<string, string> = {};
    if (!party.relationshipType) errs.relationshipType = t('請選擇關係類型', 'Please select relationship type', '请选择关系类型');
    if (!party.name) errs.name = t('請輸入姓名', 'Please enter name', '请输入姓名');
    if (!party.gender) errs.gender = t('請選擇性別', 'Please select gender', '请选择性别');

    if (!party.dateOfBirth) {
      errs.dateOfBirth = t('請選擇出生日期', 'Please select date of birth', '请选择出生日期');
    } else if (!isAgeAtLeast18(party.dateOfBirth)) {
      errs.dateOfBirth = t('關聯人士必須年滿18歲', 'Related party must be at least 18 years old', '关联人士必须年满18岁');
    }

    if (!party.idType) errs.idType = t('請選擇證件類型', 'Please select ID type', '请选择证件类型');
    if (!party.idIssuingPlace) errs.idIssuingPlace = t('請選擇證件簽發地', 'Please select ID issuing place', '请选择证件签发地');

    if (!party.idNumber) {
      errs.idNumber = t('請輸入證件號碼', 'Please enter ID number', '请输入证件号码');
    } else if (party.idType === "mainland_id") {
      // 中國大陸居民身份證：必須18位阿拉伯數字
      if (!/^\d{18}$/.test(party.idNumber)) {
        errs.idNumber = t('請輸入正確的18位二代居民身份證號碼', 'Please enter a valid 18-digit Mainland ID number', '请输入正确的18位二代居民身份证号码');
      }
    } else if (party.idType === "hkid") {
      // 香港身份證：1位大楷英文字母 + 6位數字 + (1位數字或大楷英文字母)
      // 兼容：括號可選、可有空格、中文括號已在 onChange 轉換
      const normalized = party.idNumber.replace(/\s+/g, "");
      // Remove parentheses for the "must be exactly 8 chars" rule
      const withoutParen = normalized.replace(/[()]/g, "");
      if (withoutParen.length !== 8) {
        errs.idNumber = t('請輸入正確的香港身份證號碼', 'Please enter a valid HKID number', '请输入正确的香港身份证号码');
      } else {
        const hkidRegex = /^[A-Z]\d{6}[0-9A-Z]$/;
        if (!hkidRegex.test(withoutParen)) {
          errs.idNumber = t('請輸入正確的香港身份證號碼', 'Please enter a valid HKID number', '请输入正确的香港身份证号码');
        }
      }
    }
    
    // Phone validation
    if (party.phone && !validatePhone(party.phone, party.phoneCountryCode)) {
      const expectedLength = countryCodes.find(c => c.value === party.phoneCountryCode)?.length;
      errs.phone = t(`電話號碼必須為${expectedLength}位數字`, `Phone number must be ${expectedLength} digits`, `电话号码必须为${expectedLength}位数字`);
    }

    // Email validation (optional, but if filled, must be valid)
    if (party.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(party.email)) {
        errs.email = t('電郵格式不正確', 'Invalid email format', '电邮格式不正确');
      }
    }
    
    if (!party.phone && !party.email && !party.address) {
      errs.contact = t('請至少提供一種聯絡方式', 'Please provide at least one contact method', '请至少提供一种联络方式');
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const requiredTypes: { key: RelatedParty["relationshipType"]; label: string }[] = [
    { key: "director", label: t('董事', 'Director', '董事') },
    { key: "shareholder", label: t('股東', 'Shareholder', '股东') },
    { key: "beneficial_owner", label: t('最終受益人', 'Ultimate Beneficial Owner', '最终受益人') },
    { key: "authorized_signatory", label: t('授權簽署人', 'Authorized Signatory', '授权签署人') },
  ];

  const validateRequiredTypes = (parties: RelatedParty[]): boolean => {
    const missing = requiredTypes
      .filter(rt => !parties.some(p => p.relationshipType === rt.key))
      .map(rt => rt.label);
    setMissingTypes(missing);
    return missing.length === 0;
  };

  // Add current party to the list
  const handleAddParty = () => {
    // Convert name to Traditional Chinese
    const convertedParty = {
      ...currentParty,
      name: convertToTraditional(currentParty.name),
      address: convertToTraditional(currentParty.address),
      idTypeOther: currentParty.idTypeOther ? convertToTraditional(currentParty.idTypeOther) : undefined,
      idIssuingPlaceOther: currentParty.idIssuingPlaceOther ? convertToTraditional(currentParty.idIssuingPlaceOther) : undefined,
    };
    
    if (validateParty(convertedParty, true)) {
      const existingIndex = savedParties.findIndex(p => p.id === convertedParty.id);
      let newList;
      if (existingIndex >= 0) {
        newList = [...savedParties];
        newList[existingIndex] = convertedParty;
        toast.success(t('關聯方已更新', 'Related party updated', '关联方已更新'));
      } else {
        newList = [...savedParties, convertedParty];
        toast.success(t('關聯方已添加', 'Related party added', '关联方已添加'));
      }
      setSavedParties(newList);
      saveOnlyMutation.mutate({ applicationId, relatedParties: newList });
      // 清除草稿（已成功加入列表並保存）
      try { localStorage.removeItem(draftStorageKey); } catch {}
      setCurrentParty(defaultParty());
      setErrors({});
      setMissingTypes([]);
    }
  };

  // Remove party from list
  const removeParty = (id: string) => {
    const newList = savedParties.filter(p => p.id !== id);
    setSavedParties(newList);
    saveOnlyMutation.mutate({ applicationId, relatedParties: newList });
  };

  // Edit party
  const editParty = (party: RelatedParty) => {
    setCurrentParty(party);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle final save
  const handleSave = () => {
    if (savedParties.length === 0) {
      // If no saved parties, try to save current form
      const convertedParty = {
        ...currentParty,
        name: convertToTraditional(currentParty.name),
        address: convertToTraditional(currentParty.address),
      };
      if (validateParty(convertedParty)) {
        const prospectiveList = [convertedParty];
        if (!validateRequiredTypes(prospectiveList)) {
          toast.error(t('請確保每種必填關係類型至少有一位關聯方', 'Please ensure at least one related party for each required relationship type', '请确保每种必填关系类型至少有一位关联方'));
          return;
        }
        saveMutation.mutate({ applicationId, relatedParties: prospectiveList });
      }
    } else {
      if (!validateRequiredTypes(savedParties)) {
        toast.error(t('請確保每種必填關係類型至少有一位關聯方', 'Please ensure at least one related party for each required relationship type', '请确保每种必填关系类型至少有一位关联方'));
        return;
      }
      saveMutation.mutate({ applicationId, relatedParties: savedParties });
    }
  };

  const handleNext = () => {
    if (savedParties.length === 0) {
      const convertedParty = {
        ...currentParty,
        name: convertToTraditional(currentParty.name),
        address: convertToTraditional(currentParty.address),
      };
      if (validateParty(convertedParty)) {
        const prospectiveList = [convertedParty];
        if (!validateRequiredTypes(prospectiveList)) {
          toast.error(t('請確保每種必填關係類型至少有一位關聯方', 'Please ensure at least one related party for each required relationship type', '请确保每种必填关系类型至少有一位关联方'));
          return;
        }
        saveMutation.mutate({ applicationId, relatedParties: prospectiveList });
      } else {
        toast.error(t('請填寫完整信息後再繼續', 'Please complete all required information before proceeding', '请填写完整信息后再继续'));
      }
    } else {
      if (!validateRequiredTypes(savedParties)) {
        toast.error(t('請確保每種必填關係類型至少有一位關聯方', 'Please ensure at least one related party for each required relationship type', '请确保每种必填关系类型至少有一位关联方'));
        return;
      }
      saveMutation.mutate({ applicationId, relatedParties: savedParties });
    }
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={stepNum} showReturnToPreview={showReturnToPreview}>
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={stepNum}
      onPrevious={() => {
        // Ensure draft is persisted before navigating away
        try {
          localStorage.setItem(draftStorageKey, JSON.stringify(currentParty));
        } catch {
          // ignore
        }
        setLocation(`/application/${applicationId}/step/${stepNum - 1}`);
      }}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('關聯方信息', 'Related Parties', '关联方信息')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('請提供所有董事、股東、最終受益人或授權簽署人的信息', 'Please provide information for all directors, shareholders, beneficial owners or authorized signatories', '请提供所有董事、股东、最终受益人或授权签署人的信息')}</p>
        </div>

        {/* Saved Parties List */}
        {savedParties.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">{t('已添加的關聯方', 'Added Related Parties', '已添加的关联方')} ({savedParties.length})</h3>
            {savedParties.map((party, index) => (
              <div key={party.id} className="p-4 border border-green-200 rounded-lg bg-green-50 flex justify-between items-center">
                <div>
                  <p className="font-medium">{party.name}</p>
                  <p className="text-sm text-slate-500">
                    {party.relationshipType === 'director' ? t('董事', 'Director', '董事') : party.relationshipType === 'shareholder' ? t('股東', 'Shareholder', '股东') : party.relationshipType === 'beneficial_owner' ? t('最終受益人', 'Beneficial Owner', '最终受益人') : party.relationshipType === 'authorized_signatory' ? t('授權簽署人', 'Authorized Signatory', '授权签署人') : t('其他', 'Other', '其他')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => editParty(party)} className="text-blue-600 mr-1">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeParty(party.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Party Form */}
        <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800">{t('添加新關聯方', 'Add New Related Party', '添加新关联方')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>{t('關係類型', 'Relationship Type', '关系类型')} <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select value={currentParty.relationshipType} onValueChange={(v: any) => setCurrentParty({ ...currentParty, relationshipType: v })}>
                  <SelectTrigger><SelectValue placeholder={t('選擇類型', 'Select type', '选择类型')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="director">{t('董事', 'Director', '董事')}</SelectItem>
                    <SelectItem value="shareholder">{t('股東', 'Shareholder', '股东')}</SelectItem>
                    <SelectItem value="beneficial_owner">{t('最終受益人', 'Beneficial Owner', '最终受益人')}</SelectItem>
                    <SelectItem value="authorized_signatory">{t('授權簽署人', 'Authorized Signatory', '授权签署人')}</SelectItem>
                    <SelectItem value="other">{t('其他', 'Other', '其他')}</SelectItem>
                  </SelectContent>
                </Select>
                {currentParty.relationshipType === "other" && (
                  <Input
                    value={currentParty.relationshipTypeOther || ""}
                    onChange={e => setCurrentParty({ ...currentParty, relationshipTypeOther: e.target.value })}
                    placeholder={t('請輸入關係類型', 'Enter relationship type', '请输入关系类型')}
                    className="flex-1"
                  />
                )}
              </div>
              {errors.relationshipType && <p className="text-sm text-destructive">{errors.relationshipType}</p>}
            </div>

            <div className="space-y-3 flex flex-col justify-end">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="default-contact" 
                  checked={currentParty.isDefaultContact}
                  onCheckedChange={(v) => setCurrentParty({ ...currentParty, isDefaultContact: !!v })}
                />
                <Label htmlFor="default-contact">{t('設為默認賬戶聯繫人', 'Set as default account contact', '设为默认账户联系人')}</Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t('中文姓名', 'Chinese Name', '中文姓名')} <span className="text-destructive">*</span></Label>
              <Input
                value={currentParty.name}
                onChange={e => setCurrentParty({ ...currentParty, name: e.target.value })}
                onBlur={() => {
                  const converted = convertToTraditional(currentParty.name.toUpperCase());
                  setCurrentParty({ ...currentParty, name: converted });
                }}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('英文姓名', 'English Name', '英文姓名')} <span className="text-destructive">*</span></Label>
              <Input
                value={currentParty.englishName}
                onChange={e => setCurrentParty({ ...currentParty, englishName: e.target.value.toUpperCase() })}
                placeholder={t('請輸入英文姓名（與證件一致）', 'As shown on ID/Passport', '请输入英文姓名（与证件一致）')}
              />
            </div>

            <div className="space-y-3">
              <Label>{t('性別', 'Gender', '性别')} <span className="text-destructive">*</span></Label>
              <Select value={currentParty.gender} onValueChange={(v: any) => setCurrentParty({ ...currentParty, gender: v })}>
                <SelectTrigger><SelectValue placeholder={t('選擇性別', 'Select gender', '选择性别')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('男', 'Male', '男')}</SelectItem>
                  <SelectItem value="female">{t('女', 'Female', '女')}</SelectItem>
                  <SelectItem value="other">{t('其他', 'Other', '其他')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('出生日期', 'Date of Birth', '出生日期')} <span className="text-destructive">*</span> ({t('必須年滿18歲', 'Must be at least 18', '必须年满18岁')})</Label>
              <Input 
                type="date" 
                value={currentParty.dateOfBirth} 
                onChange={e => setCurrentParty({ ...currentParty, dateOfBirth: e.target.value })} 
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('證件類型', 'ID Type', '证件类型')} <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select value={currentParty.idType} onValueChange={(v: any) => setCurrentParty({ ...currentParty, idType: v })}>
                  <SelectTrigger><SelectValue placeholder={t('選擇證件', 'Select ID type', '选择证件')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hkid">{t('香港身份證', 'HKID', '香港身份证')}</SelectItem>
                    <SelectItem value="passport">{t('護照', 'Passport', '护照')}</SelectItem>
                    <SelectItem value="mainland_id">{t('中國大陸居民身份證', 'Mainland ID', '中国大陆居民身份证')}</SelectItem>
                    <SelectItem value="other">{t('其他', 'Other', '其他')}</SelectItem>
                  </SelectContent>
                </Select>
                {currentParty.idType === "other" && (
                  <Input
                    value={currentParty.idTypeOther || ""}
                    onChange={e => setCurrentParty({ ...currentParty, idTypeOther: e.target.value })}
                    onBlur={() => {
                      if (currentParty.idTypeOther) {
                        setCurrentParty({ ...currentParty, idTypeOther: convertToTraditional(currentParty.idTypeOther) });
                      }
                    }}
                    placeholder={t('請輸入證件類型', 'Enter ID type', '请输入证件类型')}
                    className="flex-1"
                  />
                )}
              </div>
              {errors.idType && <p className="text-sm text-destructive">{errors.idType}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('證件簽發地', 'ID Issuing Country', '证件签发地')} <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select value={currentParty.idIssuingPlace} onValueChange={(v: any) => setCurrentParty({ ...currentParty, idIssuingPlace: v })}>
                  <SelectTrigger><SelectValue placeholder={t('選擇國家/地區', 'Select country/region', '选择国家/地区')} /></SelectTrigger>
                  <SelectContent>
                    {idIssuingCountries.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentParty.idIssuingPlace === "OTHER" && (
                  <Input
                    value={currentParty.idIssuingPlaceOther || ""}
                    onChange={e => setCurrentParty({ ...currentParty, idIssuingPlaceOther: e.target.value })}
                    onBlur={() => {
                      if (currentParty.idIssuingPlaceOther) {
                        setCurrentParty({ ...currentParty, idIssuingPlaceOther: convertToTraditional(currentParty.idIssuingPlaceOther) });
                      }
                    }}
                    placeholder={t('請輸入國家/地區', 'Enter country/region', '请输入国家/地区')}
                    className="flex-1"
                  />
                )}
              </div>
              {errors.idIssuingPlace && <p className="text-sm text-destructive">{errors.idIssuingPlace}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('證件號碼', 'ID Number', '证件号码')} <span className="text-destructive">*</span></Label>
              <Input
                value={currentParty.idNumber}
                onChange={e => {
                  // 替换中文括号为英文括号
                  const value = e.target.value.replace(/（/g, '(').replace(/）/g, ')');
                  setCurrentParty({ ...currentParty, idNumber: value });
                }}
                onBlur={() => setCurrentParty({ ...currentParty, idNumber: currentParty.idNumber.toUpperCase() })}
                placeholder={
                  currentParty.idType === 'hkid' ? t('請輸入您的香港身份證號碼，例如:A123456(0)', 'Enter your HKID number, e.g. A123456(0)', '请输入您的香港身份证号码，例如:A123456(0)') :
                  currentParty.idType === 'mainland_id' ? t('請輸入您的二代居民身份證號碼，由18位數字組成。', 'Enter your 18-digit Mainland ID number', '请输入您的二代居民身份证号码，由18位数字组成。') :
                  currentParty.idType === 'passport' ? t('請輸入您的護照號碼', 'Enter your passport number', '请输入您的护照号码') :
                  currentParty.idType === 'other' ? t('請輸入您的證件號碼', 'Enter your ID number', '请输入您的证件号码') :
                  t('請輸入您的證件號碼', 'Enter your ID number', '请输入您的证件号码')
                }
                className={currentParty.idType ? 'placeholder:text-gray-400' : ''}
              />
              {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('電話號碼', 'Telephone No.', '电话号码')}</Label>
              <div className="flex gap-2">
                <Select 
                  value={currentParty.phoneCountryCode} 
                  onValueChange={(v) => setCurrentParty({ ...currentParty, phoneCountryCode: v })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  className="flex-1"
                  value={currentParty.phone} 
                  onChange={e => setCurrentParty({ ...currentParty, phone: e.target.value })} 
                  placeholder={t('請輸入電話號碼', 'Enter phone number', '请输入电话号码')}
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('電郵地址', 'E-mail', '电邮地址')}</Label>
              <Input
                type="email"
                value={currentParty.email}
                onChange={e => setCurrentParty({ ...currentParty, email: e.target.value })}
                placeholder="your email@example.com"
                className="placeholder:text-gray-400"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>{t('地址', 'Address', '地址')}</Label>
              <Input 
                value={currentParty.address} 
                onChange={e => setCurrentParty({ ...currentParty, address: e.target.value })}
                onBlur={(e) => {
                  const converted = convertToTraditional(e.target.value);
                  if (converted !== e.target.value) {
                    setCurrentParty({ ...currentParty, address: converted });
                  }
                }}
              />
              {errors.contact && <p className="text-sm text-destructive">{errors.contact}</p>}
            </div>
          </div>

          <Button type="button" onClick={handleAddParty} className="w-full bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            {t('添加此關聯方到列表', 'Add This Related Party to List', '添加此关联方到列表')}
          </Button>
        </div>

        {missingTypes.length > 0 && (
          <div className="p-4 border border-destructive rounded-lg bg-red-50">
            <p className="text-sm font-semibold text-destructive mb-2">{t('以下必填關係類型尚未添加', 'The following required relationship types are missing', '以下必填关系类型尚未添加')}:</p>
            <ul className="list-disc list-inside space-y-1">
              {missingTypes.map(t => (
                <li key={t} className="text-sm text-destructive">{t}</li>
              ))}
            </ul>
          </div>
        )}

        {savedParties.length === 0 && (
          <p className="text-center text-slate-500 text-sm">{t('請填寫上方表格並點擊"添加此關聯方到列表"，然後點擊下一步', 'Please fill in the form above and click "Add This Related Party to List", then click Next', '请填写上方表格并点击"添加此关联方到列表"，然后点击下一步')}</p>
        )}
      </div>
    </ApplicationWizard>
  );

}
