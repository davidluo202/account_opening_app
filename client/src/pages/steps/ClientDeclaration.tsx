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
import { useLang } from '@/lib/i18n';

type YesNo = "yes" | "no" | "";

export default function ClientDeclaration() {
  const { t } = useLang();
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
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`);
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
    if (!q1) newErrors.q1 = t('請選擇', 'Please select', '请选择');
    if (q1 === "yes" && !q1CeNo.trim()) newErrors.q1CeNo = t('請輸入中央編號', 'Please enter CE No.', '请输入中央编号');
    if (!q2) newErrors.q2 = t('請選擇', 'Please select', '请选择');
    if (!q3) newErrors.q3 = t('請選擇', 'Please select', '请选择');
    if (q3 === "yes" && !q3Details.trim()) newErrors.q3Details = t('請填寫詳情', 'Please provide details', '请填写详情');
    if (!q4) newErrors.q4 = t('請選擇', 'Please select', '请选择');
    if (q4 === "yes" && !q4Details.trim()) newErrors.q4Details = t('請填寫詳情', 'Please provide details', '请填写详情');
    if (!q5) newErrors.q5 = t('請選擇', 'Please select', '请选择');
    if (q5 === "yes" && !q5Details.trim()) newErrors.q5Details = t('請填寫詳情', 'Please provide details', '请填写详情');
    if (!q6) newErrors.q6 = t('請選擇', 'Please select', '请选择');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error(t('請檢查表單中的錯誤', 'Please check the form for errors', '请检查表单中的错误'));
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
          <span>{t('是', 'Yes', '是')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} checked={value === "no"} onChange={() => onChange("no")} className="w-4 h-4" />
          <span>{t('否', 'No', '否')}</span>
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
          <p className="text-sm text-muted-foreground">{t('請如實填寫以下聲明內容', 'Please complete the following declarations truthfully', '请如实填写以下声明内容')}</p>
        </div>

        {/* Q1 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">{t('貴公司是否為證券投資及期貨事務監察委員會之持牌法團或註冊機構？', 'Is the company a licensed corporation registered with the Securities and Futures Commission or registered institution under the Banking Ordinance?', '贵公司是否为证券投资及期货事务监察委员会之持牌法团或注册机构？')}</p>
          </div>
          <RadioGroup value={q1} onChange={(v) => { setQ1(v); if (errors.q1) setErrors({...errors, q1: ""}); }} name="q1" error={errors.q1} />
          {q1 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>{t('中央編號', 'CE No.', '中央编号')} <span className="text-destructive">*</span></Label>
              <Input value={q1CeNo} onChange={(e) => setQ1CeNo(e.target.value)} placeholder={t('請輸入中央編號', 'Please enter CE No.', '请输入中央编号')} className={errors.q1CeNo ? "border-destructive" : ""} />
              {errors.q1CeNo && <p className="text-sm text-destructive">{errors.q1CeNo}</p>}
            </div>
          )}
        </Card>

        {/* Q2 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">{t('貴公司是否以中介人身份操作賬戶？如是，戶口的最終權益擁有人（包括通過代理人或信託人而持有利益之受益人）', 'Are the company acting as an intermediary for the account? If yes, details of the ultimate beneficial owner(s), including a beneficiary holding an interest through a nominee or trust, is/are', '贵公司是否以中介人身份操作账户？如是，户口的最终权益拥有人（包括通过代理人或信托人而持有利益之受益人）')}</p>
          </div>
          <RadioGroup value={q2} onChange={(v) => { setQ2(v); if (errors.q2) setErrors({...errors, q2: ""}); }} name="q2" error={errors.q2} />
          {q2 === "yes" && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label>{t('名稱', 'Name', '名称')}</Label>
                <Input value={q2Name} onChange={(e) => setQ2Name(e.target.value)} placeholder={t('請輸入名稱', 'Please enter name', '请输入名称')} />
              </div>
              <div className="space-y-2">
                <Label>{t('身份證/護照號碼', 'ID/Passport No.', '身份证/护照号码')}</Label>
                <Input value={q2IdPassport} onChange={(e) => setQ2IdPassport(e.target.value)} placeholder={t('請輸入身份證/護照號碼', 'Please enter ID/Passport No.', '请输入身份证/护照号码')} />
              </div>
              <div className="space-y-2">
                <Label>{t('地址', 'Address', '地址')}</Label>
                <Textarea value={q2Address} onChange={(e) => setQ2Address(e.target.value)} placeholder={t('請輸入地址', 'Please enter address', '请输入地址')} />
              </div>
            </div>
          )}
        </Card>

        {/* Q3 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">{t('貴公司之任何董事、股東或授權人士是否為誠港金融股份有限公司的客戶？', 'Is any directors, shareholders or authorized persons of the company client of CANTON MUTUAL FINANCIAL LIMITED?', '贵公司之任何董事、股东或授权人士是否为诚港金融股份有限公司的客户？')}</p>
          </div>
          <RadioGroup value={q3} onChange={(v) => { setQ3(v); if (errors.q3) setErrors({...errors, q3: ""}); }} name="q3" error={errors.q3} />
          {q3 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>{t('如是，職員名稱及職位為', 'If yes, Staff Name & Position is', '如是，职员名称及职位为')} <span className="text-destructive">*</span></Label>
              <Input value={q3Details} onChange={(e) => setQ3Details(e.target.value)} placeholder={t('請填寫姓名及職位', 'Please enter name and position', '请填写姓名及职位')} className={errors.q3Details ? "border-destructive" : ""} />
              {errors.q3Details && <p className="text-sm text-destructive">{errors.q3Details}</p>}
            </div>
          )}
        </Card>

        {/* Q4 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">{t('貴公司之任何董事、股東或授權人士是否誠港金融股份有限公司的職員？', 'Does any directors, shareholders or authorized persons of the company is a staff of CANTON MUTUAL FINANCIAL LIMITED?', '贵公司之任何董事、股东或授权人士是否诚港金融股份有限公司的职员？')}</p>
          </div>
          <RadioGroup value={q4} onChange={(v) => { setQ4(v); if (errors.q4) setErrors({...errors, q4: ""}); }} name="q4" error={errors.q4} />
          {q4 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>{t('如是，職員名稱及職位為', 'If yes, Staff Name & Position is', '如是，职员名称及职位为')} <span className="text-destructive">*</span></Label>
              <Input value={q4Details} onChange={(e) => setQ4Details(e.target.value)} placeholder={t('請填寫姓名及職位', 'Please enter name and position', '请填写姓名及职位')} className={errors.q4Details ? "border-destructive" : ""} />
              {errors.q4Details && <p className="text-sm text-destructive">{errors.q4Details}</p>}
            </div>
          )}
        </Card>

        {/* Q5 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">{t('貴公司之任何董事、股東或授權人士與誠港金融股份有限公司員工是否有親戚關係？', 'Does any directors, shareholders or authorized persons of the company have any relationship with the staff of CANTON MUTUAL FINANCIAL LIMITED?', '贵公司之任何董事、股东或授权人士与诚港金融股份有限公司员工是否有亲戚关系？')}</p>
          </div>
          <RadioGroup value={q5} onChange={(v) => { setQ5(v); if (errors.q5) setErrors({...errors, q5: ""}); }} name="q5" error={errors.q5} />
          {q5 === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>{t('如是，職員名稱及職位為', 'If yes, Staff Name & Position is', '如是，职员名称及职位为')} <span className="text-destructive">*</span></Label>
              <Input value={q5Details} onChange={(e) => setQ5Details(e.target.value)} placeholder={t('請填寫姓名及職位', 'Please enter name and position', '请填写姓名及职位')} className={errors.q5Details ? "border-destructive" : ""} />
              {errors.q5Details && <p className="text-sm text-destructive">{errors.q5Details}</p>}
            </div>
          )}
        </Card>

        {/* Q6 */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">{t('貴公司之任何董事、股東或授權人士是否為香港聯合交易所參與者或任何根據證券投資及期貨條例註冊持牌法或銀行條例之註冊機構職員（不管閣下現時是否為監管機構持牌代表/金管局註冊人士）？', 'Is any directors, or authorized persons of the company an employee of any participant of the Stock Exchange of Hong Kong, a licensed corporate under the Securities and Futures Ordinance, or registered institution Banking Ordinance (whether he/she is currently a SFC licensed/HKMA registered person or not)?', '贵公司之任何董事、股东或授权人士是否为香港联合交易所参与者或任何根据证券投资及期货条例注册持牌法或银行条例之注册机构职员（不管阁下现时是否为监管机构持牌代表/金管局注册人士）？')}</p>
          </div>
          <RadioGroup value={q6} onChange={(v) => { setQ6(v); if (errors.q6) setErrors({...errors, q6: ""}); }} name="q6" error={errors.q6} />
          {q6 === "yes" && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label>{t('如是，董事、股東或授權人士之姓名', 'If yes, Name of director/shareholder or authorized person', '如是，董事、股东或授权人士之姓名')}</Label>
                <Input value={q6DirectorName} onChange={(e) => setQ6DirectorName(e.target.value)} placeholder={t('請輸入姓名', 'Please enter name', '请输入姓名')} />
              </div>
              <div className="space-y-2">
                <Label>{t('如是，持牌法團/註冊機構之註冊機構名', 'If yes, Name of Licensed Corporate / Registered Institution', '如是，持牌法团/注册机构之注册机构名')}</Label>
                <Input value={q6InstitutionName} onChange={(e) => setQ6InstitutionName(e.target.value)} placeholder={t('請輸入機構名稱', 'Please enter institution name', '请输入机构名称')} />
              </div>
              <div className="space-y-2">
                <Label>{t('如是，持牌法團/註冊機構之註冊號碼', 'If yes, Participate / CE / Registered No.', '如是，持牌法团/注册机构之注册号码')}</Label>
                <Input value={q6ParticipateNo} onChange={(e) => setQ6ParticipateNo(e.target.value)} placeholder={t('請輸入註冊號碼', 'Please enter registered no.', '请输入注册号码')} />
              </div>
              <div className="space-y-2">
                <Label>{t('如是，職員名稱及職位為', 'If yes, Staff Name & Position is', '如是，职员名称及职位为')}</Label>
                <Input value={q6StaffNamePosition} onChange={(e) => setQ6StaffNamePosition(e.target.value)} placeholder={t('請填寫姓名及職位', 'Please enter name and position', '请填写姓名及职位')} />
              </div>
              <p className="text-sm text-muted-foreground italic">{t('(必須提供由所屬持牌法團或註冊機構發出之授權信)', '(Consent Letter from licensed corporation or registered institution must be provided)', '(必须提供由所属持牌法团或注册机构发出之授权信)')}</p>
            </div>
          )}
        </Card>
      </div>
    </ApplicationWizard>
  );
}
