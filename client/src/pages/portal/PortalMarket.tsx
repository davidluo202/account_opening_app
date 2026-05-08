import { useState } from "react";
import PortalLayout from "./PortalLayout";
import { Search, TrendingUp, TrendingDown, Plus, X } from "lucide-react";

const MARKET_INDICES = [
  { name: "恒生指数", nameEn: "HSI", value: "19,842.31", change: "+238.14", pct: "+1.23%", up: true },
  { name: "标普500", nameEn: "S&P 500", value: "5,308.15", change: "-21.87", pct: "-0.41%", up: false },
  { name: "纳斯达克", nameEn: "NASDAQ", value: "16,742.39", change: "-131.46", pct: "-0.78%", up: false },
  { name: "道琼斯", nameEn: "DJIA", value: "39,512.84", change: "+176.23", pct: "+0.45%", up: true },
];

const DEFAULT_WATCHLIST = [
  { symbol: "0700.HK", name: "腾讯控股", price: "368.40", change: "+3.20", pct: "+0.88%", up: true },
  { symbol: "9988.HK", name: "阿里巴巴", price: "82.35", change: "-1.15", pct: "-1.38%", up: false },
  { symbol: "AAPL", name: "苹果 Apple", price: "211.42", change: "+2.18", pct: "+1.04%", up: true },
  { symbol: "TSLA", name: "特斯拉 Tesla", price: "178.65", change: "-4.30", pct: "-2.35%", up: false },
];

export default function PortalMarket() {
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [newTicker, setNewTicker] = useState("");

  const handleAddTicker = () => {
    if (!newTicker.trim()) return;
    const symbol = newTicker.toUpperCase().trim();
    if (watchlist.find((w) => w.symbol === symbol)) { setNewTicker(""); return; }
    setWatchlist([...watchlist, { symbol, name: "—", price: "—", change: "—", pct: "—", up: true }]);
    setNewTicker("");
  };

  const handleRemove = (symbol: string) => {
    setWatchlist(watchlist.filter((w) => w.symbol !== symbol));
  };

  const filtered = watchlist.filter(
    (w) => !searchQuery || w.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PortalLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">行情 <span className="text-gray-400 font-normal text-lg">/ Market</span></h1>
          <p className="text-sm text-gray-500 mt-1">市场行情与自选股</p>
        </div>

        {/* Market indices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {MARKET_INDICES.map((idx) => (
            <div key={idx.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-xs text-gray-500 mb-1">{idx.name} / {idx.nameEn}</div>
              <div className="text-xl font-bold text-gray-900">{idx.value}</div>
              <div className={`flex items-center gap-1 text-sm font-medium mt-1.5 ${idx.up ? "text-emerald-600" : "text-red-500"}`}>
                {idx.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {idx.change} ({idx.pct})
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-300">* 示例数据，仅供参考 / Demo data for illustration only</p>

        {/* Watchlist */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex-1">自选股 <span className="text-gray-400 font-normal text-sm">/ Watchlist</span></h2>
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索代码或名称 / Search..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Add ticker */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
                placeholder="添加代码 e.g. 0005.HK"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
              />
              <button
                onClick={handleAddTicker}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
                  <th className="pb-3 font-medium">代码 Symbol</th>
                  <th className="pb-3 font-medium">名称 Name</th>
                  <th className="pb-3 font-medium text-right">现价 Price</th>
                  <th className="pb-3 font-medium text-right">涨跌 Change</th>
                  <th className="pb-3 font-medium text-right">涨跌幅 %</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.symbol} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-mono font-semibold text-blue-600">{item.symbol}</td>
                    <td className="py-3 text-gray-700">{item.name}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{item.price}</td>
                    <td className={`py-3 text-right font-medium ${item.up ? "text-emerald-600" : "text-red-500"}`}>{item.change}</td>
                    <td className={`py-3 text-right font-medium ${item.up ? "text-emerald-600" : "text-red-500"}`}>{item.pct}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleRemove(item.symbol)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">暂无自选股 / No stocks in watchlist</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock detail placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">股票详情 <span className="text-gray-400 font-normal text-sm">/ Stock Detail</span></h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">点击自选股中的股票查看详情</p>
            <p className="text-gray-300 text-xs mt-1">Click a stock in the watchlist to view details</p>
            <p className="text-xs text-gray-300 mt-3">实时行情接入功能即将上线 / Real-time quotes coming soon</p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
