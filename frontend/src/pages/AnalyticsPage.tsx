import { formatCurrency } from '../utils/formatters';
import { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
    AreaChart, Area, CartesianGrid,
} from 'recharts';
import {
    ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowRight, Loader2, Scale,
    Sparkles, ShieldCheck, CheckCircle2, AlertCircle, PiggyBank,
    Percent, Flame, ArrowUpRight, ArrowDownRight, RefreshCw, Info
} from 'lucide-react';
import { analyticsService } from '../services/services';
import type {
    AdvancedAnalyticsData,
    AiFinancialInsights,
    CategoryMoMChange,
} from '../types';

const MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const fmt = formatCurrency;

export default function AnalyticsPage() {
    const [viewType, setViewType] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [data, setData] = useState<AdvancedAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // AI Financial Insights state
    const [aiInsights, setAiInsights] = useState<AiFinancialInsights | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [aiError, setAiError] = useState('');

    const YEARS = useMemo(() => Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => 2020 + i), []);

    useEffect(() => {
        let active = true;
        const yearVal = selectedYear;
        const monthVal = viewType === 'MONTH' ? selectedMonth : undefined;

        const load = async () => {
            setLoading(true);
            setError('');
            // Reset AI insights when period changes so it matches the active period
            setAiInsights(null);
            setAiError('');

            try {
                const result = await analyticsService.getAdvanced(yearVal, monthVal);
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

    const handleFetchAiInsights = async () => {
        setLoadingAi(true);
        setAiError('');
        try {
            const yearVal = selectedYear;
            const monthVal = viewType === 'MONTH' ? selectedMonth : undefined;
            const insights = await analyticsService.getAiInsights(yearVal, monthVal);
            setAiInsights(insights);
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
            setAiError(errorObj?.response?.data?.message || errorObj?.message || 'Impossibile generare i consigli AI. Verifica la configurazione della chiave Gemini nel tuo Profilo.');
        } finally {
            setLoadingAi(false);
        }
    };

    const prevMonth = () => {
        if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
        else setSelectedMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
        else setSelectedMonth(m => m + 1);
    };

    // Helper for delta badge
    const renderDeltaBadge = (pct: number | null | undefined, reverseGood = false) => {
        if (pct === null || pct === undefined || isNaN(pct)) return null;
        const isPositive = pct > 0;
        const isGood = reverseGood ? !isPositive : isPositive;
        return (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
                {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(pct).toFixed(1)}% vs prec.
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* ── Period Selector Bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                        {(['MONTH', 'YEAR'] as const).map(v => (
                            <button key={v} onClick={() => setViewType(v)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewType === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {v === 'MONTH' ? 'Mensile' : 'Annuale'}
                            </button>
                        ))}
                    </div>
                    {data && (
                        <span className="text-sm font-semibold text-gray-700 hidden sm:inline-block">
                            {data.periodLabel}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {viewType === 'MONTH' && (
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-sm">
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
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-sm">
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
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <p className="text-sm text-gray-500">Calcolo indicatori e analisi finanziaria in corso...</p>
                </div>
            )}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {!loading && data && (
                <>
                    {/* ── AI FINANCIAL COACH (LIGHT MODERN THEME) ── */}
                    <div className="bg-white border border-indigo-100 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30">
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-gray-100">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                                            <Sparkles size={18} />
                                        </div>
                                        <h2 className="text-lg font-bold tracking-tight text-gray-900">
                                            AI Financial Coach & Strategia
                                        </h2>
                                        <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                                            {data.financialProfileName || 'Gemini AI'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-3 py-1 rounded-xl font-medium w-fit mt-1">
                                        <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                                        <span>
                                            Garanzia Privacy Assoluta: Nessuna cifra in euro viene mai inviata all&apos;AI. L&apos;analisi si basa unicamente su percentuali e proporzioni anonime.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleFetchAiInsights}
                                    disabled={loadingAi}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                                >
                                    {loadingAi ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin text-white" />
                                            <span>Analisi anonimizzata in corso...</span>
                                        </>
                                    ) : aiInsights ? (
                                        <>
                                            <RefreshCw size={14} />
                                            <span>Rigenera Consigli AI</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} />
                                            <span>Chiedi al Coach AI</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {aiError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
                                    <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                                    <span>{aiError}</span>
                                </div>
                            )}

                            {/* Coach Result View */}
                            {aiInsights && (
                                <div className="mt-5 space-y-5 animate-in fade-in duration-300">
                                    {/* Health status header */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
                                        <div>
                                            <span className="text-xs text-gray-500 font-medium block mb-1">Stato di salute finanziaria complessivo</span>
                                            <div className="flex flex-wrap items-center gap-2.5">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                                    aiInsights.overallHealth === 'OTTIMA' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                    aiInsights.overallHealth === 'BUONA' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                    aiInsights.overallHealth === 'STABILE' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                    aiInsights.overallHealth === 'ATTENZIONE' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                    {aiInsights.overallHealth}
                                                </span>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {aiInsights.summary}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2 Strategic Pillars */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-2">
                                                <Scale size={15} />
                                                <span>Valutazione Regola 50/30/20</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {aiInsights.rule50_30_20Analysis}
                                            </p>
                                        </div>

                                        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-2">
                                                <PiggyBank size={15} />
                                                <span>Capienza & Runway Fondo Emergenza</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {aiInsights.emergencyFundAnalysis}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Key strengths pills */}
                                    {aiInsights.keyStrengths && aiInsights.keyStrengths.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                                                Punti di forza rilevati
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {aiInsights.keyStrengths.map((st, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                                                        <CheckCircle2 size={13} className="text-emerald-600" />
                                                        {st}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actionable tips list */}
                                    {aiInsights.actionableTips && aiInsights.actionableTips.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2.5">
                                                Spunti di ottimizzazione & Azioni pratiche
                                            </span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {aiInsights.actionableTips.map((tip, idx) => (
                                                    <div key={idx} className="bg-white hover:bg-gray-50/80 transition-colors border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <span className="text-xs font-bold text-gray-900 line-clamp-1">{tip.title}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    tip.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                                                    tip.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                                    'bg-blue-100 text-blue-800 border border-blue-200'
                                                                }`}>
                                                                    {tip.priority === 'HIGH' ? 'ALTA' : tip.priority === 'MEDIUM' ? 'MEDIA' : 'BASSA'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                                                                {tip.advice}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-100 text-gray-500">
                                                            <span className="truncate font-medium">{tip.category}</span>
                                                            <span className="text-emerald-700 font-bold shrink-0 ml-1">
                                                                {tip.potentialImpact}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 text-[11px] text-gray-500 flex items-center gap-1.5 border-t border-gray-100">
                                        <Info size={13} className="shrink-0 text-gray-400" />
                                        <span>{aiInsights.disclaimer}</span>
                                    </div>
                                </div>
                            )}

                            {!aiInsights && !loadingAi && !aiError && (
                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 gap-2 bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/60">
                                    <p>
                                        Clicca su <strong className="text-indigo-900 font-semibold">Chiedi al Coach AI</strong> per ottenere una revisione strategica automatica della tua situazione per il periodo <strong className="text-indigo-900 font-semibold">{data.periodLabel}</strong>.
                                    </p>
                                    <span className="text-indigo-700 font-semibold shrink-0">
                                        Consigli personalizzati & zero rischi privacy
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── CORE KPIS ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-emerald-600" />
                                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Entrate</span>
                                </div>
                                {renderDeltaBadge(data.incomeChangePct, false)}
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">{fmt(data.totalIncome)}</p>
                            <p className="text-xs text-emerald-600/80 mt-1">
                                Prec: {fmt(data.prevTotalIncome)}
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingDown size={16} className="text-red-500" />
                                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Uscite</span>
                                </div>
                                {renderDeltaBadge(data.expenseChangePct, true)}
                            </div>
                            <p className="text-2xl font-bold text-red-600">{fmt(data.totalExpense)}</p>
                            <p className="text-xs text-red-600/80 mt-1">
                                Prec: {fmt(data.prevTotalExpense)}
                            </p>
                        </div>

                        <div className={`${data.netFlow >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-2xl p-5`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <ArrowRight size={16} className={data.netFlow >= 0 ? 'text-blue-600' : 'text-orange-500'} />
                                    <span className={`text-xs font-semibold uppercase tracking-wide ${data.netFlow >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>Flusso netto</span>
                                </div>
                                {renderDeltaBadge(data.netFlowChangePct, false)}
                            </div>
                            <p className={`text-2xl font-bold ${data.netFlow >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{fmt(data.netFlow)}</p>
                            <p className={`text-xs mt-1 ${data.netFlow >= 0 ? 'text-blue-600/80' : 'text-orange-600/80'}`}>
                                Prec: {fmt(data.prevNetFlow)}
                            </p>
                        </div>

                        <div className="bg-gray-900 rounded-2xl p-5 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Scale size={16} className="text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tasso di risparmio</span>
                                </div>
                                <span className="text-xs text-gray-400">
                                    Target {data.targetSavingsPercent ? data.targetSavingsPercent.toFixed(0) : 20}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">{data.savingsRate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Prec: {data.prevSavingsRate.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* ── ADVANCED COMPOUND KPIS ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Emergency Runway */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                        <PiggyBank size={16} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Autonomia Emergenza</span>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    data.emergencyRunwayMonths >= (data.idealRunwayMonthsMax || 6) ? 'bg-emerald-100 text-emerald-800' :
                                    data.emergencyRunwayMonths >= (data.idealRunwayMonthsMin || 3) ? 'bg-blue-100 text-blue-800' :
                                    data.emergencyRunwayMonths >= 1 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                    {data.emergencyRunwayMonths >= (data.idealRunwayMonthsMax || 6) ? 'Eccellente' :
                                     data.emergencyRunwayMonths >= (data.idealRunwayMonthsMin || 3) ? `In linea (${(data.idealRunwayMonthsMin || 3).toFixed(0)}-${(data.idealRunwayMonthsMax || 6).toFixed(0)}m)` :
                                     data.emergencyRunwayMonths >= 1 ? 'Vulnerabile' : 'Basso'}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-gray-900">{data.emergencyRunwayMonths.toFixed(1)}</p>
                                <span className="text-sm text-gray-500 font-medium">mesi di spesa coperti</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Liquidità totale: <strong className="text-gray-700">{fmt(data.liquidCapital)}</strong> (esclusi investimenti)
                            </p>
                        </div>

                        {/* PAC & Investments Rate */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Percent size={16} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Investimenti & PAC</span>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                    {data.pacInvestedPercentOfIncome.toFixed(1)}% entrate
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-gray-900">{fmt(data.pacInvestedAmount)}</p>
                                <span className="text-xs text-gray-500 font-medium">{viewType === 'MONTH' ? 'nel mese' : "nell'anno"}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Portafoglio complessivo: <strong className="text-gray-700">{fmt(data.totalInvestedPortfolioValue)}</strong>
                            </p>
                        </div>

                        {/* Fixed vs Variable Ratio */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                                        <Flame size={16} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Rigidità Spese</span>
                                </div>
                                <span className="text-[11px] font-semibold text-gray-500">
                                    Burn rate: {fmt(data.dailyBurnRate)}/gg
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-gray-900">{data.fixedExpensesPercent.toFixed(0)}%</p>
                                <span className="text-sm text-gray-500 font-medium">spese fisse vincolate</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-3 flex">
                                <div style={{ width: `${data.fixedExpensesPercent}%` }} className="bg-amber-500 h-full" title={`Fisse: ${data.fixedExpensesPercent.toFixed(0)}%`} />
                                <div style={{ width: `${data.variableExpensesPercent}%` }} className="bg-indigo-400 h-full" title={`Variabili: ${data.variableExpensesPercent.toFixed(0)}%`} />
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-gray-500 mt-1.5">
                                <span>Fisse: {fmt(data.fixedExpensesAmount)}</span>
                                <span>Variabili: {fmt(data.variableExpensesAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── BUDGET ALLOCATION STRATEGIC CARD ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-gray-900">
                                        Strategia di Budget: {data.financialProfileName || 'Standard (50/30/20)'}
                                    </h2>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        data.ruleHealthStatus === 'BALANCED' ? 'bg-emerald-100 text-emerald-800' :
                                        data.ruleHealthStatus === 'NEEDS_HIGH' ? 'bg-amber-100 text-amber-800' :
                                        data.ruleHealthStatus === 'WANTS_HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {data.ruleHealthStatus === 'BALANCED' ? 'In Linea con il Profilo' :
                                         data.ruleHealthStatus === 'NEEDS_HIGH' ? 'Spese Primarie oltre il Target' :
                                         data.ruleHealthStatus === 'WANTS_HIGH' ? 'Spese Svago oltre il Target' : 'Risparmio da Rinforzare'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Target profilo: {data.targetNeedsPercent ? data.targetNeedsPercent.toFixed(0) : 50}% Necessità, {data.targetWantsPercent ? data.targetWantsPercent.toFixed(0) : 30}% Desideri, {data.targetSavingsPercent ? data.targetSavingsPercent.toFixed(0) : 20}% Risparmio & Investimenti. {data.financialProfileDescription}
                                </p>
                            </div>
                        </div>

                        {/* Segmented Bar */}
                        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                            <div
                                style={{ width: `${Math.min(100, data.needsPercent)}%` }}
                                className="bg-sky-500 h-full transition-all duration-500"
                                title={`Necessità: ${data.needsPercent.toFixed(1)}% (Target: ${data.targetNeedsPercent || 50}%)`}
                            />
                            <div
                                style={{ width: `${Math.min(100 - data.needsPercent, data.wantsPercent)}%` }}
                                className="bg-purple-500 h-full transition-all duration-500"
                                title={`Desideri: ${data.wantsPercent.toFixed(1)}% (Target: ${data.targetWantsPercent || 30}%)`}
                            />
                            <div
                                style={{ width: `${Math.max(0, 100 - data.needsPercent - data.wantsPercent)}%` }}
                                className="bg-emerald-500 h-full transition-all duration-500"
                                title={`Risparmio & Investimenti: ${data.savingsInvestPercent.toFixed(1)}% (Target: ${data.targetSavingsPercent || 20}%)`}
                            />
                        </div>

                        {/* 3 Metric Columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-sky-900">
                                        Target {data.targetNeedsPercent ? data.targetNeedsPercent.toFixed(0) : 50}% • Necessità
                                    </span>
                                    <span className="text-xs font-semibold text-sky-700">{data.needsPercent.toFixed(1)}%</span>
                                </div>
                                <p className="text-lg font-bold text-sky-950">{fmt(data.needsAmount)}</p>
                                <p className="text-[11px] text-sky-800 mt-1">
                                    Casa, utenze, spesa alimentare, trasporti, salute e tasse.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-purple-900">
                                        Target {data.targetWantsPercent ? data.targetWantsPercent.toFixed(0) : 30}% • Desideri
                                    </span>
                                    <span className="text-xs font-semibold text-purple-700">{data.wantsPercent.toFixed(1)}%</span>
                                </div>
                                <p className="text-lg font-bold text-purple-950">{fmt(data.wantsAmount)}</p>
                                <p className="text-[11px] text-purple-800 mt-1">
                                    Ristoranti, bar, shopping, vacanze, abbonamenti e tempo libero.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-emerald-900">
                                        Target {data.targetSavingsPercent ? data.targetSavingsPercent.toFixed(0) : 20}% • Risparmio
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-700">{data.savingsInvestPercent.toFixed(1)}%</span>
                                </div>
                                <p className="text-lg font-bold text-emerald-950">{fmt(data.savingsInvestAmount)}</p>
                                <p className="text-[11px] text-emerald-800 mt-1">
                                    PAC, investimenti, accumulo liquidità e fondo emergenza.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── CATEGORY DRIFT & MOM ANOMALIES ── */}
                    {data.categoryChanges && data.categoryChanges.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Variazioni e Dinamica delle Spese</h2>
                                    <p className="text-xs text-gray-500">Confronto per categoria rispetto al periodo precedente ({viewType === 'MONTH' ? 'mese precedente' : 'anno precedente'}).</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto mt-4">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-400 font-medium">
                                            <th className="pb-2.5 font-medium">Categoria</th>
                                            <th className="pb-2.5 font-medium text-right">Periodo Prec.</th>
                                            <th className="pb-2.5 font-medium text-right">Attuale</th>
                                            <th className="pb-2.5 font-medium text-right">Differenza (€)</th>
                                            <th className="pb-2.5 font-medium text-right">Variazione (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.categoryChanges.slice(0, 8).map((ch: CategoryMoMChange) => (
                                            <tr key={ch.categoryId} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="py-2.5 flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.categoryColor }} />
                                                    <span className="font-semibold text-gray-800">{ch.categoryName}</span>
                                                </td>
                                                <td className="py-2.5 text-right text-gray-500">{fmt(ch.prevAmount)}</td>
                                                <td className="py-2.5 text-right font-medium text-gray-900">{fmt(ch.currentAmount)}</td>
                                                <td className={`py-2.5 text-right font-semibold ${ch.increase ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {ch.deltaAmount > 0 ? `+${fmt(ch.deltaAmount)}` : fmt(ch.deltaAmount)}
                                                </td>
                                                <td className="py-2.5 text-right">
                                                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        ch.increase ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                                                    }`}>
                                                        {ch.increase ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                        {ch.deltaPercent !== null ? `${Math.abs(ch.deltaPercent).toFixed(0)}%` : 'N/D'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── MONTHLY TREND (YEAR VIEW ONLY) ── */}
                    {viewType === 'YEAR' && data.monthlyTrend.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 mb-4">Andamento mensile {selectedYear}</h2>
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
