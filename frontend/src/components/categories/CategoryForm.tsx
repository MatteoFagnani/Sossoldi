import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Category, TransactionType } from '../../types';

interface CategoryFormProps {
    editing: Category | null;
    initialData: { name: string; type: TransactionType; color: string };
    saving: boolean;
    error: string;
    onSave: (form: { name: string; type: TransactionType; color: string }) => void;
    onClose: () => void;
}

const DEFAULT_COLORS = ['#111827', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6', '#ec4899', '#64748b', '#f59e0b'];
const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function CategoryForm({ editing, initialData, saving, error, onSave, onClose }: CategoryFormProps) {
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
                        {editing ? 'Modifica categoria' : 'Nuova categoria'}
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

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelClass}>Nome</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="Es. Spesa alimentare"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Tipo</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['INCOME', 'EXPENSE'] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setForm({ ...form, type: t })}
                                        className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.type === t
                                            ? 'bg-gray-900 border-gray-900 text-white'
                                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                            }`}
                                    >
                                        {t === 'INCOME' ? 'Entrata' : 'Uscita'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Colore</label>
                            <div className="flex flex-wrap gap-2.5">
                                {DEFAULT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setForm({ ...form, color })}
                                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${form.color === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

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
                                {saving ? <Loader2 size={15} className="animate-spin" /> : (editing ? 'Salva' : 'Crea categoria')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

