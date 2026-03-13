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
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  phone: string;
  email: string;
  address: string;
}

const idIssuingCountries = [
  { value: "HK", label: "香港 Hong Kong" },
  { value: "CN", label: "中國內地 Mainland China" },
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

export default function CorporateRelatedParties() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
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
    if (existingData && existingData.relatedParties && existingData.relatedParties.length > 0) {
      setSavedParties(existingData.relatedParties);
    }
  }, [existingData]);

  // Initialize with default contact from corporate basic info if no saved parties
  useEffect(() => {
    if (!isLoadingData && savedParties.length === 0 && corporateBasicInfo) {
      setCurrentParty({
        ...defaultParty(),
        isDefaultContact: true,
        name: corporateBasicInfo.contactName || "",
        phone: corporateBasicInfo.contactPhone || "",
        email: corporateBasicInfo.contactEmail || "",
      });
    }
  }, [isLoadingData, savedParties.length, corporateBasicInfo]);

  const saveMutation = trpc.corporateRelatedParties.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`保存失敗: ${error.message}`)
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
    
    if (!party.phone && !party.email && !party.address) {
      errs.contact = "請至少提供一種聯絡方式";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Add current party to the list
  const handleAddParty = () => {
    if (validateParty(currentParty, true)) {
      setSavedParties([...savedParties, { ...currentParty, id: crypto.randomUUID() }]);
      setCurrentParty(defaultParty());
      setErrors({});
      toast.success("關聯方已添加");
    }
  };

  // Remove party from list
  const removeParty = (id: string) => {
    setSavedParties(savedParties.filter(p => p.id !== id));
  };

  // Handle final save
  const handleSave = () => {
    if (savedParties.length === 0) {
      // If no saved parties, try to save current form
      if (validateParty(currentParty)) {
        saveMutation.mutate({ applicationId, relatedParties: [currentParty] });
      }
    } else {
      saveMutation.mutate({ applicationId, relatedParties: savedParties });
    }
  };

  const handleNext = () => {
    if (savedParties.length === 0) {
      if (validateParty(currentParty)) {
        saveMutation.mutate({ applicationId, relatedParties: [currentParty] });
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
                <Button variant="ghost" size="icon" onClick={() => removeParty(party.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
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
              <Input value={currentParty.name} onChange={e => setCurrentParty({ ...currentParty, name: e.target.value })} />
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
                  <SelectItem value="mainland_id">內地身份證 / Mainland ID</SelectItem>
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
              <Input value={currentParty.idNumber} onChange={e => setCurrentParty({ ...currentParty, idNumber: e.target.value })} />
              {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber}</p>}
            </div>

            <div className="space-y-3">
              <Label>電話 / Phone</Label>
              <Input value={currentParty.phone} onChange={e => setCurrentParty({ ...currentParty, phone: e.target.value })} />
            </div>

            <div className="space-y-3">
              <Label>電郵 / Email</Label>
              <Input type="email" value={currentParty.email} onChange={e => setCurrentParty({ ...currentParty, email: e.target.value })} />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>地址 / Address</Label>
              <Input value={currentParty.address} onChange={e => setCurrentParty({ ...currentParty, address: e.target.value })} />
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