import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl, APP_VERSION } from "@/const";
import { useLocation } from "wouter";
import { FileText, Shield, Zap, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { TopHeader } from "@/components/TopHeader";
import { useLang } from '@/lib/i18n';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const { t } = useLang();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 普通客户登录后跳转到开户系统
  if (isAuthenticated && user?.email && !user.email.endsWith('@cmfinancial.com')) {
    setLocation("/applications");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <TopHeader>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin">{t('審批系統', 'Approval System', '审批系统')}</a>
        </Button>
        <Button variant="ghost" size="sm">English</Button>
        <Button asChild={agreedToPrivacy} disabled={!agreedToPrivacy}>
          {agreedToPrivacy ? <a href={getLoginUrl()}>{t('登入', 'Login', '登入')}</a> : <span>{t('登入', 'Login', '登入')}</span>}
        </Button>
      </TopHeader>


      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-20 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {t('誠港金融開戶系統', 'Account Opening System', '诚港金融开户系统')}
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('為香港SFC持牌法團設計的完整、合規、現代化的客戶開戶申請系統', 'Complete, compliant, and modern customer account opening system', '为香港SFC持牌法团设计的完整、合规、现代化的客户开户申请系统')}
          </p>
          
          {/* 隐私声明 */}
          <div className="max-w-3xl mx-auto mb-8 p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">{t('個人資料私隱保護聲明', 'Personal Data Privacy Statement', '个人资料隐私保护声明')}</h3>
            <div className="text-sm text-muted-foreground space-y-3 text-left">
              <p>
                {t(
                  '誠港金融股份有限公司（以下簡稱「本公司」）及其關聯機構承諾尊重並保護閣下的個人資料私隱。閣下在開戶申請過程中提供的所有個人資料將僅用於以下目的：',
                  'CM Financial Limited (hereinafter referred to as "the Company") and its affiliates are committed to respecting and protecting the privacy of your personal data. All personal data provided during the account opening process will be used solely for the following purposes:',
                  '诚港金融股份有限公司（以下简称「本公司」）及其关联机构承诺尊重并保护阁下的个人资料隐私。阁下在开户申请过程中提供的所有个人资料将仅用于以下目的：'
                )}
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('處理閣下的開戶申請', 'Processing your account opening application', '处理阁下的开户申请')}</li>
                <li>{t('進行客戶身份識別及盡職調查（KYC）', 'Conducting customer identification and due diligence (KYC)', '进行客户身份识别及尽职调查（KYC）')}</li>
                <li>{t('遵守香港證券及期貨事務監察委員會（SFC）的監管要求', 'Complying with the regulatory requirements of the Securities and Futures Commission (SFC) of Hong Kong', '遵守香港证券及期货事务监察委员会（SFC）的监管要求')}</li>
                <li>{t('提供相關的金融服務及產品資訊', 'Providing relevant financial services and product information', '提供相关的金融服务及产品资讯')}</li>
              </ul>
              <p>
                {t('本公司保證：', 'The Company guarantees:', '本公司保证：')}
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('不會將閣下的個人資料用於未經閣下同意的市場推銷活動', 'Your personal data will not be used for marketing activities without your consent', '不会将阁下的个人资料用于未经阁下同意的市场推销活动')}</li>
                <li>{t('不會將閣下的個人資料出售、出租或交換給第三方', 'Your personal data will not be sold, rented, or exchanged to third parties', '不会将阁下的个人资料出售、出租或交换给第三方')}</li>
                <li>{t('將採取合理的安全措施保護閣下的個人資料免受未經授權的查閱、使用或披露', 'Reasonable security measures will be taken to protect your personal data from unauthorized access, use, or disclosure', '将采取合理的安全措施保护阁下的个人资料免受未经授权的查阅、使用或披露')}</li>
                <li>{t('僅在法律要求或監管需要的情況下向相關機構披露閣下的資料', 'Your data will only be disclosed to relevant authorities when required by law or regulation', '仅在法律要求或监管需要的情况下向相关机构披露阁下的资料')}</li>
              </ul>
              <p>
                {t(
                  '閣下有權查閱、更正或刪除閣下的個人資料。如需了解更多關於個人資料私隱保護的資訊，請瀏覽',
                  'You have the right to access, correct, or delete your personal data. For more information about personal data privacy protection, please visit',
                  '阁下有权查阅、更正或删除阁下的个人资料。如需了解更多关于个人资料隐私保护的资讯，请浏览'
                )}
                <a
                  href="https://www.pcpd.org.hk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mx-1"
                >
                  {t('香港個人資料私隱專員公署官網', 'the Office of the Privacy Commissioner for Personal Data, Hong Kong', '香港个人资料隐私专员公署官网')}
                </a>
                。
              </p>
            </div>
            <div className="flex items-start gap-4 mt-6 p-5 bg-blue-100 border-2 border-blue-400 rounded-lg shadow-sm">
              <div className="pt-0.5">
                <Checkbox 
                  id="privacy-agreement" 
                  checked={agreedToPrivacy}
                  onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                  className="h-6 w-6 border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white shadow-sm"
                />
              </div>
              <label 
                htmlFor="privacy-agreement" 
                className="text-sm font-semibold text-slate-800 cursor-pointer select-none leading-relaxed"
              >
                {t(
                  '我已閱讀並同意上述個人資料私隱保護聲明，並同意本公司按照聲明所述的目的收集、使用及儲存我的個人資料。',
                  'I have read and agree to the above Personal Data Privacy Statement, and consent to the collection, use and storage of my personal data by the Company for the purposes stated in the Statement.',
                  '我已阅读并同意上述个人资料隐私保护声明，并同意本公司按照声明所述的目的收集、使用及储存我的个人资料。'
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              asChild={agreedToPrivacy}
              disabled={!agreedToPrivacy}
            >
              {agreedToPrivacy ? (
                <a href={getLoginUrl()}>{t('開始使用', 'Get Started', '开始使用')}</a>
              ) : (
                <span>{t('開始使用', 'Get Started', '开始使用')}</span>
              )}
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            {t('核心特性', 'Core Features', '核心特性')}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{t('SFC合規設計', 'SFC Compliant Design', 'SFC合规设计')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('嚴格遵守香港SFC監管要求，內置KYC/AML合規檢查機制', 'Strictly compliant with Hong Kong SFC regulatory requirements, with built-in KYC/AML compliance checks', '严格遵守香港SFC监管要求，内置KYC/AML合规检查机制')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{t('現代化交互', 'Modern Interaction', '现代化交互')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('採用新穎的KYC技術，支持人臉識別、數字簽名等現代化功能', 'Adopting novel KYC technologies with support for face recognition, digital signatures, and more', '采用新颖的KYC技术，支持人脸识别、数字签名等现代化功能')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{t('完整的用戶旅程', 'Complete User Journey', '完整的用户旅程')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('從個人資料到開戶流程，流暢的用戶體驗設計', 'From personal information to account opening, a smooth user experience', '从个人资料到开户流程，流畅的用户体验设计')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{t('後台管理系統', 'Admin Management', '后台管理系统')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('完整的審批工作流、合規和文檔管理平台', 'Complete approval workflow, compliance, and document management platform', '完整的审批工作流、合规和文档管理平台')}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">{t('準備開始了嗎？', 'Ready to Get Started?', '准备开始了吗？')}</h3>
            <p className="text-lg mb-8 opacity-90">
              {t('立即開始您的開戶申請流程', 'Start your account opening process now', '立即开始您的开户申请流程')}
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild={agreedToPrivacy}
              disabled={!agreedToPrivacy}
            >
              {agreedToPrivacy ? (
                <a href={getLoginUrl()}>{t('立即開始', 'Start Now', '立即开始')}</a>
              ) : (
                <span>{t('立即開始', 'Start Now', '立即开始')}</span>
              )}
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 py-8 text-white">
        <div className="container flex flex-col items-center gap-2 text-sm">
          <p>© 2026 誠港金融. All rights reserved.</p>
          <p className="text-xs font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">{APP_VERSION}</p>
        </div>
      </footer>
    </div>
  );
}
