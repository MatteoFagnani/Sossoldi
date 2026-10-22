import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DashboardOverview } from '../../types';
import { ProgressBar } from '../UI';
import { formatCurrency } from '../../utils/formatters';

interface DashboardBudgetOverviewProps {
    budgets: DashboardOverview['budgetStatuses'];
    isAnnualView?: boolean;
}

export default function DashboardBudgetOverview({ budgets, isAnnualView = false }: DashboardBudgetOverviewProps) {
    const navigate = useNavigate();
    const fmt = formatCurrency;

    const sortedBudgets = [...(budgets || [])].sort((a, b) => b.percentageUsed - a.percentageUsed);
    const criticalCount = sortedBudgets.filter(b => b.status !== 'OK' || b.percentageUsed >= 90).length;

    return (
        <div className="app-card p-6 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-gray-900">
                                {isAnnualView ? 'Budget — media mensile' : 'Stato budget'}
                            </h2>
                            {sortedBudgets.length > 0 && (
                                criticalCount > 0 ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                                        {criticalCount} {criticalCount === 1 ? 'allerta' : 'allerte'}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        In regola
                                    </span>
                                )
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isAnnualView ? "Spesa media nell'anno" : 'Monitoraggio soglie di spesa'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/budgets')}
                        className="flex items-center gap-1 text-xs text-gray-900 hover:text-black font-medium transition-colors"
                    >
                        Vedi tutti <ChevronRight size={13} />
                    </button>
                </div>

                <div className="space-y-3.5">
                    {sortedBudgets.length > 0 ? (
                        sortedBudgets.slice(0, 4).map((bs) => {
                            const pct = bs.percentageUsed;
                            const color = bs.status === 'OK' ? '#10b981' : bs.status === 'WARNING' ? '#f59e0b' : '#f43f5e';
                            return (
                                <div key={bs.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">
                                            {bs.categoryName}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span className="text-gray-400 font-normal">
                                                {fmt(bs.currentSpending)} / {fmt(bs.limitAmount)}
                                            </span>
                                            <span className="font-semibold" style={{ color }}>
                                                {Math.round(pct)}%
                                            </span>
                                        </div>
                                    </div>
                                    <ProgressBar pct={pct} color={color} height={5} />
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-400 mb-2">Nessun budget configurato</p>
                            <button
                                onClick={() => navigate('/budgets')}
                                className="text-xs text-gray-900 font-semibold hover:underline"
                            >
                                + Crea un budget
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
