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

interface RelatedParty {
  id: string;
  relationshipType: "director" | "shareholder" | "beneficial_owner" | "authorized_signatory" | "other";
  isDefaultContact: boolean;
  name: string;
  gender: "male" | "female" | "other" | "";
  dateOfBirth: string;
  idType: "hkid" | "passport" | "mainland_id" | "other" | "";
  idIssuingPlace: string;
  idNumber: string;
  phoneCountryCode: string;
  phone: string;
  email: string;
  address: string;
}

const countryCodes = [
  { value: "+852", label: "+852 香港", length: 8 },
  { value: "+86", label: "+86 中國內地", length: 11 },
  { value: "+853", label: "+853 澳門", length: 8 },
  { value: "+886", label: "+886 台灣", length: 9 },
  { value: "+1", label: "+1 美國/加拿大", length: 10 },
  { value: "+44", label: "+44 英國", length: 10 },
  { value: "+65", label: "+65 新加坡", length: 8 },
  { value: "+81", label: "+81 日本", length: 10 },
  { value: "+61", label: "+61 澳洲", length: 9 },
];

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

const defaultParty = (): RelatedParty => ({
  id: crypto.randomUUID(),
  relationshipType: "director",
  isDefaultContact: false,
  name: "",
  gender: "",
  dateOfBirth: "",
  idType: "",
  idIssuingPlace: "",
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
  const expectedLength = countryCodes.find(c => c.value === countryCode)?.length;
  if (!expectedLength) return true;
  return phone.replace(/\D/g, '').length === expectedLength;
};

export default function CorporateRelatedParties() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const draftStorageKey = `corporateRelatedParties:draft:${params.id || "0"}`;
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "4");
  const showReturnToPreview = useReturnToPreview();

  // List of saved parties
  const [savedParties, setSavedParties] = useState<RelatedParty[]>([]);
  // Current form party being edited
  const [currentParty, setCurrentParty] = useState<RelatedParty>(defaultParty());
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

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
      // 解析可能包含区号的电话号码
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
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`保存失敗: ${error.message}`)
  });

  const saveOnlyMutation = trpc.corporateRelatedParties.save.useMutation({
    onSuccess: (result) => {
      // 靜默保存，不提示
      utils.corporateRelatedParties.get.invalidate({ applicationId });
    },
    onError: (error) => toast.error(`自動保存失敗: ${error.message}`)
  });

  const validateParty = (party: RelatedParty, forSave: boolean = false) => {
    const errs: Record<string, string> = {};
    if (!party.relationshipType) errs.relationshipType = "請選擇關係類型";
    if (!party.name) errs.name = "請輸入姓名";
    if (!party.gender) errs.gender = "請選擇性別";
    
    if (!party.dateOfBirth) {
      errs.dateOfBirth = "請選擇出生日期";
    } else if (!isAgeAtLeast18(party.dateOfBirth)) {
      errs.dateOfBirth = "關聯人士必須年滿18歲";
    }
    
    if (!party.idType) errs.idType = "請選擇證件類型";
    if (!party.idIssuingPlace) errs.idIssuingPlace = "請選擇證件簽發地";
    if (!party.idNumber) errs.idNumber = "請輸入證件號碼";
    
    // Phone validation
    if (party.phone && !validatePhone(party.phone, party.phoneCountryCode)) {
      const expectedLength = countryCodes.find(c => c.value === party.phoneCountryCode)?.length;
      errs.phone = `電話號碼必須為${expectedLength}位數字`;
    }
    
    if (!party.phone && !party.email && !party.address) {
      errs.contact = "請至少提供一種聯絡方式";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Add current party to the list
  const handleAddParty = () => {
    // Convert name to Traditional Chinese
    const convertedParty = {
      ...currentParty,
      name: convertToTraditional(currentParty.name),
      address: convertToTraditional(currentParty.address),
    };
    
    if (validateParty(convertedParty, true)) {
      const existingIndex = savedParties.findIndex(p => p.id === convertedParty.id);
      let newList;
      if (existingIndex >= 0) {
        newList = [...savedParties];
        newList[existingIndex] = convertedParty;
        toast.success("關聯方已更新");
      } else {
        newList = [...savedParties, convertedParty];
        toast.success("關聯方已添加");
      }
      setSavedParties(newList);
      saveOnlyMutation.mutate({ applicationId, relatedParties: newList });
      // 清除草稿（已成功加入列表並保存）
      try { localStorage.removeItem(draftStorageKey); } catch {}
      setCurrentParty(defaultParty());
      setErrors({});
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
        saveMutation.mutate({ applicationId, relatedParties: [convertedParty] });
      }
    } else {
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
        saveMutation.mutate({ applicationId, relatedParties: [convertedParty] });
      } else {
        toast.error("請填寫完整信息後再繼續");
      }
    } else {
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
          <h2 className="text-xl font-bold text-slate-900">關聯方信息 / Related Parties</h2>
          <p className="text-sm text-slate-500 mt-1">請提供所有董事、股東、最終受益人或授權簽署人的信息</p>
        </div>

        {/* Saved Parties List */}
        {savedParties.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">已添加的關聯方 ({savedParties.length})</h3>
            {savedParties.map((party, index) => (
              <div key={party.id} className="p-4 border border-green-200 rounded-lg bg-green-50 flex justify-between items-center">
                <div>
                  <p className="font-medium">{party.name}</p>
                  <p className="text-sm text-slate-500">
                    {party.relationshipType === 'director' ? '董事' : party.relationshipType === 'shareholder' ? '股東' : party.relationshipType === 'beneficial_owner' ? '最終受益人' : party.relationshipType === 'authorized_signatory' ? '授權簽署人' : '其他'}
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
          <h3 className="text-lg font-semibold text-slate-800">添加新關聯方</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>關係類型 / Relationship Type <span className="text-destructive">*</span></Label>
              <Select value={currentParty.relationshipType} onValueChange={(v: any) => setCurrentParty({ ...currentParty, relationshipType: v })}>
                <SelectTrigger><SelectValue placeholder="選擇類型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="director">董事 / Director</SelectItem>
                  <SelectItem value="shareholder">股東 / Shareholder</SelectItem>
                  <SelectItem value="beneficial_owner">最終受益人 / Beneficial Owner</SelectItem>
                  <SelectItem value="authorized_signatory">授權簽署人 / Authorized Signatory</SelectItem>
                  <SelectItem value="other">其他 / Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.relationshipType && <p className="text-sm text-destructive">{errors.relationshipType}</p>}
            </div>

            <div className="space-y-3 flex flex-col justify-end">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="default-contact" 
                  checked={currentParty.isDefaultContact}
                  onCheckedChange={(v) => setCurrentParty({ ...currentParty, isDefaultContact: !!v })}
                />
                <Label htmlFor="default-contact">設為默認聯絡人</Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>姓名 / Name <span className="text-destructive">*</span></Label>
              <Input 
                value={currentParty.name} 
                onChange={e => setCurrentParty({ ...currentParty, name: e.target.value.toUpperCase() })} 
                onBlur={(e) => {
                  const converted = convertToTraditional(e.target.value);
                  if (converted !== e.target.value) {
                    setCurrentParty({ ...currentParty, name: converted });
                  }
                }}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-3">
              <Label>性別 / Gender <span className="text-destructive">*</span></Label>
              <Select value={currentParty.gender} onValueChange={(v: any) => setCurrentParty({ ...currentParty, gender: v })}>
                <SelectTrigger><SelectValue placeholder="選擇性別" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男 / Male</SelectItem>
                  <SelectItem value="female">女 / Female</SelectItem>
                  <SelectItem value="other">其他 / Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
            </div>

            <div className="space-y-3">
              <Label>出生日期 / Date of Birth <span className="text-destructive">*</span> (必須年滿18歲)</Label>
              <Input 
                type="date" 
                value={currentParty.dateOfBirth} 
                onChange={e => setCurrentParty({ ...currentParty, dateOfBirth: e.target.value })} 
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-3">
              <Label>證件類型 / ID Type <span className="text-destructive">*</span></Label>
              <Select value={currentParty.idType} onValueChange={(v: any) => setCurrentParty({ ...currentParty, idType: v })}>
                <SelectTrigger><SelectValue placeholder="選擇證件" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hkid">香港身份證 / HKID</SelectItem>
                  <SelectItem value="passport">護照 / Passport</SelectItem>
                  <SelectItem value="mainland_id">中國大陸居民身份證 / Mainland ID</SelectItem>
                  <SelectItem value="other">其他 / Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.idType && <p className="text-sm text-destructive">{errors.idType}</p>}
            </div>

            <div className="space-y-3">
              <Label>證件簽發地 / ID Issuing Country <span className="text-destructive">*</span></Label>
              <Select value={currentParty.idIssuingPlace} onValueChange={(v: any) => setCurrentParty({ ...currentParty, idIssuingPlace: v })}>
                <SelectTrigger><SelectValue placeholder="選擇國家/地區" /></SelectTrigger>
                <SelectContent>
                  {idIssuingCountries.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.idIssuingPlace && <p className="text-sm text-destructive">{errors.idIssuingPlace}</p>}
            </div>

            <div className="space-y-3">
              <Label>證件號碼 / ID Number <span className="text-destructive">*</span></Label>
              <Input 
                value={currentParty.idNumber} 
                onChange={e => {
                  // 转换为大写并替换中文括号为英文括号
                  const value = e.target.value.toUpperCase().replace(/（/g, '(').replace(/）/g, ')');
                  setCurrentParty({ ...currentParty, idNumber: value });
                }} 
                placeholder={
                  currentParty.idType === 'hkid' ? '請輸入您的香港身份證號碼，例如:A123456(0)' : 
                  currentParty.idType === 'mainland_id' ? '請輸入您的二代居民身份證號碼，由18位數字組成。' : 
                  currentParty.idType === 'passport' ? '請輸入您的護照號碼' : 
                  currentParty.idType === 'other' ? '請輸入您的證件號碼' : 
                  '請輸入您的證件號碼'
                }
                className={currentParty.idType ? 'placeholder:text-gray-400' : ''}
              />
              {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber}</p>}
            </div>

            <div className="space-y-3">
              <Label>電話號碼 / Telephone No.</Label>
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
                  placeholder="請輸入電話號碼"
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-3">
              <Label>電郵地址 / E-mail</Label>
              <Input type="email" value={currentParty.email} onChange={e => setCurrentParty({ ...currentParty, email: e.target.value })} />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>地址 / Address</Label>
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
            添加此關聯方到列表
          </Button>
        </div>

        {savedParties.length === 0 && (
          <p className="text-center text-slate-500 text-sm">請填寫上方表格並點擊"添加此關聯方到列表"，然後點擊下一步</p>
        )}
      </div>
    </ApplicationWizard>
  );

}
