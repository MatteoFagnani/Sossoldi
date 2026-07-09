import { useEffect, useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import type { BudgetStatus } from '../types';
import BudgetList from '../components/budgets/BudgetList';
import BudgetForm from '../components/budgets/BudgetForm';
import { useBudgets } from '../hooks/useBudgets';

const SHORT_MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function BudgetsPage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ATTENTION'>('ALL');

    const { budgets, categories, loading, saving, error, setError, loadData, saveBudget, deleteBudget } = useBudgets(month, year);
    const visibleBudgets = statusFilter === 'ATTENTION' ? budgets.filter((budget) => budget.status !== 'OK') : budgets;

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<BudgetStatus | null>(null);
    const [formData, setFormData] = useState({
        categoryId: '', limitAmount: '', percentageOfIncome: '',
        month: String(month), year: String(year), automatic: false, type: 'PERMANENT' as 'PERMANENT' | 'TEMPORARY'
    });

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openNew = () => {
        setEditing(null);
        setFormData({ categoryId: '', limitAmount: '', percentageOfIncome: '', month: String(month), year: String(year), automatic: false, type: 'PERMANENT' });
        setError('');
        setShowForm(true);
    };

    const openEdit = (b: BudgetStatus) => {
        setEditing(b);
        setFormData({
            categoryId: String(b.categoryId), 
            limitAmount: b.limitAmount ? String(b.limitAmount) : '',
            percentageOfIncome: b.percentageOfIncome ? String(b.percentageOfIncome) : '',
            month: String(b.month), 
            year: String(b.year), 
            automatic: b.automatic, 
            type: b.overridden ? 'TEMPORARY' : 'PERMANENT'
        });
        setError('');
        setShowForm(true);
    };

    const handleSave = async (form: { categoryId: string; limitAmount: string; percentageOfIncome: string; automatic: boolean; type?: 'PERMANENT' | 'TEMPORARY'; month?: string; year?: string }) => {
        const success = await saveBudget(editing ? editing.id : null, form);
        if (success) {
            setShowForm(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminare questo budget?')) return;
        await deleteBudget(id);
    };

    return (
        <div className="space-y-5 pb-10">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="appearance-none bg-white border border-gray-300 rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer"
                        >
                            {SHORT_MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="appearance-none bg-white border border-gray-300 rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        {(['ALL', 'ATTENTION'] as const).map((value) => (
                            <button
                                key={value}
                                onClick={() => setStatusFilter(value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === value ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {value === 'ALL' ? 'Tutti' : 'Da controllare'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={openNew}
                        className="app-button-primary"
                    >
                        <Plus size={16} /> Nuovo budget
                    </button>
                </div>
            </div>

            <BudgetList
                budgets={visibleBudgets}
                loading={loading}
                month={month}
                year={year}
                onAdd={openNew}
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            {showForm && (
                <BudgetForm
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

