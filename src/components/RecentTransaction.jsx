import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function RecentTransaction({ transactions = [] }) {
  return (
    <div className="bg-[#0a1128] p-6 rounded-3xl border border-blue-900/30">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Transaksi Terakhir</h3>
      </div>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">Belum ada transaksi</p>
        ) : (
          transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#0f172a] border border-blue-900/20 hover:border-blue-700/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {tx.type === 'income' ? (
                    <ArrowDownRight size={24} className="text-green-400" />
                  ) : (
                    <ArrowUpRight size={24} className="text-red-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-medium">{tx.note || 'Transaksi'}</h4>
                  <p className="text-sm text-slate-400">{tx.tx_date}</p>
                </div>
              </div>
              <div className={`font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'income' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}