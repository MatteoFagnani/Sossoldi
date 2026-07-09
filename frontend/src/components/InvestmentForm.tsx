import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, X } from 'lucide-react';
import type { Investment, InvestmentComponent, InvestmentSnapshot, InvestmentType } from '../types';

const investmentTypes: { value: InvestmentType; label: string }[] = [
    { value: 'ETF', label: 'ETF' },
    { value: 'STOCK', label: 'Azioni' },
    { value: 'FUND', label: 'Fondi' },
    { value: 'CRYPTO', label: 'Crypto' },
    { value: 'PENSION', label: 'Pensione' },
    { value: 'BOND', label: 'Bond' },
    { value: 'OTHER', label: 'Altro' },
];

const componentTypes = ['Azioni', 'Obbligazioni', 'Titoli di stato', 'Liquidita', 'ETF', 'Fondi', 'Altro'];
const steps = ['Dati principali', 'PAC', 'Storico'];
const emptyComponent = { assetClass: 'Azioni', name: '', ticker: '', percentage: '', currentValue: '' };
const emptySnapshot = { month: '', investedCapital: '', value: '', currentValue: '' };
const emptyForm = {
    name: '', type: 'ETF' as InvestmentType, ticker: '', currentValue: '0', investedCapital: '0', pacActive: false,
    recurringAmount: '', recurringDay: '1', components: [emptyComponent], snapshots: [emptySnapshot],
};
const inputClass = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900';

type PacComponentForm = typeof emptyComponent;
type SnapshotForm = typeof emptySnapshot;
type FormState = typeof emptyForm;

type Props = {
    investment: Investment | null;
    saving: boolean;
    onCancel: () => void;
    onSave: (payload: object) => Promise<void>;
};

const toMoney = (value: unknown) => Number.parseFloat(String(value ?? '')) || 0;
const toNullableNumber = (value: string) => value.trim() === '' ? null : Number.parseFloat(value) || 0;

function componentRows(investment: Investment | null): PacComponentForm[] {
    if (!investment) return [{ ...emptyComponent }];
    const existing = investment.components || [];
    if (existing.length > 0) return existing.map(item => ({
        assetClass: item.assetClass || 'Altro',
        name: item.name || '',
        ticker: item.ticker || '',
        percentage: item.percentage == null ? '' : String(item.percentage),
        currentValue: item.currentValue == null ? '' : String(item.currentValue),
    }));

    const legacy = [
        ['Azioni', investment.stocksPercent],
        ['Obbligazioni', investment.bondsPercent],
        ['Titoli di stato', investment.governmentBondsPercent],
        ['Liquidita', investment.cashPercent],
        ['Altro', investment.otherPercent],
    ].filter(([, percentage]) => Number(percentage) > 0).map(([assetClass, percentage]) => ({
        ...emptyComponent,
        assetClass: String(assetClass),
        percentage: String(percentage),
    }));
    return legacy.length ? legacy : [{ ...emptyComponent }];
}

function snapshotRows(investment: Investment | null): SnapshotForm[] {
    const rows = (investment?.snapshots || []).map(item => ({
        month: item.month || '',
        investedCapital: item.investedCapital == null ? '' : String(item.investedCapital),
        value: item.value == null ? '' : String(item.value),
        currentValue: item.currentValue == null ? '' : String(item.currentValue),
    }));
    return rows.length ? rows : [{ ...emptySnapshot }];
}

function formFromInvestment(investment: Investment | null): FormState {
    if (!investment) return { ...emptyForm, components: [{ ...emptyComponent }], snapshots: [{ ...emptySnapshot }] };
    return {
        name: investment.name,
        type: investment.type,
        ticker: investment.ticker || '',
        currentValue: String(investment.currentValue),
        investedCapital: String(investment.investedCapital),
        pacActive: investment.pacActive,
        recurringAmount: investment.recurringAmount ? String(investment.recurringAmount) : '',
        recurringDay: investment.recurringDay ? String(investment.recurringDay) : '1',
        components: componentRows(investment),
        snapshots: snapshotRows(investment),
    };
}

function nextMonth(month: string) {
    if (!month) return '';
    const [year, monthNumber] = month.split('-').map(Number);
    if (!year || !monthNumber) return '';
    const date = new Date(year, monthNumber, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function InvestmentForm({ investment, saving, onCancel, onSave }: Props) {
    const [form, setForm] = useState<FormState>(() => formFromInvestment(investment));
    const [step, setStep] = useState(0);
    const allocationTotal = form.components.reduce((sum, item) => sum + toMoney(item.percentage), 0);

    useEffect(() => {
        setForm(formFromInvestment(investment));
        setStep(0);
    }, [investment]);

    const updateComponent = (index: number, patch: Partial<PacComponentForm>) => {
        setForm(current => ({ ...current, components: current.components.map((item, i) => i === index ? { ...item, ...patch } : item) }));
    };

    const updateSnapshot = (index: number, patch: Partial<SnapshotForm>) => {
        setForm(current => ({ ...current, snapshots: current.snapshots.map((item, i) => i === index ? { ...item, ...patch } : item) }));
    };

    const addSnapshot = () => {
        setForm(current => {
            const last = [...current.snapshots].reverse().find(item => item.month);
            return {
                ...current,
                snapshots: [...current.snapshots, { ...emptySnapshot, month: nextMonth(last?.month || ''), investedCapital: current.pacActive ? current.recurringAmount : '' }],
            };
        });
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (step < steps.length - 1) {
            setStep(current => current + 1);
            return;
        }

        const components: InvestmentComponent[] = form.components
            .filter(item => item.assetClass || item.name || item.ticker || item.percentage || item.currentValue)
            .map(item => ({
                assetClass: item.assetClass || 'Altro',
                name: item.name || null,
                ticker: item.ticker || null,
                percentage: toNullableNumber(item.percentage),
                currentValue: toNullableNumber(item.currentValue),
            }));
        const snapshots: InvestmentSnapshot[] = form.snapshots
            .filter(item => item.month || item.investedCapital || item.value || item.currentValue)
            .map(item => ({
                month: item.month,
                investedCapital: toNullableNumber(item.investedCapital),
                value: toNullableNumber(item.value),
                currentValue: toNullableNumber(item.currentValue),
            }));

        await onSave({
            name: form.name,
            type: form.type,
            ticker: form.ticker,
            currentValue: toMoney(form.currentValue),
            investedCapital: toMoney(form.investedCapital),
            pacActive: form.pacActive,
            recurringAmount: form.pacActive ? toNullableNumber(form.recurringAmount) : null,
            recurringDay: form.pacActive ? Number.parseInt(form.recurringDay) || 1 : null,
            components: form.pacActive ? components : [],
            snapshots,
        });
    };

    return (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">{investment ? 'Modifica investimento' : 'Nuovo investimento/PAC'}</h2>
                    <p className="text-xs text-gray-500 mt-1">Step {step + 1} di {steps.length}</p>
                </div>
                <button type="button" onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>

            <div className="px-5 pt-5">
                <div className="grid grid-cols-3 gap-2">
                    {steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`px-3 py-2 rounded-xl text-sm font-medium ${step === index ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>{label}</button>)}
                </div>
            </div>

            <div className="p-5 space-y-6">
                {step === 0 && <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Dati principali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Nome</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Es. PAC ETF" /></div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as InvestmentType })} className={inputClass}>{investmentTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Ticker/API ref</label><input value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })} className={inputClass} /></div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Controvalore</label><input type="number" step="0.01" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} className={inputClass} /></div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Capitale iniziale</label><input type="number" step="0.01" value={form.investedCapital} onChange={e => setForm({ ...form, investedCapital: e.target.value })} className={inputClass} /></div>
                    </div>
                </section>}

                {step === 1 && <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Piano di accumulo</h3>
                        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.pacActive} onChange={e => setForm({ ...form, pacActive: e.target.checked })} /> PAC attivo</label>
                    </div>

                    {form.pacActive && <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Importo mensile</label><input type="number" step="0.01" value={form.recurringAmount} onChange={e => setForm({ ...form, recurringAmount: e.target.value })} className={inputClass} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Giorno versamento</label><input type="number" min="1" max="28" value={form.recurringDay} onChange={e => setForm({ ...form, recurringDay: e.target.value })} className={inputClass} /></div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-900">Componenti PAC</h3><span className={`text-xs ${allocationTotal === 100 ? 'text-emerald-600' : 'text-gray-400'}`}>{allocationTotal.toFixed(0)}%</span></div>
                            {form.components.map((component, index) => <div key={index} className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr_1fr_90px_120px_auto] gap-2 rounded-xl border border-gray-200 p-3">
                                <select value={component.assetClass} onChange={e => updateComponent(index, { assetClass: e.target.value })} className={inputClass}>{componentTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>
                                <input placeholder="Nome" value={component.name} onChange={e => updateComponent(index, { name: e.target.value })} className={inputClass} />
                                <input placeholder="Ticker" value={component.ticker} onChange={e => updateComponent(index, { ticker: e.target.value })} className={inputClass} />
                                <input type="number" min="0" max="100" step="0.1" placeholder="%" value={component.percentage} onChange={e => updateComponent(index, { percentage: e.target.value })} className={inputClass} />
                                <input type="number" min="0" step="0.01" placeholder="Controvalore" value={component.currentValue} onChange={e => updateComponent(index, { currentValue: e.target.value })} className={inputClass} />
                                <button type="button" onClick={() => setForm(current => ({ ...current, components: current.components.filter((_, i) => i !== index) }))} className="px-3 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                            </div>)}
                            <button type="button" onClick={() => setForm(current => ({ ...current, components: [...current.components, { ...emptyComponent }] }))} className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:border-gray-500">Aggiungi componente</button>
                        </div>
                    </>}
                </section>}

                {step === 2 && <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Storico mensile</h3>
                    {form.snapshots.map((point, index) => <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                        <input type="month" value={point.month} onChange={e => updateSnapshot(index, { month: e.target.value })} className={inputClass} />
                        <input type="number" step="0.01" placeholder="Aggiunto" value={point.investedCapital} onChange={e => updateSnapshot(index, { investedCapital: e.target.value })} className={inputClass} />
                        <input type="number" step="0.01" placeholder="Valore" value={point.value} onChange={e => updateSnapshot(index, { value: e.target.value })} className={inputClass} />
                        <input type="number" step="0.01" placeholder="Controvalore" value={point.currentValue} onChange={e => updateSnapshot(index, { currentValue: e.target.value })} className={inputClass} />
                        <button type="button" onClick={() => setForm(current => ({ ...current, snapshots: current.snapshots.filter((_, i) => i !== index) }))} className="px-3 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>)}
                    <button type="button" onClick={addSnapshot} className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:border-gray-500">Aggiungi mese</button>
                </section>}
            </div>

            <div className="flex justify-between gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annulla</button>
                <div className="flex gap-2">
                    {step > 0 && <button type="button" onClick={() => setStep(current => current - 1)} className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"><ChevronLeft size={15} />Indietro</button>}
                    <button disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-xl">{saving ? <Loader2 size={15} className="animate-spin" /> : step === steps.length - 1 ? <Plus size={15} /> : <ChevronRight size={15} />}{step === steps.length - 1 ? (investment ? 'Salva modifiche' : 'Aggiungi') : 'Avanti'}</button>
                </div>
            </div>
        </form>
    );
}
