import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
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
const colors = ['#111827', '#4b5563', '#9ca3af', '#059669', '#dc2626', '#2563eb', '#d97706'];
const emptyForm = { name: '', type: 'ETF' as InvestmentType, ticker: '', currentValue: '0', investedCapital: '0', pacActive: false, recurringAmount: '', recurringDay: '1' };
const inputClass = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900';

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [editing, setEditing] = useState<Investment | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const total = useMemo(() => investments.reduce((sum, item) => sum + item.currentValue, 0), [investments]);
    const invested = useMemo(() => investments.reduce((sum, item) => sum + item.investedCapital, 0), [investments]);
    const pacTotal = useMemo(() => investments.filter(item => item.pacActive).reduce((sum, item) => sum + (item.recurringAmount || 0), 0), [investments]);
    const byType = useMemo(() => investmentTypes.map(type => ({ name: type.label, value: investments.filter(item => item.type === type.value).reduce((sum, item) => sum + item.currentValue, 0) })).filter(item => item.value > 0), [investments]);
    const fmt = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
    const tooltipFmt = (value: unknown) => fmt(Number(value || 0));

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

    const openEdit = (investment: Investment) => {
        setEditing(investment);
        setForm({
            name: investment.name,
            type: investment.type,
            ticker: investment.ticker || '',
            currentValue: String(investment.currentValue),
            investedCapital: String(investment.investedCapital),
            pacActive: investment.pacActive,
            recurringAmount: investment.recurringAmount ? String(investment.recurringAmount) : '',
            recurringDay: investment.recurringDay ? String(investment.recurringDay) : '1',
        });
    };

    const resetForm = () => {
        setEditing(null);
        setForm(emptyForm);
    };

    const save = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                currentValue: Number.parseFloat(form.currentValue) || 0,
                investedCapital: Number.parseFloat(form.investedCapital) || 0,
                recurringAmount: form.pacActive ? Number.parseFloat(form.recurringAmount) || 0 : null,
                recurringDay: form.pacActive ? Number.parseInt(form.recurringDay) || 1 : null,
            };
            if (editing) await investmentService.update(editing.id, payload);
            else await investmentService.create(payload);
            resetForm();
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

    return (
        <div className="space-y-5 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 text-white rounded-2xl p-5"><p className="text-sm text-gray-300">Patrimonio investito</p><p className="text-2xl font-semibold mt-2">{fmt(total)}</p></div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5"><p className="text-sm text-gray-500">Capitale versato</p><p className="text-2xl font-semibold mt-2 text-gray-900">{fmt(invested)}</p></div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5"><p className="text-sm text-gray-500">PAC mensili attivi</p><p className="text-2xl font-semibold mt-2 text-gray-900">{fmt(pacTotal)}</p></div>
            </div>

            {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
                <div className="space-y-5">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 h-80">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Allocazione</h2>
                            <ResponsiveContainer width="100%" height="85%">
                                <PieChart>
                                    <Pie data={byType} dataKey="value" nameKey="name" outerRadius={90} label>
                                        {byType.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={tooltipFmt} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 h-80">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Versato vs valore</h2>
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={[{ name: 'Portafoglio', versato: invested, valore: total }]}>
                                    <XAxis dataKey="name" /><YAxis /><Tooltip formatter={tooltipFmt} />
                                    <Bar dataKey="versato" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="valore" fill="#111827" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-900" /></div> : investments.length === 0 ? <div className="py-16 text-center text-sm text-gray-400">Nessun investimento presente</div> : investments.map(item => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                                <div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{item.name}</p><p className="text-xs text-gray-500">{investmentTypes.find(type => type.value === item.type)?.label}{item.ticker ? ` - ${item.ticker}` : ''}{item.pacActive ? ` - PAC ${fmt(item.recurringAmount || 0)}/mese` : ''}</p></div>
                                <div className="text-left md:text-right"><p className="text-sm font-semibold text-gray-900">{fmt(item.currentValue)}</p><p className={`text-xs ${item.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(item.gainLoss)} ({item.gainLossPercent.toFixed(1)}%)</p></div>
                                <div className="flex justify-end gap-1"><button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil size={15} /></button><button onClick={() => remove(item)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button></div>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={save} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 sticky top-6">
                    <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">{editing ? 'Modifica investimento' : 'Nuovo investimento'}</h2>{editing && <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-900">Annulla</button>}</div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Es. VWCE" /></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as InvestmentType })} className={inputClass}>{investmentTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Ticker</label><input value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })} className={inputClass} /></div></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Valore attuale</label><input type="number" step="0.01" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} className={inputClass} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Capitale versato</label><input type="number" step="0.01" value={form.investedCapital} onChange={e => setForm({ ...form, investedCapital: e.target.value })} className={inputClass} /></div></div>
                    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.pacActive} onChange={e => setForm({ ...form, pacActive: e.target.checked })} /> PAC attivo</label>
                    {form.pacActive && <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Importo mensile</label><input type="number" step="0.01" value={form.recurringAmount} onChange={e => setForm({ ...form, recurringAmount: e.target.value })} className={inputClass} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Giorno</label><input type="number" min="1" max="28" value={form.recurringDay} onChange={e => setForm({ ...form, recurringDay: e.target.value })} className={inputClass} /></div></div>}
                    <button disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{editing ? 'Salva investimento' : 'Aggiungi investimento'}</button>
                </form>
            </div>
        </div>
    );
}

