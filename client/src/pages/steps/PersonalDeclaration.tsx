import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type YesNo = "yes" | "no" | "";

export default function PersonalDeclaration() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "12");
  const showReturnToPreview = useReturnToPreview();

  // Q1: Is the applicant the ultimate beneficial owner?
  const [q1, setQ1] = useState<YesNo>("");

  // Q2: Is the applicant an employee/director of SFC-licensed/registered institution?
  const [q2, setQ2] = useState<YesNo>("");
  const [q2Name, setQ2Name] = useState("");
  const [q2CeNo, setQ2CeNo] = useState("");

  // Q3: Is the applicant an employee of Canton Mutual Financial?
  const [q3, setQ3] = useState<YesNo>("");

  // Q4: Is the applicant a relative of an employee/director?
  const [q4, setQ4] = useState<YesNo>("");
  const [q4Name, setQ4Name] = useState("");
  const [q4Relationship, setQ4Relationship] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading } = trpc.personalDeclaration.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.personalDeclaration.save.useMutation({
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

  const saveOnlyMutation = trpc.personalDeclaration.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setQ1(existingData.declaration_a_is_beneficial_owner ? "yes" : "no");
      setQ2(existingData.declaration_b_is_employee ? "yes" : "no");
      setQ2Name(existingData.declaration_b_institution_name || "");
      setQ3(existingData.declaration_c_is_cmf_employee ? "yes" : "no");
      setQ4(existingData.declaration_d_is_relative ? "yes" : "no");
      setQ4Name(existingData.declaration_d_employee_name || "");
      setQ4Relationship(existingData.declaration_d_relationship || "");
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!q1) newErrors.q1 = "請選擇";
    if (!q2) newErrors.q2 = "請選擇";
    if (q2 === "yes" && !q2Name.trim()) newErrors.q2Name = "請填寫機構名稱";
    if (q2 === "yes" && !q2CeNo.trim()) newErrors.q2CeNo = "請填寫中央編號";
    if (!q3) newErrors.q3 = "請選擇";
    if (!q4) newErrors.q4 = "請選擇";
    if (q4 === "yes" && !q4Name.trim()) newErrors.q4Name = "請填寫姓名";
    if (q4 === "yes" && !q4Relationship.trim()) newErrors.q4Relationship = "請填寫關係";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    saveOnlyMutation.mutate({
      applicationId,
      declaration_a_is_beneficial_owner: q1 === "yes",
      declaration_a_owner_name: q1 === "yes" ? "" : undefined,
      declaration_a_owner_id: undefined,
      declaration_a_owner_country: undefined,
      declaration_a_owner_address: undefined,
      declaration_b_is_employee: q2 === "yes",
      declaration_b_institution_name: q2 === "yes" ? q2Name : undefined,
      declaration_c_is_cmf_employee: q3 === "yes",
      declaration_d_is_relative: q4 === "yes",
      declaration_d_employee_name: q4 === "yes" ? q4Name : undefined,
      declaration_d_relationship: q4 === "yes" ? q4Relationship : undefined,
    });
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    saveMutation.mutate({
      applicationId,
      declaration_a_is_beneficial_owner: q1 === "yes",
      declaration_a_owner_name: q1 === "yes" ? "" : undefined,
      declaration_a_owner_id: undefined,
      declaration_a_owner_country: undefined,
      declaration_a_owner_address: undefined,
      declaration_b_is_employee: q2 === "yes",
      declaration_b_institution_name: q2 === "yes" ? q2Name : undefined,
      declaration_c_is_cmf_employee: q3 === "yes",
      declaration_d_is_relative: q4 === "yes",
      declaration_d_employee_name: q4 === "yes" ? q4Name : undefined,
      declaration_d_relationship: q4 === "yes" ? q4Relationship : undefined,
    });
  };

  if (isLoading) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={stepNum}
        showReturnToPreview={showReturnToPreview}
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard applicationId={applicationId} currentStep={stepNum}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">客戶聲明 / Client Declaration</h2>
          <p className="text-sm text-muted-foreground mb-6">
            請如實填寫以下聲明。如有任何問題，請聯繫您的客戶經理。
          </p>

          {/* Q1: Ultimate Beneficial Owner */}
          <div className="space-y-3 mb-6">
            <Label className="font-medium">
              (A) 您是否為帳戶的最終實益擁有人？<span className="text-destructive">*</span>
              <br />
              <span className="text-sm text-muted-foreground font-normal">
                Are you the ultimate beneficial owner of the account?
              </span>
            </Label>
            <RadioGroup value={q1} onValueChange={(v) => { setQ1(v as YesNo); if (errors.q1) setErrors({ ...errors, q1: "" }); }} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="q1-y" />
                <Label htmlFor="q1-y" className="cursor-pointer">是 Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="q1-n" />
                <Label htmlFor="q1-n" className="cursor-pointer">否 No</Label>
              </div>
            </RadioGroup>
            {errors.q1 && <p className="text-sm text-destructive">{errors.q1}</p>}
          </div>

          {/* Q2: SFC Licensed/Registered Institution Employee */}
          <div className="space-y-3 mb-6">
            <Label className="font-medium">
              (B) 您是否為香港證監會持牌/註冊機構的僱員或董事？<span className="text-destructive">*</span>
              <br />
              <span className="text-sm text-muted-foreground font-normal">
                Are you an employee or director of an SFC-licensed/registered institution?
              </span>
            </Label>
            <RadioGroup value={q2} onValueChange={(v) => { setQ2(v as YesNo); if (errors.q2) setErrors({ ...errors, q2: "" }); }} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="q2-y" />
                <Label htmlFor="q2-y" className="cursor-pointer">是 Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="q2-n" />
                <Label htmlFor="q2-n" className="cursor-pointer">否 No</Label>
              </div>
            </RadioGroup>
            {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}

            {q2 === "yes" && (
              <div className="grid md:grid-cols-2 gap-4 mt-4 pl-4 border-l-4 border-primary">
                <div className="space-y-2">
                  <Label htmlFor="q2Name">機構名稱 Institution Name <span className="text-destructive">*</span></Label>
                  <input
                    id="q2Name"
                    value={q2Name}
                    onChange={(e) => { setQ2Name(e.target.value); if (errors.q2Name) setErrors({ ...errors, q2Name: "" }); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="請輸入機構名稱"
                  />
                  {errors.q2Name && <p className="text-sm text-destructive">{errors.q2Name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q2CeNo">中央編號 CE No. <span className="text-destructive">*</span></Label>
                  <input
                    id="q2CeNo"
                    value={q2CeNo}
                    onChange={(e) => { setQ2CeNo(e.target.value); if (errors.q2CeNo) setErrors({ ...errors, q2CeNo: "" }); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="請輸入中央編號"
                  />
                  {errors.q2CeNo && <p className="text-sm text-destructive">{errors.q2CeNo}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Q3: CMF Employee */}
          <div className="space-y-3 mb-6">
            <Label className="font-medium">
              (C) 您是否為民森金融有限公司的僱員？<span className="text-destructive">*</span>
              <br />
              <span className="text-sm text-muted-foreground font-normal">
                Are you an employee of Canton Mutual Financial Limited?
              </span>
            </Label>
            <RadioGroup value={q3} onValueChange={(v) => { setQ3(v as YesNo); if (errors.q3) setErrors({ ...errors, q3: "" }); }} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="q3-y" />
                <Label htmlFor="q3-y" className="cursor-pointer">是 Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="q3-n" />
                <Label htmlFor="q3-n" className="cursor-pointer">否 No</Label>
              </div>
            </RadioGroup>
            {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
          </div>

          {/* Q4: Relative of Employee/Director */}
          <div className="space-y-3 mb-6">
            <Label className="font-medium">
              (D) 您是否為僱員/董事的親屬？<span className="text-destructive">*</span>
              <br />
              <span className="text-sm text-muted-foreground font-normal">
                Are you a relative of an employee/director?
              </span>
            </Label>
            <RadioGroup value={q4} onValueChange={(v) => { setQ4(v as YesNo); if (errors.q4) setErrors({ ...errors, q4: "" }); }} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="q4-y" />
                <Label htmlFor="q4-y" className="cursor-pointer">是 Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="q4-n" />
                <Label htmlFor="q4-n" className="cursor-pointer">否 No</Label>
              </div>
            </RadioGroup>
            {errors.q4 && <p className="text-sm text-destructive">{errors.q4}</p>}

            {q4 === "yes" && (
              <div className="grid md:grid-cols-2 gap-4 mt-4 pl-4 border-l-4 border-primary">
                <div className="space-y-2">
                  <Label htmlFor="q4Name">僱員/董事姓名 Employee/Director Name <span className="text-destructive">*</span></Label>
                  <input
                    id="q4Name"
                    value={q4Name}
                    onChange={(e) => { setQ4Name(e.target.value); if (errors.q4Name) setErrors({ ...errors, q4Name: "" }); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="請輸入姓名"
                  />
                  {errors.q4Name && <p className="text-sm text-destructive">{errors.q4Name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q4Relationship">關係 Relationship <span className="text-destructive">*</span></Label>
                  <input
                    id="q4Relationship"
                    value={q4Relationship}
                    onChange={(e) => { setQ4Relationship(e.target.value); if (errors.q4Relationship) setErrors({ ...errors, q4Relationship: "" }); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="如：配偶、子女、兄弟姐妹等"
                  />
                  {errors.q4Relationship && <p className="text-sm text-destructive">{errors.q4Relationship}</p>}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ApplicationWizard>
  );
}