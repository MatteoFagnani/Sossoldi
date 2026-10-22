import { formatAbsoluteCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DashboardOverview } from '../../types';

interface DashboardRecentTransactionsProps {
    transactions: DashboardOverview['recentTransactions'];
    onNewTransaction?: () => void;
}

export default function DashboardRecentTransactions({ transactions, onNewTransaction }: DashboardRecentTransactionsProps) {
    const navigate = useNavigate();
    const fmt = formatAbsoluteCurrency;

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="app-card p-6 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Transazioni recenti</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Ultimi movimenti registrati</p>
                    </div>
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
                            <div
                                key={tx.id}
                                onClick={() => navigate('/transactions')}
                                className="flex items-center gap-3 py-2 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{ backgroundColor: `${tx.categoryColor || '#111827'}15`, color: tx.categoryColor || '#111827' }}
                                >
                                    {tx.categoryName?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{tx.description || tx.categoryName}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span>{formatDate(tx.date)}</span>
                                        {tx.accountName && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate max-w-[100px]">{tx.accountName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-400 mb-2">Nessuna transazione recente</p>
                            {onNewTransaction && (
                                <button
                                    onClick={onNewTransaction}
                                    className="text-xs text-gray-900 font-semibold hover:underline"
                                >
                                    + Registra una spesa
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
