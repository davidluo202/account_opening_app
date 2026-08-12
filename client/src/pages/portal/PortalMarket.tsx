import { useState, useEffect, useCallback } from "react";
import PortalLayout from "./PortalLayout";
import { Search, TrendingUp, TrendingDown, Plus, X } from "lucide-react";

const MARKET_INDICES = [
  { name: "恒生指数", nameEn: "HSI", value: "19,842.31", change: "+238.14", pct: "+1.23%", up: true },
  { name: "标普500", nameEn: "S&P 500", value: "5,308.15", change: "-21.87", pct: "-0.41%", up: false },
  { name: "纳斯达克", nameEn: "NASDAQ", value: "16,742.39", change: "-131.46", pct: "-0.78%", up: false },
  { name: "道琼斯", nameEn: "DJIA", value: "39,512.84", change: "+176.23", pct: "+0.45%", up: true },
];

type MarketTab = "全部" | "A股" | "港股" | "美股";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  pct: string;
  up: boolean;
  market: "A" | "HK" | "US";
}

// Common stocks for search suggestions
const STOCK_DB: { symbol: string; name: string; market: "A" | "HK" | "US"; tencentCode: string }[] = [
  // A股
  { symbol: "600519", name: "贵州茅台", market: "A", tencentCode: "sh600519" },
  { symbol: "000858", name: "五粮液", market: "A", tencentCode: "sz000858" },
  { symbol: "601318", name: "中国平安", market: "A", tencentCode: "sh601318" },
  { symbol: "600036", name: "招商银行", market: "A", tencentCode: "sh600036" },
  { symbol: "000001", name: "平安银行", market: "A", tencentCode: "sz000001" },
  { symbol: "600276", name: "恒瑞医药", market: "A", tencentCode: "sh600276" },
  { symbol: "601012", name: "隆基绿能", market: "A", tencentCode: "sh601012" },
  { symbol: "300750", name: "宁德时代", market: "A", tencentCode: "sz300750" },
  { symbol: "600900", name: "长江电力", market: "A", tencentCode: "sh600900" },
  { symbol: "601888", name: "中国中免", market: "A", tencentCode: "sh601888" },
  // 港股
  { symbol: "00700", name: "腾讯控股", market: "HK", tencentCode: "hk00700" },
  { symbol: "09988", name: "阿里巴巴-SW", market: "HK", tencentCode: "hk09988" },
  { symbol: "00005", name: "汇丰控股", market: "HK", tencentCode: "hk00005" },
  { symbol: "00941", name: "中国移动", market: "HK", tencentCode: "hk00941" },
  { symbol: "01299", name: "友邦保险", market: "HK", tencentCode: "hk01299" },
  { symbol: "02318", name: "中国平安", market: "HK", tencentCode: "hk02318" },
  { symbol: "03690", name: "美团-W", market: "HK", tencentCode: "hk03690" },
  { symbol: "09618", name: "京东集团-SW", market: "HK", tencentCode: "hk09618" },
  { symbol: "01810", name: "小米集团-W", market: "HK", tencentCode: "hk01810" },
  { symbol: "09888", name: "百度集团-SW", market: "HK", tencentCode: "hk09888" },
  // 美股
  { symbol: "AAPL", name: "苹果 Apple", market: "US", tencentCode: "usAAPL" },
  { symbol: "TSLA", name: "特斯拉 Tesla", market: "US", tencentCode: "usTSLA" },
  { symbol: "NVDA", name: "英伟达 NVIDIA", market: "US", tencentCode: "usNVDA" },
  { symbol: "MSFT", name: "微软 Microsoft", market: "US", tencentCode: "usMSFT" },
  { symbol: "GOOG", name: "谷歌 Alphabet", market: "US", tencentCode: "usGOOG" },
  { symbol: "AMZN", name: "亚马逊 Amazon", market: "US", tencentCode: "usAMZN" },
  { symbol: "META", name: "Meta Platforms", market: "US", tencentCode: "usMETA" },
  { symbol: "BABA", name: "阿里巴巴 Alibaba", market: "US", tencentCode: "usBABA" },
];

function detectMarket(symbol: string): "A" | "HK" | "US" {
  const s = symbol.toUpperCase().trim();
  // Check stock DB first
  const found = STOCK_DB.find((db) => db.symbol.toUpperCase() === s);
  if (found) return found.market;
  // Heuristic: 6-digit number = A-share, 5-digit number = HK, letters = US
  if (/^\d{6}$/.test(s)) return "A";
  if (/^\d{5}$/.test(s)) return "HK";
  return "US";
}

function getTencentCode(symbol: string, market: "A" | "HK" | "US"): string {
  const s = symbol.toUpperCase().trim();
  const found = STOCK_DB.find((db) => db.symbol.toUpperCase() === s);
  if (found) return found.tencentCode;
  if (market === "A") {
    return (s.startsWith("6") ? "sh" : "sz") + s;
  }
  if (market === "HK") return "hk" + s.padStart(5, "0");
  return "us" + s;
}

function getDisplaySymbol(symbol: string, market: "A" | "HK" | "US"): string {
  if (market === "A") return symbol;
  if (market === "HK") return symbol + ".HK";
  return symbol;
}

const STORAGE_KEY = "portal_watchlist";

function loadWatchlist(): WatchlistItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return [
    { symbol: "00700", name: "腾讯控股", price: "—", change: "—", pct: "—", up: true, market: "HK" },
    { symbol: "09988", name: "阿里巴巴-SW", price: "—", change: "—", pct: "—", up: true, market: "HK" },
    { symbol: "AAPL", name: "苹果 Apple", price: "—", change: "—", pct: "—", up: true, market: "US" },
    { symbol: "600519", name: "贵州茅台", price: "—", change: "—", pct: "—", up: true, market: "A" },
  ];
}

function saveWatchlist(list: WatchlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Parse Tencent quote response
function parseTencentQuote(raw: string): { price: string; change: string; pct: string; up: boolean; name: string } | null {
  try {
    // Format: v_sh600519="1~贵州茅台~600519~1800.00~1780.00~...~20.00~1.12~..."
    const match = raw.match(/="(.+)"/);
    if (!match) return null;
    const parts = match[1].split("~");
    if (parts.length < 33) return null;
    const name = parts[1];
    const price = parts[3];
    const lastClose = parseFloat(parts[4]);
    const current = parseFloat(parts[3]);
    const diff = current - lastClose;
    const pctVal = lastClose ? ((diff / lastClose) * 100).toFixed(2) : "0.00";
    const up = diff >= 0;
    return {
      name,
      price: current.toFixed(2),
      change: (up ? "+" : "") + diff.toFixed(2),
      pct: (up ? "+" : "") + pctVal + "%",
      up,
    };
  } catch {
    return null;
  }
}

export default function PortalMarket() {
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [newTicker, setNewTicker] = useState("");
  const [activeTab, setActiveTab] = useState<MarketTab>("全部");
  const [searchResults, setSearchResults] = useState<typeof STOCK_DB>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Persist watchlist
  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  // Search stock DB
  const handleSearchInput = (val: string) => {
    setNewTicker(val);
    if (val.trim().length === 0) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const q = val.toUpperCase().trim();
    const results = STOCK_DB.filter(
      (s) =>
        s.symbol.toUpperCase().includes(q) ||
        s.name.toUpperCase().includes(q) ||
        s.tencentCode.toUpperCase().includes(q)
    ).slice(0, 8);
    setSearchResults(results);
    setShowSearch(results.length > 0);
  };

  const addStock = useCallback((symbol: string, name: string, market: "A" | "HK" | "US") => {
    setWatchlist((prev) => {
      if (prev.find((w) => w.symbol === symbol && w.market === market)) return prev;
      return [...prev, { symbol, name, price: "—", change: "—", pct: "—", up: true, market }];
    });
    setNewTicker("");
    setShowSearch(false);
    setSearchResults([]);
  }, []);

  const handleAddTicker = () => {
    if (!newTicker.trim()) return;
    const symbol = newTicker.toUpperCase().trim();
    const market = detectMarket(symbol);
    const found = STOCK_DB.find((s) => s.symbol.toUpperCase() === symbol);
    const name = found?.name || "—";
    addStock(symbol, name, market);
  };

  const handleRemove = (symbol: string, market: string) => {
    setWatchlist((prev) => prev.filter((w) => !(w.symbol === symbol && w.market === market)));
  };

  // Fetch quotes from Tencent API
  const fetchQuotes = useCallback(async () => {
    if (watchlist.length === 0) return;
    const codes = watchlist.map((w) => getTencentCode(w.symbol, w.market));
    const url = `https://qt.gtimg.cn/q=${codes.join(",")}`;
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      const lines = text.split(";").filter((l) => l.trim());
      const updated = [...watchlist];
      lines.forEach((line) => {
        const parsed = parseTencentQuote(line);
        if (!parsed) return;
        // Match by code in the line
        const codeMatch = line.match(/v_(\w+)/);
        if (!codeMatch) return;
        const code = codeMatch[1];
        const idx = updated.findIndex((w) => getTencentCode(w.symbol, w.market) === code);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            name: parsed.name || updated[idx].name,
            price: parsed.price,
            change: parsed.change,
            pct: parsed.pct,
            up: parsed.up,
          };
        }
      });
      setWatchlist(updated);
    } catch {
      // Silently fail — quotes will show cached/placeholder data
    }
  }, [watchlist]);

  // Fetch quotes on mount and every 30s
  useEffect(() => {
    fetchQuotes();
    const timer = setInterval(fetchQuotes, 30000);
    return () => clearInterval(timer);
    // Only re-create interval when watchlist length changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist.length]);

  // Filter by tab and search
  const filtered = watchlist.filter((w) => {
    if (activeTab === "A股" && w.market !== "A") return false;
    if (activeTab === "港股" && w.market !== "HK") return false;
    if (activeTab === "美股" && w.market !== "US") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.symbol.toLowerCase().includes(q) || w.name.toLowerCase().includes(q);
    }
    return true;
  });

  const tabs: MarketTab[] = ["全部", "A股", "港股", "美股"];

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
            <div className="relative flex gap-2">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                onFocus={() => { if (searchResults.length > 0) setShowSearch(true); }}
                placeholder="添加代码 e.g. 00700 / 600519 / AAPL"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
              <button
                onClick={handleAddTicker}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
              {/* Search dropdown */}
              {showSearch && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {searchResults.map((s) => (
                    <button
                      key={s.tencentCode}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between text-sm"
                      onMouseDown={(e) => { e.preventDefault(); addStock(s.symbol, s.name, s.market); }}
                    >
                      <span>
                        <span className="font-mono font-semibold text-blue-600">{getDisplaySymbol(s.symbol, s.market)}</span>
                        <span className="ml-2 text-gray-600">{s.name}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {s.market === "A" ? "A股" : s.market === "HK" ? "港股" : "美股"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
                  <th className="pb-3 font-medium">代码 Symbol</th>
                  <th className="pb-3 font-medium">简称 Name</th>
                  <th className="pb-3 font-medium text-right">现价 Price</th>
                  <th className="pb-3 font-medium text-right">涨跌幅 %</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.symbol + item.market} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-mono font-semibold text-blue-600">{getDisplaySymbol(item.symbol, item.market)}</td>
                    <td className="py-3 text-gray-700">{item.name}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{item.price}</td>
                    <td className={`py-3 text-right font-medium ${item.up ? "text-emerald-600" : "text-red-500"}`}>{item.pct}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleRemove(item.symbol, item.market)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">暂无自选股 / No stocks in watchlist</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
