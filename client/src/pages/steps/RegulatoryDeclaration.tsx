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
import { useLang } from '@/lib/i18n';

export default function RegulatoryDeclaration() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "13");
  const showReturnToPreview = useReturnToPreview();
  const { t } = useLang();

  const [formData, setFormData] = useState({
    isPEP: false,
    isUSPerson: false,
    hasReadAgreement: false,
    acceptsETO: false,
    acceptsAML: false,
    acceptsRiskAssessment: false,
    acceptsBcanConsent: false,
    hasReadConfirmation: false,
    objectsDirectMarketing: false,
    signature: "",
  });

  // Joint account: second holder
  const [secondFormData, setSecondFormData] = useState({
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
  const isJoint = accountSelection?.customerType === 'joint';

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
        toast.success(t("保存成功", "Saved successfully", "保存成功"));
        setLocation(`/application/${applicationId}/preview`);
      }
    },
    onError: (error) => {
      toast.error(`${t("保存失敗", "Save failed", "保存失败")}: ${error.message}`);
    },
  });

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'regulatoryDeclaration' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      setSecondFormData(prev => ({ ...prev, ...(existingSecondHolder as any) }));
    }
  }, [existingSecondHolder]);

  // 獲取第二持有人基本信息以驗證簽名
  const { data: secondBasicInfo } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'personalBasic' },
    { enabled: !!applicationId && isJoint }
  );

  useEffect(() => {
    if (existingData) {
      setFormData({
        isPEP: existingData.isPEP,
        isUSPerson: existingData.isUSPerson,
        hasReadAgreement: existingData.agreementRead,
        acceptsETO: existingData.electronicSignatureConsent,
        acceptsAML: existingData.amlComplianceConsent,
        acceptsRiskAssessment: existingData.riskAssessmentConsent || false,
        acceptsBcanConsent: existingData.bcanConsentAccepted || false,
        hasReadConfirmation: !!existingData.confirmationRead,
        objectsDirectMarketing: !!existingData.objectsDirectMarketing,
        signature: existingData.signatureName,
      });
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasReadAgreement) {
      newErrors.hasReadAgreement = t("請先閱讀開戶協議", "Please read the account opening agreement first", "请先阅读开户协议");
    }

    if (!formData.hasReadConfirmation) {
      newErrors.hasReadConfirmation = t("請先閱讀客戶確認", "Please read the client confirmation first", "请先阅读客户确认");
    }

    if (!formData.acceptsETO) {
      newErrors.acceptsETO = t("請確認接受電子交易條例約束", "Please confirm acceptance of the ETO", "请确认接受电子交易条例约束");
    }

    if (!formData.acceptsAML) {
      newErrors.acceptsAML = t("請確認接受反洗錢和合規監管要求約束", "Please confirm acceptance of AML and compliance requirements", "请确认接受反洗钱和合规监管要求约束");
    }

    if (!formData.acceptsRiskAssessment) {
      newErrors.acceptsRiskAssessment = t("請確認已閱讀並理解風險評估問卷", "Please confirm you have read and understood the risk assessment questionnaire", "请确认已阅读并理解风险评估问卷");
    }

    if (!formData.acceptsBcanConsent) {
      newErrors.acceptsBcanConsent = t("請確認同意投資者識別碼制度", "Please confirm consent to the Investor Identification Regime", "请确认同意投资者识别码制度");
    }

    if (!formData.signature.trim()) {
      newErrors.signature = t("請輸入您的英文姓名作為電子簽名", "Please enter your English name as electronic signature", "请输入您的英文姓名作为电子签名");
    } else if (basicInfo && formData.signature.trim().toLowerCase() !== basicInfo.englishName.toLowerCase()) {
      newErrors.signature = t("簽名必須與您的英文姓名一致", "Signature must match your English name", "签名必须与您的英文姓名一致");
    }

    if (isJoint) {
      if (!secondFormData.hasReadAgreement) {
        newErrors.secondHasReadAgreement = t("請先閱讀開戶協議", "Please read the account opening agreement first", "请先阅读开户协议");
      }
      if (!secondFormData.hasReadConfirmation) {
        newErrors.secondHasReadConfirmation = t("請先閱讀客戶確認", "Please read the client confirmation first", "请先阅读客户确认");
      }
      if (!secondFormData.acceptsETO) {
        newErrors.secondAcceptsETO = t("請確認接受電子交易條例約束", "Please confirm acceptance of the ETO", "请确认接受电子交易条例约束");
      }
      if (!secondFormData.acceptsAML) {
        newErrors.secondAcceptsAML = t("請確認接受反洗錢和合規監管要求約束", "Please confirm acceptance of AML and compliance requirements", "请确认接受反洗钱和合规监管要求约束");
      }
      if (!secondFormData.acceptsRiskAssessment) {
        newErrors.secondAcceptsRiskAssessment = t("請確認已閱讀並理解風險評估問卷", "Please confirm you have read and understood the risk assessment questionnaire", "请确认已阅读并理解风险评估问卷");
      }
      if (!secondFormData.signature.trim()) {
        newErrors.secondSignature = t("請輸入第二持有人的英文姓名作為電子簽名", "Please enter the second holder's English name as electronic signature", "请输入第二持有人的英文姓名作为电子签名");
      } else if (secondBasicInfo && typeof secondBasicInfo === 'object' && (secondBasicInfo as any).englishName && secondFormData.signature.trim().toLowerCase() !== (secondBasicInfo as any).englishName.toLowerCase()) {
        newErrors.secondSignature = t("簽名必須與第二持有人的英文姓名一致", "Signature must match the second holder's English name", "签名必须与第二持有人的英文姓名一致");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleNext = () => {
    if (!validateForm()) {
      toast.error(t("請檢查表單中的錯誤", "Please check the errors in the form", "请检查表单中的错误"));
      return;
    }

    if (isJoint) {
      saveSecondHolderMutation.mutate({
        applicationId,
        stepName: 'regulatoryDeclaration',
        data: { ...secondFormData, signedAt: new Date().toISOString() },
      });
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
      bcanConsentAccepted: formData.acceptsBcanConsent,
      confirmationRead: formData.hasReadConfirmation,
      objectsDirectMarketing: formData.objectsDirectMarketing,
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
        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">{t("賬戶主要持有人 / Primary Account Holder", "Primary Account Holder", "账户主要持有人 / Primary Account Holder")}</h3>
        )}

        {/* 機構：關聯人士監管聲明標題 */}
        {isCorporate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-lg text-blue-800">{t("關聯人士監管聲明 / Associated Persons Regulatory Declaration", "Associated Persons Regulatory Declaration", "关联人士监管声明 / Associated Persons Regulatory Declaration")}</h3>
            <p className="text-sm text-blue-600">{t("請由關聯人士（包括董事、授權簽署人、最終受益人）填寫此聲明。", "Please have associated persons (including directors, authorised signatories, ultimate beneficial owners) complete this declaration.", "请由关联人士（包括董事、授权签署人、最终受益人）填写此声明。")}</p>
          </div>
        )}

        {/* PEP 声明 */}
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold text-lg">{t("政治公眾人物聲明 / PEP Declaration", "PEP Declaration", "政治公众人物声明 / PEP Declaration")}</h4>
          <p className="text-sm text-muted-foreground">
            {t("政治公眾人物（PEP）是指在政府、軍隊、司法機構或國有企業中擔任重要職務的人士，包括其家庭成員和密切關聯人士。", "A Politically Exposed Person (PEP) refers to an individual who holds a prominent public function in government, military, judiciary, or state-owned enterprises, including their family members and close associates.", "政治公众人物（PEP）是指在政府、军队、司法机构或国有企业中担任重要职务的人士，包括其家庭成员和密切关联人士。")}
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="isPEP"
              checked={formData.isPEP}
              onCheckedChange={(checked) => setFormData({ ...formData, isPEP: checked as boolean })}
            />
            <Label htmlFor="isPEP" className="cursor-pointer font-normal">
              {t("我確認本人是政治公眾人物（PEP）或與PEP有密切關聯", "I confirm that I am a Politically Exposed Person (PEP) or closely associated with a PEP", "我确认本人是政治公众人物（PEP）或与PEP有密切关联")}
            </Label>
          </div>
        </Card>

        {/* US Person 声明 */}
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold text-lg">{t("美國人士聲明 / US Person Declaration", "US Person Declaration", "美国人士声明 / US Person Declaration")}</h4>
          <p className="text-sm text-muted-foreground">
            {t("美國人士包括美國公民、美國永久居民（綠卡持有人）、美國稅務居民或在美國註冊的實體。", "US Persons include US citizens, US permanent residents (green card holders), US tax residents, or entities registered in the US.", "美国人士包括美国公民、美国永久居民（绿卡持有人）、美国税务居民或在美国注册的实体。")}
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="isUSPerson"
              checked={formData.isUSPerson}
              onCheckedChange={(checked) => setFormData({ ...formData, isUSPerson: checked as boolean })}
            />
            <Label htmlFor="isUSPerson" className="cursor-pointer font-normal">
              {t("我確認本人是美國人士（US Person）", "I confirm that I am a US Person", "我确认本人是美国人士（US Person）")}
            </Label>
          </div>
        </Card>

        {/* 开户协议 */}
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold text-lg">{t("開戶協議 / Account Opening Agreement", "Account Opening Agreement", "开户协议 / Account Opening Agreement")}</h4>

          <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                {t("點擊閱讀開戶協議（CMF001）", "Click to read Account Opening Agreement (CMF001)", "点击阅读开户协议（CMF001）")}
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
                    {t("請仔細閱讀以上協議內容。關閉此對話框後，請勾選下方的同意選項。", "Please read the above agreement carefully. After closing this dialog, please check the agreement box below.", "请仔细阅读以上协议内容。关闭此对话框后，请勾选下方的同意选项。")}
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
                {t("我已閱讀並理解", "I have read and understood", "我已阅读并理解")}
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
              {t("我已閱讀並同意《開戶協議》的所有條款", "I have read and agree to all terms of the Account Opening Agreement", "我已阅读并同意《开户协议》的所有条款")} <span className="text-destructive">*</span>
            </Label>
          </div>
          {errors.hasReadAgreement && (
            <p className="text-sm text-destructive">{errors.hasReadAgreement}</p>
          )}

          <div style={{margin: 0, padding: 0}}>
            <p className="text-xs text-muted-foreground leading-tight" style={{margin: 0, padding: 0}}>
              {t("我確認（i）已收到、閱讀及明白本公司附上之現金賬戶協定；（ii）同意接受該現金賬戶協定所約束；及（iii）同意如客戶資料表內之詞彙表達與該現金賬戶協定有任何抵觸，該現金賬戶協定將凌駕於客戶資料表。", "I confirm that (i) I have received, read and understood the provisions of the Cash Account Agreement; (ii) agree to be bound by the Cash Account Agreement; and (iii) agree that words and expressions which are defined in the Cash Account Agreement shall have the same meanings when used in this Customer Information Form unless otherwise stated or the context otherwise requires and that in the event of any inconsistency, the provisions of the Cash Account Agreement shall override this Customer Information Form.", "我确认（i）已收到、阅读及明白本公司附上之现金账户协定；（ii）同意接受该现金账户协定所约束；及（iii）同意如客户资料表内之词汇表达与该现金账户协定有任何抵触，该现金账户协定将凌驾于客户资料表。")}
            </p>
          </div>
        </Card>

        {/* 电子签署和监管确认 */}
        <Card className="p-6 space-y-6">
          <h4 className="font-semibold text-lg">{t("電子簽署與監管確認 / E-Signature & Regulatory Confirmation", "E-Signature & Regulatory Confirmation", "电子签署与监管确认 / E-Signature & Regulatory Confirmation")}</h4>

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
                {t("我確認接受香港《電子交易條例》（ETO, Cap.553）對電子簽署的法律約束", "I confirm acceptance of the legal binding of electronic signatures under Hong Kong's Electronic Transactions Ordinance (ETO, Cap.553)", "我确认接受香港《电子交易条例》（ETO, Cap.553）对电子签署的法律约束")} <span className="text-destructive">*</span>
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
                {t("我確認接受反洗錢（AML）和其他合規監管要求的約束", "I confirm acceptance of Anti-Money Laundering (AML) and other regulatory compliance requirements", "我确认接受反洗钱（AML）和其他合规监管要求的约束")} <span className="text-destructive">*</span>
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
                {t("我已閱讀並理解上述風險評估問卷。我確認我完全理解並接受：(i) 上述風險評估過程是為了幫助我在選擇金融/投資產品前評估我對風險的態度和投資目標；(ii) 上述風險評估過程並非旨在列出所有我在投資時應考慮的因素和/或問題；(iii) 我不能僅以此風險評估作為我的投資偏好，我的決定可能會隨時間而改變，特別是在投資時；(iv) 我必須充分閱讀並理解各種文件中所披露的信息（包括但不限於金融或投資產品的招股書/解釋備忘錄/小冊子/指南/發售文件），這些文件涉及金融或投資產品的特點、風險、優點、費用和其他細節，然後再做出任何投資決定；(v) 我必須自己確信我有能力承受與不同投資產品相關的風險水平。", "I have read and understood the above risk assessment questionnaire. I confirm that I fully understand and accept: (i) the above risk assessment process is designed to help me assess my attitude towards risk and investment objectives before selecting financial/investment products; (ii) the above risk assessment process is not intended to list all factors and/or issues I should consider when investing; (iii) I cannot rely solely on this risk assessment for my investment preferences, and my decisions may change over time, particularly when investing; (iv) I must fully read and understand the information disclosed in various documents (including but not limited to prospectuses/explanatory memoranda/brochures/guides/offering documents for financial or investment products) covering the features, risks, benefits, fees and other details of financial or investment products before making any investment decision; (v) I must satisfy myself that I am able to bear the level of risk associated with different investment products.", "我已阅读并理解上述风险评估问卷。我确认我完全理解并接受：(i) 上述风险评估过程是为了帮助我在选择金融/投资产品前评估我对风险的态度和投资目标；(ii) 上述风险评估过程并非旨在列出所有我在投资时应考虑的因素和/或问题；(iii) 我不能仅以此风险评估作为我的投资偏好，我的决定可能会随时间而改变，特别是在投资时；(iv) 我必须充分阅读并理解各种文件中所披露的信息（包括但不限于金融或投资产品的招股书/解释备忘录/小册子/指南/发售文件），这些文件涉及金融或投资产品的特点、风险、优点、费用和其他细节，然后再做出任何投资决定；(v) 我必须自己确信我有能力承受与不同投资产品相关的风险水平。")} <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.acceptsRiskAssessment && (
              <p className="text-sm text-destructive">{errors.acceptsRiskAssessment}</p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptsBcanConsent"
                checked={formData.acceptsBcanConsent}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, acceptsBcanConsent: checked as boolean });
                  if (errors.acceptsBcanConsent) {
                    setErrors({ ...errors, acceptsBcanConsent: "" });
                  }
                }}
              />
              <Label htmlFor="acceptsBcanConsent" className="cursor-pointer font-normal">
                {t("我同意並授權誠港金融股份有限公司（Canton Mutual Financial Limited，CE號：BSU667）根據香港聯合交易所有限公司及香港證券及期貨事務監察委員會的投資者識別碼制度（Investor Identification Regime），為本人分配券商客戶編碼（BCAN），並將該編碼連同本人的客戶識別信息（CID）提交予香港交易所及證監會作交易實名制登記之用。本人理解此BCAN將附加於本人透過誠港金融提交的每一筆港股交易訂單中。", "I agree and authorise Canton Mutual Financial Limited (CE No.: BSU667) to assign a Broker-to-Client Assigned Number (BCAN) to me pursuant to the Investor Identification Regime of The Stock Exchange of Hong Kong Limited and the Securities and Futures Commission, and to submit such BCAN together with my Client Identification Data (CID) to HKEX and the SFC for real-name trading registration purposes. I understand that this BCAN will be tagged to every Hong Kong stock trading order submitted through Canton Mutual Financial.", "我同意并授权诚港金融股份有限公司（Canton Mutual Financial Limited，CE号：BSU667）根据香港联合交易所有限公司及香港证券及期货事务监察委员会的投资者识别码制度（Investor Identification Regime），为本人分配券商客户编码（BCAN），并将该编码连同本人的客户识别信息（CID）提交予香港交易所及证监会作交易实名制登记之用。本人理解此BCAN将附加于本人通过诚港金融提交的每一笔港股交易订单中。")} <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.acceptsBcanConsent && (
              <p className="text-sm text-destructive">{errors.acceptsBcanConsent}</p>
            )}
          </div>

          {/* 确认书 */}
          <div className="space-y-3">
            <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("點擊閱讀客戶確認 / Client Confirmation", "Click to read Client Confirmation", "点击阅读客户确认 / Client Confirmation")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    {t("客戶確認 / Client Confirmation", "Client Confirmation", "客户确认 / Client Confirmation")}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-6 text-sm leading-relaxed">
                    <div>
                      <p className="font-semibold mb-2">(A)</p>
                      <p>You represent that the information on the Customer Information Form is true, complete and correct and that the representation in the attached agreement is accurate. Canton Mutual Financial Limited is entitled to reply fully on such information and representations for all purposes, unless Canton Mutual Financial Limited receives notice in writing of any change. Canton Mutual Financial Limited is authorised at any time to contact anyone, including your banks, brokers or any credit agency for purposes of verifying the information provided on this Customer Information Form. Please refer to our Personal Information Collection Statement which is attached as schedule Ι of the Cash Account Agreement for further information.</p>
                      <p className="mt-2 text-muted-foreground">{t("你確認聲明在客戶數據表格內的數據屬真實、完整及正確，而附上的協定一切內容準確。除非誠港金融股份有限公司接到更改有關聲明內容的書面通知，誠港金融股份有限公司有權在任何用途上完全依賴這些資料及聲明。誠港金融股份有限公司有權隨時聯絡任何人，包括本人/吾等之銀行、經紀或任何信貸調查機構，以查證此客戶資料表格內所載之內容。詳情請參閱現金賬戶協定附表Ι的個人資料收集聲明。", "You represent that the information on the Customer Information Form is true, complete and correct and that the representation in the attached agreement is accurate. Canton Mutual Financial Limited is entitled to rely fully on such information and representations for all purposes, unless Canton Mutual Financial Limited receives notice in writing of any change. Canton Mutual Financial Limited is authorised at any time to contact anyone, including your banks, brokers or any credit agency for purposes of verifying the information provided on this Customer Information Form. Please refer to our Personal Information Collection Statement which is attached as Schedule Ι of the Cash Account Agreement for further information.", "你确认声明在客户数据表格内的数据属真实、完整及正确，而附上的协定一切内容准确。除非诚港金融股份有限公司接到更改有关声明内容的书面通知，诚港金融股份有限公司有权在任何用途上完全依赖这些资料及声明。诚港金融股份有限公司有权随时联络任何人，包括本人/吾等之银行、经纪或任何信贷调查机构，以查证此客户资料表格内所载之内容。详情请参阅现金账户协定附表Ι的个人资料收集声明。")}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">(B)</p>
                      <p>You declare and acknowledge that the Risk Disclosure Statements are provided in a language chosen by you (English or Chinese) and you have invited to read the Risk Disclosure Statements, to ask questions and advice to take independent advice if you wish.</p>
                      <p className="mt-2 text-muted-foreground">{t("你謹此聲明及確認，已獲提供所選擇的語言（英文或中文）的風險披露聲明。並已獲邀請閱讀該風險披露聲明，提出問題及徵求獨立意見（如有此意願）。", "You declare and acknowledge that the Risk Disclosure Statements are provided in a language chosen by you (English or Chinese) and you have been invited to read the Risk Disclosure Statements, to ask questions and to take independent advice if you wish.", "你谨此声明及确认，已获提供所选择的语言（英文或中文）的风险披露声明。并已获邀请阅读该风险披露声明，提出问题及征求独立意见（如有此意愿）。")}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">(C)</p>
                      <p>You confirm that you have received our Company's Securities Fee Schedule.</p>
                      <p className="mt-2 text-muted-foreground">{t("你確認收妥本公司之股票服務收費表。", "You confirm that you have received our Company's Securities Fee Schedule.", "你确认收妥本公司之股票服务收费表。")}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">(D)</p>
                      <p>You are aware that you shall not settle any trading transaction with third-party's cheques.</p>
                      <p className="mt-2 text-muted-foreground">{t("你確認不能以第三者支票作交收。", "You are aware that you shall not settle any trading transaction with third-party's cheques.", "你确认不能以第三者支票作交收。")}</p>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold text-center">
                      {t("請仔細閱讀以上客戶確認內容。關閉此對話框後，請勾選下方的同意選項。", "Please read the above confirmation carefully. After closing this dialog, please check the confirmation box below.", "请仔细阅读以上客户确认内容。关闭此对话框后，请勾选下方的同意选项。")}
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
                  {t("我已閱讀並理解", "I have read and understood", "我已阅读并理解")}
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
                {t("我已閱讀並同意客戶確認的所有內容", "I have read and agree to all client confirmation content", "我已阅读并同意客户确认的所有内容")} <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.hasReadConfirmation && (
              <p className="text-sm text-destructive">{errors.hasReadConfirmation}</p>
            )}

            {/* 直接促銷聲明 */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground leading-tight" style={{margin: 0, padding: 0}}>
                {t("我們擬使用你的姓名、電話號碼、電郵及地址以促銷證券相關產品/服務，但我們在未得到你的同意之前不能如此使用你的個人資料。請在本文最後簽署表示你同意使用你的個人資料。如你不同意，請在以下空格加上「✓」號，然後簽署。", "We intend to use your name, telephone number, email and address for direct marketing securities related products/services but we cannot so use your personal data without your consent. Please sign at the end of this statement to indicate your agreement to such use. Should you find such use of your personal data not acceptable, please indicate your objection before signing by ticking the box below.", "我们拟使用你的姓名、电话号码、电邮及地址以促销证券相关产品/服务，但我们在未得到你的同意之前不能如此使用你的个人资料。请在本文最后签署表示你同意使用你的个人资料。如你不同意，请在以下空格加上「✓」号，然后签署。")}
              </p>
              <div className="flex items-start space-x-2 mt-2">
                <Checkbox
                  id="objectsDirectMarketing"
                  checked={formData.objectsDirectMarketing}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, objectsDirectMarketing: checked as boolean });
                  }}
                />
                <label htmlFor="objectsDirectMarketing" className="cursor-pointer font-normal text-sm leading-normal" style={{display: 'block'}}>
                  <span style={{display: 'block'}}>{t("本人（姓名如下）", "The customer named", "本人（姓名如下）")}<span className="font-bold">{t("反對使用個人資料於擬作出的直接促銷", "objects to the proposed use of his/her personal data in direct marketing", "反对使用个人资料于拟作出的直接促销")}</span></span>
                </label>
              </div>
            </div>
          </div>

          {/* 电子签名 */}
          <div className="space-y-2">
            <Label htmlFor="signature" style={{fontSize: '16px', fontWeight: 700}}>
              {t("電子簽名 / Electronic Signature", "Electronic Signature", "电子签名 / Electronic Signature")} <span className="text-destructive">*</span>
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
              placeholder={t("請輸入您的英文姓名", "Please enter your English name", "请输入您的英文姓名")}
              className={errors.signature ? "border-destructive" : ""}
            />
            {errors.signature && <p className="text-sm text-destructive">{errors.signature}</p>}
            <p className="text-sm text-muted-foreground">
              {isCorporate ? t('需由公司的授權簽署人簽名', 'Must be signed by an authorised signatory of the company', '需由公司的授权签署人签名') : t('申請人簽名（必須與Step 2 填寫的英文名字一致）', 'Applicant signature (must match the English name entered in Step 2)', '申请人签名（必须与Step 2 填写的英文名字一致）')}
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-bold text-black" style={{margin: 0, fontSize: '16px'}}>{t("聲明條款：", "Declaration Terms:", "声明条款：")}</p>
            <p className="text-black" style={{margin: 0, fontSize: '16px', lineHeight: '1.6'}}>
              {t("本人確認已詳細閱讀、清楚了解並同意《開戶協議》的所有內容，願意接受協議條款的約束。本人的電子簽名具有與手寫簽名同等的法律效力。", "I confirm that I have carefully read, fully understood and agreed to all the contents of the Account Opening Agreement, and am willing to be bound by its terms. My electronic signature has the same legal effect as a handwritten signature.", "本人确认已详细阅读、清楚了解并同意《开户协议》的所有内容，愿意接受协议条款的约束。本人的电子签名具有与手写签名同等的法律效力。")}
            </p>
          </div>
        </Card>

        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2 mt-8">{t("賬戶第二持有人 / Second Account Holder", "Second Account Holder", "账户第二持有人 / Second Account Holder")}</h3>

            {/* PEP 声明 - Second Holder */}
            <Card className="p-6 space-y-4">
              <h4 className="font-semibold text-lg">{t("政治公眾人物聲明 / PEP Declaration", "PEP Declaration", "政治公众人物声明 / PEP Declaration")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("政治公眾人物（PEP）是指在政府、軍隊、司法機構或國有企業中擔任重要職務的人士，包括其家庭成員和密切關聯人士。", "A Politically Exposed Person (PEP) refers to an individual who holds a prominent public function in government, military, judiciary, or state-owned enterprises, including their family members and close associates.", "政治公众人物（PEP）是指在政府、军队、司法机构或国有企业中担任重要职务的人士，包括其家庭成员和密切关联人士。")}
              </p>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="second_isPEP"
                  checked={secondFormData.isPEP}
                  onCheckedChange={(checked) => setSecondFormData({ ...secondFormData, isPEP: checked as boolean })}
                />
                <Label htmlFor="second_isPEP" className="cursor-pointer font-normal">
                  {t("我確認本人是政治公眾人物（PEP）或與PEP有密切關聯", "I confirm that I am a Politically Exposed Person (PEP) or closely associated with a PEP", "我确认本人是政治公众人物（PEP）或与PEP有密切关联")}
                </Label>
              </div>
            </Card>

            {/* US Person 声明 - Second Holder */}
            <Card className="p-6 space-y-4">
              <h4 className="font-semibold text-lg">{t("美國人士聲明 / US Person Declaration", "US Person Declaration", "美国人士声明 / US Person Declaration")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("美國人士包括美國公民、美國永久居民（綠卡持有人）、美國稅務居民或在美國註冊的實體。", "US Persons include US citizens, US permanent residents (green card holders), US tax residents, or entities registered in the US.", "美国人士包括美国公民、美国永久居民（绿卡持有人）、美国税务居民或在美国注册的实体。")}
              </p>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="second_isUSPerson"
                  checked={secondFormData.isUSPerson}
                  onCheckedChange={(checked) => setSecondFormData({ ...secondFormData, isUSPerson: checked as boolean })}
                />
                <Label htmlFor="second_isUSPerson" className="cursor-pointer font-normal">
                  {t("我確認本人是美國人士（US Person）", "I confirm that I am a US Person", "我确认本人是美国人士（US Person）")}
                </Label>
              </div>
            </Card>

            {/* 开户协议 - Second Holder */}
            <Card className="p-6 space-y-4">
              <h4 className="font-semibold text-lg">{t("開戶協議 / Account Opening Agreement", "Account Opening Agreement", "开户协议 / Account Opening Agreement")}</h4>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="second_hasReadAgreement"
                  checked={secondFormData.hasReadAgreement}
                  onCheckedChange={(checked) => {
                    setSecondFormData({ ...secondFormData, hasReadAgreement: checked as boolean });
                    if (errors.secondHasReadAgreement) {
                      setErrors({ ...errors, secondHasReadAgreement: "" });
                    }
                  }}
                />
                <Label htmlFor="second_hasReadAgreement" className="cursor-pointer font-normal">
                  {t("我已閱讀並同意《開戶協議》的所有條款", "I have read and agree to all terms of the Account Opening Agreement", "我已阅读并同意《开户协议》的所有条款")} <span className="text-destructive">*</span>
                </Label>
              </div>
              {errors.secondHasReadAgreement && (
                <p className="text-sm text-destructive">{errors.secondHasReadAgreement}</p>
              )}
            </Card>

            {/* 电子签署和监管确认 - Second Holder */}
            <Card className="p-6 space-y-6">
              <h4 className="font-semibold text-lg">{t("電子簽署與監管確認 / E-Signature & Regulatory Confirmation", "E-Signature & Regulatory Confirmation", "电子签署与监管确认 / E-Signature & Regulatory Confirmation")}</h4>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="second_acceptsETO"
                    checked={secondFormData.acceptsETO}
                    onCheckedChange={(checked) => {
                      setSecondFormData({ ...secondFormData, acceptsETO: checked as boolean });
                      if (errors.secondAcceptsETO) {
                        setErrors({ ...errors, secondAcceptsETO: "" });
                      }
                    }}
                  />
                  <Label htmlFor="second_acceptsETO" className="cursor-pointer font-normal">
                    {t("我確認接受香港《電子交易條例》（ETO, Cap.553）對電子簽署的法律約束", "I confirm acceptance of the legal binding of electronic signatures under Hong Kong's Electronic Transactions Ordinance (ETO, Cap.553)", "我确认接受香港《电子交易条例》（ETO, Cap.553）对电子签署的法律约束")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                {errors.secondAcceptsETO && (
                  <p className="text-sm text-destructive">{errors.secondAcceptsETO}</p>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="second_acceptsAML"
                    checked={secondFormData.acceptsAML}
                    onCheckedChange={(checked) => {
                      setSecondFormData({ ...secondFormData, acceptsAML: checked as boolean });
                      if (errors.secondAcceptsAML) {
                        setErrors({ ...errors, secondAcceptsAML: "" });
                      }
                    }}
                  />
                  <Label htmlFor="second_acceptsAML" className="cursor-pointer font-normal">
                    {t("我確認接受反洗錢（AML）和其他合規監管要求的約束", "I confirm acceptance of Anti-Money Laundering (AML) and other regulatory compliance requirements", "我确认接受反洗钱（AML）和其他合规监管要求的约束")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                {errors.secondAcceptsAML && (
                  <p className="text-sm text-destructive">{errors.secondAcceptsAML}</p>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="second_acceptsRiskAssessment"
                    checked={secondFormData.acceptsRiskAssessment}
                    onCheckedChange={(checked) => {
                      setSecondFormData({ ...secondFormData, acceptsRiskAssessment: checked as boolean });
                      if (errors.secondAcceptsRiskAssessment) {
                        setErrors({ ...errors, secondAcceptsRiskAssessment: "" });
                      }
                    }}
                  />
                  <Label htmlFor="second_acceptsRiskAssessment" className="cursor-pointer font-normal">
                    {t("我已閱讀並理解上述風險評估問卷。我確認我完全理解並接受相關條款。", "I have read and understood the above risk assessment questionnaire. I confirm that I fully understand and accept the relevant terms.", "我已阅读并理解上述风险评估问卷。我确认我完全理解并接受相关条款。")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                {errors.secondAcceptsRiskAssessment && (
                  <p className="text-sm text-destructive">{errors.secondAcceptsRiskAssessment}</p>
                )}
              </div>

              {/* 确认书 - Second Holder */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="second_hasReadConfirmation"
                    checked={secondFormData.hasReadConfirmation}
                    onCheckedChange={(checked) => {
                      setSecondFormData({ ...secondFormData, hasReadConfirmation: checked as boolean });
                      if (errors.secondHasReadConfirmation) {
                        setErrors({ ...errors, secondHasReadConfirmation: "" });
                      }
                    }}
                  />
                  <Label htmlFor="second_hasReadConfirmation" className="cursor-pointer font-normal">
                    {t("我已閱讀並同意客戶確認的所有內容", "I have read and agree to all client confirmation content", "我已阅读并同意客户确认的所有内容")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                {errors.secondHasReadConfirmation && (
                  <p className="text-sm text-destructive">{errors.secondHasReadConfirmation}</p>
                )}

                {/* 直接促銷聲明 - Second Holder */}
                <div className="mt-6">
                  <div className="flex items-start space-x-2 mt-2">
                    <Checkbox
                      id="second_objectsDirectMarketing"
                      checked={secondFormData.objectsDirectMarketing}
                      onCheckedChange={(checked) => {
                        setSecondFormData({ ...secondFormData, objectsDirectMarketing: checked as boolean });
                      }}
                    />
                    <label htmlFor="second_objectsDirectMarketing" className="cursor-pointer font-normal text-sm leading-normal" style={{display: 'block'}}>
                      <span style={{display: 'block'}}>{t("本人（姓名如下）", "The customer named", "本人（姓名如下）")}<span className="font-bold">{t("反對使用個人資料於擬作出的直接促銷", "objects to the proposed use of his/her personal data in direct marketing", "反对使用个人资料于拟作出的直接促销")}</span></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 电子签名 - Second Holder */}
              <div className="space-y-2">
                <Label htmlFor="second_signature" style={{fontSize: '16px', fontWeight: 700}}>
                  {t("電子簽名 / Electronic Signature", "Electronic Signature", "电子签名 / Electronic Signature")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="second_signature"
                  value={secondFormData.signature}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[A-Za-z\s''\-,.]+$/.test(val)) {
                      setSecondFormData({ ...secondFormData, signature: val });
                      if (errors.secondSignature) {
                        setErrors({ ...errors, secondSignature: "" });
                      }
                    }
                  }}
                  placeholder={t("請輸入您的英文姓名", "Please enter your English name", "请输入您的英文姓名")}
                  className={errors.secondSignature ? "border-destructive" : ""}
                />
                {errors.secondSignature && <p className="text-sm text-destructive">{errors.secondSignature}</p>}
                <p className="text-sm text-muted-foreground">
                  {t("第二持有人簽名（必須與第二持有人的英文名字一致）", "Second holder signature (must match the second holder's English name)", "第二持有人签名（必须与第二持有人的英文名字一致）")}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-bold text-black" style={{margin: 0, fontSize: '16px'}}>{t("聲明條款：", "Declaration Terms:", "声明条款：")}</p>
                <p className="text-black" style={{margin: 0, fontSize: '16px', lineHeight: '1.6'}}>
                  {t("本人確認已詳細閱讀、清楚了解並同意《開戶協議》的所有內容，願意接受協議條款的約束。本人的電子簽名具有與手寫簽名同等的法律效力。", "I confirm that I have carefully read, fully understood and agreed to all the contents of the Account Opening Agreement, and am willing to be bound by its terms. My electronic signature has the same legal effect as a handwritten signature.", "本人确认已详细阅读、清楚了解并同意《开户协议》的所有内容，愿意接受协议条款的约束。本人的电子签名具有与手写签名同等的法律效力。")}
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </ApplicationWizard>
  );
}
