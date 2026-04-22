import { useState, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react";

const documentTypes = [
  { value: "id_front", label: "身份證件正面 / ID Front", required: true },
  { value: "id_back", label: "身份證件反面 / ID Back", required: false },
  { value: "bank_statement", label: "銀行月結單 / Bank Statement", required: false },
  { value: "address_proof", label: "住址證明 / Address Proof", required: false },
];

// 機構文件類型
const corporateDocumentTypes = [
  { value: "ci_doc", label: "公司註冊證書 / Certificate of Incorporation", required: true },
  { value: "name_change_doc", label: "更名證明（如適用）/ Certified of Change of Name (if applied)", required: false },
  { value: "br_doc", label: "商業登記證（如適用）/ Business Registration Certificate (if applied)", required: false },
  { value: "license_cert", label: "牌照認證/交易所上市證明（如CIMA、SFC等，如適用）/ License Certification/Exchange Listed (if applied)", required: false },
  { value: "memo_articles", label: "公司章程/組織大綱 / Memorandum/Articles of Association", required: true },
  { value: "board_resolution", label: "董事局議程 / Certified Extract Board of Resolution", required: true },
  { value: "ownership_chart", label: "股權結構圖（若持有牌照認證可豁免）/ Ownership Chart (can waive if have License Certification)", required: false },
  { value: "authorized_signatures", label: "授權簽名人名單 / Authorized Signature List", required: true },
  { value: "directors_id", label: "全體董事身份證件 / HKID/Chinese ID/Passport of all directors", required: true },
  { value: "directors_address", label: "全體董事三個月內地址證明 / Valid proof of address for all directors, dated within the last 3 months", required: true },
  { value: "signers_id", label: "全體授權簽名人身份證件 / HKID/Chinese ID/Passport of all authorized signers", required: true },
  { value: "signers_address", label: "全體授權簽名人三個月內地址證明 / Valid proof of address for all authorized signers, dated within the last 3 months", required: true },
  { value: "asset_cert", label: "資產證明文件 / Asset certification document", required: true },
  { value: "w8imy_w8ben", label: "美國稅務申報表 / W8IMY/W8BEN-E", required: true },
];

export default function DocumentUpload() {
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "11");
  const showReturnToPreview = useReturnToPreview();

  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 獲取客戶類型
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isCorporate = accountSelection?.customerType === 'corporate';
  const currentDocTypes = isCorporate ? corporateDocumentTypes : documentTypes;

  const { data: documents, isLoading: isLoadingData, refetch } = trpc.document.list.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const uploadMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      toast.success("文件上傳成功");
      setUploading(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`上傳失敗: ${error.message}`);
      setUploading(null);
    },
  });

  const handleFileSelect = async (documentType: string, file: File) => {
    if (!file) return;

    // 檢查文件大小（限制為10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超過10MB");
      return;
    }

    // 檢查文件類型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("只支持JPG、PNG和PDF格式");
      return;
    }

    setUploading(documentType);

    // 將文件轉換為base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(",")[1]; // 移除data:image/...;base64,前綴

      uploadMutation.mutate({
        applicationId,
        documentType,
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const getUploadedDocument = (documentType: string) => {
    return documents?.find(doc => doc.documentType === documentType);
  };

  const hasRequiredDocuments = () => {
    const requiredTypes = currentDocTypes.filter(t => t.required).map(t => t.value);
    return requiredTypes.every(type => getUploadedDocument(type));
  };

const handleNext = () => {
    if (!hasRequiredDocuments()) {
      toast.error("請上傳所有必需的文件");
      return;
    }
    setLocation(`/application/${applicationId}/step/${stepNum + 1}`);
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={stepNum}
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
      currentStep={stepNum}
      onNext={handleNext}
      isNextDisabled={!hasRequiredDocuments()}
    
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>提示：</strong>請上傳清晰的文件照片或掃描件，支持JPG、PNG、PDF格式，單個文件不超過10MB
          </p>
        </div>

        <div className="space-y-4">
          {currentDocTypes.map((docType) => {
            const uploaded = getUploadedDocument(docType.value);
            const isUploading = uploading === docType.value;

            return (
              <Card key={docType.value} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-base">
                      {docType.label}
                      {docType.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {uploaded && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{uploaded.fileName}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      ref={(el) => { fileInputRefs.current[docType.value] = el; }}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        // allow re-selecting the same file after a failed upload
                        e.target.value = "";
                        if (file) {
                          handleFileSelect(docType.value, file);
                        }
                      }}
                    />
                    <Button
                      variant={uploaded ? "outline" : "default"}
                      size="sm"
                      onClick={() => fileInputRefs.current[docType.value]?.click()}
                      disabled={isUploading || uploadMutation.isPending}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          上傳中...
                        </>
                      ) : uploaded ? (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          重新上傳
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          上傳文件
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {documents && documents.length > 0 && (
          <div className="text-sm text-muted-foreground">
            已上傳 {documents.length} 個文件
          </div>
        )}
      </div>
    </ApplicationWizard>
  );
}
