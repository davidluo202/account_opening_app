import { useState, useEffect } from "react";
import PortalLayout from "./PortalLayout";
import { TrendingUp, RefreshCw } from "lucide-react";

const API_BASE = "https://backoffice.cmf-otc.com";

interface Trade {
  trade_code: string;
  underlying_ticker: string;
  underlying_name: string;
  option_type: string;
  notional_amount: number;
  strike_price: number;
  current_price: number;
  client_premium: number;
  expiry_date: string;
  tenor_days: number;
  status: string;
  // history fields
  settlement_amount?: number;
  exercise_payout?: number;
  closed_at?: string;
  dividend_treatment?: string;
}

function getClientId(): string {
  return localStorage.getItem("portal_client_id") || "1";
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number): string {
  return Math.floor(n).toLocaleString("en-US");
}

function daysRemaining(expiry: string): number {
  const diff = new Date(expiry).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function calcPnl(t: Trade): number {
  if (!t.strike_price) return 0;
  return ((t.current_price - t.strike_price) / t.strike_price) * t.notional_amount;
}

function calcNetRevenue(t: Trade): number {
  return Math.max(Number(t.exercise_payout || t.settlement_amount || 0), 0);
}

export default function PortalPortfolio() {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [activePositions, setActivePositions] = useState<Trade[]>([]);
  const [historyPositions, setHistoryPositions] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const clientId = getClientId();
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/trades?client_id=${clientId}&status=position`),
        fetch(`${API_BASE}/api/trades?client_id=${clientId}&status=closed,exercised,expired`),
      ]);
      if (activeRes.ok) {
        const data = await activeRes.json();
        setActivePositions(Array.isArray(data) ? data : []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistoryPositions(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalNotional = activePositions.reduce((s, t) => s + (t.notional_amount || 0), 0);
  const totalPnl = activePositions.reduce((s, t) => s + calcPnl(t), 0);
  const pnlPositive = totalPnl >= 0;

  return (
    <PortalLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              持仓 <span className="text-gray-400 font-normal text-lg">/ Portfolio</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">查看您的持仓明细与历史交易</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500">持仓市值 / Market Value</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {loading ? "加载中..." : `HKD ${fmt(totalNotional)}`}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500">浮动盈亏 / Unrealised P&L</div>
            <div className={`text-xl font-bold mt-1 ${pnlPositive ? "text-emerald-600" : "text-red-500"}`}>
              {loading ? <span className="text-gray-900">加载中...</span> : `${pnlPositive ? "+" : ""}HKD ${fmt(totalPnl)}`}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500">持仓数量 / Active Positions</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {loading ? "加载中..." : activePositions.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "active" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            当前持仓 Active
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "history" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            历史持仓 History
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">加载中...</p>
          ) : tab === "active" ? (
            activePositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-16 w-16 text-gray-200 mb-4" />
                <h3 className="text-base font-medium text-gray-500 mb-1">暂无持仓</h3>
                <p className="text-sm text-gray-400">No active positions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">标的</th>
                      <th className="pb-2 font-medium">方向</th>
                      <th className="pb-2 font-medium text-right">名义本金</th>
                      <th className="pb-2 font-medium text-right">标的证券数量</th>
                      <th className="pb-2 font-medium text-right">期初价/执行价</th>
                      <th className="pb-2 font-medium text-right">现价</th>
                      <th className="pb-2 font-medium text-right">期权费率</th>
                      <th className="pb-2 font-medium text-right">浮盈/亏</th>
                      <th className="pb-2 font-medium text-right">到期日</th>
                      <th className="pb-2 font-medium text-right">剩余天数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePositions.map((t) => {
                      const pnl = calcPnl(t);
                      const isProfit = pnl >= 0;
                      const qty = t.strike_price ? Math.floor(t.notional_amount / t.strike_price) : 0;
                      const remaining = t.expiry_date ? daysRemaining(t.expiry_date) : 0;
                      return (
                        <tr key={t.trade_code} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5">
                            <div className="font-medium text-gray-800">{t.underlying_ticker}</div>
                            <div className="text-xs text-gray-400">{t.underlying_name}</div>
                          </td>
                          <td className="py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              t.option_type === "CALL"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}>
                              {t.option_type}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-gray-700">{fmt(t.notional_amount)}</td>
                          <td className="py-2.5 text-right text-gray-700">{fmtInt(qty)}</td>
                          <td className="py-2.5 text-right text-gray-700">{fmt(t.strike_price)}</td>
                          <td className="py-2.5 text-right text-gray-700">{fmt(t.current_price)}</td>
                          <td className="py-2.5 text-right text-gray-700">
                            {t.client_premium != null ? `${t.client_premium}%` : "-"}
                          </td>
                          <td className={`py-2.5 text-right font-medium ${isProfit ? "text-emerald-600" : "text-red-500"}`}>
                            {isProfit ? "+" : ""}{fmt(pnl)}
                          </td>
                          <td className="py-2.5 text-right text-gray-700">{t.expiry_date}</td>
                          <td className="py-2.5 text-right">
                            <span className={`font-medium ${remaining <= 7 ? "text-red-500" : "text-gray-700"}`}>
                              {remaining}天
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            historyPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-16 w-16 text-gray-200 mb-4" />
                <h3 className="text-base font-medium text-gray-500 mb-1">暂无历史记录</h3>
                <p className="text-sm text-gray-400">No historical positions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">标的</th>
                      <th className="pb-2 font-medium">方向</th>
                      <th className="pb-2 font-medium text-right">名义本金</th>
                      <th className="pb-2 font-medium text-right">标的证券数量</th>
                      <th className="pb-2 font-medium text-right">期初价</th>
                      <th className="pb-2 font-medium text-right">行权价</th>
                      <th className="pb-2 font-medium text-right">期权费(%)</th>
                      <th className="pb-2 font-medium">分红规则</th>
                      <th className="pb-2 font-medium text-right">平仓时间</th>
                      <th className="pb-2 font-medium text-right">净收益</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPositions.map((t) => {
                      const revenue = calcNetRevenue(t);
                      const isProfit = revenue > 0;
                      const qty = t.strike_price ? Math.floor(t.notional_amount / t.strike_price) : 0;
                      return (
                        <tr key={t.trade_code} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5">
                            <div className="font-medium text-gray-800">{t.underlying_ticker}</div>
                            <div className="text-xs text-gray-400">{t.underlying_name}</div>
                          </td>
                          <td className="py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              t.option_type === "CALL"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}>
                              {t.option_type}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-gray-700">{fmt(t.notional_amount)}</td>
                          <td className="py-2.5 text-right text-gray-700">{fmtInt(qty)}</td>
                          <td className="py-2.5 text-right text-gray-700">{fmt(t.strike_price)}</td>
                          <td className="py-2.5 text-right text-gray-700">{fmt(t.current_price)}</td>
                          <td className="py-2.5 text-right text-gray-700">
                            {t.client_premium != null ? `${t.client_premium}%` : "-"}
                          </td>
                          <td className="py-2.5 text-gray-700 text-xs">
                            {t.dividend_treatment || "-"}
                          </td>
                          <td className="py-2.5 text-right text-gray-700 text-xs">
                            {t.closed_at ? new Date(t.closed_at).toLocaleDateString("zh-CN") : "-"}
                          </td>
                          <td className={`py-2.5 text-right font-medium ${isProfit ? "text-emerald-600" : revenue === 0 ? "text-gray-500" : "text-red-500"}`}>
                            {isProfit ? "+" : ""}{fmt(revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
