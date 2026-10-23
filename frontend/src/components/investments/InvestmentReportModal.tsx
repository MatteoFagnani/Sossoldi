import { useMemo, useState, useEffect } from 'react';
import {
    X,
    TrendingUp,
    TrendingDown,
    Calendar,
    Pencil,
    Landmark,
    RefreshCw,
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
import { investmentService } from '../../services/services';
import { typeMetadata } from '../../constants/investmentMeta';
import type { Investment, Transaction } from '../../types';

interface InvestmentReportModalProps {
    investment: Investment | null;
    onClose: () => void;
    onEdit: (investment: Investment) => void;
}

interface ProcessedSnapshotRow {
    period: string;
    contribution: number;
    cumulativeInvested: number;
    endValue: number;
    periodReturnVal: number;
    periodReturnPct: number;
}

export default function InvestmentReportModal({ investment, onClose, onEdit }: InvestmentReportModalProps) {
    const [pacHistory, setPacHistory] = useState<Transaction[]>([]);

    useEffect(() => {
        if (investment?.id) {
            investmentService.getPacHistory(investment.id).then(setPacHistory).catch(() => {});
        }
    }, [investment?.id]);

    // Parse and sort snapshots
    const processedSnapshots = useMemo<ProcessedSnapshotRow[]>(() => {
        if (!investment) return [];
        const snaps = [...(investment.snapshots || [])]
            .filter((s) => s.month && s.month.trim() !== '')
            .sort((a, b) => a.month.localeCompare(b.month));

        return snaps.reduce<{
            rows: ProcessedSnapshotRow[];
            cumulativeInvested: number;
            previousVal: number;
        }>(
            (acc, snap) => {
                const contribution = snap.investedCapital || 0;
                const cumulativeInvested = acc.cumulativeInvested + contribution;
                const endVal =
                    snap.currentValue != null
                        ? snap.currentValue
                        : snap.value != null
                          ? snap.value
                          : acc.previousVal + contribution;

                const base = acc.previousVal === 0 ? contribution : acc.previousVal;
                const periodReturnVal =
                    acc.previousVal === 0 ? endVal - contribution : endVal - contribution - acc.previousVal;
                const periodReturnPct =
                    base > 0
                        ? acc.previousVal === 0
                            ? (endVal / base - 1) * 100
                            : ((endVal - contribution) / base - 1) * 100
                        : 0;

                return {
                    cumulativeInvested,
                    previousVal: endVal,
                    rows: [
                        ...acc.rows,
                        {
                            period: snap.month,
                            contribution,
                            cumulativeInvested,
                            endValue: endVal,
                            periodReturnVal,
                            periodReturnPct,
                        },
                    ],
                };
            },
            { rows: [], cumulativeInvested: 0, previousVal: 0 }
        ).rows;
    }, [investment]);

    const chartData = useMemo(() => {
        return processedSnapshots.map((s) => ({
            period: s.period,
            'Capitale Versato': s.cumulativeInvested,
            'Controvalore': s.endValue,
        }));
    }, [processedSnapshots]);

    if (!investment) return null;

    const typeMeta = typeMetadata[investment.type] || typeMetadata.OTHER;
    const TypeIcon = typeMeta.icon;
    const isYearly = investment.trackingFrequency === 'YEARLY' || (!investment.trackingFrequency && investment.type === 'ROBO_ADVISOR');
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
                                <h2 className="text-base font-semibold text-gray-900 tracking-tight">{investment.name}</h2>
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

                    {/* Linked Account & PAC Status Box */}
                    {investment.accountId && (
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                                    <Landmark size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                                        Conto collegato: {investment.accountName}
                                        <span className="text-[11px] font-normal text-gray-500">
                                            (Saldo disponibile: {formatCurrency(investment.accountBalance || 0)})
                                        </span>
                                    </p>
                                    <p className="text-[11px] text-gray-600 mt-0.5">
                                        {investment.pacActive
                                            ? `PAC attivo di ${formatCurrency(investment.recurringAmount || 0)}/mese (addebito giorno ${investment.recurringDay || 1})`
                                            : 'Deposito liquidità collegato (PAC al momento disattivato)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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
                                                    <td className="py-3 px-3.5 font-medium text-gray-900">
                                                        {row.period}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right text-gray-700">
                                                        {formatCurrency(row.contribution)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right font-medium text-gray-600">
                                                        {formatCurrency(row.cumulativeInvested)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right font-semibold text-gray-900">
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
                                                    {Number(comp.percentage) % 1 === 0
                                                        ? Number(comp.percentage).toFixed(0)
                                                        : Number(comp.percentage).toFixed(2).replace(/\.?0+$/, '')}%
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

                    {/* PAC History Table (if any transactions exist) */}
                    {pacHistory.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <RefreshCw size={14} className="text-indigo-600" />
                                Storico Versamenti PAC Scalati dal Conto ({pacHistory.length})
                            </h3>
                            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                                {pacHistory.map((tx) => (
                                    <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-semibold text-gray-900">{tx.description}</p>
                                            <p className="text-[11px] text-gray-400">
                                                {new Date(tx.date).toLocaleDateString('it-IT', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}{' '}
                                                • Prelevato da {tx.accountName || investment.accountName || 'conto collegato'}
                                            </p>
                                        </div>
                                        <span className="font-bold text-gray-900">
                                            -{formatCurrency(tx.amount)}
                                        </span>
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
