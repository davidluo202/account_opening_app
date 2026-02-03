import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";


interface FormData {
  // PART 1: 適用於全部客戶 (Q1-Q6)
  q1_currentHoldings: string[]; // 多選
  q2_investmentPeriod: string;
  q3_priceVolatility: string;
  q4_investmentPercentage: string;
  q5_investmentAttitude: string;
  q6_derivativesKnowledge: string[]; // 多選
  
  // PART 2A: 適用個人/聯名客戶 (Q7-Q10)
  q7_ageGroup: string;
  q8_educationLevel: string;
  q9_investmentKnowledge: string[]; // 多選
  q10_liquidityNeeds: string;
  
  // 評分結果
  totalScore: number;
  riskLevel: string;
}

export default function RiskQuestionnaire() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    q1_currentHoldings: [],
    q2_investmentPeriod: "",
    q3_priceVolatility: "",
    q4_investmentPercentage: "",
    q5_investmentAttitude: "",
    q6_derivativesKnowledge: [],
    q7_ageGroup: "",
    q8_educationLevel: "",
    q9_investmentKnowledge: [],
    q10_liquidityNeeds: "",
    totalScore: 0,
    riskLevel: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 獲取當前申請ID
  useEffect(() => {
    const storedId = localStorage.getItem("currentApplicationId");
    if (storedId) {
      setApplicationId(parseInt(storedId));
    } else {
      toast({
        title: "錯誤",
        description: "未找到申請記錄",
        variant: "destructive",
      });
      setLocation("/applications");
    }
  }, [setLocation]);

  // 載入已保存的數據
  const { data: savedData, isLoading: loadingData } = trpc.riskQuestionnaire.get.useQuery(
    { applicationId: applicationId! },
    { enabled: !!applicationId }
  );

  useEffect(() => {
    if (savedData) {
      setFormData({
        q1_currentHoldings: savedData.q1CurrentHoldings ? JSON.parse(savedData.q1CurrentHoldings) : [],
        q2_investmentPeriod: savedData.q2InvestmentPeriod || "",
        q3_priceVolatility: savedData.q3PriceVolatility || "",
        q4_investmentPercentage: savedData.q4InvestmentPercentage || "",
        q5_investmentAttitude: savedData.q5InvestmentAttitude || "",
        q6_derivativesKnowledge: savedData.q6DerivativesKnowledge ? JSON.parse(savedData.q6DerivativesKnowledge) : [],
        q7_ageGroup: savedData.q7AgeGroup || "",
        q8_educationLevel: savedData.q8EducationLevel || "",
        q9_investmentKnowledge: savedData.q9InvestmentKnowledge ? JSON.parse(savedData.q9InvestmentKnowledge) : [],
        q10_liquidityNeeds: savedData.q10LiquidityNeeds || "",
        totalScore: savedData.totalScore || 0,
        riskLevel: savedData.riskLevel || "",
      });
    }
  }, [savedData]);

  // 保存mutation
  const saveMutation = trpc.riskQuestionnaire.save.useMutation({
    onSuccess: () => {
      toast({
        title: "保存成功",
        description: "風險評估問卷已保存",
      });
      setLocation("/application/customer-declaration");
    },
    onError: (error: any) => {
      toast({
        title: "保存失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 計算評分
  const calculateScore = (): { totalScore: number; riskLevel: string } => {
    let score = 0;

    // Q1: 現在是否持有以下任何投資產品？
    if (formData.q1_currentHoldings.includes("savings")) score += 0;
    if (formData.q1_currentHoldings.includes("bonds")) score += 50;
    if (formData.q1_currentHoldings.includes("derivatives")) score += 100;

    // Q2: 預期投資年期
    if (formData.q2_investmentPeriod === "less_than_1") score += 0;
    if (formData.q2_investmentPeriod === "1_to_3") score += 50;
    if (formData.q2_investmentPeriod === "more_than_3") score += 100;

    // Q3: 可以接受的年度價格波幅
    if (formData.q3_priceVolatility === "10_percent") score += 0;
    if (formData.q3_priceVolatility === "20_percent") score += 50;
    if (formData.q3_priceVolatility === "30_percent") score += 100;

    // Q4: 資產淨值中可作投資用途的百分比
    if (formData.q4_investmentPercentage === "less_than_10") score += 0;
    if (formData.q4_investmentPercentage === "10_to_20") score += 25;
    if (formData.q4_investmentPercentage === "21_to_30") score += 50;
    if (formData.q4_investmentPercentage === "31_to_50") score += 75;
    if (formData.q4_investmentPercentage === "more_than_50") score += 100;

    // Q5: 對金融投資的一般態度
    if (formData.q5_investmentAttitude === "no_volatility") score += 0;
    if (formData.q5_investmentAttitude === "small_volatility") score += 25;
    if (formData.q5_investmentAttitude === "some_volatility") score += 50;
    if (formData.q5_investmentAttitude === "large_volatility") score += 75;
    if (formData.q5_investmentAttitude === "any_volatility") score += 100;

    // Q6: 對衍生工具產品的認識
    if (formData.q6_derivativesKnowledge.includes("training")) score += 33;
    if (formData.q6_derivativesKnowledge.includes("experience")) score += 33;
    if (formData.q6_derivativesKnowledge.includes("transactions")) score += 34;
    if (formData.q6_derivativesKnowledge.includes("no_knowledge")) score += 0;

    // Q7: 年齡組別
    if (formData.q7_ageGroup === "18_to_25") score += 100;
    if (formData.q7_ageGroup === "26_to_35") score += 75;
    if (formData.q7_ageGroup === "36_to_50") score += 50;
    if (formData.q7_ageGroup === "51_to_64") score += 25;
    if (formData.q7_ageGroup === "65_plus") score += 0; // 保守型投資者

    // Q8: 教育程度
    if (formData.q8_educationLevel === "primary_or_below") score += 0; // 保守型投資者
    if (formData.q8_educationLevel === "secondary") score += 50;
    if (formData.q8_educationLevel === "tertiary_or_above") score += 100;

    // Q9: 投資知識來源
    if (formData.q9_investmentKnowledge.includes("no_interest")) score += 0;
    if (formData.q9_investmentKnowledge.includes("discussion")) score += 33;
    if (formData.q9_investmentKnowledge.includes("reading")) score += 33;
    if (formData.q9_investmentKnowledge.includes("research")) score += 34;

    // Q10: 流動資金需求
    if (formData.q10_liquidityNeeds === "no_need") score += 100;
    if (formData.q10_liquidityNeeds === "up_to_30") score += 75;
    if (formData.q10_liquidityNeeds === "30_to_50") score += 50;
    if (formData.q10_liquidityNeeds === "over_50") score += 0;

    // 判定風險等級
    let riskLevel = "";
    if (score < 100) riskLevel = "最低風險";
    else if (score < 200) riskLevel = "低風險";
    else if (score < 300) riskLevel = "低至中等風險";
    else if (score < 400) riskLevel = "中等風險";
    else if (score < 600) riskLevel = "中等至高風險";
    else riskLevel = "高風險";

    return { totalScore: score, riskLevel };
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.q1_currentHoldings.length === 0) newErrors.q1 = "請至少選擇一項";
    if (!formData.q2_investmentPeriod) newErrors.q2 = "請選擇投資年期";
    if (!formData.q3_priceVolatility) newErrors.q3 = "請選擇可接受的價格波幅";
    if (!formData.q4_investmentPercentage) newErrors.q4 = "請選擇投資百分比";
    if (!formData.q5_investmentAttitude) newErrors.q5 = "請選擇投資態度";
    if (formData.q6_derivativesKnowledge.length === 0) newErrors.q6 = "請至少選擇一項";
    if (!formData.q7_ageGroup) newErrors.q7 = "請選擇年齡組別";
    if (!formData.q8_educationLevel) newErrors.q8 = "請選擇教育程度";
    if (formData.q9_investmentKnowledge.length === 0) newErrors.q9 = "請至少選擇一項";
    if (!formData.q10_liquidityNeeds) newErrors.q10 = "請選擇流動資金需求";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "驗證失敗",
        description: "請填寫所有必填項",
        variant: "destructive",
      });
      return;
    }

    const { totalScore, riskLevel } = calculateScore();
    
    setLoading(true);
    saveMutation.mutate({
      applicationId: applicationId!,
      q1CurrentHoldings: JSON.stringify(formData.q1_currentHoldings),
      q2InvestmentPeriod: formData.q2_investmentPeriod,
      q3PriceVolatility: formData.q3_priceVolatility,
      q4InvestmentPercentage: formData.q4_investmentPercentage,
      q5InvestmentAttitude: formData.q5_investmentAttitude,
      q6DerivativesKnowledge: JSON.stringify(formData.q6_derivativesKnowledge),
      q7AgeGroup: formData.q7_ageGroup,
      q8EducationLevel: formData.q8_educationLevel,
      q9InvestmentKnowledge: JSON.stringify(formData.q9_investmentKnowledge),
      q10LiquidityNeeds: formData.q10_liquidityNeeds,
      totalScore,
      riskLevel,
    });
  };

  // 處理多選框變更
  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>風險評估問卷 / Risk Profile Questionnaire</CardTitle>
          <p className="text-sm text-muted-foreground">
            請根據您的實際情況填寫以下問卷，以評估您的風險承受能力
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* PART 1: 適用於全部客戶 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">PART 1: 適用於全部客戶</h3>
            
            {/* Q1 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q1. 現在是否持有以下任何投資產品？* (可多選)
              </Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q1-savings"
                    checked={formData.q1_currentHoldings.includes("savings")}
                    onCheckedChange={(checked) => handleCheckboxChange("q1_currentHoldings", "savings", checked as boolean)}
                  />
                  <label htmlFor="q1-savings" className="text-sm">
                    儲蓄/定期儲蓄/存款證/保本產品
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q1-bonds"
                    checked={formData.q1_currentHoldings.includes("bonds")}
                    onCheckedChange={(checked) => handleCheckboxChange("q1_currentHoldings", "bonds", checked as boolean)}
                  />
                  <label htmlFor="q1-bonds" className="text-sm">
                    債券/證券/單位信託基金/投資相連保險計劃
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q1-derivatives"
                    checked={formData.q1_currentHoldings.includes("derivatives")}
                    onCheckedChange={(checked) => handleCheckboxChange("q1_currentHoldings", "derivatives", checked as boolean)}
                  />
                  <label htmlFor="q1-derivatives" className="text-sm">
                    期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資
                  </label>
                </div>
              </div>
              {errors.q1 && <p className="text-sm text-destructive">{errors.q1}</p>}
            </div>

            {/* Q2 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q2. 預期投資年期是多少？*</Label>
              <RadioGroup
                value={formData.q2_investmentPeriod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q2_investmentPeriod: value }))}
                className="pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_than_1" id="q2-1" />
                  <Label htmlFor="q2-1" className="font-normal">沒有或少於1年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1_to_3" id="q2-2" />
                  <Label htmlFor="q2-2" className="font-normal">1-3年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more_than_3" id="q2-3" />
                  <Label htmlFor="q2-3" className="font-normal">多於3年</Label>
                </div>
              </RadioGroup>
              {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}
            </div>

            {/* Q3 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q3. 可以接受以下哪個年度價格波幅？*</Label>
              <RadioGroup
                value={formData.q3_priceVolatility}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q3_priceVolatility: value }))}
                className="pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10_percent" id="q3-1" />
                  <Label htmlFor="q3-1" className="font-normal">價格波幅介乎-10%至+10%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="20_percent" id="q3-2" />
                  <Label htmlFor="q3-2" className="font-normal">價格波幅介乎-20%至+20%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30_percent" id="q3-3" />
                  <Label htmlFor="q3-3" className="font-normal">價格波幅多於-30%至多於+30%</Label>
                </div>
              </RadioGroup>
              {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
            </div>

            {/* Q4 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？*
              </Label>
              <RadioGroup
                value={formData.q4_investmentPercentage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q4_investmentPercentage: value }))}
                className="pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_than_10" id="q4-1" />
                  <Label htmlFor="q4-1" className="font-normal">少於10%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10_to_20" id="q4-2" />
                  <Label htmlFor="q4-2" className="font-normal">介乎10%至20%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="21_to_30" id="q4-3" />
                  <Label htmlFor="q4-3" className="font-normal">介乎21%至30%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="31_to_50" id="q4-4" />
                  <Label htmlFor="q4-4" className="font-normal">介乎31%至50%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more_than_50" id="q4-5" />
                  <Label htmlFor="q4-5" className="font-normal">多於50%</Label>
                </div>
              </RadioGroup>
              {errors.q4 && <p className="text-sm text-destructive">{errors.q4}</p>}
            </div>

            {/* Q5 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q5. 以下哪一句子最能貼切描述您對金融投資的一般態度？*
              </Label>
              <RadioGroup
                value={formData.q5_investmentAttitude}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q5_investmentAttitude: value }))}
                className="pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_volatility" id="q5-1" />
                  <Label htmlFor="q5-1" className="font-normal">不能接受任何價格波動，並且對賺取投資回報不感興趣</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small_volatility" id="q5-2" />
                  <Label htmlFor="q5-2" className="font-normal">只能接受較小幅度的價格波動，並且僅希望賺取稍高於銀行存款利率的回報</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="some_volatility" id="q5-3" />
                  <Label htmlFor="q5-3" className="font-normal">可接受若干價格波幅，並希望賺取高於銀行存款利率的回報</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large_volatility" id="q5-4" />
                  <Label htmlFor="q5-4" className="font-normal">可接受大幅度的價格波動，並希望賺取與股市指數表現相若的回報</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any_volatility" id="q5-5" />
                  <Label htmlFor="q5-5" className="font-normal">可接受任何幅度的價格波動，並希望回報能跑贏股市指數</Label>
                </div>
              </RadioGroup>
              {errors.q5 && <p className="text-sm text-destructive">{errors.q5}</p>}
            </div>

            {/* Q6 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q6. 對衍生工具產品的認識* (可多選)</Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-training"
                    checked={formData.q6_derivativesKnowledge.includes("training")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivativesKnowledge", "training", checked as boolean)}
                  />
                  <label htmlFor="q6-training" className="text-sm">
                    曾接受有關衍生產品的培訓或修讀相關課程
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-experience"
                    checked={formData.q6_derivativesKnowledge.includes("experience")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivativesKnowledge", "experience", checked as boolean)}
                  />
                  <label htmlFor="q6-experience" className="text-sm">
                    現時或過去擁有與衍生產品有關的工作經驗
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-transactions"
                    checked={formData.q6_derivativesKnowledge.includes("transactions")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivativesKnowledge", "transactions", checked as boolean)}
                  />
                  <label htmlFor="q6-transactions" className="text-sm">
                    於過往3年曾執行5次或以上有關衍生產品的交易
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-no-knowledge"
                    checked={formData.q6_derivativesKnowledge.includes("no_knowledge")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivativesKnowledge", "no_knowledge", checked as boolean)}
                  />
                  <label htmlFor="q6-no-knowledge" className="text-sm">
                    沒有衍生工具之認識
                  </label>
                </div>
              </div>
              {errors.q6 && <p className="text-sm text-destructive">{errors.q6}</p>}
            </div>
          </div>

          {/* PART 2A: 適用個人/聯名客戶 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">PART 2A: 適用個人/聯名客戶</h3>
            
            {/* Q7 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q7. 您屬於以下哪個年齡組別？*</Label>
              <RadioGroup
                value={formData.q7_ageGroup}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q7_ageGroup: value }))}
                className="pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="18_to_25" id="q7-1" />
                  <Label htmlFor="q7-1" className="font-normal">介乎18至25歲</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="26_to_35" id="q7-2" />
                  <Label htmlFor="q7-2" className="font-normal">介乎26至35歲</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="36_to_50" id="q7-3" />
                  <Label htmlFor="q7-3" className="font-normal">介乎36至50歲</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="51_to_64" id="q7-4" />
                  <Label htmlFor="q7-4" className="font-normal">介乎51至64歲</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="65_plus" id="q7-5" />
                  <Label htmlFor="q7-5" className="font-normal">65歲或以上（註：將定為保守型投資者）</Label>
                </div>
              </RadioGroup>
              {errors.q7 && <p className="text-sm text-destructive">{errors.q7}</p>}
            </div>

            {/* Q8 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q8. 您的教育程度是？*</Label>
              <RadioGroup
                value={formData.q8_educationLevel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q8_educationLevel: value }))}
                className="pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="primary_or_below" id="q8-1" />
                  <Label htmlFor="q8-1" className="font-normal">小學或以下（註：將定為保守型投資者）</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="secondary" id="q8-2" />
                  <Label htmlFor="q8-2" className="font-normal">中學</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tertiary_or_above" id="q8-3" />
                  <Label htmlFor="q8-3" className="font-normal">大專或以上</Label>
                </div>
              </RadioGroup>
              {errors.q8 && <p className="text-sm text-destructive">{errors.q8}</p>}
            </div>

            {/* Q9 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q9. 您曾經或現時從以下哪些途徑汲取投資知識？* (可多選)
              </Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q9-no-interest"
                    checked={formData.q9_investmentKnowledge.includes("no_interest")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investmentKnowledge", "no_interest", checked as boolean)}
                  />
                  <label htmlFor="q9-no-interest" className="text-sm">
                    從未汲取及/或沒有興趣汲取任何投資知識
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q9-discussion"
                    checked={formData.q9_investmentKnowledge.includes("discussion")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investmentKnowledge", "discussion", checked as boolean)}
                  />
                  <label htmlFor="q9-discussion" className="text-sm">
                    與親友及/或同事討論投資或理財話題
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q9-reading"
                    checked={formData.q9_investmentKnowledge.includes("reading")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investmentKnowledge", "reading", checked as boolean)}
                  />
                  <label htmlFor="q9-reading" className="text-sm">
                    閱讀及/或收聽有關投資或財經新聞
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q9-research"
                    checked={formData.q9_investmentKnowledge.includes("research")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investmentKnowledge", "research", checked as boolean)}
                  />
                  <label htmlFor="q9-research" className="text-sm">
                    研究投資或財務相關事宜，或參加投資或財務相關課程、論壇、簡報會、研討會或工作坊
                  </label>
                </div>
              </div>
              {errors.q9 && <p className="text-sm text-destructive">{errors.q9}</p>}
            </div>

            {/* Q10 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q10. 您需要將多少投資兌現，以滿足突發事件的流動資金需求？*
              </Label>
              <RadioGroup
                value={formData.q10_liquidityNeeds}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q10_liquidityNeeds: value }))}
                className="pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_need" id="q10-1" />
                  <Label htmlFor="q10-1" className="font-normal">不需要出售任何投資</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="up_to_30" id="q10-2" />
                  <Label htmlFor="q10-2" className="font-normal">我會出售不超過30%的投資</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30_to_50" id="q10-3" />
                  <Label htmlFor="q10-3" className="font-normal">我會出售超過30%但不到50%的投資</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over_50" id="q10-4" />
                  <Label htmlFor="q10-4" className="font-normal">我會出售超過50%的投資</Label>
                </div>
              </RadioGroup>
              {errors.q10 && <p className="text-sm text-destructive">{errors.q10}</p>}
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/application/personal-detailed")}
            >
              上一步
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || saveMutation.isPending}
            >
              {(loading || saveMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              下一步
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
