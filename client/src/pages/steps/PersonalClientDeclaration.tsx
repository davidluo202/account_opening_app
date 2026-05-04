import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type YesNo = "yes" | "no" | "";

export default function PersonalClientDeclaration() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "11-12"); // Step 11.5 - between Face and Regulatory
  const showReturnToPreview = useReturnToPreview();

  // A: Ultimate Beneficial Owner
  const [qA, setQA] = useState<YesNo>("");
  const [qAName, setQAName] = useState("");
  const [qAIdPassport, setQAIdPassport] = useState("");
  const [qACountry, setQACountry] = useState("");
  const [qAAddress, setQAAddress] = useState("");

  // B: SFC Registered Institution Employee/Director
  const [qB, setQB] = useState<YesNo>("");
  const [qBInstitutionName, setQBInstitutionName] = useState("");

  // C: Nationality / Birth Country / Tax Country
  const [nationality, setNationality] = useState("");
  const [birthCountry, setBirthCountry] = useState("");
  const [taxCountry, setTaxCountry] = useState("");

  // D: PEP (Politically Exposed Person)
  const [qD, setQD] = useState<YesNo>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading } = trpc.personalClientDeclaration.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.personalClientDeclaration.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/12`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setQA(existingData.qAUltimateBeneficialOwner || "");
      setQAName(existingData.qAOwnerName || "");
      setQAIdPassport(existingData.qAIdPassportNo || "");
      setQACountry(existingData.qACountryOfIssue || "");
      setQAAddress(existingData.qAAddress || "");
      setQB(existingData.qBSfcRegistration || "");
      setQBInstitutionName(existingData.qBInstitutionName || "");
      setNationality(existingData.nationality || "");
      setBirthCountry(existingData.birthCountry || "");
      setTaxCountry(existingData.taxCountry || "");
      setQD(existingData.qDPEP || "");
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // A: Ultimate Beneficial Owner
    if (!qA) newErrors.qA = "請選擇";
    if (qA === "no") {
      if (!qAName.trim()) newErrors.qAName = "請輸入姓名";
      if (!qAIdPassport.trim()) newErrors.qAIdPassport = "請輸入身份證/護照號碼";
      if (!qACountry.trim()) newErrors.qACountry = "請輸入簽發國家";
      if (!qAAddress.trim()) newErrors.qAAddress = "請輸入地址";
    }
    
    // B: SFC Registration
    if (!qB) newErrors.qB = "請選擇";
    if (qB === "yes" && !qBInstitutionName.trim()) {
      newErrors.qBInstitutionName = "請輸入機構名稱";
    }
    
    // C: Nationality info
    if (!nationality.trim()) newErrors.nationality = "請輸入國籍";
    if (!birthCountry.trim()) newErrors.birthCountry = "請輸入出生國家";
    if (!taxCountry.trim()) newErrors.taxCountry = "請輸入納稅國家";
    
    // D: PEP
    if (!qD) newErrors.qD = "請選擇";
    
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
      qAUltimateBeneficialOwner: qA,
      qAOwnerName: qA === "no" ? qAName : undefined,
      qAIdPassportNo: qA === "no" ? qAIdPassport : undefined,
      qACountryOfIssue: qA === "no" ? qACountry : undefined,
      qAAddress: qA === "no" ? qAAddress : undefined,
      qBSfcRegistration: qB,
      qBInstitutionName: qB === "yes" ? qBInstitutionName : undefined,
      nationality,
      birthCountry,
      taxCountry,
      qDPEP: qD,
    });
  };

  const RadioGroup = ({ value, onChange, name, error }: { value: YesNo; onChange: (v: YesNo) => void; name: string; error?: string }) => (
    <div>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} checked={value === "yes"} onChange={() => onChange("yes")} className="w-4 h-4" />
          <span>是 / Yes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} checked={value === "no"} onChange={() => onChange("no")} className="w-4 h-4" />
          <span>否 / No</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );

  if (isLoading) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={stepNum} showReturnToPreview={showReturnToPreview}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={stepNum}
      onNext={handleNext}
      isNextLoading={saveMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">客戶聲明 / Client Declaration</h2>
          <p className="text-sm text-muted-foreground mt-1">請如實填寫以下聲明內容</p>
        </div>

        {/* A: Ultimate Beneficial Owner */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(A) 是否為賬戶的最終受益人？</p>
            <p className="text-sm text-muted-foreground mt-1">Are you the ultimate beneficial owner of the account?</p>
          </div>
          <RadioGroup value={qA} onChange={(v) => { setQA(v); if (errors.qA) setErrors({...errors, qA: ""}); }} name="qA" error={errors.qA} />
          {qA === "no" && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label>姓名 / Name <span className="text-destructive">*</span></Label>
                <Input value={qAName} onChange={(e) => setQAName(e.target.value)} placeholder="請輸入姓名" className={errors.qAName ? "border-destructive" : ""} />
                {errors.qAName && <p className="text-sm text-destructive">{errors.qAName}</p>}
              </div>
              <div className="space-y-2">
                <Label>身份證/護照號碼 / ID/Passport No. <span className="text-destructive">*</span></Label>
                <Input value={qAIdPassport} onChange={(e) => setQAIdPassport(e.target.value)} placeholder="請輸入身份證/護照號碼" className={errors.qAIdPassport ? "border-destructive" : ""} />
                {errors.qAIdPassport && <p className="text-sm text-destructive">{errors.qAIdPassport}</p>}
              </div>
              <div className="space-y-2">
                <Label>簽發國家 / Country of Issue <span className="text-destructive">*</span></Label>
                <Input value={qACountry} onChange={(e) => setQACountry(e.target.value)} placeholder="請輸入簽發國家" className={errors.qACountry ? "border-destructive" : ""} />
                {errors.qACountry && <p className="text-sm text-destructive">{errors.qACountry}</p>}
              </div>
              <div className="space-y-2">
                <Label>地址 / Address <span className="text-destructive">*</span></Label>
                <Textarea value={qAAddress} onChange={(e) => setQAAddress(e.target.value)} placeholder="請輸入地址" className={errors.qAAddress ? "border-destructive" : ""} />
                {errors.qAAddress && <p className="text-sm text-destructive">{errors.qAAddress}</p>}
              </div>
            </div>
          )}
        </Card>

        {/* B: SFC Registration */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(B) 是否為證券投資及期貨事務監察委員會之持牌法團或註冊機構之僱員/董事？</p>
            <p className="text-sm text-muted-foreground mt-1">Are you an employee/director of an SFC-licensed corporation or registered institution?</p>
          </div>
          <RadioGroup value={qB} onChange={(v) => { setQB(v); if (errors.qB) setErrors({...errors, qB: ""}); }} name="qB" error={errors.qB} />
          {qB === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>持牌法團/註冊機構名稱 / Institution Name <span className="text-destructive">*</span></Label>
              <Input value={qBInstitutionName} onChange={(e) => setQBInstitutionName(e.target.value)} placeholder="請輸入機構名稱" className={errors.qBInstitutionName ? "border-destructive" : ""} />
              {errors.qBInstitutionName && <p className="text-sm text-destructive">{errors.qBInstitutionName}</p>}
            </div>
          )}
        </Card>

        {/* C: Nationality / Birth Country / Tax Country */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(C) 國籍/出生國家/納稅國家</p>
            <p className="text-sm text-muted-foreground mt-1">Nationality / Birth Country / Tax Country</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>國籍 / Nationality <span className="text-destructive">*</span></Label>
              <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="請輸入國籍" className={errors.nationality ? "border-destructive" : ""} />
              {errors.nationality && <p className="text-sm text-destructive">{errors.nationality}</p>}
            </div>
            <div className="space-y-2">
              <Label>出生國家 / Birth Country <span className="text-destructive">*</span></Label>
              <Input value={birthCountry} onChange={(e) => setBirthCountry(e.target.value)} placeholder="請輸入出生國家" className={errors.birthCountry ? "border-destructive" : ""} />
              {errors.birthCountry && <p className="text-sm text-destructive">{errors.birthCountry}</p>}
            </div>
            <div className="space-y-2">
              <Label>納稅國家 / Tax Country <span className="text-destructive">*</span></Label>
              <Input value={taxCountry} onChange={(e) => setTaxCountry(e.target.value)} placeholder="請輸入納稅國家" className={errors.taxCountry ? "border-destructive" : ""} />
              {errors.taxCountry && <p className="text-sm text-destructive">{errors.taxCountry}</p>}
            </div>
          </div>
        </Card>

        {/* D: PEP */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(D) 政治公眾人物 (PEP)</p>
            <p className="text-sm text-muted-foreground mt-1">Politically Exposed Person</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              政治公眾人物（PEP）是指在政府、軍隊、司法機構或國有企業中擔任重要職務的人士，包括其家庭成員和密切關聯人士。
            </p>
            <RadioGroup value={qD} onChange={(v) => { setQD(v); if (errors.qD) setErrors({...errors, qD: ""}); }} name="qD" error={errors.qD} />
          </div>
        </Card>
      </div>
    </ApplicationWizard>
  );
}