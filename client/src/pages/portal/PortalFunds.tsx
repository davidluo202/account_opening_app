import { useState, useEffect } from "react";
import PortalLayout from "./PortalLayout";
import { Upload, Banknote, Clock, CheckCircle, AlertCircle, RefreshCw, Wallet } from "lucide-react";

const API_BASE = "https://backoffice.cmf-otc.com";

const BANK_TRANSFER_INFO = [
  { label: "收款銀行 / Bank", value: "China CITIC Bank International Limited / 中信銀行（國際）有限公司" },
  { label: "銀行編號 / Bank Code", value: "018" },
  { label: "收款戶名 / Beneficiary", value: "CANTON MUTUAL FINANCIAL LIMITED - CLIENT ACCOUNT" },
  { label: "港幣賬號 / HKD Account", value: "744-1-81145700" },
  { label: "美元賬號 / USD Account", value: "744-1-81145701" },
  { label: "人民幣賬號 / RMB Account", value: "744-1-81145718" },
  { label: "SWIFT Code", value: "KWHKHKHH" },
];

const CURRENCIES = ["HKD", "USD", "CNY"] as const;
type Currency = typeof CURRENCIES[number];

interface FundTransaction {
  id: number;
  tx_code: string;
  client_id: number;
  type: "deposit" | "withdraw";
  amount: number;
  currency: string;
  bank_name: string;
  bank_account: string;
  receipt_url: string | null;
  status: "pending" | "confirmed" | "completed" | "rejected";
  remarks: string | null;
  created_at: string;
}

interface Balances {
  balance_hkd: number;
  balance_usd: number;
  balance_cny: number;
  frozen_hkd: number;
  frozen_usd: number;
  frozen_cny: number;
}

function getClientId(): string {
  return localStorage.getItem("portal_client_id") || "1";
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" />待确认</span>;
  if (status === "confirmed" || status === "completed") return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" />已确认</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800"><AlertCircle className="h-3 w-3" />拒绝</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
}

export default function PortalCollateral() {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdrawal">("deposit");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<Currency>("HKD");
  const [withdrawCurrency, setWithdrawCurrency] = useState<Currency>("HKD");
  const [depositRemarks, setDepositRemarks] = useState("");
  const [withdrawRemarks, setWithdrawRemarks] = useState("");

  const [balances, setBalances] = useState<Balances | null>(null);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clientId = getClientId();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [balRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/api/funds?id=balance&client_id=${clientId}`),
        fetch(`${API_BASE}/api/funds?client_id=${clientId}`),
      ]);
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalances(balData);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData : txData.data || []);
      }
    } catch (e: any) {
      setError("获取数据失败 / Failed to load data: " + (e.message || "Network error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deposits = transactions.filter((t) => t.type === "deposit" && (t.status === "pending" || t.status === "confirmed"));
  const withdrawals = transactions.filter((t) => t.type === "withdraw" && (t.status === "pending" || t.status === "confirmed"));
  const history = transactions.filter((t) => t.status === "completed" || t.status === "rejected");

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("请输入有效的入金金额");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: parseInt(clientId),
          type: "deposit",
          amount: parseFloat(depositAmount),
          currency: depositCurrency,
          bank_name: "",
          bank_account: "",
          remarks: depositRemarks || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }
      setSuccessMsg("入金申请已提交 / Deposit request submitted");
      setDepositAmount("");
      setDepositRemarks("");
      fetchData();
    } catch (e: any) {
      setError("提交失败 / Submit failed: " + (e.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("请输入有效的提取金額");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: parseInt(clientId),
          type: "withdraw",
          amount: parseFloat(withdrawAmount),
          currency: withdrawCurrency,
          bank_name: selectedBank || "",
          bank_account: "",
          remarks: withdrawRemarks || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }
      setSuccessMsg("提取抵押品申請已提交 / Withdrawal request submitted");
      setWithdrawAmount("");
      setWithdrawRemarks("");
      fetchData();
    } catch (e: any) {
      setError("提交失败 / Submit failed: " + (e.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">抵押品管理 <span className="text-gray-400 font-normal text-lg">/ Collateral</span></h1>
            <p className="text-sm text-gray-500 mt-1">管理您的抵押品存入與提取</p>
          </div>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>

        {/* Balance Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">账户余额 / Account Balance</h2>
          </div>
          {balances ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { label: "HKD", balance: balances.balance_hkd, frozen: balances.frozen_hkd },
                { label: "USD", balance: balances.balance_usd, frozen: balances.frozen_usd },
                { label: "CNY", balance: balances.balance_cny, frozen: balances.frozen_cny },
              ] as const).map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="text-xl font-bold text-gray-900">
                    {(item.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {(item.frozen ?? 0) > 0 && (
                    <div className="text-xs text-orange-500 mt-1">冻结 / Frozen: {item.frozen.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                  )}
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="text-center py-4 text-gray-400 text-sm">加载中...</div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">暂无余额数据</div>
          )}
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />{successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(["deposit", "withdrawal"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "deposit" ? "存入抵押品 / Deposit Collateral" : "提取抵押品 / Withdraw Collateral"}
            </button>
          ))}
        </div>

        {activeTab === "deposit" && (
          <div className="space-y-6">
            {/* Bank transfer info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-800">銀行轉賬存入抵押品 / Bank Transfer (Collateral Deposit)</h2>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2 mb-4">
                {BANK_TRANSFER_INFO.map((item) => (
                  <div key={item.label} className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="text-sm text-gray-500 sm:w-52 flex-shrink-0">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                重要提示：转账时请在备注栏填写您的账户号码 CMF-2026-0001，以便我们核实入金。<br />
                <span className="text-gray-400">Important: Please include your account number CMF-2026-0001 in the remittance remarks.</span>
              </p>
            </div>

            {/* Deposit form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-800">提交存入申請 / Submit Collateral Deposit Request</h2>
              </div>
              <div className="space-y-4 max-w-md">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">入金金额 / Amount</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="请输入入金金额"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-gray-700 mb-1">币种</label>
                    <select
                      value={depositCurrency}
                      onChange={(e) => setDepositCurrency(e.target.value as Currency)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注 / Remarks</label>
                  <input
                    type="text"
                    value={depositRemarks}
                    onChange={(e) => setDepositRemarks(e.target.value)}
                    placeholder="可选"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <label className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Upload className="h-10 w-10 text-gray-300 mb-3" />
                <span className="text-sm text-gray-500">点击或拖拽上传银行转账回单</span>
                <span className="text-xs text-gray-400 mt-1">Click or drag to upload bank transfer receipt</span>
                <span className="text-xs text-gray-300 mt-2">支持 PDF, JPG, PNG（最大 10MB）</span>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
              </label>
              <button
                onClick={handleDeposit}
                disabled={submitting}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {submitting ? "提交中..." : "提交存入申請 / Submit Collateral Deposit"}
              </button>
            </div>

            {/* Pending deposits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">待處理存入 / Pending Collateral Deposits</h2>
              {deposits.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-medium">单号</th>
                        <th className="pb-2 font-medium">日期</th>
                        <th className="pb-2 font-medium">金额</th>
                        <th className="pb-2 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((dep) => (
                        <tr key={dep.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 font-mono text-xs">{dep.tx_code || dep.id}</td>
                          <td className="py-3 text-gray-600">{dep.created_at?.split("T")[0]}</td>
                          <td className="py-3 font-medium text-emerald-600">{formatAmount(dep.amount, dep.currency)}</td>
                          <td className="py-3"><StatusBadge status={dep.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">暂无待處理存入记录</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "withdrawal" && (
          <div className="space-y-6">
            {/* Withdrawal form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">提取抵押品申請 / Collateral Withdrawal Request</h2>
              <div className="space-y-4 max-w-md">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">提取金額 / Amount</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="请输入提取金額"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-gray-700 mb-1">币种</label>
                    <select
                      value={withdrawCurrency}
                      onChange={(e) => setWithdrawCurrency(e.target.value as Currency)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">收款银行账户 / Bank Account</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">请选择银行账户</option>
                    <option value="中国银行 xxxx-1234">中国银行 xxxx-1234</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注 / Remarks</label>
                  <input
                    type="text"
                    value={withdrawRemarks}
                    onChange={(e) => setWithdrawRemarks(e.target.value)}
                    placeholder="可选"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  出金将在1-3个工作日内到账。手续费：HKD 50/笔（最低）。<br />
                  <span className="text-gray-300">Withdrawals processed within 1-3 business days. Fee: HKD 50/transaction (minimum).</span>
                </p>
                <button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  {submitting ? "提交中..." : "提交提取抵押品申請 / Submit Collateral Withdrawal"}
                </button>
              </div>
            </div>

            {/* Pending withdrawals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">待處理提取 / Pending Withdrawals</h2>
              {withdrawals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-medium">单号</th>
                        <th className="pb-2 font-medium">日期</th>
                        <th className="pb-2 font-medium">金额</th>
                        <th className="pb-2 font-medium">银行</th>
                        <th className="pb-2 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 font-mono text-xs">{w.tx_code || w.id}</td>
                          <td className="py-3 text-gray-600">{w.created_at?.split("T")[0]}</td>
                          <td className="py-3 font-medium text-red-500">{formatAmount(w.amount, w.currency)}</td>
                          <td className="py-3 text-gray-600">{w.bank_name || "-"}</td>
                          <td className="py-3"><StatusBadge status={w.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">暂无待處理提取记录</div>
              )}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">抵押品變動記錄 <span className="text-gray-400 font-normal text-sm">/ Collateral History</span></h2>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">单号</th>
                    <th className="pb-2 font-medium">日期</th>
                    <th className="pb-2 font-medium">类型</th>
                    <th className="pb-2 font-medium">金额</th>
                    <th className="pb-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-mono text-xs">{txn.tx_code || txn.id}</td>
                      <td className="py-3 text-gray-600">{txn.created_at?.split("T")[0]}</td>
                      <td className="py-3 text-gray-600">{txn.type === "deposit" ? "入金 Deposit" : "出金 Withdrawal"}</td>
                      <td className={`py-3 font-medium ${txn.type === "deposit" ? "text-emerald-600" : "text-red-500"}`}>
                        {txn.type === "deposit" ? "+" : "-"}{formatAmount(txn.amount, txn.currency)}
                      </td>
                      <td className="py-3"><StatusBadge status={txn.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">暫無變動記錄 / No history yet</div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
