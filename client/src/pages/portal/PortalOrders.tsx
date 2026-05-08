import { useState } from "react";
import PortalLayout from "./PortalLayout";
import { ClipboardList } from "lucide-react";

type OrderTab = "pending" | "filled" | "cancelled" | "all";

const MOCK_ORDERS: {
  id: string; time: string; symbol: string; side: "buy" | "sell";
  type: "market" | "limit"; qty: number; price: string; status: OrderTab;
}[] = [];

const TAB_LABELS: { key: OrderTab; label: string }[] = [
  { key: "pending", label: "待执行 / Pending" },
  { key: "filled", label: "已成交 / Filled" },
  { key: "cancelled", label: "已撤销 / Cancelled" },
  { key: "all", label: "全部 / All" },
];

function SideBadge({ side }: { side: "buy" | "sell" }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${side === "buy" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
      {side === "buy" ? "买入 Buy" : "卖出 Sell"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    filled: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };
  const label: Record<string, string> = { pending: "待执行", filled: "已成交", cancelled: "已撤销" };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[status] || "bg-gray-100 text-gray-500"}`}>{label[status] || status}</span>;
}

export default function PortalOrders() {
  const [activeTab, setActiveTab] = useState<OrderTab>("pending");

  const filtered = activeTab === "all" ? MOCK_ORDERS : MOCK_ORDERS.filter((o) => o.status === activeTab);

  return (
    <PortalLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单 <span className="text-gray-400 font-normal text-lg">/ Orders</span></h1>
          <p className="text-sm text-gray-500 mt-1">查看和管理您的订单记录</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">订单号</th>
                    <th className="pb-3 font-medium">时间</th>
                    <th className="pb-3 font-medium">代码</th>
                    <th className="pb-3 font-medium">方向</th>
                    <th className="pb-3 font-medium">类型</th>
                    <th className="pb-3 font-medium text-right">数量</th>
                    <th className="pb-3 font-medium text-right">价格</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs text-gray-500">{order.id}</td>
                      <td className="py-3 text-gray-600 text-xs">{order.time}</td>
                      <td className="py-3 font-mono font-semibold text-blue-600">{order.symbol}</td>
                      <td className="py-3"><SideBadge side={order.side} /></td>
                      <td className="py-3 text-gray-600 text-xs">{order.type === "market" ? "市价" : "限价"}</td>
                      <td className="py-3 text-right">{order.qty}</td>
                      <td className="py-3 text-right text-gray-600">{order.price}</td>
                      <td className="py-3"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-base font-medium text-gray-500 mb-1">暂无订单记录</h3>
              <p className="text-sm text-gray-400">No orders found. Use the trading page to place orders.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
