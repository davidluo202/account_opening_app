import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";


interface FormData {
  // PART 1: 適用於全部客戶 (Q1-Q6)
  q1_current_investments: string[]; // 多選
  q2_investment_period: string; // 單選
  q3_price_volatility: string; // 單選
  q4_investment_percentage: string; // 單選
  q5_investment_attitude: string; // 單選
  q6_derivatives_knowledge: string[]; // 多選
  
  // PART 2A: 適用個人/聯名客戶 (Q7-Q10)
  q7_age_group: string; // 單選
  q8_education_level: string; // 自動填充，不顯示
  q9_investment_knowledge_sources: string[]; // 多選
  q10_liquidity_needs: string; // 單選
  
  // 評分結果
  totalScore: number;
  riskLevel: string;
  riskDescription: string; // 風險等級描述
}

export default function RiskQuestionnaire() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const params = useParams<{ id: string }>();
  const applicationId = parseInt(params.id || "0");
  const [formData, setFormData] = useState<FormData>({
    q1_current_investments: [],
    q2_investment_period: "",
    q3_price_volatility: "",
    q4_investment_percentage: "",
    q5_investment_attitude: "",
    q6_derivatives_knowledge: [],
    q7_age_group: "",
    q8_education_level: "",
    q9_investment_knowledge_sources: [],
    q10_liquidity_needs: "",
    totalScore: 0,
    riskLevel: "",
    riskDescription: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});



  // 載入已保存的數據
  const { data: savedData, isLoading: loadingData } = trpc.riskQuestionnaire.get.useQuery(
    { applicationId: applicationId! },
    { enabled: !!applicationId }
  );

  // 加載個人詳細信息，獲取學歷
  const { data: personalDetailedData } = trpc.personalDetailed.get.useQuery(
    { applicationId: applicationId! },
    { enabled: !!applicationId }
  );

  useEffect(() => {
    if (savedData) {
      setFormData({
        q1_current_investments: savedData.q1_current_investments ? JSON.parse(savedData.q1_current_investments) : [],
        q2_investment_period: savedData.q2_investment_period || "",
        q3_price_volatility: savedData.q3_price_volatility || "",
        q4_investment_percentage: savedData.q4_investment_percentage || "",
        q5_investment_attitude: savedData.q5_investment_attitude || "",
        q6_derivatives_knowledge: savedData.q6_derivatives_knowledge ? JSON.parse(savedData.q6_derivatives_knowledge) : [],
        q7_age_group: savedData.q7_age_group || "",
        q8_education_level: savedData.q8_education_level || "",
        q9_investment_knowledge_sources: savedData.q9_investment_knowledge_sources ? JSON.parse(savedData.q9_investment_knowledge_sources) : [],
        q10_liquidity_needs: savedData.q10_liquidity_needs || "",
        totalScore: savedData.totalScore || 0,
        riskLevel: savedData.riskLevel || "",
        riskDescription: savedData.riskDescription || "",
      });
    }
  }, [savedData]);

  // 自動填充Q8（學歷）
  useEffect(() => {
    if (personalDetailedData?.educationLevel) {
      setFormData(prev => ({
        ...prev,
        q8_education_level: personalDetailedData.educationLevel,
      }));
    }
  }, [personalDetailedData]);

  // 保存mutation
  const saveMutation = trpc.riskQuestionnaire.save.useMutation({
    onSuccess: () => {
      toast.success("風險評估問卷已保存");
      setLocation(`/application/${applicationId}/step/9`);
    },
    onError: (error: any) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  // 計算評分
  const calculateScore = (): { totalScore: number; riskLevel: string; riskDescription: string } => {
    let score = 0;

    // Q1: 現在是否持有以下任何投資產品？（每個選項40分）
    if (formData.q1_current_investments.includes("savings")) score += 40;
    if (formData.q1_current_investments.includes("bonds")) score += 40;
    if (formData.q1_current_investments.includes("derivatives")) score += 40;

    // Q2: 預期投資年期（A=10分，B=30分，C=50分）
    if (formData.q2_investment_period === "less_than_1") score += 10;
    else if (formData.q2_investment_period === "1_to_3") score += 30;
    else if (formData.q2_investment_period === "more_than_3") score += 50;

    // Q3: 可以接受的年度價格波幅（A=10分，B=30分，C=50分）
    if (formData.q3_price_volatility === "10_percent") score += 10;
    else if (formData.q3_price_volatility === "20_percent") score += 30;
    else if (formData.q3_price_volatility === "30_percent") score += 50;

    // Q4: 資產淨值中可作投資用途的百分比（A=10分，B=20分，C=30分，D=40分，E=50分）
    if (formData.q4_investment_percentage === "less_than_10") score += 10;
    else if (formData.q4_investment_percentage === "10_to_20") score += 20;
    else if (formData.q4_investment_percentage === "21_to_30") score += 30;
    else if (formData.q4_investment_percentage === "31_to_50") score += 40;
    else if (formData.q4_investment_percentage === "more_than_50") score += 50;

    // Q5: 對金融投資的一般態度（A=10分，B=20分，C=30分，D=40分，E=50分）
    if (formData.q5_investment_attitude === "no_volatility") score += 10;
    else if (formData.q5_investment_attitude === "small_volatility") score += 20;
    else if (formData.q5_investment_attitude === "some_volatility") score += 30;
    else if (formData.q5_investment_attitude === "large_volatility") score += 40;
    else if (formData.q5_investment_attitude === "any_volatility") score += 50;

    // Q6: 對衍生工具產品的認識（A/B/C各40分，D=0分）
    if (formData.q6_derivatives_knowledge.includes("training")) score += 40;
    if (formData.q6_derivatives_knowledge.includes("experience")) score += 40;
    if (formData.q6_derivatives_knowledge.includes("transactions")) score += 40;
    if (formData.q6_derivatives_knowledge.includes("no_knowledge")) score += 0;

    // Q7: 年齡組別（A=20分，B=30分，C=40分，D=20分，E=10分）
    if (formData.q7_age_group === "18_to_25") score += 20;
    else if (formData.q7_age_group === "26_to_35") score += 30;
    else if (formData.q7_age_group === "36_to_50") score += 40;
    else if (formData.q7_age_group === "51_to_64") score += 20;
    else if (formData.q7_age_group === "65_plus") score += 10;

    // Q8: 教育程度（A=10分，B=30分，C=50分）
    if (formData.q8_education_level === "primary_or_below") score += 10;
    else if (formData.q8_education_level === "secondary") score += 30;
    else if (formData.q8_education_level === "tertiary_or_above") score += 50;

    // Q9: 投資知識來源（A=0分，B/C/D各40分）
    if (formData.q9_investment_knowledge_sources.includes("no_interest")) score += 0;
    if (formData.q9_investment_knowledge_sources.includes("discussion")) score += 40;
    if (formData.q9_investment_knowledge_sources.includes("reading")) score += 40;
    if (formData.q9_investment_knowledge_sources.includes("research")) score += 40;

    // Q10: 流動資金需求（A=50分，B=30分，C=20分，D=10分）
    if (formData.q10_liquidity_needs === "no_need") score += 50;
    else if (formData.q10_liquidity_needs === "up_to_30") score += 30;
    else if (formData.q10_liquidity_needs === "30_to_50") score += 20;
    else if (formData.q10_liquidity_needs === "over_50") score += 10;

    // 判定風險等級（根據總分直接對應風險水平）
    let riskLevel = "";
    let riskDescription = "";
    
    if (score <= 99) {
      riskLevel = "Lowest / 最低";
      riskDescription = "You tend to prefer investments with a lowest risk of a decline in value. You are much more interested in preserving the value of your investment than receiving a return on your capital. 您倾向投資跌下降風險最低的投資。您對保存您投資值的興趣遠大於獲取您的資本回報。";
    } else if (score <= 199) {
      riskLevel = "Low / 低";
      riskDescription = "You tend to prefer investments with a low risk of a decline in value. You are more interested in preserving the value of your investment than receiving a return on your capital. 您倾向投資跌下降風險低的投資。您對保存您投資值的興趣大於獲取您的資本回報。";
    } else if (score <= 299) {
      riskLevel = "Low to Medium / 低至中等";
      riskDescription = "You tend to prefer investments with lower risk of a decline in value. However, you do recognize that in order to achieve higher returns, some risks must be incurred and you are prepared to tolerate some fluctuations and volatility in your investment. 您倾向投資跌下降風險較低的投資。然而您亦明白在您達到較高投資回報的過程中必須使一些風險，而您亦已準備接受一些投資上的波動及波幅。";
    } else if (score <= 399) {
      riskLevel = "Medium / 中等";
      riskDescription = "You are willing to place reasonable emphasis on growth investments and are aware that these are liable to fluctuate in value. You can tolerate some fluctuations and volatility, but you tend to stay away from the possibility of dramatic or frequent changes in value. 您著重投資增長的投資值的波動。您雖可以承受一些波動和變動，但您不希望看到有大波動或頁繁變動。";
    } else if (score <= 599) {
      riskLevel = "Medium to High / 中等至高";
      riskDescription = "You have an above-average tolerance to risk and are willing to accept a greater chance of decline in value for the potentially higher returns. 您對風險的承受程度較平均高並願意接受大機會的投資跌值去賺取較高的潛在回報。";
    } else {
      riskLevel = "High / 高";
      riskDescription = "You are willing, and usually eager, to accept a greater chance of a decline in value for potentially higher returns. 您願意並通常渴望接受大機會的投資跌值去賺取較高的潛在回報。";
    }

    return { totalScore: score, riskLevel, riskDescription };
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.q1_current_investments.length === 0) newErrors.q1 = "請至少選擇一項";
    if (!formData.q2_investment_period) newErrors.q2 = "請選擇一項";
    if (!formData.q3_price_volatility) newErrors.q3 = "請選擇一項";
    if (!formData.q4_investment_percentage) newErrors.q4 = "請選擇一項";
    if (!formData.q5_investment_attitude) newErrors.q5 = "請選擇一項";
    if (formData.q6_derivatives_knowledge.length === 0) newErrors.q6 = "請至少選擇一項";
    if (!formData.q7_age_group) newErrors.q7 = "請選擇一項";
    // Q8自動填充，不需要驗證
    if (formData.q9_investment_knowledge_sources.length === 0) newErrors.q9 = "請至少選擇一項";
    if (!formData.q10_liquidity_needs) newErrors.q10 = "請選擇一項";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("請填寫所有必填項");
      return;
    }

    const { totalScore, riskLevel, riskDescription } = calculateScore();
    
    setLoading(true);
    saveMutation.mutate({
      applicationId: applicationId!,
      q1_current_investments: JSON.stringify(formData.q1_current_investments),
      q2_investment_period: formData.q2_investment_period,
      q3_price_volatility: formData.q3_price_volatility,
      q4_investment_percentage: formData.q4_investment_percentage,
      q5_investment_attitude: formData.q5_investment_attitude,
      q6_derivatives_knowledge: JSON.stringify(formData.q6_derivatives_knowledge),
      q7_age_group: formData.q7_age_group,
      q8_education_level: formData.q8_education_level,
      q9_investment_knowledge_sources: JSON.stringify(formData.q9_investment_knowledge_sources),
      q10_liquidity_needs: formData.q10_liquidity_needs,
      totalScore,
      riskLevel,
      riskDescription,
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
                    checked={formData.q1_current_investments.includes("savings")}
                    onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "savings", checked as boolean)}
                  />
                  <label htmlFor="q1-savings" className="text-sm">
                    儲蓄/定期儲蓄/存款證/保本產品
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q1-bonds"
                    checked={formData.q1_current_investments.includes("bonds")}
                    onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "bonds", checked as boolean)}
                  />
                  <label htmlFor="q1-bonds" className="text-sm">
                    債券/證券/單位信託基金/投資相連保險計劃
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q1-derivatives"
                    checked={formData.q1_current_investments.includes("derivatives")}
                    onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "derivatives", checked as boolean)}
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
              <Label className="text-base font-medium">Q2. 預期投資年期是多少？* (可多選)</Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q2-less-than-1"
                    checked={formData.q2_investment_period.includes("less_than_1")}
                    onCheckedChange={(checked) => handleCheckboxChange("q2_investment_period", "less_than_1", checked as boolean)}
                  />
                  <label htmlFor="q2-less-than-1" className="text-sm">沒有或少於1年</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q2-1-to-3"
                    checked={formData.q2_investment_period.includes("1_to_3")}
                    onCheckedChange={(checked) => handleCheckboxChange("q2_investment_period", "1_to_3", checked as boolean)}
                  />
                  <label htmlFor="q2-1-to-3" className="text-sm">1-3年</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q2-more-than-3"
                    checked={formData.q2_investment_period.includes("more_than_3")}
                    onCheckedChange={(checked) => handleCheckboxChange("q2_investment_period", "more_than_3", checked as boolean)}
                  />
                  <label htmlFor="q2-more-than-3" className="text-sm">多於3年</label>
                </div>
              </div>
              {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}
            </div>

            {/* Q3 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q3. 可以接受以下哪個年度價格波幅？* (可多選)</Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q3-10-percent"
                    checked={formData.q3_price_volatility.includes("10_percent")}
                    onCheckedChange={(checked) => handleCheckboxChange("q3_price_volatility", "10_percent", checked as boolean)}
                  />
                  <label htmlFor="q3-10-percent" className="text-sm">價格波幅介乎-10%至+10%</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q3-20-percent"
                    checked={formData.q3_price_volatility.includes("20_percent")}
                    onCheckedChange={(checked) => handleCheckboxChange("q3_price_volatility", "20_percent", checked as boolean)}
                  />
                  <label htmlFor="q3-20-percent" className="text-sm">價格波幅介乎-20%至+20%</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q3-30-percent"
                    checked={formData.q3_price_volatility.includes("30_percent")}
                    onCheckedChange={(checked) => handleCheckboxChange("q3_price_volatility", "30_percent", checked as boolean)}
                  />
                  <label htmlFor="q3-30-percent" className="text-sm">價格波幅多於-30%至多於+30%</label>
                </div>
              </div>
              {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
            </div>

            {/* Q4 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？* (可多選)
              </Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q4-less-than-10"
                    checked={formData.q4_investment_percentage.includes("less_than_10")}
                    onCheckedChange={(checked) => handleCheckboxChange("q4_investment_percentage", "less_than_10", checked as boolean)}
                  />
                  <label htmlFor="q4-less-than-10" className="text-sm">少於10%</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q4-10-to-20"
                    checked={formData.q4_investment_percentage.includes("10_to_20")}
                    onCheckedChange={(checked) => handleCheckboxChange("q4_investment_percentage", "10_to_20", checked as boolean)}
                  />
                  <label htmlFor="q4-10-to-20" className="text-sm">介乎10%至20%</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q4-21-to-30"
                    checked={formData.q4_investment_percentage.includes("21_to_30")}
                    onCheckedChange={(checked) => handleCheckboxChange("q4_investment_percentage", "21_to_30", checked as boolean)}
                  />
                  <label htmlFor="q4-21-to-30" className="text-sm">介乎21%至30%</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q4-31-to-50"
                    checked={formData.q4_investment_percentage.includes("31_to_50")}
                    onCheckedChange={(checked) => handleCheckboxChange("q4_investment_percentage", "31_to_50", checked as boolean)}
                  />
                  <label htmlFor="q4-31-to-50" className="text-sm">介乎31%至50%</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q4-more-than-50"
                    checked={formData.q4_investment_percentage.includes("more_than_50")}
                    onCheckedChange={(checked) => handleCheckboxChange("q4_investment_percentage", "more_than_50", checked as boolean)}
                  />
                  <label htmlFor="q4-more-than-50" className="text-sm">多於50%</label>
                </div>
              </div>
              {errors.q4 && <p className="text-sm text-destructive">{errors.q4}</p>}
            </div>

            {/* Q5 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q5. 以下哪一句子最能貼切描述您對金融投資的一般態度？* (可多選)
              </Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q5-no-volatility"
                    checked={formData.q5_investment_attitude.includes("no_volatility")}
                    onCheckedChange={(checked) => handleCheckboxChange("q5_investment_attitude", "no_volatility", checked as boolean)}
                  />
                  <label htmlFor="q5-no-volatility" className="text-sm">不能接受任何價格波動，並且對賺取投資回報不感興趣</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q5-small-volatility"
                    checked={formData.q5_investment_attitude.includes("small_volatility")}
                    onCheckedChange={(checked) => handleCheckboxChange("q5_investment_attitude", "small_volatility", checked as boolean)}
                  />
                  <label htmlFor="q5-small-volatility" className="text-sm">只能接受較小幅度的價格波動，並且僅希望賺取稍高於銀行存款利率的回報</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q5-some-volatility"
                    checked={formData.q5_investment_attitude.includes("some_volatility")}
                    onCheckedChange={(checked) => handleCheckboxChange("q5_investment_attitude", "some_volatility", checked as boolean)}
                  />
                  <label htmlFor="q5-some-volatility" className="text-sm">可接受若干價格波幅，並希望賺取高於銀行存款利率的回報</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q5-large-volatility"
                    checked={formData.q5_investment_attitude.includes("large_volatility")}
                    onCheckedChange={(checked) => handleCheckboxChange("q5_investment_attitude", "large_volatility", checked as boolean)}
                  />
                  <label htmlFor="q5-large-volatility" className="text-sm">可接受大幅度的價格波動，並希望賺取與股市指數表現相若的回報</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q5-any-volatility"
                    checked={formData.q5_investment_attitude.includes("any_volatility")}
                    onCheckedChange={(checked) => handleCheckboxChange("q5_investment_attitude", "any_volatility", checked as boolean)}
                  />
                  <label htmlFor="q5-any-volatility" className="text-sm">可接受任何幅度的價格波動，並希望回報能跑贏股市指數</label>
                </div>
              </div>
              {errors.q5 && <p className="text-sm text-destructive">{errors.q5}</p>}
            </div>

            {/* Q6 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q6. 對衍生工具產品的認識* (可多選)</Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-training"
                    checked={formData.q6_derivatives_knowledge.includes("training")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "training", checked as boolean)}
                  />
                  <label htmlFor="q6-training" className="text-sm">
                    曾接受有關衍生產品的培訓或修讀相關課程
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-experience"
                    checked={formData.q6_derivatives_knowledge.includes("experience")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "experience", checked as boolean)}
                  />
                  <label htmlFor="q6-experience" className="text-sm">
                    現時或過去擁有與衍生產品有關的工作經驗
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-transactions"
                    checked={formData.q6_derivatives_knowledge.includes("transactions")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "transactions", checked as boolean)}
                  />
                  <label htmlFor="q6-transactions" className="text-sm">
                    於過往3年曾執行5次或以上有關衍生產品的交易
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q6-no-knowledge"
                    checked={formData.q6_derivatives_knowledge.includes("no_knowledge")}
                    onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "no_knowledge", checked as boolean)}
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
              <Label className="text-base font-medium">Q7. 您屬於以下哪個年齡組別？* (可多選)</Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q7-18-to-25"
                    checked={formData.q7_age_group.includes("18_to_25")}
                    onCheckedChange={(checked) => handleCheckboxChange("q7_age_group", "18_to_25", checked as boolean)}
                  />
                  <label htmlFor="q7-18-to-25" className="text-sm">介乎18至25歲</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q7-26-to-35"
                    checked={formData.q7_age_group.includes("26_to_35")}
                    onCheckedChange={(checked) => handleCheckboxChange("q7_age_group", "26_to_35", checked as boolean)}
                  />
                  <label htmlFor="q7-26-to-35" className="text-sm">介乎26至35歲</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q7-36-to-50"
                    checked={formData.q7_age_group.includes("36_to_50")}
                    onCheckedChange={(checked) => handleCheckboxChange("q7_age_group", "36_to_50", checked as boolean)}
                  />
                  <label htmlFor="q7-36-to-50" className="text-sm">介乎36至50歲</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q7-51-to-64"
                    checked={formData.q7_age_group.includes("51_to_64")}
                    onCheckedChange={(checked) => handleCheckboxChange("q7_age_group", "51_to_64", checked as boolean)}
                  />
                  <label htmlFor="q7-51-to-64" className="text-sm">介乎51至64歲</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q7-65-plus"
                    checked={formData.q7_age_group.includes("65_plus")}
                    onCheckedChange={(checked) => handleCheckboxChange("q7_age_group", "65_plus", checked as boolean)}
                  />
                  <label htmlFor="q7-65-plus" className="text-sm">65歲或以上</label>
                </div>
              </div>
              {errors.q7 && <p className="text-sm text-destructive">{errors.q7}</p>}
            </div>

            {/* Q8 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q8. 您的教育程度是？* (可多選)</Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q8-primary-or-below"
                    checked={formData.q8_education_level.includes("primary_or_below")}
                    onCheckedChange={(checked) => handleCheckboxChange("q8_education_level", "primary_or_below", checked as boolean)}
                  />
                  <label htmlFor="q8-primary-or-below" className="text-sm">小學或以下</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q8-secondary"
                    checked={formData.q8_education_level.includes("secondary")}
                    onCheckedChange={(checked) => handleCheckboxChange("q8_education_level", "secondary", checked as boolean)}
                  />
                  <label htmlFor="q8-secondary" className="text-sm">中學</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q8-tertiary-or-above"
                    checked={formData.q8_education_level.includes("tertiary_or_above")}
                    onCheckedChange={(checked) => handleCheckboxChange("q8_education_level", "tertiary_or_above", checked as boolean)}
                  />
                  <label htmlFor="q8-tertiary-or-above" className="text-sm">大專或以上</label>
                </div>
              </div>
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
                    checked={formData.q9_investment_knowledge_sources.includes("no_interest")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investment_knowledge_sources", "no_interest", checked as boolean)}
                  />
                  <label htmlFor="q9-no-interest" className="text-sm">
                    從未汲取及/或沒有興趣汲取任何投資知識
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q9-discussion"
                    checked={formData.q9_investment_knowledge_sources.includes("discussion")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investment_knowledge_sources", "discussion", checked as boolean)}
                  />
                  <label htmlFor="q9-discussion" className="text-sm">
                    與親友及/或同事討論投資或理財話題
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q9-reading"
                    checked={formData.q9_investment_knowledge_sources.includes("reading")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investment_knowledge_sources", "reading", checked as boolean)}
                  />
                  <label htmlFor="q9-reading" className="text-sm">
                    閱讀及/或收聽有關投資或財經新聞
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q9-research"
                    checked={formData.q9_investment_knowledge_sources.includes("research")}
                    onCheckedChange={(checked) => handleCheckboxChange("q9_investment_knowledge_sources", "research", checked as boolean)}
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
                Q10. 您需要將多少投資兌現，以滿足突發事件的流動資金需求？* (可多選)
              </Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q10-no-need"
                    checked={formData.q10_liquidity_needs.includes("no_need")}
                    onCheckedChange={(checked) => handleCheckboxChange("q10_liquidity_needs", "no_need", checked as boolean)}
                  />
                  <label htmlFor="q10-no-need" className="text-sm">不需要出售任何投資</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q10-up-to-30"
                    checked={formData.q10_liquidity_needs.includes("up_to_30")}
                    onCheckedChange={(checked) => handleCheckboxChange("q10_liquidity_needs", "up_to_30", checked as boolean)}
                  />
                  <label htmlFor="q10-up-to-30" className="text-sm">我會出售不超過30%的投資</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q10-30-to-50"
                    checked={formData.q10_liquidity_needs.includes("30_to_50")}
                    onCheckedChange={(checked) => handleCheckboxChange("q10_liquidity_needs", "30_to_50", checked as boolean)}
                  />
                  <label htmlFor="q10-30-to-50" className="text-sm">我會出售超過30%但不到50%的投資</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="q10-over-50"
                    checked={formData.q10_liquidity_needs.includes("over_50")}
                    onCheckedChange={(checked) => handleCheckboxChange("q10_liquidity_needs", "over_50", checked as boolean)}
                  />
                  <label htmlFor="q10-over-50" className="text-sm">我會出售超過50%的投資</label>
                </div>
              </div>
              {errors.q10 && <p className="text-sm text-destructive">{errors.q10}</p>}
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/application/${applicationId}/step/7`)}
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
