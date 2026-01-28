import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const countries = [
  "中国", "香港", "澳门", "台湾", "美国", "加拿大", "英国", "澳大利亚", "新加坡", "日本", "韩国", "other"
];

export default function PersonalBasicInfo() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");

  const [formData, setFormData] = useState({
    chineseName: "",
    englishName: "",
    gender: "male" as "male" | "female" | "other",
    dateOfBirth: "",
    placeOfBirth: "",
    nationality: "",
    otherNationality: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingData, isLoading: isLoadingData } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.personalBasic.save.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/4`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
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

    // 中文姓名校验
    if (!formData.chineseName.trim()) {
      newErrors.chineseName = "請輸入中文姓名";
    } else if (!/[\u4e00-\u9fa5]/.test(formData.chineseName)) {
      newErrors.chineseName = "中文姓名必須包含中文字符";
    }

    // 英文姓名校验
    if (!formData.englishName.trim()) {
      newErrors.englishName = "請輸入英文姓名";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.englishName)) {
      newErrors.englishName = "英文姓名只能包含英文字符";
    }

    // 出生日期校验（年龄必须>=18）
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "請選擇出生日期";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
        newErrors.dateOfBirth = "申請人年齡必須滿18周歲";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      <ApplicationWizard applicationId={applicationId} currentStep={3}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={3}
      onNext={handleNext}
      isNextLoading={saveMutation.isPending}
    >
      <div className="space-y-6">
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
              placeholder="請輸入國籍名稱"
              className={errors.otherNationality ? "border-destructive" : ""}
            />
            {errors.otherNationality && (
              <p className="text-sm text-destructive">{errors.otherNationality}</p>
            )}
          </div>
        )}
      </div>
    </ApplicationWizard>
  );
}
