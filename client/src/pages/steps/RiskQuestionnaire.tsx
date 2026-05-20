import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { CardContent } from "@/components/ui/card";
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

  // PART 2: 適用於個人/聯名客戶 (Q7-Q10)
  q7_age_group: string; // 單選 - 年齡組別
  q8_education_level: string; // 單選 - 教育程度
  q9_investment_knowledge_sources: string[]; // 多選 - 投資知識來源
  q10_liquidity_needs: string; // 單選 - 流動資金需求

  // 評分結果
  totalScore: number;
  riskLevel: string;
  riskDescription: string; // 風險等級描述
}

// Corporate questionnaire state
interface CorporateFormData {
  // PART 1 (Q1-Q6)
  cq1_current_investments: string[]; // 多選
  cq2_investment_period: string; // 單選
  cq3_price_volatility: string; // 單選
  cq4_investment_percentage: string; // 單選
  cq5_investment_attitude: string; // 單選
  cq6_derivatives_knowledge: string[]; // 多選
  // PART 2 (Q7-Q10)
  cq7_investment_amount: string; // 單選
  cq8_high_risk_percentage: string; // 單選
  cq9_dedicated_professionals: string; // 單選
  cq10_liquid_reserves: string; // 單選
  // 評分結果
  totalScore: number;
  riskLevel: string;
  riskDescription: string;
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
    q9_investment_knowledge_sources: [],
    q10_liquidity_needs: "",
    totalScore: 0,
    riskLevel: "",
    riskDescription: "",
  });
  const [corpFormData, setCorpFormData] = useState<CorporateFormData>({
    cq1_current_investments: [],
    cq2_investment_period: "",
    cq3_price_volatility: "",
    cq4_investment_percentage: "",
    cq5_investment_attitude: "",
    cq6_derivatives_knowledge: [],
    cq7_investment_amount: "",
    cq8_high_risk_percentage: "",
    cq9_dedicated_professionals: "",
    cq10_liquid_reserves: "",
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
  const isJoint = accountSelection?.customerType === 'joint';

  // Joint account: second holder risk questionnaire
  const [secondFormData, setSecondFormData] = useState<FormData>({
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

  // Load existing second holder data
  const { data: existingSecondHolder } = trpc.secondHolder.get.useQuery(
    { applicationId, stepName: 'riskQuestionnaire' },
    { enabled: !!applicationId && isJoint }
  );
  const saveSecondHolderMutation = trpc.secondHolder.save.useMutation();

  useEffect(() => {
    if (existingSecondHolder && typeof existingSecondHolder === 'object') {
      setSecondFormData(prev => ({ ...prev, ...(existingSecondHolder as any) }));
    }
  }, [existingSecondHolder]);

  const handleSecondCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    setSecondFormData(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  useEffect(() => {
    if (savedData) {
      try {
        // 安全解析 JSON 字段
        let q1: string[] = [];
        let q6: string[] = [];
        let q9: string[] = [];

        try {
          q1 = savedData.q1_current_investments ? JSON.parse(savedData.q1_current_investments) : [];
        } catch (e) { console.error("Parse q1 error", e); }

        try {
          q6 = savedData.q6_derivatives_knowledge ? JSON.parse(savedData.q6_derivatives_knowledge) : [];
        } catch (e) { console.error("Parse q6 error", e); }

        try {
          const raw9 = savedData.q9_investment_knowledge_sources || "";
          q9 = raw9 ? JSON.parse(raw9) : [];
          if (!Array.isArray(q9)) q9 = raw9 ? [raw9] : [];
        } catch (e) {
          const raw9 = savedData.q9_investment_knowledge_sources || "";
          q9 = raw9 ? [raw9] : [];
        }

        // For corporate accounts, load into corpFormData
        if (isCorporate) {
          setCorpFormData({
            cq1_current_investments: q1,
            cq2_investment_period: savedData.q2_investment_period || "",
            cq3_price_volatility: savedData.q3_price_volatility || "",
            cq4_investment_percentage: savedData.q4_investment_percentage || "",
            cq5_investment_attitude: savedData.q5_investment_attitude || "",
            cq6_derivatives_knowledge: q6,
            cq7_investment_amount: savedData.q7_age_group || "",
            cq8_high_risk_percentage: savedData.q8_education_level || "",
            cq9_dedicated_professionals: savedData.q9_investment_knowledge_sources ? (Array.isArray(q9) && q9.length > 0 ? q9[0] : "") : "",
            cq10_liquid_reserves: savedData.q10_liquidity_needs || "",
            totalScore: savedData.totalScore || 0,
            riskLevel: savedData.riskLevel || "",
            riskDescription: savedData.riskDescription || "",
          });
        } else {
          setFormData({
            q1_current_investments: q1,
            q2_investment_period: savedData.q2_investment_period || "",
            q3_price_volatility: savedData.q3_price_volatility || "",
            q4_investment_percentage: savedData.q4_investment_percentage || "",
            q5_investment_attitude: savedData.q5_investment_attitude || "",
            q6_derivatives_knowledge: q6,
            q7_age_group: savedData.q7_age_group || "",
            q8_education_level: savedData.q8_education_level || "",
            q9_investment_knowledge_sources: Array.isArray(q9) ? q9 : [],
            q10_liquidity_needs: savedData.q10_liquidity_needs || "",
            totalScore: savedData.totalScore || 0,
            riskLevel: savedData.riskLevel || "",
            riskDescription: savedData.riskDescription || "",
          });
        }
      } catch (e) {
        console.error("Failed to parse saved risk questionnaire data:", e);
      }
    }
  }, [savedData, isCorporate]);

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

  // 計算評分 - 個人
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

    // Q7: 年齡組別（A=20, B=30, C=40, D=20, E=10）
    if (formData.q7_age_group === "age_18_25") score += 20;
    else if (formData.q7_age_group === "age_26_35") score += 30;
    else if (formData.q7_age_group === "age_36_50") score += 40;
    else if (formData.q7_age_group === "age_51_64") score += 20;
    else if (formData.q7_age_group === "age_65_plus") score += 10;

    // Q8: 教育程度（A=10, B=30, C=50）
    if (formData.q8_education_level === "primary_or_below") score += 10;
    else if (formData.q8_education_level === "secondary") score += 30;
    else if (formData.q8_education_level === "post_secondary") score += 50;

    // Q9: 投資知識來源（多選，A=0，B/C/D各40）
    if (formData.q9_investment_knowledge_sources.includes("never")) {
      score += 0;
    } else {
      if (formData.q9_investment_knowledge_sources.includes("relatives")) score += 40;
      if (formData.q9_investment_knowledge_sources.includes("media")) score += 40;
      if (formData.q9_investment_knowledge_sources.includes("courses")) score += 40;
    }

    // Q10: 流動資金需求（A=50, B=30, C=10, D=10）
    if (formData.q10_liquidity_needs === "no_sell") score += 50;
    else if (formData.q10_liquidity_needs === "sell_less_30") score += 30;
    else if (formData.q10_liquidity_needs === "sell_30_50") score += 20;
    else if (formData.q10_liquidity_needs === "sell_more_50") score += 10;

    return getRiskLevel(score);
  };

  // 計算評分 - 機構
  const calculateCorpScore = (): { totalScore: number; riskLevel: string; riskDescription: string } => {
    let score = 0;

    // CQ1: 現在是否持有以下任何投資產品？（每個選項40分）
    if (corpFormData.cq1_current_investments.includes("savings")) score += 40;
    if (corpFormData.cq1_current_investments.includes("bonds")) score += 40;
    if (corpFormData.cq1_current_investments.includes("derivatives")) score += 40;

    // CQ2: 預期投資年期
    if (corpFormData.cq2_investment_period === "less_than_1") score += 10;
    else if (corpFormData.cq2_investment_period === "1_to_3") score += 30;
    else if (corpFormData.cq2_investment_period === "more_than_3") score += 50;

    // CQ3: 年度價格波幅
    if (corpFormData.cq3_price_volatility === "10_percent") score += 10;
    else if (corpFormData.cq3_price_volatility === "20_percent") score += 30;
    else if (corpFormData.cq3_price_volatility === "30_percent") score += 50;

    // CQ4: 資產淨值投資百分比
    if (corpFormData.cq4_investment_percentage === "less_than_10") score += 10;
    else if (corpFormData.cq4_investment_percentage === "10_to_20") score += 20;
    else if (corpFormData.cq4_investment_percentage === "21_to_30") score += 30;
    else if (corpFormData.cq4_investment_percentage === "31_to_50") score += 40;
    else if (corpFormData.cq4_investment_percentage === "more_than_50") score += 50;

    // CQ5: 對金融投資態度
    if (corpFormData.cq5_investment_attitude === "no_volatility") score += 10;
    else if (corpFormData.cq5_investment_attitude === "small_volatility") score += 20;
    else if (corpFormData.cq5_investment_attitude === "some_volatility") score += 30;
    else if (corpFormData.cq5_investment_attitude === "large_volatility") score += 40;
    else if (corpFormData.cq5_investment_attitude === "any_volatility") score += 50;

    // CQ6: 對衍生工具產品的認識（A/B/C各40分，D=0分）
    if (corpFormData.cq6_derivatives_knowledge.includes("training")) score += 40;
    if (corpFormData.cq6_derivatives_knowledge.includes("experience")) score += 40;
    if (corpFormData.cq6_derivatives_knowledge.includes("transactions")) score += 40;

    // CQ7: 預留投資資金（A=10, B=30, C=40, D=50）
    if (corpFormData.cq7_investment_amount === "less_than_1m") score += 10;
    else if (corpFormData.cq7_investment_amount === "1m_to_5m") score += 30;
    else if (corpFormData.cq7_investment_amount === "5m_to_10m") score += 40;
    else if (corpFormData.cq7_investment_amount === "more_than_10m") score += 50;

    // CQ8: 高風險投資比例（A=10, B=30, C=40, D=50）
    if (corpFormData.cq8_high_risk_percentage === "less_than_25") score += 10;
    else if (corpFormData.cq8_high_risk_percentage === "25_to_50") score += 30;
    else if (corpFormData.cq8_high_risk_percentage === "51_to_75") score += 40;
    else if (corpFormData.cq8_high_risk_percentage === "more_than_75") score += 50;

    // CQ9: 是否聘用專業人員（A=10, B=30, C=40, D=50）
    if (corpFormData.cq9_dedicated_professionals === "no_no_knowledge") score += 10;
    else if (corpFormData.cq9_dedicated_professionals === "no_adequate_knowledge") score += 30;
    else if (corpFormData.cq9_dedicated_professionals === "yes_some_knowledge") score += 40;
    else if (corpFormData.cq9_dedicated_professionals === "yes_adequate_management") score += 50;

    // CQ10: 流動資金儲備（A=10, B=30, C=40, D=50）
    if (corpFormData.cq10_liquid_reserves === "less_than_3_months") score += 10;
    else if (corpFormData.cq10_liquid_reserves === "3_to_6_months") score += 30;
    else if (corpFormData.cq10_liquid_reserves === "6_to_12_months") score += 40;
    else if (corpFormData.cq10_liquid_reserves === "more_than_12_months") score += 50;

    return getRiskLevel(score);
  };

  // 判定風險等級
  const getRiskLevel = (score: number): { totalScore: number; riskLevel: string; riskDescription: string } => {
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

    if (isCorporate) {
      if (corpFormData.cq1_current_investments.length === 0) newErrors.q1 = "請至少選擇一項";
      if (!corpFormData.cq2_investment_period) newErrors.q2 = "請選擇一項";
      if (!corpFormData.cq3_price_volatility) newErrors.q3 = "請選擇一項";
      if (!corpFormData.cq4_investment_percentage) newErrors.q4 = "請選擇一項";
      if (!corpFormData.cq5_investment_attitude) newErrors.q5 = "請選擇一項";
      if (corpFormData.cq6_derivatives_knowledge.length === 0) newErrors.q6 = "請至少選擇一項";
      if (!corpFormData.cq7_investment_amount) newErrors.q7 = "請選擇一項";
      if (!corpFormData.cq8_high_risk_percentage) newErrors.q8 = "請選擇一項";
      if (!corpFormData.cq9_dedicated_professionals) newErrors.q9 = "請選擇一項";
      if (!corpFormData.cq10_liquid_reserves) newErrors.q10 = "請選擇一項";
    } else {
      if (formData.q1_current_investments.length === 0) newErrors.q1 = "請至少選擇一項";
      if (!formData.q2_investment_period) newErrors.q2 = "請選擇一項";
      if (!formData.q3_price_volatility) newErrors.q3 = "請選擇一項";
      if (!formData.q4_investment_percentage) newErrors.q4 = "請選擇一項";
      if (!formData.q5_investment_attitude) newErrors.q5 = "請選擇一項";
      if (formData.q6_derivatives_knowledge.length === 0) newErrors.q6 = "請至少選擇一項";
      if (!formData.q7_age_group) newErrors.q7 = "請選擇一項";
      if (!formData.q8_education_level) newErrors.q8 = "請選擇一項";
      if (formData.q9_investment_knowledge_sources.length === 0) newErrors.q9 = "請至少選擇一項";
      if (!formData.q10_liquidity_needs) newErrors.q10 = "請選擇一項";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("請填寫所有必填項");
      return;
    }

    if (isCorporate) {
      const { totalScore, riskLevel, riskDescription } = calculateCorpScore();

      setCorpFormData(prev => ({
        ...prev,
        totalScore,
        riskLevel,
        riskDescription
      }));

      setLoading(true);
      saveMutation.mutate({
        applicationId: applicationId!,
        q1_current_investments: JSON.stringify(corpFormData.cq1_current_investments),
        q2_investment_period: corpFormData.cq2_investment_period,
        q3_price_volatility: corpFormData.cq3_price_volatility,
        q4_investment_percentage: corpFormData.cq4_investment_percentage,
        q5_investment_attitude: corpFormData.cq5_investment_attitude,
        q6_derivatives_knowledge: JSON.stringify(corpFormData.cq6_derivatives_knowledge),
        q7_age_group: corpFormData.cq7_investment_amount,
        q8_education_level: corpFormData.cq8_high_risk_percentage,
        q9_investment_knowledge_sources: JSON.stringify([corpFormData.cq9_dedicated_professionals]),
        q10_liquidity_needs: corpFormData.cq10_liquid_reserves,
        totalScore,
        riskLevel,
        riskDescription,
      });
    } else {
      const { totalScore, riskLevel, riskDescription } = calculateScore();

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
        q9_investment_knowledge_sources: JSON.stringify(formData.q9_investment_knowledge_sources),
        q10_liquidity_needs: formData.q10_liquidity_needs,
        totalScore,
        riskLevel,
        riskDescription,
      });
    }

    if (isJoint) {
      saveSecondHolderMutation.mutate({ applicationId: applicationId!, stepName: 'riskQuestionnaire', data: { ...secondFormData } });
    }
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

  // 處理機構多選框變更
  const handleCorpCheckboxChange = (field: keyof CorporateFormData, value: string, checked: boolean) => {
    setCorpFormData(prev => {
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

  // Render corporate questionnaire
  const renderCorporateQuestionnaire = () => (
    <div>
      <h3 className="text-xl font-semibold mb-2">風險評估問卷 / Risk Profile Questionnaire</h3>
      <p className="text-sm text-muted-foreground mb-6">
        請根據貴公司的實際情況填寫以下問卷，以評估風險承受能力
      </p>
      <CardContent className="space-y-8">
        {/* PART 1: Q1-Q6 */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">PART 1</h3>

          {/* CQ1 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q1. 您/貴公司現在是否持有以下任何投資產品？(您/貴公司可選擇多於一項)*
            </Label>
            <p className="text-sm text-muted-foreground">
              Are you / your company currently holding any of the below investment products? (You may select more than one option)
            </p>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq1-savings"
                  checked={corpFormData.cq1_current_investments.includes("savings")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq1_current_investments", "savings", checked as boolean)}
                />
                <label htmlFor="cq1-savings" className="text-sm">
                  <span className="block">儲蓄/定期儲蓄/存款證/保本產品</span>
                  <span className="block text-xs text-muted-foreground">Savings/Fixed Deposits/Certificate of Deposits/Capital Protected Products</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq1-bonds"
                  checked={corpFormData.cq1_current_investments.includes("bonds")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq1_current_investments", "bonds", checked as boolean)}
                />
                <label htmlFor="cq1-bonds" className="text-sm">
                  <span className="block">債券/證券/單位信託基金/投資相連保險計劃</span>
                  <span className="block text-xs text-muted-foreground">Bonds/Stocks/Unit Trusts/Investment-Linked Insurance Plans</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq1-derivatives"
                  checked={corpFormData.cq1_current_investments.includes("derivatives")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq1_current_investments", "derivatives", checked as boolean)}
                />
                <label htmlFor="cq1-derivatives" className="text-sm">
                  <span className="block">期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資</span>
                  <span className="block text-xs text-muted-foreground">Futures/Options/Derivatives/Structured investment products/Linked Deposits/Leveraged FX Trading</span>
                </label>
              </div>
            </div>
            {errors.q1 && <p className="text-sm text-destructive">{errors.q1}</p>}
          </div>

          {/* CQ2 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q2. 當投資於投資產品時，預期投資年期是多少？*
            </Label>
            <p className="text-sm text-muted-foreground">
              How long is the expected Investment horizon when investing in investment products?
            </p>
            <RadioGroup
              value={corpFormData.cq2_investment_period}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq2_investment_period: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_1" id="cq2-less-than-1" />
                <label htmlFor="cq2-less-than-1" className="text-sm">
                  <span className="block">沒有或少於1年</span>
                  <span className="block text-xs text-muted-foreground font-normal">None or less than 1 year</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="1_to_3" id="cq2-1-to-3" />
                <label htmlFor="cq2-1-to-3" className="text-sm">
                  <span className="block">1-3年</span>
                  <span className="block text-xs text-muted-foreground font-normal">1-3 years</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_3" id="cq2-more-than-3" />
                <label htmlFor="cq2-more-than-3" className="text-sm">
                  <span className="block">多於3年</span>
                  <span className="block text-xs text-muted-foreground font-normal">Over 3 years</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}
          </div>

          {/* CQ3 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q3. 一般而言，預期愈高回報，亦會涉及較高的價格波幅。您/貴公司可以接受以下哪個年度價格波幅？*
            </Label>
            <p className="text-sm text-muted-foreground">
              Generally, the higher the expected return the higher price fluctuation may be involved. What level of annualized price fluctuation would you generally be comfortable with?
            </p>
            <RadioGroup
              value={corpFormData.cq3_price_volatility}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq3_price_volatility: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_percent" id="cq3-10-percent" />
                <label htmlFor="cq3-10-percent" className="text-sm">
                  <span className="block">價格波幅介乎-10%至+10%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Price fluctuates between -10% and +10%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="20_percent" id="cq3-20-percent" />
                <label htmlFor="cq3-20-percent" className="text-sm">
                  <span className="block">價格波幅介乎-20%至+20%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Price fluctuates between -20% and +20%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="30_percent" id="cq3-30-percent" />
                <label htmlFor="cq3-30-percent" className="text-sm">
                  <span className="block">價格波幅多於-30%至多於+30%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Price fluctuates under -30% and over +30%</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
          </div>

          {/* CQ4 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？*
            </Label>
            <p className="text-sm text-muted-foreground">
              What is the percentage of current net-worth (excluding the value of your self-occupied property) that can be allowed for investment purpose?
            </p>
            <RadioGroup
              value={corpFormData.cq4_investment_percentage}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq4_investment_percentage: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_10" id="cq4-less-than-10" />
                <label htmlFor="cq4-less-than-10" className="text-sm">
                  <span className="block">少於10%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Less than 10%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_to_20" id="cq4-10-to-20" />
                <label htmlFor="cq4-10-to-20" className="text-sm">
                  <span className="block">介乎10%至20%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 10% to 20%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="21_to_30" id="cq4-21-to-30" />
                <label htmlFor="cq4-21-to-30" className="text-sm">
                  <span className="block">介乎21%至30%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 21% to 30%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="31_to_50" id="cq4-31-to-50" />
                <label htmlFor="cq4-31-to-50" className="text-sm">
                  <span className="block">介乎31%至50%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 31% to 50%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_50" id="cq4-more-than-50" />
                <label htmlFor="cq4-more-than-50" className="text-sm">
                  <span className="block">多於50%</span>
                  <span className="block text-xs text-muted-foreground font-normal">More than 50%</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q4 && <p className="text-sm text-destructive">{errors.q4}</p>}
          </div>

          {/* CQ5 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q5. 以下哪一句子最能貼切描述您/貴公司對金融投資的一般態度？*
            </Label>
            <p className="text-sm text-muted-foreground">
              Which statement can best describe the general attitude of you or your company towards financial investment?
            </p>
            <RadioGroup
              value={corpFormData.cq5_investment_attitude}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq5_investment_attitude: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_volatility" id="cq5-no-volatility" />
                <label htmlFor="cq5-no-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司不能接受任何價格波動，並且對賺取投資回報不感興趣。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We cannot put up with any price fluctuation and have no interest on earnings.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="small_volatility" id="cq5-small-volatility" />
                <label htmlFor="cq5-small-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司只能接受較小幅度的價格波動，並且僅希望賺取稍高於銀行存款利率的回報。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can only put up with little price fluctuation and wish to have earnings slightly higher than bank deposit rates.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="some_volatility" id="cq5-some-volatility" />
                <label htmlFor="cq5-some-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司可接受若干價格波幅，並希望賺取高於銀行存款利率的回報。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can put up with some price fluctuation and wish to have earnings much better than bank deposit rates.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="large_volatility" id="cq5-large-volatility" />
                <label htmlFor="cq5-large-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司可接受大幅度的價格波動，並希望賺取與股市指數表現相若的回報。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can put up with high degree of price fluctuation and wish to have earnings comparable to stock market indexes.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="any_volatility" id="cq5-any-volatility" />
                <label htmlFor="cq5-any-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司可接受任何幅度的價格波動，並希望回報能超越股市指數。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can put up with any price fluctuation and wish to have earnings remarkably higher than stock market indexes.</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q5 && <p className="text-sm text-destructive">{errors.q5}</p>}
          </div>

          {/* CQ6 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q6. 您/貴公司對衍生工具產品的認識。(您/貴公司可選擇多於一項)*
            </Label>
            <p className="text-sm text-muted-foreground">
              The knowledge on derivative products of clients. (You may select more than one option)
            </p>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-training"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("training")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "training", checked as boolean)}
                />
                <label htmlFor="cq6-training" className="text-sm">
                  <span className="block">客戶曾接受有關衍生產品的培訓或修讀相關課程。</span>
                  <span className="block text-xs text-muted-foreground">The Client underwent training or attended courses on derivative products.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-experience"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("experience")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "experience", checked as boolean)}
                />
                <label htmlFor="cq6-experience" className="text-sm">
                  <span className="block">客戶現時或過去擁有與衍生產品有關的工作經驗。</span>
                  <span className="block text-xs text-muted-foreground">The Client has current or previous work experience related to derivative products.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-transactions"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("transactions")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "transactions", checked as boolean)}
                />
                <label htmlFor="cq6-transactions" className="text-sm">
                  <span className="block">客戶於過往3年曾執行5次或以上有關衍生產品的交易，例如：衍生權證、牛熊證、股票、期貨及期權、商品、結構性產品、債券及易所買賣基金等。</span>
                  <span className="block text-xs text-muted-foreground">The Client has executed five or more transactions within the past three years in derivative products, e.g. Derivative Warrants, Callable Bull/Bear Contracts, Stock Options, Futures and Options, Commodities, Structured Products, Bonds, and Exchange Traded Funds, etc.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-no-knowledge"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("no_knowledge")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "no_knowledge", checked as boolean)}
                />
                <label htmlFor="cq6-no-knowledge" className="text-sm">
                  <span className="block">客戶沒有衍生工具之認識。</span>
                  <span className="block text-xs text-muted-foreground">The Client has NOT acquired knowledge of derivative products.</span>
                </label>
              </div>
            </div>
            {errors.q6 && <p className="text-sm text-destructive">{errors.q6}</p>}
          </div>
        </div>

        {/* PART 2: Q7-Q10 Corporate specific */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">PART 2: 適用於公司客戶</h3>

          {/* CQ7 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q7. 貴公司會預留多少資金用在投資期內的投資？*
            </Label>
            <p className="text-sm text-muted-foreground">
              What is the amount that your company will set aside for investing in investment products during its investment period?
            </p>
            <RadioGroup
              value={corpFormData.cq7_investment_amount}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq7_investment_amount: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_1m" id="cq7-less-than-1m" />
                <label htmlFor="cq7-less-than-1m" className="text-sm">
                  <span className="block">少於港幣$1,000,000</span>
                  <span className="block text-xs text-muted-foreground font-normal">Less than HK$1,000,000</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="1m_to_5m" id="cq7-1m-to-5m" />
                <label htmlFor="cq7-1m-to-5m" className="text-sm">
                  <span className="block">介乎港幣$1,000,001至港幣$5,000,000</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between HK$1,000,001 to HK$5,000,000</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="5m_to_10m" id="cq7-5m-to-10m" />
                <label htmlFor="cq7-5m-to-10m" className="text-sm">
                  <span className="block">介乎港幣$5,000,001至港幣$10,000,000</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between HK$5,000,001 to HK$10,000,000</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_10m" id="cq7-more-than-10m" />
                <label htmlFor="cq7-more-than-10m" className="text-sm">
                  <span className="block">多於港幣$10,000,000</span>
                  <span className="block text-xs text-muted-foreground font-normal">Over HK$10,000,000</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q7 && <p className="text-sm text-destructive">{errors.q7}</p>}
          </div>

          {/* CQ8 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q8. 貴公司會把多少比例的資產投資於較高風險的投資項目？（如：窩輪，牛熊證等）*
            </Label>
            <p className="text-sm text-muted-foreground">
              What is the percentage investing in higher risk products of your portfolio? (eg. Warrant, CBBCs etc.)
            </p>
            <RadioGroup
              value={corpFormData.cq8_high_risk_percentage}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq8_high_risk_percentage: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_25" id="cq8-less-than-25" />
                <label htmlFor="cq8-less-than-25" className="text-sm">
                  <span className="block">少於25%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Less than 25%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="25_to_50" id="cq8-25-to-50" />
                <label htmlFor="cq8-25-to-50" className="text-sm">
                  <span className="block">介乎25%至50%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 25% to 50%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="51_to_75" id="cq8-51-to-75" />
                <label htmlFor="cq8-51-to-75" className="text-sm">
                  <span className="block">介乎51%至75%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 51% to 75%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_75" id="cq8-more-than-75" />
                <label htmlFor="cq8-more-than-75" className="text-sm">
                  <span className="block">多於75%</span>
                  <span className="block text-xs text-muted-foreground font-normal">More than 75%</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q8 && <p className="text-sm text-destructive">{errors.q8}</p>}
          </div>

          {/* CQ9 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q9. 貴公司是否聘用專業人員負責作出投資決定？*
            </Label>
            <p className="text-sm text-muted-foreground">
              Does your company employ any dedicated professionals responsible for making investment decisions?
            </p>
            <RadioGroup
              value={corpFormData.cq9_dedicated_professionals}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq9_dedicated_professionals: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_no_knowledge" id="cq9-no-no-knowledge" />
                <label htmlFor="cq9-no-no-knowledge" className="text-sm leading-relaxed">
                  <span className="block">否，本公司對投資決定沒有相關知識。</span>
                  <span className="block text-xs text-muted-foreground font-normal">No, we do not have knowledge on making investment decisions.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_adequate_knowledge" id="cq9-no-adequate" />
                <label htmlFor="cq9-no-adequate" className="text-sm leading-relaxed">
                  <span className="block">否，但本公司對投資決定有足夠相關知識。</span>
                  <span className="block text-xs text-muted-foreground font-normal">No, but we have adequate knowledge on making investment decisions.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="yes_some_knowledge" id="cq9-yes-some" />
                <label htmlFor="cq9-yes-some" className="text-sm leading-relaxed">
                  <span className="block">是，但本公司對投資決定只有一些或少許相關知識。</span>
                  <span className="block text-xs text-muted-foreground font-normal">Yes, but we have only some or little knowledge on making investment decisions.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="yes_adequate_management" id="cq9-yes-adequate" />
                <label htmlFor="cq9-yes-adequate" className="text-sm leading-relaxed">
                  <span className="block">是，本公司有足夠相關知識的管理層作出投資決定。</span>
                  <span className="block text-xs text-muted-foreground font-normal">Yes, we have senior management with adequate knowledge to make investment decisions.</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q9 && <p className="text-sm text-destructive">{errors.q9}</p>}
          </div>

          {/* CQ10 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q10. 在一般情況下，貴公司會預留多少流動資金(當中包括現金、外幣、銀行存款等)作為每月營運開支儲備？*
            </Label>
            <p className="text-sm text-muted-foreground">
              In general, how much liquid assets (e.g. cash, foreign currency, bank deposits, etc.) has your company reserved for monthly operational expenses?
            </p>
            <RadioGroup
              value={corpFormData.cq10_liquid_reserves}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq10_liquid_reserves: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_3_months" id="cq10-less-than-3" />
                <label htmlFor="cq10-less-than-3" className="text-sm">
                  <span className="block">少於3個月的營運開支儲備</span>
                  <span className="block text-xs text-muted-foreground font-normal">Less than 3 months operational expenses</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="3_to_6_months" id="cq10-3-to-6" />
                <label htmlFor="cq10-3-to-6" className="text-sm">
                  <span className="block">3個月至6個月的營運開支儲備</span>
                  <span className="block text-xs text-muted-foreground font-normal">3 months to 6-months operational expenses</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="6_to_12_months" id="cq10-6-to-12" />
                <label htmlFor="cq10-6-to-12" className="text-sm">
                  <span className="block">6個月至12個月的營運開支儲備</span>
                  <span className="block text-xs text-muted-foreground font-normal">6 months to 12-months operational expenses</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_12_months" id="cq10-more-than-12" />
                <label htmlFor="cq10-more-than-12" className="text-sm">
                  <span className="block">12個月以上的營運開支儲備</span>
                  <span className="block text-xs text-muted-foreground font-normal">12 months or above operational expenses</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q10 && <p className="text-sm text-destructive">{errors.q10}</p>}
          </div>
        </div>

        {/* 風險等級結果顯示 */}
        {corpFormData.riskLevel && corpFormData.riskDescription && (
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 text-primary">貴公司的風險評估結果</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">總分：</span>
                <span className="text-2xl font-bold text-primary">{corpFormData.totalScore || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">風險等級：</span>
                <span className="text-xl font-semibold text-primary">{corpFormData.riskLevel}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">投資取向：</p>
                <p className="text-sm leading-relaxed whitespace-pre-line">{corpFormData.riskDescription}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );

  // Render individual questionnaire
  const renderIndividualQuestionnaire = () => (
    <div>
      <h3 className="text-xl font-semibold mb-2">風險評估問卷 / Risk Profile Questionnaire</h3>
      <p className="text-sm text-muted-foreground mb-6">
        請根據您的實際情況填寫以下問卷，以評估您的風險承受能力
      </p>
      {isJoint && (
        <h3 className="text-lg font-bold text-primary border-b pb-2 mb-4">賬戶主要持有人 / Primary Account Holder</h3>
      )}
      <CardContent className="space-y-8">
        {/* PART 1: 適用於全部客戶 */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">PART 1</h3>

          {/* Q1 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q1. 您/貴公司現在是否持有以下任何投資產品？(您/貴公司可選擇多於一項)*
            </Label>
            <p className="text-sm text-muted-foreground">
              Are you / your company currently holding any of the below investment products? (You may select more than one option)
            </p>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q1-savings"
                  checked={formData.q1_current_investments.includes("savings")}
                  onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "savings", checked as boolean)}
                />
                <label htmlFor="q1-savings" className="text-sm">
                  <span className="block">儲蓄/定期儲蓄/存款證/保本產品</span>
                  <span className="block text-xs text-muted-foreground">Savings/Fixed Deposits/Certificate of Deposits/Capital Protected Products</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q1-bonds"
                  checked={formData.q1_current_investments.includes("bonds")}
                  onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "bonds", checked as boolean)}
                />
                <label htmlFor="q1-bonds" className="text-sm">
                  <span className="block">債券/證券/單位信託基金/投資相連保險計劃</span>
                  <span className="block text-xs text-muted-foreground">Bonds/Stocks/Unit Trusts/Investment-Linked Insurance Plans</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q1-derivatives"
                  checked={formData.q1_current_investments.includes("derivatives")}
                  onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "derivatives", checked as boolean)}
                />
                <label htmlFor="q1-derivatives" className="text-sm">
                  <span className="block">期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資</span>
                  <span className="block text-xs text-muted-foreground">Futures/Options/Derivatives/Structured investment products/Linked Deposits/Leveraged FX Trading</span>
                </label>
              </div>
            </div>
            {errors.q1 && <p className="text-sm text-destructive">{errors.q1}</p>}
          </div>

          {/* Q2 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q2. 當投資於投資產品時，預期投資年期是多少？*
            </Label>
            <p className="text-sm text-muted-foreground">
              How long is the expected Investment horizon when investing in investment products?
            </p>
            <RadioGroup
              value={formData.q2_investment_period}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q2_investment_period: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_1" id="q2-less-than-1" />
                <label htmlFor="q2-less-than-1" className="text-sm">
                  <span className="block">沒有或少於1年</span>
                  <span className="block text-xs text-muted-foreground font-normal">None or less than 1 year</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="1_to_3" id="q2-1-to-3" />
                <label htmlFor="q2-1-to-3" className="text-sm">
                  <span className="block">1-3年</span>
                  <span className="block text-xs text-muted-foreground font-normal">1-3 years</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_3" id="q2-more-than-3" />
                <label htmlFor="q2-more-than-3" className="text-sm">
                  <span className="block">多於3年</span>
                  <span className="block text-xs text-muted-foreground font-normal">Over 3 years</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}
          </div>

          {/* Q3 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q3. 一般而言，預期愈高回報，亦會涉及較高的價格波幅。您/貴公司可以接受以下哪個年度價格波幅？*
            </Label>
            <p className="text-sm text-muted-foreground">
              Generally, the higher the expected return the higher price fluctuation may be involved. What level of annualized price fluctuation would you generally be comfortable with?
            </p>
            <RadioGroup
              value={formData.q3_price_volatility}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q3_price_volatility: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_percent" id="q3-10-percent" />
                <label htmlFor="q3-10-percent" className="text-sm">
                  <span className="block">價格波幅介乎-10%至+10%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Price fluctuates between -10% and +10%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="20_percent" id="q3-20-percent" />
                <label htmlFor="q3-20-percent" className="text-sm">
                  <span className="block">價格波幅介乎-20%至+20%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Price fluctuates between -20% and +20%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="30_percent" id="q3-30-percent" />
                <label htmlFor="q3-30-percent" className="text-sm">
                  <span className="block">價格波幅多於-30%至多於+30%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Price fluctuates under -30% and over +30%</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
          </div>

          {/* Q4 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？*
            </Label>
            <p className="text-sm text-muted-foreground">
              What is the percentage of current net-worth (excluding the value of your self-occupied property) that can be allowed for investment purpose?
            </p>
            <RadioGroup
              value={formData.q4_investment_percentage}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q4_investment_percentage: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_10" id="q4-less-than-10" />
                <label htmlFor="q4-less-than-10" className="text-sm">
                  <span className="block">少於10%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Less than 10%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_to_20" id="q4-10-to-20" />
                <label htmlFor="q4-10-to-20" className="text-sm">
                  <span className="block">介乎10%至20%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 10% to 20%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="21_to_30" id="q4-21-to-30" />
                <label htmlFor="q4-21-to-30" className="text-sm">
                  <span className="block">介乎21%至30%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 21% to 30%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="31_to_50" id="q4-31-to-50" />
                <label htmlFor="q4-31-to-50" className="text-sm">
                  <span className="block">介乎31%至50%</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 31% to 50%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_50" id="q4-more-than-50" />
                <label htmlFor="q4-more-than-50" className="text-sm">
                  <span className="block">多於50%</span>
                  <span className="block text-xs text-muted-foreground font-normal">More than 50%</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q4 && <p className="text-sm text-destructive">{errors.q4}</p>}
          </div>

          {/* Q5 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q5. 以下哪一句子最能貼切描述您/貴公司對金融投資的一般態度？*
            </Label>
            <p className="text-sm text-muted-foreground">
              Which statement can best describe the general attitude of you or your company towards financial investment?
            </p>
            <RadioGroup
              value={formData.q5_investment_attitude}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q5_investment_attitude: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_volatility" id="q5-no-volatility" />
                <label htmlFor="q5-no-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司不能接受任何價格波動，並且對賺取投資回報不感興趣。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We cannot put up with any price fluctuation and have no interest on earnings.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="small_volatility" id="q5-small-volatility" />
                <label htmlFor="q5-small-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司只能接受較小幅度的價格波動，並且僅希望賺取稍高於銀行存款利率的回報。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can only put up with little price fluctuation and wish to have earnings slightly higher than bank deposit rates.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="some_volatility" id="q5-some-volatility" />
                <label htmlFor="q5-some-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司可接受若干價格波幅，並希望賺取高於銀行存款利率的回報。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can put up with some price fluctuation and wish to have earnings much better than bank deposit rates.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="large_volatility" id="q5-large-volatility" />
                <label htmlFor="q5-large-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司可接受大幅度的價格波動，並希望賺取與股市指數表現相若的回報。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can put up with high degree of price fluctuation and wish to have earnings comparable to stock market indexes.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="any_volatility" id="q5-any-volatility" />
                <label htmlFor="q5-any-volatility" className="text-sm leading-relaxed">
                  <span className="block">本人/本公司可接受任何幅度的價格波動，並希望回報能超越股市指數。</span>
                  <span className="block text-xs text-muted-foreground font-normal">We can put up with any price fluctuation and wish to have earnings remarkably higher than stock market indexes.</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q5 && <p className="text-sm text-destructive">{errors.q5}</p>}
          </div>

          {/* Q6 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              Q6. 您/貴公司對衍生工具產品的認識。(您/貴公司可選擇多於一項)*
            </Label>
            <p className="text-sm text-muted-foreground">
              The knowledge on derivative products of clients. (You may select more than one option)
            </p>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-training"
                  checked={formData.q6_derivatives_knowledge.includes("training")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "training", checked as boolean)}
                />
                <label htmlFor="q6-training" className="text-sm">
                  <span className="block">客戶曾接受有關衍生產品的培訓或修讀相關課程。</span>
                  <span className="block text-xs text-muted-foreground">The Client underwent training or attended courses on derivative products.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-experience"
                  checked={formData.q6_derivatives_knowledge.includes("experience")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "experience", checked as boolean)}
                />
                <label htmlFor="q6-experience" className="text-sm">
                  <span className="block">客戶現時或過去擁有與衍生產品有關的工作經驗。</span>
                  <span className="block text-xs text-muted-foreground">The Client has current or previous work experience related to derivative products.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-transactions"
                  checked={formData.q6_derivatives_knowledge.includes("transactions")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "transactions", checked as boolean)}
                />
                <label htmlFor="q6-transactions" className="text-sm">
                  <span className="block">客戶於過往3年曾執行5次或以上有關衍生產品的交易，例如：衍生權證、牛熊證、股票、期貨及期權、商品、結構性產品、債券及易所買賣基金等。</span>
                  <span className="block text-xs text-muted-foreground">The Client has executed five or more transactions within the past three years in derivative products, e.g. Derivative Warrants, Callable Bull/Bear Contracts, Stock Options, Futures and Options, Commodities, Structured Products, Bonds, and Exchange Traded Funds, etc.</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-no-knowledge"
                  checked={formData.q6_derivatives_knowledge.includes("no_knowledge")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "no_knowledge", checked as boolean)}
                />
                <label htmlFor="q6-no-knowledge" className="text-sm">
                  <span className="block">客戶沒有衍生工具之認識。</span>
                  <span className="block text-xs text-muted-foreground">The Client has NOT acquired knowledge of derivative products.</span>
                </label>
              </div>
            </div>
            {errors.q6 && <p className="text-sm text-destructive">{errors.q6}</p>}
          </div>
        </div>

        {/* PART 2: 適用於個人/聯名客戶 */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">PART 2: 適用於個人/聯名客戶</h3>

          {/* Q7 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Q7. 您屬於以下哪個年齡組別？*
            </Label>
            <RadioGroup
              value={formData.q7_age_group}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q7_age_group: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_18_25" id="q7-age-18-25" />
                <label htmlFor="q7-age-18-25" className="text-sm">
                  <span className="block">介乎18至25歲</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 18 and 25</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_26_35" id="q7-age-26-35" />
                <label htmlFor="q7-age-26-35" className="text-sm">
                  <span className="block">介乎26至35歲</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 26 and 35</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_36_50" id="q7-age-36-50" />
                <label htmlFor="q7-age-36-50" className="text-sm">
                  <span className="block">介乎36至50歲</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 36 and 50</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_51_64" id="q7-age-51-64" />
                <label htmlFor="q7-age-51-64" className="text-sm">
                  <span className="block">介乎51至64歲</span>
                  <span className="block text-xs text-muted-foreground font-normal">Between 51 and 64</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_65_plus" id="q7-age-65-plus" />
                <label htmlFor="q7-age-65-plus" className="text-sm">
                  <span className="block">65歲或以上</span>
                  <span className="block text-xs text-muted-foreground font-normal">65 or above</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q7 && <p className="text-sm text-destructive">{errors.q7}</p>}
          </div>

          {/* Q8 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Q8. 您的教育程度是？*
            </Label>
            <RadioGroup
              value={formData.q8_education_level}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q8_education_level: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="primary_or_below" id="q8-primary" />
                <label htmlFor="q8-primary" className="text-sm">
                  <span className="block">小學或以下</span>
                  <span className="block text-xs text-muted-foreground font-normal">Primary school or below</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="secondary" id="q8-secondary" />
                <label htmlFor="q8-secondary" className="text-sm">
                  <span className="block">中學</span>
                  <span className="block text-xs text-muted-foreground font-normal">Secondary school</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="post_secondary" id="q8-post-secondary" />
                <label htmlFor="q8-post-secondary" className="text-sm">
                  <span className="block">大專或以上</span>
                  <span className="block text-xs text-muted-foreground font-normal">Post-secondary or above</span>
                </label>
              </div>
            </RadioGroup>
            {errors.q8 && <p className="text-sm text-destructive">{errors.q8}</p>}
          </div>

          {/* Q9 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Q9. 您曾經或現時從以下哪些途徑獲取投資知識？*
            </Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q9-never"
                  checked={formData.q9_investment_knowledge_sources.includes("never")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: ["never"] }));
                    } else {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never") }));
                    }
                  }}
                />
                <label htmlFor="q9-never" className="text-sm">
                  <span className="block">從未獲取及/或沒有興趣獲取任何投資知識</span>
                  <span className="block text-xs text-muted-foreground">Never acquired and/or not interested in acquiring any investment knowledge</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q9-relatives"
                  checked={formData.q9_investment_knowledge_sources.includes("relatives")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never").concat("relatives") }));
                    } else {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "relatives") }));
                    }
                  }}
                />
                <label htmlFor="q9-relatives" className="text-sm">
                  <span className="block">與親友及/或同事討論投資或理財話題</span>
                  <span className="block text-xs text-muted-foreground">Discussed investment or financial topics with relatives and/or colleagues</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q9-media"
                  checked={formData.q9_investment_knowledge_sources.includes("media")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never").concat("media") }));
                    } else {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "media") }));
                    }
                  }}
                />
                <label htmlFor="q9-media" className="text-sm">
                  <span className="block">閱讀及/或收聽有關投資或財經新聞</span>
                  <span className="block text-xs text-muted-foreground">Read and/or listened to investment or financial news</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q9-courses"
                  checked={formData.q9_investment_knowledge_sources.includes("courses")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never").concat("courses") }));
                    } else {
                      setFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "courses") }));
                    }
                  }}
                />
                <label htmlFor="q9-courses" className="text-sm">
                  <span className="block">研究投資或財務相關事宜，或參加投資或財務相關課程、論壇、簡報會、研討會或工作坊</span>
                  <span className="block text-xs text-muted-foreground">Researched investment or financial matters, or attended related courses, forums, briefings, seminars or workshops</span>
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
              value={formData.q10_liquidity_needs}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q10_liquidity_needs: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_sell" id="q10-no-sell" />
                <label htmlFor="q10-no-sell" className="text-sm">
                  <span className="block">不需要出售任何投資</span>
                  <span className="block text-xs text-muted-foreground font-normal">No need to sell any investment</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sell_less_30" id="q10-sell-less-30" />
                <label htmlFor="q10-sell-less-30" className="text-sm">
                  <span className="block">我會出售不超過30%的投資</span>
                  <span className="block text-xs text-muted-foreground font-normal">I would sell no more than 30% of my investments</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sell_30_50" id="q10-sell-30-50" />
                <label htmlFor="q10-sell-30-50" className="text-sm">
                  <span className="block">我會出售超過30%但不到50%的投資</span>
                  <span className="block text-xs text-muted-foreground font-normal">I would sell more than 30% but less than 50%</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sell_more_50" id="q10-sell-more-50" />
                <label htmlFor="q10-sell-more-50" className="text-sm">
                  <span className="block">我會出售超過50%的投資</span>
                  <span className="block text-xs text-muted-foreground font-normal">I would sell more than 50% of my investments</span>
                </label>
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

      {/* 聯名賬戶：第二持有人 */}
      {isJoint && (
        <>
          <h3 className="text-lg font-bold text-primary border-b pb-2 mt-8 mb-4">賬戶第二持有人 / Second Account Holder</h3>
          <CardContent className="space-y-8">
            {/* PART 1 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">PART 1</h3>

              {/* Q1 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">
                  Q1. 您/貴公司現在是否持有以下任何投資產品？(您/貴公司可選擇多於一項)*
                </Label>
                <div className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq1-savings" checked={secondFormData.q1_current_investments.includes("savings")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q1_current_investments", "savings", checked as boolean)} />
                    <label htmlFor="sq1-savings" className="text-sm">
                      <span className="block">儲蓄/定期儲蓄/存款證/保本產品</span>
                      <span className="block text-xs text-muted-foreground">Savings/Fixed Deposits/Certificate of Deposits/Capital Protected Products</span>
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq1-bonds" checked={secondFormData.q1_current_investments.includes("bonds")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q1_current_investments", "bonds", checked as boolean)} />
                    <label htmlFor="sq1-bonds" className="text-sm">
                      <span className="block">債券/證券/單位信託基金/投資相連保險計劃</span>
                      <span className="block text-xs text-muted-foreground">Bonds/Stocks/Unit Trusts/Investment-Linked Insurance Plans</span>
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq1-derivatives" checked={secondFormData.q1_current_investments.includes("derivatives")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q1_current_investments", "derivatives", checked as boolean)} />
                    <label htmlFor="sq1-derivatives" className="text-sm">
                      <span className="block">期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資</span>
                      <span className="block text-xs text-muted-foreground">Futures/Options/Derivatives/Structured investment products/Linked Deposits/Leveraged FX Trading</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Q2 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">Q2. 當投資於投資產品時，預期投資年期是多少？*</Label>
                <RadioGroup value={secondFormData.q2_investment_period}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q2_investment_period: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="less_than_1" id="sq2-less-than-1" />
                    <label htmlFor="sq2-less-than-1" className="text-sm">沒有或少於1年</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="1_to_3" id="sq2-1-to-3" />
                    <label htmlFor="sq2-1-to-3" className="text-sm">1-3年</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="more_than_3" id="sq2-more-than-3" />
                    <label htmlFor="sq2-more-than-3" className="text-sm">多於3年</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Q3 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">Q3. 一般而言，預期愈高回報，亦會涉及較高的價格波幅。您可以接受以下哪個年度價格波幅？*</Label>
                <RadioGroup value={secondFormData.q3_price_volatility}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q3_price_volatility: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="10_percent" id="sq3-10-percent" />
                    <label htmlFor="sq3-10-percent" className="text-sm">價格波幅介乎-10%至+10%</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="20_percent" id="sq3-20-percent" />
                    <label htmlFor="sq3-20-percent" className="text-sm">價格波幅介乎-20%至+20%</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="30_percent" id="sq3-30-percent" />
                    <label htmlFor="sq3-30-percent" className="text-sm">價格波幅多於-30%至多於+30%</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Q4 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？*</Label>
                <RadioGroup value={secondFormData.q4_investment_percentage}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q4_investment_percentage: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="less_than_10" id="sq4-less-than-10" />
                    <label htmlFor="sq4-less-than-10" className="text-sm">少於10%</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="10_to_20" id="sq4-10-to-20" />
                    <label htmlFor="sq4-10-to-20" className="text-sm">介乎10%至20%</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="21_to_30" id="sq4-21-to-30" />
                    <label htmlFor="sq4-21-to-30" className="text-sm">介乎21%至30%</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="31_to_50" id="sq4-31-to-50" />
                    <label htmlFor="sq4-31-to-50" className="text-sm">介乎31%至50%</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="more_than_50" id="sq4-more-than-50" />
                    <label htmlFor="sq4-more-than-50" className="text-sm">多於50%</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Q5 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">Q5. 以下哪一句子最能貼切描述您對金融投資的一般態度？*</Label>
                <RadioGroup value={secondFormData.q5_investment_attitude}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q5_investment_attitude: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="no_volatility" id="sq5-no-volatility" />
                    <label htmlFor="sq5-no-volatility" className="text-sm">不能接受任何價格波動</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="small_volatility" id="sq5-small-volatility" />
                    <label htmlFor="sq5-small-volatility" className="text-sm">只能接受較小幅度的價格波動</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="some_volatility" id="sq5-some-volatility" />
                    <label htmlFor="sq5-some-volatility" className="text-sm">可接受若干價格波幅</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="large_volatility" id="sq5-large-volatility" />
                    <label htmlFor="sq5-large-volatility" className="text-sm">可接受大幅度的價格波動</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="any_volatility" id="sq5-any-volatility" />
                    <label htmlFor="sq5-any-volatility" className="text-sm">可接受任何幅度的價格波動</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Q6 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">Q6. 您對衍生工具產品的認識。(可選擇多於一項)*</Label>
                <div className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-training" checked={secondFormData.q6_derivatives_knowledge.includes("training")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "training", checked as boolean)} />
                    <label htmlFor="sq6-training" className="text-sm">曾接受有關衍生產品的培訓或修讀相關課程</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-experience" checked={secondFormData.q6_derivatives_knowledge.includes("experience")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "experience", checked as boolean)} />
                    <label htmlFor="sq6-experience" className="text-sm">現時或過去擁有與衍生產品有關的工作經驗</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-transactions" checked={secondFormData.q6_derivatives_knowledge.includes("transactions")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "transactions", checked as boolean)} />
                    <label htmlFor="sq6-transactions" className="text-sm">過往3年曾執行5次或以上有關衍生產品的交易</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-no-knowledge" checked={secondFormData.q6_derivatives_knowledge.includes("no_knowledge")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "no_knowledge", checked as boolean)} />
                    <label htmlFor="sq6-no-knowledge" className="text-sm">沒有衍生工具之認識</label>
                  </div>
                </div>
              </div>
            </div>

            {/* PART 2 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">PART 2: 適用於個人/聯名客戶</h3>

              {/* Q7 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Q7. 您屬於以下哪個年齡組別？*</Label>
                <RadioGroup value={secondFormData.q7_age_group}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q7_age_group: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_18_25" id="sq7-age-18-25" />
                    <label htmlFor="sq7-age-18-25" className="text-sm">介乎18至25歲</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_26_35" id="sq7-age-26-35" />
                    <label htmlFor="sq7-age-26-35" className="text-sm">介乎26至35歲</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_36_50" id="sq7-age-36-50" />
                    <label htmlFor="sq7-age-36-50" className="text-sm">介乎36至50歲</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_51_64" id="sq7-age-51-64" />
                    <label htmlFor="sq7-age-51-64" className="text-sm">介乎51至64歲</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_65_plus" id="sq7-age-65-plus" />
                    <label htmlFor="sq7-age-65-plus" className="text-sm">65歲或以上</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Q8 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Q8. 您的教育程度是？*</Label>
                <RadioGroup value={secondFormData.q8_education_level}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q8_education_level: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="primary_or_below" id="sq8-primary" />
                    <label htmlFor="sq8-primary" className="text-sm">小學或以下</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="secondary" id="sq8-secondary" />
                    <label htmlFor="sq8-secondary" className="text-sm">中學</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="post_secondary" id="sq8-post-secondary" />
                    <label htmlFor="sq8-post-secondary" className="text-sm">大專或以上</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Q9 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Q9. 您曾經或現時從以下哪些途徑獲取投資知識？*</Label>
                <div className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq9-never" checked={secondFormData.q9_investment_knowledge_sources.includes("never")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: ["never"] }));
                        } else {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never") }));
                        }
                      }} />
                    <label htmlFor="sq9-never" className="text-sm">從未獲取及/或沒有興趣獲取任何投資知識</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq9-relatives" checked={secondFormData.q9_investment_knowledge_sources.includes("relatives")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never").concat("relatives") }));
                        } else {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "relatives") }));
                        }
                      }} />
                    <label htmlFor="sq9-relatives" className="text-sm">與親友及/或同事討論投資或理財話題</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq9-media" checked={secondFormData.q9_investment_knowledge_sources.includes("media")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never").concat("media") }));
                        } else {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "media") }));
                        }
                      }} />
                    <label htmlFor="sq9-media" className="text-sm">閱讀及/或收聽有關投資或財經新聞</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq9-courses" checked={secondFormData.q9_investment_knowledge_sources.includes("courses")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "never").concat("courses") }));
                        } else {
                          setSecondFormData(prev => ({ ...prev, q9_investment_knowledge_sources: prev.q9_investment_knowledge_sources.filter(v => v !== "courses") }));
                        }
                      }} />
                    <label htmlFor="sq9-courses" className="text-sm">研究投資或財務相關事宜，或參加投資或財務相關課程</label>
                  </div>
                </div>
              </div>

              {/* Q10 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Q10. 您需要將多少投資兌現，以滿足突發事件的流動資金需求？*</Label>
                <RadioGroup value={secondFormData.q10_liquidity_needs}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q10_liquidity_needs: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="no_sell" id="sq10-no-sell" />
                    <label htmlFor="sq10-no-sell" className="text-sm">不需要出售任何投資</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="sell_less_30" id="sq10-sell-less-30" />
                    <label htmlFor="sq10-sell-less-30" className="text-sm">出售不超過30%的投資</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="sell_30_50" id="sq10-sell-30-50" />
                    <label htmlFor="sq10-sell-30-50" className="text-sm">出售超過30%但不到50%的投資</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="sell_more_50" id="sq10-sell-more-50" />
                    <label htmlFor="sq10-sell-more-50" className="text-sm">出售超過50%的投資</label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </div>
  );

  return (
    <ApplicationWizard
      currentStep={stepNum}
      applicationId={applicationId}
      onNext={handleSubmit}
      isNextDisabled={loading || saveMutation.isPending}
      isNextLoading={loading || saveMutation.isPending}
      customerTypeOverride={isCorporate ? 'corporate' : 'individual'}
    >
      {isCorporate ? renderCorporateQuestionnaire() : renderIndividualQuestionnaire()}
    </ApplicationWizard>
  );
}
