import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Plus, Wallet } from 'lucide-react';
import { accountService } from '../services/services';
import type { Account, AccountType } from '../types';

const accountTypes: { value: AccountType; label: string }[] = [
    { value: 'CHECKING', label: 'Conto corrente' },
    { value: 'SAVINGS', label: 'Risparmio' },
    { value: 'CASH', label: 'Contanti' },
    { value: 'CARD', label: 'Carta' },
    { value: 'INVESTMENT', label: 'Investimenti' },
    { value: 'OTHER', label: 'Altro' },
];

const emptyForm = { name: '', type: 'CHECKING' as AccountType, initialBalance: '0', archived: false };
const inputClass = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900';

export default function WealthPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [editing, setEditing] = useState<Account | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const total = useMemo(() => accounts.filter(account => !account.archived).reduce((sum, account) => sum + account.currentBalance, 0), [accounts]);
    const fmt = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

    const loadAccounts = async () => {
        setLoading(true);
        setError('');
        try {
            setAccounts(await accountService.getAll());
        } catch {
            setError('Errore durante il caricamento dei conti.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const openEdit = (account: Account) => {
        setEditing(account);
        setForm({ name: account.name, type: account.type, initialBalance: String(account.initialBalance), archived: account.archived });
    };

    const resetForm = () => {
        setEditing(null);
        setForm(emptyForm);
    };

    const save = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = { ...form, initialBalance: Number.parseFloat(form.initialBalance) || 0 };
            if (editing) await accountService.update(editing.id, payload);
            else await accountService.create(payload);
            resetForm();
            await loadAccounts();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
            setError(data ? Object.values(data).join('. ') : 'Errore durante il salvataggio del conto.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
                <div className="space-y-5">
                    <div className="bg-gray-900 text-white rounded-2xl p-6">
                        <p className="text-sm text-gray-300">Patrimonio liquido</p>
                        <p className="text-3xl font-semibold mt-2">{fmt(total)}</p>
                    </div>

                    {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-900" /></div>
                        ) : accounts.length === 0 ? (
                            <div className="py-16 text-center text-sm text-gray-400">Nessun conto presente</div>
                        ) : accounts.map(account => (
                            <button
                                key={account.id}
                                onClick={() => openEdit(account)}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 text-left transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                                        <Wallet size={17} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                                        <p className="text-xs text-gray-500">{accountTypes.find(type => type.value === account.type)?.label}{account.archived ? ' - Archiviato' : ''}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{fmt(account.currentBalance)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={save} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 sticky top-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">{editing ? 'Modifica conto' : 'Nuovo conto'}</h2>
                        {editing && <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-900">Annulla</button>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Es. Intesa" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as AccountType })} className={inputClass}>
                            {accountTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Saldo iniziale</label>
                        <input type="number" step="0.01" value={form.initialBalance} onChange={e => setForm({ ...form, initialBalance: e.target.value })} className={inputClass} />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={form.archived} onChange={e => setForm({ ...form, archived: e.target.checked })} />
                        Archiviato
                    </label>

                    <button disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                        {editing ? 'Salva conto' : 'Aggiungi conto'}
                    </button>
                </form>
            </div>
        </div>
    );
}
