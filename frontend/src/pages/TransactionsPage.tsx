import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, Search, Tags, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Transaction, TransactionType } from '../types';
import TransactionList from '../components/transactions/TransactionList';
import TransactionForm from '../components/transactions/TransactionForm';
import { useTransactions } from '../hooks/useTransactions';
import { transactionCategoryMappingService, transactionService } from '../services/services';

type SheetRow = unknown[];
type CategoryMappings = Record<string, number>;

const headerRowIndex = 27;

const readText = (value: unknown) => String(value ?? '').trim();
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


const columnIndex = (headers: SheetRow, name: string) => {
    const index = headers.findIndex(header => readText(header).toLowerCase() === name.toLowerCase());
    if (index < 0) throw new Error(`Colonna mancante: ${name}.`);
    return index;
};

const parseAmount = (value: unknown) => {
    if (typeof value === 'number') return Math.abs(value);
    const normalized = readText(value)
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const amount = Number.parseFloat(normalized);
    return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const parseExcelDate = (value: unknown) => {
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'number') {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
            return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
    }

    const text = readText(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (match) {
        const [, day, month, year] = match;
        return `${year.length === 2 ? `20${year}` : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return '';
};

const apiError = (err: unknown) => {
    const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
    return data ? Object.values(data).join('. ') : err instanceof Error ? err.message : 'Errore sconosciuto';
};

export default function TransactionsPage() {
    const { transactions, categories, loading, saving, error, setError, loadData, saveTransaction, deleteTransaction } = useTransactions();

    const [showForm, setShowForm] = useState(false);
    const [showMappings, setShowMappings] = useState(false);
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [filter, setFilter] = useState<'ALL' | TransactionType>('ALL');
    const [search, setSearch] = useState('');
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');
    const [categoryMappings, setCategoryMappings] = useState<CategoryMappings>({});
    const [savingMappingKey, setSavingMappingKey] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
    });

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        transactionCategoryMappingService.getAll()
            .then(async (mappings) => {
                const dbMappings = Object.fromEntries(mappings.map(mapping => [mapping.matchKey, mapping.categoryId]));
                const legacy = readLegacyMappings();
                if (!legacy) {
                    setCategoryMappings(dbMappings);
                    return;
                }

                const merged = { ...dbMappings };
                for (const [matchKey, categoryId] of Object.entries(legacy.mappings)) {
                    const type = matchKey.startsWith('INCOME:') ? 'INCOME' : matchKey.startsWith('EXPENSE:') ? 'EXPENSE' : null;
                    if (!type || !Number.isFinite(categoryId)) continue;
                    const saved = await transactionCategoryMappingService.save({
                        type,
                        matchKey,
                        description: matchKey.split(':').slice(1).join(':'),
                        categoryId,
                    });
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

    const categoryFor = (type: TransactionType, description: string, fallbackId: number) => {
        const mappedId = categoryMappings[mappingKey(type, description)];
        return categories.some(category => category.id === mappedId && category.type === type) ? mappedId : fallbackId;
    };

    const openNew = () => {
        setEditing(null);
        setFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '', categoryId: '' });
        setError('');
        setShowForm(true);
    };

    const openEdit = (tx: Transaction) => {
        setEditing(tx);
        setFormData({ amount: String(tx.amount), date: tx.date, description: tx.description || '', categoryId: String(tx.categoryId) });
        setError('');
        setShowForm(true);
    };

    const handleSave = async (form: { amount: string; date: string; description: string; categoryId: string }) => {
        const success = await saveTransaction(editing ? editing.id : null, form);
        if (success) {
            setShowForm(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminare questa transazione?')) return;
        await deleteTransaction(id);
    };

    const handleMappingChange = async (groupKey: string, categoryId: number) => {
        const group = transactionGroups.find(item => item.key === groupKey);
        if (!group) return;

        setSavingMappingKey(groupKey);
        setError('');

        try {
            const savedMapping = await transactionCategoryMappingService.save({
                type: group.type,
                matchKey: groupKey,
                description: group.description,
                categoryId,
            });
            setCategoryMappings((current) => ({ ...current, [savedMapping.matchKey]: savedMapping.categoryId }));

            const matchingTransactions = transactions.filter(tx =>
                tx.type === group.type && mappingKey(tx.type, cleanDescription(tx.description || tx.categoryName)) === groupKey
            );

            for (const tx of matchingTransactions) {
                if (tx.categoryId === categoryId) continue;
                await transactionService.update(tx.id, {
                    amount: tx.amount,
                    date: tx.date,
                    description: tx.description,
                    categoryId,
                });
            }

            await loadData();
        } catch (err) {
            setError(apiError(err));
        } finally {
            setSavingMappingKey('');
        }
    };

    const handleImport = async (file: File | undefined) => {
        if (!file) return;

        setImporting(true);
        setError('');
        setImportMessage('');

        try {
            const expenseCategory = categories.find(c => c.type === 'EXPENSE' && c.name.toLowerCase() === 'altro');
            const incomeCategory = categories.find(c => c.type === 'INCOME' && c.name.toLowerCase() === 'altro');
            if (!expenseCategory || !incomeCategory) {
                throw new Error('Categoria Altro mancante per entrate o uscite.');
            }

            const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const [headers, ...rows] = XLSX.utils.sheet_to_json<SheetRow>(sheet, { header: 1, defval: '', range: headerRowIndex });
            if (!headers) throw new Error('Riga intestazioni non trovata alla riga 28.');

            const descriptionCol = columnIndex(headers, 'Descrizione estesa');
            const debitCol = columnIndex(headers, 'Addebiti');
            const creditCol = columnIndex(headers, 'Accrediti');
            const dateCol = columnIndex(headers, 'Data valuta');

            let imported = 0;
            let skipped = 0;
            for (const row of rows) {
                const debit = parseAmount(row[debitCol]);
                const credit = parseAmount(row[creditCol]);
                const amount = credit || debit;
                const date = parseExcelDate(row[dateCol]);
                if (!amount || !date) {
                    skipped += 1;
                    continue;
                }

                const type: TransactionType = credit ? 'INCOME' : 'EXPENSE';
                const description = cleanDescription(row[descriptionCol]);
                const fallbackCategoryId = type === 'INCOME' ? incomeCategory.id : expenseCategory.id;

                try {
                    await transactionService.create({
                        amount,
                        date,
                        description,
                        categoryId: categoryFor(type, description, fallbackCategoryId),
                    });
                    imported += 1;
                } catch {
                    skipped += 1;
                }
            }

            await loadData();
            setImportMessage(`Importate ${imported} transazioni. Skippate ${skipped} righe.`);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filtered = transactions
        .filter(t => filter === 'ALL' || t.type === filter)
        .filter(t => !search || (t.description || t.categoryName || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-5 pb-10">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cerca transazioni..."
                            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 flex-shrink-0">
                        {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {f === 'ALL' ? 'Tutte' : f === 'INCOME' ? 'Entrate' : 'Uscite'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => handleImport(e.target.files?.[0])}
                    />
                    <button
                        onClick={() => setShowMappings(true)}
                        disabled={loading || transactions.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                    >
                        <Tags size={16} /> Mappa categorie
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing || loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                    >
                        {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Importa Excel
                    </button>
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        <Plus size={16} /> Nuova transazione
                    </button>
                </div>
            </div>

            {error && !showForm && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    {error}
                </div>
            )}

            {importMessage && (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                    {importMessage}
                </div>
            )}

            <TransactionList
                transactions={filtered}
                loading={loading}
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            {showMappings && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <h3 className="text-base font-semibold text-gray-900">Mappa categorie</h3>
                            <button
                                onClick={() => setShowMappings(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto divide-y divide-gray-100">
                            {transactionGroups.map(group => {
                                const selectedCategoryId = categoryMappings[group.key] ?? group.categoryId;
                                const availableCategories = categories.filter(category => category.type === group.type);

                                return (
                                    <div key={group.key} className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 p-4 items-center">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{group.description}</p>
                                            <p className="text-xs text-gray-400">
                                                {group.count} transazioni - {group.type === 'INCOME' ? 'Entrata' : 'Uscita'}
                                            </p>
                                            {group.examples.length > 1 && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    Esempi: {group.examples.slice(1).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={selectedCategoryId}
                                                disabled={savingMappingKey === group.key}
                                                onChange={(e) => handleMappingChange(group.key, Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                            >
                                                {availableCategories.map(category => (
                                                    <option key={category.id} value={category.id}>{category.name}</option>
                                                ))}
                                            </select>
                                            {savingMappingKey === group.key && <Loader2 size={16} className="animate-spin text-gray-900" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <TransactionForm
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

