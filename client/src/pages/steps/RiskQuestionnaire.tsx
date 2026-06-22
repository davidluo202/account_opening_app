import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLang } from '@/lib/i18n';
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
  const { t } = useLang();
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
      toast.success(t("風險評估問卷已保存", "Risk questionnaire saved", "风险评估问卷已保存"));
      setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
    },
    onError: (error: any) => {
      toast.error(`${t("保存失敗", "Save failed", "保存失败")}: ${error.message}`);
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
      if (corpFormData.cq1_current_investments.length === 0) newErrors.q1 = t("請至少選擇一項", "Please select at least one", "请至少选择一项");
      if (!corpFormData.cq2_investment_period) newErrors.q2 = t("請選擇一項", "Please select one", "请选择一项");
      if (!corpFormData.cq3_price_volatility) newErrors.q3 = t("請選擇一項", "Please select one", "请选择一项");
      if (!corpFormData.cq4_investment_percentage) newErrors.q4 = t("請選擇一項", "Please select one", "请选择一项");
      if (!corpFormData.cq5_investment_attitude) newErrors.q5 = t("請選擇一項", "Please select one", "请选择一项");
      if (corpFormData.cq6_derivatives_knowledge.length === 0) newErrors.q6 = t("請至少選擇一項", "Please select at least one", "请至少选择一项");
      if (!corpFormData.cq7_investment_amount) newErrors.q7 = t("請選擇一項", "Please select one", "请选择一项");
      if (!corpFormData.cq8_high_risk_percentage) newErrors.q8 = t("請選擇一項", "Please select one", "请选择一项");
      if (!corpFormData.cq9_dedicated_professionals) newErrors.q9 = t("請選擇一項", "Please select one", "请选择一项");
      if (!corpFormData.cq10_liquid_reserves) newErrors.q10 = t("請選擇一項", "Please select one", "请选择一项");
    } else {
      if (formData.q1_current_investments.length === 0) newErrors.q1 = t("請至少選擇一項", "Please select at least one", "请至少选择一项");
      if (!formData.q2_investment_period) newErrors.q2 = t("請選擇一項", "Please select one", "请选择一项");
      if (!formData.q3_price_volatility) newErrors.q3 = t("請選擇一項", "Please select one", "请选择一项");
      if (!formData.q4_investment_percentage) newErrors.q4 = t("請選擇一項", "Please select one", "请选择一项");
      if (!formData.q5_investment_attitude) newErrors.q5 = t("請選擇一項", "Please select one", "请选择一项");
      if (formData.q6_derivatives_knowledge.length === 0) newErrors.q6 = t("請至少選擇一項", "Please select at least one", "请至少选择一项");
      if (!formData.q7_age_group) newErrors.q7 = t("請選擇一項", "Please select one", "请选择一项");
      if (!formData.q8_education_level) newErrors.q8 = t("請選擇一項", "Please select one", "请选择一项");
      if (formData.q9_investment_knowledge_sources.length === 0) newErrors.q9 = t("請至少選擇一項", "Please select at least one", "请至少选择一项");
      if (!formData.q10_liquidity_needs) newErrors.q10 = t("請選擇一項", "Please select one", "请选择一项");

      // 聯名賬戶：驗證第二持有人
      if (isJoint) {
        if (secondFormData.q1_current_investments.length === 0) newErrors.sq1 = t("請填寫第二持有人的Q1", "Please complete Q1 for second holder", "请填写第二持有人的Q1");
        if (!secondFormData.q2_investment_period) newErrors.sq2 = t("請填寫第二持有人的Q2", "Please complete Q2 for second holder", "请填写第二持有人的Q2");
        if (!secondFormData.q3_price_volatility) newErrors.sq3 = t("請填寫第二持有人的Q3", "Please complete Q3 for second holder", "请填写第二持有人的Q3");
        if (!secondFormData.q4_investment_percentage) newErrors.sq4 = t("請填寫第二持有人的Q4", "Please complete Q4 for second holder", "请填写第二持有人的Q4");
        if (!secondFormData.q5_investment_attitude) newErrors.sq5 = t("請填寫第二持有人的Q5", "Please complete Q5 for second holder", "请填写第二持有人的Q5");
        if (secondFormData.q6_derivatives_knowledge.length === 0) newErrors.sq6 = t("請填寫第二持有人的Q6", "Please complete Q6 for second holder", "请填写第二持有人的Q6");
        if (!secondFormData.q7_age_group) newErrors.sq7 = t("請填寫第二持有人的Q7", "Please complete Q7 for second holder", "请填写第二持有人的Q7");
        if (!secondFormData.q8_education_level) newErrors.sq8 = t("請填寫第二持有人的Q8", "Please complete Q8 for second holder", "请填写第二持有人的Q8");
        if (secondFormData.q9_investment_knowledge_sources.length === 0) newErrors.sq9 = t("請填寫第二持有人的Q9", "Please complete Q9 for second holder", "请填写第二持有人的Q9");
        if (!secondFormData.q10_liquidity_needs) newErrors.sq10 = t("請填寫第二持有人的Q10", "Please complete Q10 for second holder", "请填写第二持有人的Q10");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error(t("請填寫所有必填項", "Please complete all required fields", "请填写所有必填项"));
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
      // Calculate second holder score using same logic as primary
      const calcSecondScore = () => {
        let s = 0;
        if (secondFormData.q1_current_investments.includes("savings")) s += 40;
        if (secondFormData.q1_current_investments.includes("bonds")) s += 40;
        if (secondFormData.q1_current_investments.includes("derivatives")) s += 40;
        if (secondFormData.q2_investment_period === "less_than_1") s += 10;
        else if (secondFormData.q2_investment_period === "1_to_3") s += 30;
        else if (secondFormData.q2_investment_period === "more_than_3") s += 50;
        if (secondFormData.q3_price_volatility === "10_percent") s += 10;
        else if (secondFormData.q3_price_volatility === "20_percent") s += 30;
        else if (secondFormData.q3_price_volatility === "30_percent") s += 50;
        if (secondFormData.q4_investment_percentage === "less_than_10") s += 10;
        else if (secondFormData.q4_investment_percentage === "10_to_20") s += 20;
        else if (secondFormData.q4_investment_percentage === "21_to_30") s += 30;
        else if (secondFormData.q4_investment_percentage === "31_to_50") s += 40;
        else if (secondFormData.q4_investment_percentage === "more_than_50") s += 50;
        if (secondFormData.q5_investment_attitude === "no_volatility") s += 10;
        else if (secondFormData.q5_investment_attitude === "small_volatility") s += 20;
        else if (secondFormData.q5_investment_attitude === "some_volatility") s += 30;
        else if (secondFormData.q5_investment_attitude === "large_volatility") s += 40;
        else if (secondFormData.q5_investment_attitude === "any_volatility") s += 50;
        if (secondFormData.q6_derivatives_knowledge.includes("training")) s += 40;
        if (secondFormData.q6_derivatives_knowledge.includes("experience")) s += 40;
        if (secondFormData.q6_derivatives_knowledge.includes("transactions")) s += 40;
        if (secondFormData.q7_age_group === "age_18_25") s += 20;
        else if (secondFormData.q7_age_group === "age_26_35") s += 30;
        else if (secondFormData.q7_age_group === "age_36_50") s += 40;
        else if (secondFormData.q7_age_group === "age_51_64") s += 20;
        else if (secondFormData.q7_age_group === "age_65_plus") s += 10;
        if (secondFormData.q8_education_level === "primary_or_below") s += 10;
        else if (secondFormData.q8_education_level === "secondary") s += 30;
        else if (secondFormData.q8_education_level === "post_secondary") s += 50;
        if (secondFormData.q9_investment_knowledge_sources.includes("relatives")) s += 40;
        if (secondFormData.q9_investment_knowledge_sources.includes("media")) s += 40;
        if (secondFormData.q9_investment_knowledge_sources.includes("courses")) s += 40;
        if (secondFormData.q10_liquidity_needs === "no_sell") s += 50;
        else if (secondFormData.q10_liquidity_needs === "sell_less_30") s += 30;
        else if (secondFormData.q10_liquidity_needs === "sell_30_50") s += 20;
        else if (secondFormData.q10_liquidity_needs === "sell_more_50") s += 10;
        return getRiskLevel(s);
      };
      const secondResult = calcSecondScore();
      setSecondFormData(prev => ({ ...prev, totalScore: secondResult.totalScore, riskLevel: secondResult.riskLevel, riskDescription: secondResult.riskDescription }));
      saveSecondHolderMutation.mutate({ applicationId: applicationId!, stepName: 'riskQuestionnaire', data: { ...secondFormData, totalScore: secondResult.totalScore, riskLevel: secondResult.riskLevel, riskDescription: secondResult.riskDescription } });
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
      <h3 className="text-xl font-semibold mb-2">{t('風險評估問卷', 'Risk Profile Questionnaire', '风险评估问卷')}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {t('請根據貴公司的實際情況填寫以下問卷，以評估風險承受能力', 'Please complete the following questionnaire based on your company\'s actual situation to assess risk tolerance', '请根据贵公司的实际情况填写以下问卷，以评估风险承受能力')}
      </p>
      <CardContent className="space-y-8">
        {/* PART 1: Q1-Q6 */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">PART 1</h3>

          {/* CQ1 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q1. 您/貴公司現在是否持有以下任何投資產品？(您/貴公司可選擇多於一項)', 'Q1. Are you / your company currently holding any of the below investment products? (You may select more than one option)', 'Q1. 您/贵公司现在是否持有以下任何投资产品？(您/贵公司可选择多于一项)')}<span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq1-savings"
                  checked={corpFormData.cq1_current_investments.includes("savings")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq1_current_investments", "savings", checked as boolean)}
                />
                <label htmlFor="cq1-savings" className="text-sm">
                  {t('儲蓄/定期儲蓄/存款證/保本產品', 'Savings/Fixed Deposits/Certificate of Deposits/Capital Protected Products', '儲蓄/定期儲蓄/存款證/保本產品')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq1-bonds"
                  checked={corpFormData.cq1_current_investments.includes("bonds")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq1_current_investments", "bonds", checked as boolean)}
                />
                <label htmlFor="cq1-bonds" className="text-sm">
                  {t('債券/證券/單位信託基金/投資相連保險計劃', 'Bonds/Stocks/Unit Trusts/Investment-Linked Insurance Plans', '債券/證券/單位信託基金/投資相連保險計劃')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq1-derivatives"
                  checked={corpFormData.cq1_current_investments.includes("derivatives")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq1_current_investments", "derivatives", checked as boolean)}
                />
                <label htmlFor="cq1-derivatives" className="text-sm">
                  {t('期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資', 'Futures/Options/Derivatives/Structured investment products/Linked Deposits/Leveraged FX Trading', '期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資')}
                </label>
              </div>
            </div>
            {errors.q1 && <p className="text-sm text-destructive">{errors.q1}</p>}
          </div>

          {/* CQ2 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q2. 當投資於投資產品時，預期投資年期是多少？', 'Q2. How long is the expected Investment horizon when investing in investment products?', 'Q2. 当投资于投资产品时，预期投资年期是多少？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq2_investment_period}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq2_investment_period: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_1" id="cq2-less-than-1" />
                <label htmlFor="cq2-less-than-1" className="text-sm">
                  {t('沒有或少於1年', 'None or less than 1 year', '没有或少于1年')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="1_to_3" id="cq2-1-to-3" />
                <label htmlFor="cq2-1-to-3" className="text-sm">
                  {t('1-3年', '1-3 years', '1-3年')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_3" id="cq2-more-than-3" />
                <label htmlFor="cq2-more-than-3" className="text-sm">
                  {t('多於3年', 'Over 3 years', '多于3年')}
                </label>
              </div>
            </RadioGroup>
            {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}
          </div>

          {/* CQ3 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q3. 一般而言，預期愈高回報，亦會涉及較高的價格波幅。您/貴公司可以接受以下哪個年度價格波幅？', 'Q3. Generally, the higher the expected return the higher price fluctuation may be involved. What level of annualized price fluctuation would you generally be comfortable with?', 'Q3. 一般而言，预期愈高回报，亦会涉及较高的价格波幅。您/贵公司可以接受以下哪个年度价格波幅？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq3_price_volatility}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq3_price_volatility: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_percent" id="cq3-10-percent" />
                <label htmlFor="cq3-10-percent" className="text-sm">
                  {t('價格波幅介乎-10%至+10%', 'Price fluctuates between -10% and +10%', '價格波幅介乎-10%至+10%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="20_percent" id="cq3-20-percent" />
                <label htmlFor="cq3-20-percent" className="text-sm">
                  {t('價格波幅介乎-20%至+20%', 'Price fluctuates between -20% and +20%', '價格波幅介乎-20%至+20%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="30_percent" id="cq3-30-percent" />
                <label htmlFor="cq3-30-percent" className="text-sm">
                  {t('價格波幅多於-30%至多於+30%', 'Price fluctuates under -30% and over +30%', '價格波幅多於-30%至多於+30%')}
                </label>
              </div>
            </RadioGroup>
            {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
          </div>

          {/* CQ4 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？', 'Q4. What is the percentage of current net-worth (excluding the value of your self-occupied property) that can be allowed for investment purpose?', 'Q4. 在现时资产净值中(撇除自住物业价值)，有多少个百分比可作投资用途？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq4_investment_percentage}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq4_investment_percentage: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_10" id="cq4-less-than-10" />
                <label htmlFor="cq4-less-than-10" className="text-sm">
                  {t('少於10%', 'Less than 10%', '少于10%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_to_20" id="cq4-10-to-20" />
                <label htmlFor="cq4-10-to-20" className="text-sm">
                  {t('介乎10%至20%', 'Between 10% to 20%', '介乎10%至20%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="21_to_30" id="cq4-21-to-30" />
                <label htmlFor="cq4-21-to-30" className="text-sm">
                  {t('介乎21%至30%', 'Between 21% to 30%', '介乎21%至30%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="31_to_50" id="cq4-31-to-50" />
                <label htmlFor="cq4-31-to-50" className="text-sm">
                  {t('介乎31%至50%', 'Between 31% to 50%', '介乎31%至50%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_50" id="cq4-more-than-50" />
                <label htmlFor="cq4-more-than-50" className="text-sm">
                  {t('多於50%', 'More than 50%', '多于50%')}
                </label>
              </div>
            </RadioGroup>
            {errors.q4 && <p className="text-sm text-destructive">{errors.q4}</p>}
          </div>

          {/* CQ5 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q5. 以下哪一句子最能貼切描述您/貴公司對金融投資的一般態度？', 'Q5. Which statement can best describe the general attitude of you or your company towards financial investment?', 'Q5. 以下哪一句子最能贴切描述您/贵公司对金融投资的一般态度？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq5_investment_attitude}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq5_investment_attitude: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_volatility" id="cq5-no-volatility" />
                <label htmlFor="cq5-no-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司不能接受任何價格波動，並且對賺取投資回報不感興趣。', 'We cannot put up with any price fluctuation and have no interest on earnings.', '本人/本公司不能接受任何价格波动，并且对赚取投资回报不感兴趣。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="small_volatility" id="cq5-small-volatility" />
                <label htmlFor="cq5-small-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司只能接受較小幅度的價格波動，並且僅希望賺取稍高於銀行存款利率的回報。', 'We can only put up with little price fluctuation and wish to have earnings slightly higher than bank deposit rates.', '本人/本公司只能接受较小幅度的价格波动，并且仅希望赚取稍高于银行存款利率的回报。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="some_volatility" id="cq5-some-volatility" />
                <label htmlFor="cq5-some-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司可接受若干價格波幅，並希望賺取高於銀行存款利率的回報。', 'We can put up with some price fluctuation and wish to have earnings much better than bank deposit rates.', '本人/本公司可接受若干价格波幅，并希望赚取高于银行存款利率的回报。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="large_volatility" id="cq5-large-volatility" />
                <label htmlFor="cq5-large-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司可接受大幅度的價格波動，並希望賺取與股市指數表現相若的回報。', 'We can put up with high degree of price fluctuation and wish to have earnings comparable to stock market indexes.', '本人/本公司可接受大幅度的价格波动，并希望赚取与股市指数表现相若的回报。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="any_volatility" id="cq5-any-volatility" />
                <label htmlFor="cq5-any-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司可接受任何幅度的價格波動，並希望回報能超越股市指數。', 'We can put up with any price fluctuation and wish to have earnings remarkably higher than stock market indexes.', '本人/本公司可接受任何幅度的价格波动，并希望回报能超越股市指数。')}
                </label>
              </div>
            </RadioGroup>
            {errors.q5 && <p className="text-sm text-destructive">{errors.q5}</p>}
          </div>

          {/* CQ6 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q6. 您/貴公司對衍生工具產品的認識。(您/貴公司可選擇多於一項)', 'Q6. The knowledge on derivative products of clients. (You may select more than one option)', 'Q6. 您/贵公司对衍生工具产品的认识。(您/贵公司可选择多于一项)')}<span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-training"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("training")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "training", checked as boolean)}
                />
                <label htmlFor="cq6-training" className="text-sm">
                  {t('客戶曾接受有關衍生產品的培訓或修讀相關課程。', 'The Client underwent training or attended courses on derivative products.', '客户曾接受有关衍生产品的培训或修读相关课程。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-experience"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("experience")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "experience", checked as boolean)}
                />
                <label htmlFor="cq6-experience" className="text-sm">
                  {t('客戶現時或過去擁有與衍生產品有關的工作經驗。', 'The Client has current or previous work experience related to derivative products.', '客户现时或过去拥有与衍生产品有关的工作经验。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-transactions"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("transactions")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "transactions", checked as boolean)}
                />
                <label htmlFor="cq6-transactions" className="text-sm">
                  {t('客戶於過往3年曾執行5次或以上有關衍生產品的交易，例如：衍生權證、牛熊證、股票、期貨及期權、商品、結構性產品、債券及易所買賣基金等。', 'The Client has executed five or more transactions within the past three years in derivative products, e.g. Derivative Warrants, Callable Bull/Bear Contracts, Stock Options, Futures and Options, Commodities, Structured Products, Bonds, and Exchange Traded Funds, etc.', '客户于过往3年曾执行5次或以上有关衍生产品的交易，例如：衍生权证、牛熊证、股票、期货及期权、商品、结构性产品、债券及交所买卖基金等。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cq6-no-knowledge"
                  checked={corpFormData.cq6_derivatives_knowledge.includes("no_knowledge")}
                  onCheckedChange={(checked) => handleCorpCheckboxChange("cq6_derivatives_knowledge", "no_knowledge", checked as boolean)}
                />
                <label htmlFor="cq6-no-knowledge" className="text-sm">
                  {t('客戶沒有衍生工具之認識。', 'The Client has NOT acquired knowledge of derivative products.', '客户没有衍生工具之认识。')}
                </label>
              </div>
            </div>
            {errors.q6 && <p className="text-sm text-destructive">{errors.q6}</p>}
          </div>
        </div>

        {/* PART 2: Q7-Q10 Corporate specific */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">{t('PART 2: 適用於公司客戶', 'PART 2: For Corporate Clients', 'PART 2: 适用于公司客户')}</h3>

          {/* CQ7 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q7. 貴公司會預留多少資金用在投資期內的投資？', 'Q7. What is the amount that your company will set aside for investing in investment products during its investment period?', 'Q7. 贵公司会预留多少资金用在投资期内的投资？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq7_investment_amount}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq7_investment_amount: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_1m" id="cq7-less-than-1m" />
                <label htmlFor="cq7-less-than-1m" className="text-sm">
                  {t('少於港幣$1,000,000', 'Less than HK$1,000,000', '少于港币$1,000,000')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="1m_to_5m" id="cq7-1m-to-5m" />
                <label htmlFor="cq7-1m-to-5m" className="text-sm">
                  {t('介乎港幣$1,000,001至港幣$5,000,000', 'Between HK$1,000,001 to HK$5,000,000', '介乎港币$1,000,001至港币$5,000,000')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="5m_to_10m" id="cq7-5m-to-10m" />
                <label htmlFor="cq7-5m-to-10m" className="text-sm">
                  {t('介乎港幣$5,000,001至港幣$10,000,000', 'Between HK$5,000,001 to HK$10,000,000', '介乎港币$5,000,001至港币$10,000,000')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_10m" id="cq7-more-than-10m" />
                <label htmlFor="cq7-more-than-10m" className="text-sm">
                  {t('多於港幣$10,000,000', 'Over HK$10,000,000', '多于港币$10,000,000')}
                </label>
              </div>
            </RadioGroup>
            {errors.q7 && <p className="text-sm text-destructive">{errors.q7}</p>}
          </div>

          {/* CQ8 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q8. 貴公司會把多少比例的資產投資於較高風險的投資項目？（如：窩輪，牛熊證等）', 'Q8. What is the percentage investing in higher risk products of your portfolio? (eg. Warrant, CBBCs etc.)', 'Q8. 贵公司会把多少比例的资产投资于较高风险的投资项目？（如：窝轮，牛熊证等）')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq8_high_risk_percentage}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq8_high_risk_percentage: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_25" id="cq8-less-than-25" />
                <label htmlFor="cq8-less-than-25" className="text-sm">
                  {t('少於25%', 'Less than 25%', '少于25%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="25_to_50" id="cq8-25-to-50" />
                <label htmlFor="cq8-25-to-50" className="text-sm">
                  {t('介乎25%至50%', 'Between 25% to 50%', '介乎25%至50%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="51_to_75" id="cq8-51-to-75" />
                <label htmlFor="cq8-51-to-75" className="text-sm">
                  {t('介乎51%至75%', 'Between 51% to 75%', '介乎51%至75%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_75" id="cq8-more-than-75" />
                <label htmlFor="cq8-more-than-75" className="text-sm">
                  {t('多於75%', 'More than 75%', '多于75%')}
                </label>
              </div>
            </RadioGroup>
            {errors.q8 && <p className="text-sm text-destructive">{errors.q8}</p>}
          </div>

          {/* CQ9 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q9. 貴公司是否聘用專業人員負責作出投資決定？', 'Q9. Does your company employ any dedicated professionals responsible for making investment decisions?', 'Q9. 贵公司是否聘用专业人员负责作出投资决定？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq9_dedicated_professionals}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq9_dedicated_professionals: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_no_knowledge" id="cq9-no-no-knowledge" />
                <label htmlFor="cq9-no-no-knowledge" className="text-sm leading-relaxed">
                  {t('否，本公司對投資決定沒有相關知識。', 'No, we do not have knowledge on making investment decisions.', '否，本公司对投资决定没有相关知识。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_adequate_knowledge" id="cq9-no-adequate" />
                <label htmlFor="cq9-no-adequate" className="text-sm leading-relaxed">
                  {t('否，但本公司對投資決定有足夠相關知識。', 'No, but we have adequate knowledge on making investment decisions.', '否，但本公司对投资决定有足够相关知识。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="yes_some_knowledge" id="cq9-yes-some" />
                <label htmlFor="cq9-yes-some" className="text-sm leading-relaxed">
                  {t('是，但本公司對投資決定只有一些或少許相關知識。', 'Yes, but we have only some or little knowledge on making investment decisions.', '是，但本公司对投资决定只有一些或少许相关知识。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="yes_adequate_management" id="cq9-yes-adequate" />
                <label htmlFor="cq9-yes-adequate" className="text-sm leading-relaxed">
                  {t('是，本公司有足夠相關知識的管理層作出投資決定。', 'Yes, we have senior management with adequate knowledge to make investment decisions.', '是，本公司有足够相关知识的管理层作出投资决定。')}
                </label>
              </div>
            </RadioGroup>
            {errors.q9 && <p className="text-sm text-destructive">{errors.q9}</p>}
          </div>

          {/* CQ10 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q10. 在一般情況下，貴公司會預留多少流動資金(當中包括現金、外幣、銀行存款等)作為每月營運開支儲備？', 'Q10. In general, how much liquid assets (e.g. cash, foreign currency, bank deposits, etc.) has your company reserved for monthly operational expenses?', 'Q10. 在一般情况下，贵公司会预留多少流动资金(当中包括现金、外币、银行存款等)作为每月营运开支储备？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={corpFormData.cq10_liquid_reserves}
              onValueChange={(value) => setCorpFormData(prev => ({ ...prev, cq10_liquid_reserves: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_3_months" id="cq10-less-than-3" />
                <label htmlFor="cq10-less-than-3" className="text-sm">
                  {t('少於3個月的營運開支儲備', 'Less than 3 months operational expenses', '少于3个月的营运开支储备')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="3_to_6_months" id="cq10-3-to-6" />
                <label htmlFor="cq10-3-to-6" className="text-sm">
                  {t('3個月至6個月的營運開支儲備', '3 months to 6-months operational expenses', '3个月至6个月的营运开支储备')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="6_to_12_months" id="cq10-6-to-12" />
                <label htmlFor="cq10-6-to-12" className="text-sm">
                  {t('6個月至12個月的營運開支儲備', '6 months to 12-months operational expenses', '6个月至12个月的营运开支储备')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_12_months" id="cq10-more-than-12" />
                <label htmlFor="cq10-more-than-12" className="text-sm">
                  {t('12個月以上的營運開支儲備', '12 months or above operational expenses', '12个月以上的营运开支储备')}
                </label>
              </div>
            </RadioGroup>
            {errors.q10 && <p className="text-sm text-destructive">{errors.q10}</p>}
          </div>
        </div>

        {/* 風險等級結果顯示 */}
        {corpFormData.riskLevel && corpFormData.riskDescription && (
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 text-primary">{t('貴公司的風險評估結果', 'Your Company\'s Risk Assessment Result', '贵公司的风险评估结果')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">{t('總分：', 'Total Score: ', '总分：')}</span>
                <span className="text-2xl font-bold text-primary">{corpFormData.totalScore || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">{t('風險等級：', 'Risk Level: ', '风险等级：')}</span>
                <span className="text-xl font-semibold text-primary">{corpFormData.riskLevel}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t('投資取向：', 'Investment Orientation: ', '投资取向：')}</p>
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
      <h3 className="text-xl font-semibold mb-2">{t('風險評估問卷', 'Risk Profile Questionnaire', '风险评估问卷')}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {t('請根據您的實際情況填寫以下問卷，以評估您的風險承受能力', 'Please complete the following questionnaire based on your actual situation to assess your risk tolerance', '请根据您的实际情况填写以下问卷，以评估您的风险承受能力')}
      </p>
      {isJoint && (
        <h3 className="text-lg font-bold text-primary border-b pb-2 mb-4">{t('賬戶主要持有人', 'Primary Account Holder', '账户主要持有人')}</h3>
      )}
      <CardContent className="space-y-8">
        {/* PART 1: 適用於全部客戶 */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">PART 1</h3>

          {/* Q1 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q1. 您/貴公司現在是否持有以下任何投資產品？(您/貴公司可選擇多於一項)', 'Q1. Are you / your company currently holding any of the below investment products? (You may select more than one option)', 'Q1. 您/贵公司现在是否持有以下任何投资产品？(您/贵公司可选择多于一项)')}<span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q1-savings"
                  checked={formData.q1_current_investments.includes("savings")}
                  onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "savings", checked as boolean)}
                />
                <label htmlFor="q1-savings" className="text-sm">
                  {t('儲蓄/定期儲蓄/存款證/保本產品', 'Savings/Fixed Deposits/Certificate of Deposits/Capital Protected Products', '儲蓄/定期儲蓄/存款證/保本產品')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q1-bonds"
                  checked={formData.q1_current_investments.includes("bonds")}
                  onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "bonds", checked as boolean)}
                />
                <label htmlFor="q1-bonds" className="text-sm">
                  {t('債券/證券/單位信託基金/投資相連保險計劃', 'Bonds/Stocks/Unit Trusts/Investment-Linked Insurance Plans', '債券/證券/單位信託基金/投資相連保險計劃')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q1-derivatives"
                  checked={formData.q1_current_investments.includes("derivatives")}
                  onCheckedChange={(checked) => handleCheckboxChange("q1_current_investments", "derivatives", checked as boolean)}
                />
                <label htmlFor="q1-derivatives" className="text-sm">
                  {t('期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資', 'Futures/Options/Derivatives/Structured investment products/Linked Deposits/Leveraged FX Trading', '期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資')}
                </label>
              </div>
            </div>
            {errors.q1 && <p className="text-sm text-destructive">{errors.q1}</p>}
          </div>

          {/* Q2 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q2. 當投資於投資產品時，預期投資年期是多少？', 'Q2. How long is the expected Investment horizon when investing in investment products?', 'Q2. 当投资于投资产品时，预期投资年期是多少？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.q2_investment_period}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q2_investment_period: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_1" id="q2-less-than-1" />
                <label htmlFor="q2-less-than-1" className="text-sm">
                  {t('沒有或少於1年', 'None or less than 1 year', '没有或少于1年')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="1_to_3" id="q2-1-to-3" />
                <label htmlFor="q2-1-to-3" className="text-sm">
                  {t('1-3年', '1-3 years', '1-3年')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_3" id="q2-more-than-3" />
                <label htmlFor="q2-more-than-3" className="text-sm">
                  {t('多於3年', 'Over 3 years', '多于3年')}
                </label>
              </div>
            </RadioGroup>
            {errors.q2 && <p className="text-sm text-destructive">{errors.q2}</p>}
          </div>

          {/* Q3 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q3. 一般而言，預期愈高回報，亦會涉及較高的價格波幅。您/貴公司可以接受以下哪個年度價格波幅？', 'Q3. Generally, the higher the expected return the higher price fluctuation may be involved. What level of annualized price fluctuation would you generally be comfortable with?', 'Q3. 一般而言，预期愈高回报，亦会涉及较高的价格波幅。您/贵公司可以接受以下哪个年度价格波幅？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.q3_price_volatility}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q3_price_volatility: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_percent" id="q3-10-percent" />
                <label htmlFor="q3-10-percent" className="text-sm">
                  {t('價格波幅介乎-10%至+10%', 'Price fluctuates between -10% and +10%', '價格波幅介乎-10%至+10%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="20_percent" id="q3-20-percent" />
                <label htmlFor="q3-20-percent" className="text-sm">
                  {t('價格波幅介乎-20%至+20%', 'Price fluctuates between -20% and +20%', '價格波幅介乎-20%至+20%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="30_percent" id="q3-30-percent" />
                <label htmlFor="q3-30-percent" className="text-sm">
                  {t('價格波幅多於-30%至多於+30%', 'Price fluctuates under -30% and over +30%', '價格波幅多於-30%至多於+30%')}
                </label>
              </div>
            </RadioGroup>
            {errors.q3 && <p className="text-sm text-destructive">{errors.q3}</p>}
          </div>

          {/* Q4 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？', 'Q4. What is the percentage of current net-worth (excluding the value of your self-occupied property) that can be allowed for investment purpose?', 'Q4. 在现时资产净值中(撇除自住物业价值)，有多少个百分比可作投资用途？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.q4_investment_percentage}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q4_investment_percentage: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="less_than_10" id="q4-less-than-10" />
                <label htmlFor="q4-less-than-10" className="text-sm">
                  {t('少於10%', 'Less than 10%', '少于10%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="10_to_20" id="q4-10-to-20" />
                <label htmlFor="q4-10-to-20" className="text-sm">
                  {t('介乎10%至20%', 'Between 10% to 20%', '介乎10%至20%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="21_to_30" id="q4-21-to-30" />
                <label htmlFor="q4-21-to-30" className="text-sm">
                  {t('介乎21%至30%', 'Between 21% to 30%', '介乎21%至30%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="31_to_50" id="q4-31-to-50" />
                <label htmlFor="q4-31-to-50" className="text-sm">
                  {t('介乎31%至50%', 'Between 31% to 50%', '介乎31%至50%')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="more_than_50" id="q4-more-than-50" />
                <label htmlFor="q4-more-than-50" className="text-sm">
                  {t('多於50%', 'More than 50%', '多于50%')}
                </label>
              </div>
            </RadioGroup>
            {errors.q4 && <p className="text-sm text-destructive">{errors.q4}</p>}
          </div>

          {/* Q5 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q5. 以下哪一句子最能貼切描述您/貴公司對金融投資的一般態度？', 'Q5. Which statement can best describe the general attitude of you or your company towards financial investment?', 'Q5. 以下哪一句子最能贴切描述您/贵公司对金融投资的一般态度？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.q5_investment_attitude}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q5_investment_attitude: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_volatility" id="q5-no-volatility" />
                <label htmlFor="q5-no-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司不能接受任何價格波動，並且對賺取投資回報不感興趣。', 'We cannot put up with any price fluctuation and have no interest on earnings.', '本人/本公司不能接受任何价格波动，并且对赚取投资回报不感兴趣。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="small_volatility" id="q5-small-volatility" />
                <label htmlFor="q5-small-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司只能接受較小幅度的價格波動，並且僅希望賺取稍高於銀行存款利率的回報。', 'We can only put up with little price fluctuation and wish to have earnings slightly higher than bank deposit rates.', '本人/本公司只能接受较小幅度的价格波动，并且仅希望赚取稍高于银行存款利率的回报。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="some_volatility" id="q5-some-volatility" />
                <label htmlFor="q5-some-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司可接受若干價格波幅，並希望賺取高於銀行存款利率的回報。', 'We can put up with some price fluctuation and wish to have earnings much better than bank deposit rates.', '本人/本公司可接受若干价格波幅，并希望赚取高于银行存款利率的回报。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="large_volatility" id="q5-large-volatility" />
                <label htmlFor="q5-large-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司可接受大幅度的價格波動，並希望賺取與股市指數表現相若的回報。', 'We can put up with high degree of price fluctuation and wish to have earnings comparable to stock market indexes.', '本人/本公司可接受大幅度的价格波动，并希望赚取与股市指数表现相若的回报。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="any_volatility" id="q5-any-volatility" />
                <label htmlFor="q5-any-volatility" className="text-sm leading-relaxed">
                  {t('本人/本公司可接受任何幅度的價格波動，並希望回報能超越股市指數。', 'We can put up with any price fluctuation and wish to have earnings remarkably higher than stock market indexes.', '本人/本公司可接受任何幅度的价格波动，并希望回报能超越股市指数。')}
                </label>
              </div>
            </RadioGroup>
            {errors.q5 && <p className="text-sm text-destructive">{errors.q5}</p>}
          </div>

          {/* Q6 */}
          <div className="space-y-3">
            <Label className="text-base font-medium block">
              {t('Q6. 您/貴公司對衍生工具產品的認識。(您/貴公司可選擇多於一項)', 'Q6. The knowledge on derivative products of clients. (You may select more than one option)', 'Q6. 您/贵公司对衍生工具产品的认识。(您/贵公司可选择多于一项)')}<span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-training"
                  checked={formData.q6_derivatives_knowledge.includes("training")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "training", checked as boolean)}
                />
                <label htmlFor="q6-training" className="text-sm">
                  {t('客戶曾接受有關衍生產品的培訓或修讀相關課程。', 'The Client underwent training or attended courses on derivative products.', '客户曾接受有关衍生产品的培训或修读相关课程。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-experience"
                  checked={formData.q6_derivatives_knowledge.includes("experience")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "experience", checked as boolean)}
                />
                <label htmlFor="q6-experience" className="text-sm">
                  {t('客戶現時或過去擁有與衍生產品有關的工作經驗。', 'The Client has current or previous work experience related to derivative products.', '客户现时或过去拥有与衍生产品有关的工作经验。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-transactions"
                  checked={formData.q6_derivatives_knowledge.includes("transactions")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "transactions", checked as boolean)}
                />
                <label htmlFor="q6-transactions" className="text-sm">
                  {t('客戶於過往3年曾執行5次或以上有關衍生產品的交易，例如：衍生權證、牛熊證、股票、期貨及期權、商品、結構性產品、債券及易所買賣基金等。', 'The Client has executed five or more transactions within the past three years in derivative products, e.g. Derivative Warrants, Callable Bull/Bear Contracts, Stock Options, Futures and Options, Commodities, Structured Products, Bonds, and Exchange Traded Funds, etc.', '客户于过往3年曾执行5次或以上有关衍生产品的交易，例如：衍生权证、牛熊证、股票、期货及期权、商品、结构性产品、债券及交所买卖基金等。')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="q6-no-knowledge"
                  checked={formData.q6_derivatives_knowledge.includes("no_knowledge")}
                  onCheckedChange={(checked) => handleCheckboxChange("q6_derivatives_knowledge", "no_knowledge", checked as boolean)}
                />
                <label htmlFor="q6-no-knowledge" className="text-sm">
                  {t('客戶沒有衍生工具之認識。', 'The Client has NOT acquired knowledge of derivative products.', '客户没有衍生工具之认识。')}
                </label>
              </div>
            </div>
            {errors.q6 && <p className="text-sm text-destructive">{errors.q6}</p>}
          </div>
        </div>

        {/* PART 2: 適用於個人/聯名客戶 */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">{t('PART 2: 適用於個人/聯名客戶', 'PART 2: For Individual/Joint Clients', 'PART 2: 适用于个人/联名客户')}</h3>

          {/* Q7 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('Q7. 您屬於以下哪個年齡組別？', 'Q7. Which age group do you belong to?', 'Q7. 您属于以下哪个年龄组别？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.q7_age_group}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q7_age_group: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_18_25" id="q7-age-18-25" />
                <label htmlFor="q7-age-18-25" className="text-sm">
                  {t('介乎18至25歲', 'Between 18 and 25', '介乎18至25岁')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_26_35" id="q7-age-26-35" />
                <label htmlFor="q7-age-26-35" className="text-sm">
                  {t('介乎26至35歲', 'Between 26 and 35', '介乎26至35岁')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_36_50" id="q7-age-36-50" />
                <label htmlFor="q7-age-36-50" className="text-sm">
                  {t('介乎36至50歲', 'Between 36 and 50', '介乎36至50岁')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_51_64" id="q7-age-51-64" />
                <label htmlFor="q7-age-51-64" className="text-sm">
                  {t('介乎51至64歲', 'Between 51 and 64', '介乎51至64岁')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="age_65_plus" id="q7-age-65-plus" />
                <label htmlFor="q7-age-65-plus" className="text-sm">
                  {t('65歲或以上', '65 or above', '65岁或以上')}
                </label>
              </div>
            </RadioGroup>
            {errors.q7 && <p className="text-sm text-destructive">{errors.q7}</p>}
          </div>

          {/* Q8 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('Q8. 您的教育程度是？', 'Q8. What is your education level?', 'Q8. 您的教育程度是？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.q8_education_level}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q8_education_level: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="primary_or_below" id="q8-primary" />
                <label htmlFor="q8-primary" className="text-sm">
                  {t('小學或以下', 'Primary school or below', '小学或以下')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="secondary" id="q8-secondary" />
                <label htmlFor="q8-secondary" className="text-sm">
                  {t('中學', 'Secondary school', '中学')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="post_secondary" id="q8-post-secondary" />
                <label htmlFor="q8-post-secondary" className="text-sm">
                  {t('大專或以上', 'Post-secondary or above', '大专或以上')}
                </label>
              </div>
            </RadioGroup>
            {errors.q8 && <p className="text-sm text-destructive">{errors.q8}</p>}
          </div>

          {/* Q9 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('Q9. 您曾經或現時從以下哪些途徑獲取投資知識？', 'Q9. Through which channels have you acquired investment knowledge?', 'Q9. 您曾经或现时从以下哪些途径获取投资知识？')}<span className="text-destructive">*</span>
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
                  {t('從未獲取及/或沒有興趣獲取任何投資知識', 'Never acquired and/or not interested in acquiring any investment knowledge', '从未获取及/或没有兴趣获取任何投资知识')}
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
                  {t('與親友及/或同事討論投資或理財話題', 'Discussed investment or financial topics with relatives and/or colleagues', '与亲友及/或同事讨论投资或理财话题')}
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
                  {t('閱讀及/或收聽有關投資或財經新聞', 'Read and/or listened to investment or financial news', '阅读及/或收听有关投资或财经新闻')}
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
                  {t('研究投資或財務相關事宜，或參加投資或財務相關課程、論壇、簡報會、研討會或工作坊', 'Researched investment or financial matters, or attended related courses, forums, briefings, seminars or workshops', '研究投资或财务相关事宜，或参加投资或财务相关课程、论坛、简报会、研讨会或工作坊')}
                </label>
              </div>
            </div>
            {errors.q9 && <p className="text-sm text-destructive">{errors.q9}</p>}
          </div>

          {/* Q10 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('Q10. 您需要將多少投資兌現，以滿足突發事件的流動資金需求？', 'Q10. How much of your investments would you need to liquidate to meet emergency liquidity needs?', 'Q10. 您需要将多少投资兑现，以满足突发事件的流动资金需求？')}<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.q10_liquidity_needs}
              onValueChange={(value) => setFormData(prev => ({ ...prev, q10_liquidity_needs: value }))}
              className="space-y-2 pl-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no_sell" id="q10-no-sell" />
                <label htmlFor="q10-no-sell" className="text-sm">
                  {t('不需要出售任何投資', 'No need to sell any investment', '不需要出售任何投资')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sell_less_30" id="q10-sell-less-30" />
                <label htmlFor="q10-sell-less-30" className="text-sm">
                  {t('我會出售不超過30%的投資', 'I would sell no more than 30% of my investments', '我会出售不超过30%的投资')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sell_30_50" id="q10-sell-30-50" />
                <label htmlFor="q10-sell-30-50" className="text-sm">
                  {t('我會出售超過30%但不到50%的投資', 'I would sell more than 30% but less than 50%', '我会出售超过30%但不到50%的投资')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sell_more_50" id="q10-sell-more-50" />
                <label htmlFor="q10-sell-more-50" className="text-sm">
                  {t('我會出售超過50%的投資', 'I would sell more than 50% of my investments', '我会出售超过50%的投资')}
                </label>
              </div>
            </RadioGroup>
            {errors.q10 && <p className="text-sm text-destructive">{errors.q10}</p>}
          </div>
        </div>

        {/* 風險等級結果顯示 */}
        {formData.riskLevel && formData.riskDescription && (
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 text-primary">{t('您的風險評估結果', 'Your Risk Assessment Result', '您的风险评估结果')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">{t('總分：', 'Total Score: ', '总分：')}</span>
                <span className="text-2xl font-bold text-primary">{formData.totalScore || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">{t('風險等級：', 'Risk Level: ', '风险等级：')}</span>
                <span className="text-xl font-semibold text-primary">{formData.riskLevel}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t('投資取向：', 'Investment Orientation: ', '投资取向：')}</p>
                <p className="text-sm leading-relaxed whitespace-pre-line">{formData.riskDescription}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* 聯名賬戶：第二持有人 */}
      {isJoint && (
        <>
          <h3 className="text-lg font-bold text-primary border-b pb-2 mt-8 mb-4">{t('賬戶第二持有人', 'Second Account Holder', '账户第二持有人')}</h3>
          <CardContent className="space-y-8">
            {/* PART 1 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">PART 1</h3>

              {/* Q1 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">
                  {t('Q1. 您/貴公司現在是否持有以下任何投資產品？(您/貴公司可選擇多於一項)', 'Q1. Are you / your company currently holding any of the below investment products? (You may select more than one option)', 'Q1. 您/贵公司现在是否持有以下任何投资产品？(您/贵公司可选择多于一项)')}<span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq1-savings" checked={secondFormData.q1_current_investments.includes("savings")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q1_current_investments", "savings", checked as boolean)} />
                    <label htmlFor="sq1-savings" className="text-sm">
                      {t('儲蓄/定期儲蓄/存款證/保本產品', 'Savings/Fixed Deposits/Certificate of Deposits/Capital Protected Products', '储蓄/定期储蓄/存款证/保本产品')}
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq1-bonds" checked={secondFormData.q1_current_investments.includes("bonds")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q1_current_investments", "bonds", checked as boolean)} />
                    <label htmlFor="sq1-bonds" className="text-sm">
                      {t('債券/證券/單位信託基金/投資相連保險計劃', 'Bonds/Stocks/Unit Trusts/Investment-Linked Insurance Plans', '债券/证券/单位信托基金/投资相连保险计划')}
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq1-derivatives" checked={secondFormData.q1_current_investments.includes("derivatives")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q1_current_investments", "derivatives", checked as boolean)} />
                    <label htmlFor="sq1-derivatives" className="text-sm">
                      {t('期貨/期權/衍生產品/結構性投資產品/掛鈎存款/槓桿式外匯投資', 'Futures/Options/Derivatives/Structured investment products/Linked Deposits/Leveraged FX Trading', '期货/期权/衍生产品/结构性投资产品/挂钩存款/杠杆式外汇投资')}
                    </label>
                  </div>
                </div>
                {errors.sq1 && <p className="text-sm text-destructive">{errors.sq1}</p>}
              </div>

              {/* Q2 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">{t('Q2. 當投資於投資產品時，預期投資年期是多少？', 'Q2. How long is the expected Investment horizon when investing in investment products?', 'Q2. 当投资于投资产品时，预期投资年期是多少？')}<span className="text-destructive">*</span></Label>
                <RadioGroup value={secondFormData.q2_investment_period}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q2_investment_period: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="less_than_1" id="sq2-less-than-1" />
                    <label htmlFor="sq2-less-than-1" className="text-sm">{t('沒有或少於1年', 'None or less than 1 year', '没有或少于1年')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="1_to_3" id="sq2-1-to-3" />
                    <label htmlFor="sq2-1-to-3" className="text-sm">{t('1-3年', '1-3 years', '1-3年')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="more_than_3" id="sq2-more-than-3" />
                    <label htmlFor="sq2-more-than-3" className="text-sm">{t('多於3年', 'Over 3 years', '多于3年')}</label>
                  </div>
                </RadioGroup>
                {errors.sq2 && <p className="text-sm text-destructive">{errors.sq2}</p>}
              </div>

              {/* Q3 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">{t('Q3. 一般而言，預期愈高回報，亦會涉及較高的價格波幅。您可以接受以下哪個年度價格波幅？', 'Q3. Generally, the higher the expected return the higher price fluctuation may be involved. What level of annualized price fluctuation would you generally be comfortable with?', 'Q3. 一般而言，预期愈高回报，亦会涉及较高的价格波幅。您可以接受以下哪个年度价格波幅？')}<span className="text-destructive">*</span></Label>
                <RadioGroup value={secondFormData.q3_price_volatility}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q3_price_volatility: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="10_percent" id="sq3-10-percent" />
                    <label htmlFor="sq3-10-percent" className="text-sm">{t('價格波幅介乎-10%至+10%', 'Price fluctuates between -10% and +10%', '价格波幅介乎-10%至+10%')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="20_percent" id="sq3-20-percent" />
                    <label htmlFor="sq3-20-percent" className="text-sm">{t('價格波幅介乎-20%至+20%', 'Price fluctuates between -20% and +20%', '价格波幅介乎-20%至+20%')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="30_percent" id="sq3-30-percent" />
                    <label htmlFor="sq3-30-percent" className="text-sm">{t('價格波幅多於-30%至多於+30%', 'Price fluctuates under -30% and over +30%', '价格波幅多于-30%至多于+30%')}</label>
                  </div>
                </RadioGroup>
                {errors.sq3 && <p className="text-sm text-destructive">{errors.sq3}</p>}
              </div>

              {/* Q4 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">{t('Q4. 在現時資產淨值中(撇除自住物業價值)，有多少個百分比可作投資用途？', 'Q4. What is the percentage of current net-worth (excluding the value of your self-occupied property) that can be allowed for investment purpose?', 'Q4. 在现时资产净值中(撇除自住物业价值)，有多少个百分比可作投资用途？')}<span className="text-destructive">*</span></Label>
                <RadioGroup value={secondFormData.q4_investment_percentage}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q4_investment_percentage: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="less_than_10" id="sq4-less-than-10" />
                    <label htmlFor="sq4-less-than-10" className="text-sm">{t('少於10%', 'Less than 10%', '少于10%')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="10_to_20" id="sq4-10-to-20" />
                    <label htmlFor="sq4-10-to-20" className="text-sm">{t('介乎10%至20%', 'Between 10% to 20%', '介乎10%至20%')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="21_to_30" id="sq4-21-to-30" />
                    <label htmlFor="sq4-21-to-30" className="text-sm">{t('介乎21%至30%', 'Between 21% to 30%', '介乎21%至30%')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="31_to_50" id="sq4-31-to-50" />
                    <label htmlFor="sq4-31-to-50" className="text-sm">{t('介乎31%至50%', 'Between 31% to 50%', '介乎31%至50%')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="more_than_50" id="sq4-more-than-50" />
                    <label htmlFor="sq4-more-than-50" className="text-sm">{t('多於50%', 'More than 50%', '多于50%')}</label>
                  </div>
                </RadioGroup>
                {errors.sq4 && <p className="text-sm text-destructive">{errors.sq4}</p>}
              </div>

              {/* Q5 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">{t('Q5. 以下哪一句子最能貼切描述您對金融投資的一般態度？', 'Q5. Which statement can best describe your general attitude towards financial investment?', 'Q5. 以下哪一句子最能贴切描述您对金融投资的一般态度？')}<span className="text-destructive">*</span></Label>
                <RadioGroup value={secondFormData.q5_investment_attitude}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q5_investment_attitude: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="no_volatility" id="sq5-no-volatility" />
                    <label htmlFor="sq5-no-volatility" className="text-sm">{t('不能接受任何價格波動', 'Cannot accept any price fluctuation', '不能接受任何价格波动')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="small_volatility" id="sq5-small-volatility" />
                    <label htmlFor="sq5-small-volatility" className="text-sm">{t('只能接受較小幅度的價格波動', 'Can only accept small price fluctuation', '只能接受较小幅度的价格波动')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="some_volatility" id="sq5-some-volatility" />
                    <label htmlFor="sq5-some-volatility" className="text-sm">{t('可接受若干價格波幅', 'Can accept some price fluctuation', '可接受若干价格波幅')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="large_volatility" id="sq5-large-volatility" />
                    <label htmlFor="sq5-large-volatility" className="text-sm">{t('可接受大幅度的價格波動', 'Can accept large price fluctuation', '可接受大幅度的价格波动')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="any_volatility" id="sq5-any-volatility" />
                    <label htmlFor="sq5-any-volatility" className="text-sm">{t('可接受任何幅度的價格波動', 'Can accept any price fluctuation', '可接受任何幅度的价格波动')}</label>
                  </div>
                </RadioGroup>
                {errors.sq5 && <p className="text-sm text-destructive">{errors.sq5}</p>}
              </div>

              {/* Q6 */}
              <div className="space-y-3">
                <Label className="text-base font-medium block">{t('Q6. 您對衍生工具產品的認識。(可選擇多於一項)', 'Q6. Your knowledge of derivative products. (You may select more than one option)', 'Q6. 您对衍生工具产品的认识。(可选择多于一项)')}<span className="text-destructive">*</span></Label>
                <div className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-training" checked={secondFormData.q6_derivatives_knowledge.includes("training")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "training", checked as boolean)} />
                    <label htmlFor="sq6-training" className="text-sm">{t('曾接受有關衍生產品的培訓或修讀相關課程', 'Underwent training or attended courses on derivative products', '曾接受有关衍生产品的培训或修读相关课程')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-experience" checked={secondFormData.q6_derivatives_knowledge.includes("experience")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "experience", checked as boolean)} />
                    <label htmlFor="sq6-experience" className="text-sm">{t('現時或過去擁有與衍生產品有關的工作經驗', 'Has current or previous work experience related to derivative products', '现时或过去拥有与衍生产品有关的工作经验')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-transactions" checked={secondFormData.q6_derivatives_knowledge.includes("transactions")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "transactions", checked as boolean)} />
                    <label htmlFor="sq6-transactions" className="text-sm">{t('過往3年曾執行5次或以上有關衍生產品的交易', 'Executed 5 or more derivative product transactions in the past 3 years', '过往3年曾执行5次或以上有关衍生产品的交易')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="sq6-no-knowledge" checked={secondFormData.q6_derivatives_knowledge.includes("no_knowledge")}
                      onCheckedChange={(checked) => handleSecondCheckboxChange("q6_derivatives_knowledge", "no_knowledge", checked as boolean)} />
                    <label htmlFor="sq6-no-knowledge" className="text-sm">{t('沒有衍生工具之認識', 'No knowledge of derivative products', '没有衍生工具之认识')}</label>
                  </div>
                </div>
                {errors.sq6 && <p className="text-sm text-destructive">{errors.sq6}</p>}
              </div>
            </div>

            {/* PART 2 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">{t('PART 2: 適用於個人/聯名客戶', 'PART 2: For Individual/Joint Clients', 'PART 2: 适用于个人/联名客户')}</h3>

              {/* Q7 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t('Q7. 您屬於以下哪個年齡組別？', 'Q7. Which age group do you belong to?', 'Q7. 您属于以下哪个年龄组别？')}<span className="text-destructive">*</span></Label>
                <RadioGroup value={secondFormData.q7_age_group}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q7_age_group: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_18_25" id="sq7-age-18-25" />
                    <label htmlFor="sq7-age-18-25" className="text-sm">{t('介乎18至25歲', 'Between 18 and 25', '介乎18至25岁')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_26_35" id="sq7-age-26-35" />
                    <label htmlFor="sq7-age-26-35" className="text-sm">{t('介乎26至35歲', 'Between 26 and 35', '介乎26至35岁')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_36_50" id="sq7-age-36-50" />
                    <label htmlFor="sq7-age-36-50" className="text-sm">{t('介乎36至50歲', 'Between 36 and 50', '介乎36至50岁')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_51_64" id="sq7-age-51-64" />
                    <label htmlFor="sq7-age-51-64" className="text-sm">{t('介乎51至64歲', 'Between 51 and 64', '介乎51至64岁')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="age_65_plus" id="sq7-age-65-plus" />
                    <label htmlFor="sq7-age-65-plus" className="text-sm">{t('65歲或以上', '65 or above', '65岁或以上')}</label>
                  </div>
                </RadioGroup>
                {errors.sq7 && <p className="text-sm text-destructive">{errors.sq7}</p>}
              </div>

              {/* Q8 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t('Q8. 您的教育程度是？', 'Q8. What is your education level?', 'Q8. 您的教育程度是？')}<span className="text-destructive">*</span></Label>
                <RadioGroup value={secondFormData.q8_education_level}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q8_education_level: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="primary_or_below" id="sq8-primary" />
                    <label htmlFor="sq8-primary" className="text-sm">{t('小學或以下', 'Primary school or below', '小学或以下')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="secondary" id="sq8-secondary" />
                    <label htmlFor="sq8-secondary" className="text-sm">{t('中學', 'Secondary school', '中学')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="post_secondary" id="sq8-post-secondary" />
                    <label htmlFor="sq8-post-secondary" className="text-sm">{t('大專或以上', 'Post-secondary or above', '大专或以上')}</label>
                  </div>
                </RadioGroup>
                {errors.sq8 && <p className="text-sm text-destructive">{errors.sq8}</p>}
              </div>

              {/* Q9 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t('Q9. 您曾經或現時從以下哪些途徑獲取投資知識？', 'Q9. Through which channels have you acquired investment knowledge?', 'Q9. 您曾经或现时从以下哪些途径获取投资知识？')}<span className="text-destructive">*</span></Label>
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
                    <label htmlFor="sq9-never" className="text-sm">{t('從未獲取及/或沒有興趣獲取任何投資知識', 'Never acquired and/or not interested in acquiring any investment knowledge', '从未获取及/或没有兴趣获取任何投资知识')}</label>
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
                    <label htmlFor="sq9-relatives" className="text-sm">{t('與親友及/或同事討論投資或理財話題', 'Discussed investment or financial topics with relatives and/or colleagues', '与亲友及/或同事讨论投资或理财话题')}</label>
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
                    <label htmlFor="sq9-media" className="text-sm">{t('閱讀及/或收聽有關投資或財經新聞', 'Read and/or listened to investment or financial news', '阅读及/或收听有关投资或财经新闻')}</label>
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
                    <label htmlFor="sq9-courses" className="text-sm">{t('研究投資或財務相關事宜，或參加投資或財務相關課程', 'Researched investment or financial matters, or attended related courses', '研究投资或财务相关事宜，或参加投资或财务相关课程')}</label>
                  </div>
                </div>
                {errors.sq9 && <p className="text-sm text-destructive">{errors.sq9}</p>}
              </div>

              {/* Q10 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t('Q10. 您需要將多少投資兌現，以滿足突發事件的流動資金需求？', 'Q10. How much of your investments would you need to liquidate to meet emergency liquidity needs?', 'Q10. 您需要将多少投资兑现，以满足突发事件的流动资金需求？')}<span className="text-destructive">*</span></Label>
                <RadioGroup value={secondFormData.q10_liquidity_needs}
                  onValueChange={(value) => setSecondFormData(prev => ({ ...prev, q10_liquidity_needs: value }))}
                  className="space-y-2 pl-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="no_sell" id="sq10-no-sell" />
                    <label htmlFor="sq10-no-sell" className="text-sm">{t('不需要出售任何投資', 'No need to sell any investment', '不需要出售任何投资')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="sell_less_30" id="sq10-sell-less-30" />
                    <label htmlFor="sq10-sell-less-30" className="text-sm">{t('出售不超過30%的投資', 'Sell no more than 30% of investments', '出售不超过30%的投资')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="sell_30_50" id="sq10-sell-30-50" />
                    <label htmlFor="sq10-sell-30-50" className="text-sm">{t('出售超過30%但不到50%的投資', 'Sell more than 30% but less than 50%', '出售超过30%但不到50%的投资')}</label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="sell_more_50" id="sq10-sell-more-50" />
                    <label htmlFor="sq10-sell-more-50" className="text-sm">{t('出售超過50%的投資', 'Sell more than 50% of investments', '出售超过50%的投资')}</label>
                  </div>
                </RadioGroup>
                {errors.sq10 && <p className="text-sm text-destructive">{errors.sq10}</p>}
              </div>
            </div>
          </CardContent>

          {/* 第二持有人風險評估結果 */}
          {secondFormData.riskLevel && secondFormData.riskDescription && (
            <div className="mt-8 p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
              <h3 className="text-lg font-semibold mb-4 text-primary">{t('第二持有人風險評估結果', 'Second Holder Risk Assessment Result', '第二持有人风险评估结果')}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">{t('總分：', 'Total Score: ', '总分：')}</span>
                  <span className="text-2xl font-bold text-primary">{secondFormData.totalScore || 0}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">{t('風險等級：', 'Risk Level: ', '风险等级：')}</span>
                  <span className="text-xl font-semibold text-primary">{secondFormData.riskLevel}</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{t('投資取向：', 'Investment Orientation: ', '投资取向：')}</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{secondFormData.riskDescription}</p>
                </div>
              </div>
            </div>
          )}
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
