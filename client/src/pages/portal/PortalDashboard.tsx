import { useState, useEffect } from "react";
import PortalLayout from "./PortalLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, RefreshCw } from "lucide-react";

const API_BASE = "https://backoffice.cmf-otc.com";

const FX_RATES: Record<string, number> = { HKD: 1, USD: 7.78, CNY: 1.07 };

interface Balances {
  balance_hkd: number;
  balance_usd: number;
  balance_cny: number;
  frozen_hkd: number;
  frozen_usd: number;
  frozen_cny: number;
}

interface Position {
  trade_code: string;
  underlying_ticker: string;
  underlying_name: string;
  notional_amount: number;
  strike_price: number;
  current_price: number;
  tenor_days: number;
  expiry_date: string;
  option_type: string;
  client_premium: number;
  status: string;
}

function getClientId(): string {
  return localStorage.getItem("portal_client_id") || "1";
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
  const [balances, setBalances] = useState<Balances | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const clientId = getClientId();
    try {
      const [balRes, posRes] = await Promise.all([
        fetch(`${API_BASE}/api/funds?id=balance&client_id=${clientId}`),
        fetch(`${API_BASE}/api/trades?client_id=${clientId}&status=position`),
      ]);
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalances(balData);
      }
      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(Array.isArray(posData) ? posData : []);
      }
    } catch {
      // silent — cards will show fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Computed values
  const totalAssetsHKD = balances
    ? balances.balance_hkd * FX_RATES.HKD + balances.balance_usd * FX_RATES.USD + balances.balance_cny * FX_RATES.CNY
    : 0;

  const availableHKD = balances
    ? (balances.balance_hkd - balances.frozen_hkd) * FX_RATES.HKD
      + (balances.balance_usd - balances.frozen_usd) * FX_RATES.USD
      + (balances.balance_cny - balances.frozen_cny) * FX_RATES.CNY
    : 0;

  const portfolioValue = positions.reduce((sum, p) => sum + (p.notional_amount || 0), 0);

  const totalPnL = positions.reduce((sum, p) => {
    if (!p.strike_price) return sum;
    return sum + ((p.current_price - p.strike_price) / p.strike_price) * p.notional_amount;
  }, 0);

  const pnlPositive = totalPnL >= 0;

  return (
    <PortalLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">账户总览 <span className="text-gray-400 font-normal text-lg">/ Dashboard</span></h1>
            <p className="text-sm text-gray-500 mt-1">欢迎回来，{user?.name || user?.email}</p>
          </div>
          <button onClick={fetchData} disabled={loading} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="总资产" titleEn="Total Assets"
            value={loading ? "加载中..." : `HKD ${fmt(totalAssetsHKD)}`}
            icon={<DollarSign className="h-6 w-6 text-blue-600" />} accent="bg-blue-50"
          />
          <StatCard
            title="现金结余" titleEn="Cash Balance"
            value={loading ? "加载中..." : `HKD ${fmt(availableHKD)}`}
            icon={<Activity className="h-6 w-6 text-emerald-600" />} accent="bg-emerald-50"
          />
          <StatCard
            title="持仓市值" titleEn="Portfolio Value"
            value={loading ? "加载中..." : `HKD ${fmt(portfolioValue)}`}
            icon={<BarChart2 className="h-6 w-6 text-violet-600" />} accent="bg-violet-50"
          />
          <StatCard
            title="浮动盈亏" titleEn="P&L"
            value={loading ? "加载中..." : `${pnlPositive ? "+" : ""}HKD ${fmt(totalPnL)}`}
            sub={positions.length > 0 ? `${positions.length} 个持仓` : "暂无持仓"}
            icon={pnlPositive
              ? <TrendingUp className="h-6 w-6 text-emerald-600" />
              : <TrendingDown className="h-6 w-6 text-red-500" />}
            accent={pnlPositive ? "bg-emerald-50" : "bg-red-50"}
          />
        </div>

        {/* Balance breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">资金明细 <span className="text-gray-400 font-normal text-sm">/ Balance Breakdown</span></h2>
          {loading ? (
            <p className="text-sm text-gray-400">加载中...</p>
          ) : !balances ? (
            <p className="text-sm text-gray-400">暂无数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">币种 / Currency</th>
                    <th className="pb-2 font-medium text-right">总余额 / Balance</th>
                    <th className="pb-2 font-medium text-right">冻结 / Frozen</th>
                    <th className="pb-2 font-medium text-right">可用 / Available</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { ccy: "HKD", bal: balances.balance_hkd, frz: balances.frozen_hkd },
                    { ccy: "USD", bal: balances.balance_usd, frz: balances.frozen_usd },
                    { ccy: "CNY", bal: balances.balance_cny, frz: balances.frozen_cny },
                  ] as const).map((row) => (
                    <tr key={row.ccy} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium text-gray-800">{row.ccy}</td>
                      <td className="py-2.5 text-right text-gray-700">{fmt(row.bal)}</td>
                      <td className="py-2.5 text-right text-gray-400">{fmt(row.frz)}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">{fmt(row.bal - row.frz)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Positions table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">持仓概览 <span className="text-gray-400 font-normal text-sm">/ Positions</span></h2>
          {loading ? (
            <p className="text-sm text-gray-400">加载中...</p>
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Activity className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">暂无持仓</p>
              <p className="text-gray-300 text-xs mt-1">No active positions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">标的 / Underlying</th>
                    <th className="pb-2 font-medium">方向 / Type</th>
                    <th className="pb-2 font-medium text-right">名义本金 / Notional</th>
                    <th className="pb-2 font-medium text-right">期初价 / Strike</th>
                    <th className="pb-2 font-medium text-right">现价 / Current</th>
                    <th className="pb-2 font-medium text-right">浮盈/亏 / P&L</th>
                    <th className="pb-2 font-medium text-right">到期日 / Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const pnl = p.strike_price ? ((p.current_price - p.strike_price) / p.strike_price) * p.notional_amount : 0;
                    const isProfit = pnl >= 0;
                    return (
                      <tr key={p.trade_code} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5">
                          <div className="font-medium text-gray-800">{p.underlying_ticker}</div>
                          <div className="text-xs text-gray-400">{p.underlying_name}</div>
                        </td>
                        <td className="py-2.5 text-gray-700">{p.option_type}</td>
                        <td className="py-2.5 text-right text-gray-700">{fmt(p.notional_amount)}</td>
                        <td className="py-2.5 text-right text-gray-700">{fmt(p.strike_price)}</td>
                        <td className="py-2.5 text-right text-gray-700">{fmt(p.current_price)}</td>
                        <td className={`py-2.5 text-right font-medium ${isProfit ? "text-emerald-600" : "text-red-500"}`}>
                          {isProfit ? "+" : ""}{fmt(pnl)}
                        </td>
                        <td className="py-2.5 text-right text-gray-700">{p.expiry_date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
