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
import { convertToTraditional } from "@/lib/converter";

type YesNo = "yes" | "no" | "";

export default function PersonalClientDeclaration() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "12");
  const showReturnToPreview = useReturnToPreview();

  // Check if joint account
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isJoint = accountSelection?.customerType === 'joint';

  // (A) Ultimate Beneficial Owner
  const [isUBO, setIsUBO] = useState<YesNo>("");
  const [uboName, setUboName] = useState("");
  const [uboIdPassport, setUboIdPassport] = useState("");
  const [uboCountry, setUboCountry] = useState("");
  const [uboAddress, setUboAddress] = useState("");

  // (B) SFC Licensed Corporation / Registered Institution employee or director
  const [isSfcEmployee, setIsSfcEmployee] = useState<YesNo>("");
  const [sfcInstitutionName, setSfcInstitutionName] = useState("");

  // (C) CMF employee
  const [isCmfEmployee, setIsCmfEmployee] = useState<YesNo>("");

  // (D) Relative of CMF employee or director
  const [isCmfRelative, setIsCmfRelative] = useState<YesNo>("");
  const [cmfRelativeEmployeeName, setCmfRelativeEmployeeName] = useState("");
  const [cmfRelativeRelationship, setCmfRelativeRelationship] = useState("");

  // Joint account: second holder
  const [secondIsUBO, setSecondIsUBO] = useState<YesNo>("");
  const [secondUboName, setSecondUboName] = useState("");
  const [secondUboIdPassport, setSecondUboIdPassport] = useState("");
  const [secondUboCountry, setSecondUboCountry] = useState("");
  const [secondUboAddress, setSecondUboAddress] = useState("");
  const [secondIsSfcEmployee, setSecondIsSfcEmployee] = useState<YesNo>("");
  const [secondSfcInstitutionName, setSecondSfcInstitutionName] = useState("");
  const [secondIsCmfEmployee, setSecondIsCmfEmployee] = useState<YesNo>("");
  const [secondIsCmfRelative, setSecondIsCmfRelative] = useState<YesNo>("");
  const [secondCmfRelativeEmployeeName, setSecondCmfRelativeEmployeeName] = useState("");
  const [secondCmfRelativeRelationship, setSecondCmfRelativeRelationship] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading } = trpc.personalClientDeclaration.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'personalClientDeclaration' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      const d = existingSecondHolder as any;
      if (d.isUBO !== undefined) setSecondIsUBO(d.isUBO);
      if (d.uboName !== undefined) setSecondUboName(d.uboName);
      if (d.uboIdPassport !== undefined) setSecondUboIdPassport(d.uboIdPassport);
      if (d.uboCountry !== undefined) setSecondUboCountry(d.uboCountry);
      if (d.uboAddress !== undefined) setSecondUboAddress(d.uboAddress);
      if (d.isSfcEmployee !== undefined) setSecondIsSfcEmployee(d.isSfcEmployee);
      if (d.sfcInstitutionName !== undefined) setSecondSfcInstitutionName(d.sfcInstitutionName);
      if (d.isCmfEmployee !== undefined) setSecondIsCmfEmployee(d.isCmfEmployee);
      if (d.isCmfRelative !== undefined) setSecondIsCmfRelative(d.isCmfRelative);
      if (d.cmfRelativeEmployeeName !== undefined) setSecondCmfRelativeEmployeeName(d.cmfRelativeEmployeeName);
      if (d.cmfRelativeRelationship !== undefined) setSecondCmfRelativeRelationship(d.cmfRelativeRelationship);
    }
  }, [existingSecondHolder]);

  const saveMutation = trpc.personalClientDeclaration.save.useMutation({
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
      setIsUBO(existingData.declaration_a_is_beneficial_owner ? "yes" : "no");
      setUboName(existingData.declaration_a_owner_name || "");
      setUboIdPassport(existingData.declaration_a_owner_id || "");
      setUboCountry(existingData.declaration_a_owner_country || "");
      setUboAddress(existingData.declaration_a_owner_address || "");
      setIsSfcEmployee(existingData.declaration_b_is_employee ? "yes" : "no");
      setSfcInstitutionName(existingData.declaration_b_institution_name || "");
      setIsCmfEmployee(existingData.declaration_c_is_cmf_employee ? "yes" : "no");
      setIsCmfRelative(existingData.declaration_d_is_relative ? "yes" : "no");
      setCmfRelativeEmployeeName(existingData.declaration_d_employee_name || "");
      setCmfRelativeRelationship(existingData.declaration_d_relationship || "");
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!isUBO) newErrors.isUBO = "請選擇";
    if (isUBO === "no") {
      if (!uboName.trim()) newErrors.uboName = "請輸入最終受益擁有人姓名";
      if (!uboIdPassport.trim()) newErrors.uboIdPassport = "請輸入身份證/護照號碼";
      if (!uboCountry.trim()) newErrors.uboCountry = "請輸入簽發國家";
      if (!uboAddress.trim()) newErrors.uboAddress = "請輸入地址";
    }
    if (!isSfcEmployee) newErrors.isSfcEmployee = "請選擇";
    if (isSfcEmployee === "yes" && !sfcInstitutionName.trim()) newErrors.sfcInstitutionName = "請輸入機構名稱";
    if (!isCmfEmployee) newErrors.isCmfEmployee = "請選擇";
    if (!isCmfRelative) newErrors.isCmfRelative = "請選擇";
    if (isCmfRelative === "yes") {
      if (!cmfRelativeEmployeeName.trim()) newErrors.cmfRelativeEmployeeName = "請輸入雇員姓名";
      if (!cmfRelativeRelationship.trim()) newErrors.cmfRelativeRelationship = "請輸入關係";
    }
    if (isJoint) {
      if (!secondIsUBO) newErrors.secondIsUBO = "請選擇";
      if (secondIsUBO === "no") {
        if (!secondUboName.trim()) newErrors.secondUboName = "請輸入最終受益擁有人姓名";
        if (!secondUboIdPassport.trim()) newErrors.secondUboIdPassport = "請輸入身份證/護照號碼";
        if (!secondUboCountry.trim()) newErrors.secondUboCountry = "請輸入簽發國家";
        if (!secondUboAddress.trim()) newErrors.secondUboAddress = "請輸入地址";
      }
      if (!secondIsSfcEmployee) newErrors.secondIsSfcEmployee = "請選擇";
      if (secondIsSfcEmployee === "yes" && !secondSfcInstitutionName.trim()) newErrors.secondSfcInstitutionName = "請輸入機構名稱";
      if (!secondIsCmfEmployee) newErrors.secondIsCmfEmployee = "請選擇";
      if (!secondIsCmfRelative) newErrors.secondIsCmfRelative = "請選擇";
      if (secondIsCmfRelative === "yes") {
        if (!secondCmfRelativeEmployeeName.trim()) newErrors.secondCmfRelativeEmployeeName = "請輸入雇員姓名";
        if (!secondCmfRelativeRelationship.trim()) newErrors.secondCmfRelativeRelationship = "請輸入關係";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }
    if (isJoint) {
      saveSecondHolderMutation.mutate({
        applicationId,
        stepName: 'personalClientDeclaration',
        data: {
          isUBO: secondIsUBO,
          uboName: secondIsUBO === "no" ? secondUboName : "",
          uboIdPassport: secondIsUBO === "no" ? secondUboIdPassport : "",
          uboCountry: secondIsUBO === "no" ? secondUboCountry : "",
          uboAddress: secondIsUBO === "no" ? secondUboAddress : "",
          isSfcEmployee: secondIsSfcEmployee,
          sfcInstitutionName: secondIsSfcEmployee === "yes" ? secondSfcInstitutionName : "",
          isCmfEmployee: secondIsCmfEmployee,
          isCmfRelative: secondIsCmfRelative,
          cmfRelativeEmployeeName: secondIsCmfRelative === "yes" ? secondCmfRelativeEmployeeName : "",
          cmfRelativeRelationship: secondIsCmfRelative === "yes" ? secondCmfRelativeRelationship : "",
        },
      });
    }
    saveMutation.mutate({
      applicationId,
      declaration_a_is_beneficial_owner: isUBO === "yes",
      declaration_a_owner_name: isUBO === "no" ? uboName : "",
      declaration_a_owner_id: isUBO === "no" ? uboIdPassport : "",
      declaration_a_owner_country: isUBO === "no" ? uboCountry : "",
      declaration_a_owner_address: isUBO === "no" ? uboAddress : "",
      declaration_b_is_employee: isSfcEmployee === "yes",
      declaration_b_institution_name: isSfcEmployee === "yes" ? sfcInstitutionName : "",
      declaration_c_is_cmf_employee: isCmfEmployee === "yes",
      declaration_d_is_relative: isCmfRelative === "yes",
      declaration_d_employee_name: isCmfRelative === "yes" ? cmfRelativeEmployeeName : "",
      declaration_d_relationship: isCmfRelative === "yes" ? cmfRelativeRelationship : "",
    });
  };

  const RadioGroup = ({ value, onChange, name, error }: { value: YesNo; onChange: (v: YesNo) => void; name: string; error?: string }) => (
    <div>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} checked={value === "yes"} onChange={() => onChange("yes")} className="w-4 h-4" />
          <span>Yes 是。</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} checked={value === "no"} onChange={() => onChange("no")} className="w-4 h-4" />
          <span>No 不是。</span>
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
          <p className="text-sm text-muted-foreground mt-1">請如實填寫以下聲明內容</p>
        </div>

        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">賬戶主要持有人 / Primary Account Holder</h3>
        )}

        {/* (A) Ultimate Beneficial Owner */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(A) 閣下是否此戶口之最終權益擁有人？（即閣下是否為本人而非第三者運作此賬戶？）</p>
            <p className="text-sm text-muted-foreground mt-1">Are you the ultimate beneficial owner(s) in relation to the Account? (i.e. are you acting for your own and not for a third party?)</p>
          </div>
          <RadioGroup value={isUBO} onChange={(v) => { setIsUBO(v); if (errors.isUBO) setErrors({...errors, isUBO: ""}); }} name="isUBO" error={errors.isUBO} />
          {isUBO === "no" && (
            <div className="space-y-3 ml-6">
              <p className="text-sm text-muted-foreground">不是，賬戶之最終權益擁有人是：/ No, details of the ultimate beneficial owner(s) is/are:</p>
              <div className="space-y-2">
                <Label>姓名 / Name <span className="text-destructive">*</span></Label>
                <Input
                  value={uboName}
                  onChange={(e) => setUboName(e.target.value)}
                  onBlur={() => setUboName(convertToTraditional(uboName))}
                  placeholder="請輸入最終受益擁有人姓名"
                  className={errors.uboName ? "border-destructive" : ""}
                />
                {errors.uboName && <p className="text-sm text-destructive">{errors.uboName}</p>}
              </div>
              <div className="space-y-2">
                <Label>身份證/護照號碼 / ID/Passport No. <span className="text-destructive">*</span></Label>
                <Input
                  value={uboIdPassport}
                  onChange={(e) => setUboIdPassport(e.target.value)}
                  placeholder="請輸入身份證/護照號碼"
                  className={errors.uboIdPassport ? "border-destructive" : ""}
                />
                {errors.uboIdPassport && <p className="text-sm text-destructive">{errors.uboIdPassport}</p>}
              </div>
              <div className="space-y-2">
                <Label>簽發國家 / Country of Issue <span className="text-destructive">*</span></Label>
                <Input
                  value={uboCountry}
                  onChange={(e) => setUboCountry(e.target.value)}
                  onBlur={() => setUboCountry(convertToTraditional(uboCountry))}
                  placeholder="請輸入簽發國家"
                  className={errors.uboCountry ? "border-destructive" : ""}
                />
                {errors.uboCountry && <p className="text-sm text-destructive">{errors.uboCountry}</p>}
              </div>
              <div className="space-y-2">
                <Label>地址 / Address <span className="text-destructive">*</span></Label>
                <Textarea
                  value={uboAddress}
                  onChange={(e) => setUboAddress(e.target.value)}
                  onBlur={() => setUboAddress(convertToTraditional(uboAddress))}
                  placeholder="請輸入最終受益擁有人地址"
                  className={errors.uboAddress ? "border-destructive" : ""}
                />
                {errors.uboAddress && <p className="text-sm text-destructive">{errors.uboAddress}</p>}
              </div>
            </div>
          )}
        </Card>

        {/* (B) SFC Licensed Corporation / Registered Institution */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(B) 閣下是否證監會註冊持牌法團或註冊機構之雇員或董事？</p>
            <p className="text-sm text-muted-foreground mt-1">Are you an employee or director of a Licensed Corporation or Registered Institution registered with the Securities and Futures Commission?</p>
          </div>
          <RadioGroup value={isSfcEmployee} onChange={(v) => { setIsSfcEmployee(v); if (errors.isSfcEmployee) setErrors({...errors, isSfcEmployee: ""}); }} name="isSfcEmployee" error={errors.isSfcEmployee} />
          {isSfcEmployee === "yes" && (
            <div className="space-y-2 ml-6">
              <Label>請提供有關持牌法團或註冊機構名稱 / Please provide the name of the Licensed Corporation or Registered Institution <span className="text-destructive">*</span></Label>
              <Input
                value={sfcInstitutionName}
                onChange={(e) => setSfcInstitutionName(e.target.value)}
                onBlur={() => setSfcInstitutionName(convertToTraditional(sfcInstitutionName))}
                placeholder="請輸入機構名稱"
                className={errors.sfcInstitutionName ? "border-destructive" : ""}
              />
              {errors.sfcInstitutionName && <p className="text-sm text-destructive">{errors.sfcInstitutionName}</p>}
            </div>
          )}
        </Card>

        {/* (C) CMF Employee */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(C) 閣下是否誠港金融股份有限公司之雇員？</p>
            <p className="text-sm text-muted-foreground mt-1">Are you an employee of Canton Mutual Financial Limited?</p>
          </div>
          <RadioGroup value={isCmfEmployee} onChange={(v) => { setIsCmfEmployee(v); if (errors.isCmfEmployee) setErrors({...errors, isCmfEmployee: ""}); }} name="isCmfEmployee" error={errors.isCmfEmployee} />
        </Card>

        {/* (D) Relative of CMF Employee or Director */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">(D) 閣下是否誠港金融股份有限公司雇員或董事之親屬？</p>
            <p className="text-sm text-muted-foreground mt-1">Are you the relative of an employee or director of Canton Mutual Financial Limited?</p>
          </div>
          <RadioGroup value={isCmfRelative} onChange={(v) => { setIsCmfRelative(v); if (errors.isCmfRelative) setErrors({...errors, isCmfRelative: ""}); }} name="isCmfRelative" error={errors.isCmfRelative} />
          {isCmfRelative === "yes" && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label>雇員姓名 / Name of Employee <span className="text-destructive">*</span></Label>
                <Input
                  value={cmfRelativeEmployeeName}
                  onChange={(e) => setCmfRelativeEmployeeName(e.target.value)}
                  onBlur={() => setCmfRelativeEmployeeName(convertToTraditional(cmfRelativeEmployeeName))}
                  placeholder="請輸入雇員姓名"
                  className={errors.cmfRelativeEmployeeName ? "border-destructive" : ""}
                />
                {errors.cmfRelativeEmployeeName && <p className="text-sm text-destructive">{errors.cmfRelativeEmployeeName}</p>}
              </div>
              <div className="space-y-2">
                <Label>關係 / Relationship</Label>
                <Input
                  value={cmfRelativeRelationship}
                  onChange={(e) => setCmfRelativeRelationship(e.target.value)}
                  onBlur={() => setCmfRelativeRelationship(convertToTraditional(cmfRelativeRelationship))}
                  placeholder="請輸入與該員工的關係"
                  className={errors.cmfRelativeRelationship ? "border-destructive" : ""}
                />
                {errors.cmfRelativeRelationship && <p className="text-sm text-destructive">{errors.cmfRelativeRelationship}</p>}
              </div>
            </div>
          )}
        </Card>

        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2 mt-8">賬戶第二持有人 / Second Account Holder</h3>

            {/* (A) Ultimate Beneficial Owner - Second Holder */}
            <Card className="p-6 space-y-4">
              <div>
                <p className="font-medium">(A) 閣下是否此戶口之最終權益擁有人？（即閣下是否為本人而非第三者運作此賬戶？）</p>
                <p className="text-sm text-muted-foreground mt-1">Are you the ultimate beneficial owner(s) in relation to the Account? (i.e. are you acting for your own and not for a third party?)</p>
              </div>
              <RadioGroup value={secondIsUBO} onChange={(v) => { setSecondIsUBO(v); if (errors.secondIsUBO) setErrors({...errors, secondIsUBO: ""}); }} name="second_isUBO" error={errors.secondIsUBO} />
              {secondIsUBO === "no" && (
                <div className="space-y-3 ml-6">
                  <p className="text-sm text-muted-foreground">不是，賬戶之最終權益擁有人是：/ No, details of the ultimate beneficial owner(s) is/are:</p>
                  <div className="space-y-2">
                    <Label>姓名 / Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={secondUboName}
                      onChange={(e) => setSecondUboName(e.target.value)}
                      onBlur={() => setSecondUboName(convertToTraditional(secondUboName))}
                      placeholder="請輸入最終受益擁有人姓名"
                      className={errors.secondUboName ? "border-destructive" : ""}
                    />
                    {errors.secondUboName && <p className="text-sm text-destructive">{errors.secondUboName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>身份證/護照號碼 / ID/Passport No. <span className="text-destructive">*</span></Label>
                    <Input
                      value={secondUboIdPassport}
                      onChange={(e) => setSecondUboIdPassport(e.target.value)}
                      placeholder="請輸入身份證/護照號碼"
                      className={errors.secondUboIdPassport ? "border-destructive" : ""}
                    />
                    {errors.secondUboIdPassport && <p className="text-sm text-destructive">{errors.secondUboIdPassport}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>簽發國家 / Country of Issue <span className="text-destructive">*</span></Label>
                    <Input
                      value={secondUboCountry}
                      onChange={(e) => setSecondUboCountry(e.target.value)}
                      onBlur={() => setSecondUboCountry(convertToTraditional(secondUboCountry))}
                      placeholder="請輸入簽發國家"
                      className={errors.secondUboCountry ? "border-destructive" : ""}
                    />
                    {errors.secondUboCountry && <p className="text-sm text-destructive">{errors.secondUboCountry}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>地址 / Address <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={secondUboAddress}
                      onChange={(e) => setSecondUboAddress(e.target.value)}
                      onBlur={() => setSecondUboAddress(convertToTraditional(secondUboAddress))}
                      placeholder="請輸入最終受益擁有人地址"
                      className={errors.secondUboAddress ? "border-destructive" : ""}
                    />
                    {errors.secondUboAddress && <p className="text-sm text-destructive">{errors.secondUboAddress}</p>}
                  </div>
                </div>
              )}
            </Card>

            {/* (B) SFC Licensed Corporation / Registered Institution - Second Holder */}
            <Card className="p-6 space-y-4">
              <div>
                <p className="font-medium">(B) 閣下是否證監會註冊持牌法團或註冊機構之雇員或董事？</p>
                <p className="text-sm text-muted-foreground mt-1">Are you an employee or director of a Licensed Corporation or Registered Institution registered with the Securities and Futures Commission?</p>
              </div>
              <RadioGroup value={secondIsSfcEmployee} onChange={(v) => { setSecondIsSfcEmployee(v); if (errors.secondIsSfcEmployee) setErrors({...errors, secondIsSfcEmployee: ""}); }} name="second_isSfcEmployee" error={errors.secondIsSfcEmployee} />
              {secondIsSfcEmployee === "yes" && (
                <div className="space-y-2 ml-6">
                  <Label>請提供有關持牌法團或註冊機構名稱 / Please provide the name of the Licensed Corporation or Registered Institution <span className="text-destructive">*</span></Label>
                  <Input
                    value={secondSfcInstitutionName}
                    onChange={(e) => setSecondSfcInstitutionName(e.target.value)}
                    onBlur={() => setSecondSfcInstitutionName(convertToTraditional(secondSfcInstitutionName))}
                    placeholder="請輸入機構名稱"
                    className={errors.secondSfcInstitutionName ? "border-destructive" : ""}
                  />
                  {errors.secondSfcInstitutionName && <p className="text-sm text-destructive">{errors.secondSfcInstitutionName}</p>}
                </div>
              )}
            </Card>

            {/* (C) CMF Employee - Second Holder */}
            <Card className="p-6 space-y-4">
              <div>
                <p className="font-medium">(C) 閣下是否誠港金融股份有限公司之雇員？</p>
                <p className="text-sm text-muted-foreground mt-1">Are you an employee of Canton Mutual Financial Limited?</p>
              </div>
              <RadioGroup value={secondIsCmfEmployee} onChange={(v) => { setSecondIsCmfEmployee(v); if (errors.secondIsCmfEmployee) setErrors({...errors, secondIsCmfEmployee: ""}); }} name="second_isCmfEmployee" error={errors.secondIsCmfEmployee} />
            </Card>

            {/* (D) Relative of CMF Employee or Director - Second Holder */}
            <Card className="p-6 space-y-4">
              <div>
                <p className="font-medium">(D) 閣下是否誠港金融股份有限公司雇員或董事之親屬？</p>
                <p className="text-sm text-muted-foreground mt-1">Are you the relative of an employee or director of Canton Mutual Financial Limited?</p>
              </div>
              <RadioGroup value={secondIsCmfRelative} onChange={(v) => { setSecondIsCmfRelative(v); if (errors.secondIsCmfRelative) setErrors({...errors, secondIsCmfRelative: ""}); }} name="second_isCmfRelative" error={errors.secondIsCmfRelative} />
              {secondIsCmfRelative === "yes" && (
                <div className="space-y-3 ml-6">
                  <div className="space-y-2">
                    <Label>雇員姓名 / Name of Employee <span className="text-destructive">*</span></Label>
                    <Input
                      value={secondCmfRelativeEmployeeName}
                      onChange={(e) => setSecondCmfRelativeEmployeeName(e.target.value)}
                      onBlur={() => setSecondCmfRelativeEmployeeName(convertToTraditional(secondCmfRelativeEmployeeName))}
                      placeholder="請輸入雇員姓名"
                      className={errors.secondCmfRelativeEmployeeName ? "border-destructive" : ""}
                    />
                    {errors.secondCmfRelativeEmployeeName && <p className="text-sm text-destructive">{errors.secondCmfRelativeEmployeeName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>關係 / Relationship</Label>
                    <Input
                      value={secondCmfRelativeRelationship}
                      onChange={(e) => setSecondCmfRelativeRelationship(e.target.value)}
                      onBlur={() => setSecondCmfRelativeRelationship(convertToTraditional(secondCmfRelativeRelationship))}
                      placeholder="請輸入與該員工的關係"
                      className={errors.secondCmfRelativeRelationship ? "border-destructive" : ""}
                    />
                    {errors.secondCmfRelativeRelationship && <p className="text-sm text-destructive">{errors.secondCmfRelativeRelationship}</p>}
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </ApplicationWizard>
  );
}
