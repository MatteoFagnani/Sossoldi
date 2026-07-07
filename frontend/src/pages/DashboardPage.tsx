import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/UI';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardRecentTransactions from '../components/dashboard/DashboardRecentTransactions';
import DashboardBudgetOverview from '../components/dashboard/DashboardBudgetOverview';

export default function DashboardPage() {
    const { data, loading, error } = useDashboard();

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
                    sub="Questo periodo"
                    up={true}
                    icon={<TrendingUp size={16} />}
                    color="#10b981"
                />
                <StatCard
                    label="Uscite totali"
                    value={fmt(data.totalExpense ?? 0)}
                    sub="Questo periodo"
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
            <DashboardCharts data={data} />

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DashboardRecentTransactions transactions={data.recentTransactions} />
                <DashboardBudgetOverview budgets={data.budgetStatuses} />
            </div>
        </div>
    );
}
