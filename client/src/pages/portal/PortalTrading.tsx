import { useState } from "react";
import PortalLayout from "./PortalLayout";
import { AlertTriangle, Search } from "lucide-react";

type OrderSide = "buy" | "sell";
type OrderType = "market" | "limit";

export default function PortalTrading() {
  const [side, setSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  const estimatedCost = () => {
    if (!qty) return "—";
    if (orderType === "market") return "以市价成交 / At market price";
    if (!price) return "—";
    const total = parseFloat(qty) * parseFloat(price);
    if (isNaN(total)) return "—";
    return `HKD ${total.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <PortalLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">交易 <span className="text-gray-400 font-normal text-lg">/ Trading</span></h1>
          <p className="text-sm text-gray-500 mt-1">下单买卖证券</p>
        </div>

        {/* Demo disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">演示模式 / Demo Mode</p>
            <p className="text-xs text-amber-600 mt-0.5">This is a demo. Orders are not executed. 此为演示界面，订单不会实际执行。</p>
          </div>
        </div>

        {/* Order form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Symbol search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">股票代码 / Stock Symbol</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="输入代码，如 0700.HK 或 AAPL"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buy / Sell toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">交易方向 / Direction</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setSide("buy")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${side === "buy" ? "bg-emerald-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                买入 / Buy
              </button>
              <button
                onClick={() => setSide("sell")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${side === "sell" ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                卖出 / Sell
              </button>
            </div>
          </div>

          {/* Order type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">订单类型 / Order Type</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(["market", "limit"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${orderType === t ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                >
                  {t === "market" ? "市价 Market" : "限价 Limit"}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">数量 / Quantity (手 Lots)</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="请输入手数"
              min="1"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price (limit only) */}
          {orderType === "limit" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">限价 / Limit Price (HKD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="请输入限价"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Estimated cost */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">预估金额 / Est. Cost</span>
              <span className="font-semibold text-gray-900">{estimatedCost()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">可用资金 / Available</span>
              <span className="font-medium text-gray-600">HKD 0.00</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>手续费 / Commission</span>
              <span>另计 / Additional</span>
            </div>
          </div>

          {/* Submit */}
          <button
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors ${
              side === "buy"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {side === "buy" ? "确认买入 / Confirm Buy" : "确认卖出 / Confirm Sell"}
          </button>

          <p className="text-center text-xs text-gray-300">
            * 演示系统，订单不会实际执行 / Demo only — no real orders placed
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}
