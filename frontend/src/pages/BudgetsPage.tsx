import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronDown, Scale, RefreshCw } from 'lucide-react';
import type { BudgetStatus } from '../types';
import BudgetList from '../components/budgets/BudgetList';
import BudgetForm from '../components/budgets/BudgetForm';
import { useBudgets } from '../hooks/useBudgets';
import { useAuthStore } from '../store/authStore';
import { budgetService } from '../services/services';
import { SHORT_MONTHS, getSelectableYears } from '../constants/dateConstants';

const YEARS = getSelectableYears(2024, 1);

const PROFILE_LABELS: Record<string, { label: string; badge: string }> = {
    STUDENT: { label: 'Studente / Fuorisede', badge: 'Regola 70/15/15' },
    BALANCED_50_30_20: { label: 'Lavoratore Standard', badge: 'Regola 50/30/20' },
    FREELANCER: { label: 'Freelance & P. IVA', badge: 'Regola 60/20/20' },
    FIRE_SEEKER: { label: 'FIRE Seeker', badge: 'Tasso Risparmio > 50%' },
    FAMILY: { label: 'Famiglia & Genitori', badge: 'Regola 65/15/20' },
    DEBT_REPAYMENT: { label: 'Ripartenza & Debiti', badge: 'Regola 70/10/20' },
};

export default function BudgetsPage() {
    const { user } = useAuthStore();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ATTENTION'>('ALL');
    const [syncingProfile, setSyncingProfile] = useState(false);

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

    const handleSyncWithProfile = async () => {
        setSyncingProfile(true);
        try {
            await budgetService.syncWithProfile(month, year);
            await loadData();
        } catch (err) {
            console.error('Errore sincronizzazione budget con profilo:', err);
        } finally {
            setSyncingProfile(false);
        }
    };

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

    const profileMeta = PROFILE_LABELS[user?.financialProfile || 'BALANCED_50_30_20'] || PROFILE_LABELS.BALANCED_50_30_20;

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
                            {YEARS.map(y => (
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

            {/* Financial Profile Integration Banner */}
            <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Scale size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">
                                Profilo attivo: {profileMeta.label}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {profileMeta.badge}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            I budget automatici e le percentuali sulle entrate seguono la filosofia del tuo profilo.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleSyncWithProfile}
                        disabled={syncingProfile}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                        title="Ricalcola e reimposta le percentuali di tutti i budget automatici in base al profilo selezionato"
                    >
                        <RefreshCw size={13} className={syncingProfile ? 'animate-spin text-indigo-600' : ''} />
                        Riallinea al Profilo
                    </button>
                    <Link
                        to="/profile"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1.5 transition-colors"
                    >
                        Cambia profilo
                    </Link>
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
