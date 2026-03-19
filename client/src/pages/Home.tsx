import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { FileText, Shield, Zap, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

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
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <a href="/" className="flex items-center">
            <img src="/logo-zh.png" alt="誠港金融" className="h-12" />
          </a>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <a href="/admin">审批系统</a>
            </Button>
            <Button variant="ghost" size="sm">English</Button>
            <Button asChild={agreedToPrivacy} disabled={!agreedToPrivacy}>
              {agreedToPrivacy ? <a href={getLoginUrl()}>登入</a> : <span>登入</span>}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-20 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            誠港金融開戶系統
          </h1>
          <h2 className="text-3xl font-semibold text-blue-600 mb-6">
            Account Opening System
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            為香港SFC持牌法團設計的完整、合規、現代化的客戶開戶申請系統
          </p>
          <p className="text-base text-muted-foreground mb-12 max-w-2xl mx-auto">
            Complete, compliant, and modern customer account opening system
          </p>
          
          {/* 隐私声明 */}
          <div className="max-w-3xl mx-auto mb-8 p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">個人資料私隱保護聲明</h3>
            <div className="text-sm text-muted-foreground space-y-3 text-left">
              <p>
                誠港金融股份有限公司（以下簡稱「本公司」）及其關聯機構承諾尊重並保護閣下的個人資料私隱。閣下在開戶申請過程中提供的所有個人資料將僅用於以下目的：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>處理閣下的開戶申請</li>
                <li>進行客戶身份識別及盡職調查（KYC）</li>
                <li>遵守香港證券及期貨事務監察委員會（SFC）的監管要求</li>
                <li>提供相關的金融服務及產品資訊</li>
              </ul>
              <p>
                本公司保證：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>不會將閣下的個人資料用於未經閣下同意的市場推銷活動</li>
                <li>不會將閣下的個人資料出售、出租或交換給第三方</li>
                <li>將採取合理的安全措施保護閣下的個人資料免受未經授權的查閱、使用或披露</li>
                <li>僅在法律要求或監管需要的情況下向相關機構披露閣下的資料</li>
              </ul>
              <p>
                閣下有權查閱、更正或刪除閣下的個人資料。如需了解更多關於個人資料私隱保護的資訊，請瀏覽
                <a 
                  href="https://www.pcpd.org.hk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mx-1"
                >
                  香港個人資料私隱專員公署官網
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
                我已閱讀並同意上述個人資料私隱保護聲明，並同意本公司按照聲明所述的目的收集、使用及儲存我的個人資料。
                <br />
                <span className="text-slate-600 text-xs font-normal mt-1 block">
                  I have read and agree to the above Personal Data Privacy Statement, and consent to the collection, use and storage of my personal data by the Company for the purposes stated in the Statement.
                </span>
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
                <a href={getLoginUrl()}>開始使用 / Get Started</a>
              ) : (
                <span>開始使用 / Get Started</span>
              )}
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            核心特性 / Core Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">SFC合規設計</h4>
              <p className="text-sm text-muted-foreground mb-2">SFC Compliant Design</p>
              <p className="text-sm text-muted-foreground">
                嚴格遵守香港SFC監管要求，內置KYC/AML合規檢查機制
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">現代化交互</h4>
              <p className="text-sm text-muted-foreground mb-2">Modern Interaction</p>
              <p className="text-sm text-muted-foreground">
                採用新穎的KYC技術，支持人臉識別、數字簽名等現代化功能
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">完整的用戶旅程</h4>
              <p className="text-sm text-muted-foreground mb-2">Complete User Journey</p>
              <p className="text-sm text-muted-foreground">
                從個人資料到開戶流程，流暢的用戶體驗設計
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">後台管理系統</h4>
              <p className="text-sm text-muted-foreground mb-2">Admin Management</p>
              <p className="text-sm text-muted-foreground">
                完整的審批工作流、合規和文檔管理平台
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">準備開始了嗎？</h3>
            <p className="text-lg mb-8 opacity-90">
              立即開始您的開戶申請流程
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild={agreedToPrivacy}
              disabled={!agreedToPrivacy}
            >
              {agreedToPrivacy ? (
                <a href={getLoginUrl()}>立即開始 / Start Now</a>
              ) : (
                <span>立即開始 / Start Now</span>
              )}
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 py-8 text-white">
        <div className="container flex flex-col items-center gap-2 text-sm">
          <p>© 2026 誠港金融. All rights reserved.</p>
          <p className="text-xs font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">v1.0.260319.001</p>
        </div>
      </footer>
    </div>
  );
}
