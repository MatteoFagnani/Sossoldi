import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    TrendingUp,
    TrendingDown,
    Calendar,
    CalendarDays,
    Bot,
    Wallet,
    Layers,
    BarChart2,
    PieChart as PieChartIcon,
    Coins,
    ShieldCheck,
    Landmark,
    Search,
    RefreshCw,
    ExternalLink,
    Filter,
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { investmentService } from '../services/services';
import InvestmentForm from '../components/investments/InvestmentForm';
import InvestmentReportModal from '../components/investments/InvestmentReportModal';
import type { Investment, InvestmentPayload, InvestmentType } from '../types';

const typeMetadata: Record<InvestmentType, { label: string; icon: typeof Wallet; color: string; bg: string }> = {
    ROBO_ADVISOR: { label: 'Roboadvisor', icon: Bot, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    ETF: { label: 'ETF', icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    STOCK: { label: 'Azioni', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    FUND: { label: 'Fondi', icon: PieChartIcon, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
    CRYPTO: { label: 'Crypto', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    PENSION: { label: 'Pensione', icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
    BOND: { label: 'Obbligazioni', icon: Landmark, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
    OTHER: { label: 'Altro', icon: Layers, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};

const CHART_COLORS = [
    '#111827', // dark
    '#4f46e5', // indigo
    '#059669', // emerald
    '#2563eb', // blue
    '#d97706', // amber
    '#7c3aed', // violet
    '#0891b2', // cyan
    '#dc2626', // red
    '#6b7280', // gray
];

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [reportModalInvestment, setReportModalInvestment] = useState<Investment | null>(null);

    // Filters and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
    const [historyViewMode, setHistoryViewMode] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');

    const loadInvestments = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await investmentService.getAll();
            setInvestments(data);
        } catch {
            setError('Errore durante il caricamento degli investimenti.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvestments();
    }, []);

    // 4 Key KPIs
    const totalCurrentValue = useMemo(() => {
        return investments.reduce((sum, item) => sum + item.currentValue, 0);
    }, [investments]);

    const totalInvestedCapital = useMemo(() => {
        return investments.reduce((sum, item) => sum + item.investedCapital, 0);
    }, [investments]);

    const totalGainLoss = useMemo(() => {
        return totalCurrentValue - totalInvestedCapital;
    }, [totalCurrentValue, totalInvestedCapital]);

    const totalGainLossPercent = useMemo(() => {
        if (totalInvestedCapital <= 0) return 0;
        return (totalGainLoss / totalInvestedCapital) * 100;
    }, [totalGainLoss, totalInvestedCapital]);

    const activePacMonthly = useMemo(() => {
        return investments
            .filter((item) => item.pacActive)
            .reduce((sum, item) => sum + (item.recurringAmount || 0), 0);
    }, [investments]);

    const pacCount = useMemo(() => {
        return investments.filter((item) => item.pacActive).length;
    }, [investments]);

    // Filtered investments list
    const filteredInvestments = useMemo(() => {
        return investments.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.ticker && item.ticker.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = selectedTypeFilter === 'ALL' || item.type === selectedTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [investments, searchTerm, selectedTypeFilter]);

    // Aggregate Historical Data (Yearly vs Monthly)
    const historyChartData = useMemo(() => {
        if (investments.length === 0) return [];

        if (historyViewMode === 'YEARLY') {
            // Aggregate year by year across all investments
            const yearsSet = new Set<string>();

            // Collect all years referenced in snapshots or current year
            investments.forEach((inv) => {
                const snaps = inv.snapshots || [];
                snaps.forEach((s) => {
                    if (!s.month) return;
                    const y = s.month.includes('-') ? s.month.split('-')[0] : s.month;
                    yearsSet.add(y);
                });
            });

            if (yearsSet.size === 0) {
                const curY = String(new Date().getFullYear());
                yearsSet.add(curY);
            }

            const sortedYears = Array.from(yearsSet).sort();

            // For each year, calculate portfolio cumulative invested & value
            return sortedYears.map((y) => {
                let yearInvested = 0;
                let yearValue = 0;

                investments.forEach((inv) => {
                    const snaps = [...(inv.snapshots || [])]
                        .filter((s) => s.month)
                        .sort((a, b) => a.month.localeCompare(b.month));

                    if (snaps.length === 0) {
                        yearInvested += inv.investedCapital;
                        yearValue += inv.currentValue;
                        return;
                    }

                    // Sum of contributions up to year y
                    let cumInv = 0;
                    let lastVal: number | null = null;

                    snaps.forEach((s) => {
                        const snapY = s.month.includes('-') ? s.month.split('-')[0] : s.month;
                        if (snapY <= y) {
                            cumInv += s.investedCapital || 0;
                            lastVal = s.currentValue != null ? s.currentValue : (s.value ?? null);
                        }
                    });

                    yearInvested += cumInv > 0 ? cumInv : inv.investedCapital;
                    yearValue += lastVal != null ? lastVal : inv.currentValue;
                });

                return {
                    period: y,
                    'Capitale Versato': yearInvested,
                    'Controvalore': yearValue,
                };
            });
        } else {
            // Monthly view
            const monthMap = new Map<string, { period: string; invested: number; value: number }>();

            investments.forEach((inv) => {
                const snaps = inv.snapshots || [];
                snaps.forEach((s) => {
                    if (!s.month) return;
                    // Format into YYYY-MM
                    const mKey = s.month.includes('-') ? s.month : `${s.month}-12`;
                    const existing = monthMap.get(mKey) || { period: mKey, invested: 0, value: 0 };
                    existing.invested += s.investedCapital || 0;
                    existing.value += s.currentValue != null ? s.currentValue : (s.value || 0);
                    monthMap.set(mKey, existing);
                });
            });

            let runningInvested = 0;
            return Array.from(monthMap.values())
                .sort((a, b) => a.period.localeCompare(b.period))
                .map((row) => {
                    runningInvested += row.invested;
                    return {
                        period: row.period,
                        'Capitale Versato': runningInvested,
                        'Controvalore': row.value,
                    };
                });
        }
    }, [investments, historyViewMode]);

    // Aggregate Asset Allocation (Components + Type fallbacks)
    const assetAllocationData = useMemo(() => {
        const map = new Map<string, number>();

        investments.forEach((inv) => {
            const comps = inv.components || [];
            if (comps.length > 0) {
                comps.forEach((comp) => {
                    const key = comp.assetClass || 'Altro';
                    const amount =
                        comp.currentValue != null && comp.currentValue > 0
                            ? comp.currentValue
                            : inv.currentValue * ((comp.percentage || 0) / 100);
                    map.set(key, (map.get(key) || 0) + amount);
                });
            } else {
                const key = typeMetadata[inv.type]?.label || 'Altro';
                map.set(key, (map.get(key) || 0) + inv.currentValue);
            }
        });

        const total = Array.from(map.values()).reduce((sum, val) => sum + val, 0);

        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value: Math.round(value),
                percentage: total > 0 ? (value / total) * 100 : 0,
            }))
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [investments]);

    // Actions
    const handleOpenCreate = () => {
        setEditingInvestment(null);
        setShowForm(true);
    };

    const handleOpenEdit = (investment: Investment) => {
        setEditingInvestment(investment);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingInvestment(null);
    };

    const handleSave = async (payload: InvestmentPayload) => {
        setSaving(true);
        setError('');
        try {
            if (editingInvestment) {
                await investmentService.update(editingInvestment.id, payload);
            } else {
                await investmentService.create(payload);
            }
            handleCloseForm();
            await loadInvestments();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
            setError(data ? Object.values(data).join('. ') : 'Errore durante il salvataggio.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (investment: Investment) => {
        if (!confirm(`Sei sicuro di voler eliminare "${investment.name}"?`)) return;
        try {
            await investmentService.remove(investment.id);
            if (reportModalInvestment?.id === investment.id) {
                setReportModalInvestment(null);
            }
            await loadInvestments();
        } catch {
            setError('Impossibile eliminare l\'investimento.');
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Top Toolbar: Search & Quick Actions */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cerca investimento o ticker..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                    />
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                    <Plus size={15} />
                    Nuovo Investimento
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-500 hover:text-red-800">
                        &times;
                    </button>
                </div>
            )}

            {/* 4 Core Financial KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Controvalore Totale */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Patrimonio Investito</span>
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 tracking-tight mt-2">
                        {formatCurrency(totalCurrentValue)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span
                            className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                                totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                        >
                            {totalGainLoss >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {totalGainLoss >= 0 ? '+' : ''}
                            {formatCurrency(totalGainLoss)}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">di plusvalenza</span>
                    </div>
                </div>

                {/* 2. Capitale Versato */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Capitale Versato</span>
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
                            <Landmark size={16} />
                        </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 tracking-tight mt-2">
                        {formatCurrency(totalInvestedCapital)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">Totale versamenti e contributi</p>
                </div>

                {/* 3. Rendimento Totale */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Rendimento Totale</span>
                        <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                totalGainLoss >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}
                        >
                            {totalGainLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p
                            className={`text-xl font-bold tracking-tight ${
                                totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                        >
                            {totalGainLoss >= 0 ? '+' : ''}
                            {totalGainLossPercent.toFixed(1)}%
                        </p>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">
                        Ritorno ponderato sul capitale
                    </p>
                </div>

                {/* 4. PAC Mensili Attivi */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">PAC Ricorrenti</span>
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
                            <RefreshCw size={16} />
                        </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 tracking-tight mt-2">
                        {formatCurrency(activePacMonthly)}
                        <span className="text-xs font-normal text-gray-400">/mese</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">
                        {pacCount} {pacCount === 1 ? 'piano attivo' : 'piani attivi'}
                    </p>
                </div>
            </div>

            {/* Visual Charts: Portfolio Evolution & Asset Allocation */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Evolution Chart (2/3 width) */}
                <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
                                Evoluzione del Portafoglio
                            </h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Andamento del capitale versato vs controvalore effettivo
                            </p>
                        </div>

                        {/* View Switcher: Yearly vs Monthly */}
                        <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setHistoryViewMode('YEARLY')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    historyViewMode === 'YEARLY'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                <Calendar size={13} />
                                Anno per anno
                            </button>
                            <button
                                type="button"
                                onClick={() => setHistoryViewMode('MONTHLY')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    historyViewMode === 'MONTHLY'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                <CalendarDays size={13} />
                                Mensile
                            </button>
                        </div>
                    </div>

                    <div className="h-64 sm:h-72 w-full">
                        {historyChartData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                <BarChart2 size={28} className="mb-2 opacity-40" />
                                <p className="text-xs">Nessun dato storico registrato.</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Aggiungi le rilevazioni anno per anno nei tuoi investimenti.
                                </p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                        tickFormatter={(val) => `€${(val / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        formatter={(val) => [formatCurrency(Number(val || 0)), '']}
                                        labelFormatter={(lbl) =>
                                            `${historyViewMode === 'YEARLY' ? 'Anno' : 'Periodo'}: ${lbl}`
                                        }
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '12px',
                                            borderColor: '#e5e7eb',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Capitale Versato"
                                        stroke="#9ca3af"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: '#9ca3af' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Controvalore"
                                        stroke="#111827"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#111827' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-3 text-xs border-t border-gray-100 pt-3">
                        <span className="flex items-center gap-2 text-gray-500 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                            Capitale Versato
                        </span>
                        <span className="flex items-center gap-2 text-gray-900 font-semibold">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-900 inline-block" />
                            Controvalore
                        </span>
                    </div>
                </div>

                {/* Asset Allocation Chart (1/3 width) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Asset Allocation</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            Composizione aggregata del portafoglio per classe di attivo
                        </p>
                    </div>

                    <div className="h-48 my-2">
                        {assetAllocationData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                <PieChartIcon size={28} className="mb-2 opacity-40" />
                                <p className="text-xs">Nessun investimento presente</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={assetAllocationData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={48}
                                        outerRadius={75}
                                        paddingAngle={3}
                                    >
                                        {assetAllocationData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val) => [formatCurrency(Number(val || 0)), '']}
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '12px',
                                            borderColor: '#e5e7eb',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Compact Legend */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {assetAllocationData.slice(0, 5).map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 truncate">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                    />
                                    <span className="text-gray-700 truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2 font-medium shrink-0">
                                    <span className="text-gray-900">{formatCurrency(item.value)}</span>
                                    <span className="text-gray-400 text-[11px]">
                                        ({item.percentage % 1 === 0 ? item.percentage.toFixed(0) : item.percentage.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category / Type Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-400 font-medium flex items-center gap-1 shrink-0 mr-1">
                    <Filter size={13} /> Filtra per:
                </span>
                <button
                    type="button"
                    onClick={() => setSelectedTypeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 cursor-pointer ${
                        selectedTypeFilter === 'ALL'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Tutti ({investments.length})
                </button>
                {Object.entries(typeMetadata).map(([typeKey, meta]) => {
                    const count = investments.filter((i) => i.type === typeKey).length;
                    if (count === 0 && selectedTypeFilter !== typeKey) return null;
                    return (
                        <button
                            key={typeKey}
                            type="button"
                            onClick={() => setSelectedTypeFilter(typeKey)}
                            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 cursor-pointer ${
                                selectedTypeFilter === typeKey
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {meta.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Investments Cards Grid */}
            <div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-2xl">
                        <Loader2 className="animate-spin text-gray-900 mb-2" size={24} />
                        <p className="text-xs text-gray-500 font-medium">Caricamento investimenti...</p>
                    </div>
                ) : filteredInvestments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 rounded-2xl text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
                            <Bot size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">
                            {searchTerm || selectedTypeFilter !== 'ALL'
                                ? 'Nessun investimento trovato con questi filtri'
                                : 'Nessun investimento o Roboadvisor configurato'}
                        </h3>
                        <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
                            {searchTerm || selectedTypeFilter !== 'ALL'
                                ? 'Prova a modificare i termini di ricerca o a reimpostare i filtri.'
                                : 'Aggiungi il tuo primo portafoglio Roboadvisor, ETF o fondo per monitorare rendimento e report anno per anno.'}
                        </p>
                        <button
                            onClick={handleOpenCreate}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                            <Plus size={15} />
                            Nuovo Investimento
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredInvestments.map((item) => {
                            const meta = typeMetadata[item.type] || typeMetadata.OTHER;
                            const TypeIcon = meta.icon;
                            const isYearly =
                                item.trackingFrequency === 'YEARLY' ||
                                (!item.trackingFrequency && item.type === 'ROBO_ADVISOR');
                            const isPositive = item.gainLoss >= 0;
                            const allocationPercent =
                                totalCurrentValue > 0 ? (item.currentValue / totalCurrentValue) * 100 : 0;
                            const snapshotCount = (item.snapshots || []).filter((s) => s.month).length;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        {/* Card Top: Type badge & Actions */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${meta.bg}`}
                                                >
                                                    <TypeIcon size={20} className={meta.color} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                                            {item.name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        <span className="text-[11px] text-gray-500 font-medium">
                                                            {meta.label}
                                                        </span>
                                                        {item.ticker && (
                                                            <>
                                                                <span className="text-gray-300">•</span>
                                                                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                                                    {item.ticker}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                                    title="Modifica"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Elimina"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Badges: Frequency & PAC */}
                                        <div className="flex items-center gap-1.5 flex-wrap mb-4">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                                                <Calendar size={11} />
                                                {isYearly ? 'Report Annuale' : 'Report Mensile'}
                                            </span>

                                            {item.pacActive && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                                                    PAC {formatCurrency(item.recurringAmount || 0)}/m
                                                </span>
                                            )}

                                            {snapshotCount > 0 && (
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    {snapshotCount} {snapshotCount === 1 ? 'anno registrato' : 'anni registrati'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Values Grid */}
                                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 mb-3">
                                            <div>
                                                <p className="text-[11px] font-medium text-gray-400">Controvalore</p>
                                                <p className="text-base font-bold text-gray-900 mt-0.5">
                                                    {formatCurrency(item.currentValue)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium text-gray-400">Capitale Versato</p>
                                                <p className="text-sm font-semibold text-gray-700 mt-0.5">
                                                    {formatCurrency(item.investedCapital)}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] font-medium text-gray-400">Rendimento Totale</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`text-xs font-bold ${
                                                                isPositive ? 'text-emerald-600' : 'text-red-600'
                                                            }`}
                                                        >
                                                            {isPositive ? '+' : ''}
                                                            {formatCurrency(item.gainLoss)}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                                                isPositive
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-red-50 text-red-700'
                                                            }`}
                                                        >
                                                            {isPositive ? '+' : ''}
                                                            {item.gainLossPercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Internal Components Pills */}
                                        {(item.components || []).length > 0 && (
                                            <div className="mb-3">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {(item.components || []).slice(0, 3).map((comp, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-md truncate max-w-[150px]"
                                                        >
                                                            {comp.assetClass}
                                                            {comp.percentage != null
                                                                ? ` ${Number(comp.percentage) % 1 === 0
                                                                      ? Number(comp.percentage).toFixed(0)
                                                                      : Number(comp.percentage).toFixed(2).replace(/\.?0+$/, '')}%`
                                                                : ''}
                                                        </span>
                                                    ))}
                                                    {(item.components || []).length > 3 && (
                                                        <span className="text-[10px] text-gray-400">
                                                            +{(item.components || []).length - 3} altri
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Portfolio Allocation Weight bar */}
                                        <div className="space-y-1 mb-2">
                                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                                                <span>Peso sul portafoglio</span>
                                                <span className="font-semibold text-gray-700">
                                                    {allocationPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gray-900 h-full rounded-full transition-all"
                                                    style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer: Open Report Modal Button */}
                                    <div className="pt-3 border-t border-gray-100 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setReportModalInvestment(item)}
                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-900 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                                        >
                                            <ExternalLink size={13} />
                                            {isYearly ? 'Vedi Report Anno per Anno' : 'Vedi Report & Storico'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showForm && (
                <InvestmentForm
                    investment={editingInvestment}
                    saving={saving}
                    onCancel={handleCloseForm}
                    onSave={handleSave}
                />
            )}

            {reportModalInvestment && (
                <InvestmentReportModal
                    investment={reportModalInvestment}
                    onClose={() => setReportModalInvestment(null)}
                    onEdit={(inv) => {
                        setReportModalInvestment(null);
                        handleOpenEdit(inv);
                    }}
                />
            )}
        </div>
    );
}
