import { useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { Category, TransactionType } from '../types';
import CategoryList from '../components/categories/CategoryList';
import CategoryForm from '../components/categories/CategoryForm';
import { useCategories } from '../hooks/useCategories';

const DEFAULT_COLORS = ['#111827', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6', '#ec4899', '#64748b', '#f59e0b'];

export default function CategoriesPage() {
    const { categories, loading, saving, error, setError, loadCategories, saveCategory, deleteCategory, seedDefaults } = useCategories();

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', type: 'EXPENSE' as TransactionType, color: DEFAULT_COLORS[0], parentId: null as number | null });

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const openNew = (parent?: Category) => {
        setEditing(null);
        setFormData({ name: '', type: parent?.type ?? 'EXPENSE', color: parent?.color ?? DEFAULT_COLORS[0], parentId: parent?.id ?? null });
        setError('');
        setShowForm(true);
    };

    const openEdit = (cat: Category) => {
        setEditing(cat);
        setFormData({ name: cat.name, type: cat.type, color: cat.color, parentId: cat.parentId ?? null });
        setError('');
        setShowForm(true);
    };

    const handleSave = async (form: { name: string; type: TransactionType; color: string; parentId?: number | null }) => {
        const success = await saveCategory(editing ? editing.id : null, form);
        if (success) {
            setShowForm(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminare questa categoria? Le transazioni collegate potrebbero essere influenzate.')) return;
        await deleteCategory(id);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={async () => {
                        if (confirm('Vuoi sincronizzare/importare le categorie granulari predefinite per il tuo account? Le categorie esistenti non verranno eliminate.')) {
                            await seedDefaults();
                        }
                    }}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                    title="Importa o aggiorna le categorie consigliate granulari"
                >
                    <Sparkles size={14} className="text-amber-500" />
                    Sincronizza Categorie Predefinite
                </button>
                <button
                    onClick={() => openNew()}
                    className="app-button-primary"
                >
                    <Plus size={16} /> Nuova categoria
                </button>
            </div>

            <CategoryList
                categories={categories}
                loading={loading}
                onAdd={openNew}
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            {/* Modal */}
            {showForm && (
                <CategoryForm
                    editing={editing}
                    categories={categories}
                    initialData={formData}
                    saving={saving}
                    error={error}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
}

