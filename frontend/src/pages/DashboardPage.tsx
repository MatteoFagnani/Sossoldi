import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/UI';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardRecentTransactions from '../components/dashboard/DashboardRecentTransactions';
import DashboardBudgetOverview from '../components/dashboard/DashboardBudgetOverview';

const MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1; // 1-indexed
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => 2020 + i).concat([CURRENT_YEAR]);

export default function DashboardPage() {
    const [viewType, setViewType] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

    const { data, loading, error } = useDashboard(
        viewType === 'MONTH' ? selectedMonth : undefined,
        selectedYear,
    );

    // Navigate months
    const prevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(y => y - 1);
        } else {
            setSelectedMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(y => y + 1);
        } else {
            setSelectedMonth(m => m + 1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <p className="text-red-500">{error || 'Nessun dato disponibile.'}</p>
            </div>
        );
    }

    const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
    const balance = (data.totalIncome ?? 0) - (data.totalExpense ?? 0);
    const savingsRate = data.totalIncome ? Math.round((balance / data.totalIncome) * 100) : 0;

    return (
        <div className="space-y-5 pb-10">

            {/* Period Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* View toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setViewType('MONTH')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewType === 'MONTH' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Mensile
                    </button>
                    <button
                        onClick={() => setViewType('YEAR')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewType === 'YEAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Annuale
                    </button>
                </div>

                {/* Period navigation */}
                <div className="flex items-center gap-2">
                    {viewType === 'MONTH' && (
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
                            <button
                                onClick={prevMonth}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                aria-label="Mese precedente"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <select
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer px-1"
                                aria-label="Seleziona mese"
                            >
                                {MONTHS.map((name, i) => (
                                    <option key={i + 1} value={i + 1}>{name}</option>
                                ))}
                            </select>
                            <button
                                onClick={nextMonth}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                aria-label="Mese successivo"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
                        <button
                            onClick={() => setSelectedYear(y => Math.max(2020, y - 1))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                            aria-label="Anno precedente"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer px-1"
                            aria-label="Seleziona anno"
                        >
                            {YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setSelectedYear(y => Math.min(CURRENT_YEAR, y + 1))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                            aria-label="Anno successivo"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Saldo netto"
                    value={fmt(balance)}
                    sub={balance >= 0 ? 'In positivo' : 'In negativo'}
                    up={balance >= 0}
                    icon={<Wallet size={16} />}
                    color="#111827"
                />
                <StatCard
                    label="Entrate totali"
                    value={fmt(data.totalIncome ?? 0)}
                    sub={viewType === 'MONTH' ? 'Questo mese' : "Quest'anno"}
                    up={true}
                    icon={<TrendingUp size={16} />}
                    color="#10b981"
                />
                <StatCard
                    label="Uscite totali"
                    value={fmt(data.totalExpense ?? 0)}
                    sub={viewType === 'MONTH' ? 'Questo mese' : "Quest'anno"}
                    up={false}
                    icon={<TrendingDown size={16} />}
                    color="#f43f5e"
                />
                <StatCard
                    label="Tasso di risparmio"
                    value={`${savingsRate}%`}
                    sub="Del reddito totale"
                    up={savingsRate >= 0}
                    icon={<Target size={16} />}
                    color="#06b6d4"
                />
            </div>

            {/* Charts */}
            <DashboardCharts data={data} viewType={viewType} />

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DashboardRecentTransactions transactions={data.recentTransactions} />
                <DashboardBudgetOverview
                    budgets={data.budgetStatuses}
                    isAnnualView={viewType === 'YEAR'}
                />
            </div>
        </div>
    );
}
