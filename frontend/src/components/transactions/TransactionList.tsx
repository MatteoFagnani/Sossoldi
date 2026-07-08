import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import type { AccountMovement, Transaction } from '../../types';

interface TransactionListProps {
    movements: AccountMovement[];
    loading: boolean;
    onEdit: (tx: Transaction) => void;
    onDelete: (id: number) => void;
}

export default function TransactionList({ movements, loading, onEdit, onDelete }: TransactionListProps) {
    const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Math.abs(n));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (movements.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="py-16 text-center">
                    <p className="text-sm text-gray-400">Nessun movimento trovato</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-400 px-5 py-3.5 hidden md:table-cell">Data</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-5 py-3.5">Descrizione</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-5 py-3.5 hidden md:table-cell">Categoria</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-5 py-3.5 hidden lg:table-cell">Conto</th>
                        <th className="text-right text-xs font-medium text-gray-400 px-5 py-3.5">Importo</th>
                        <th className="px-5 py-3.5 w-20" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {movements.map((movement) => {
                        const isTransfer = movement.source === 'TRANSFER';
                        const sign = movement.signedAmount > 0 ? '+' : movement.signedAmount < 0 ? '-' : '';
                        const amountClass = isTransfer ? movement.signedAmount > 0 ? 'text-emerald-600' : movement.signedAmount < 0 ? 'text-red-600' : 'text-gray-700' : movement.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600';
                        const description = isTransfer
                            ? `${movement.fromAccountName} -> ${movement.toAccountName}`
                            : movement.description || movement.categoryName || '';

                        return (
                            <tr key={`${movement.source}-${movement.id}`} className="group hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4 hidden md:table-cell">
                                    <span className="text-sm text-gray-500">{movement.date}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{ backgroundColor: `${movement.categoryColor || '#111827'}15`, color: movement.categoryColor || '#111827' }}
                                        >
                                            {isTransfer ? <ArrowRightLeft size={14} /> : movement.categoryName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{description}</p>
                                            {isTransfer && movement.description && <p className="text-xs text-gray-400 truncate">{movement.description}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 hidden md:table-cell">
                                    <span
                                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: `${movement.categoryColor || '#4b5563'}15`, color: movement.categoryColor || '#4b5563' }}
                                    >
                                        {isTransfer ? 'Trasferimento' : movement.categoryName}
                                    </span>
                                </td>
                                <td className="px-5 py-4 hidden lg:table-cell">
                                    <span className="text-xs text-gray-500">{movement.accountName || 'Conto principale'}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <span className={`text-sm font-semibold ${amountClass}`}>
                                        {sign}{fmt(isTransfer ? movement.signedAmount || movement.amount : movement.amount)}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    {!isTransfer && (
                                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(movement as Transaction)}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(movement.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
