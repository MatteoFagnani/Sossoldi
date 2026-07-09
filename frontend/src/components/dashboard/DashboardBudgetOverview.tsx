import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DashboardOverview } from '../../types';
import { ProgressBar } from '../UI';

interface DashboardBudgetOverviewProps {
    budgets: DashboardOverview['budgetStatuses'];
    isAnnualView?: boolean;
}

export default function DashboardBudgetOverview({ budgets, isAnnualView = false }: DashboardBudgetOverviewProps) {
    const navigate = useNavigate();

    return (
        <div className="app-card p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                        {isAnnualView ? 'Budget — media mensile' : 'Budget del mese'}
                    </h2>
                    {isAnnualView && (
                        <p className="text-xs text-gray-400 mt-0.5">Spesa media per categoria nell'anno</p>
                    )}
                </div>
                <button
                    onClick={() => navigate('/budgets')}
                    className="flex items-center gap-1 text-xs text-gray-900 hover:text-black font-medium transition-colors"
                >
                    Vedi tutti <ChevronRight size={13} />
                </button>
            </div>
            <div className="space-y-4">
                {budgets?.length ? (
                    budgets.slice(0, 4).map((bs) => {
                        const pct = bs.percentageUsed;
                        const color = bs.status === 'OK' ? '#10b981' : bs.status === 'WARNING' ? '#f59e0b' : '#f43f5e';
                        return (
                            <div key={bs.id}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700">{bs.categoryName}</span>
                                        {bs.percentageUsed >= 95 && (
                                            <span className="text-xs text-red-500 font-medium">
                                                {isAnnualView ? 'Sopra budget' : 'Quasi esaurito'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color }}>{Math.round(pct)}%</span>
                                </div>
                                <ProgressBar pct={pct} color={color} />
                            </div>
                        );
                    })
                ) : (
                    <p className="text-sm text-gray-400 py-8 text-center">Nessun budget configurato</p>
                )}
            </div>
        </div>
    );
}

