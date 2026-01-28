import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { FileText, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation("/applications");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">誠港金融</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">English</Button>
            <Button asChild>
              <a href={getLoginUrl()}>登入</a>
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
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>開始使用 / Get Started</a>
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
            <Button size="lg" variant="secondary" asChild>
              <a href={getLoginUrl()}>立即開始 / Start Now</a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 誠港金融. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
