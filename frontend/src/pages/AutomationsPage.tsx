import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Zap, ChevronDown, X, Loader2, Calendar, Tag } from 'lucide-react';
import { automationRuleService, categoryService } from '../services/services';
import type { AutomationRule, Category, TransactionType } from '../types';

const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function AutomationsPage() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<AutomationRule | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '', type: 'EXPENSE' as TransactionType, categoryId: '',
        executionDay: '1', monthlyAmount: '', annualAmount: '',
    });

    const load = () => {
        setLoading(true);
        Promise.all([automationRuleService.getAll(), categoryService.getAll()])
            .then(([r, c]) => { setRules(r); setCategories(c); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openNew = () => {
        setEditing(null);
        setForm({ name: '', type: 'EXPENSE', categoryId: '', executionDay: '1', monthlyAmount: '', annualAmount: '' });
        setError('');
        setShowForm(true);
    };

    const openEdit = (r: AutomationRule) => {
        setEditing(r);
        setForm({
            name: r.name, type: r.type, categoryId: String(r.categoryId),
            executionDay: String(r.executionDay),
            monthlyAmount: r.monthlyAmount != null ? String(r.monthlyAmount) : '',
            annualAmount: r.annualAmount != null ? String(r.annualAmount) : '',
        });
        setError('');
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                categoryId: parseInt(form.categoryId),
                executionDay: parseInt(form.executionDay),
                monthlyAmount: form.monthlyAmount ? parseFloat(form.monthlyAmount) : null,
                annualAmount: form.annualAmount ? parseFloat(form.annualAmount) : null,
            };
            if (editing) {
                await automationRuleService.update(editing.id, payload);
            } else {
                await automationRuleService.create(payload);
            }
            setShowForm(false);
            load();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
            setError(data ? Object.values(data).join('. ') : 'Errore durante il salvataggio della regola');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminare questa automazione?')) return;
        await automationRuleService.remove(id);
        load();
    };

    const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
    const filteredCats = categories.filter((c) => c.type === form.type);

    return (
        <div className="space-y-5 pb-10">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div />
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-xl transition-colors"
                >
                    <Plus size={16} /> Nuova automazione
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
            ) : rules.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Zap size={20} className="text-gray-700" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Nessuna automazione attiva</p>
                    <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
                        Le automazioni registrano transazioni ricorrenti in automatico ogni mese.
                    </p>
                    <button
                        onClick={openNew}
                        className="text-sm text-gray-900 hover:text-black font-medium transition-colors"
                    >
                        Crea la prima automazione
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {rules.map((rule) => (
                        <div key={rule.id} className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors relative">

                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEdit(rule)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Pencil size={13} />
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            <div className="flex items-start gap-3 mb-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-900'}`}>
                                    <Zap size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate pr-10">{rule.name}</p>
                                    <span className={`text-xs font-medium ${rule.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {rule.type === 'INCOME' ? 'Entrata' : 'Uscita'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Tag size={12} className="text-gray-400" />
                                    <span>{rule.categoryName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar size={12} className="text-gray-400" />
                                    <span>Ogni mese il giorno {rule.executionDay}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Importo (Mensile)</span>
                                <span className="text-base font-bold text-gray-800">
                                    {fmt(rule.monthlyAmount ?? (rule.annualAmount ? rule.annualAmount / 12 : 0))}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h3 className="text-base font-semibold text-gray-900">
                                {editing ? 'Modifica automazione' : 'Nuova automazione'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Nome</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        placeholder="Es. Abbonamento Netflix"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Tipo</label>
                                        <div className="relative">
                                            <select
                                                value={form.type}
                                                onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType, categoryId: '' })}
                                                className={`${inputClass} appearance-none pr-9`}
                                            >
                                                <option value="EXPENSE">Uscita</option>
                                                <option value="INCOME">Entrata</option>
                                            </select>
                                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Categoria</label>
                                        <div className="relative">
                                            <select
                                                value={form.categoryId}
                                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                                required
                                                className={`${inputClass} appearance-none pr-9`}
                                            >
                                                <option value="">Seleziona</option>
                                                {filteredCats.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Giorno di esecuzione <span className="text-gray-400 font-normal">(1–28)</span></label>
                                    <input
                                        type="number"
                                        value={form.executionDay}
                                        onChange={(e) => setForm({ ...form, executionDay: e.target.value })}
                                        required min="1" max="28"
                                        placeholder="Es. 15"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Importo</label>
                                    <p className="text-xs text-gray-400 mb-2">Compila uno solo tra mensile o annuale (l'altro verrà calcolato automaticamente se lasci vuoto)</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1.5">Importo Mensile (€)</p>
                                            <input
                                                type="number"
                                                value={form.monthlyAmount}
                                                onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value, annualAmount: '' })}
                                                min="0" step="0.01"
                                                placeholder="0.00"
                                                className={inputClass}
                                            />
                                            {form.annualAmount && !form.monthlyAmount && (
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    Circa {fmt(parseFloat(form.annualAmount) / 12)} / mese
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1.5">Importo Annuale (€)</p>
                                            <input
                                                type="number"
                                                value={form.annualAmount}
                                                onChange={(e) => setForm({ ...form, annualAmount: e.target.value, monthlyAmount: '' })}
                                                min="0" step="0.01"
                                                placeholder="0.00"
                                                className={inputClass}
                                            />
                                            {form.monthlyAmount && !form.annualAmount && (
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    Circa {fmt(parseFloat(form.monthlyAmount) * 12)} / anno
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        {saving ? <Loader2 size={15} className="animate-spin" /> : (editing ? 'Salva modifiche' : 'Crea automazione')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
