import { formatCurrency } from '../../utils/formatters';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { DashboardOverview } from '../../types';

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string; dataKey: string }>;
    label?: string;
}

interface DashboardChartsProps {
    data: DashboardOverview;
    viewType: 'MONTH' | 'YEAR';
}

const PIE_COLORS = ['#111827', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#ec4899', '#64748b'];

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    const income = payload.find(p => p.dataKey === 'income')?.value || 0;
    const expense = payload.find(p => p.dataKey === 'expense')?.value || 0;
    const diff = income - expense;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 min-w-[160px]">
            <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
            <div className="space-y-1 text-xs">
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-gray-500">
                                {p.dataKey === 'income' ? 'Entrate' : 'Uscite'}:
                            </span>
                        </div>
                        <span className="font-semibold text-gray-800">
                            {formatCurrency(p.value)}
                        </span>
                    </div>
                ))}
                {payload.length > 1 && (
                    <div className="pt-1.5 mt-1 border-t border-gray-100 flex items-center justify-between gap-4">
                        <span className="text-gray-400">Netto:</span>
                        <span className={`font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function CategoryTooltip({ active, payload }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
            <span className="font-medium text-gray-700">{item.name}: </span>
            <span className="font-semibold text-gray-900">{formatCurrency(item.value)}</span>
        </div>
    );
}

export default function DashboardCharts({ data, viewType }: DashboardChartsProps) {
    const monthlyChartData = data?.monthlyReport?.dataPoints
        ? Object.keys(data.monthlyReport.dataPoints).map((date) => ({
            date: new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
            income: data.monthlyReport.incomeDataPoints[date] || 0,
            expense: data.monthlyReport.expenseDataPoints[date] || 0,
        }))
        : [];

    const yearlyChartData = data?.yearlyReport?.dataPoints
        ? Object.keys(data.yearlyReport.dataPoints).map((month) => ({
            date: month,
            income: data.yearlyReport.incomeDataPoints[month] || 0,
            expense: data.yearlyReport.expenseDataPoints[month] || 0,
        }))
        : [];

    const chartData = viewType === 'MONTH' ? monthlyChartData : yearlyChartData;

    const categoryChartData = data?.categoryReport?.dataPoints
        ? Object.entries(data.categoryReport.dataPoints)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
        : [];

    const categoryTotal = categoryChartData.reduce((acc, c) => acc + c.value, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 app-card p-6">
                <div className="mb-5 flex justify-between items-start">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-0.5">
                            {viewType === 'MONTH' ? 'Flusso di cassa mensile' : 'Flusso di cassa annuale'}
                        </h2>
                        <p className="text-xs text-gray-400">Confronto tra entrate e uscite nel tempo</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-xs text-gray-500">Entrate</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="text-xs text-gray-500">Uscite</span>
                        </div>
                    </div>
                </div>
                <div className="h-[250px]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGradient)" dot={false} />
                                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGradient)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-sm text-gray-400">Nessun dato disponibile</div>
                    )}
                </div>
            </div>

            <div className="app-card p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Spese per categoria</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Totale: <span className="font-semibold text-gray-700">{formatCurrency(categoryTotal)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-[140px] my-2">
                        {categoryChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryChartData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={64} strokeWidth={0}>
                                        {categoryChartData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CategoryTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-gray-400">Nessun dato</div>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                    {categoryChartData.slice(0, 4).map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                            </div>
                            <span className="font-medium text-gray-700">
                                {categoryTotal > 0 ? Math.round((item.value / categoryTotal) * 100) : 0}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
