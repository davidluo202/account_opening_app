import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { CMF001_AGREEMENT_SECTIONS } from "@shared/cmf001-agreement";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

export default function RegulatoryDeclaration() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "13");
  const showReturnToPreview = useReturnToPreview();

  const [formData, setFormData] = useState({
    isPEP: false,
    isUSPerson: false,
    hasReadAgreement: false,
    acceptsETO: false,
    acceptsAML: false,
    acceptsRiskAssessment: false,
    hasReadConfirmation: false,
    objectsDirectMarketing: false,
    signature: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // 獲取客戶類型
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isCorporate = accountSelection?.customerType === 'corporate';

  // 獲取個人基本信息以驗證簽名
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
        acceptsRiskAssessment: existingData.riskAssessmentConsent || false,
        signature: existingData.signatureName,
      });
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasReadAgreement) {
      newErrors.hasReadAgreement = "請先閱讀開戶協議";
    }

    if (!formData.hasReadConfirmation) {
      newErrors.hasReadConfirmation = "請先閱讀客戶確認";
    }

    if (!formData.acceptsETO) {
      newErrors.acceptsETO = "請確認接受電子交易條例約束";
    }

    if (!formData.acceptsAML) {
      newErrors.acceptsAML = "請確認接受反洗錢和合規監管要求約束";
    }

    if (!formData.acceptsRiskAssessment) {
      newErrors.acceptsRiskAssessment = "請確認已閱讀並理解風險評估問卷";
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
      riskAssessmentConsent: formData.acceptsRiskAssessment,
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={stepNum}
      showReturnToPreview={showReturnToPreview}
    >
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
        {/* 機構：關聯人士監管聲明標題 */}
        {isCorporate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-lg text-blue-800">關聯人士監管聲明 / Associated Persons Regulatory Declaration</h3>
            <p className="text-sm text-blue-600">請由關聯人士（包括董事、授權簽署人、最終受益人）填寫此聲明。</p>
          </div>
        )}

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
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="text-center whitespace-pre-line">
                  {CMF001_AGREEMENT_SECTIONS.title}
                </DialogTitle>
                <p className="text-sm text-center text-muted-foreground mt-2 whitespace-pre-line">
                  {CMF001_AGREEMENT_SECTIONS.company}
                </p>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
                  {CMF001_AGREEMENT_SECTIONS.fullText}
                </div>
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold text-center">
                    請仔細閱讀以上協議內容。關閉此對話框後，請勾選下方的同意選項。
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Please read the above agreement carefully. After closing this dialog, please check the agreement box below.
                  </p>
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

          <p className="text-xs text-muted-foreground leading-tight" style={{margin: 0, padding: 0}}>
            我確認（i）已收到、閱讀及明白本公司附上之現金賬戶協定；（ii）同意接受該現金賬戶協定所約束；及（iii）同意如客戶資料表內之詞彙表達與該現金賬戶協定有任何抵觸，該現金賬戶協定將凌駕於客戶資料表。
          </p>
          <p className="text-xs text-muted-foreground leading-tight" style={{margin: 0, padding: 0}}>
            I confirm that (i) you have received, read and understood the provisions of the Cash Account Agreement; (ii) agree to be bound by the Cash Account Agreement; and (iii) agree that words and expressions which are defined in the Cash Account Agreement shall have the same meanings when used in this Customer Information Form unless otherwise stated or the context otherwise requires and that in the event of any inconsistency, the provisions of the Cash Account Agreement shall override this Customer Information Form.
          </p>
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

            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptsRiskAssessment"
                checked={formData.acceptsRiskAssessment}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, acceptsRiskAssessment: checked as boolean });
                  if (errors.acceptsRiskAssessment) {
                    setErrors({ ...errors, acceptsRiskAssessment: "" });
                  }
                }}
              />
              <Label htmlFor="acceptsRiskAssessment" className="cursor-pointer font-normal">
                我已閱讀並理解上述風險評估問卷。我確認我完全理解並接受：(i) 上述風險評估過程是為了幫助我在選擇金融/投資產品前評估我對風險的態度和投資目標；(ii) 上述風險評估過程並非旨在列出所有我在投資時應考慮的因素和/或問題；(iii) 我不能僅以此風險評估作為我的投資偏好，我的決定可能會隨時間而改變，特別是在投資時；(iv) 我必須充分閱讀並理解各種文件中所披露的信息（包括但不限於金融或投資產品的招股書/解釋備忘錄/小冊子/指南/發售文件），這些文件涉及金融或投資產品的特點、風險、優點、費用和其他細節，然後再做出任何投資決定；(v) 我必須自己確信我有能力承受與不同投資產品相關的風險水平。 <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.acceptsRiskAssessment && (
              <p className="text-sm text-destructive">{errors.acceptsRiskAssessment}</p>
            )}
          </div>

          {/* 确认书 */}
          <div className="space-y-3">
            <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  點擊閱讀客戶確認 / Client Confirmation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    客戶確認 / Client Confirmation
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-6 text-sm leading-relaxed">
                    <div>
                      <p className="font-semibold mb-2">(A)</p>
                      <p>You represent that the information on the Customer Information Form is true, complete and correct and that the representation in the attached agreement is accurate. Canton Mutual Financial Limited is entitled to reply fully on such information and representations for all purposes, unless Canton Mutual Financial Limited receives notice in writing of any change. Canton Mutual Financial Limited is authorised at any time to contact anyone, including your banks, brokers or any credit agency for purposes of verifying the information provided on this Customer Information Form. Please refer to our Personal Information Collection Statement which is attached as schedule Ι of the Cash Account Agreement for further information.</p>
                      <p className="mt-2 text-muted-foreground">你確認聲明在客戶數據表格內的數據屬真實、完整及正確，而附上的協定一切內容準確。除非誠港金融股份有限公司接到更改有關聲明內容的書面通知，誠港金融股份有限公司有權在任何用途上完全依賴這些資料及聲明。誠港金融股份有限公司有權隨時聯絡任何人，包括本人/吾等之銀行、經紀或任何信貸調查機構，以查證此客戶資料表格內所載之內容。詳情請參閱現金賬戶協定附表Ι的個人資料收集聲明。</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">(B)</p>
                      <p>You declare and acknowledge that the Risk Disclosure Statements are provided in a language chosen by you (English or Chinese) and you have invited to read the Risk Disclosure Statements, to ask questions and advice to take independent advice if you wish.</p>
                      <p className="mt-2 text-muted-foreground">你謹此聲明及確認，已獲提供所選擇的語言（英文或中文）的風險披露聲明。並已獲邀請閱讀該風險披露聲明，提出問題及徵求獨立意見（如有此意願）。</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">(C)</p>
                      <p>You confirm that you have received our Company's Securities Fee Schedule.</p>
                      <p className="mt-2 text-muted-foreground">你確認收妥本公司之股票服務收費表。</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">(D)</p>
                      <p>You are aware that you shall not settle any trading transaction with third-party's cheques.</p>
                      <p className="mt-2 text-muted-foreground">你確認不能以第三者支票作交收。</p>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold text-center">
                      請仔細閱讀以上客戶確認內容。關閉此對話框後，請勾選下方的同意選項。
                    </p>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Please read the above confirmation carefully. After closing this dialog, please check the confirmation box below.
                    </p>
                  </div>
                </ScrollArea>
                <Button onClick={() => {
                  setConfirmationOpen(false);
                  setFormData({ ...formData, hasReadConfirmation: true });
                  if (errors.hasReadConfirmation) {
                    setErrors({ ...errors, hasReadConfirmation: "" });
                  }
                }}>
                  我已閱讀並理解
                </Button>
              </DialogContent>
            </Dialog>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="hasReadConfirmation"
                checked={formData.hasReadConfirmation}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, hasReadConfirmation: checked as boolean });
                  if (errors.hasReadConfirmation) {
                    setErrors({ ...errors, hasReadConfirmation: "" });
                  }
                }}
              />
              <Label htmlFor="hasReadConfirmation" className="cursor-pointer font-normal">
                我已閱讀並同意客戶確認的所有內容 <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.hasReadConfirmation && (
              <p className="text-sm text-destructive">{errors.hasReadConfirmation}</p>
            )}

            {/* 直接促銷聲明 */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground leading-[2.5]" style={{margin: 0}}>
                我們擬使用你的姓名、電話號碼、電郵及地址以促銷證券相關產品/服務，但我們在未得到你的同意之前不能如此使用你的個人資料。請在本文最後簽署表示你同意使用你的個人資料。如你不同意，請在以下空格加上「✓」號，然後簽署。
              </p>
              <p className="text-xs text-muted-foreground leading-[2.5]" style={{margin: 0}}>
                We intend to use your name, telephone number, email and address for direct marketing securities related products/services but we cannot so use your personal data without your consent. Please sign at the end of this statement to indicate your agreement to such use. Should you find such use of your personal data not acceptable, please indicate your objection before signing by ticking the box below.
              </p>
              <div className="flex items-start space-x-2 mt-2">
                <Checkbox
                  id="objectsDirectMarketing"
                  checked={formData.objectsDirectMarketing}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, objectsDirectMarketing: checked as boolean });
                  }}
                />
                <Label htmlFor="objectsDirectMarketing" className="cursor-pointer font-normal">
                  本人（姓名如下）反對使用個人資料於擬作出的直接促銷 / The customer named objects to the proposed use of his/her personal data in direct marketing.
                </Label>
              </div>
            </div>
          </div>

          {/* 电子签名 */}
          <div className="space-y-2">
            <Label htmlFor="signature" style={{fontSize: '16px', fontWeight: 700}}>
              電子簽名 / Electronic Signature <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signature"
              value={formData.signature}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^[A-Za-z\s''\-,.]+$/.test(val)) {
                  setFormData({ ...formData, signature: val });
                  if (errors.signature) {
                    setErrors({ ...errors, signature: "" });
                  }
                }
              }}
              placeholder="Please enter your English name"
              className={errors.signature ? "border-destructive" : ""}
            />
            {errors.signature && <p className="text-sm text-destructive">{errors.signature}</p>}
            <p className="text-sm text-muted-foreground">
              申請人簽名（必須與Step 2 填寫的英文名字一致）
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-bold text-black" style={{margin: 0, fontSize: '16px'}}>聲明條款：</p>
            <p className="text-black" style={{margin: 0, fontSize: '16px', lineHeight: '1.6'}}>
              本人確認已詳細閱讀、清楚了解並同意《開戶協議》的所有內容，願意接受協議條款的約束。
              本人的電子簽名具有與手寫簽名同等的法律效力。
            </p>
          </div>
        </Card>
      </div>
    </ApplicationWizard>
  );
}
