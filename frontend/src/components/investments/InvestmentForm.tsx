import { useState, useMemo, type FormEvent } from 'react';
import {
    X,
    Loader2,
    Plus,
    Trash2,
    Calendar,
    CalendarDays,
    Bot,
    Wallet,
    Layers,
    BarChart2,
    TrendingUp,
    PieChart,
    Coins,
    ShieldCheck,
    Landmark,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import type { Investment, InvestmentComponent, InvestmentPayload, InvestmentSnapshot, InvestmentType } from '../../types';

export const investmentTypes: { value: InvestmentType; label: string; icon: typeof Wallet; desc: string }[] = [
    { value: 'ROBO_ADVISOR', label: 'Roboadvisor', icon: Bot, desc: 'Moneyfarm, Tinaba, Euclidea' },
    { value: 'ETF', label: 'ETF', icon: BarChart2, desc: 'Fondi indicizzati (VWCE, SWDA)' },
    { value: 'STOCK', label: 'Azioni', icon: TrendingUp, desc: 'Singoli titoli azionari' },
    { value: 'FUND', label: 'Fondi Comuni', icon: PieChart, desc: 'Gestioni attive e fondi SICAV' },
    { value: 'BOND', label: 'Obbligazioni', icon: Landmark, desc: 'BTP, BOT, titoli governativi' },
    { value: 'PENSION', label: 'Fondo Pensione', icon: ShieldCheck, desc: 'PIP e fondi pensione negoziali' },
    { value: 'CRYPTO', label: 'Crypto', icon: Coins, desc: 'Bitcoin, Ethereum e crypto' },
    { value: 'OTHER', label: 'Altro', icon: Layers, desc: 'Beni rifugio, oro, liquidità' },
];

const componentAssetClasses = [
    'Azioni',
    'Obbligazioni',
    'Titoli di stato',
    'Liquidità',
    'Materie prime / Oro',
    'ETF',
    'Fondi',
    'Crypto',
    'Altro',
];

const emptyComponent = { assetClass: 'Azioni', name: '', ticker: '', percentage: '', currentValue: '' };
const emptySnapshot = { month: '', investedCapital: '', value: '', currentValue: '' };

const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';

type PacComponentForm = typeof emptyComponent;
type SnapshotForm = typeof emptySnapshot;

type FormState = {
    name: string;
    type: InvestmentType;
    ticker: string;
    currentValue: string;
    investedCapital: string;
    pacActive: boolean;
    recurringAmount: string;
    recurringDay: string;
    trackingFrequency: 'YEARLY' | 'MONTHLY';
    components: PacComponentForm[];
    snapshots: SnapshotForm[];
};

type Props = {
    investment: Investment | null;
    saving: boolean;
    onCancel: () => void;
    onSave: (payload: InvestmentPayload) => Promise<void>;
};

const toMoney = (value: unknown) => Number.parseFloat(String(value ?? '')) || 0;
const toNullableNumber = (value: string) => (value.trim() === '' ? null : Number.parseFloat(value) || 0);

function componentRows(investment: Investment | null): PacComponentForm[] {
    if (!investment) return [{ ...emptyComponent }];
    const existing = investment.components || [];
    if (existing.length > 0) {
        return existing.map((item) => ({
            assetClass: item.assetClass || 'Altro',
            name: item.name || '',
            ticker: item.ticker || '',
            percentage: item.percentage == null ? '' : String(item.percentage),
            currentValue: item.currentValue == null ? '' : String(item.currentValue),
        }));
    }

    const legacy = [
        ['Azioni', investment.stocksPercent],
        ['Obbligazioni', investment.bondsPercent],
        ['Titoli di stato', investment.governmentBondsPercent],
        ['Liquidità', investment.cashPercent],
        ['Altro', investment.otherPercent],
    ]
        .filter(([, percentage]) => Number(percentage) > 0)
        .map(([assetClass, percentage]) => ({
            ...emptyComponent,
            assetClass: String(assetClass),
            percentage: String(percentage),
        }));
    return legacy.length ? legacy : [{ ...emptyComponent }];
}

function snapshotRows(investment: Investment | null, frequency: 'YEARLY' | 'MONTHLY'): SnapshotForm[] {
    const rows = (investment?.snapshots || []).map((item) => ({
        month: item.month || '',
        investedCapital: item.investedCapital == null ? '' : String(item.investedCapital),
        value: item.value == null ? '' : String(item.value),
        currentValue: item.currentValue == null ? '' : String(item.currentValue),
    }));

    if (rows.length > 0) return rows;

    const currentYear = new Date().getFullYear();
    const currentMonth = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return [
        {
            ...emptySnapshot,
            month: frequency === 'YEARLY' ? String(currentYear) : currentMonth,
        },
    ];
}

function nextPeriod(lastPeriod: string, frequency: 'YEARLY' | 'MONTHLY'): string {
    const currentYear = new Date().getFullYear();
    if (frequency === 'YEARLY') {
        const year = Number.parseInt(lastPeriod, 10);
        if (!isNaN(year) && year >= 1990 && year <= 2100) {
            return String(year + 1);
        }
        return String(currentYear);
    } else {
        if (!lastPeriod) {
            return `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        }
        const [year, monthNumber] = lastPeriod.split('-').map(Number);
        if (!year || !monthNumber) {
            return `${currentYear}-01`;
        }
        const date = new Date(year, monthNumber, 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
}

export default function InvestmentForm({ investment, saving, onCancel, onSave }: Props) {
    const [form, setForm] = useState<FormState>(() => {
        const isYearlyDefault =
            investment?.trackingFrequency === 'YEARLY' || (!investment?.trackingFrequency && investment?.type === 'ROBO_ADVISOR');
        const freq: 'YEARLY' | 'MONTHLY' = investment?.trackingFrequency || (isYearlyDefault ? 'YEARLY' : 'MONTHLY');

        if (!investment) {
            const currentYear = new Date().getFullYear();
            return {
                name: '',
                type: 'ROBO_ADVISOR' as InvestmentType,
                ticker: '',
                currentValue: '',
                investedCapital: '',
                pacActive: false,
                recurringAmount: '',
                recurringDay: '1',
                trackingFrequency: 'YEARLY',
                components: [{ ...emptyComponent }],
                snapshots: [{ ...emptySnapshot, month: String(currentYear) }],
            };
        }

        return {
            name: investment.name,
            type: investment.type,
            ticker: investment.ticker || '',
            currentValue: String(investment.currentValue),
            investedCapital: String(investment.investedCapital),
            pacActive: investment.pacActive,
            recurringAmount: investment.recurringAmount ? String(investment.recurringAmount) : '',
            recurringDay: investment.recurringDay ? String(investment.recurringDay) : '1',
            trackingFrequency: freq,
            components: componentRows(investment),
            snapshots: snapshotRows(investment, freq),
        };
    });

    const [activeTab, setActiveTab] = useState<'MAIN' | 'HISTORY' | 'PAC'>('MAIN');

    // Total % of portfolio components
    const allocationTotal = useMemo(() => {
        return form.components.reduce((sum, item) => sum + toMoney(item.percentage), 0);
    }, [form.components]);

    // Handle type change: auto switch frequency to YEARLY for Roboadvisor/Pension if not set
    const handleTypeChange = (newType: InvestmentType) => {
        const shouldBeYearly = newType === 'ROBO_ADVISOR' || newType === 'PENSION';
        setForm((curr) => {
            const nextFreq = shouldBeYearly ? 'YEARLY' : curr.trackingFrequency;
            return {
                ...curr,
                type: newType,
                trackingFrequency: nextFreq,
            };
        });
    };

    const handleFrequencyChange = (newFreq: 'YEARLY' | 'MONTHLY') => {
        setForm((curr) => {
            // Update snapshot periods if empty or changing pattern
            const currentYear = new Date().getFullYear();
            const currentMonth = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            const updatedSnapshots = curr.snapshots.map((snap) => {
                if (!snap.month) {
                    return { ...snap, month: newFreq === 'YEARLY' ? String(currentYear) : currentMonth };
                }
                if (newFreq === 'YEARLY' && snap.month.includes('-')) {
                    return { ...snap, month: snap.month.split('-')[0] };
                }
                if (newFreq === 'MONTHLY' && !snap.month.includes('-')) {
                    return { ...snap, month: `${snap.month}-01` };
                }
                return snap;
            });

            return {
                ...curr,
                trackingFrequency: newFreq,
                snapshots: updatedSnapshots,
            };
        });
    };

    const updateComponent = (index: number, patch: Partial<PacComponentForm>) => {
        setForm((current) => ({
            ...current,
            components: current.components.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        }));
    };

    const removeComponent = (index: number) => {
        setForm((current) => ({
            ...current,
            components: current.components.filter((_, i) => i !== index),
        }));
    };

    const addComponent = () => {
        setForm((current) => ({
            ...current,
            components: [...current.components, { ...emptyComponent }],
        }));
    };

    const updateSnapshot = (index: number, patch: Partial<SnapshotForm>) => {
        setForm((current) => ({
            ...current,
            snapshots: current.snapshots.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        }));
    };

    const removeSnapshot = (index: number) => {
        setForm((current) => ({
            ...current,
            snapshots: current.snapshots.filter((_, i) => i !== index),
        }));
    };

    const addSnapshot = () => {
        setForm((current) => {
            const last = [...current.snapshots].reverse().find((item) => item.month);
            const nextP = nextPeriod(last?.month || '', current.trackingFrequency);
            return {
                ...current,
                snapshots: [
                    ...current.snapshots,
                    {
                        ...emptySnapshot,
                        month: nextP,
                        investedCapital: current.pacActive && current.trackingFrequency === 'MONTHLY' ? current.recurringAmount : '',
                    },
                ],
            };
        });
    };

    // Helper to auto sync main values from history
    const syncFromSnapshots = () => {
        const sorted = [...form.snapshots]
            .filter((s) => s.month && s.month.trim() !== '')
            .sort((a, b) => a.month.localeCompare(b.month));

        if (sorted.length === 0) return;

        const sumInvested = sorted.reduce((sum, s) => sum + toMoney(s.investedCapital), 0);
        const last = sorted[sorted.length - 1];
        const lastVal = last.currentValue ? toMoney(last.currentValue) : toMoney(last.value);

        setForm((current) => ({
            ...current,
            investedCapital: sumInvested > 0 ? String(sumInvested) : current.investedCapital,
            currentValue: lastVal > 0 ? String(lastVal) : current.currentValue,
        }));
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();

        const components: InvestmentComponent[] = form.components
            .filter((item) => item.assetClass || item.name || item.ticker || item.percentage || item.currentValue)
            .map((item) => ({
                assetClass: item.assetClass || 'Altro',
                name: item.name || null,
                ticker: item.ticker || null,
                percentage: toNullableNumber(item.percentage),
                currentValue: toNullableNumber(item.currentValue),
            }));

        const snapshots: InvestmentSnapshot[] = form.snapshots
            .filter((item) => item.month && item.month.trim() !== '')
            .map((item) => ({
                month: item.month.trim(),
                investedCapital: toNullableNumber(item.investedCapital),
                value: toNullableNumber(item.value || item.currentValue),
                currentValue: toNullableNumber(item.currentValue || item.value),
            }));

        await onSave({
            name: form.name.trim(),
            type: form.type,
            ticker: form.ticker.trim() || null,
            currentValue: toMoney(form.currentValue),
            investedCapital: toMoney(form.investedCapital),
            pacActive: form.pacActive,
            recurringAmount: form.pacActive ? toNullableNumber(form.recurringAmount) : null,
            recurringDay: form.pacActive ? Number.parseInt(form.recurringDay, 10) || 1 : null,
            trackingFrequency: form.trackingFrequency,
            components,
            snapshots,
        });
    };



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 tracking-tight">
                            {investment ? 'Modifica Investimento' : 'Nuovo Investimento / PAC'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Gestisci il tuo portafoglio, Roboadvisor e andamento nel tempo
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="px-5 pt-3 pb-0 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('MAIN')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                                activeTab === 'MAIN'
                                    ? 'border-gray-900 text-gray-900 bg-white shadow-xs'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            1. Dati Principali
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('HISTORY')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'HISTORY'
                                    ? 'border-gray-900 text-gray-900 bg-white shadow-xs'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <Calendar size={13} />
                            2. Storico & Report {form.trackingFrequency === 'YEARLY' ? '(Annuale)' : '(Mensile)'}
                            {form.snapshots.filter((s) => s.month).length > 0 && (
                                <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold flex items-center justify-center text-gray-700">
                                    {form.snapshots.filter((s) => s.month).length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('PAC')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'PAC'
                                    ? 'border-gray-900 text-gray-900 bg-white shadow-xs'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            3. PAC & Composizione
                            {form.pacActive && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* TAB 1: MAIN INFO */}
                    {activeTab === 'MAIN' && (
                        <div className="space-y-4">
                            {/* Investment Type Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Tipo di investimento
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {investmentTypes.map((typeItem) => {
                                        const Icon = typeItem.icon;
                                        const isSelected = form.type === typeItem.value;
                                        return (
                                            <button
                                                key={typeItem.value}
                                                type="button"
                                                onClick={() => handleTypeChange(typeItem.value)}
                                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSelected
                                                        ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full mb-1">
                                                    <span className="text-xs font-bold">{typeItem.label}</span>
                                                    <Icon
                                                        size={15}
                                                        className={isSelected ? 'text-gray-200' : 'text-gray-400'}
                                                    />
                                                </div>
                                                <p
                                                    className={`text-[10px] leading-tight truncate ${
                                                        isSelected ? 'text-gray-300' : 'text-gray-400'
                                                    }`}
                                                >
                                                    {typeItem.desc}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Name & Ticker */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Nome Investimento <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        placeholder={
                                            form.type === 'ROBO_ADVISOR'
                                                ? 'Es. Moneyfarm Portafoglio 6'
                                                : form.type === 'ETF'
                                                ? 'Es. Vanguard FTSE All-World (VWCE)'
                                                : 'Es. Investimento'
                                        }
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Piattaforma o Ticker
                                    </label>
                                    <input
                                        type="text"
                                        value={form.ticker}
                                        onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                                        placeholder="Es. Moneyfarm, VWCE, Degiro"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Tracking Frequency Selector */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <label className="block text-xs font-bold text-gray-900 mb-1">
                                    Frequenza Report & Storico
                                </label>
                                <p className="text-[11px] text-gray-500 mb-3">
                                    Scegli come inserire e visualizzare l&apos;andamento del capitale nel tempo.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleFrequencyChange('YEARLY')}
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                                            form.trackingFrequency === 'YEARLY'
                                                ? 'border-gray-900 bg-white ring-2 ring-gray-900 text-gray-900'
                                                : 'border-gray-200 bg-white/60 text-gray-600 hover:bg-white'
                                        }`}
                                    >
                                        <Calendar size={18} className="text-gray-900 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                                Report Anno per Anno
                                                {form.type === 'ROBO_ADVISOR' && (
                                                    <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                                        Consigliato
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Ideale per Roboadvisor (es. Moneyfarm) o fondi pensione. Inserisci i versamenti annuali e il controvalore a fine anno.
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleFrequencyChange('MONTHLY')}
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                                            form.trackingFrequency === 'MONTHLY'
                                                ? 'border-gray-900 bg-white ring-2 ring-gray-900 text-gray-900'
                                                : 'border-gray-200 bg-white/60 text-gray-600 hover:bg-white'
                                        }`}
                                    >
                                        <CalendarDays size={18} className="text-gray-900 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">
                                                Report Mese per Mese
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Ideale per PAC ETF mensili, trading o monitoraggio frequente mese dopo mese.
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Core Financial Values */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-medium text-gray-700">
                                            Controvalore Attuale (€) <span className="text-red-500">*</span>
                                        </label>
                                        {form.snapshots.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={syncFromSnapshots}
                                                className="text-[11px] text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <RefreshCw size={10} /> Sincronizza da storico
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.currentValue}
                                        onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                                        required
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Valore odierno del portafoglio / investimento</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Capitale Investito / Totale Versato (€) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.investedCapital}
                                        onChange={(e) => setForm({ ...form, investedCapital: e.target.value })}
                                        required
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Totale dei soldi versati da te nel tempo</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: HISTORICAL SNAPSHOTS */}
                    {activeTab === 'HISTORY' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900">
                                        {form.trackingFrequency === 'YEARLY'
                                            ? 'Report Anno per Anno'
                                            : 'Report Mese per Mese'}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {form.trackingFrequency === 'YEARLY'
                                            ? 'Inserisci i versamenti effettuati in ciascun anno e il controvalore a fine anno (es. dall\'estratto conto del Roboadvisor).'
                                            : 'Inserisci i versamenti mensili e il valore registrato a fine mese.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={syncFromSnapshots}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                        title="Aggiorna il Controvalore e il Capitale versato nei Dati Principali con i totali dello storico"
                                    >
                                        <Sparkles size={13} className="text-amber-500" />
                                        Aggiorna totali
                                    </button>
                                </div>
                            </div>

                            {/* Snapshots Table */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-[100px_1fr_1fr_40px] sm:grid-cols-[140px_1fr_1fr_40px] gap-2 px-1 text-[11px] font-semibold text-gray-500">
                                    <span>{form.trackingFrequency === 'YEARLY' ? 'Anno' : 'Mese'}</span>
                                    <span>Versamenti nel periodo (€)</span>
                                    <span>Valore a fine periodo (€)</span>
                                    <span></span>
                                </div>

                                {form.snapshots.map((snap, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[100px_1fr_1fr_40px] sm:grid-cols-[140px_1fr_1fr_40px] gap-2 items-center bg-gray-50/70 p-2 rounded-xl border border-gray-200"
                                    >
                                        {form.trackingFrequency === 'YEARLY' ? (
                                            <input
                                                type="number"
                                                min="1990"
                                                max="2100"
                                                value={snap.month}
                                                onChange={(e) => updateSnapshot(index, { month: e.target.value })}
                                                placeholder="2024"
                                                className={inputClass}
                                                required
                                            />
                                        ) : (
                                            <input
                                                type="month"
                                                value={snap.month}
                                                onChange={(e) => updateSnapshot(index, { month: e.target.value })}
                                                className={inputClass}
                                                required
                                            />
                                        )}

                                        <input
                                            type="number"
                                            step="0.01"
                                            value={snap.investedCapital}
                                            onChange={(e) =>
                                                updateSnapshot(index, {
                                                    investedCapital: e.target.value,
                                                })
                                            }
                                            placeholder="Versato"
                                            className={inputClass}
                                        />

                                        <input
                                            type="number"
                                            step="0.01"
                                            value={snap.currentValue || snap.value}
                                            onChange={(e) =>
                                                updateSnapshot(index, {
                                                    currentValue: e.target.value,
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="Valore finale"
                                            className={inputClass}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeSnapshot(index)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                                            title="Rimuovi rilevazione"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addSnapshot}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 hover:border-gray-500 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <Plus size={14} />
                                    {form.trackingFrequency === 'YEARLY' ? 'Aggiungi Anno successivo' : 'Aggiungi Mese successivo'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PAC & PORTFOLIO ALLOCATION */}
                    {activeTab === 'PAC' && (
                        <div className="space-y-5">
                            {/* PAC Section */}
                            <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-900">Piano di Accumulo (PAC)</h3>
                                        <p className="text-[11px] text-gray-500">
                                            Attiva se versi una quota periodica automatica ogni mese.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.pacActive}
                                            onChange={(e) => setForm({ ...form, pacActive: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                    </label>
                                </div>

                                {form.pacActive && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Importo mensile ricorrente (€)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form.recurringAmount}
                                                onChange={(e) => setForm({ ...form, recurringAmount: e.target.value })}
                                                placeholder="Es. 200.00"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Giorno del mese del versamento
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="28"
                                                value={form.recurringDay}
                                                onChange={(e) => setForm({ ...form, recurringDay: e.target.value })}
                                                placeholder="1"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Internal Asset Allocation Components */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-900">
                                            Composizione Portafoglio / Asset Allocation
                                        </h3>
                                        <p className="text-[11px] text-gray-500">
                                            Opzionale: utilissimo per Roboadvisor o portafogli con asset miste (es. 70% Azioni, 30% Obbligazioni).
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                                Math.round(allocationTotal) === 100
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            Totale: {allocationTotal.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {form.components.map((comp, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-1 sm:grid-cols-[140px_1fr_90px_40px] gap-2 p-3 bg-gray-50/70 border border-gray-200 rounded-xl items-center"
                                        >
                                            <select
                                                value={comp.assetClass}
                                                onChange={(e) => updateComponent(index, { assetClass: e.target.value })}
                                                className={inputClass}
                                            >
                                                {componentAssetClasses.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                type="text"
                                                value={comp.name || ''}
                                                onChange={(e) => updateComponent(index, { name: e.target.value })}
                                                placeholder="Nome / Note (es. Azionario Globale)"
                                                className={inputClass}
                                            />

                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={comp.percentage || ''}
                                                    onChange={(e) => updateComponent(index, { percentage: e.target.value })}
                                                    placeholder="%"
                                                    className={inputClass}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeComponent(index)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addComponent}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 hover:border-gray-500 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        Aggiungi Componente Asset Class
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                            Annulla
                        </button>
                        <div className="flex items-center gap-2">
                            {activeTab !== 'MAIN' && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(activeTab === 'PAC' ? 'HISTORY' : 'MAIN')}
                                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Indietro
                                </button>
                            )}
                            {activeTab !== 'PAC' ? (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(activeTab === 'MAIN' ? 'HISTORY' : 'PAC')}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors cursor-pointer"
                                >
                                    Avanti
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {investment ? 'Salva Modifiche' : 'Crea Investimento'}
                                </button>
                            )}
                            {activeTab === 'MAIN' && (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-sm ml-1"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {investment ? 'Salva' : 'Salva Rapido'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
