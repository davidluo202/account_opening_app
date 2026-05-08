import { useState } from "react";
import PortalLayout from "./PortalLayout";
import { Upload, Banknote, Clock, CheckCircle, AlertCircle } from "lucide-react";

const BANK_TRANSFER_INFO = [
  { label: "收款银行 / Bank", value: "中国银行（香港）BANK OF CHINA (HK)" },
  { label: "收款账户名 / Account Name", value: "诚港金融有限公司 CMFinancial Limited" },
  { label: "收款账号 / Account No.", value: "012-345-6789012" },
  { label: "SWIFT Code", value: "BKCHHKHHXXX" },
  { label: "银行代码 / Bank Code", value: "012" },
];

const MOCK_DEPOSITS = [
  { id: "DEP-001", date: "2026-05-01", amount: "HKD 50,000.00", status: "pending", method: "银行转账" },
];

const MOCK_WITHDRAWALS: { id: string; date: string; amount: string; status: string; bank: string }[] = [];

const MOCK_HISTORY = [
  { id: "TXN-001", date: "2026-05-01", type: "入金 Deposit", amount: "+HKD 50,000.00", status: "处理中 Processing" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" />待确认</span>;
  if (status === "approved") return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" />已确认</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800"><AlertCircle className="h-3 w-3" />拒绝</span>;
}

export default function PortalFunds() {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdrawal">("deposit");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  return (
    <PortalLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">资金管理 <span className="text-gray-400 font-normal text-lg">/ Funds</span></h1>
          <p className="text-sm text-gray-500 mt-1">管理您的入金与出金操作</p>
        </div>

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
              {tab === "deposit" ? "入金 / Deposit" : "出金 / Withdrawal"}
            </button>
          ))}
        </div>

        {activeTab === "deposit" && (
          <div className="space-y-6">
            {/* Bank transfer info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-800">银行转账入金 / Bank Transfer</h2>
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

            {/* Upload proof */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-800">上传入金凭证 / Upload Transfer Proof</h2>
              </div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Upload className="h-10 w-10 text-gray-300 mb-3" />
                <span className="text-sm text-gray-500">点击或拖拽上传银行转账回单</span>
                <span className="text-xs text-gray-400 mt-1">Click or drag to upload bank transfer receipt</span>
                <span className="text-xs text-gray-300 mt-2">支持 PDF, JPG, PNG（最大 10MB）</span>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
              </label>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                提交入金申请 / Submit Deposit
              </button>
            </div>

            {/* Pending deposits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">待处理入金 / Pending Deposits</h2>
              {MOCK_DEPOSITS.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-medium">单号</th>
                        <th className="pb-2 font-medium">日期</th>
                        <th className="pb-2 font-medium">金额</th>
                        <th className="pb-2 font-medium">方式</th>
                        <th className="pb-2 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_DEPOSITS.map((dep) => (
                        <tr key={dep.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 font-mono text-xs">{dep.id}</td>
                          <td className="py-3 text-gray-600">{dep.date}</td>
                          <td className="py-3 font-medium text-emerald-600">{dep.amount}</td>
                          <td className="py-3 text-gray-600">{dep.method}</td>
                          <td className="py-3"><StatusBadge status={dep.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">暂无待处理入金记录</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "withdrawal" && (
          <div className="space-y-6">
            {/* Withdrawal form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">出金申请 / Withdrawal Request</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出金金额 / Amount (HKD)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="请输入出金金额"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">收款银行账户 / Bank Account</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">请选择银行账户</option>
                    <option value="1">中国银行 xxxx-1234</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  出金将在1-3个工作日内到账。手续费：HKD 50/笔（最低）。<br />
                  <span className="text-gray-300">Withdrawals processed within 1-3 business days. Fee: HKD 50/transaction (minimum).</span>
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  提交出金申请 / Submit Withdrawal
                </button>
              </div>
            </div>

            {/* Pending withdrawals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">待处理出金 / Pending Withdrawals</h2>
              {MOCK_WITHDRAWALS.length > 0 ? (
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
                      {MOCK_WITHDRAWALS.map((w) => (
                        <tr key={w.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 font-mono text-xs">{w.id}</td>
                          <td className="py-3 text-gray-600">{w.date}</td>
                          <td className="py-3 font-medium text-red-500">{w.amount}</td>
                          <td className="py-3 text-gray-600">{w.bank}</td>
                          <td className="py-3"><StatusBadge status={w.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">暂无待处理出金记录</div>
              )}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">交易历史 <span className="text-gray-400 font-normal text-sm">/ Transaction History</span></h2>
          {MOCK_HISTORY.length > 0 ? (
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
                  {MOCK_HISTORY.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-mono text-xs">{txn.id}</td>
                      <td className="py-3 text-gray-600">{txn.date}</td>
                      <td className="py-3 text-gray-600">{txn.type}</td>
                      <td className="py-3 font-medium text-emerald-600">{txn.amount}</td>
                      <td className="py-3 text-gray-500 text-xs">{txn.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">暂无交易记录 / No history yet</div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
