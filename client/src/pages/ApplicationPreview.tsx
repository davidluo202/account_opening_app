import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Send, FileText } from "lucide-react";

export default function ApplicationPreview() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");

  const { data: application, isLoading: isLoadingApp } = trpc.application.getById.useQuery(
    { id: applicationId },
    { enabled: !!applicationId }
  );

  const { data: basicInfo } = trpc.personalBasic.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: detailedInfo } = trpc.personalDetailed.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: occupationInfo } = trpc.occupation.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: employmentInfo } = trpc.employment.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: financialInfo } = trpc.financial.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: bankAccounts } = trpc.bankAccount.list.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: taxInfo } = trpc.tax.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: documents } = trpc.document.list.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: faceVerification } = trpc.faceVerification.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const { data: regulatory } = trpc.regulatory.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const generateApplicationNumberMutation = trpc.application.generateNumber.useMutation({
    onSuccess: () => {
      toast.success("申請已保存並生成申請編號");
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  const submitMutation = trpc.application.submit.useMutation({
    onSuccess: () => {
      toast.success("申請已提交");
      setLocation("/applications");
    },
    onError: (error: any) => {
      toast.error(`提交失敗: ${error.message}`);
    },
  });

  const handleSave = () => {
    generateApplicationNumberMutation.mutate({ id: applicationId });
  };

  const handleSubmit = () => {
    if (!application?.applicationNumber) {
      toast.error("請先保存申請以生成申請編號");
      return;
    }

    if (confirm("確定要提交申請嗎？提交後將無法修改。")) {
      submitMutation.mutate({ id: applicationId });
    }
  };

  if (isLoadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container max-w-4xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/application/${applicationId}/step/12`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回上一步
          </Button>
          
          {application?.applicationNumber && (
            <div className="text-sm">
              <span className="text-muted-foreground">申請編號：</span>
              <span className="font-mono font-semibold">{application.applicationNumber}</span>
            </div>
          )}
        </div>

        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">申請預覽</h1>
            <p className="text-muted-foreground">請仔細核對以下信息，確認無誤後提交申請</p>
          </div>

          <div className="space-y-8">
            {/* Case 1-2: 账户选择 */}
            <section>
              <h3 className="text-lg font-semibold mb-4 text-primary">賬戶信息</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">客戶類型：</span>
                  <span className="font-medium ml-2">個人</span>
                </div>
                <div>
                  <span className="text-muted-foreground">賬戶類型：</span>
                  <span className="font-medium ml-2">現金賬戶</span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Case 3: 个人基本信息 */}
            {basicInfo && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">個人基本信息</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">中文姓名：</span>
                    <span className="font-medium ml-2">{basicInfo.chineseName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">英文姓名：</span>
                    <span className="font-medium ml-2">{basicInfo.englishName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">性別：</span>
                    <span className="font-medium ml-2">
                      {basicInfo.gender === "male" ? "男" : basicInfo.gender === "female" ? "女" : "其他"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">出生日期：</span>
                    <span className="font-medium ml-2">{basicInfo.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">出生地：</span>
                    <span className="font-medium ml-2">{basicInfo.placeOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">國籍：</span>
                    <span className="font-medium ml-2">{basicInfo.nationality}</span>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Case 4: 个人详细信息 */}
            {detailedInfo && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">個人詳細信息</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">證件類型：</span>
                    <span className="font-medium ml-2">{detailedInfo.idType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">證件號碼：</span>
                    <span className="font-medium ml-2">{detailedInfo.idNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">證件簽發地：</span>
                    <span className="font-medium ml-2">{detailedInfo.idIssuingPlace}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">證件有效期：</span>
                    <span className="font-medium ml-2">
                      {detailedInfo.idIsPermanent ? "長期有效" : detailedInfo.idExpiryDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">婚姻狀況：</span>
                    <span className="font-medium ml-2">{detailedInfo.maritalStatus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">學歷：</span>
                    <span className="font-medium ml-2">{detailedInfo.educationLevel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">電子郵箱：</span>
                    <span className="font-medium ml-2">{detailedInfo.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">電話號碼：</span>
                    <span className="font-medium ml-2">{detailedInfo.phoneCountryCode} {detailedInfo.phoneNumber}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">居住地址：</span>
                    <span className="font-medium ml-2">{detailedInfo.residentialAddress}</span>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Case 5: 职业信息 */}
            {occupationInfo && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">職業信息</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">就業狀況：</span>
                    <span className="font-medium ml-2">{occupationInfo.employmentStatus}</span>
                  </div>
                  {occupationInfo.companyName && (
                    <>
                      <div>
                        <span className="text-muted-foreground">公司名稱：</span>
                        <span className="font-medium ml-2">{occupationInfo.companyName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">職務：</span>
                        <span className="font-medium ml-2">{occupationInfo.position}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">從業年限：</span>
                        <span className="font-medium ml-2">{occupationInfo.yearsOfService}年</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">行業：</span>
                        <span className="font-medium ml-2">{occupationInfo.industry}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">公司地址：</span>
                        <span className="font-medium ml-2">{occupationInfo.companyAddress}</span>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            <Separator />

            {/* Case 6: 就业详情 */}
            {employmentInfo && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">財務信息</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">收入來源：</span>
                    <span className="font-medium ml-2">{employmentInfo.incomeSource}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">年收入範圍：</span>
                    <span className="font-medium ml-2">{employmentInfo.annualIncome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">淨資產範圍：</span>
                    <span className="font-medium ml-2">{employmentInfo.netWorth}</span>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Case 7: 财务与投资 */}
            {financialInfo && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">投資信息</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-2">投資目的：</span>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(financialInfo.investmentObjectives || "[]").map((obj: string) => (
                        <span key={obj} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-2">投資經驗：</span>
                    <div className="grid md:grid-cols-2 gap-2">
                      {Object.entries(JSON.parse(financialInfo.investmentExperience || "{}")).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-xs">{key}:</span>
                          <span className="font-medium ml-2 text-xs">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">風險承受能力：</span>
                    <span className="font-medium ml-2">{financialInfo.riskTolerance}</span>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Case 8: 银行账户 */}
            {bankAccounts && bankAccounts.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">銀行賬戶</h3>
                <div className="space-y-3">
                  {bankAccounts.map((account, index) => (
                    <Card key={account.id} className="p-4 bg-muted/30">
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">銀行名稱：</span>
                          <span className="font-medium ml-2">{account.bankName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">賬戶號碼：</span>
                          <span className="font-medium ml-2">{account.accountNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">幣種：</span>
                          <span className="font-medium ml-2">{account.accountCurrency}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">持有人：</span>
                          <span className="font-medium ml-2">{account.accountHolderName}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Case 9: 税务信息 */}
            {taxInfo && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">稅務信息</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">稅務居住地：</span>
                    <span className="font-medium ml-2">{taxInfo.taxResidency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">稅務識別號：</span>
                    <span className="font-medium ml-2">{taxInfo.taxIdNumber}</span>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Case 10: 文件上传 */}
            {documents && documents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">上傳文件</h3>
                <div className="space-y-2 text-sm">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.fileName}</span>
                      <span className="text-muted-foreground text-xs">({doc.documentType})</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Case 11: 人脸识别 */}
            {faceVerification?.verified && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">人臉識別</h3>
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>已完成人臉識別驗證</span>
                </div>
              </section>
            )}

            <Separator />

            {/* Case 12: 监管声明 */}
            {regulatory && (
              <section>
                <h3 className="text-lg font-semibold mb-4 text-primary">監管聲明</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">PEP聲明：</span>
                    <span className="font-medium">{regulatory.isPEP ? "是" : "否"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">美國人士：</span>
                    <span className="font-medium">{regulatory.isUSPerson ? "是" : "否"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">電子簽名：</span>
                    <span className="font-medium">{regulatory.signatureName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>已同意開戶協議和監管條款</span>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-8 flex gap-4 justify-end">
            {!application?.applicationNumber && (
              <Button
                onClick={handleSave}
                disabled={generateApplicationNumberMutation.isPending}
                size="lg"
              >
                {generateApplicationNumberMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    保存並生成申請編號
                  </>
                )}
              </Button>
            )}

            {application?.applicationNumber && (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                size="lg"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    提交申請
                  </>
                )}
              </Button>
            )}
          </div>

          {!application?.applicationNumber && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              提示：請先保存申請以生成申請編號，然後才能提交
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
