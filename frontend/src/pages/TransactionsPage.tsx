import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, Search, Tags, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { AccountMovement, Transaction, TransactionType } from '../types';
import TransactionList from '../components/transactions/TransactionList';
import TransactionForm from '../components/transactions/TransactionForm';
import { useTransactions } from '../hooks/useTransactions';
import { transactionCategoryMappingService, transactionService } from '../services/services';
import { expandWorksheetRange } from '../services/worksheetRange';

type SheetRow = unknown[];
type CategoryMappings = Record<string, number>;

const readText = (value: unknown) => {
    if (value && typeof value === 'object' && 'v' in value) return String((value as { v?: unknown }).v ?? '').trim();
    return String(value ?? '').trim();
};
const cleanDescription = (value: unknown) => {
    const text = readText(value);
    const pressoMatch = text.match(/\bPRESSO\b\s+(.+)$/i);
    if (pressoMatch) return pressoMatch[1].trim();
    return text.split('-')[0].trim();
};
const similarDescriptionKey = (description: string) => description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, ' ')
    .replace(/\b[a-z]*\d+[a-z\d]*\b/g, ' ')
    .replace(/\b\d+[a-z]+\b/g, ' ')
    .replace(/x{2,}/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const mappingKey = (type: TransactionType, description: string) => `${type}:${similarDescriptionKey(description) || description.toLowerCase()}`;
const transactionImportKey = (accountId: number | string | null | undefined, type: TransactionType, date: string, amount: number, description: string) =>
    `${accountId ?? ''}:${type}:${date}:${Math.round(amount * 100)}:${similarDescriptionKey(cleanDescription(description))}`;
const transactionLooseKey = (accountId: number | string | null | undefined, type: TransactionType, date: string, amount: number) =>
    `${accountId ?? ''}:${type}:${date}:${Math.round(amount * 100)}`;
const legacyMappingKeys = ['transaction-category-mappings', 'transactionCategoryMappings', 'categoryMappings'];

const readLegacyMappings = () => {
    for (const key of legacyMappingKeys) {
        const value = localStorage.getItem(key);
        if (!value) continue;
        try {
            const parsed = JSON.parse(value) as CategoryMappings;
            if (parsed && typeof parsed === 'object') return { key, mappings: parsed };
        } catch {
            // Ignore broken old browser state.
        }
    }
    return null;
};

const normalizeHeader = (value: unknown) => readText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const columnIndex = (headers: SheetRow, ...names: string[]) => {
    const wanted = names.map(normalizeHeader);
    const normalized = headers.map(normalizeHeader);
    for (const name of wanted) {
        const exactIndex = normalized.findIndex(header => header === name);
        if (exactIndex >= 0) return exactIndex;
    }
    for (const name of wanted) {
        const partialIndex = normalized.findIndex(header => header && name && (header.includes(name) || name.includes(header)));
        if (partialIndex >= 0) return partialIndex;
    }
    throw new Error(`Colonna mancante: ${names[0]}.`);
};

const optionalColumnIndex = (headers: SheetRow, ...names: string[]) => {
    try {
        return columnIndex(headers, ...names);
    } catch {
        return -1;
    }
};

const findHeaderRowIndex = (rows: SheetRow[]) => rows.findIndex(row => {
    const headers = row.map(normalizeHeader);
    return headers.some(header => ['datavaluta', 'data'].includes(header))
        && headers.some(header => ['descrizioneestesa', 'descrizione', 'dettagli', 'operazione'].includes(header))
        && headers.some(header => ['addebiti', 'accrediti', 'importo'].includes(header));
});

const parseSignedAmount = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value === 'number') return value;
        const text = readText(value);
        const normalized = text
            .replace(/[()]/g, '')
            .replace(/[^\d,.-]/g, '')
            .replace(/\.(?=\d{3}(\D|$))/g, '')
            .replace(',', '.');
        const amount = Number.parseFloat(normalized);
        if (Number.isFinite(amount)) return amount;
    }
    return 0;
};
const parseAmount = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value === 'number') return Math.abs(value);
        const text = readText(value);
        const normalized = text
            .replace(/[()]/g, '')
            .replace(/[^\d,.-]/g, '')
            .replace(/\.(?=\d{3}(\D|$))/g, '')
            .replace(',', '.');
        const amount = Number.parseFloat(normalized);
        if (Number.isFinite(amount)) return Math.abs(amount);
    }
    return 0;
};

const parseExcelDate = (...values: unknown[]) => {
    for (const value of values) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');
        if (typeof value === 'number') {
            const parsed = XLSX.SSF.parse_date_code(value);
            if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
        const text = readText(value).split(/\s+/)[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
        const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
        if (match) {
            const [, day, month, year] = match;
            return `${year.length === 2 ? `20${year}` : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
    return '';
};

const apiError = (err: unknown) => {
    const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
    return data ? Object.values(data).join('. ') : err instanceof Error ? err.message : 'Errore sconosciuto';
};

export default function TransactionsPage() {
    const { transactions, movements, categories, accounts, loading, saving, error, setError, loadData, saveTransaction, deleteTransaction } = useTransactions();
    const [showForm, setShowForm] = useState(false);
    const [showMappings, setShowMappings] = useState(false);
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [filter, setFilter] = useState<'ALL' | TransactionType | 'TRANSFER'>('ALL');
    const [accountFilter, setAccountFilter] = useState('');
    const [search, setSearch] = useState('');
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
    const [selectedImportAccountId, setSelectedImportAccountId] = useState('');
    const [categoryMappings, setCategoryMappings] = useState<CategoryMappings>({});
    const [savingMappingKey, setSavingMappingKey] = useState('');
    const [mappingType, setMappingType] = useState<TransactionType>('EXPENSE');
    const [mappingSearch, setMappingSearch] = useState('');
    const [mappingOnlyUnmapped, setMappingOnlyUnmapped] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: '', categoryId: '', accountId: '' });

    useEffect(() => {
        loadData(accountFilter);
    }, [accountFilter, loadData]);

    useEffect(() => {
        transactionCategoryMappingService.getAll()
            .then(async (mappings) => {
                const dbMappings = Object.fromEntries(mappings.map(mapping => [mapping.matchKey, mapping.categoryId]));
                const legacy = readLegacyMappings();
                if (!legacy) return setCategoryMappings(dbMappings);
                const merged = { ...dbMappings };
                for (const [matchKey, categoryId] of Object.entries(legacy.mappings)) {
                    const type = matchKey.startsWith('INCOME:') ? 'INCOME' : matchKey.startsWith('EXPENSE:') ? 'EXPENSE' : null;
                    if (!type || !Number.isFinite(categoryId)) continue;
                    const saved = await transactionCategoryMappingService.save({ type, matchKey, description: matchKey.split(':').slice(1).join(':'), categoryId });
                    merged[saved.matchKey] = saved.categoryId;
                }
                localStorage.removeItem(legacy.key);
                setCategoryMappings(merged);
            })
            .catch((err) => setError(apiError(err)));
    }, [setError]);

    const transactionGroups = useMemo(() => {
        const groups = new Map<string, { key: string; type: TransactionType; description: string; count: number; categoryId: number; examples: string[] }>();
        for (const tx of transactions) {
            const description = cleanDescription(tx.description || tx.categoryName);
            if (!description) continue;
            const key = mappingKey(tx.type, description);
            const group = groups.get(key);
            if (group) {
                group.count += 1;
                if (!group.examples.includes(description) && group.examples.length < 3) group.examples.push(description);
            } else {
                groups.set(key, { key, type: tx.type, description, count: 1, categoryId: tx.categoryId, examples: [description] });
            }
        }
        return [...groups.values()].sort((a, b) => b.count - a.count || a.description.localeCompare(b.description));
    }, [transactions]);

    const visibleTransactionGroups = useMemo(() => {
        const query = mappingSearch.trim().toLowerCase();
        return transactionGroups
            .filter(group => group.type === mappingType)
            .filter(group => {
                if (!mappingOnlyUnmapped) return true;
                const categoryId = categoryMappings[group.key] ?? group.categoryId;
                const category = categories.find(item => item.id === categoryId);
                return !category || category.name.toLowerCase() === 'altro';
            })
            .filter(group => !query || group.description.toLowerCase().includes(query) || group.examples.some(example => example.toLowerCase().includes(query)));
    }, [categories, categoryMappings, mappingOnlyUnmapped, mappingSearch, mappingType, transactionGroups]);

    const categoryOptionsFor = (type: TransactionType) => {
        const typeCategories = categories.filter(category => category.type === type);
        const macros = typeCategories.filter(category => !category.parentId);
        const children = typeCategories.filter(category => category.parentId);
        const grouped = macros.map(macro => ({ macro, children: children.filter(category => category.parentId === macro.id) })).filter(group => group.children.length > 0);
        const standalone = typeCategories.filter(category => !category.parentId && !children.some(child => child.parentId === category.id));
        return { grouped, standalone };
    };

    const defaultCategoryId = (type: TransactionType) =>
        categories.find(c => c.type === type && c.name.toLowerCase() === 'da classificare')?.id
        ?? categories.find(c => c.type === type && c.name.toLowerCase() === 'altro')?.id
        ?? categories.find(c => c.type === type)?.id;

    const categoryFor = (type: TransactionType, description: string, fallbackId: number) => {
        const exactId = categoryMappings[mappingKey(type, description)];
        if (categories.some(category => category.id === exactId && category.type === type)) return exactId;
        const normalized = similarDescriptionKey(description) || description.toLowerCase();
        const prefix = `${type}:`;
        const match = Object.entries(categoryMappings)
            .filter(([key, categoryId]) => key.startsWith(prefix) && categories.some(category => category.id === categoryId && category.type === type))
            .map(([key, categoryId]) => ({ keyword: key.slice(prefix.length), categoryId }))
            .filter(({ keyword }) => keyword && normalized.includes(keyword))
            .sort((a, b) => b.keyword.length - a.keyword.length)[0];
        return match?.categoryId ?? fallbackId;
    };

    const openMappings = () => {
        setMappingType(filter === 'INCOME' ? 'INCOME' : 'EXPENSE');
        setMappingSearch('');
        setMappingOnlyUnmapped(true);
        setShowMappings(true);
    };

    const openNew = () => {
        setEditing(null);
        setFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '', categoryId: String(defaultCategoryId('EXPENSE') ?? ''), accountId: accountFilter });
        setError('');
        setShowForm(true);
    };

    const openEdit = (tx: Transaction) => {
        setEditing(tx);
        setFormData({ amount: String(tx.amount), date: tx.date, description: tx.description || '', categoryId: String(tx.categoryId), accountId: tx.accountId ? String(tx.accountId) : '' });
        setError('');
        setShowForm(true);
    };

    const handleSave = async (form: { amount: string; date: string; description: string; categoryId: string; accountId: string }) => {
        if (!form.categoryId) {
            setError('Seleziona una categoria.');
            return;
        }
        const success = await saveTransaction(editing ? editing.id : null, form, accountFilter);
        if (success) setShowForm(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminare questa transazione?')) return;
        await deleteTransaction(id, accountFilter);
    };

    const handleMappingChange = async (groupKey: string, categoryId: number) => {
        const group = transactionGroups.find(item => item.key === groupKey);
        if (!group) return;
        setSavingMappingKey(groupKey);
        setError('');
        try {
            const savedMapping = await transactionCategoryMappingService.save({ type: group.type, matchKey: groupKey, description: group.description, categoryId });
            setCategoryMappings((current) => ({ ...current, [savedMapping.matchKey]: savedMapping.categoryId }));
            const matchingTransactions = transactions.filter(tx => tx.type === group.type && mappingKey(tx.type, cleanDescription(tx.description || tx.categoryName)) === groupKey);
            for (const tx of matchingTransactions) {
                if (tx.categoryId === categoryId) continue;
                await transactionService.update(tx.id, { amount: tx.amount, date: tx.date, description: tx.description, categoryId, accountId: tx.accountId ?? undefined });
            }
            await loadData(accountFilter);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setSavingMappingKey('');
        }
    };

    const prepareImport = (file: File | undefined) => {
        if (!file) return;
        setPendingImportFile(file);
        setSelectedImportAccountId(accounts.some(account => String(account.id) === accountFilter && !account.archived && account.type !== 'INVESTMENT') ? accountFilter : '');
        setError('');
        setImportMessage('');
    };

    const cancelImport = () => {
        setPendingImportFile(null);
        setSelectedImportAccountId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImport = async (file: File, importAccountId: number) => {
        setImporting(true);
        setError('');
        setImportMessage('');
        try {
            const expenseCategoryId = defaultCategoryId('EXPENSE');
            const incomeCategoryId = defaultCategoryId('INCOME');
            if (!expenseCategoryId || !incomeCategoryId) throw new Error('Categorie mancanti per entrate o uscite.');
            const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            expandWorksheetRange(sheet);
            const rawSheetRows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { header: 1, defval: '', raw: true });
            const displaySheetRows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { header: 1, defval: '', raw: false });
            const detectedHeaderRowIndex = findHeaderRowIndex(rawSheetRows);
            if (detectedHeaderRowIndex < 0) throw new Error('Riga intestazioni non trovata.');
            const headers = rawSheetRows[detectedHeaderRowIndex];
            const rows = rawSheetRows.slice(detectedHeaderRowIndex + 1);
            const displayDataRows = displaySheetRows.slice(detectedHeaderRowIndex + 1);
            const descriptionCol = columnIndex(headers, 'Descrizione estesa', 'Dettagli', 'Descrizione', 'Operazione', 'Causale');
            const debitCol = optionalColumnIndex(headers, 'Addebiti', 'Addebito', 'Dare', 'Uscite');
            const creditCol = optionalColumnIndex(headers, 'Accrediti', 'Accredito', 'Avere', 'Entrate');
            const amountCol = optionalColumnIndex(headers, 'Importo', 'Amount');
            const dateCol = columnIndex(headers, 'Data valuta', 'Data', 'Valuta');
            if (amountCol < 0 && (debitCol < 0 || creditCol < 0)) throw new Error('Colonna importo mancante.');
            const selectedAccount = accounts.find(account => account.id === importAccountId && !account.archived);
            if (!selectedAccount || selectedAccount.type === 'INVESTMENT') throw new Error("Seleziona un conto valido per importare l'estratto conto.");
            const existingKeys = new Set(transactions.map(tx => transactionImportKey(tx.accountId, tx.type, tx.date, tx.amount, tx.description || '')));
            const existingLooseCounts = new Map<string, number>();
            for (const tx of transactions) {
                const key = transactionLooseKey(tx.accountId, tx.type, tx.date, tx.amount);
                existingLooseCounts.set(key, (existingLooseCounts.get(key) || 0) + 1);
            }
            let imported = 0;
            let skipped = 0;
            let invalidRows = 0;
            let duplicateRows = 0;
            let apiErrors = 0;
            let firstSkipReason = '';
            for (const [rowIndex, row] of rows.entries()) {
                const displayRow = displayDataRows[rowIndex] || [];
                const signedAmount = amountCol >= 0 ? parseSignedAmount(row[amountCol], displayRow[amountCol]) : 0;
                const debit = amountCol >= 0 ? (signedAmount < 0 ? Math.abs(signedAmount) : 0) : parseAmount(row[debitCol], displayRow[debitCol]);
                const credit = amountCol >= 0 ? (signedAmount > 0 ? signedAmount : 0) : parseAmount(row[creditCol], displayRow[creditCol]);
                const amount = Math.abs(signedAmount) || credit || debit;
                const date = parseExcelDate(row[dateCol], displayRow[dateCol]);
                if (!amount || !date) {
                    skipped += 1;
                    invalidRows += 1;
                    if (!firstSkipReason) firstSkipReason = `riga senza ${!amount ? 'importo' : 'data'} valida`;
                    continue;
                }
                const type: TransactionType = credit ? 'INCOME' : 'EXPENSE';
                const description = cleanDescription(row[descriptionCol] || displayRow[descriptionCol]);
                const duplicateKey = transactionImportKey(importAccountId, type, date, amount, description);
                const looseDuplicateKey = transactionLooseKey(importAccountId, type, date, amount);
                if (existingKeys.has(duplicateKey) || (existingLooseCounts.get(looseDuplicateKey) || 0) > 0) {
                    existingLooseCounts.set(looseDuplicateKey, Math.max((existingLooseCounts.get(looseDuplicateKey) || 1) - 1, 0));
                    skipped += 1;
                    duplicateRows += 1;
                    if (!firstSkipReason) firstSkipReason = 'transazione gia presente';
                    continue;
                }
                const fallbackCategoryId = type === 'INCOME' ? incomeCategoryId : expenseCategoryId;
                try {
                    await transactionService.create({ amount, date, description, categoryId: categoryFor(type, description, fallbackCategoryId), accountId: importAccountId });
                    existingKeys.add(duplicateKey);
                    existingLooseCounts.set(looseDuplicateKey, (existingLooseCounts.get(looseDuplicateKey) || 0) + 1);
                    imported += 1;
                } catch (err) {
                    skipped += 1;
                    apiErrors += 1;
                    if (!firstSkipReason) firstSkipReason = apiError(err);
                }
            }
            await loadData(accountFilter);
            const resultMessage = `Importate ${imported} transazioni. Skippate ${skipped} righe${skipped ? ` (${invalidRows} non valide, ${duplicateRows} duplicate, ${apiErrors} errori server${firstSkipReason ? `; primo motivo: ${firstSkipReason}` : ''})` : ''}.`;
            if (imported === 0 && skipped > 0) setError(resultMessage);
            else setImportMessage(resultMessage);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const confirmImport = () => {
        const file = pendingImportFile;
        const importAccountId = Number(selectedImportAccountId);
        if (!file || !importAccountId) return;
        setPendingImportFile(null);
        setSelectedImportAccountId('');
        void handleImport(file, importAccountId);
    };

    const filtered: AccountMovement[] = movements
        .filter(t => filter === 'ALL' || t.type === filter)
        .filter(t => !search || (t.description || t.categoryName || t.accountName || t.fromAccountName || t.toAccountName || '').toLowerCase().includes(search.toLowerCase()));
    const importAccounts = accounts.filter(account => !account.archived && account.type !== 'INVESTMENT');


    return (
        <div className="space-y-5 pb-10">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca movimenti..." className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                    </div>
                    <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900">
                        <option value="">Tutti i conti</option>
                        {accounts.filter(account => !account.archived).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                    </select>
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 flex-shrink-0">
                        {(['ALL', 'INCOME', 'EXPENSE', 'TRANSFER'] as const).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                                {f === 'ALL' ? 'Tutte' : f === 'INCOME' ? 'Entrate' : f === 'EXPENSE' ? 'Uscite' : 'Trasferimenti'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => prepareImport(e.target.files?.[0])} />
                    <button onClick={openMappings} disabled={loading || transactions.length === 0} className="app-button-secondary disabled:opacity-60"><Tags size={16} /> Mappa categorie</button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={importing || loading} className="app-button-secondary disabled:opacity-60">{importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Importa Excel</button>
                    <button onClick={openNew} className="app-button-primary"><Plus size={16} /> Nuova transazione</button>
                </div>
            </div>

            {error && !showForm && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
            {importMessage && <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">{importMessage}</div>}

            <TransactionList movements={filtered} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
            {pendingImportFile && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <form onSubmit={(event) => { event.preventDefault(); confirmImport(); }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-100">
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-gray-900">Importa estratto conto</h3>
                                <p className="mt-1 text-xs text-gray-500 truncate" title={pendingImportFile.name}>{pendingImportFile.name}</p>
                            </div>
                            <button type="button" onClick={cancelImport} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Annulla importazione" title="Chiudi">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <label htmlFor="import-account" className="block text-sm font-medium text-gray-700 mb-1.5">A quale conto appartengono queste transazioni?</label>
                            <select
                                id="import-account"
                                value={selectedImportAccountId}
                                onChange={(event) => setSelectedImportAccountId(event.target.value)}
                                autoFocus
                                required
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                            >
                                <option value="">Seleziona un conto</option>
                                {importAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                            </select>
                            {importAccounts.length === 0 && <p className="mt-2 text-xs text-red-600">Nessun conto disponibile per l'importazione.</p>}
                        </div>

                        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <button type="button" onClick={cancelImport} className="app-button-secondary">Annulla</button>
                            <button type="submit" disabled={!selectedImportAccountId} className="app-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
                                <Upload size={16} /> Importa transazioni
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showMappings && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div><h3 className="text-base font-semibold text-gray-900">Mappa categorie</h3><p className="text-xs text-gray-500 mt-1">Aggiorna una regola e verranno aggiornate tutte le transazioni uguali.</p></div>
                            <button onClick={() => setShowMappings(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-4 border-b border-gray-100 shrink-0 space-y-3">
                            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                                {(['EXPENSE', 'INCOME'] as const).map((type) => <button key={type} onClick={() => setMappingType(type)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mappingType === type ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>{type === 'EXPENSE' ? 'Uscite' : 'Entrate'} ({transactionGroups.filter(group => group.type === type).length})</button>)}
                            </div>
                            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={mappingSearch} onChange={(e) => setMappingSearch(e.target.value)} placeholder="Cerca negozio, azienda o descrizione..." className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
                            <label className="inline-flex items-center gap-2 text-sm text-gray-600 w-fit">
                                <input type="checkbox" checked={mappingOnlyUnmapped} onChange={(e) => setMappingOnlyUnmapped(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                                Solo da sistemare
                            </label>
                        </div>
                        <div className="overflow-y-auto divide-y divide-gray-100">
                            {visibleTransactionGroups.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">Nessuna casistica da mappare per questo filtro.</div> : visibleTransactionGroups.map(group => {
                                const selectedCategoryId = categoryMappings[group.key] ?? group.categoryId;
                                const options = categoryOptionsFor(group.type);
                                return (
                                    <div key={group.key} className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3 p-4 items-center hover:bg-gray-50/70 transition-colors">
                                        <div className="min-w-0"><div className="flex items-center gap-2 min-w-0"><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${group.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{group.type === 'INCOME' ? 'Entrata' : 'Uscita'}</span><p className="text-sm font-medium text-gray-900 truncate">{group.description}</p></div><p className="text-xs text-gray-500 mt-1">{group.count} transazioni</p>{group.examples.length > 1 && <p className="text-xs text-gray-400 truncate mt-0.5">Esempi: {group.examples.slice(1).join(', ')}</p>}</div>
                                        <div className="flex items-center gap-2"><select value={selectedCategoryId} disabled={savingMappingKey === group.key} onChange={(e) => handleMappingChange(group.key, Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900">{options.grouped.map(({ macro, children }) => <optgroup key={macro.id} label={macro.name}>{children.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</optgroup>)}{options.standalone.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{savingMappingKey === group.key && <Loader2 size={16} className="animate-spin text-gray-900 shrink-0" />}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {showForm && <TransactionForm editing={editing} categories={categories} accounts={accounts} initialData={formData} saving={saving} error={error} onSave={handleSave} onClose={() => setShowForm(false)} />}
        </div>
    );
}

