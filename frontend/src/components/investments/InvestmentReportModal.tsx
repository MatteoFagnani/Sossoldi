import { useMemo } from 'react';
import {
    X,
    TrendingUp,
    TrendingDown,
    Calendar,
    Pencil,
    Bot,
    Wallet,
    Layers,
    BarChart2,
    PieChart,
    Coins,
    ShieldCheck,
    Landmark,
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { Investment, InvestmentType } from '../../types';

interface InvestmentReportModalProps {
    investment: Investment | null;
    onClose: () => void;
    onEdit: (investment: Investment) => void;
}

const typeLabels: Record<InvestmentType, { label: string; icon: typeof Wallet; color: string; bg: string }> = {
    ROBO_ADVISOR: { label: 'Roboadvisor', icon: Bot, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    ETF: { label: 'ETF', icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    STOCK: { label: 'Azioni', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    FUND: { label: 'Fondi', icon: PieChart, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
    CRYPTO: { label: 'Crypto', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    PENSION: { label: 'Pensione', icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
    BOND: { label: 'Obbligazioni', icon: Landmark, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
    OTHER: { label: 'Altro', icon: Layers, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};

export default function InvestmentReportModal({ investment, onClose, onEdit }: InvestmentReportModalProps) {
    if (!investment) return null;

    const typeMeta = typeLabels[investment.type] || typeLabels.OTHER;
    const TypeIcon = typeMeta.icon;
    const isYearly = investment.trackingFrequency === 'YEARLY' || (!investment.trackingFrequency && investment.type === 'ROBO_ADVISOR');

    // Parse and sort snapshots
    const processedSnapshots = useMemo(() => {
        const snaps = [...(investment.snapshots || [])]
            .filter((s) => s.month && s.month.trim() !== '')
            .sort((a, b) => a.month.localeCompare(b.month));

        let cumulativeInvested = 0;
        let previousVal = 0;

        return snaps.map((snap) => {
            const contribution = snap.investedCapital || 0;
            cumulativeInvested += contribution;
            const endVal = snap.currentValue != null ? snap.currentValue : (snap.value != null ? snap.value : previousVal + contribution);
            
            // Period return
            const base = previousVal === 0 ? contribution : previousVal;
            const periodReturnVal = previousVal === 0 ? endVal - contribution : (endVal - contribution) - previousVal;
            const periodReturnPct = base > 0 ? (previousVal === 0 ? (endVal / base - 1) * 100 : ((endVal - contribution) / base - 1) * 100) : 0;

            previousVal = endVal;

            return {
                period: snap.month,
                contribution,
                cumulativeInvested,
                endValue: endVal,
                periodReturnVal,
                periodReturnPct,
            };
        });
    }, [investment]);

    const chartData = useMemo(() => {
        return processedSnapshots.map((s) => ({
            period: s.period,
            'Capitale Versato': s.cumulativeInvested,
            'Controvalore': s.endValue,
        }));
    }, [processedSnapshots]);

    const isPositive = investment.gainLoss >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${typeMeta.bg}`}>
                            <TypeIcon size={22} className={typeMeta.color} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-gray-900 tracking-tight">{investment.name}</h2>
                                {investment.ticker && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono font-medium rounded-md">
                                        {investment.ticker}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                                    <Calendar size={13} />
                                    {isYearly ? 'Report Anno per Anno' : 'Report Mese per Mese'}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                    {typeMeta.label}
                                </span>
                                {investment.pacActive && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs font-medium text-emerald-600">
                                            PAC {formatCurrency(investment.recurringAmount || 0)}/mese
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(investment);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                        >
                            <Pencil size={13} />
                            Modifica
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* 3 Core KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Controvalore Attuale</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(investment.currentValue)}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Valore aggiornato</p>
                        </div>
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Capitale Versato</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(investment.investedCapital)}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Totale contributi immessi</p>
                        </div>
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rendimento Netto</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className={`text-xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : ''}{formatCurrency(investment.gainLoss)}
                                </p>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {isPositive ? '+' : ''}{investment.gainLossPercent.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">Time-weighted / cumulato</p>
                        </div>
                    </div>

                    {/* Chart Evolution */}
                    {chartData.length > 1 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {isYearly ? 'Crescita Anno per Anno' : 'Andamento Temporale'}
                                </h3>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                                        Capitale Versato
                                    </span>
                                    <span className="flex items-center gap-1.5 text-gray-900 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full bg-gray-900 inline-block" />
                                        Controvalore
                                    </span>
                                </div>
                            </div>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                            formatter={(value) => [formatCurrency(Number(value || 0)), '']}
                                            labelFormatter={(lbl) => `${isYearly ? 'Anno' : 'Periodo'}: ${lbl}`}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e5e7eb', fontSize: '12px' }}
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
                            </div>
                        </div>
                    )}

                    {/* Snapshots Table */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {isYearly ? 'Dettaglio Rilevazioni Annuali' : 'Dettaglio Rilevazioni Mensili'}
                            </h3>
                            <span className="text-xs text-gray-500">
                                {processedSnapshots.length} {processedSnapshots.length === 1 ? 'rilevazione registrata' : 'rilevazioni registrate'}
                            </span>
                        </div>

                        {processedSnapshots.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                                <p className="text-sm text-gray-500">Nessuna rilevazione storica registrata.</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Clicca su &quot;Modifica&quot; per aggiungere i report anno per anno o mese per mese.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="py-2.5 px-3.5">{isYearly ? 'Anno' : 'Mese'}</th>
                                            <th className="py-2.5 px-3.5 text-right">Versamenti nel periodo</th>
                                            <th className="py-2.5 px-3.5 text-right">Capitale Cumulativo</th>
                                            <th className="py-2.5 px-3.5 text-right">Valore a fine periodo</th>
                                            <th className="py-2.5 px-3.5 text-right">Rendimento Periodo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {processedSnapshots.map((row, idx) => {
                                            const rowPositive = row.periodReturnPct >= 0;
                                            return (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-3 px-3.5 font-bold text-gray-900">
                                                        {row.period}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right text-gray-700">
                                                        {formatCurrency(row.contribution)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right font-medium text-gray-600">
                                                        {formatCurrency(row.cumulativeInvested)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right font-bold text-gray-900">
                                                        {formatCurrency(row.endValue)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right">
                                                        <span className={`inline-flex items-center gap-1 font-semibold ${rowPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {rowPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                            {rowPositive ? '+' : ''}{row.periodReturnPct.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Internal Asset Allocation (if components exist) */}
                    {(investment.components || []).length > 0 && (
                        <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Composizione Portafoglio / Componenti</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {(investment.components || []).map((comp, idx) => (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-gray-900">{comp.assetClass}</span>
                                            {comp.percentage != null && (
                                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                                    {comp.percentage}%
                                                </span>
                                            )}
                                        </div>
                                        {comp.name && <p className="text-[11px] text-gray-500 mt-1 truncate">{comp.name}</p>}
                                        {comp.currentValue != null && comp.currentValue > 0 && (
                                            <p className="text-xs font-medium text-gray-700 mt-1">
                                                {formatCurrency(comp.currentValue)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                    >
                        Chiudi
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEdit(investment);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors cursor-pointer"
                    >
                        <Pencil size={13} />
                        Modifica Investimento
                    </button>
                </div>
            </div>
        </div>
    );
}
