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
import { useLang } from '@/lib/i18n';

const getDocumentTypes = (t: (tw: string, en: string, cn?: string) => string) => [
  { value: "id_front", label: t("身份證件正面", "ID Front", "身份证件正面"), required: true, singleFile: true },
  { value: "id_back", label: t("身份證件反面", "ID Back", "身份证件反面"), required: true, singleFile: true },
  { value: "bank_statement", label: t("銀行月結單", "Bank Statement", "银行月结单"), required: true, singleFile: true },
  { value: "address_proof", label: t("住址證明", "Address Proof", "住址证明"), required: true, singleFile: true },
  { value: "w8ben", label: t("美國稅務申報表", "W8BEN", "美国税务申报表"), required: true, singleFile: true },
];

const getCorporateDocumentTypes = (t: (tw: string, en: string, cn?: string) => string) => [
  { value: "ci_doc", label: t("公司註冊證書", "Certificate of Incorporation", "公司注册证书"), required: true, singleFile: true },
  { value: "name_change_doc", label: t("更名證明（如適用）", "Certified of Change of Name (if applied)", "更名证明（如适用）"), required: false, singleFile: true },
  { value: "br_doc", label: t("商業登記證（適用於香港註冊公司）", "Business Registration Certificate (For Hong Kong Registration Company only)", "商业登记证（适用于香港注册公司）"), required: false, singleFile: true },
  { value: "license_cert", label: t("牌照認證/交易所上市證明（如CIMA、SFC等，如適用）", "License Certification/Exchange Listed (if applied)", "牌照认证/交易所上市证明（如CIMA、SFC等，如适用）"), required: false, singleFile: true },
  { value: "memo_articles", label: t("公司章程/組織大綱", "Memorandum/Articles of Association", "公司章程/组织大纲"), required: true, singleFile: true },
  { value: "board_resolution", label: t("董事局議程", "Certified Extract Board of Resolution", "董事局议程"), required: true, singleFile: true },
  { value: "ownership_chart", label: t("股權結構圖（若持有牌照認證可豁免）", "Ownership Chart (can waive if have License Certification)", "股权结构图（若持有牌照认证可豁免）"), required: true, singleFile: true, waiveIfHas: "license_cert" },
  { value: "authorized_signatures", label: t("授權簽名人名單", "Authorized Signature List", "授权签名人名单"), required: true, singleFile: true },
  { value: "directors_id", label: t("全體董事身份證件", "HKID/Chinese ID/Passport of all directors", "全体董事身份证件"), required: true },
  { value: "directors_address", label: t("全體董事三個月內地址證明", "Valid proof of address for all directors, dated within the last 3 months", "全体董事三个月内地址证明"), required: true },
  { value: "signers_id", label: t("全體授權簽名人身份證件", "HKID/Chinese ID/Passport of all authorized signers", "全体授权签名人身份证件"), required: true },
  { value: "signers_address", label: t("全體授權簽名人三個月內地址證明", "Valid proof of address for all authorized signers, dated within the last 3 months", "全体授权签名人三个月内地址证明"), required: true },
  { value: "asset_cert", label: t("資產證明文件", "Asset certification document", "资产证明文件"), required: true },
  { value: "w8imy_w8ben", label: t("美國稅務申報表", "W8IMY/W8BEN-E", "美国税务申报表"), required: true, singleFile: true },
];

export default function DocumentUpload() {
  const { t } = useLang();
  const params = useParams<{ id: string; step?: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const stepNum = parseInt(params.step || "11");
  const showReturnToPreview = useReturnToPreview();
  const documentTypes = getDocumentTypes(t);
  const corporateDocumentTypes = getCorporateDocumentTypes(t);

  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 獲取客戶類型
  const { data: accountSelection } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );
  const isCorporate = accountSelection?.customerType === 'corporate';
  const isJoint = accountSelection?.customerType === 'joint';

  // 查詢公司基本信息以判斷註冊國家
  const { data: corporateBasic } = trpc.corporateBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId && isCorporate }
  );
  const isHongKongCompany = corporateBasic?.countryOfIncorporation === 'HK' ||
    corporateBasic?.countryOfIncorporation === 'Hong Kong' ||
    corporateBasic?.countryOfIncorporation === '香港';

  const { data: documents, isLoading: isLoadingData, refetch } = trpc.document.list.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const uploadMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      toast.success(t("文件上傳成功", "File uploaded successfully", "文件上传成功"));
      setUploading(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`${t("上傳失敗", "Upload failed", "上传失败")}: ${error.message}`);
      setUploading(null);
    },
  });

  const handleFileSelect = async (documentType: string, file: File) => {
    if (!file) return;

    // 檢查文件大小（限制為10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("文件大小不能超過10MB", "File size cannot exceed 10MB", "文件大小不能超过10MB"));
      return;
    }

    // 檢查文件類型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("只支持JPG、PNG和PDF格式", "Only JPG, PNG and PDF formats are supported", "只支持JPG、PNG和PDF格式"));
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

  const getUploadedDocuments = (documentType: string) => {
    return documents?.filter(doc => doc.documentType === documentType) || [];
  };

  // 動態設置：商業登記證（香港註冊公司必填）、股權結構圖（有牌照認證可豁免）
  const currentDocTypes = isCorporate
    ? corporateDocumentTypes.map(doc => {
        if (doc.value === 'br_doc' && isHongKongCompany) return { ...doc, required: true };
        if ((doc as any).waiveIfHas && getUploadedDocument((doc as any).waiveIfHas)) return { ...doc, required: false };
        return doc;
      })
    : documentTypes;

  const hasRequiredDocuments = () => {
    const requiredTypes = currentDocTypes.filter(t => t.required).map(t => t.value);
    const primaryOk = requiredTypes.every(type => getUploadedDocument(type));
    if (isJoint) {
      const secondOk = requiredTypes.every(type => getUploadedDocument(`second_${type}`));
      return primaryOk && secondOk;
    }
    return primaryOk;
  };

const handleNext = () => {
    if (!hasRequiredDocuments()) {
      toast.error(t("請上傳所有必需的文件", "Please upload all required documents", "请上传所有必需的文件"));
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
            <strong>{t("提示：", "Note: ", "提示：")}</strong>{t("請上傳清晰的文件照片或掃描件，支持JPG、PNG、PDF格式，單個文件不超過10MB", "Please upload clear photos or scans of documents. JPG, PNG and PDF formats are supported. Maximum file size is 10MB.", "请上传清晰的文件照片或扫描件，支持JPG、PNG、PDF格式，单个文件不超过10MB")}
          </p>
        </div>

        {isJoint && (
          <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2">{t("賬戶主要持有人", "Primary Account Holder", "账户主要持有人")}</h3>
        )}

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
                    {docType.value === 'w8ben' && (
                      <div className="mt-2">
                        <div className="flex gap-2">
                          <a href="https://www.irs.gov/pub/irs-pdf/fw8ben.pdf" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100">
                            {t("W8BEN 下載", "W8BEN Download", "W8BEN 下载")}
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t("以上文件來源於美國國稅局 (IRS) 官方網站", "The above documents are sourced from the official IRS website", "以上文件来源于美国国税局 (IRS) 官方网站")}</p>
                      </div>
                    )}
                    {docType.value === 'w8imy_w8ben' && (
                      <div className="mt-2">
                        <div className="flex gap-2">
                          <a href="https://www.irs.gov/pub/irs-pdf/fw8imy.pdf" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100">
                            {t("W8IMY 下載", "W8IMY Download", "W8IMY 下载")}
                          </a>
                          <a href="https://www.irs.gov/pub/irs-pdf/fw8bene.pdf" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100">
                            {t("W8BEN-E 下載", "W8BEN-E Download", "W8BEN-E 下载")}
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t("以上文件來源於美國國稅局 (IRS) 官方網站", "The above documents are sourced from the official IRS website", "以上文件来源于美国国税局 (IRS) 官方网站")}</p>
                      </div>
                    )}
                    {getUploadedDocuments(docType.value).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {((docType as any).singleFile
                          ? [getUploadedDocuments(docType.value)[getUploadedDocuments(docType.value).length - 1]]
                          : getUploadedDocuments(docType.value)
                        ).map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>{doc.fileName}</span>
                          </div>
                        ))}
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
                          {t("上傳中...", "Uploading...", "上传中...")}
                        </>
                      ) : uploaded ? (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          {(docType as any).singleFile ? t('重新上傳', 'Re-upload', '重新上传') : t('上傳更多', 'Upload More', '上传更多')}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {t("上傳文件", "Upload", "上传文件")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 第二持有人文件上傳 */}
        {isJoint && (
          <>
            <h3 className="text-lg font-bold text-primary border-b pb-2 mb-2 mt-8">{t("賬戶第二持有人", "Second Account Holder", "账户第二持有人")}</h3>
            <div className="space-y-4">
              {documentTypes.map((docType) => {
                const secondType = `second_${docType.value}`;
                const uploaded = getUploadedDocument(secondType);
                const isUploadingThis = uploading === secondType;
                return (
                  <Card key={secondType} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-base">
                          {docType.label}
                          {docType.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {docType.value === 'w8ben' && (
                          <div className="mt-2">
                            <a href="https://www.irs.gov/pub/irs-pdf/fw8ben.pdf" target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100">
                              {t("W8BEN 下載", "W8BEN Download", "W8BEN 下载")}
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">{t("以上文件來源於美國國稅局 (IRS) 官方網站", "The above documents are sourced from the official IRS website", "以上文件来源于美国国税局 (IRS) 官方网站")}</p>
                          </div>
                        )}
                        {uploaded && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{(uploaded as any).fileName || t('已上傳', 'Uploaded', '已上传')}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          ref={(el) => { if (el) fileInputRefs.current[secondType] = el; }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(secondType, f); }}
                        />
                        <Button
                          variant={uploaded ? "outline" : "default"}
                          size="sm"
                          disabled={isUploadingThis}
                          onClick={() => fileInputRefs.current[secondType]?.click()}
                        >
                          {isUploadingThis ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("上傳中...", "Uploading...", "上传中...")}</>
                          ) : uploaded ? (
                            <><FileText className="h-4 w-4 mr-2" />{t("重新上傳", "Re-upload", "重新上传")}</>
                          ) : (
                            <><Upload className="h-4 w-4 mr-2" />{t("上傳文件", "Upload", "上传文件")}</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {documents && documents.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {t(`已上傳 ${documents.length} 個文件`, `${documents.length} file(s) uploaded`, `已上传 ${documents.length} 个文件`)}
          </div>
        )}
      </div>
    </ApplicationWizard>
  );
}
