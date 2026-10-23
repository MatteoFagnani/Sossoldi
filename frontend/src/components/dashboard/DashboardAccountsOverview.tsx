import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getAccountIcon, getAccountColor } from '../../constants/accountMeta';
import type { Account } from '../../types';

interface DashboardAccountsOverviewProps {
    accounts: Account[];
    liquidTotal: number;
    investmentTotal: number;
}

export default function DashboardAccountsOverview({ accounts, liquidTotal, investmentTotal }: DashboardAccountsOverviewProps) {
    const navigate = useNavigate();
    const fmt = formatCurrency;

    return (
        <div className="app-card p-6 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">I tuoi conti</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Liquidità: <span className="font-medium text-gray-700">{fmt(liquidTotal)}</span></p>
                    </div>
                    <button
                        onClick={() => navigate('/wealth')}
                        className="flex items-center gap-1 text-xs text-gray-900 hover:text-black font-medium transition-colors"
                    >
                        Gestisci <ChevronRight size={13} />
                    </button>
                </div>

                <div className="space-y-2">
                    {accounts.length > 0 ? (
                        accounts.slice(0, 4).map((acc) => {
                            const Icon = getAccountIcon(acc.type);
                            const color = getAccountColor(acc.type);
                            return (
                                <div
                                    key={acc.id}
                                    onClick={() => navigate('/wealth')}
                                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${color}15`, color }}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{acc.name}</p>
                                            <p className="text-[11px] text-gray-400 capitalize">{acc.type.toLowerCase()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                                        {fmt(acc.currentBalance)}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-400 mb-2">Nessun conto registrato</p>
                            <button
                                onClick={() => navigate('/wealth')}
                                className="text-xs text-gray-900 font-semibold hover:underline"
                            >
                                + Aggiungi conto
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {investmentTotal > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Investimenti & PAC</span>
                    <span className="font-semibold text-gray-800">{fmt(investmentTotal)}</span>
                </div>
            )}
        </div>
    );
}
