import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DashboardOverview } from '../../types';

interface DashboardRecentTransactionsProps {
    transactions: DashboardOverview['recentTransactions'];
}

export default function DashboardRecentTransactions({ transactions }: DashboardRecentTransactionsProps) {
    const navigate = useNavigate();
    const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Transazioni recenti</h2>
                <button
                    onClick={() => navigate('/transactions')}
                    className="flex items-center gap-1 text-xs text-gray-900 hover:text-black font-medium transition-colors"
                >
                    Vedi tutte <ChevronRight size={13} />
                </button>
            </div>
            <div className="space-y-1">
                {transactions?.length ? (
                    transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: `${tx.categoryColor || '#111827'}15`, color: tx.categoryColor || '#111827' }}
                            >
                                {tx.categoryName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{tx.description || tx.categoryName}</p>
                                <p className="text-xs text-gray-400">{tx.date}</p>
                            </div>
                            <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-700'}`}>
                                {tx.type === 'INCOME' ? '+' : ''}{fmt(tx.amount)}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-400 py-8 text-center">Nessuna transazione recente</p>
                )}
            </div>
        </div>
    );
}

