import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToTraditional } from "@/lib/converter";
import { validateChineseName, validateEnglishName, validateAge } from "@/lib/validators";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import { useLang } from '@/lib/i18n';

const countries = [
  "中国", "香港", "澳门", "台湾", "美国", "加拿大", "英国", "澳大利亚", "新加坡", "日本", "韩国", "other"
];

type HolderInfo = {
  chineseName: string;
  englishName: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  otherNationality: string;
};

const emptyHolder: HolderInfo = {
  chineseName: "", englishName: "", gender: "male", dateOfBirth: "", placeOfBirth: "", nationality: "", otherNationality: "",
};

export default function PersonalBasicInfo() {
  const { t } = useLang();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  // Check if joint account
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isJoint = accountSelection?.customerType === 'joint';

  const [formData, setFormData] = useState({
    chineseName: "",
    englishName: "",
    gender: "male" as "male" | "female" | "other",
    dateOfBirth: "",
    placeOfBirth: "",
    nationality: "",
    otherNationality: "",
  });

  // Joint account: second holder and additional holders
  const [secondHolder, setSecondHolder] = useState<HolderInfo>({ ...emptyHolder });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading: isLoadingData } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'personalBasic' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      setSecondHolder(prev => ({ ...prev, ...(existingSecondHolder as any) }));
    }
  }, [existingSecondHolder]);

  const saveMutation = trpc.personalBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
        setLocation(`/application/${applicationId}/step/3`);
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.personalBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success(t('保存成功', 'Saved successfully', '保存成功'));
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed', '保存失败')}: ${error.message}`);
    },
  });

  // 自动保存功能（仅在有数据时启用）
  const autoSaveMutation = trpc.personalBasic.save.useMutation({
    onSuccess: () => {
      // 自动保存成功不显示提示，避免干扰用户
    },
    onError: (error) => {
      console.error('自动保存失败:', error);
    },
  });

  const { isSaving, lastSavedAt } = useAutoSave({
    onSave: async () => {
      // 只有当表单有数据时才自动保存
      if (formData.chineseName || formData.englishName) {
        const nationality = formData.nationality === "other" 
          ? formData.otherNationality 
          : formData.nationality;

        await autoSaveMutation.mutateAsync({
          applicationId,
          chineseName: formData.chineseName,
          englishName: formData.englishName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          placeOfBirth: formData.placeOfBirth,
          nationality,
        });
      }
    },
    interval: 30000, // 30秒
    enabled: !!applicationId && !saveMutation.isPending, // 只在有applicationId且不在保存中时启用
  });

  useEffect(() => {
    if (existingData) {
      const nationality = existingData.nationality;
      if (countries.includes(nationality)) {
        setFormData({
          ...existingData,
          otherNationality: "",
        });
      } else {
        setFormData({
          ...existingData,
          nationality: "other",
          otherNationality: nationality,
        });
      }
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 使用validators.ts中的中文姓名校验
    const chineseNameResult = validateChineseName(formData.chineseName);
    if (!chineseNameResult.valid) {
      newErrors.chineseName = chineseNameResult.message || t('中文姓名格式不正確', 'Invalid Chinese name format', '中文姓名格式不正确');
    }

    // 使用validators.ts中的英文姓名校验
    const englishNameResult = validateEnglishName(formData.englishName);
    if (!englishNameResult.valid) {
      newErrors.englishName = englishNameResult.message || t('英文姓名格式不正確', 'Invalid English name format', '英文姓名格式不正确');
    }

    // 使用validators.ts中的年龄校验
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('請選擇出生日期', 'Please select date of birth', '请选择出生日期');
    } else {
      const ageResult = validateAge(formData.dateOfBirth);
      if (!ageResult.valid) {
        newErrors.dateOfBirth = ageResult.message || t('年齡必須滿18周歲', 'Must be at least 18 years old', '年龄必须满18周岁');
      }
    }

    // 出生地校验
    if (!formData.placeOfBirth.trim()) {
      newErrors.placeOfBirth = t('請輸入出生地', 'Please enter place of birth', '请输入出生地');
    }

    // 国籍校验
    if (!formData.nationality) {
      newErrors.nationality = t('請選擇國籍', 'Please select nationality', '请选择国籍');
    } else if (formData.nationality === "other" && !formData.otherNationality.trim()) {
      newErrors.otherNationality = t('請輸入具體國籍', 'Please enter specific nationality', '请输入具体国籍');
    }

    // 聯名賬戶：驗證第二持有人
    if (isJoint) {
      if (!secondHolder.chineseName.trim()) newErrors.secondChineseName = t('請輸入第二持有人中文姓名', 'Please enter second holder Chinese name', '请输入第二持有人中文姓名');
      if (!secondHolder.englishName.trim()) newErrors.secondEnglishName = t('請輸入第二持有人英文姓名', 'Please enter second holder English name', '请输入第二持有人英文姓名');
      if (!secondHolder.dateOfBirth) {
        newErrors.secondDateOfBirth = t('請選擇第二持有人出生日期', 'Please select second holder date of birth', '请选择第二持有人出生日期');
      } else {
        const ageResult = validateAge(secondHolder.dateOfBirth);
        if (!ageResult.valid) newErrors.secondDateOfBirth = ageResult.message || t('第二持有人年齡必須滿18周歲', 'Second holder must be at least 18 years old', '第二持有人年龄必须满18周岁');
      }
      if (!secondHolder.placeOfBirth.trim()) newErrors.secondPlaceOfBirth = t('請輸入第二持有人出生地', 'Please enter second holder place of birth', '请输入第二持有人出生地');
      if (!secondHolder.nationality) newErrors.secondNationality = t('請選擇第二持有人國籍', 'Please select second holder nationality', '请选择第二持有人国籍');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error(t('請檢查表單中的錯誤', 'Please check the errors in the form', '请检查表单中的错误'));
      return;
    }

    const nationality = formData.nationality === "other" 
      ? formData.otherNationality 
      : formData.nationality;

    saveOnlyMutation.mutate({
      applicationId,
      chineseName: formData.chineseName,
      englishName: formData.englishName,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      placeOfBirth: formData.placeOfBirth,
      nationality,
    });
    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'personalBasic', data: secondHolder });
    }
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error(t('請檢查表單中的錯誤', 'Please check the errors in the form', '请检查表单中的错误'));
      return;
    }

    const nationality = formData.nationality === "other"
      ? formData.otherNationality
      : formData.nationality;

    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId, stepName: 'personalBasic', data: secondHolder });
    }
    saveMutation.mutate({
      applicationId,
      chineseName: formData.chineseName,
      englishName: formData.englishName,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      placeOfBirth: formData.placeOfBirth,
      nationality,
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={2}
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
      currentStep={2}
      onNext={handleNext}
      onSave={handleSave}
      isNextLoading={saveMutation.isPending}
      isSaveLoading={saveOnlyMutation.isPending}
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        {/* 自动保存状态显示 */}
        {(isSaving || lastSavedAt) && (
          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('正在保存...', 'Saving...', '正在保存...')}
              </span>
            ) : lastSavedAt ? (
              <span>{t('已自動保存於', 'Auto-saved at', '已自动保存于')} {lastSavedAt.toLocaleTimeString('zh-HK')}</span>
            ) : null}
          </div>
        )}
        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">{t('賬戶主要持有人', 'Primary Account Holder', '账户主要持有人')}</h3>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 中文姓名 */}
          <div className="space-y-2">
            <Label htmlFor="chineseName">
              {t('中文姓名', 'Chinese Name', '中文姓名')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="chineseName"
              value={formData.chineseName}
              onChange={(e) => {
                setFormData({ ...formData, chineseName: e.target.value });
                if (errors.chineseName) {
                  setErrors({ ...errors, chineseName: "" });
                }
              }}
              onBlur={() => {
                // 失焦时自动转换简体为繁体
                const converted = convertToTraditional(formData.chineseName);
                if (converted !== formData.chineseName) {
                  setFormData({ ...formData, chineseName: converted });
                }
              }}
              placeholder={t('請輸入中文姓名', 'Please enter Chinese name', '请输入中文姓名')}
              className={errors.chineseName ? "border-destructive" : ""}
            />
            {errors.chineseName && (
              <p className="text-sm text-destructive">{errors.chineseName}</p>
            )}
          </div>

          {/* 英文姓名 */}
          <div className="space-y-2">
            <Label htmlFor="englishName">
              {t('英文姓名', 'English Name', '英文姓名')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="englishName"
              value={formData.englishName}
              onChange={(e) => {
                setFormData({ ...formData, englishName: e.target.value });
                if (errors.englishName) {
                  setErrors({ ...errors, englishName: "" });
                }
              }}
              placeholder={t('請輸入英文姓名', 'Enter English Name', '请输入英文姓名')}
              className={errors.englishName ? "border-destructive" : ""}
            />
            {errors.englishName && (
              <p className="text-sm text-destructive">{errors.englishName}</p>
            )}
          </div>
        </div>

        {/* 性別 */}
        <div className="space-y-2">
          <Label htmlFor="gender">
            {t('性別', 'Gender', '性别')} <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('男', 'Male', '男')}</SelectItem>
              <SelectItem value="female">{t('女', 'Female', '女')}</SelectItem>
              <SelectItem value="other">{t('其他', 'Other', '其他')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 出生日期 - 年/月/日下拉选择 */}
        <div className="space-y-2">
          <Label>
            {t('出生日期', 'Date of Birth', '出生日期')} <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''}
              onValueChange={(year) => {
                const parts = (formData.dateOfBirth || '--').split('-');
                const newDate = `${year}-${parts[1] || ''}-${parts[2] || ''}`;
                setFormData({ ...formData, dateOfBirth: newDate });
                if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
              }}
            >
              <SelectTrigger className={errors.dateOfBirth ? "border-destructive" : ""}>
                <SelectValue placeholder={t('年份', 'Year', '年份')} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.dateOfBirth?.split('-')[1] || ''}
              onValueChange={(month) => {
                const parts = (formData.dateOfBirth || '--').split('-');
                const newDate = `${parts[0] || ''}-${month}-${parts[2] || ''}`;
                setFormData({ ...formData, dateOfBirth: newDate });
                if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
              }}
            >
              <SelectTrigger className={errors.dateOfBirth ? "border-destructive" : ""}>
                <SelectValue placeholder={t('月份', 'Month', '月份')} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <SelectItem key={m} value={m}>{m}{t('月', '', '月')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.dateOfBirth?.split('-')[2] || ''}
              onValueChange={(day) => {
                const parts = (formData.dateOfBirth || '--').split('-');
                const newDate = `${parts[0] || ''}-${parts[1] || ''}-${day}`;
                setFormData({ ...formData, dateOfBirth: newDate });
                if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
              }}
            >
              <SelectTrigger className={errors.dateOfBirth ? "border-destructive" : ""}>
                <SelectValue placeholder={t('日期', 'Day', '日期')} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                  <SelectItem key={d} value={d}>{d}{t('日', '', '日')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* 出生地 */}
        <div className="space-y-2">
          <Label htmlFor="placeOfBirth">
            {t('出生地', 'Place of Birth', '出生地')} <span className="text-destructive">*</span>
          </Label>
            <Input
              id="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={(e) => {
                setFormData({ ...formData, placeOfBirth: e.target.value });
                if (errors.placeOfBirth) {
                  setErrors({ ...errors, placeOfBirth: "" });
                }
              }}
              onBlur={() => {
                // 失焦时自动转换简体为繁体
                const converted = convertToTraditional(formData.placeOfBirth);
                if (converted !== formData.placeOfBirth) {
                  setFormData({ ...formData, placeOfBirth: converted });
                }
              }}
              placeholder={t('請輸入出生地', 'Please enter place of birth', '请输入出生地')}
              className={errors.placeOfBirth ? "border-destructive" : ""}
            />
          {errors.placeOfBirth && (
            <p className="text-sm text-destructive">{errors.placeOfBirth}</p>
          )}
        </div>

        {/* 國籍 */}
        <div className="space-y-2">
          <Label htmlFor="nationality">
            {t('國籍', 'Nationality', '国籍')} <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.nationality} 
            onValueChange={(v) => {
              setFormData({ ...formData, nationality: v });
              if (errors.nationality) {
                setErrors({ ...errors, nationality: "" });
              }
            }}
          >
            <SelectTrigger className={errors.nationality ? "border-destructive" : ""}>
              <SelectValue placeholder={t('請選擇國籍', 'Please select nationality', '请选择国籍')} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country === "other" ? t('其他', 'Other', '其他') : country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.nationality && (
            <p className="text-sm text-destructive">{errors.nationality}</p>
          )}
        </div>

        {/* 其他國籍輸入框 */}
        {formData.nationality === "other" && (
          <div className="space-y-2">
            <Label htmlFor="otherNationality">
              {t('請輸入具體國籍', 'Please enter specific nationality', '请输入具体国籍')} <span className="text-destructive">*</span>
            </Label>
              <Input
                id="otherNationality"
                value={formData.otherNationality}
                onChange={(e) => {
                  setFormData({ ...formData, otherNationality: e.target.value });
                  if (errors.otherNationality) {
                    setErrors({ ...errors, otherNationality: "" });
                  }
                }}
                onBlur={() => {
                  // 失焦时自动转换简体为繁体
                  const converted = convertToTraditional(formData.otherNationality);
                  if (converted !== formData.otherNationality) {
                    setFormData({ ...formData, otherNationality: converted });
                  }
                }}
                placeholder={t('請輸入國籍名稱', 'Please enter nationality name', '请输入国籍名称')}
                className={errors.otherNationality ? "border-destructive" : ""}
              />
            {errors.otherNationality && (
              <p className="text-sm text-destructive">{errors.otherNationality}</p>
            )}
          </div>
        )}
        {/* 聯名賬戶：第二持有人 */}
        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mt-8 mb-2">{t('賬戶第二持有人', 'Second Account Holder', '账户第二持有人')}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('中文姓名', 'Chinese Name', '中文姓名')} <span className="text-destructive">*</span></Label>
                <Input value={secondHolder.chineseName} onChange={(e) => setSecondHolder({ ...secondHolder, chineseName: e.target.value })}
                  onBlur={() => setSecondHolder({ ...secondHolder, chineseName: convertToTraditional(secondHolder.chineseName) })}
                  placeholder={t('請輸入中文姓名', 'Please enter Chinese name', '请输入中文姓名')} className={errors.secondChineseName ? "border-destructive" : ""} />
                {errors.secondChineseName && <p className="text-sm text-destructive">{errors.secondChineseName}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('英文姓名', 'English Name', '英文姓名')} <span className="text-destructive">*</span></Label>
                <Input value={secondHolder.englishName} onChange={(e) => setSecondHolder({ ...secondHolder, englishName: e.target.value })}
                  placeholder={t('請輸入英文姓名', 'Enter English Name', '请输入英文姓名')} className={errors.secondEnglishName ? "border-destructive" : ""} />
                {errors.secondEnglishName && <p className="text-sm text-destructive">{errors.secondEnglishName}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>{t('性別', 'Gender', '性别')} <span className="text-destructive">*</span></Label>
                <Select value={secondHolder.gender} onValueChange={(v: any) => setSecondHolder({ ...secondHolder, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男 / Male</SelectItem>
                    <SelectItem value="female">女 / Female</SelectItem>
                    <SelectItem value="other">其他 / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('出生日期', 'Date of Birth', '出生日期')} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={secondHolder.dateOfBirth?.split('-')[0] || ''} onValueChange={(year) => {
                    const parts = (secondHolder.dateOfBirth || '--').split('-');
                    setSecondHolder({ ...secondHolder, dateOfBirth: `${year}-${parts[1] || ''}-${parts[2] || ''}` });
                  }}>
                    <SelectTrigger className={errors.secondDateOfBirth ? "border-destructive" : ""}><SelectValue placeholder={t('年份', 'Year', '年份')} /></SelectTrigger>
                    <SelectContent className="max-h-60">{Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={secondHolder.dateOfBirth?.split('-')[1] || ''} onValueChange={(month) => {
                    const parts = (secondHolder.dateOfBirth || '--').split('-');
                    setSecondHolder({ ...secondHolder, dateOfBirth: `${parts[0] || ''}-${month}-${parts[2] || ''}` });
                  }}>
                    <SelectTrigger className={errors.secondDateOfBirth ? "border-destructive" : ""}><SelectValue placeholder={t('月份', 'Month', '月份')} /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => <SelectItem key={m} value={m}>{m}{t('月', '', '月')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={secondHolder.dateOfBirth?.split('-')[2] || ''} onValueChange={(day) => {
                    const parts = (secondHolder.dateOfBirth || '--').split('-');
                    setSecondHolder({ ...secondHolder, dateOfBirth: `${parts[0] || ''}-${parts[1] || ''}-${day}` });
                  }}>
                    <SelectTrigger className={errors.secondDateOfBirth ? "border-destructive" : ""}><SelectValue placeholder={t('日期', 'Day', '日期')} /></SelectTrigger>
                    <SelectContent className="max-h-60">{Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => <SelectItem key={d} value={d}>{d}{t('日', '', '日')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {errors.secondDateOfBirth && <p className="text-sm text-destructive">{errors.secondDateOfBirth}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>{t('出生地', 'Place of Birth', '出生地')} <span className="text-destructive">*</span></Label>
                <Input value={secondHolder.placeOfBirth} onChange={(e) => setSecondHolder({ ...secondHolder, placeOfBirth: e.target.value })}
                  onBlur={() => setSecondHolder({ ...secondHolder, placeOfBirth: convertToTraditional(secondHolder.placeOfBirth) })}
                  placeholder={t('請輸入出生地', 'Please enter place of birth', '请输入出生地')} className={errors.secondPlaceOfBirth ? "border-destructive" : ""} />
                {errors.secondPlaceOfBirth && <p className="text-sm text-destructive">{errors.secondPlaceOfBirth}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('國籍', 'Nationality', '国籍')} <span className="text-destructive">*</span></Label>
                <Select value={secondHolder.nationality} onValueChange={(v) => setSecondHolder({ ...secondHolder, nationality: v })}>
                  <SelectTrigger className={errors.secondNationality ? "border-destructive" : ""}><SelectValue placeholder={t('請選擇國籍', 'Please select nationality', '请选择国籍')} /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (<SelectItem key={c} value={c}>{c === "other" ? t('其他', 'Other', '其他') : c}</SelectItem>))}
                  </SelectContent>
                </Select>
                {errors.secondNationality && <p className="text-sm text-destructive">{errors.secondNationality}</p>}
              </div>
            </div>

          </>
        )}
      </div>
    </ApplicationWizard>
  );
}
