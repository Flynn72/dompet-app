import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function BalanceCard({ totalBalance, onAddIncome, onAddExpense }) {
  return (
    <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-[#1e1b4b] p-6 rounded-3xl shadow-xl shadow-blue-900/20 border border-indigo-500/20 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
      <p className="text-blue-200 text-sm font-medium">Total Saldo</p>
      <h3 className="text-3xl font-bold text-white mt-2">
        Rp {Number(totalBalance || 0).toLocaleString('id-ID')}
      </h3>
      <div className="mt-6 flex gap-3">
        <button 
          onClick={onAddIncome}
          className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowDownRight size={16} className="text-green-400" />
          Pemasukan
        </button>
        <button 
          onClick={onAddExpense}
          className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/30 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowUpRight size={16} className="text-red-400" />
          Pengeluaran
        </button>
      </div>
    </div>
  );
}