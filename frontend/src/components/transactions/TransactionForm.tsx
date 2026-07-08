import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import type { Transaction, Category, Account } from '../../types';

interface TransactionFormProps {
    editing: Transaction | null;
    categories: Category[];
    accounts: Account[];
    initialData: { amount: string; date: string; description: string; categoryId: string; accountId: string };
    saving: boolean;
    error: string;
    onSave: (form: { amount: string; date: string; description: string; categoryId: string; accountId: string }) => void;
    onClose: () => void;
}

const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function TransactionForm({ editing, categories, accounts, initialData, saving, error, onSave, onClose }: TransactionFormProps) {
    const [form, setForm] = useState(initialData);

    useEffect(() => {
        setForm(initialData);
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-auto flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <h3 className="text-base font-semibold text-gray-900">
                        {editing ? 'Modifica transazione' : 'Nuova transazione'}
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
                            <label className={labelClass}>Conto</label>
                            <div className="relative">
                                <select
                                    value={form.accountId}
                                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                                    className={`${inputClass} appearance-none pr-9`}
                                >
                                    <option value="">Conto principale</option>
                                    {accounts.filter(account => !account.archived).map((account) => (
                                        <option key={account.id} value={account.id}>{account.name}</option>
                                    ))}
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
                                    <option value="">Seleziona una categoria</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.type === 'INCOME' ? 'Entrata' : 'Uscita'})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Importo</label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required min="0.01" step="0.01"
                                    placeholder="0.00"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Data</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    required
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>
                                Descrizione <span className="text-gray-400 font-normal">(opzionale)</span>
                            </label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Es. Spesa supermercato"
                                className={inputClass}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
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
                                {saving ? <Loader2 size={15} className="animate-spin" /> : (editing ? 'Salva modifiche' : 'Aggiungi')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
