import { AlertTriangle, ArrowDownRight, Scale } from 'lucide-react';
import type { DashboardOverview } from '../../types';

interface DashboardInsightsProps {
    data: DashboardOverview;
}

export default function DashboardInsights({ data }: DashboardInsightsProps) {
    const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
    const balance = (data.totalIncome ?? 0) - (data.totalExpense ?? 0);
    const topCategory = Object.entries(data.categoryReport?.dataPoints ?? {})
        .sort((a, b) => b[1] - a[1])[0];
    const criticalBudgets = data.budgetStatuses?.filter(budget => budget.status !== 'OK') ?? [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="app-card p-5">
                <div className="flex items-center gap-2 text-gray-500 mb-3">
                    <ArrowDownRight size={16} />
                    <p className="text-sm font-medium">Categoria principale</p>
                </div>
                <p className="text-xl font-semibold text-gray-900 truncate">{topCategory?.[0] ?? 'Nessuna spesa'}</p>
                <p className="text-sm text-gray-500 mt-1">{topCategory ? fmt(topCategory[1]) : 'Nessun dato nel periodo'}</p>
            </div>

            <div className="app-card p-5">
                <div className="flex items-center gap-2 text-gray-500 mb-3">
                    <AlertTriangle size={16} />
                    <p className="text-sm font-medium">Budget da controllare</p>
                </div>
                <p className="text-xl font-semibold text-gray-900">{criticalBudgets.length}</p>
                <p className="text-sm text-gray-500 mt-1">
                    {criticalBudgets[0]?.categoryName ?? 'Tutto sotto controllo'}
                </p>
            </div>

            <div className="app-card p-5">
                <div className="flex items-center gap-2 text-gray-500 mb-3">
                    <Scale size={16} />
                    <p className="text-sm font-medium">Saldo del periodo</p>
                </div>
                <p className={`text-xl font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(balance)}</p>
                <p className="text-sm text-gray-500 mt-1">{balance >= 0 ? 'Entrate sopra le uscite' : 'Uscite sopra le entrate'}</p>
            </div>
        </div>
    );
}
