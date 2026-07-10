import React, { useState } from 'react';
import { ChevronDown, X, Loader2 } from 'lucide-react';
import type { BudgetStatus, Category } from '../../types';

interface BudgetFormProps {
    editing: BudgetStatus | null;
    categories: Category[];
    initialData: { categoryId: string; limitAmount: string; percentageOfIncome: string; automatic: boolean; type?: 'PERMANENT' | 'TEMPORARY'; month?: string; year?: string };
    saving: boolean;
    error: string;
    onSave: (form: { categoryId: string; limitAmount: string; percentageOfIncome: string; automatic: boolean; type?: 'PERMANENT' | 'TEMPORARY'; month?: string; year?: string }) => void;
    onClose: () => void;
}

const SHORT_MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function BudgetForm({ editing, categories, initialData, saving, error, onSave, onClose }: BudgetFormProps) {
    const [form, setForm] = useState(initialData);
    const [mode, setMode] = useState<'AMOUNT' | 'PERCENTAGE'>(
        initialData.percentageOfIncome ? 'PERCENTAGE' : 'AMOUNT'
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-auto flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                    <h3 className="text-base font-semibold text-gray-900">
                        {editing ? 'Modifica budget' : 'Nuovo budget'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClass}>Categoria di spesa</label>
                            <div className="relative">
                                <select
                                    value={form.categoryId}
                                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                    required
                                    disabled={!!editing}
                                    className={`${inputClass} appearance-none pr-9 disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    <option value="">Seleziona una categoria</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('AMOUNT');
                                        setForm({ ...form, limitAmount: form.limitAmount || '0', percentageOfIncome: '' });
                                    }}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors border ${mode === 'AMOUNT' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Importo Fisso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('PERCENTAGE');
                                        setForm({ ...form, limitAmount: '', percentageOfIncome: form.percentageOfIncome || '10' });
                                    }}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors border ${mode === 'PERCENTAGE' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    % delle Entrate
                                </button>
                            </div>

                            {mode === 'PERCENTAGE' ? (
                                <div>
                                    <label className={labelClass}>Percentuale delle entrate (%)</label>
                                    <input
                                        type="number"
                                        value={form.percentageOfIncome}
                                        onChange={(e) => setForm({ ...form, percentageOfIncome: e.target.value })}
                                        required min="1" max="100" step="1"
                                        placeholder="10"
                                        className={inputClass}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className={labelClass}>Limite di spesa (€)</label>
                                    <input
                                        type="number"
                                        value={form.limitAmount}
                                        onChange={(e) => setForm({ ...form, limitAmount: e.target.value })}
                                        required min="1" step="0.01"
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                </div>
                            )}
                        </div>

                        {editing && (
                            <div className="flex items-center gap-4 mb-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, type: 'PERMANENT' })}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors border ${form.type === 'PERMANENT' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Modifica Permanente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, type: 'TEMPORARY' })}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors border ${form.type === 'TEMPORARY' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Modifica Temporanea
                                </button>
                            </div>
                        )}


                        {editing && form.type === 'TEMPORARY' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Mese</label>
                                    <div className="relative">
                                        <select
                                            value={form.month}
                                            onChange={(e) => setForm({ ...form, month: e.target.value })}
                                            className={`${inputClass} appearance-none pr-9`}
                                        >
                                            {SHORT_MONTHS.map((m, i) => (
                                                <option key={m} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Anno</label>
                                    <div className="relative">
                                        <select
                                            value={form.year}
                                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                                            className={`${inputClass} appearance-none pr-9`}
                                        >
                                            {[2024, 2025, 2026, 2027].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : (editing ? 'Salva modifiche' : 'Crea budget')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

