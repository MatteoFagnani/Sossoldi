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
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed">
                <colgroup>
                    <col className="w-24" />
                    <col />
                    <col className="w-32" />
                    <col className="w-32" />
                    <col className="w-28" />
                    <col className="w-20" />
                </colgroup>
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-400">Data</th>
                        <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-400">Descrizione</th>
                        <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-400">Categoria</th>
                        <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-400">Conto</th>
                        <th className="px-3 py-3.5 text-right text-xs font-medium text-gray-400">Importo</th>
                        <th className="px-2 py-3.5" />
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
                                <td className="px-3 py-4">
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{movement.date}</span>
                                </td>
                                <td className="px-3 py-4 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{ backgroundColor: `${movement.categoryColor || '#111827'}15`, color: movement.categoryColor || '#111827' }}
                                        >
                                            {isTransfer ? <ArrowRightLeft size={14} /> : movement.categoryName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 overflow-hidden">
                                            <p className="text-sm font-medium text-gray-800 truncate" title={description}>{description}</p>
                                            {isTransfer && movement.description && <p className="text-xs text-gray-400 truncate">{movement.description}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-4 min-w-0">
                                    <span
                                        className="inline-block max-w-full truncate align-middle text-xs font-medium px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: `${movement.categoryColor || '#4b5563'}15`, color: movement.categoryColor || '#4b5563' }}
                                        title={isTransfer ? 'Trasferimento' : movement.categoryName ?? undefined}
                                    >
                                        {isTransfer ? 'Trasferimento' : movement.categoryName}
                                    </span>
                                </td>
                                <td className="px-3 py-4 min-w-0">
                                    <span className="block truncate text-xs text-gray-500" title={movement.accountName || 'Conto principale'}>{movement.accountName || 'Conto principale'}</span>
                                </td>
                                <td className="px-3 py-4 text-right">
                                    <span className={`text-sm font-semibold whitespace-nowrap ${amountClass}`}>
                                        {sign}{fmt(isTransfer ? movement.signedAmount || movement.amount : movement.amount)}
                                    </span>
                                </td>
                                <td className="px-2 py-4">
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
