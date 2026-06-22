import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertToTraditional } from "@/lib/converter";
import { industryOptions } from "@/lib/industryOptions";
import { useLang } from '@/lib/i18n';

const industries = industryOptions;

export default function OccupationInfo() {
  const { t } = useLang();

  const employmentStatuses = [
    { value: "employed", label: t('受僱 / Employed', 'Employed', '受雇 / Employed') },
    { value: "self_employed", label: t('自僱 / Self-Employed', 'Self-Employed', '自雇 / Self-Employed') },
    { value: "retired", label: t('退休人士 / Retired', 'Retired', '退休人士 / Retired') },
    { value: "student", label: t('學生 / Student', 'Student', '学生 / Student') },
    { value: "housewife", label: t('家庭主婦 / Housewife', 'Housewife', '家庭主妇 / Housewife') },
    { value: "others", label: t('其他 / Others', 'Others', '其他 / Others') },
  ];

  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "5");
  const showReturnToPreview = useReturnToPreview();

  const [formData, setFormData] = useState({
    employmentStatus: "" as "employed" | "self_employed" | "retired" | "student" | "housewife" | "others" | "",
    companyName: "",
    position: "",
    yearsOfService: "",
    industry: "",
    companyAddress: "",
    officePhone: "",
    officeFaxNo: "", // 辦公傳真（可選）
    mobilePhone: "",
    correspondenceAddress: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 獲取客戶類型用於區分機構/個人
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isCorporate = accountSelection?.customerType === 'corporate';
  const isJoint = accountSelection?.customerType === 'joint';

  const [secondFormData, setSecondFormData] = useState({
    employmentStatus: "" as "employed" | "self_employed" | "retired" | "student" | "housewife" | "others" | "",
    companyName: "",
    position: "",
    yearsOfService: "",
    industry: "",
    companyAddress: "",
    officePhone: "",
    officeFaxNo: "",
    mobilePhone: "",
    correspondenceAddress: "",
  });
  const secondNeedsEmploymentDetails = secondFormData.employmentStatus === "employed" || secondFormData.employmentStatus === "self_employed" || secondFormData.employmentStatus === "others";
  const secondNeedsContactInfo = secondFormData.employmentStatus === "retired" || secondFormData.employmentStatus === "student" || secondFormData.employmentStatus === "housewife" || secondFormData.employmentStatus === "others";

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'occupation' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      setSecondFormData(prev => ({ ...prev, ...(existingSecondHolder as any) }));
    }
  }, [existingSecondHolder]);

  const { data: existingData, isLoading: isLoadingData } = trpc.occupation.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.occupation.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.occupation.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        ...existingData,
        companyName: existingData.companyName || "",
        position: existingData.position || "",
        yearsOfService: existingData.yearsOfService?.toString() || "",
        industry: existingData.industry || "",
        companyAddress: existingData.companyAddress || "",
        officePhone: existingData.officePhone || "",
        officeFaxNo: existingData.officeFaxNo || "",
        mobilePhone: existingData.mobilePhone || "",
        correspondenceAddress: existingData.correspondenceAddress || "",
      });
    }
  }, [existingData]);

  const needsEmploymentDetails = formData.employmentStatus === "employed" || formData.employmentStatus === "self_employed" || formData.employmentStatus === "others";
  const needsContactInfo = formData.employmentStatus === "retired" || formData.employmentStatus === "student" || formData.employmentStatus === "housewife" || formData.employmentStatus === "others";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employmentStatus) {
      newErrors.employmentStatus = t('請選擇就業狀況', 'Please select employment status', '请选择就业状况');
    }

    if (needsEmploymentDetails) {
      const noSpecialChars = /^[A-Za-z0-9\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\s\-\(\)\/\.&]+$/;

      if (!formData.companyName?.trim()) {
        newErrors.companyName = t('請輸入公司名稱', 'Please enter company name', '请输入公司名称');
      } else if (!noSpecialChars.test(formData.companyName)) {
        newErrors.companyName = t('公司名稱不能包含特殊字符', 'Company name cannot contain special characters', '公司名称不能包含特殊字符');
      }

      if (!formData.position?.trim()) {
        newErrors.position = t('請輸入職務名稱', 'Please enter position', '请输入职务名称');
      } else if (!noSpecialChars.test(formData.position)) {
        newErrors.position = t('職務名稱不能包含特殊字符', 'Position cannot contain special characters', '职务名称不能包含特殊字符');
      }

      const years = parseInt(formData.yearsOfService);
      if (!formData.yearsOfService || isNaN(years) || years <= 0) {
        newErrors.yearsOfService = t('請輸入有效的從業年限', 'Please enter valid years of service', '请输入有效的从业年限');
      }
      if (!formData.industry) newErrors.industry = t('請選擇行業', 'Please select industry', '请选择行业');
      if (!formData.companyAddress?.trim()) newErrors.companyAddress = t('請輸入公司地址', 'Please enter company address', '请输入公司地址');

      // Office phone / fax: digits only (optional)
      if (formData.officePhone?.trim() && !/^\d+$/.test(formData.officePhone.trim())) {
        newErrors.officePhone = t('辦公電話只能使用阿拉伯數字', 'Office phone must contain only digits', '办公电话只能使用阿拉伯数字');
      }
      if (formData.officeFaxNo?.trim() && !/^\d+$/.test(formData.officeFaxNo.trim())) {
        newErrors.officeFaxNo = t('辦公傳真號只能使用阿拉伯數字', 'Office fax must contain only digits', '办公传真号只能使用阿拉伯数字');
      }
    }

    // 退休/學生/家庭婦女/其他：需要聯繫方式
    if (needsContactInfo) {
      if (!formData.mobilePhone?.trim()) {
        newErrors.mobilePhone = t('請輸入手提電話', 'Please enter mobile phone number', '请输入手提电话');
      } else if (!/^\d+$/.test(formData.mobilePhone.trim())) {
        newErrors.mobilePhone = t('手提電話只能使用阿拉伯數字', 'Mobile phone must contain only digits', '手提电话只能使用阿拉伯数字');
      }
      if (!formData.correspondenceAddress?.trim()) {
        newErrors.correspondenceAddress = t('請輸入通訊地址', 'Please enter correspondence address', '请输入通讯地址');
      }
    }

    // 其他：需要填寫說明
    if (formData.employmentStatus === "others") {
      if (!formData.companyName?.trim()) {
        newErrors.companyName = t('請註明就業情況', 'Please specify employment status', '请注明就业情况');
      }
    }

    // 聯名賬戶：驗證第二持有人
    if (isJoint) {
      if (!secondFormData.employmentStatus) {
        newErrors.secondEmploymentStatus = t('請填寫第二持有人的就業狀況', 'Please fill in second holder employment status', '请填写第二持有人的就业状况');
      }
      if (secondNeedsEmploymentDetails) {
        if (!secondFormData.companyName?.trim()) newErrors.secondCompanyName = t('請填寫第二持有人的公司名稱', 'Please fill in second holder company name', '请填写第二持有人的公司名称');
        if (!secondFormData.position?.trim()) newErrors.secondPosition = t('請填寫第二持有人的職務名稱', 'Please fill in second holder position', '请填写第二持有人的职务名称');
        const years2 = parseInt(secondFormData.yearsOfService);
        if (!secondFormData.yearsOfService || isNaN(years2) || years2 <= 0) newErrors.secondYearsOfService = t('請填寫第二持有人的從業年限', 'Please fill in second holder years of service', '请填写第二持有人的从业年限');
        if (!secondFormData.industry) newErrors.secondIndustry = t('請填寫第二持有人的行業', 'Please fill in second holder industry', '请填写第二持有人的行业');
        if (!secondFormData.companyAddress?.trim()) newErrors.secondCompanyAddress = t('請填寫第二持有人的公司地址', 'Please fill in second holder company address', '请填写第二持有人的公司地址');
      }
      if (secondNeedsContactInfo) {
        if (!secondFormData.mobilePhone?.trim()) newErrors.secondMobilePhone = t('請填寫第二持有人的手提電話', 'Please fill in second holder mobile phone', '请填写第二持有人的手提电话');
        if (!secondFormData.correspondenceAddress?.trim()) newErrors.secondCorrespondenceAddress = t('請填寫第二持有人的通訊地址', 'Please fill in second holder correspondence address', '请填写第二持有人的通讯地址');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSave = () => {
    if (!validateForm()) {
      toast.error(t('請檢查表單中的錯誤', 'Please check errors in the form', '请检查表单中的错误'));
      return;
    }

    saveOnlyMutation.mutate({
      applicationId,
      employmentStatus: formData.employmentStatus as "employed" | "self_employed" | "retired" | "student" | "housewife" | "others",
      companyName: formData.companyName,
      position: formData.position,
      yearsOfService: formData.yearsOfService ? parseInt(formData.yearsOfService) : undefined,
      industry: formData.industry,
      companyAddress: formData.companyAddress,
      officePhone: formData.officePhone,
      officeFaxNo: formData.officeFaxNo,
      mobilePhone: needsContactInfo ? formData.mobilePhone : undefined,
      correspondenceAddress: needsContactInfo ? formData.correspondenceAddress : undefined,
    });
    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'occupation', data: secondFormData });
    }
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error(t('請檢查表單中的錯誤', 'Please check errors in the form', '请检查表单中的错误'));
      return;
    }

    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'occupation', data: secondFormData });
    }
    saveMutation.mutate({
      applicationId,
      employmentStatus: formData.employmentStatus as any,
      companyName: needsEmploymentDetails ? formData.companyName : undefined,
      position: needsEmploymentDetails ? formData.position : undefined,
      yearsOfService: needsEmploymentDetails ? parseInt(formData.yearsOfService) : undefined,
      industry: needsEmploymentDetails ? formData.industry : undefined,
      companyAddress: needsEmploymentDetails ? formData.companyAddress : undefined,
      officePhone: needsEmploymentDetails ? formData.officePhone : undefined,
      officeFaxNo: needsEmploymentDetails ? formData.officeFaxNo : undefined,
      mobilePhone: needsContactInfo ? formData.mobilePhone : undefined,
      correspondenceAddress: needsContactInfo ? formData.correspondenceAddress : undefined,
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
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        {/* 機構開戶：關聯人士提示 */}
        {isCorporate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {t('請填寫關聯人士信息。關聯人士包括董事、授權簽署人、最終受益人等。', 'Please fill in related person information. Related persons include directors, authorized signatories, ultimate beneficial owners, etc.', '请填写关联人士信息。关联人士包括董事、授权签署人、最终受益人等。')}<br/>
              <span className="text-blue-600">{t('如需添加多位關聯人士，請點擊下方「添加其他關聯人士」按鈕。', 'To add more related persons, click the "Add Other Related Person" button below.', '如需添加多位关联人士，请点击下方「添加其他关联人士」按钮。')}</span>
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => toast.info(t('添加關聯人士功能即將上線', 'Add related person feature coming soon', '添加关联人士功能即将上线'))}
            >
              {t('+ 添加其他關聯人士', '+ Add Other Related Person', '+ 添加其他关联人士')}
            </Button>
          </div>
        )}

        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">{t('賬戶主要持有人 / Primary Account Holder', 'Primary Account Holder', '账户主要持有人 / Primary Account Holder')}</h3>
        )}

        {/* 就業狀況 */}
        <div className="space-y-2">
          <Label htmlFor="employmentStatus">
            {t('就業狀況 / Employment Status', 'Employment Status', '就业状况 / Employment Status')} <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.employmentStatus} 
            onValueChange={(v) => {
              setFormData({ ...formData, employmentStatus: v as any });
              if (errors.employmentStatus) setErrors({ ...errors, employmentStatus: "" });
            }}
          >
            <SelectTrigger className={errors.employmentStatus ? "border-destructive" : ""}>
              <SelectValue placeholder={t('請選擇就業狀況', 'Select employment status', '请选择就业状况')} />
            </SelectTrigger>
            <SelectContent>
              {employmentStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employmentStatus && <p className="text-sm text-destructive">{errors.employmentStatus}</p>}
        </div>

        {/* 受僱/自僱詳情 */}
        {needsEmploymentDetails && (
          <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-lg">
              {formData.employmentStatus === "employed" ? t('僱傭詳情 / Employment Details', 'Employment Details', '雇佣详情 / Employment Details') : t('自僱詳情 / Self-Employment Details', 'Self-Employment Details', '自雇详情 / Self-Employment Details')}
            </h4>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 公司名稱 */}
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  {formData.employmentStatus === "employed" ? t('公司名稱 / Company Name', 'Company Name', '公司名称 / Company Name') : t('業務名稱 / Business Name', 'Business Name', '业务名称 / Business Name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    setFormData({ ...formData, companyName: e.target.value });
                    if (errors.companyName) setErrors({ ...errors, companyName: "" });
                  }}
                  onBlur={(e) => {
                    const converted = convertToTraditional(e.target.value);
                    if (converted !== e.target.value) {
                      setFormData({ ...formData, companyName: converted });
                    }
                  }}
                  placeholder={t('請輸入名稱', 'Enter name', '请输入名称')}
                  className={errors.companyName ? "border-destructive" : ""}
                />
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
              </div>

              {/* 職務名稱 */}
              <div className="space-y-2">
                <Label htmlFor="position">
                  {t('職務名稱 / Position', 'Position', '职务名称 / Position')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => {
                    setFormData({ ...formData, position: e.target.value });
                    if (errors.position) setErrors({ ...errors, position: "" });
                  }}
                  onBlur={(e) => {
                    const converted = convertToTraditional(e.target.value);
                    if (converted !== e.target.value) {
                      setFormData({ ...formData, position: converted });
                    }
                  }}
                  placeholder={t('請輸入職務', 'Enter position', '请输入职务')}
                  className={errors.position ? "border-destructive" : ""}
                />
                {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 從業年限 */}
              <div className="space-y-2">
                <Label htmlFor="yearsOfService">
                  {t('從業年限 / Years of Service', 'Years of Service', '从业年限 / Years of Service')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.yearsOfService}
                  onChange={(e) => {
                    setFormData({ ...formData, yearsOfService: e.target.value });
                    if (errors.yearsOfService) setErrors({ ...errors, yearsOfService: "" });
                  }}
                  placeholder={t('請輸入年限（例如：5）', 'Enter years (e.g. 5)', '请输入年限（例如：5）')}
                  className={errors.yearsOfService ? "border-destructive" : ""}
                />
                {errors.yearsOfService && <p className="text-sm text-destructive">{errors.yearsOfService}</p>}
              </div>

              {/* 行業 */}
              <div className="space-y-2">
                <Label htmlFor="industry">
                  {t('行業 / Industry', 'Industry', '行业 / Industry')} <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.industry} 
                  onValueChange={(v) => {
                    setFormData({ ...formData, industry: v });
                    if (errors.industry) setErrors({ ...errors, industry: "" });
                  }}
                >
                  <SelectTrigger className={errors.industry ? "border-destructive" : ""}>
                    <SelectValue placeholder={t('請選擇行業', 'Select industry', '请选择行业')} />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && <p className="text-sm text-destructive">{errors.industry}</p>}
              </div>
            </div>

            {/* 公司地址 */}
            <div className="space-y-2">
              <Label htmlFor="companyAddress">
                {formData.employmentStatus === "employed" ? t('公司地址 / Company Address', 'Company Address', '公司地址 / Company Address') : t('業務地址 / Business Address', 'Business Address', '业务地址 / Business Address')} <span className="text-destructive">*</span>
              </Label>
                <Textarea
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, companyAddress: e.target.value });
                    if (errors.companyAddress) setErrors({ ...errors, companyAddress: "" });
                  }}
                  onBlur={(e) => {
                    const converted = convertToTraditional(e.target.value);
                    if (converted !== e.target.value) {
                      setFormData({ ...formData, companyAddress: converted });
                    }
                  }}
                  placeholder={t('請輸入地址', 'Enter address', '请输入地址')}
                  rows={3}
                  className={errors.companyAddress ? "border-destructive" : ""}
                />
              {errors.companyAddress && <p className="text-sm text-destructive">{errors.companyAddress}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 辦公電話 */}
              <div className="space-y-2">
                <Label htmlFor="officePhone">
                  {t('辦公電話 / Office Phone (可選)', 'Office Phone (Optional)', '办公电话 / Office Phone (可选)')}
                </Label>
                <Input
                  id="officePhone"
                  value={formData.officePhone}
                  onChange={(e) => setFormData({ ...formData, officePhone: e.target.value.replace(/\D/g, "") })}
                  placeholder={t('請輸入辦公電話', 'Enter office phone', '请输入办公电话')}
                  className={errors.officePhone ? "border-destructive" : ""}
                />
                {errors.officePhone && <p className="text-sm text-destructive">{errors.officePhone}</p>}
              </div>

              {/* 辦公傳真 */}
              <div className="space-y-2">
                <Label htmlFor="officeFaxNo">
                  {t('辦公傳真號 / Office Fax No. (可選)', 'Office Fax No. (Optional)', '办公传真号 / Office Fax No. (可选)')}
                </Label>
                <Input
                  id="officeFaxNo"
                  value={formData.officeFaxNo}
                  onChange={(e) => setFormData({ ...formData, officeFaxNo: e.target.value.replace(/\D/g, "") })}
                  placeholder={t('請輸入辦公傳真號', 'Enter office fax number', '请输入办公传真号')}
                  className={errors.officeFaxNo ? "border-destructive" : ""}
                />
                {errors.officeFaxNo && <p className="text-sm text-destructive">{errors.officeFaxNo}</p>}
              </div>
            </div>
          </div>
        )}

        {(formData.employmentStatus === "student" || formData.employmentStatus === "retired" || formData.employmentStatus === "housewife" || formData.employmentStatus === "others") && (
          <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-lg">{t('聯繫方式 / Contact Information', 'Contact Information', '联系方式 / Contact Information')}</h4>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 手提電話 */}
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">
                  {t('手提電話 / Mobile Phone No.', 'Mobile Phone No.', '手提电话 / Mobile Phone No.')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobilePhone"
                  value={formData.mobilePhone}
                  onChange={(e) => {
                    setFormData({ ...formData, mobilePhone: e.target.value.replace(/\D/g, "") });
                    if (errors.mobilePhone) setErrors({ ...errors, mobilePhone: "" });
                  }}
                  placeholder={t('請輸入手提電話', 'Enter mobile phone', '请输入手提电话')}
                  className={errors.mobilePhone ? "border-destructive" : ""}
                />
                {errors.mobilePhone && <p className="text-sm text-destructive">{errors.mobilePhone}</p>}
              </div>
            </div>

            {/* 通訊地址 */}
            <div className="space-y-2">
              <Label htmlFor="correspondenceAddress">
                {t('通訊地址 / Correspondence Address', 'Correspondence Address', '通讯地址 / Correspondence Address')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="correspondenceAddress"
                value={formData.correspondenceAddress}
                onChange={(e) => {
                  setFormData({ ...formData, correspondenceAddress: e.target.value });
                  if (errors.correspondenceAddress) setErrors({ ...errors, correspondenceAddress: "" });
                }}
                onBlur={(e) => {
                  const converted = convertToTraditional(e.target.value);
                  if (converted !== e.target.value) {
                    setFormData({ ...formData, correspondenceAddress: converted });
                  }
                }}
                placeholder={t('請輸入通訊地址', 'Enter correspondence address', '请输入通讯地址')}
                rows={3}
                className={errors.correspondenceAddress ? "border-destructive" : ""}
              />
              {errors.correspondenceAddress && <p className="text-sm text-destructive">{errors.correspondenceAddress}</p>}
            </div>
          </div>
        )}
        {/* 第二持有人 */}
        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2 mt-8">{t('賬戶第二持有人 / Second Account Holder', 'Second Account Holder', '账户第二持有人 / Second Account Holder')}</h3>

            <div className="space-y-2">
              <Label>{t('就業狀況 / Employment Status', 'Employment Status', '就业状况 / Employment Status')} <span className="text-destructive">*</span></Label>
              <Select value={secondFormData.employmentStatus} onValueChange={(v) => {
                setSecondFormData({ ...secondFormData, employmentStatus: v as any });
                if (errors.secondEmploymentStatus) setErrors({ ...errors, secondEmploymentStatus: "" });
              }}>
                <SelectTrigger className={errors.secondEmploymentStatus ? "border-destructive" : ""}><SelectValue placeholder={t('請選擇就業狀況', 'Select employment status', '请选择就业状况')} /></SelectTrigger>
                <SelectContent>
                  {employmentStatuses.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
              {errors.secondEmploymentStatus && <p className="text-sm text-destructive">{errors.secondEmploymentStatus}</p>}
            </div>

            {secondNeedsEmploymentDetails && (
              <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-lg">
                  {secondFormData.employmentStatus === "employed" ? t('僱傭詳情 / Employment Details', 'Employment Details', '雇佣详情 / Employment Details') : t('自僱詳情 / Self-Employment Details', 'Self-Employment Details', '自雇详情 / Self-Employment Details')}
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{secondFormData.employmentStatus === "employed" ? t('公司名稱 / Company Name', 'Company Name', '公司名称 / Company Name') : t('業務名稱 / Business Name', 'Business Name', '业务名称 / Business Name')} <span className="text-destructive">*</span></Label>
                    <Input value={secondFormData.companyName} onChange={(e) => {
                      setSecondFormData({ ...secondFormData, companyName: e.target.value });
                      if (errors.secondCompanyName) setErrors({ ...errors, secondCompanyName: "" });
                    }} placeholder={t('請輸入名稱', 'Enter name', '请输入名称')} className={errors.secondCompanyName ? "border-destructive" : ""} />
                    {errors.secondCompanyName && <p className="text-sm text-destructive">{errors.secondCompanyName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('職務名稱 / Position', 'Position', '职务名称 / Position')} <span className="text-destructive">*</span></Label>
                    <Input value={secondFormData.position} onChange={(e) => {
                      setSecondFormData({ ...secondFormData, position: e.target.value });
                      if (errors.secondPosition) setErrors({ ...errors, secondPosition: "" });
                    }} placeholder={t('請輸入職務', 'Enter position', '请输入职务')} className={errors.secondPosition ? "border-destructive" : ""} />
                    {errors.secondPosition && <p className="text-sm text-destructive">{errors.secondPosition}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('從業年限 / Years of Service', 'Years of Service', '从业年限 / Years of Service')} <span className="text-destructive">*</span></Label>
                    <Input type="text" value={secondFormData.yearsOfService} onChange={(e) => {
                      setSecondFormData({ ...secondFormData, yearsOfService: e.target.value });
                      if (errors.secondYearsOfService) setErrors({ ...errors, secondYearsOfService: "" });
                    }} placeholder={t('請輸入年限', 'Enter years', '请输入年限')} className={errors.secondYearsOfService ? "border-destructive" : ""} />
                    {errors.secondYearsOfService && <p className="text-sm text-destructive">{errors.secondYearsOfService}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('行業 / Industry', 'Industry', '行业 / Industry')} <span className="text-destructive">*</span></Label>
                    <Select value={secondFormData.industry} onValueChange={(v) => {
                      setSecondFormData({ ...secondFormData, industry: v });
                      if (errors.secondIndustry) setErrors({ ...errors, secondIndustry: "" });
                    }}>
                      <SelectTrigger className={errors.secondIndustry ? "border-destructive" : ""}><SelectValue placeholder={t('請選擇行業', 'Select industry', '请选择行业')} /></SelectTrigger>
                      <SelectContent>
                        {industries.map((ind) => (<SelectItem key={ind} value={ind}>{ind}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {errors.secondIndustry && <p className="text-sm text-destructive">{errors.secondIndustry}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{secondFormData.employmentStatus === "employed" ? t('公司地址 / Company Address', 'Company Address', '公司地址 / Company Address') : t('業務地址 / Business Address', 'Business Address', '业务地址 / Business Address')} <span className="text-destructive">*</span></Label>
                  <Textarea value={secondFormData.companyAddress} onChange={(e) => {
                    setSecondFormData({ ...secondFormData, companyAddress: e.target.value });
                    if (errors.secondCompanyAddress) setErrors({ ...errors, secondCompanyAddress: "" });
                  }} placeholder={t('請輸入地址', 'Enter address', '请输入地址')} rows={3} className={errors.secondCompanyAddress ? "border-destructive" : ""} />
                  {errors.secondCompanyAddress && <p className="text-sm text-destructive">{errors.secondCompanyAddress}</p>}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('辦公電話 / Office Phone (可選)', 'Office Phone (Optional)', '办公电话 / Office Phone (可选)')}</Label>
                    <Input value={secondFormData.officePhone} onChange={(e) => setSecondFormData({ ...secondFormData, officePhone: e.target.value.replace(/\D/g, "") })} placeholder={t('請輸入辦公電話', 'Enter office phone', '请输入办公电话')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('辦公傳真號 / Office Fax No. (可選)', 'Office Fax No. (Optional)', '办公传真号 / Office Fax No. (可选)')}</Label>
                    <Input value={secondFormData.officeFaxNo} onChange={(e) => setSecondFormData({ ...secondFormData, officeFaxNo: e.target.value.replace(/\D/g, "") })} placeholder={t('請輸入辦公傳真號', 'Enter office fax number', '请输入办公传真号')} />
                  </div>
                </div>
              </div>
            )}

            {secondNeedsContactInfo && (
              <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-lg">{t('聯繫方式 / Contact Information', 'Contact Information', '联系方式 / Contact Information')}</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('手提電話 / Mobile Phone No.', 'Mobile Phone No.', '手提电话 / Mobile Phone No.')} <span className="text-destructive">*</span></Label>
                    <Input value={secondFormData.mobilePhone} onChange={(e) => {
                      setSecondFormData({ ...secondFormData, mobilePhone: e.target.value.replace(/\D/g, "") });
                      if (errors.secondMobilePhone) setErrors({ ...errors, secondMobilePhone: "" });
                    }} placeholder={t('請輸入手提電話', 'Enter mobile phone', '请输入手提电话')} className={errors.secondMobilePhone ? "border-destructive" : ""} />
                    {errors.secondMobilePhone && <p className="text-sm text-destructive">{errors.secondMobilePhone}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('通訊地址 / Correspondence Address', 'Correspondence Address', '通讯地址 / Correspondence Address')} <span className="text-destructive">*</span></Label>
                  <Textarea value={secondFormData.correspondenceAddress} onChange={(e) => {
                    setSecondFormData({ ...secondFormData, correspondenceAddress: e.target.value });
                    if (errors.secondCorrespondenceAddress) setErrors({ ...errors, secondCorrespondenceAddress: "" });
                  }} placeholder={t('請輸入通訊地址', 'Enter correspondence address', '请输入通讯地址')} rows={3} className={errors.secondCorrespondenceAddress ? "border-destructive" : ""} />
                  {errors.secondCorrespondenceAddress && <p className="text-sm text-destructive">{errors.secondCorrespondenceAddress}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ApplicationWizard>
  );
}
