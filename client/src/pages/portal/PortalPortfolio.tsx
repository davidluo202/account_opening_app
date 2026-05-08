import PortalLayout from "./PortalLayout";
import { TrendingUp, BarChart2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SECTOR_DATA = [
  { name: "科技 Tech", value: 35 },
  { name: "金融 Finance", value: 25 },
  { name: "消费 Consumer", value: 20 },
  { name: "医疗 Healthcare", value: 20 },
];
const SECTOR_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];

const MOCK_HOLDINGS: {
  symbol: string; name: string; qty: number; avgCost: string;
  currentPrice: string; marketValue: string; pnl: string; pnlPct: string; up: boolean;
}[] = [];

export default function PortalPortfolio() {
  return (
    <PortalLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">持仓 <span className="text-gray-400 font-normal text-lg">/ Portfolio</span></h1>
          <p className="text-sm text-gray-500 mt-1">查看您的持仓明细与资产分布</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500">持仓市值 / Market Value</div>
            <div className="text-xl font-bold text-gray-900 mt-1">HKD 0.00</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500">总盈亏 / Total P&L</div>
            <div className="text-xl font-bold text-gray-900 mt-1">HKD 0.00</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500">今日盈亏 / Today's P&L</div>
            <div className="text-xl font-bold text-gray-900 mt-1">HKD 0.00</div>
          </div>
        </div>

        {/* Holdings table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">持仓明细 <span className="text-gray-400 font-normal text-sm">/ Holdings</span></h2>
          {MOCK_HOLDINGS.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">代码 Symbol</th>
                    <th className="pb-3 font-medium">名称 Name</th>
                    <th className="pb-3 font-medium text-right">数量 Qty</th>
                    <th className="pb-3 font-medium text-right">均价 Avg Cost</th>
                    <th className="pb-3 font-medium text-right">现价 Price</th>
                    <th className="pb-3 font-medium text-right">市值 Value</th>
                    <th className="pb-3 font-medium text-right">盈亏 P&L</th>
                    <th className="pb-3 font-medium text-right">盈亏% P&L%</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HOLDINGS.map((h) => (
                    <tr key={h.symbol} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono font-semibold text-blue-600">{h.symbol}</td>
                      <td className="py-3 text-gray-700">{h.name}</td>
                      <td className="py-3 text-right">{h.qty}</td>
                      <td className="py-3 text-right text-gray-600">{h.avgCost}</td>
                      <td className="py-3 text-right text-gray-600">{h.currentPrice}</td>
                      <td className="py-3 text-right font-medium">{h.marketValue}</td>
                      <td className={`py-3 text-right font-medium ${h.up ? "text-emerald-600" : "text-red-500"}`}>{h.pnl}</td>
                      <td className={`py-3 text-right font-medium ${h.up ? "text-emerald-600" : "text-red-500"}`}>{h.pnlPct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-base font-medium text-gray-500 mb-1">暂无持仓</h3>
              <p className="text-sm text-gray-400">No holdings yet. Start trading to build your portfolio.</p>
            </div>
          )}
        </div>

        {/* Sector allocation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">板块分布 <span className="text-gray-400 font-normal text-sm">/ Sector Allocation</span></h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={SECTOR_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {SECTOR_DATA.map((_, index) => (
                      <Cell key={index} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 min-w-32">
              {SECTOR_DATA.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: SECTOR_COLORS[i] }} />
                  <span className="text-gray-600">{s.name}</span>
                  <span className="ml-auto font-medium text-gray-900 pl-3">{s.value}%</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-3">* 示例数据</p>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
