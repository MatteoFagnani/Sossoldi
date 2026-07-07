import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Category, TransactionType } from '../types';
import CategoryList from '../components/categories/CategoryList';
import CategoryForm from '../components/categories/CategoryForm';
import { useCategories } from '../hooks/useCategories';

const DEFAULT_COLORS = ['#111827', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6', '#ec4899', '#64748b', '#f59e0b'];

export default function CategoriesPage() {
    const { categories, loading, saving, error, setError, loadCategories, saveCategory, deleteCategory } = useCategories();

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', type: 'EXPENSE' as TransactionType, color: DEFAULT_COLORS[0] });

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const openNew = () => {
        setEditing(null);
        setFormData({ name: '', type: 'EXPENSE', color: DEFAULT_COLORS[0] });
        setError('');
        setShowForm(true);
    };

    const openEdit = (cat: Category) => {
        setEditing(cat);
        setFormData({ name: cat.name, type: cat.type, color: cat.color });
        setError('');
        setShowForm(true);
    };

    const handleSave = async (form: { name: string; type: TransactionType; color: string }) => {
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
                <div />
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-xl transition-colors"
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
