import React from 'react';
import BalanceCard from '../components/BalanceCard';
import SummaryCards from '../components/SummaryCards';
import CashFlowChart from '../components/CashFlowChart';
import RecentTransaction from '../components/RecentTransaction';

export default function DashboardSection({ totalBalance, totalIncome, totalExpense, transactions }) {
  const chartData = [
    { name: '1', income: 3000000, expense: 1200000 },
    { name: '10', income: 4000000, expense: 1400000 },
    { name: '20', income: 3500000, expense: 2200000 },
    { name: '30', income: 5000000, expense: 1800000 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-1">
          <BalanceCard totalBalance={totalBalance} />
        </div>
        <div className="col-span-1 md:col-span-2">
          <SummaryCards totalIncome={totalIncome} totalExpense={totalExpense} />
        </div>
      </div>
      <CashFlowChart chartData={chartData} />
      <RecentTransaction transactions={transactions} />
    </div>
  );
}