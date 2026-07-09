import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import InvestmentForm from '../components/InvestmentForm';
import { investmentService } from '../services/services';
import type { Investment, InvestmentType } from '../types';

const investmentTypes: { value: InvestmentType; label: string }[] = [
    { value: 'ETF', label: 'ETF' },
    { value: 'STOCK', label: 'Azioni' },
    { value: 'FUND', label: 'Fondi' },
    { value: 'CRYPTO', label: 'Crypto' },
    { value: 'PENSION', label: 'Pensione' },
    { value: 'BOND', label: 'Bond' },
    { value: 'OTHER', label: 'Altro' },
];

const colors = ['#111827', '#4b5563', '#9ca3af', '#059669', '#2563eb', '#7c3aed', '#dc2626'];

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [editing, setEditing] = useState<Investment | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const counterValue = useMemo(() => investments.reduce((sum, item) => sum + item.currentValue, 0), [investments]);
    const invested = useMemo(() => investments.reduce((sum, item) => sum + item.investedCapital, 0), [investments]);
    const pacTotal = useMemo(() => investments.filter(item => item.pacActive).reduce((sum, item) => sum + (item.recurringAmount || 0), 0), [investments]);
    const pacAllocation = useMemo(() => {
        const totals = new Map<string, number>();
        investments.filter(item => item.pacActive).forEach(item => {
            (item.components || []).forEach(component => {
                const key = component.assetClass || 'Altro';
                const value = component.currentValue || item.currentValue * ((component.percentage || 0) / 100);
                totals.set(key, (totals.get(key) || 0) + value);
            });
        });
        return [...totals.entries()].map(([name, value]) => ({ name, value: Math.round(value) })).filter(item => item.value > 0);
    }, [investments]);
    const historyData = useMemo(() => {
        const totals = new Map<string, { month: string; investedCapital: number; value: number; currentValue: number }>();
        investments.forEach(item => (item.snapshots || []).forEach(point => {
            if (!point.month) return;
            const row = totals.get(point.month) || { month: point.month, investedCapital: 0, value: 0, currentValue: 0 };
            row.investedCapital += point.investedCapital || 0;
            row.value += point.value || 0;
            row.currentValue += point.currentValue || 0;
            totals.set(point.month, row);
        }));
        let cumulativeInvested = 0;
        return [...totals.values()].sort((a, b) => a.month.localeCompare(b.month)).map(row => {
            cumulativeInvested += row.investedCapital;
            return { ...row, investedCapital: cumulativeInvested };
        });
    }, [investments]);
    const fmt = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
    const tooltipFmt = (value: unknown) => fmt(Number(value || 0));
    const roundedTooltipFmt = (value: unknown) => fmt(Math.round(Number(value || 0)));

    const loadInvestments = async () => {
        setLoading(true);
        setError('');
        try {
            setInvestments(await investmentService.getAll());
        } catch {
            setError('Errore durante il caricamento degli investimenti.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInvestments(); }, []);

    const closeForm = () => {
        setEditing(null);
        setShowForm(false);
    };

    const openCreate = () => {
        setEditing(null);
        setShowForm(true);
    };

    const openEdit = (investment: Investment) => {
        setEditing(investment);
        setShowForm(true);
    };

    const save = async (payload: object) => {
        setSaving(true);
        setError('');
        try {
            if (editing) await investmentService.update(editing.id, payload);
            else await investmentService.create(payload);
            closeForm();
            await loadInvestments();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
            setError(data ? Object.values(data).join('. ') : 'Errore durante il salvataggio.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (investment: Investment) => {
        if (!confirm('Eliminare questo investimento?')) return;
        await investmentService.remove(investment.id);
        await loadInvestments();
    };

    if (showForm) {
        return (
            <div className="pb-10">
                {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
                <InvestmentForm investment={editing} saving={saving} onCancel={closeForm} onSave={save} />
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <div className="bg-gray-900 text-white rounded-2xl p-5"><p className="text-sm text-gray-300">Controvalore</p><p className="text-2xl font-semibold mt-2">{fmt(counterValue)}</p></div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5"><p className="text-sm text-gray-500">Capitale investito</p><p className="text-2xl font-semibold mt-2 text-gray-900">{fmt(invested)}</p></div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5"><p className="text-sm text-gray-500">PAC mensili attivi</p><p className="text-2xl font-semibold mt-2 text-gray-900">{fmt(pacTotal)}</p></div>
                </div>
                <button onClick={openCreate} className="app-button-primary"><Plus size={16} />Nuovo investimento/PAC</button>
            </div>

            {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 h-96 xl:col-span-2"><h2 className="text-base font-semibold text-gray-900 mb-4">Andamento nel tempo</h2><ResponsiveContainer width="100%" height="85%"><LineChart data={historyData}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={tooltipFmt} /><Line type="monotone" dataKey="investedCapital" name="Capitale investito" stroke="#9ca3af" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="value" name="Valore" stroke="#2563eb" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="currentValue" name="Controvalore" stroke="#111827" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 h-96"><h2 className="text-base font-semibold text-gray-900 mb-4">Allocazione PAC</h2><ResponsiveContainer width="100%" height="85%"><PieChart><Pie data={pacAllocation} dataKey="value" nameKey="name" outerRadius={105} label>{pacAllocation.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={roundedTooltipFmt} /></PieChart></ResponsiveContainer></div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-900" /></div> : investments.length === 0 ? <div className="py-16 text-center text-sm text-gray-400">Nessun investimento presente</div> : investments.map(item => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                        <div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{item.name}</p><p className="text-xs text-gray-500">{investmentTypes.find(type => type.value === item.type)?.label}{item.ticker ? ` - ${item.ticker}` : ''}{item.pacActive ? ` - PAC ${fmt(item.recurringAmount || 0)}/mese` : ''}</p>{item.pacActive && <p className="text-xs text-gray-400 mt-1">{(item.components || []).map(component => `${component.assetClass}${component.percentage ? ` ${component.percentage}%` : ''}`).join(' - ') || 'Nessuna componente'}</p>}</div>
                        <div className="text-left md:text-right"><p className="text-sm font-semibold text-gray-900">{fmt(item.currentValue)}</p><p className={`text-xs ${item.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(item.gainLoss)} ({item.gainLossPercent.toFixed(1)}%)</p></div>
                        <div className="flex justify-end gap-1"><button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil size={15} /></button><button onClick={() => remove(item)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
