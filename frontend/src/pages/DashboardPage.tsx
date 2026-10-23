import { formatCurrency } from '../utils/formatters';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    Landmark,
    PiggyBank,
    ArrowRightLeft,
    Plus,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/ui/UI';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardRecentTransactions from '../components/dashboard/DashboardRecentTransactions';
import DashboardBudgetOverview from '../components/dashboard/DashboardBudgetOverview';
import DashboardAccountsOverview from '../components/dashboard/DashboardAccountsOverview';
import TransactionForm from '../components/transactions/TransactionForm';
import TransferFormModal from '../components/transfers/TransferFormModal';
import { transactionService } from '../services/services';
import { useAuthStore } from '../store/authStore';
import { MONTHS, MONTH_KEYS, getSelectableYears } from '../constants/dateConstants';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1; // 1-indexed
const YEARS = getSelectableYears(2020, 0);

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [viewType, setViewType] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

    const {
        data,
        activeAccounts,
        categories,
        netWorth,
        liquidTotal,
        investmentTotal,
        loading,
        error,
        refetch,
    } = useDashboard(
        viewType === 'MONTH' ? selectedMonth : undefined,
        selectedYear,
    );

    // Quick transaction modal state
    const [showTxModal, setShowTxModal] = useState(false);
    const [txFormData, setTxFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
        accountId: '',
    });
    const [savingTx, setSavingTx] = useState(false);
    const [txError, setTxError] = useState('');

    // Quick transfer modal state
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Period navigation
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

    // Open Quick Modals
    const openNewTransaction = () => {
        const defaultCategory = categories.find(c => c.type === 'EXPENSE') ?? categories[0];
        const defaultAccount = activeAccounts[0];
        setTxFormData({
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            categoryId: defaultCategory ? String(defaultCategory.id) : '',
            accountId: defaultAccount ? String(defaultAccount.id) : '',
        });
        setTxError('');
        setShowTxModal(true);
    };

    const handleSaveTransaction = async (form: { amount: string; date: string; description: string; categoryId: string; accountId: string }) => {
        if (!form.categoryId) {
            setTxError('Seleziona una categoria.');
            return;
        }
        setSavingTx(true);
        setTxError('');
        try {
            await transactionService.create({
                amount: parseFloat(form.amount),
                date: form.date,
                description: form.description,
                categoryId: parseInt(form.categoryId),
                accountId: form.accountId ? parseInt(form.accountId) : undefined,
            });
            setShowTxModal(false);
            await refetch();
        } catch {
            setTxError('Errore durante il salvataggio della transazione.');
        } finally {
            setSavingTx(false);
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

    const fmt = formatCurrency;
    const balance = (data.totalIncome ?? 0) - (data.totalExpense ?? 0);
    const savingsRate = data.totalIncome ? Math.round((balance / data.totalIncome) * 100) : 0;

    // Delta MoM computation
    const prevMonthKey = selectedMonth > 1 ? MONTH_KEYS[selectedMonth - 2] : null;

    let incomeSub = viewType === 'MONTH' ? 'Questo mese' : "Quest'anno";
    let incomeUp: boolean | undefined = true;
    let expenseSub = viewType === 'MONTH' ? 'Questo mese' : "Quest'anno";
    let expenseUp: boolean | undefined = false;

    if (viewType === 'MONTH' && prevMonthKey && data.yearlyReport) {
        const prevIncome = data.yearlyReport.incomeDataPoints?.[prevMonthKey] || 0;
        const prevExpense = data.yearlyReport.expenseDataPoints?.[prevMonthKey] || 0;
        const currentIncome = data.totalIncome || 0;
        const currentExpense = data.totalExpense || 0;

        if (prevIncome > 0) {
            const deltaInc = Math.round(((currentIncome - prevIncome) / prevIncome) * 100);
            incomeSub = `${deltaInc >= 0 ? '+' : ''}${deltaInc}% vs mese prec.`;
            incomeUp = deltaInc >= 0;
        }

        if (prevExpense > 0) {
            const deltaExp = Math.round(((currentExpense - prevExpense) / prevExpense) * 100);
            expenseSub = `${deltaExp >= 0 ? '+' : ''}${deltaExp}% vs mese prec.`;
            expenseUp = deltaExp <= 0; // lower expenses is positive
        }
    }

    return (
        <div className="space-y-6 pb-10">

            {/* Header: Title, Compact Period Selector & Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Ciao {user?.firstName ? `${user.firstName}, ` : user?.username ? `${user.username}, ` : ''}bentornato!
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {viewType === 'MONTH' ? `Ecco il riepilogo di ${MONTHS[selectedMonth - 1]} ${selectedYear}` : `Ecco il riepilogo annuale del ${selectedYear}`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Compact unified period selector */}
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-2xs">
                        <div className="flex bg-gray-100 p-0.5 rounded-lg">
                            <button
                                onClick={() => setViewType('MONTH')}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewType === 'MONTH' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Mese
                            </button>
                            <button
                                onClick={() => setViewType('YEAR')}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewType === 'YEAR' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Anno
                            </button>
                        </div>

                        <div className="h-4 w-px bg-gray-200 mx-0.5" />

                        {viewType === 'MONTH' && (
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={prevMonth}
                                    className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    aria-label="Mese precedente"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <select
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(Number(e.target.value))}
                                    className="text-xs font-semibold text-gray-700 bg-transparent border-none outline-none cursor-pointer px-1 py-1"
                                    aria-label="Seleziona mese"
                                >
                                    {MONTHS.map((name, i) => (
                                        <option key={i + 1} value={i + 1}>{name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={nextMonth}
                                    className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    aria-label="Mese successivo"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => setSelectedYear(y => Math.max(2020, y - 1))}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                aria-label="Anno precedente"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <select
                                value={selectedYear}
                                onChange={e => setSelectedYear(Number(e.target.value))}
                                className="text-xs font-semibold text-gray-700 bg-transparent border-none outline-none cursor-pointer px-1 py-1"
                                aria-label="Seleziona anno"
                            >
                                {YEARS.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setSelectedYear(y => Math.min(CURRENT_YEAR, y + 1))}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                aria-label="Anno successivo"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setShowTransferModal(true)}
                            disabled={activeAccounts.length < 2}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 text-gray-700 hover:text-gray-900 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
                            title={activeAccounts.length < 2 ? 'Servono almeno 2 conti per fare un giroconto' : 'Registra un giroconto tra conti'}
                        >
                            <ArrowRightLeft size={14} />
                            <span>Giroconto</span>
                        </button>
                        <button
                            onClick={openNewTransaction}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
                            title="Aggiungi una nuova transazione"
                        >
                            <Plus size={14} />
                            <span>Nuova transazione</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 Core Financial KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Patrimonio netto"
                    value={fmt(netWorth)}
                    sub="Totale conti"
                    icon={<Landmark size={16} />}
                    color="#111827"
                    onClick={() => navigate('/wealth')}
                />
                <StatCard
                    label="Entrate del periodo"
                    value={fmt(data.totalIncome ?? 0)}
                    sub={incomeSub}
                    up={incomeUp}
                    icon={<TrendingUp size={16} />}
                    color="#10b981"
                />
                <StatCard
                    label="Uscite del periodo"
                    value={fmt(data.totalExpense ?? 0)}
                    sub={expenseSub}
                    up={expenseUp}
                    icon={<TrendingDown size={16} />}
                    color="#f43f5e"
                />
                <StatCard
                    label="Risparmio netto"
                    value={fmt(balance)}
                    sub={`Tasso: ${savingsRate}% • ${savingsRate >= 20 ? 'Ottimo ritmo' : savingsRate > 0 ? 'In attivo' : 'In disavanzo'}`}
                    up={balance >= 0}
                    icon={<PiggyBank size={16} />}
                    color="#06b6d4"
                />
            </div>

            {/* Charts: Cash Flow & Category Expense */}
            <DashboardCharts data={data} viewType={viewType} />

            {/* 3 Balanced Operational Columns: Accounts, Recent Transactions, Budgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DashboardAccountsOverview
                    accounts={activeAccounts}
                    liquidTotal={liquidTotal}
                    investmentTotal={investmentTotal}
                />
                <DashboardRecentTransactions
                    transactions={data.recentTransactions}
                    onNewTransaction={openNewTransaction}
                />
                <DashboardBudgetOverview
                    budgets={data.budgetStatuses}
                    isAnnualView={viewType === 'YEAR'}
                />
            </div>

            {/* Quick Transaction Modal */}
            {showTxModal && (
                <TransactionForm
                    editing={null}
                    categories={categories}
                    accounts={activeAccounts}
                    initialData={txFormData}
                    saving={savingTx}
                    error={txError}
                    onSave={handleSaveTransaction}
                    onClose={() => setShowTxModal(false)}
                />
            )}

            {/* Quick Transfer Modal */}
            {showTransferModal && (
                <TransferFormModal
                    accounts={activeAccounts}
                    title="Giroconto rapido"
                    placeholderDescription="Es. Giroconto su carta"
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={async () => {
                        setShowTransferModal(false);
                        await refetch();
                    }}
                />
            )}
        </div>
    );
}
