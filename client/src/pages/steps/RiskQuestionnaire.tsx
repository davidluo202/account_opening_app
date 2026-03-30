import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ApplicationWizard from "@/components/ApplicationWizard";


interface FormData {
  // PART 1: 適用於全部客戶 (Q1-Q6)
  q1_current_investments: string[]; // 多選
  q2_investment_period: string; // 單選
  q3_price_volatility: string; // 單選
  q4_investment_percentage: string; // 單選
  q5_investment_attitude: string; // 單選
  q6_derivatives_knowledge: string[]; // 多選
  
  // PART 2: 適用公司客戶 (Q7-Q10)
  q7_age_group: string; // 單選 - 投資金額
  q8_education_level: string; // 單選 - 高風險比例
  q9_investment_knowledge_sources: string; // 單選 - 專業投資人員
  q10_liquidity_needs: string; // 單選 - 營運開支儲備
  
  // 評分結果
  totalScore: number;
  riskLevel: string;
  riskDescription: string; // 風險等級描述
}

export default function RiskQuestionnaire() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const params = useParams<{ id: string; step?: string }>();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "5");
  const [formData, setFormData] = useState<FormData>({
    q1_current_investments: [],
    q2_investment_period: "",
    q3_price_volatility: "",
    q4_investment_percentage: "",
    q5_investment_attitude: "",
    q6_derivatives_knowledge: [],
    q7_age_group: "",
    q8_education_level: "",
    q9_investment_knowledge_sources: "",
    q10_liquidity_needs: "",
    totalScore: 0,
    riskLevel: "",
    riskDescription: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});



  // 載入已保存的數據
  const { data: savedData, isLoading: loadingData, error: savedDataError } = trpc.riskQuestionnaire.get.useQuery(
    { applicationId: applicationId },
    { 
      enabled: applicationId > 0,
      retry: false,
      throwOnError: false,
    }
  );

  // 獲取客戶類型
  const { data: accountSelection, error: accountError } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { 
      enabled: applicationId > 0,
      retry: false,
      throwOnError: false,
    }
  );
  const isCorporate = accountSelection?.customerType === 'corporate';

  useEffect(() => {
    if (savedData) {
      try {
        // 安全解析 JSON 字段
        let q1 = [];
        let q6 = [];
        let q9 = [];
        
        try {
          q1 = savedData.q1_current_investments ? JSON.parse(savedData.q1_current_investments) : [];
        } catch (e) { console.error("Parse q1 error", e); }
        
        try {
          q6 = savedData.q6_derivatives_knowledge ? JSON.parse(savedData.q6_derivatives_knowledge) : [];
        } catch (e) { console.error("Parse q6 error", e); }
        
        try {
          q9 = savedData.q9_investment_knowledge_sources || "";
        } catch (e) { console.error("Parse q9 error", e); }
        
        setFormData({
          q1_current_investments: q1,
          q2_investment_period: savedData.q2_investment_period || "",
          q3_price_volatility: savedData.q3_price_volatility || "",
          q4_investment_percentage: savedData.q4_investment_percentage || "",
          q5_investment_attitude: savedData.q5_investment_attitude || "",
          q6_derivatives_knowledge: q6,
          q7_age_group: savedData.q7_age_group || "",
          q8_education_level: savedData.q8_education_level || "",
          q9_investment_knowledge_sources: typeof q9 === 'string' ? q9 : (Array.isArray(q9) ? q9[0] || '' : ''),
          q10_liquidity_needs: savedData.q10_liquidity_needs || "",
          totalScore: savedData.totalScore || 0,
          riskLevel: savedData.riskLevel || "",
          riskDescription: savedData.riskDescription || "",
        });
      } catch (e) {
        console.error("Failed to parse saved risk questionnaire data:", e);
      }
    }
  }, [savedData]);

  // 保存mutation
  const saveMutation = trpc.riskQuestionnaire.save.useMutation({
    onSuccess: () => {
      toast.success("風險評估問卷已保存");
      setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
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

    // Q7: 投資金額（A=10分，B=30分，C=40分，D=50分）
    if (formData.q7_age_group === "less_than_1m") score += 10;
    else if (formData.q7_age_group === "1m_to_5m") score += 30;
    else if (formData.q7_age_group === "5m_to_10m") score += 40;
    else if (formData.q7_age_group === "over_10m") score += 50;

    // Q8: 高風險比例（A=10分，B=30分，C=40分，D=50分）
    if (formData.q8_education_level === "less_than_25") score += 10;
    else if (formData.q8_education_level === "25_to_50") score += 30;
    else if (formData.q8_education_level === "51_to_75") score += 40;
    else if (formData.q8_education_level === "over_75") score += 50;

    // Q9: 專業投資人員（A=10分，B=30分，C=40分，D=50分）
    if (formData.q9_investment_knowledge_sources === "no_no_knowledge") score += 10;
    else if (formData.q9_investment_knowledge_sources === "no_adequate_knowledge") score += 30;
    else if (formData.q9_investment_knowledge_sources === "yes_little_knowledge") score += 40;
    else if (formData.q9_investment_knowledge_sources === "yes_adequate_knowledge") score += 50;

    // Q10: 營運開支儲備（A=10分，B=30分，C=40分，D=50分）
    if (formData.q10_liquidity_needs === "less_than_3m") score += 10;
    else if (formData.q10_liquidity_needs === "3m_to_6m") score += 30;
    else if (formData.q10_liquidity_needs === "6m_to_12m") score += 40;
    else if (formData.q10_liquidity_needs === "12m_plus") score += 50;

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
    if (!formData.q8_education_level) newErrors.q8 = "請選擇一項";
    if (!formData.q9_investment_knowledge_sources) newErrors.q9 = "請選擇一項";
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
    
    // 更新formData以顯示風險等級結果
    setFormData(prev => ({
      ...prev,
      totalScore,
      riskLevel,
      riskDescription
    }));
    
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
      q9_investment_knowledge_sources: formData.q9_investment_knowledge_sources,
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

  // Safe check for rendering
  if (!applicationId || applicationId === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Invalid application ID</p>
      </div>
    );
  }

  return (
    <ApplicationWizard 
      currentStep={stepNum} 
      applicationId={applicationId}
      onNext={handleSubmit}
      isNextDisabled={loading || saveMutation.isPending}
      isNextLoading={loading || saveMutation.isPending}
      customerTypeOverride={isCorporate ? 'corporate' : 'individual'}
    >
      <div>
        <h3 className="text-xl font-semibold mb-2">風險評估問卷 / Risk Profile Questionnaire</h3>
        {isCorporate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">機構客戶風險評估問卷 - 前6題與個人相同，後續為機構專業題目</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-6">
          請根據您的實際情況填寫以下問卷，以評估您的風險承受能力
        </p>
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
              <Label className="text-base font-medium">Q2. 預期投資年期是多少？*</Label>
              <RadioGroup
                value={formData.q2_investment_period}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q2_investment_period: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_than_1" id="q2-less-than-1" />
                  <Label htmlFor="q2-less-than-1">沒有或少於1年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1_to_3" id="q2-1-to-3" />
                  <Label htmlFor="q2-1-to-3">1-3年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more_than_3" id="q2-more-than-3" />
                  <Label htmlFor="q2-more-than-3">多於3年</Label>
                </div>
              </RadioGroup>
              {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}
            </div>

            {/* Q3 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Q3. 可以接受以下哪個年度價格波幅？*</Label>
              <RadioGroup
                value={formData.q3_price_volatility}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q3_price_volatility: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10_percent" id="q3-10-percent" />
                  <Label htmlFor="q3-10-percent">價格波幅介乎-10%至+10%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="20_percent" id="q3-20-percent" />
                  <Label htmlFor="q3-20-percent">價格波幅介乎-20%至+20%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30_percent" id="q3-30-percent" />
                  <Label htmlFor="q3-30-percent">價格波幅多於-30%至多於+30%</Label>
                </div>
              </RadioGroup>
              {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
            </div>

            {/* Q4 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q4. 在現時資產淫值中(撤除自住物業價值)，有多少個百分比可作投資用途？*
              </Label>
              <RadioGroup
                value={formData.q4_investment_percentage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q4_investment_percentage: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_than_10" id="q4-less-than-10" />
                  <Label htmlFor="q4-less-than-10">少於10%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10_to_20" id="q4-10-to-20" />
                  <Label htmlFor="q4-10-to-20">介乎10%至20%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="21_to_30" id="q4-21-to-30" />
                  <Label htmlFor="q4-21-to-30">介乎21%至30%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="31_to_50" id="q4-31-to-50" />
                  <Label htmlFor="q4-31-to-50">介乎31%至50%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more_than_50" id="q4-more-than-50" />
                  <Label htmlFor="q4-more-than-50">多於50%</Label>
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
                value={formData.q5_investment_attitude}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q5_investment_attitude: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_volatility" id="q5-no-volatility" />
                  <Label htmlFor="q5-no-volatility">不能接受任何價格波動，並且對賭取投資回報不感興趣</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small_volatility" id="q5-small-volatility" />
                  <Label htmlFor="q5-small-volatility">只能接受較小幅度的價格波動，並且僅希望賭取稍高於銀行存款利率的回報</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="some_volatility" id="q5-some-volatility" />
                  <Label htmlFor="q5-some-volatility">可接受若干價格波幅，並希望賭取高於銀行存款利率的回報</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large_volatility" id="q5-large-volatility" />
                  <Label htmlFor="q5-large-volatility">可接受大幅度的價格波動，並希望賭取與股市指數表現相若的回報</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any_volatility" id="q5-any-volatility" />
                  <Label htmlFor="q5-any-volatility">可接受任何幅度的價格波動，並希望回報能跑贏股市指數</Label>
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

          {/* PART 2: 適用公司客戶 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">PART 2: 適用公司客戶</h3>

            {/* Q7 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q7. 貴公司預留多少資金用在投資期內的投資?*
              </Label>
              <RadioGroup
                value={formData.q7_age_group}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q7_age_group: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_than_1m" id="q7-less-than-1m" />
                  <Label htmlFor="q7-less-than-1m">A. 少於港幣$1,000,000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1m_to_5m" id="q7-1m-to-5m" />
                  <Label htmlFor="q7-1m-to-5m">B. 介乎港幣$1,000,001至港幣$5,000,000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5m_to_10m" id="q7-5m-to-10m" />
                  <Label htmlFor="q7-5m-to-10m">C. 介乎港幣$5,000,001至港幣$10,000,000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over_10m" id="q7-over-10m" />
                  <Label htmlFor="q7-over-10m">D. 多於港幣$10,000,000</Label>
                </div>
              </RadioGroup>
              {errors.q7 && <p className="text-sm text-destructive">{errors.q7}</p>}
            </div>

            {/* Q8 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q8. 貴公司會把多少比例的資產投資於較高風險的投資項目？（如：窩輪，牛熊證等）*
              </Label>
              <RadioGroup
                value={formData.q8_education_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q8_education_level: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_than_25" id="q8-less-than-25" />
                  <Label htmlFor="q8-less-than-25">A. 少於25%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="25_to_50" id="q8-25-to-50" />
                  <Label htmlFor="q8-25-to-50">B. 介乎25%至50%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="51_to_75" id="q8-51-to-75" />
                  <Label htmlFor="q8-51-to-75">C. 介乎51%至75%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over_75" id="q8-over-75" />
                  <Label htmlFor="q8-over-75">D. 多於75%</Label>
                </div>
              </RadioGroup>
              {errors.q8 && <p className="text-sm text-destructive">{errors.q8}</p>}
            </div>

            {/* Q9 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q9. 貴公司是否聘用專業人員負責作出投資決定?*
              </Label>
              <RadioGroup
                value={formData.q9_investment_knowledge_sources}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_no_knowledge" id="q9-no-no-knowledge" />
                  <Label htmlFor="q9-no-no-knowledge">A. 否，本公司對投資決定沒有相關知識。</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_adequate_knowledge" id="q9-no-adequate" />
                  <Label htmlFor="q9-no-adequate">B. 否，但本公司對投資決定有足夠相關知識。</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes_little_knowledge" id="q9-yes-little" />
                  <Label htmlFor="q9-yes-little">C. 是，但本公司對投資決定只有一些或少許相關知識。</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes_adequate_knowledge" id="q9-yes-adequate" />
                  <Label htmlFor="q9-yes-adequate">D. 是，本公司有足夠相關知識的管理層作出投資決定。</Label>
                </div>
              </RadioGroup>
              {errors.q9 && <p className="text-sm text-destructive">{errors.q9}</p>}
            </div>

            {/* Q10 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q10. 在一般情況下，貴公司會預留多少流動資金(當中包括現金、外幣、銀行存款等)作為每月營運開支儲備?*
              </Label>
              <RadioGroup
                value={formData.q10_liquidity_needs}
                onValueChange={(value) => setFormData(prev => ({ ...prev, q10_liquidity_needs: value }))}
                className="space-y-2 pl-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_than_3m" id="q10-less-than-3m" />
                  <Label htmlFor="q10-less-than-3m">A. 少於3個月的營運開支儲備</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3m_to_6m" id="q10-3m-to-6m" />
                  <Label htmlFor="q10-3m-to-6m">B. 3個月至6個月的營運開支儲備</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6m_to_12m" id="q10-6m-to-12m" />
                  <Label htmlFor="q10-6m-to-12m">C. 6個月至12個月的營運開支儲備</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12m_plus" id="q10-12m-plus" />
                  <Label htmlFor="q10-12m-plus">D. 12個月以上的營運開支儲備</Label>
                </div>
              </RadioGroup>
              {errors.q10 && <p className="text-sm text-destructive">{errors.q10}</p>}
            </div>
          </div>

          {/* 風險等級結果顯示 */}
          {formData.riskLevel && formData.riskDescription && (
            <div className="mt-8 p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
              <h3 className="text-lg font-semibold mb-4 text-primary">您的風險評估結果</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">總分：</span>
                  <span className="text-2xl font-bold text-primary">{formData.totalScore || 0}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">風險等級：</span>
                  <span className="text-xl font-semibold text-primary">{formData.riskLevel}</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">投資取向：</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{formData.riskDescription}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </ApplicationWizard>
  );
}
