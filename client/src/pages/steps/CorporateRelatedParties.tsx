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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface RelatedParty {
  id: string;
  relationshipType: "director" | "shareholder" | "beneficial_owner" | "authorized_signatory" | "other";
  isDefaultContact: boolean;
  name: string;
  gender: "male" | "female" | "other" | "";
  dateOfBirth: string;
  idType: "hkid" | "passport" | "mainland_id" | "other" | "";
  idNumber: string;
  phone: string;
  email: string;
  address: string;
}

const defaultParty = (): RelatedParty => ({
  id: crypto.randomUUID(),
  relationshipType: "director",
  isDefaultContact: false,
  name: "",
  gender: "",
  dateOfBirth: "",
  idType: "",
  idNumber: "",
  phone: "",
  email: "",
  address: "",
});

export default function CorporateRelatedParties() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "4");
  const showReturnToPreview = useReturnToPreview();

  const [parties, setParties] = useState<RelatedParty[]>([defaultParty()]);
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
      setParties(existingData.relatedParties);
    } else if (corporateBasicInfo) {
      setParties([{
        ...defaultParty(),
        isDefaultContact: true,
        name: corporateBasicInfo.contactName || "",
        phone: corporateBasicInfo.contactPhone || "",
        email: corporateBasicInfo.contactEmail || "",
      }]);
    }
  }, [existingData, corporateBasicInfo]);

  const saveMutation = trpc.corporateRelatedParties.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => toast.error(`保存失敗: ${error.message}`)
  });

  const saveOnlyMutation = trpc.corporateRelatedParties.save.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success("保存成功");
    },
    onError: (error) => toast.error(`保存失敗: ${error.message}`)
  });

  const updateParty = (id: string, field: keyof RelatedParty, value: any) => {
    setParties(parties.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addParty = () => setParties([...parties, defaultParty()]);
  const removeParty = (id: string) => setParties(parties.filter(p => p.id !== id));

  const validate = () => {
    const newErrors: Record<string, Record<string, string>> = {};
    let isValid = true;

    parties.forEach(p => {
      const errs: Record<string, string> = {};
      if (!p.relationshipType) errs.relationshipType = "此欄位必填";
      if (!p.name) errs.name = "此欄位必填";
      if (!p.gender) errs.gender = "此欄位必填";
      if (!p.dateOfBirth) errs.dateOfBirth = "此欄位必填";
      if (!p.idType) errs.idType = "此欄位必填";
      if (!p.idNumber) errs.idNumber = "此欄位必填";
      if (!p.phone && !p.email && !p.address) {
        errs.contact = "請至少提供一種聯絡方式 (電話、電郵或地址)";
      }
      if (Object.keys(errs).length > 0) {
        newErrors[p.id] = errs;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
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
      onNext={() => validate() && saveMutation.mutate({ applicationId, relatedParties: parties })}
      onSave={() => validate() && saveOnlyMutation.mutate({ applicationId, relatedParties: parties })}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">關聯方信息 / Related Parties</h2>
          <p className="text-sm text-slate-500 mt-1">請提供所有董事、股東、最終受益人或授權簽署人的信息</p>
        </div>

        {parties.map((party, index) => (
          <div key={party.id} className="p-6 border border-slate-200 rounded-lg bg-white space-y-6 relative shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">關聯方 {index + 1}</h3>
              {parties.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeParty(party.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>關係類型 / Relationship Type <span className="text-destructive">*</span></Label>
                <Select value={party.relationshipType} onValueChange={(v: any) => updateParty(party.id, "relationshipType", v)}>
                  <SelectTrigger><SelectValue placeholder="選擇類型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="director">董事 / Director</SelectItem>
                    <SelectItem value="shareholder">股東 / Shareholder</SelectItem>
                    <SelectItem value="beneficial_owner">最終受益人 / Beneficial Owner</SelectItem>
                    <SelectItem value="authorized_signatory">授權簽署人 / Authorized Signatory</SelectItem>
                    <SelectItem value="other">其他 / Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors[party.id]?.relationshipType && <p className="text-sm text-destructive">{errors[party.id].relationshipType}</p>}
              </div>

              <div className="space-y-3 flex flex-col justify-end">
                <div className="flex items-center space-x-2 h-10">
                  <Checkbox 
                    id={`default-${party.id}`} 
                    checked={party.isDefaultContact}
                    onCheckedChange={(v) => updateParty(party.id, "isDefaultContact", !!v)}
                  />
                  <Label htmlFor={`default-${party.id}`}>設為默認聯絡人 / Default Contact</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>姓名 / Name <span className="text-destructive">*</span></Label>
                <Input value={party.name} onChange={e => updateParty(party.id, "name", e.target.value)} />
                {errors[party.id]?.name && <p className="text-sm text-destructive">{errors[party.id].name}</p>}
              </div>

              <div className="space-y-3">
                <Label>性別 / Gender <span className="text-destructive">*</span></Label>
                <Select value={party.gender} onValueChange={(v: any) => updateParty(party.id, "gender", v)}>
                  <SelectTrigger><SelectValue placeholder="選擇性別" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男 / Male</SelectItem>
                    <SelectItem value="female">女 / Female</SelectItem>
                    <SelectItem value="other">其他 / Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors[party.id]?.gender && <p className="text-sm text-destructive">{errors[party.id].gender}</p>}
              </div>

              <div className="space-y-3">
                <Label>出生日期 / Date of Birth <span className="text-destructive">*</span></Label>
                <Input type="date" value={party.dateOfBirth} onChange={e => updateParty(party.id, "dateOfBirth", e.target.value)} />
                {errors[party.id]?.dateOfBirth && <p className="text-sm text-destructive">{errors[party.id].dateOfBirth}</p>}
              </div>

              <div className="space-y-3">
                <Label>證件類型 / ID Type <span className="text-destructive">*</span></Label>
                <Select value={party.idType} onValueChange={(v: any) => updateParty(party.id, "idType", v)}>
                  <SelectTrigger><SelectValue placeholder="選擇證件" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hkid">香港身份證 / HKID</SelectItem>
                    <SelectItem value="passport">護照 / Passport</SelectItem>
                    <SelectItem value="mainland_id">內地身份證 / Mainland ID</SelectItem>
                    <SelectItem value="other">其他 / Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors[party.id]?.idType && <p className="text-sm text-destructive">{errors[party.id].idType}</p>}
              </div>

              <div className="space-y-3">
                <Label>證件號碼 / ID Number <span className="text-destructive">*</span></Label>
                <Input value={party.idNumber} onChange={e => updateParty(party.id, "idNumber", e.target.value)} />
                {errors[party.id]?.idNumber && <p className="text-sm text-destructive">{errors[party.id].idNumber}</p>}
              </div>

              <div className="space-y-3">
                <Label>電話 / Phone</Label>
                <Input value={party.phone} onChange={e => updateParty(party.id, "phone", e.target.value)} />
              </div>

              <div className="space-y-3">
                <Label>電郵 / Email</Label>
                <Input type="email" value={party.email} onChange={e => updateParty(party.id, "email", e.target.value)} />
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label>地址 / Address</Label>
                <Input value={party.address} onChange={e => updateParty(party.id, "address", e.target.value)} />
                {errors[party.id]?.contact && <p className="text-sm text-destructive">{errors[party.id].contact}</p>}
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addParty} className="w-full flex items-center justify-center gap-2 border-dashed border-2 py-8">
          <Plus className="h-5 w-5" />
          <span>添加關聯方 / Add Related Party</span>
        </Button>
      </div>
    </ApplicationWizard>
  );
}