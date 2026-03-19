import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_VERSION } from "@/const";

interface Step {
  id: number;
  title: string;
  description: string;
}

const individualSteps: Step[] = [
  { id: 1, title: "客戶與賬戶類型", description: "選擇客戶與賬戶類型" },
  { id: 2, title: "個人基本信息", description: "填寫基本資料" },
  { id: 3, title: "個人詳細信息", description: "填寫詳細資料" },
  { id: 4, title: "職業信息", description: "填寫職業狀況" },
  { id: 5, title: "就業詳情", description: "填寫收入資產" },
  { id: 6, title: "財務與投資", description: "填寫投資信息" },
  { id: 7, title: "風險評估問卷", description: "完成風險評估" },
  { id: 8, title: "銀行賬戶", description: "添加銀行賬戶" },
  { id: 9, title: "稅務信息", description: "填寫稅務資料" },
  { id: 10, title: "文件上傳", description: "上傳證明文件" },
  { id: 11, title: "人臉識別", description: "進行人臉驗證" },
  { id: 12, title: "監管聲明", description: "簽署協議" },
];

const corporateSteps: Step[] = [
  { id: 1, title: "客戶與賬戶類型", description: "選擇客戶與賬戶類型" },
  { id: 2, title: "機構基本信息", description: "填寫公司基本資料" },
  { id: 3, title: "公司財務與投資概況", description: "填寫財務與投資背景" },
  { id: 4, title: "關聯人士信息", description: "填寫董事及授權人資料" },
  { id: 5, title: "風險評估問卷", description: "完成風險評估" },
  { id: 6, title: "結算銀行賬戶", description: "添加公司銀行賬戶" },
  { id: 7, title: "稅務信息", description: "填寫公司稅務資料" },
  { id: 8, title: "文件上傳", description: "上傳機構證明文件" },
  { id: 9, title: "監管聲明", description: "公司蓋章與簽署" },
];

interface ApplicationWizardProps {
  applicationId: number;
  currentStep: number;
  children: ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onSave?: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  isSaveLoading?: boolean;
  hideNext?: boolean;
  hidePrevious?: boolean;
  nextLabel?: string;
  showReturnToPreview?: boolean;
  customerTypeOverride?: "individual" | "joint" | "corporate";
}

export default function ApplicationWizard({
  applicationId,
  currentStep,
  children,
  onNext,
  onPrevious,
  onSave,
  isNextDisabled = false,
  isNextLoading = false,
  isSaveLoading = false,
  hideNext = false,
  hidePrevious = false,
  nextLabel = "下一步",
  showReturnToPreview = false,
  customerTypeOverride,
}: ApplicationWizardProps) {
  const [, setLocation] = useLocation();

  // 获取账户选择信息以判断客户类型
  const { data: accountSelection, error: accountSelectionError } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { 
      enabled: !!applicationId,
      retry: 1,
    }
  );

  // Log error for debugging
  if (accountSelectionError) {
    console.error("Error fetching account selection:", accountSelectionError);
  }

  // 根据客户类型选择步骤列表
  const customerType = customerTypeOverride || accountSelection?.customerType || 'individual';
  const steps = customerType === 'corporate' ? corporateSteps : individualSteps;
  const progress = (currentStep / steps.length) * 100;
  const currentStepInfo = steps.find(s => s.id === currentStep);

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else if (currentStep > 1) {
      setLocation(`/application/${applicationId}/step/${currentStep - 1}`);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (currentStep < steps.length) {
      setLocation(`/application/${applicationId}/step/${currentStep + 1}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          {/* Logo and Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center">
                <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
              </a>
              <div className="hidden sm:block border-l pl-3 ml-1">
                <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  诚港金融开户系统
                  <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">v1.0.260319.004</span>
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/applications")}
            >
              返回申請列表
            </Button>
          </div>
          {/* Mobile Title */}
          <div className="sm:hidden mb-3">
            <h1 className="text-base font-semibold text-gray-800 flex items-center justify-between">
              <span>诚港金融开户系统</span>
              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">v1.0.260319.004</span>
            </h1>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                步驟 {currentStep} / {steps.length}: {currentStepInfo?.title}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% 完成</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">{currentStepInfo?.title}</h2>
            <p className="text-muted-foreground">{currentStepInfo?.description}</p>
          </div>

          {/* Form Content */}
          <Card className="p-6 mb-6">
            {children}
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {!hidePrevious && currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  上一步
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setLocation(`/application/${applicationId}/preview`)}
                disabled={!showReturnToPreview}
              >
                <FileText className="h-4 w-4 mr-2" />
                返回預覽
              </Button>
            </div>

            <div className="flex gap-2">
              {onSave && (
                <Button
                  variant="outline"
                  onClick={onSave}
                  disabled={isSaveLoading}
                >
                  {isSaveLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span>
                      保存中...
                    </span>
                  ) : (
                    "保存"
                  )}
                </Button>
              )}
              {!hideNext && (
                <Button
                  onClick={handleNext}
                  disabled={isNextDisabled || isNextLoading}
                >
                  {isNextLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span>
                      處理中...
                    </span>
                  ) : (
                    <>
                      {nextLabel}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Steps Sidebar (Desktop) */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 w-64">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">申請步驟</h3>
          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : "text-muted-foreground"
                }`}
                onClick={() => {
                  if (step.id <= currentStep) {
                    setLocation(`/application/${applicationId}/step/${step.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.id}.</span>
                  <span>{step.title}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
