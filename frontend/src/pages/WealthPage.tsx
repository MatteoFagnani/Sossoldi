import { formatCurrency } from '../utils/formatters';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightLeft,
    Loader2,
    Plus,
    Trash2,
    Wallet,
    X,
    Landmark,
    PiggyBank,
    Banknote,
    CreditCard,
    TrendingUp,
    Pencil,
    Eye,
    EyeOff,
    GripVertical,
    RotateCcw,
} from 'lucide-react';
import { accountService, accountTransferService, investmentService } from '../services/services';
import { adjustedInitialBalance } from '../utils/accountBalance';
import type { Account, AccountTransfer, AccountType, Investment } from '../types';

const accountTypes: { value: AccountType; label: string }[] = [
    { value: 'CHECKING', label: 'Conto corrente' },
    { value: 'SAVINGS', label: 'Risparmio' },
    { value: 'CASH', label: 'Contanti' },
    { value: 'CARD', label: 'Carta' },
    { value: 'INVESTMENT', label: 'Investimenti' },
    { value: 'OTHER', label: 'Altro' },
];

const ORDER_STORAGE_KEY = 'sossoldi_account_order';

const emptyAccountForm = { name: '', type: 'CHECKING' as AccountType, initialBalance: '0', archived: false };
const emptyTransferForm = { fromAccountId: '', toAccountId: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' };
const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';

type Modal = 'account' | 'transfer' | null;

const getAccountIcon = (type: AccountType) => {
    switch (type) {
        case 'CHECKING':
            return Landmark;
        case 'SAVINGS':
            return PiggyBank;
        case 'CASH':
            return Banknote;
        case 'CARD':
            return CreditCard;
        case 'INVESTMENT':
            return TrendingUp;
        default:
            return Wallet;
    }
};

const getAccountColor = (type: AccountType): string => {
    switch (type) {
        case 'CHECKING':
            return '#111827';
        case 'SAVINGS':
            return '#06b6d4';
        case 'CASH':
            return '#10b981';
        case 'CARD':
            return '#8b5cf6';
        case 'INVESTMENT':
            return '#f59e0b';
        default:
            return '#64748b';
    }
};

const sortAccountsBySavedOrder = (accountsList: Account[]): Account[] => {
    try {
        const savedOrder = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || '[]') as number[];
        if (!savedOrder.length) return accountsList;
        const orderMap = new Map<number, number>();
        savedOrder.forEach((id, idx) => orderMap.set(id, idx));
        return [...accountsList].sort((a, b) => {
            const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
            const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
            return posA - posB;
        });
    } catch {
        return accountsList;
    }
};

export default function WealthPage() {
    const navigate = useNavigate();
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
    const [showArchived, setShowArchived] = useState(false);

    // Drag and Drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const activeAccounts = useMemo(() => accounts.filter(account => !account.archived), [accounts]);
    const archivedAccounts = useMemo(() => accounts.filter(account => account.archived), [accounts]);

    const displayedAccounts = useMemo(() => {
        return showArchived ? accounts : activeAccounts;
    }, [accounts, activeAccounts, showArchived]);

    const accountTotal = useMemo(() => activeAccounts.reduce((sum, account) => sum + account.currentBalance, 0), [activeAccounts]);
    const investmentTotal = useMemo(() => investments.reduce((sum, item) => sum + item.currentValue, 0), [investments]);
    const total = accountTotal + investmentTotal;

    const liquidTotal = useMemo(
        () => activeAccounts.filter(account => account.type !== 'INVESTMENT').reduce((sum, account) => sum + account.currentBalance, 0),
        [activeAccounts]
    );

    const fmt = formatCurrency;

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [accountData, transferData, investmentData] = await Promise.all([
                accountService.getAll(),
                accountTransferService.getAll(),
                investmentService.getAll(),
            ]);
            setAccounts(sortAccountsBySavedOrder(accountData));
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
            setTransferForm(form => ({
                ...form,
                fromAccountId: String(activeAccounts[0].id),
                toAccountId: String(activeAccounts[1]?.id ?? ''),
            }));
        }
    }, [activeAccounts, transferForm.fromAccountId]);

    // Drag & Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const currentList = [...displayedAccounts];
        const [movedAccount] = currentList.splice(draggedIndex, 1);
        currentList.splice(targetIndex, 0, movedAccount);

        const newDisplayedIds = new Set(currentList.map(a => a.id));
        const remainingAccounts = accounts.filter(a => !newDisplayedIds.has(a.id));
        const newFullList = [...currentList, ...remainingAccounts];

        setAccounts(newFullList);
        try {
            localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(newFullList.map(a => a.id)));
        } catch {
            // ignore
        }

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const openNewAccount = () => {
        setEditing(null);
        setAccountForm(emptyAccountForm);
        setModal('account');
    };

    const openEdit = (account: Account) => {
        setEditing(account);
        setAccountForm({
            name: account.name,
            type: account.type,
            initialBalance: String(Math.round(account.currentBalance * 100) / 100),
            archived: account.archived,
        });
        setModal('account');
    };

    const resetAccountForm = () => {
        setEditing(null);
        setAccountForm(emptyAccountForm);
        setModal(null);
    };

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
            const payload = {
                ...accountForm,
                initialBalance: editing
                    ? adjustedInitialBalance(editing.initialBalance, editing.currentBalance, enteredBalance)
                    : enteredBalance,
            };
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
        if (transferForm.fromAccountId === transferForm.toAccountId) {
            setError('I conti di origine e destinazione devono essere diversi.');
            return;
        }
        setSavingTransfer(true);
        setError('');
        try {
            await accountTransferService.create({
                fromAccountId: Number(transferForm.fromAccountId),
                toAccountId: Number(transferForm.toAccountId),
                amount: Number.parseFloat(transferForm.amount),
                date: transferForm.date,
                description: transferForm.description || undefined,
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
        if (!window.confirm(`Eliminare definitivamente il conto "${account.name}"?`)) return;
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
        if (!window.confirm('Eliminare questo trasferimento? I saldi dei conti verranno aggiornati.')) return;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">

            {error && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium">
                    {error}
                </div>
            )}

            {/* Pochi KPI Essenziali */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="app-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-500">Patrimonio totale</p>
                        <div className="p-2 rounded-xl bg-gray-900/10 text-gray-900">
                            <Landmark size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight mb-1">{fmt(total)}</p>
                    <p className="text-xs text-gray-400 font-medium">
                        Liquidità + Investimenti
                    </p>
                </div>

                <div className="app-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-500">Liquidità totale</p>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight mb-1">{fmt(liquidTotal)}</p>
                    <p className="text-xs text-gray-400 font-medium">
                        Disponibile su {activeAccounts.length} conti attivi
                    </p>
                </div>

                <div
                    onClick={() => navigate('/investments')}
                    className="app-card p-5 cursor-pointer hover:border-gray-300 transition-all"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-500">Portafoglio investito</p>
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight mb-1">{fmt(investmentTotal)}</p>
                    <p className="text-xs text-cyan-600 font-medium flex items-center gap-1">
                        <span>{investments.length} asset monitorati</span>
                        <span>→</span>
                    </p>
                </div>
            </div>

            {/* Header Sezione Conti con Drag & Drop Info e Filtro Archiviati */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                <div>
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">
                        I tuoi conti ({activeAccounts.length})
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Trascina le card per riordinarle secondo la tua preferenza
                    </p>
                </div>
            </div>

            {/* Grid delle Card dei Conti con Drag and Drop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedAccounts.map((account, index) => {
                    const Icon = getAccountIcon(account.type);
                    const color = getAccountColor(account.type);
                    const typeLabel = accountTypes.find(t => t.value === account.type)?.label || account.type;
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index && draggedIndex !== index;

                    return (
                        <div
                            key={account.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`app-card app-card-hover p-5 flex flex-col justify-between transition-all duration-200 cursor-grab active:cursor-grabbing select-none relative group ${
                                isDragging
                                    ? 'opacity-40 scale-95 border-dashed border-gray-400 shadow-none'
                                    : isDragOver
                                    ? 'ring-2 ring-gray-900 ring-offset-2 scale-[1.02] shadow-md'
                                    : account.archived
                                    ? 'opacity-60 bg-gray-50 border-dashed'
                                    : 'hover:shadow-md'
                            }`}
                        >
                            <div>
                                {/* Header Card */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5 -ml-1 transition-colors"
                                            title="Trascina per riordinare"
                                        >
                                            <GripVertical size={16} />
                                        </div>
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${color}15`, color }}
                                        >
                                            <Icon size={17} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate" title={account.name}>
                                                {account.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    {typeLabel}
                                                </span>
                                                {account.archived && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                                        Archiviato
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action icons */}
                                    <div
                                        className="flex items-center gap-0.5 shrink-0"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); openEdit(account); }}
                                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                            title="Modifica conto"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); deleteAccount(account); }}
                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title="Elimina conto"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Saldo grande al centro */}
                                <div className="my-3">
                                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">Saldo attuale</p>
                                    <p className={`text-2xl font-bold tracking-tight ${account.currentBalance < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                                        {fmt(account.currentBalance)}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Card con Giroconto */}
                            <div
                                className="pt-3 border-t border-gray-100 mt-2"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {!account.archived ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); moveAccount(account); }}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <ArrowRightLeft size={13} />
                                        <span>Giroconto</span>
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-400 italic block text-center py-1">Conto archiviato</span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Card "+ Aggiungi conto" integrata nella griglia */}
                <button
                    type="button"
                    onClick={openNewAccount}
                    className="border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-900 transition-all min-h-[180px] cursor-pointer group bg-white/50 hover:bg-white"
                >
                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-semibold">Aggiungi nuovo conto</span>
                    <span className="text-xs text-gray-400">Conto corrente, carta o deposito</span>
                </button>
            </div>

            {/* Sezione Trasferimenti Recenti (Compatta e ordinata) */}
            {transfers.length > 0 && (
                <div className="app-card p-6 mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <ArrowRightLeft size={16} className="text-gray-600" />
                            <h2 className="text-sm font-semibold text-gray-900">Ultimi giroconti</h2>
                        </div>
                        <span className="text-xs text-gray-400">{transfers.length} movimentazioni</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {transfers.slice(0, 5).map(transfer => (
                            <div
                                key={transfer.id}
                                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                                        <ArrowRightLeft size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 flex-wrap">
                                            <span>{transfer.fromAccountName}</span>
                                            <span className="text-gray-400 text-xs">➔</span>
                                            <span>{transfer.toAccountName}</span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {new Date(transfer.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {transfer.description ? ` • ${transfer.description}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-sm font-bold text-gray-900">
                                        {fmt(transfer.amount)}
                                    </span>
                                    <button
                                        onClick={() => deleteTransfer(transfer)}
                                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Elimina"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modali */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs px-4 py-8">
                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900">
                                {modal === 'account' ? (editing ? 'Modifica conto' : 'Nuovo conto') : 'Muovi denaro (Giroconto)'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => (modal === 'account' ? resetAccountForm() : setModal(null))}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Chiudi"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {modal === 'account' ? (
                            <form onSubmit={saveAccount} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome del conto</label>
                                    <input
                                        value={accountForm.name}
                                        onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                                        required
                                        className={inputClass}
                                        placeholder="Es. Intesa Sanpaolo, Revolut, Contanti"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipologia</label>
                                    <select
                                        value={accountForm.type}
                                        onChange={e => setAccountForm({ ...accountForm, type: e.target.value as AccountType })}
                                        className={inputClass}
                                    >
                                        {accountTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        {editing ? 'Rettifica saldo attuale (€)' : 'Saldo iniziale (€)'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={accountForm.initialBalance}
                                        onChange={e => setAccountForm({ ...accountForm, initialBalance: e.target.value })}
                                        required
                                        className={inputClass}
                                    />
                                    {editing && (
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Aggiornando il saldo qui verrà ricalcolato il punto di partenza conservando la cronologia transazioni.
                                        </p>
                                    )}
                                </div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer pt-1">
                                    <input
                                        type="checkbox"
                                        checked={accountForm.archived}
                                        onChange={e => setAccountForm({ ...accountForm, archived: e.target.checked })}
                                        className="rounded text-gray-900 focus:ring-gray-900"
                                    />
                                    Conto archiviato (chiuso o non più utilizzato)
                                </label>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingAccount}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                                    >
                                        {savingAccount ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                                        {editing ? 'Salva modifiche' : 'Aggiungi conto'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={saveTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Dal conto (origine)</label>
                                    <select
                                        value={transferForm.fromAccountId}
                                        onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                                        required
                                        className={inputClass}
                                    >
                                        <option value="">Seleziona conto</option>
                                        {activeAccounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.name} ({fmt(account.currentBalance)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Al conto (destinazione)</label>
                                    <select
                                        value={transferForm.toAccountId}
                                        onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                                        required
                                        className={inputClass}
                                    >
                                        <option value="">Seleziona conto</option>
                                        {activeAccounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.name} ({fmt(account.currentBalance)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Importo (€)</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={transferForm.amount}
                                            onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                                            required
                                            placeholder="0.00"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Data</label>
                                        <input
                                            type="date"
                                            value={transferForm.date}
                                            onChange={e => setTransferForm({ ...transferForm, date: e.target.value })}
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Causale / Nota (opzionale)</label>
                                    <input
                                        value={transferForm.description}
                                        onChange={e => setTransferForm({ ...transferForm, description: e.target.value })}
                                        className={inputClass}
                                        placeholder="Es. Spostamento su conto deposito"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingTransfer || activeAccounts.length < 2}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                                    >
                                        {savingTransfer ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}
                                        Registra trasferimento
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
