import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

export default function RegulatoryDeclaration() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");

  const [formData, setFormData] = useState({
    isPEP: false,
    isUSPerson: false,
    hasReadAgreement: false,
    acceptsETO: false,
    acceptsAML: false,
    signature: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreementOpen, setAgreementOpen] = useState(false);

  // 获取个人基本信息以验证签名
  const { data: basicInfo } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: existingData, isLoading: isLoadingData } = trpc.regulatory.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.regulatory.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/preview`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        isPEP: existingData.isPEP,
        isUSPerson: existingData.isUSPerson,
        hasReadAgreement: existingData.agreementRead,
        acceptsETO: existingData.electronicSignatureConsent,
        acceptsAML: existingData.amlComplianceConsent,
        signature: existingData.signatureName,
      });
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasReadAgreement) {
      newErrors.hasReadAgreement = "請先閱讀開戶協議";
    }

    if (!formData.acceptsETO) {
      newErrors.acceptsETO = "請確認接受電子交易條例約束";
    }

    if (!formData.acceptsAML) {
      newErrors.acceptsAML = "請確認接受反洗錢和合規監管要求約束";
    }

    if (!formData.signature.trim()) {
      newErrors.signature = "請輸入您的英文姓名作為電子簽名";
    } else if (basicInfo && formData.signature.trim().toLowerCase() !== basicInfo.englishName.toLowerCase()) {
      newErrors.signature = "簽名必須與您的英文姓名一致";
    }

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
      isPEP: formData.isPEP,
      isUSPerson: formData.isUSPerson,
      agreementRead: formData.hasReadAgreement,
      agreementAccepted: formData.hasReadAgreement,
      signatureName: formData.signature,
      electronicSignatureConsent: formData.acceptsETO,
      amlComplianceConsent: formData.acceptsAML,
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={12}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={12}
      onNext={handleNext}
      isNextLoading={saveMutation.isPending}
    >
      <div className="space-y-6">
        {/* PEP 声明 */}
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold text-lg">政治公眾人物聲明 / PEP Declaration</h4>
          <p className="text-sm text-muted-foreground">
            政治公眾人物（PEP）是指在政府、軍隊、司法機構或國有企業中擔任重要職務的人士，包括其家庭成員和密切關聯人士。
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="isPEP"
              checked={formData.isPEP}
              onCheckedChange={(checked) => setFormData({ ...formData, isPEP: checked as boolean })}
            />
            <Label htmlFor="isPEP" className="cursor-pointer font-normal">
              我確認本人是政治公眾人物（PEP）或與PEP有密切關聯
            </Label>
          </div>
        </Card>

        {/* US Person 声明 */}
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold text-lg">美國人士聲明 / US Person Declaration</h4>
          <p className="text-sm text-muted-foreground">
            美國人士包括美國公民、美國永久居民（綠卡持有人）、美國稅務居民或在美國註冊的實體。
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="isUSPerson"
              checked={formData.isUSPerson}
              onCheckedChange={(checked) => setFormData({ ...formData, isUSPerson: checked as boolean })}
            />
            <Label htmlFor="isUSPerson" className="cursor-pointer font-normal">
              我確認本人是美國人士（US Person）
            </Label>
          </div>
        </Card>

        {/* 开户协议 */}
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold text-lg">開戶協議 / Account Opening Agreement</h4>
          
          <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                點擊閱讀開戶協議（CMF001）
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>開戶協議 CMF001</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold text-base">客戶開戶協議</h3>
                  
                  <section>
                    <h4 className="font-semibold">1. 協議目的</h4>
                    <p>本協議規定了客戶與本公司之間關於證券賬戶開立、使用和管理的權利和義務。</p>
                  </section>

                  <section>
                    <h4 className="font-semibold">2. 賬戶開立</h4>
                    <p>2.1 客戶申請開立證券賬戶時，應如實提供所有必需的個人信息和文件。</p>
                    <p>2.2 本公司有權審核客戶提供的信息，並決定是否接受開戶申請。</p>
                  </section>

                  <section>
                    <h4 className="font-semibold">3. 客戶聲明與保證</h4>
                    <p>3.1 客戶聲明並保證所提供的所有信息均真實、準確、完整。</p>
                    <p>3.2 客戶同意及時更新個人信息，並對信息變更承擔通知義務。</p>
                  </section>

                  <section>
                    <h4 className="font-semibold">4. 風險披露</h4>
                    <p>4.1 證券投資存在市場風險，客戶應充分了解並承擔投資風險。</p>
                    <p>4.2 本公司不對投資收益作出任何保證或承諾。</p>
                  </section>

                  <section>
                    <h4 className="font-semibold">5. 費用與收費</h4>
                    <p>5.1 本公司將按照公開披露的收費標準收取相關費用。</p>
                    <p>5.2 收費標準可能會調整，本公司將提前通知客戶。</p>
                  </section>

                  <section>
                    <h4 className="font-semibold">6. 保密條款</h4>
                    <p>6.1 本公司承諾對客戶信息保密，但法律法規另有規定的除外。</p>
                    <p>6.2 客戶授權本公司在必要時向監管機構披露相關信息。</p>
                  </section>

                  <section>
                    <h4 className="font-semibold">7. 協議終止</h4>
                    <p>7.1 客戶可隨時申請終止本協議並關閉賬戶。</p>
                    <p>7.2 本公司在特定情況下有權終止本協議。</p>
                  </section>

                  <section>
                    <h4 className="font-semibold">8. 適用法律</h4>
                    <p>本協議受香港特別行政區法律管轄。</p>
                  </section>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      本協議為示例文本。實際協議內容應由法律顧問根據公司實際情況和監管要求制定。
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <Button onClick={() => {
                setAgreementOpen(false);
                setFormData({ ...formData, hasReadAgreement: true });
                if (errors.hasReadAgreement) {
                  setErrors({ ...errors, hasReadAgreement: "" });
                }
              }}>
                我已閱讀並理解
              </Button>
            </DialogContent>
          </Dialog>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="hasReadAgreement"
              checked={formData.hasReadAgreement}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, hasReadAgreement: checked as boolean });
                if (errors.hasReadAgreement) {
                  setErrors({ ...errors, hasReadAgreement: "" });
                }
              }}
            />
            <Label htmlFor="hasReadAgreement" className="cursor-pointer font-normal">
              我已閱讀並同意《開戶協議》的所有條款 <span className="text-destructive">*</span>
            </Label>
          </div>
          {errors.hasReadAgreement && (
            <p className="text-sm text-destructive">{errors.hasReadAgreement}</p>
          )}
        </Card>

        {/* 电子签署和监管确认 */}
        <Card className="p-6 space-y-6">
          <h4 className="font-semibold text-lg">電子簽署與監管確認 / E-Signature & Regulatory Confirmation</h4>

          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptsETO"
                checked={formData.acceptsETO}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, acceptsETO: checked as boolean });
                  if (errors.acceptsETO) {
                    setErrors({ ...errors, acceptsETO: "" });
                  }
                }}
              />
              <Label htmlFor="acceptsETO" className="cursor-pointer font-normal">
                我確認接受香港《電子交易條例》（ETO, Cap.553）對電子簽署的法律約束 <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.acceptsETO && (
              <p className="text-sm text-destructive">{errors.acceptsETO}</p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptsAML"
                checked={formData.acceptsAML}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, acceptsAML: checked as boolean });
                  if (errors.acceptsAML) {
                    setErrors({ ...errors, acceptsAML: "" });
                  }
                }}
              />
              <Label htmlFor="acceptsAML" className="cursor-pointer font-normal">
                我確認接受反洗錢（AML）和其他合規監管要求的約束 <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.acceptsAML && (
              <p className="text-sm text-destructive">{errors.acceptsAML}</p>
            )}
          </div>

          {/* 电子签名 */}
          <div className="space-y-2">
            <Label htmlFor="signature">
              電子簽名 / Electronic Signature <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signature"
              value={formData.signature}
              onChange={(e) => {
                setFormData({ ...formData, signature: e.target.value });
                if (errors.signature) {
                  setErrors({ ...errors, signature: "" });
                }
              }}
              placeholder="請輸入您的英文姓名"
              className={errors.signature ? "border-destructive" : ""}
            />
            {errors.signature && <p className="text-sm text-destructive">{errors.signature}</p>}
            <p className="text-sm text-muted-foreground">
              請輸入您的英文姓名（必須與Case 3中填寫的英文姓名一致）
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">聲明條款：</p>
            <p>
              本人確認已詳細閱讀、清楚了解並同意《開戶協議》的所有內容，願意接受協議條款的約束。
              本人的電子簽名具有與手寫簽名同等的法律效力。
            </p>
          </div>
        </Card>
      </div>
    </ApplicationWizard>
  );
}
