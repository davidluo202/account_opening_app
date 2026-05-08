import PortalLayout from "./PortalLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Activity } from "lucide-react";

const PLACEHOLDER_PIE_DATA = [
  { name: "港股", value: 45 },
  { name: "美股", value: 30 },
  { name: "现金", value: 25 },
];
const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b"];

const MARKET_INDICES = [
  { name: "恒生指数", nameEn: "HSI", value: "19,842.31", change: "+1.23%", up: true },
  { name: "标普500", nameEn: "S&P 500", value: "5,308.15", change: "-0.41%", up: false },
  { name: "纳斯达克", nameEn: "NASDAQ", value: "16,742.39", change: "-0.78%", up: false },
];

function StatCard({ title, titleEn, value, sub, icon, accent }: {
  title: string; titleEn: string; value: string; sub?: string; icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${accent || "bg-blue-50"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{title} <span className="text-gray-400">/ {titleEn}</span></div>
        <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function PortalDashboard() {
  const { user } = useAuth();

  return (
    <PortalLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">账户总览 <span className="text-gray-400 font-normal text-lg">/ Dashboard</span></h1>
            <p className="text-sm text-gray-500 mt-1">欢迎回来，{user?.name || user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              待激活 / Pending
            </span>
          </div>
        </div>

        {/* Account info bar */}
        <div className="bg-slate-900 text-white rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center">
          <div>
            <div className="text-slate-400 text-xs">账户号码 / Account No.</div>
            <div className="font-mono font-semibold text-base tracking-wider">CMF-2026-0001</div>
          </div>
          <div className="h-8 w-px bg-slate-700 hidden sm:block" />
          <div>
            <div className="text-slate-400 text-xs">账户类型 / Type</div>
            <div className="text-sm font-medium">个人现金账户 / Individual Cash</div>
          </div>
          <div className="h-8 w-px bg-slate-700 hidden sm:block" />
          <div>
            <div className="text-slate-400 text-xs">开户日期 / Open Date</div>
            <div className="text-sm font-medium">2026-05-04</div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="总资产" titleEn="Total Assets" value="HKD 0.00" icon={<DollarSign className="h-6 w-6 text-blue-600" />} accent="bg-blue-50" />
          <StatCard title="现金余额" titleEn="Cash Balance" value="HKD 0.00" icon={<Activity className="h-6 w-6 text-emerald-600" />} accent="bg-emerald-50" />
          <StatCard title="可用资金" titleEn="Buying Power" value="HKD 0.00" icon={<BarChart2 className="h-6 w-6 text-violet-600" />} accent="bg-violet-50" />
          <StatCard title="今日盈亏" titleEn="Today's P&L" value="HKD 0.00" sub="--" icon={<TrendingUp className="h-6 w-6 text-gray-400" />} accent="bg-gray-50" />
        </div>

        {/* Two columns: pie + transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio allocation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">资产分布 <span className="text-gray-400 font-normal text-sm">/ Allocation</span></h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PLACEHOLDER_PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {PLACEHOLDER_PIE_DATA.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {PLACEHOLDER_PIE_DATA.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-gray-600">{item.name}</span>
                    <span className="text-gray-900 font-medium ml-auto pl-4">{item.value}%</span>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-3">* 示例数据 / Demo data</p>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">近期交易 <span className="text-gray-400 font-normal text-sm">/ Recent Transactions</span></h2>
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Activity className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">暂无交易记录</p>
              <p className="text-gray-300 text-xs mt-1">No transactions yet</p>
            </div>
          </div>
        </div>

        {/* Market overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">市场概览 <span className="text-gray-400 font-normal text-sm">/ Market Overview</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MARKET_INDICES.map((idx) => (
              <div key={idx.name} className="border border-gray-100 rounded-lg px-4 py-3">
                <div className="text-xs text-gray-500">{idx.name} / {idx.nameEn}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{idx.value}</div>
                <div className={`text-sm font-medium flex items-center gap-1 mt-1 ${idx.up ? "text-emerald-600" : "text-red-500"}`}>
                  {idx.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {idx.change}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-300 mt-3">* 示例数据，仅供参考 / Demo data for illustration only</p>
        </div>
      </div>
    </PortalLayout>
  );
}
