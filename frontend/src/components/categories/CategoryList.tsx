import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category } from '../../types';

interface CategoryListProps {
    categories: Category[];
    loading: boolean;
    onAdd: (parent?: Category) => void;
    onEdit: (category: Category) => void;
    onDelete: (id: number) => void;
}

export default function CategoryList({ categories, loading, onAdd, onEdit, onDelete }: CategoryListProps) {
    const sections = [
        { label: 'Entrate', items: categories.filter((c) => c.type === 'INCOME'), accent: '#10b981' },
        { label: 'Uscite', items: categories.filter((c) => c.type === 'EXPENSE'), accent: '#111827' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    const actions = (cat: Category) => (
        <div className="flex gap-2">
            <button
                onClick={() => onEdit(cat)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Modifica"
            >
                <Pencil size={14} />
            </button>
            <button
                onClick={() => onDelete(cat.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Elimina"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );

    return (
        <div className="space-y-10">
            {sections.map(({ label, items, accent }) => {
                const macros = items.filter((cat) => !cat.parentId);
                const orphanSubcategories = items.filter((cat) => cat.parentId && !items.some((parent) => parent.id === cat.parentId));

                return (
                    <div key={label}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                            <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
                        </div>

                        {items.length === 0 ? (
                            <div className="app-empty">
                                <p className="text-sm text-gray-400 mb-3">Nessuna categoria</p>
                                <button onClick={() => onAdd()} className="text-sm text-gray-900 hover:text-black font-medium transition-colors">
                                    Aggiungine una
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {[...macros, ...orphanSubcategories].map((macro) => {
                                    const children = items.filter((cat) => cat.parentId === macro.id);

                                    return (
                                        <div key={macro.id} className="app-card p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{macro.name}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-400">Macro categoria</p>
                                                </div>
                                                {actions(macro)}
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <button onClick={() => onAdd(macro)} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors">
                                                    <Plus size={13} /> Sotto categoria
                                                </button>
                                                {children.length === 0 ? (
                                                    <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 text-center">
                                                        Nessuna sotto categoria
                                                    </div>
                                                ) : children.map((cat) => (
                                                    <div key={cat.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                                            <span className="text-sm text-gray-700 truncate">{cat.name}</span>
                                                        </div>
                                                        {actions(cat)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

