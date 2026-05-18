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

  const saveMutation = trpc.personalBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/3`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const saveOnlyMutation = trpc.personalBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
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
      newErrors.chineseName = chineseNameResult.message || '中文姓名格式不正確';
    }

    // 使用validators.ts中的英文姓名校验
    const englishNameResult = validateEnglishName(formData.englishName);
    if (!englishNameResult.valid) {
      newErrors.englishName = englishNameResult.message || '英文姓名格式不正確';
    }

    // 使用validators.ts中的年龄校验
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "請選擇出生日期";
    } else {
      const ageResult = validateAge(formData.dateOfBirth);
      if (!ageResult.valid) {
        newErrors.dateOfBirth = ageResult.message || '年齡必須滿18周歲';
      }
    }

    // 出生地校验
    if (!formData.placeOfBirth.trim()) {
      newErrors.placeOfBirth = "請輸入出生地";
    }

    // 国籍校验
    if (!formData.nationality) {
      newErrors.nationality = "請選擇國籍";
    } else if (formData.nationality === "other" && !formData.otherNationality.trim()) {
      newErrors.otherNationality = "請輸入具體國籍";
    }

    // 聯名賬戶：驗證第二持有人
    if (isJoint) {
      if (!secondHolder.chineseName.trim()) newErrors.secondChineseName = "請輸入第二持有人中文姓名";
      if (!secondHolder.englishName.trim()) newErrors.secondEnglishName = "請輸入第二持有人英文姓名";
      if (!secondHolder.dateOfBirth) {
        newErrors.secondDateOfBirth = "請選擇第二持有人出生日期";
      } else {
        const ageResult = validateAge(secondHolder.dateOfBirth);
        if (!ageResult.valid) newErrors.secondDateOfBirth = ageResult.message || '第二持有人年齡必須滿18周歲';
      }
      if (!secondHolder.placeOfBirth.trim()) newErrors.secondPlaceOfBirth = "請輸入第二持有人出生地";
      if (!secondHolder.nationality) newErrors.secondNationality = "請選擇第二持有人國籍";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error("請檢查表单中的錯誤");
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
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("請檢查表單中的錯誤");
      return;
    }

    const nationality = formData.nationality === "other" 
      ? formData.otherNationality 
      : formData.nationality;

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
                正在保存...
              </span>
            ) : lastSavedAt ? (
              <span>已自动保存于 {lastSavedAt.toLocaleTimeString('zh-HK')}</span>
            ) : null}
          </div>
        )}
        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">賬戶主要持有人 / Primary Account Holder</h3>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 中文姓名 */}
          <div className="space-y-2">
            <Label htmlFor="chineseName">
              中文姓名 <span className="text-destructive">*</span>
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
              placeholder="請輸入中文姓名"
              className={errors.chineseName ? "border-destructive" : ""}
            />
            {errors.chineseName && (
              <p className="text-sm text-destructive">{errors.chineseName}</p>
            )}
          </div>

          {/* 英文姓名 */}
          <div className="space-y-2">
            <Label htmlFor="englishName">
              英文姓名 / English Name <span className="text-destructive">*</span>
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
              placeholder="Enter English Name"
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
            性別 / Gender <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">男 / Male</SelectItem>
              <SelectItem value="female">女 / Female</SelectItem>
              <SelectItem value="other">其他 / Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 出生日期 */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">
            出生日期 / Date of Birth <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => {
              setFormData({ ...formData, dateOfBirth: e.target.value });
              if (errors.dateOfBirth) {
                setErrors({ ...errors, dateOfBirth: "" });
              }
            }}
            className={errors.dateOfBirth ? "border-destructive" : ""}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* 出生地 */}
        <div className="space-y-2">
          <Label htmlFor="placeOfBirth">
            出生地 / Place of Birth <span className="text-destructive">*</span>
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
              placeholder="請輸入出生地"
              className={errors.placeOfBirth ? "border-destructive" : ""}
            />
          {errors.placeOfBirth && (
            <p className="text-sm text-destructive">{errors.placeOfBirth}</p>
          )}
        </div>

        {/* 國籍 */}
        <div className="space-y-2">
          <Label htmlFor="nationality">
            國籍 / Nationality <span className="text-destructive">*</span>
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
              <SelectValue placeholder="請選擇國籍" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country === "other" ? "其他 / Other" : country}
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
              請輸入具體國籍 <span className="text-destructive">*</span>
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
                placeholder="請輸入國籍名稱"
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
            <h3 className="text-lg font-bold text-primary border-b pb-2 mt-8 mb-2">賬戶第二持有人 / Second Account Holder</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>中文姓名 <span className="text-destructive">*</span></Label>
                <Input value={secondHolder.chineseName} onChange={(e) => setSecondHolder({ ...secondHolder, chineseName: e.target.value })}
                  onBlur={() => setSecondHolder({ ...secondHolder, chineseName: convertToTraditional(secondHolder.chineseName) })}
                  placeholder="請輸入中文姓名" className={errors.secondChineseName ? "border-destructive" : ""} />
                {errors.secondChineseName && <p className="text-sm text-destructive">{errors.secondChineseName}</p>}
              </div>
              <div className="space-y-2">
                <Label>英文姓名 / English Name <span className="text-destructive">*</span></Label>
                <Input value={secondHolder.englishName} onChange={(e) => setSecondHolder({ ...secondHolder, englishName: e.target.value })}
                  placeholder="Enter English Name" className={errors.secondEnglishName ? "border-destructive" : ""} />
                {errors.secondEnglishName && <p className="text-sm text-destructive">{errors.secondEnglishName}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>性別 / Gender <span className="text-destructive">*</span></Label>
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
                <Label>出生日期 / Date of Birth <span className="text-destructive">*</span></Label>
                <Input type="date" value={secondHolder.dateOfBirth} onChange={(e) => setSecondHolder({ ...secondHolder, dateOfBirth: e.target.value })}
                  className={errors.secondDateOfBirth ? "border-destructive" : ""} />
                {errors.secondDateOfBirth && <p className="text-sm text-destructive">{errors.secondDateOfBirth}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>出生地 / Place of Birth <span className="text-destructive">*</span></Label>
                <Input value={secondHolder.placeOfBirth} onChange={(e) => setSecondHolder({ ...secondHolder, placeOfBirth: e.target.value })}
                  onBlur={() => setSecondHolder({ ...secondHolder, placeOfBirth: convertToTraditional(secondHolder.placeOfBirth) })}
                  placeholder="請輸入出生地" className={errors.secondPlaceOfBirth ? "border-destructive" : ""} />
                {errors.secondPlaceOfBirth && <p className="text-sm text-destructive">{errors.secondPlaceOfBirth}</p>}
              </div>
              <div className="space-y-2">
                <Label>國籍 / Nationality <span className="text-destructive">*</span></Label>
                <Select value={secondHolder.nationality} onValueChange={(v) => setSecondHolder({ ...secondHolder, nationality: v })}>
                  <SelectTrigger className={errors.secondNationality ? "border-destructive" : ""}><SelectValue placeholder="請選擇國籍" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (<SelectItem key={c} value={c}>{c === "other" ? "其他 / Other" : c}</SelectItem>))}
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
