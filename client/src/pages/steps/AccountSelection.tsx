import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLang } from '@/lib/i18n';

export default function AccountSelection() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  const { t } = useLang();

  const [customerType, setCustomerType] = useState<"individual" | "joint" | "corporate">("individual");
  const [corporateSubType, setCorporateSubType] = useState<"corporate_pi" | "institutional_pi" | "">("");
  const [accountType, setAccountType] = useState<"cash" | "margin" | "derivatives">("cash");

  const { data: existingData, isLoading: isLoadingData } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.accountSelection.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('保存成功', 'Saved successfully'));
        setLocation(`/application/${applicationId}/step/2`);
      }
    },
    onError: (error) => {
      toast.error(`${t('保存失敗', 'Save failed')}: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setCustomerType(existingData.customerType);
      setAccountType(existingData.accountType);
      if (existingData.corporateSubType) {
        setCorporateSubType(existingData.corporateSubType as any);
      }
    }
  }, [existingData]);

const handleNext = () => {
    // 機構賬戶必須選擇子類型
    if (customerType === 'corporate' && !corporateSubType) {
      alert(t('請選擇機構類型（公司專業投資者或機構專業投資者）', 'Please select institution type (Corporate PI or Institutional PI)', '请选择机构类型（公司专业投资者或机构专业投资者）'));
      return;
    }
    saveMutation.mutate({
      applicationId,
      customerType,
      accountType,
      corporateSubType: customerType === 'corporate' ? corporateSubType as any : undefined,
    });
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard 
        applicationId={applicationId} 
        currentStep={1}
        showReturnToPreview={showReturnToPreview}
        customerTypeOverride={customerType}
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
      currentStep={1}
      onNext={handleNext}
      isNextLoading={saveMutation.isPending}
      hidePrevious
      showReturnToPreview={showReturnToPreview}
      customerTypeOverride={customerType}
    >
      <div className="space-y-8">
        {/* Case 1: 客戶類型 */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{t('客戶類型', 'Customer Type', '客户类型')}</h3>
            <p className="text-sm text-muted-foreground">{t('請選擇您的客戶類型', 'Please select your customer type', '请选择您的客户类型')}</p>
          </div>
          
          <RadioGroup value={customerType} onValueChange={(v) => setCustomerType(v as any)}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">{t('個人賬戶', 'Individual Account', '个人账户')}</div>
                  <div className="text-sm text-muted-foreground">{t('適用於個人投資者', 'For individual investors', '适用于个人投资者')}</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <RadioGroupItem value="joint" id="joint" />
              <Label htmlFor="joint" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">{t('聯名賬戶', 'Joint Account', '联名账户')}</div>
                  <div className="text-sm text-muted-foreground">{t('適用於聯名投資者', 'For joint investors', '适用于联名投资者')}</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <RadioGroupItem value="corporate" id="corporate" />
              <Label htmlFor="corporate" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">{t('公司/機構賬戶', 'Corporate/Institutional Account', '公司/机构账户')}</div>
                  <div className="text-sm text-gray-500">{t('可選擇公司/機構專業投資者', 'Choose Corporate/Institutional Professional Investor', '可选择公司/机构专业投资者')}</div>
                </div>
              </Label>
            </div>

            {/* Corporate sub-type options */}
            {customerType === "corporate" && (
              <div className="ml-8 space-y-2 border-l-2 border-blue-200 pl-4">
                <p className="text-xs text-muted-foreground font-medium">{t('請選擇機構類型：', 'Please select institution type:', '请选择机构类型：')}</p>
                <div
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${corporateSubType === 'corporate_pi' ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50'}`}
                  onClick={() => setCorporateSubType('corporate_pi')}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${corporateSubType === 'corporate_pi' ? 'border-blue-600' : 'border-gray-300'}`}>
                    {corporateSubType === 'corporate_pi' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t('公司專業投資者', 'Corporate Professional Investor', '公司专业投资者')}</div>
                  </div>
                </div>
                <div
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${corporateSubType === 'institutional_pi' ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50'}`}
                  onClick={() => setCorporateSubType('institutional_pi')}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${corporateSubType === 'institutional_pi' ? 'border-blue-600' : 'border-gray-300'}`}>
                    {corporateSubType === 'institutional_pi' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t('機構專業投資者', 'Institutional Professional Investor', '机构专业投资者')}</div>
                  </div>
                </div>
              </div>
            )}
          </RadioGroup>
        </div>

        {/* Case 2: 賬戶類型 */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="text-lg font-semibold mb-1">{t('賬戶類型', 'Account Type', '账户类型')}</h3>
            <p className="text-sm text-muted-foreground">{t('請選擇您要開設的賬戶類型', 'Please select the account type you wish to open', '请选择您要开设的账户类型')}</p>
          </div>
          
          <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as any)}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">{t('現金賬戶', 'Cash Account', '现金账户')}</div>
                  <div className="text-sm text-muted-foreground">{t('適用於現金交易', 'For cash transactions', '适用于现金交易')}</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50 cursor-not-allowed">
              <RadioGroupItem value="margin" id="margin" disabled />
              <Label htmlFor="margin" className="flex-1">
                <div>
                  <div className="font-medium">{t('保證金賬戶', 'Margin Account', '保证金账户')}</div>
                  <div className="text-sm text-muted-foreground">{t('暫不開放（即將推出）', 'Not yet available (coming soon)', '暂不开放（即将推出）')}</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50 cursor-not-allowed">
              <RadioGroupItem value="derivatives" id="derivatives" disabled />
              <Label htmlFor="derivatives" className="flex-1">
                <div>
                  <div className="font-medium">{t('衍生品賬戶', 'Derivatives Account', '衍生品账户')}</div>
                  <div className="text-sm text-muted-foreground">{t('暫不開放（即將推出）', 'Not yet available (coming soon)', '暂不开放（即将推出）')}</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </ApplicationWizard>
  );
}
