import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AccountSelection() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  const [customerType, setCustomerType] = useState<"individual" | "joint" | "corporate">("individual");
  const [accountType, setAccountType] = useState<"cash" | "margin" | "derivatives">("cash");

  const { data: existingData, isLoading: isLoadingData } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.accountSelection.save.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("保存成功");
        setLocation(`/application/${applicationId}/step/2`);
      }
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setCustomerType(existingData.customerType);
      setAccountType(existingData.accountType);
    }
  }, [existingData]);

const handleNext = () => {
    saveMutation.mutate({
      applicationId,
      customerType,
      accountType,
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
            <h3 className="text-lg font-semibold mb-1">客戶類型 / Customer Type</h3>
            <p className="text-sm text-muted-foreground">請選擇您的客戶類型</p>
          </div>
          
          <RadioGroup value={customerType} onValueChange={(v) => setCustomerType(v as any)}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">個人賬戶 / Individual Account</div>
                  <div className="text-sm text-muted-foreground">適用於個人投資者</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50 cursor-not-allowed">
              <RadioGroupItem value="joint" id="joint" disabled />
              <Label htmlFor="joint" className="flex-1">
                <div>
                  <div className="font-medium">聯名賬戶 / Joint Account</div>
                  <div className="text-sm text-muted-foreground">暫不開放（即將推出）</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <RadioGroupItem value="corporate" id="corporate" />
              <Label htmlFor="corporate" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">機構賬戶 / Corporate Account</div>
                  <div className="text-sm text-muted-foreground"></div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Case 2: 賬戶類型 */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="text-lg font-semibold mb-1">賬戶類型 / Account Type</h3>
            <p className="text-sm text-muted-foreground">請選擇您要開設的賬戶類型</p>
          </div>
          
          <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as any)}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">現金賬戶 / Cash Account</div>
                  <div className="text-sm text-muted-foreground">適用於現金交易</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50 cursor-not-allowed">
              <RadioGroupItem value="margin" id="margin" disabled />
              <Label htmlFor="margin" className="flex-1">
                <div>
                  <div className="font-medium">保證金賬戶 / Margin Account</div>
                  <div className="text-sm text-muted-foreground">暫不開放（即將推出）</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50 cursor-not-allowed">
              <RadioGroupItem value="derivatives" id="derivatives" disabled />
              <Label htmlFor="derivatives" className="flex-1">
                <div>
                  <div className="font-medium">衍生品賬戶 / Derivatives Account</div>
                  <div className="text-sm text-muted-foreground">暫不開放（即將推出）</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </ApplicationWizard>
  );
}
