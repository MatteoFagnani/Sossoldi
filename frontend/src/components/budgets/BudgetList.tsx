import { Pencil, Trash2 } from 'lucide-react';
import type { BudgetStatus } from '../../types';
import { ProgressBar } from '../UI';

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const SHORT_MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

interface BudgetListProps {
    budgets: BudgetStatus[];
    loading: boolean;
    month: number;
    year: number;
    onAdd: () => void;
    onEdit: (b: BudgetStatus) => void;
    onDelete: (id: number) => void;
}

export default function BudgetList({ budgets, loading, month, year, onAdd, onEdit, onDelete }: BudgetListProps) {
    const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (budgets.length === 0) {
        return (
            <div className="app-empty">
                <p className="text-sm text-gray-500 mb-1 font-medium">Nessun budget per {SHORT_MONTHS[month - 1]} {year}</p>
                <p className="text-xs text-gray-400 mb-4">Imposta un budget per tenere sotto controllo le tue spese</p>
                <button
                    onClick={onAdd}
                    className="text-sm text-gray-900 hover:text-black font-medium transition-colors"
                >
                    Crea il primo budget
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
                const pct = b.percentageUsed;
                const color = b.status === 'OK' ? '#10b981' : b.status === 'WARNING' ? '#f59e0b' : '#f43f5e';
                const isOver = b.remainingAmount < 0;

                return (
                    <div key={b.id} className="group app-card app-card-hover p-5 relative">
                        {/* Actions */}
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEdit(b)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Pencil size={13} />
                            </button>
                            <button
                                onClick={() => onDelete(b.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-800 mb-0.5">{b.categoryName}</p>
                            <p className="text-xs text-gray-400">{MONTHS[b.month - 1]} {b.year}</p>
                        </div>

                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Speso</p>
                                <p className="text-xl font-bold text-gray-900">{fmt(b.currentSpending)}</p>
                            </div>
                            <span className="text-sm font-semibold" style={{ color }}>{Math.round(pct)}%</span>
                        </div>

                        <ProgressBar pct={pct} color={color} />

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 mb-0.5">Limite {b.percentageOfIncome ? `(${b.percentageOfIncome}%)` : ''}</p>
                                <p className="text-sm font-semibold text-gray-700">{fmt(b.limitAmount)}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${isOver ? 'bg-red-50' : 'bg-gray-50'}`}>
                                <p className="text-xs text-gray-400 mb-0.5">{isOver ? 'Sforato di' : 'Rimanente'}</p>
                                <p className={`text-sm font-semibold ${isOver ? 'text-red-500' : 'text-gray-700'}`}>
                                    {fmt(Math.abs(b.remainingAmount))}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

