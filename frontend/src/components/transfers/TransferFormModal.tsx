import { useState, type FormEvent } from 'react';
import { ArrowRightLeft, Loader2, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { accountTransferService } from '../../services/services';
import { extractApiError } from '../../utils/error';
import type { Account } from '../../types';

export interface TransferFormInitialData {
    fromAccountId?: string;
    toAccountId?: string;
    amount?: string;
    date?: string;
    description?: string;
}

interface TransferFormModalProps {
    accounts: Account[];
    initialData?: TransferFormInitialData;
    lockedToAccount?: {
        id: number;
        name: string;
        balance: number;
    };
    title?: string;
    subtitle?: string;
    submitLabel?: string;
    placeholderDescription?: string;
    onClose: () => void;
    onSuccess: (amount: number) => Promise<void> | void;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';

export default function TransferFormModal({
    accounts,
    initialData,
    lockedToAccount,
    title = 'Muovi denaro (Giroconto)',
    subtitle,
    submitLabel = 'Conferma trasferimento',
    placeholderDescription = 'Es. Giroconto tra conti',
    onClose,
    onSuccess,
}: TransferFormModalProps) {
    const activeAccounts = accounts.filter((a) => !a.archived);
    const defaultToId = lockedToAccount
        ? String(lockedToAccount.id)
        : initialData?.toAccountId ?? (activeAccounts[1] ? String(activeAccounts[1].id) : '');
    const defaultFromId =
        initialData?.fromAccountId ??
        String(activeAccounts.find((a) => String(a.id) !== defaultToId)?.id ?? activeAccounts[0]?.id ?? '');

    const [form, setForm] = useState({
        fromAccountId: defaultFromId,
        toAccountId: defaultToId,
        amount: initialData?.amount ?? '',
        date: initialData?.date ?? new Date().toISOString().slice(0, 10),
        description: initialData?.description ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.fromAccountId || !form.toAccountId) {
            setError('Seleziona entrambi i conti.');
            return;
        }
        if (form.fromAccountId === form.toAccountId) {
            setError('Il conto di origine e di destinazione devono essere diversi.');
            return;
        }
        const amountNum = Number.parseFloat(form.amount);
        if (!amountNum || amountNum <= 0) {
            setError('Inserisci un importo valido.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await accountTransferService.create({
                fromAccountId: Number(form.fromAccountId),
                toAccountId: Number(form.toAccountId),
                amount: amountNum,
                date: form.date,
                description: form.description.trim() || undefined,
            });
            await onSuccess(amountNum);
        } catch (err: unknown) {
            setError(extractApiError(err, 'Errore durante la registrazione del trasferimento.'));
        } finally {
            setSaving(false);
        }
    };

    const sourceAccounts = lockedToAccount
        ? activeAccounts.filter((a) => a.id !== lockedToAccount.id)
        : activeAccounts;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs px-4 py-8 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        {subtitle && (
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <ArrowRightLeft size={16} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                            {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Chiudi"
                    >
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 px-3.5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Dal conto (origine)</label>
                        <select
                            value={form.fromAccountId}
                            onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                            required
                            className={inputClass}
                        >
                            <option value="">Seleziona conto</option>
                            {sourceAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({formatCurrency(account.currentBalance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            {lockedToAccount ? "Conto di destinazione (collegato all'investimento)" : 'Al conto (destinazione)'}
                        </label>
                        {lockedToAccount ? (
                            <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-700 font-semibold flex items-center justify-between">
                                <span>{lockedToAccount.name}</span>
                                <span className="text-gray-500 font-normal">
                                    Saldo attuale: {formatCurrency(lockedToAccount.balance)}
                                </span>
                            </div>
                        ) : (
                            <select
                                value={form.toAccountId}
                                onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                                required
                                className={inputClass}
                            >
                                <option value="">Seleziona conto</option>
                                {activeAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} ({formatCurrency(account.currentBalance)})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Importo (€)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                required
                                placeholder="0.00"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Data</label>
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
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Causale / Nota (opzionale)</label>
                        <input
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className={inputClass}
                            placeholder={placeholderDescription}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saving || activeAccounts.length < 2}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

