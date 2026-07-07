import { Pencil, Trash2 } from 'lucide-react';
import type { Category } from '../../types';

interface CategoryListProps {
    categories: Category[];
    loading: boolean;
    onAdd: () => void;
    onEdit: (category: Category) => void;
    onDelete: (id: number) => void;
}

export default function CategoryList({ categories, loading, onAdd, onEdit, onDelete }: CategoryListProps) {
    const income = categories.filter((c) => c.type === 'INCOME');
    const expense = categories.filter((c) => c.type === 'EXPENSE');

    const sections = [
        { label: 'Entrate', items: income, type: 'INCOME' as const, accent: '#10b981' },
        { label: 'Uscite', items: expense, type: 'EXPENSE' as const, accent: '#111827' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {sections.map(({ label, items, type, accent }) => (
                <div key={label}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                        <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
                    </div>

                    {items.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-12 text-center">
                            <p className="text-sm text-gray-400 mb-3">Nessuna categoria</p>
                            <button
                                onClick={onAdd}
                                className="text-sm text-gray-900 hover:text-black font-medium transition-colors"
                            >
                                Aggiungine una
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {items.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
                                            style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                                        >
                                            {cat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span
                                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: `${type === 'INCOME' ? '#10b981' : '#111827'}10`, color: type === 'INCOME' ? '#10b981' : '#111827' }}
                                        >
                                            {type === 'INCOME' ? 'Entrata' : 'Uscita'}
                                        </span>
                                    </div>

                                    <p className="text-sm font-semibold text-gray-800 mb-1">{cat.name}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: cat.color }} />
                                        <span className="text-xs text-gray-400 font-mono">{cat.color}</span>
                                    </div>

                                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(cat)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Pencil size={12} /> Modifica
                                        </button>
                                        <button
                                            onClick={() => onDelete(cat.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={12} /> Elimina
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

