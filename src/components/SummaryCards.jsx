import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function SummaryCards({ totalIncome, totalExpense }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6">
      <div className="bg-[#0a1128] p-5 rounded-3xl border border-blue-900/30 flex flex-col justify-center">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
          <ArrowDownRight size={20} className="text-green-400" />
        </div>
        <p className="text-slate-400 text-sm">Pemasukan Bulan Ini</p>
        <h4 className="text-xl font-semibold text-white mt-1">
          Rp {Number(totalIncome || 0).toLocaleString('id-ID')}
        </h4>
      </div>
      <div className="bg-[#0a1128] p-5 rounded-3xl border border-blue-900/30 flex flex-col justify-center">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
          <ArrowUpRight size={20} className="text-red-400" />
        </div>
        <p className="text-slate-400 text-sm">Pengeluaran Bulan Ini</p>
        <h4 className="text-xl font-semibold text-white mt-1">
          Rp {Number(totalExpense || 0).toLocaleString('id-ID')}
        </h4>
      </div>
    </div>
  );
}