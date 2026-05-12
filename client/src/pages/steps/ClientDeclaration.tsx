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

export default function ClientDeclaration() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "10");
  const showReturnToPreview = useReturnToPreview();

  // Q1: Is the company a licensed corporation / registered institution?
  const [q1, setQ1] = useState<YesNo>("");
  const [q1CeNo, setQ1CeNo] = useState("");

  // Q2: Is the company acting as an intermediary?
  const [q2, setQ2] = useState<YesNo>("");
  const [q2Name, setQ2Name] = useState("");
  const [q2IdPassport, setQ2IdPassport] = useState("");
  const [q2Address, setQ2Address] = useState("");

  // Q3: Is any director/shareholder a client of CMF?
  const [q3, setQ3] = useState<YesNo>("");
  const [q3Details, setQ3Details] = useState("");

  // Q4: Is any director/shareholder a staff of CMF?
  const [q4, setQ4] = useState<YesNo>("");
  const [q4Details, setQ4Details] = useState("");

  // Q5: Does any director/shareholder have relationship with CMF staff?
  const [q5, setQ5] = useState<YesNo>("");
  const [q5Details, setQ5Details] = useState("");

  // Q6: Is any director/shareholder an employee of stock exchange / SFC licensed / HKMA registered?
  const [q6, setQ6] = useState<YesNo>("");
  const [q6DirectorName, setQ6DirectorName] = useState("");
  const [q6InstitutionName, setQ6InstitutionName] = useState("");
  const [q6ParticipateNo, setQ6ParticipateNo] = useState("");
  const [q6StaffNamePosition, setQ6StaffNamePosition] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading } = trpc.clientDeclaration.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.clientDeclaration.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setQ1((existingData.q1Licensed || "") as YesNo);
      setQ1CeNo(existingData.q1CeNo || "");
      setQ2((existingData.q2Intermediary || "") as YesNo);
      setQ2Name(existingData.q2Name || "");
      setQ2IdPassport(existingData.q2IdPassport || "");
      setQ2Address(existingData.q2Address || "");
      setQ3((existingData.q3ClientOfCmf || "") as YesNo);
      setQ3Details(existingData.q3Details || "");
      setQ4((existingData.q4StaffOfCmf || "") as YesNo);
      setQ4Details(existingData.q4Details || "");
      setQ5((existingData.q5RelationshipWithStaff || "") as YesNo);
      setQ5Details(existingData.q5Details || "");
      setQ6((existingData.q6ExchangeParticipant || "") as YesNo);
      setQ6DirectorName(existingData.q6DirectorName || "");
      setQ6InstitutionName(existingData.q6InstitutionName || "");
      setQ6ParticipateNo(existingData.q6ParticipateNo || "");
      setQ6StaffNamePosition(existingData.q6StaffNamePosition || "");
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!q1) newErrors.q1 = "請選擇";
    if (q1 === "yes" && !q1CeNo.trim()) newErrors.q1CeNo = "請輸入中央編號";
    if (!q2) newErrors.q2 = "請選擇";
    if (!q3) newErrors.q3 = "請選擇";
    if (q3 === "yes" && !q3Details.trim()) newErrors.q3Details = "請填寫詳情";
    if (!q4) newErrors.q4 = "請選擇";
    if (q4 === "yes" && !q4Details.trim()) newErrors.q4Details = "請填寫詳情";
    if (!q5) newErrors.q5 = "請選擇";
    if (q5 === "yes" && !q5Details.trim()) newErrors.q5Details = "請填寫詳情";
    if (!q6) newErrors.q6 = "請選擇";
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
      q1Licensed: q1,
      q1CeNo,
      q2Intermediary: q2,
      q2Name,
      q2IdPassport,
      q2Address,
      q3ClientOfCmf: q3,
      q3Details,
      q4StaffOfCmf: q4,
      q4Details,
      q5RelationshipWithStaff: q5,
      q5Details,
      q6ExchangeParticipant: q6,
      q6DirectorName,
      q6InstitutionName,
      q6ParticipateNo,
      q6StaffNamePosition,
    });
  };

  const RadioGroup = ({ value, onChange, name, error }: { value: YesNo; onChange: (v: YesNo) => void; name: string; error?: string }) => (
    <div>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} checked={value === "yes"} onChange={() => onChange("yes")} className="w-4 h-4" />
          <span>Yes 是</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} checked={value === "no"} onChange={() => onChange("no")} className="w-4 h-4" />
          <span>No 否</span>
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
          <p className="text-sm text-muted-foreground">請如實填寫以下聲明內容</p>
        </div>

        {/* Q1 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">貴公司是否為證券投資及期貨事務監察委員會之持牌法團或註冊機構？</p>
            <p className="text-sm text-muted-foreground mt-1">Is the company a licensed corporation registered with the Securities and Futures Commission or registered institution under the Banking Ordinance?</p>
          </div>
          <RadioGroup value={q1} onChange={(v) => { setQ1(v); if (errors.q1) setErrors({...errors, q1: ""}); }} name="q1" error={errors.q1} />
          {q1 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>中央編號 / CE No <span className="text-destructive">*</span></Label>
              <Input value={q1CeNo} onChange={(e) => setQ1CeNo(e.target.value)} placeholder="請輸入中央編號" className={errors.q1CeNo ? "border-destructive" : ""} />
              {errors.q1CeNo && <p className="text-sm text-destructive">{errors.q1CeNo}</p>}
            </div>
          )}
        </Card>

        {/* Q2 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">貴公司是否以中介人身份操作賬戶？如是，戶口的最終權益擁有人（包括通過代理人或信託人而持有利益之受益人）</p>
            <p className="text-sm text-muted-foreground mt-1">Are the company acting as an intermediary for the account? If yes, details of the ultimate beneficial owner(s), including a beneficiary holding an interest through a nominee or trust, is/are</p>
          </div>
          <RadioGroup value={q2} onChange={(v) => { setQ2(v); if (errors.q2) setErrors({...errors, q2: ""}); }} name="q2" error={errors.q2} />
          {q2 === "yes" && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label>名稱 / Name</Label>
                <Input value={q2Name} onChange={(e) => setQ2Name(e.target.value)} placeholder="請輸入名稱" />
              </div>
              <div className="space-y-2">
                <Label>身份證/護照號碼 / ID/Passport No.</Label>
                <Input value={q2IdPassport} onChange={(e) => setQ2IdPassport(e.target.value)} placeholder="請輸入身份證/護照號碼" />
              </div>
              <div className="space-y-2">
                <Label>地址 / Address</Label>
                <Textarea value={q2Address} onChange={(e) => setQ2Address(e.target.value)} placeholder="請輸入地址" />
              </div>
            </div>
          )}
        </Card>

        {/* Q3 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">貴公司之任何董事、股東或授權人士是否為誠港金融股份有限公司的客戶？</p>
            <p className="text-sm text-muted-foreground mt-1">Is any directors, shareholders or authorized persons of the company client of CANTON MUTUAL FINANCIAL LIMITED?</p>
          </div>
          <RadioGroup value={q3} onChange={(v) => { setQ3(v); if (errors.q3) setErrors({...errors, q3: ""}); }} name="q3" error={errors.q3} />
          {q3 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>如是，職員名稱及職位為 / If yes, Staff Name & Position is <span className="text-destructive">*</span></Label>
              <Input value={q3Details} onChange={(e) => setQ3Details(e.target.value)} placeholder="請填寫姓名及職位" className={errors.q3Details ? "border-destructive" : ""} />
              {errors.q3Details && <p className="text-sm text-destructive">{errors.q3Details}</p>}
            </div>
          )}
        </Card>

        {/* Q4 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">貴公司之任何董事、股東或授權人士是否誠港金融股份有限公司的職員？</p>
            <p className="text-sm text-muted-foreground mt-1">Does any directors, shareholders or authorized persons of the company is a staff of CANTON MUTUAL FINANCIAL LIMITED?</p>
          </div>
          <RadioGroup value={q4} onChange={(v) => { setQ4(v); if (errors.q4) setErrors({...errors, q4: ""}); }} name="q4" error={errors.q4} />
          {q4 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>如是，職員名稱及職位為 / If yes, Staff Name & Position is <span className="text-destructive">*</span></Label>
              <Input value={q4Details} onChange={(e) => setQ4Details(e.target.value)} placeholder="請填寫姓名及職位" className={errors.q4Details ? "border-destructive" : ""} />
              {errors.q4Details && <p className="text-sm text-destructive">{errors.q4Details}</p>}
            </div>
          )}
        </Card>

        {/* Q5 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">貴公司之任何董事、股東或授權人士與誠港金融股份有限公司員工是否有親戚關係？</p>
            <p className="text-sm text-muted-foreground mt-1">Does any directors, shareholders or authorized persons of the company have any relationship with the staff of CANTON MUTUAL FINANCIAL LIMITED?</p>
          </div>
          <RadioGroup value={q5} onChange={(v) => { setQ5(v); if (errors.q5) setErrors({...errors, q5: ""}); }} name="q5" error={errors.q5} />
          {q5 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>如是，職員名稱及職位為 / If yes, Staff Name & Position is <span className="text-destructive">*</span></Label>
              <Input value={q5Details} onChange={(e) => setQ5Details(e.target.value)} placeholder="請填寫姓名及職位" className={errors.q5Details ? "border-destructive" : ""} />
              {errors.q5Details && <p className="text-sm text-destructive">{errors.q5Details}</p>}
            </div>
          )}
        </Card>

        {/* Q6 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">貴公司之任何董事、股東或授權人士是否為香港聯合交易所參與者或任何根據證券投資及期貨條例註冊持牌法或銀行條例之註冊機構職員（不管閣下現時是否為監管機構持牌代表/金管局註冊人士）？</p>
            <p className="text-sm text-muted-foreground mt-1">Are the company acting as an intermediary for the account? Is any directors, or authorized persons of the company an employee of any participant of the Stock Exchange of Hong Kong, a licensed corporate under the Securities and Futures Ordinance, or registered institution Banking Ordinance (whether he/she is currently a SFC licensed/HKMA registered person or not)?</p>
          </div>
          <RadioGroup value={q6} onChange={(v) => { setQ6(v); if (errors.q6) setErrors({...errors, q6: ""}); }} name="q6" error={errors.q6} />
          {q6 === "yes" && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label>如是，董事、股東或授權人士之姓名 / If yes, Name of director/shareholder or authorized person</Label>
                <Input value={q6DirectorName} onChange={(e) => setQ6DirectorName(e.target.value)} placeholder="請輸入姓名" />
              </div>
              <div className="space-y-2">
                <Label>如是，持牌法團/註冊機構之註冊機構名 / If yes, Name of Licensed Corporate / Registered Institution</Label>
                <Input value={q6InstitutionName} onChange={(e) => setQ6InstitutionName(e.target.value)} placeholder="請輸入機構名稱" />
              </div>
              <div className="space-y-2">
                <Label>如是，持牌法團/註冊機構之註冊號碼 / If yes, Participate / CE / Registered No.</Label>
                <Input value={q6ParticipateNo} onChange={(e) => setQ6ParticipateNo(e.target.value)} placeholder="請輸入註冊號碼" />
              </div>
              <div className="space-y-2">
                <Label>如是，職員名稱及職位為 / If yes, Staff Name & Position is</Label>
                <Input value={q6StaffNamePosition} onChange={(e) => setQ6StaffNamePosition(e.target.value)} placeholder="請填寫姓名及職位" />
              </div>
              <p className="text-sm text-muted-foreground italic">(Consent Letter from licensed corporation or registered institution must be provided) (必須提供由所屬持牌法團或註冊機構發出之授權信)</p>
            </div>
          )}
        </Card>
      </div>
    </ApplicationWizard>
  );
}
