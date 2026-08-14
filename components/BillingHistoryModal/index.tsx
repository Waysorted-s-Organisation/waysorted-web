"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Transaction = {
  id: string;
  productCode: string;
  kind: string;
  amount: number;
  formattedAmount?: string;
  currency: string;
  status: string;
  date: string;
  receipt: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function BillingHistoryModal({ isOpen, onClose }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      fetch("/api/billing/history")
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || "Could not load transactions.");
          return data;
        })
        .then((data) => {
          setTransactions(data.history);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError(err instanceof Error ? err.message : "Could not load transactions.");
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "captured": return "text-green-600 bg-green-50";
      case "refunded": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getPlanName = (code: string) => {
    if (code === "sub_month_1" || code === "sub_year_1599") return "Discover Plan";
    if (code === "sub_month_2" || code === "sub_year_3499") return "Core Plan";
    if (code === "sub_month_3" || code === "sub_year_7499") return "Pro Plan";
    if (code.startsWith("topup")) return "Credit Top-up";
    return code;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-db-100/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-secondary-db-5">
          <h2 className="text-xl font-medium text-secondary-db-100">Billing History</h2>
          <button onClick={onClose} className="text-secondary-db-80 bg-primary-way-5 rounded-md p-1 cursor-pointer hover:bg-primary-way-10 transition-colors">
            <Image src="/icons/close-1.svg" alt="Close" width={12} height={12} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-way-100 border-t-transparent"></div>
              <p className="text-sm text-secondary-db-60 font-medium">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p role="alert" className="font-medium text-red-700">{error}</p>
              <p className="text-sm text-secondary-db-60">Close and reopen this panel to retry.</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary-way-5 p-4 rounded-full mb-4">
                <Image src="/icons/info-1.svg" alt="Empty" width={24} height={24} className="opacity-40" />
              </div>
              <p className="text-secondary-db-100 font-medium">No transactions yet</p>
              <p className="text-sm text-secondary-db-60">When you purchase a plan or credits, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-secondary-db-5">
                    <th className="pb-3 text-xs font-semibold text-secondary-db-60 uppercase tracking-wider">Plan Name</th>
                    <th className="pb-3 text-xs font-semibold text-secondary-db-60 uppercase tracking-wider">Invoice Date</th>
                    <th className="pb-3 text-xs font-semibold text-secondary-db-60 uppercase tracking-wider text-right">Amount</th>
                    <th className="pb-3 text-xs font-semibold text-secondary-db-60 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-db-5">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-primary-way-5/30 transition-colors">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-secondary-db-100">{getPlanName(t.productCode)}</span>
                          <span className="text-[10px] text-secondary-db-40 font-medium tracking-tight">#{t.receipt}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-secondary-db-80">
                        {new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 text-sm font-semibold text-secondary-db-100 text-right">
                        {t.formattedAmount || `${t.currency} ${t.amount}`}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(t.status)}`}>
                          {t.status === "captured" ? "Paid" : t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-primary-way-5 border-t border-secondary-db-5">
          <p className="text-[11px] text-secondary-db-60 leading-relaxed">
            Tax treatment depends on the final invoice and billing location. Contact support with the receipt reference for billing issues.
          </p>
        </div>
      </div>
    </div>
  );
}
