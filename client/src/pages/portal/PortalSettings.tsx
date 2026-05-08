import { useState } from "react";
import PortalLayout from "./PortalLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { User, Lock, Bell, ExternalLink, Eye, EyeOff } from "lucide-react";

export default function PortalSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [orderNotif, setOrderNotif] = useState(true);
  const [fundNotif, setFundNotif] = useState(true);

  return (
    <PortalLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">设置 <span className="text-gray-400 font-normal text-lg">/ Settings</span></h1>
          <p className="text-sm text-gray-500 mt-1">账户偏好与安全设置</p>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">个人信息 / Profile</h2>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-sm text-gray-500 sm:w-40">姓名 / Name</span>
              <span className="text-sm font-medium text-gray-900">{user?.name || "—"}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-sm text-gray-500 sm:w-40">电邮 / Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email || "—"}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-sm text-gray-500 sm:w-40">账户号码 / Account No.</span>
              <span className="text-sm font-mono font-medium text-gray-900">CMF-2026-0001</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">需要更新个人信息？请通过开户申请系统提交修改请求。</p>
            <button
              onClick={() => setLocation("/applications")}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              前往开户申请系统更新资料 / Update via Account Opening System
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">修改密码 / Change Password</h2>
          </div>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">当前密码 / Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="请输入当前密码"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码 / New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="请输入新密码（至少8位）"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">确认新密码 / Confirm Password</label>
              <input
                type="password"
                placeholder="再次输入新密码"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
              更新密码 / Update Password
            </button>
          </div>
        </div>

        {/* Notification preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">通知设置 / Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "电邮通知 / Email Notifications", labelEn: "Receive updates via email", state: emailNotif, setState: setEmailNotif },
              { label: "短信通知 / SMS Notifications", labelEn: "Receive SMS alerts", state: smsNotif, setState: setSmsNotif },
              { label: "订单状态通知 / Order Status Alerts", labelEn: "Get notified when orders are filled or cancelled", state: orderNotif, setState: setOrderNotif },
              { label: "资金变动通知 / Fund Movement Alerts", labelEn: "Get notified on deposits and withdrawals", state: fundNotif, setState: setFundNotif },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.labelEn}</div>
                </div>
                <button
                  onClick={() => item.setState(!item.state)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.state ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.state ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
            保存设置 / Save Settings
          </button>
        </div>
      </div>
    </PortalLayout>
  );
}
