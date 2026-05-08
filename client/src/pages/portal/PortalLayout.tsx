import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Menu, X, LayoutDashboard, DollarSign, TrendingUp, Search, BarChart2, ClipboardList, FileText, Settings, ExternalLink, ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";

interface NavItem {
  label: string;
  labelEn: string;
  icon: ReactNode;
  path?: string;
  children?: { label: string; labelEn: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: "账户总览", labelEn: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, path: "/portal" },
  {
    label: "资金管理", labelEn: "Funds", icon: <DollarSign className="h-5 w-5" />, path: "/portal/funds",
    children: [
      { label: "入金", labelEn: "Deposit", path: "/portal/funds?tab=deposit" },
      { label: "出金", labelEn: "Withdrawal", path: "/portal/funds?tab=withdrawal" },
    ],
  },
  { label: "持仓", labelEn: "Portfolio", icon: <TrendingUp className="h-5 w-5" />, path: "/portal/portfolio" },
  { label: "行情", labelEn: "Market", icon: <Search className="h-5 w-5" />, path: "/portal/market" },
  { label: "交易", labelEn: "Trading", icon: <BarChart2 className="h-5 w-5" />, path: "/portal/trading" },
  { label: "订单", labelEn: "Orders", icon: <ClipboardList className="h-5 w-5" />, path: "/portal/orders" },
  { label: "报表", labelEn: "Reports", icon: <FileText className="h-5 w-5" />, path: "/portal/reports" },
  { label: "设置", labelEn: "Settings", icon: <Settings className="h-5 w-5" />, path: "/portal/settings" },
];

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fundsExpanded, setFundsExpanded] = useState(true);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/portal") return location === "/portal";
    return location.startsWith(path);
  };

  const handleNav = (path: string) => {
    setLocation(path);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = getLoginUrl();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img src="/logo-zh.png" alt="诚港金融" className="h-8 brightness-0 invert" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="text-white font-bold text-sm leading-tight">诚港金融</div>
            <div className="text-slate-400 text-xs">CMFinancial</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="text-slate-400 text-xs mb-1">登录账户</div>
        <div className="text-white text-sm font-medium truncate">{user?.name || user?.email}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      setFundsExpanded(!fundsExpanded);
                      if (item.path) handleNav(item.path);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive(item.path || "")
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label} / {item.labelEn}</span>
                    </div>
                    {fundsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {fundsExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.path}
                          onClick={() => handleNav(child.path)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-left"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          {child.label} / {child.labelEn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path!)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  isActive(item.path!)
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label} / {item.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-slate-700" />

        {/* Open Account link */}
        <button
          onClick={() => handleNav("/applications")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
        >
          <ExternalLink className="h-5 w-5" />
          <span>开户申请 / Open Account</span>
        </button>
      </nav>

      {/* Bottom: logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors text-left"
        >
          <LogOut className="h-5 w-5" />
          <span>登出 / Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-slate-900 z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-slate-800">诚港金融 CMFinancial</span>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
