import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRightLeft, Loader2, Plus, Trash2, Wallet, X } from 'lucide-react';
import { accountService, accountTransferService, investmentService } from '../services/services';
import { adjustedInitialBalance } from '../services/accountBalance';
import type { Account, AccountTransfer, AccountType, Investment } from '../types';

const accountTypes: { value: AccountType; label: string }[] = [
    { value: 'CHECKING', label: 'Conto corrente' },
    { value: 'SAVINGS', label: 'Risparmio' },
    { value: 'CASH', label: 'Contanti' },
    { value: 'CARD', label: 'Carta' },
    { value: 'INVESTMENT', label: 'Investimenti' },
    { value: 'OTHER', label: 'Altro' },
];

const investmentTypes: Record<string, string> = {
    ETF: 'ETF',
    STOCK: 'Azioni',
    FUND: 'Fondi',
    CRYPTO: 'Crypto',
    PENSION: 'Pensione',
    BOND: 'Bond',
    OTHER: 'Altro',
};

const emptyAccountForm = { name: '', type: 'CHECKING' as AccountType, initialBalance: '0', archived: false };
const emptyTransferForm = { fromAccountId: '', toAccountId: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' };
const inputClass = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900';

type Modal = 'account' | 'transfer' | null;

export default function WealthPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transfers, setTransfers] = useState<AccountTransfer[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [editing, setEditing] = useState<Account | null>(null);
    const [accountForm, setAccountForm] = useState(emptyAccountForm);
    const [transferForm, setTransferForm] = useState(emptyTransferForm);
    const [modal, setModal] = useState<Modal>(null);
    const [loading, setLoading] = useState(true);
    const [savingAccount, setSavingAccount] = useState(false);
    const [savingTransfer, setSavingTransfer] = useState(false);
    const [error, setError] = useState('');

    const activeAccounts = useMemo(() => accounts.filter(account => !account.archived), [accounts]);
    const accountTotal = useMemo(() => activeAccounts.reduce((sum, account) => sum + account.currentBalance, 0), [activeAccounts]);
    const investmentTotal = useMemo(() => investments.reduce((sum, item) => sum + item.currentValue, 0), [investments]);
    const total = accountTotal + investmentTotal;
    const liquidTotal = useMemo(
        () => activeAccounts.filter(account => account.type !== 'INVESTMENT').reduce((sum, account) => sum + account.currentBalance, 0),
        [activeAccounts]
    );
    const cashTotal = useMemo(
        () => activeAccounts.filter(account => account.type === 'CASH').reduce((sum, account) => sum + account.currentBalance, 0),
        [activeAccounts]
    );
    const fmt = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [accountData, transferData, investmentData] = await Promise.all([accountService.getAll(), accountTransferService.getAll(), investmentService.getAll()]);
            setAccounts(accountData);
            setTransfers(transferData);
            setInvestments(investmentData);
        } catch {
            setError('Errore durante il caricamento del patrimonio.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!transferForm.fromAccountId && activeAccounts[0]) {
            setTransferForm(form => ({ ...form, fromAccountId: String(activeAccounts[0].id), toAccountId: String(activeAccounts[1]?.id ?? '') }));
        }
    }, [activeAccounts, transferForm.fromAccountId]);

    const openNewAccount = () => {
        setEditing(null);
        setAccountForm(emptyAccountForm);
        setModal('account');
    };

    const openEdit = (account: Account) => {
        setEditing(account);
        setAccountForm({ name: account.name, type: account.type, initialBalance: String(Math.round(account.currentBalance * 100) / 100), archived: account.archived });
        setModal('account');
    };

    const resetAccountForm = () => {
        setEditing(null);
        setAccountForm(emptyAccountForm);
        setModal(null);
    };

    const openTransfer = () => setModal('transfer');

    const moveAccount = (account: Account) => {
        const destination = activeAccounts.find(item => item.id !== account.id);
        setTransferForm(form => ({
            ...form,
            fromAccountId: String(account.id),
            toAccountId: destination ? String(destination.id) : '',
            amount: '',
            date: new Date().toISOString().slice(0, 10),
            description: '',
        }));
        setModal('transfer');
    };

    const saveAccount = async (event: FormEvent) => {
        event.preventDefault();
        setSavingAccount(true);
        setError('');
        try {
            const enteredBalance = Number.parseFloat(accountForm.initialBalance) || 0;
            const payload = { ...accountForm, initialBalance: editing ? adjustedInitialBalance(editing.initialBalance, editing.currentBalance, enteredBalance) : enteredBalance };
            if (editing) await accountService.update(editing.id, payload);
            else await accountService.create(payload);
            resetAccountForm();
            await loadData();
        } catch (err: unknown) {
            showError(err, 'Errore durante il salvataggio del conto.');
        } finally {
            setSavingAccount(false);
        }
    };

    const saveTransfer = async (event: FormEvent) => {
        event.preventDefault();
        setSavingTransfer(true);
        setError('');
        try {
            await accountTransferService.create({
                fromAccountId: Number(transferForm.fromAccountId),
                toAccountId: Number(transferForm.toAccountId),
                amount: Number.parseFloat(transferForm.amount),
                date: transferForm.date,
                description: transferForm.description,
            });
            setTransferForm(form => ({ ...emptyTransferForm, fromAccountId: form.fromAccountId, toAccountId: form.toAccountId }));
            setModal(null);
            await loadData();
        } catch (err: unknown) {
            showError(err, 'Errore durante il trasferimento.');
        } finally {
            setSavingTransfer(false);
        }
    };

    const deleteAccount = async (account: Account) => {
        if (!window.confirm(`Eliminare il conto ${account.name}?`)) return;
        setError('');
        try {
            await accountService.remove(account.id);
            if (editing?.id === account.id) resetAccountForm();
            await loadData();
        } catch (err: unknown) {
            showError(err, 'Errore durante eliminazione del conto.');
        }
    };

    const deleteTransfer = async (transfer: AccountTransfer) => {
        if (!window.confirm('Eliminare questo trasferimento?')) return;
        setError('');
        try {
            await accountTransferService.remove(transfer.id);
            await loadData();
        } catch (err: unknown) {
            showError(err, 'Errore durante eliminazione del trasferimento.');
        }
    };

    const showError = (err: unknown, fallback: string) => {
        const data = (err as { response?: { data?: Record<string, string> | string } })?.response?.data;
        if (typeof data === 'string') setError(data);
        else if (data) setError(Object.values(data).join('. '));
        else setError(fallback);
    };

    return (
        <div className="space-y-5 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div />
                <div className="flex items-center gap-2">
                    <button type="button" onClick={openTransfer} disabled={activeAccounts.length < 2} className="app-button-secondary disabled:opacity-60">
                        <ArrowRightLeft size={16} />
                        Muovi denaro
                    </button>
                    <button type="button" onClick={openNewAccount} className="app-button-primary">
                        <Plus size={16} />
                        Nuovo conto
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-gray-900 text-white rounded-2xl p-5">
                        <p className="text-sm text-gray-300">Patrimonio</p>
                        <p className="text-2xl font-semibold mt-2">{fmt(total)}</p>
                        <p className="text-xs text-gray-400 mt-1">Liquidita + investimenti</p>
                    </div>
                    <div className="app-card p-5">
                        <p className="text-sm text-gray-500">Liquido</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{fmt(liquidTotal)}</p>
                        <p className="text-xs text-gray-400 mt-1">Conti e contanti</p>
                    </div>
                    <div className="app-card p-5">
                        <p className="text-sm text-gray-500">Investito</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{fmt(investmentTotal)}</p>
                        <p className="text-xs text-gray-400 mt-1">Controvalore attuale</p>
                    </div>
                    <div className="app-card p-5">
                        <p className="text-sm text-gray-500">Contanti</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{fmt(cashTotal)}</p>
                        <p className="text-xs text-gray-400 mt-1">Solo conti cash</p>
                    </div>
                </div>

                {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-900" /></div>
                    ) : accounts.length === 0 && investments.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400">Nessun conto o investimento presente</div>
                    ) : (
                        <>
                            {accounts.map(account => (
                                <div key={`account-${account.id}`} className="w-full flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 text-left transition-colors">
                                    <button type="button" onClick={() => openEdit(account)} className="flex items-center gap-3 min-w-0 text-left flex-1">
                                        <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0"><Wallet size={17} /></span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                                            <p className="text-xs text-gray-500">{accountTypes.find(type => type.value === account.type)?.label}{account.archived ? ' - Archiviato' : ''}</p>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-sm font-semibold text-gray-900">{fmt(account.currentBalance)}</span>
                                        {!account.archived && (
                                            <button type="button" onClick={() => moveAccount(account)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">
                                                <ArrowRightLeft size={14} />
                                                Muovi
                                            </button>
                                        )}
                                        <button type="button" onClick={() => deleteAccount(account)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Elimina conto">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {investments.map(item => (
                                <div key={`investment-${item.id}`} className="w-full flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 text-left transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0"><Wallet size={17} /></span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.pacActive ? 'PAC' : 'Investimento'} - {investmentTypes[item.type] || item.type}{item.ticker ? ` - ${item.ticker}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-gray-900">{fmt(item.currentValue)}</p>
                                        <p className={`text-xs ${item.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(item.gainLoss)} ({item.gainLossPercent.toFixed(1)}%)</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <ArrowRightLeft size={17} className="text-gray-600" />
                        <h2 className="text-base font-semibold text-gray-900">Trasferimenti</h2>
                    </div>
                    {transfers.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-400">Nessun trasferimento presente</div>
                    ) : transfers.map(transfer => (
                        <div key={transfer.id} className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{transfer.fromAccountName} a {transfer.toAccountName}</p>
                                <p className="text-xs text-gray-500">{new Date(transfer.date).toLocaleDateString('it-IT')}{transfer.description ? ` - ${transfer.description}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-semibold text-gray-900">{fmt(transfer.amount)}</span>
                                <button onClick={() => deleteTransfer(transfer)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Elimina trasferimento">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900">{modal === 'account' ? editing ? 'Modifica conto' : 'Nuovo conto' : 'Muovi denaro'}</h2>
                            <button type="button" onClick={() => modal === 'account' ? resetAccountForm() : setModal(null)} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100" title="Chiudi">
                                <X size={16} />
                            </button>
                        </div>

                        {modal === 'account' ? (
                            <form onSubmit={saveAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                                    <input value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} required className={inputClass} placeholder="Es. Intesa" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                                    <select value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value as AccountType })} className={inputClass}>
                                        {accountTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{editing ? 'Forza saldo attuale' : 'Saldo iniziale'}</label>
                                    <input type="number" step="0.01" value={accountForm.initialBalance} onChange={e => setAccountForm({ ...accountForm, initialBalance: e.target.value })} required className={inputClass} />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={accountForm.archived} onChange={e => setAccountForm({ ...accountForm, archived: e.target.checked })} />
                                    Archiviato
                                </label>
                                <button disabled={savingAccount} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                                    {savingAccount ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                                    {editing ? 'Salva conto' : 'Aggiungi conto'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={saveTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Da</label>
                                    <select value={transferForm.fromAccountId} onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })} required className={inputClass}>
                                        <option value="">Seleziona conto</option>
                                        {activeAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">A</label>
                                    <select value={transferForm.toAccountId} onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })} required className={inputClass}>
                                        <option value="">Seleziona conto</option>
                                        {activeAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Importo</label>
                                        <input type="number" min="0.01" step="0.01" value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} required className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
                                        <input type="date" value={transferForm.date} onChange={e => setTransferForm({ ...transferForm, date: e.target.value })} required className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nota</label>
                                    <input value={transferForm.description} onChange={e => setTransferForm({ ...transferForm, description: e.target.value })} className={inputClass} placeholder="Es. Prelievo bancomat" />
                                </div>
                                <button disabled={savingTransfer || activeAccounts.length < 2} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                                    {savingTransfer ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}
                                    Registra trasferimento
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

