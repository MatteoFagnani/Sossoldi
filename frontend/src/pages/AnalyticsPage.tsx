import { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
    AreaChart, Area, CartesianGrid,
} from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowRight, Loader2, Scale } from 'lucide-react';
import { analyticsService } from '../services/services';
import type { CashFlowData, CategoryFlowItem } from '../types';

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

// ─── Sankey-flow custom SVG component ───────────────────────────────────────
function FlowDiagram({ data }: { data: CashFlowData }) {
    const { incomeSources, expenseDestinations, totalIncome, totalExpense } = data;
    const NODE_W = 180;
    const GAP = 220;
    const CANVAS_W = NODE_W * 2 + GAP * 2 + 40;
    const ROW_H = 36;
    const MIN_H = 320;
    const incomeH = Math.max(incomeSources.length * ROW_H + 16, MIN_H / 2);
    const expenseH = Math.max(expenseDestinations.length * ROW_H + 16, MIN_H / 2);
    const CANVAS_H = Math.max(incomeH, expenseH) + 60;

    const centerY = CANVAS_H / 2;

    // Build income node rects
    const incomeItems = incomeSources.map((s) => {
        const barH = totalIncome > 0 ? Math.max((s.amount / totalIncome) * (CANVAS_H - 80), 8) : 8;
        return { ...s, barH, y: 0, color: s.categoryColor };
    });
    // Stack them
    let iy = (CANVAS_H - incomeItems.reduce((a, b) => a + b.barH + 4, 0)) / 2;
    incomeItems.forEach(item => { item.y = iy; iy += item.barH + 4; });

    const expenseItems = expenseDestinations.slice(0, 10).map(s => {
        const barH = totalExpense > 0 ? Math.max((s.amount / totalExpense) * (CANVAS_H - 80), 8) : 8;
        return { ...s, barH, y: 0, color: s.categoryColor };
    });
    let ey = (CANVAS_H - expenseItems.reduce((a, b) => a + b.barH + 4, 0)) / 2;
    expenseItems.forEach(item => { item.y = ey; ey += item.barH + 4; });

    const centerX = CANVAS_W / 2;
    const centerBoxH = 60;
    const centerBoxY = centerY - centerBoxH / 2;

    return (
        <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className="w-full" style={{ maxHeight: '440px' }}>
            {/* Income bars (left column) */}
            {incomeItems.map((item) => {
                const midY = item.y + item.barH / 2;
                const cx1 = NODE_W + 20;
                const cx2 = centerX - 60;
                return (
                    <g key={item.categoryId}>
                        {/* Bar */}
                        <rect x={0} y={item.y} width={NODE_W} height={item.barH} rx={6}
                            fill={item.color} fillOpacity={0.85} />
                        {/* Label */}
                        <text x={NODE_W - 6} y={item.y + item.barH / 2 + 5} textAnchor="end"
                            fontSize={11} fill="#111827" fontWeight={500}>
                            {item.categoryName}
                        </text>
                        {/* Bezier path to center */}
                        <path d={`M${NODE_W},${midY} C${cx1},${midY} ${cx2},${centerY} ${centerX - 60},${centerY}`}
                            stroke={item.color} strokeWidth={Math.max(item.barH * 0.5, 2)} strokeOpacity={0.25}
                            fill="none" />
                    </g>
                );
            })}

            {/* Center node "Bilancio" */}
            <rect x={centerX - 60} y={centerBoxY} width={120} height={centerBoxH} rx={10}
                fill="#111827" />
            <text x={centerX} y={centerBoxY + 22} textAnchor="middle" fontSize={11} fill="#9ca3af" fontWeight={500}>
                Bilancio
            </text>
            <text x={centerX} y={centerBoxY + 42} textAnchor="middle" fontSize={13} fill="white" fontWeight={700}>
                {fmt(data.netFlow)}
            </text>

            {/* Expense bars (right column) */}
            {expenseItems.map((item) => {
                const midY = item.y + item.barH / 2;
                const cx1 = centerX + 60;
                const cx2 = CANVAS_W - NODE_W - 20;
                return (
                    <g key={item.categoryId}>
                        <rect x={CANVAS_W - NODE_W} y={item.y} width={NODE_W} height={item.barH} rx={6}
                            fill={item.color} fillOpacity={0.85} />
                        <text x={CANVAS_W - NODE_W + 6} y={item.y + item.barH / 2 + 5} textAnchor="start"
                            fontSize={11} fill="#111827" fontWeight={500}>
                            {item.categoryName}
                        </text>
                        <path d={`M${centerX + 60},${centerY} C${cx1},${centerY} ${cx2},${midY} ${CANVAS_W - NODE_W},${midY}`}
                            stroke={item.color} strokeWidth={Math.max(item.barH * 0.5, 2)} strokeOpacity={0.25}
                            fill="none" />
                    </g>
                );
            })}

            {/* Column labels */}
            <text x={NODE_W / 2} y={CANVAS_H - 10} textAnchor="middle" fontSize={10} fill="#6b7280" fontWeight={600}>
                ENTRATE
            </text>
            <text x={CANVAS_W - NODE_W / 2} y={CANVAS_H - 10} textAnchor="middle" fontSize={10} fill="#6b7280" fontWeight={600}>
                USCITE
            </text>
        </svg>
    );
}

// ─── Category bar row ─────────────────────────────────────────────────────────
function CategoryRow({ item, max }: { item: CategoryFlowItem; max: number }) {
    const width = max > 0 ? (item.amount / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.categoryColor }} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate">{item.categoryName}</span>
                    <span className="text-sm text-gray-600 ml-2 shrink-0">{fmt(item.amount)}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, backgroundColor: item.categoryColor }} />
                </div>
            </div>
            <span className="text-xs text-gray-400 w-10 text-right shrink-0">{item.percentage.toFixed(0)}%</span>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const [viewType, setViewType] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [data, setData] = useState<CashFlowData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const YEARS = useMemo(() => Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => 2020 + i), []);

    useEffect(() => {
        let active = true;
        const yearVal = selectedYear;
        const monthVal = viewType === 'MONTH' ? selectedMonth : undefined;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const result = await analyticsService.getCashFlow(yearVal, monthVal);
                if (active) setData(result);
            } catch {
                if (active) setError('Errore durante il caricamento dei dati analitici.');
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => { active = false; };
    }, [viewType, selectedMonth, selectedYear]);

    const prevMonth = () => {
        if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
        else setSelectedMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
        else setSelectedMonth(m => m + 1);
    };

    const maxIncome = data ? Math.max(...data.incomeSources.map(i => i.amount), 1) : 1;
    const maxExpense = data ? Math.max(...data.expenseDestinations.map(i => i.amount), 1) : 1;

    return (
        <div className="space-y-5 pb-10">
            {/* ── Period selector ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    {(['MONTH', 'YEAR'] as const).map(v => (
                        <button key={v} onClick={() => setViewType(v)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewType === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {v === 'MONTH' ? 'Mensile' : 'Annuale'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {viewType === 'MONTH' && (
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
                            <button onClick={prevMonth} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50">
                                <ChevronLeft size={15} />
                            </button>
                            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                                className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer px-1">
                                {MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                            </select>
                            <button onClick={nextMonth} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50">
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
                        <button onClick={() => setSelectedYear(y => Math.max(2020, y - 1))} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50">
                            <ChevronLeft size={15} />
                        </button>
                        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                            className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer px-1">
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={() => setSelectedYear(y => Math.min(CURRENT_YEAR, y + 1))} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50">
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-24"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
            )}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
            )}

            {!loading && data && (
                <>
                    {/* ── KPI row ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={16} className="text-emerald-600" />
                                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Entrate</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">{fmt(data.totalIncome)}</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown size={16} className="text-red-500" />
                                <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Uscite</span>
                            </div>
                            <p className="text-2xl font-bold text-red-600">{fmt(data.totalExpense)}</p>
                        </div>
                        <div className={`${data.netFlow >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-2xl p-5`}>
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowRight size={16} className={data.netFlow >= 0 ? 'text-blue-600' : 'text-orange-500'} />
                                <span className={`text-xs font-semibold uppercase tracking-wide ${data.netFlow >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>Flusso netto</span>
                            </div>
                            <p className={`text-2xl font-bold ${data.netFlow >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{fmt(data.netFlow)}</p>
                        </div>
                        <div className="bg-gray-900 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale size={16} className="text-gray-400" />
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tasso di risparmio</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{data.savingsRate.toFixed(1)}%</p>
                        </div>
                    </div>

                    {/* ── Flow diagram ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-1">Flusso di cassa</h2>
                        <p className="text-xs text-gray-500 mb-5">Visualizzazione del percorso del denaro: da dove arriva a dove va.</p>
                        {data.totalIncome === 0 && data.totalExpense === 0 ? (
                            <div className="text-center py-10 text-sm text-gray-400">Nessun dato disponibile per il periodo selezionato.</div>
                        ) : (
                            <FlowDiagram data={data} />
                        )}
                    </div>

                    {/* ── Category breakdowns ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Income */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <h2 className="text-base font-semibold text-gray-900">Fonti di entrata</h2>
                            </div>
                            {data.incomeSources.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">Nessuna entrata nel periodo.</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.incomeSources.map(item => (
                                        <CategoryRow key={item.categoryId} item={item} max={maxIncome} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Expense */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <h2 className="text-base font-semibold text-gray-900">Destinazioni di spesa</h2>
                            </div>
                            {data.expenseDestinations.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">Nessuna uscita nel periodo.</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.expenseDestinations.map(item => (
                                        <CategoryRow key={item.categoryId} item={item} max={maxExpense} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Monthly trend (yearly view only) ── */}
                    {viewType === 'YEAR' && data.monthlyTrend.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Andamento mensile {selectedYear}</h2>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={data.monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}
                                        tickFormatter={v => `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                    <Tooltip formatter={(value) => [fmt(Number(value ?? 0)), '']} labelStyle={{ fontWeight: 600 }} />
                                    <Legend iconType="circle" iconSize={8} />
                                    <Area type="monotone" dataKey="income" name="Entrate" stroke="#10b981" strokeWidth={2} fill="url(#colIncome)" dot={false} />
                                    <Area type="monotone" dataKey="expense" name="Uscite" stroke="#f43f5e" strokeWidth={2} fill="url(#colExpense)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>

                            {/* Net flow bars */}
                            <h3 className="text-sm font-semibold text-gray-700 mt-6 mb-3">Flusso netto mensile</h3>
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
                                        tickFormatter={v => `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                    <Tooltip formatter={(value) => [fmt(Number(value ?? 0)), '']} />
                                    <Bar dataKey="net" name="Netto" radius={[4, 4, 0, 0]}>
                                        {data.monthlyTrend.map((entry, i) => (
                                            <Cell key={i} fill={entry.net >= 0 ? '#10b981' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
