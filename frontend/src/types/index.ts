export type FinancialProfileType =
    | 'STUDENT'
    | 'BALANCED_50_30_20'
    | 'FREELANCER'
    | 'FIRE_SEEKER'
    | 'FAMILY'
    | 'DEBT_REPAYMENT';

export interface User {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role: 'USER' | 'ADMIN';
    financialProfile?: FinancialProfileType;
    geminiConfigured?: boolean;
}

export interface UpdateProfilePayload {
    username?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    email?: string;
    financialProfile?: FinancialProfileType;
    geminiApiKey?: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
type MovementType = TransactionType | 'TRANSFER';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CARD' | 'INVESTMENT' | 'OTHER';
export type InvestmentType = 'ETF' | 'STOCK' | 'FUND' | 'CRYPTO' | 'PENSION' | 'BOND' | 'ROBO_ADVISOR' | 'OTHER';

export interface Account {
    id: number;
    name: string;
    type: AccountType;
    initialBalance: number;
    currentBalance: number;
    archived: boolean;
}

export type AccountPayload = Omit<Account, 'id' | 'currentBalance'>;

export interface AccountTransfer {
    id: number;
    amount: number;
    date: string;
    description?: string;
    fromAccountId: number;
    fromAccountName: string;
    toAccountId: number;
    toAccountName: string;
}

export type AccountTransferPayload = Omit<AccountTransfer, 'id' | 'fromAccountName' | 'toAccountName'>;

export interface InvestmentComponent {
    assetClass: string;
    name?: string | null;
    ticker?: string | null;
    percentage?: number | null;
    currentValue?: number | null;
}

export interface InvestmentSnapshot {
    month: string;
    investedCapital?: number | null;
    value?: number | null;
    currentValue?: number | null;
}

export interface Investment {
    id: number;
    name: string;
    type: InvestmentType;
    ticker?: string | null;
    currentValue: number;
    investedCapital: number;
    recurringAmount?: number | null;
    recurringDay?: number | null;
    pacActive: boolean;
    trackingFrequency?: 'YEARLY' | 'MONTHLY';
    stocksPercent?: number | null;
    bondsPercent?: number | null;
    governmentBondsPercent?: number | null;
    cashPercent?: number | null;
    otherPercent?: number | null;
    components?: InvestmentComponent[];
    snapshots?: InvestmentSnapshot[];
    gainLoss: number;
    gainLossPercent: number;
    accountId?: number | null;
    accountName?: string | null;
    accountBalance?: number | null;
    lastPacExecutionMonth?: string | null;
}

export type InvestmentPayload = Omit<Investment, 'id' | 'gainLoss' | 'gainLossPercent'>;

export interface Category {
    id: number;
    name: string;
    type: TransactionType;
    color: string;
    parentId?: number | null;
    parentName?: string | null;
}

export type CategoryPayload = Omit<Category, 'id' | 'parentName'>;

export interface Transaction {
    id: number;
    amount: number;
    type: TransactionType;
    date: string;
    description: string;
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    accountId?: number | null;
    accountName?: string | null;
    investmentId?: number | null;
    investmentName?: string | null;
}

export type TransactionPayload = Omit<Transaction, 'id' | 'type' | 'categoryName' | 'categoryColor' | 'accountName' | 'investmentName'> & {
    type?: TransactionType;
};

export interface AccountMovement {
    id: number;
    source: 'TRANSACTION' | 'TRANSFER';
    type: MovementType;
    amount: number;
    signedAmount: number;
    date: string;
    description?: string;
    categoryId?: number | null;
    categoryName?: string | null;
    categoryColor?: string | null;
    accountId?: number | null;
    accountName?: string | null;
    fromAccountName?: string | null;
    toAccountName?: string | null;
}

export interface TransactionCategoryMapping {
    id?: number;
    type: TransactionType;
    matchKey: string;
    description: string;
    categoryId: number;
    categoryName?: string;
}

export interface Budget {
    id: number;
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    limitAmount: number;
    percentageOfIncome?: number;
    automatic: boolean;
}

export interface BudgetStatus extends Budget {
    month: number;
    year: number;
    currentSpending: number;
    remainingAmount: number;
    percentageUsed: number;
    overridden: boolean;
    status: 'OK' | 'WARNING' | 'EXCEEDED';
}

export interface BudgetPayload {
    categoryId: number;
    limitAmount?: number | null;
    percentageOfIncome?: number | null;
    automatic?: boolean;
}

export interface BudgetUpdateRequest extends BudgetPayload {
    type?: 'PERMANENT' | 'TEMPORARY';
    month?: number;
    year?: number;
}

export interface ReportDto {
    dataPoints: Record<string, number>;
    incomeDataPoints: Record<string, number>;
    expenseDataPoints: Record<string, number>;
}

interface MonthlyPoint {
    label: string;
    income: number;
    expense: number;
    net: number;
}

export interface CategoryMoMChange {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    currentAmount: number;
    prevAmount: number;
    deltaAmount: number;
    deltaPercent: number | null;
    increase: boolean;
}

export interface AdvancedAnalyticsData {
    year: number;
    month?: number | null;
    periodLabel: string;
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    savingsRate: number;
    monthlyTrend: MonthlyPoint[];

    // Previous period comparison
    prevTotalIncome: number;
    prevTotalExpense: number;
    prevNetFlow: number;
    prevSavingsRate: number;
    incomeChangePct?: number | null;
    expenseChangePct?: number | null;
    netFlowChangePct?: number | null;
    categoryChanges: CategoryMoMChange[];

    // Financial Profile Strategy
    financialProfile?: FinancialProfileType;
    financialProfileName?: string;
    financialProfileDescription?: string;
    targetNeedsPercent: number;
    targetWantsPercent: number;
    targetSavingsPercent: number;
    idealRunwayMonthsMin: number;
    idealRunwayMonthsMax: number;

    // Budget Allocation
    needsAmount: number;
    needsPercent: number;
    wantsAmount: number;
    wantsPercent: number;
    savingsInvestAmount: number;
    savingsInvestPercent: number;
    ruleHealthStatus: 'BALANCED' | 'NEEDS_HIGH' | 'WANTS_HIGH' | 'SAVINGS_LOW';

    // Fixed vs Variable
    fixedExpensesAmount: number;
    fixedExpensesPercent: number;
    variableExpensesAmount: number;
    variableExpensesPercent: number;

    // Liquidity & Safety
    liquidCapital: number;
    averageMonthlyExpense: number;
    emergencyRunwayMonths: number;
    dailyBurnRate: number;

    // Investments & PAC
    pacInvestedAmount: number;
    pacInvestedPercentOfIncome: number;
    totalInvestedPortfolioValue: number;
}

interface ActionableTip {
    title: string;
    category: string;
    advice: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    potentialImpact: string;
}

export interface AiFinancialInsights {
    overallHealth: 'OTTIMA' | 'BUONA' | 'STABILE' | 'ATTENZIONE' | 'CRITICA';
    summary: string;
    rule50_30_20Analysis: string;
    emergencyFundAnalysis: string;
    keyStrengths: string[];
    actionableTips: ActionableTip[];
    disclaimer: string;
}

export interface DashboardOverview {
    totalIncome: number;
    totalExpense: number;
    currentBalance: number;
    recentTransactions: Transaction[];
    budgetStatuses: BudgetStatus[];
    monthlyReport: ReportDto;
    yearlyReport: ReportDto;
    categoryReport: ReportDto;
}

export interface AiStatus {
    configured: boolean;
    source: 'USER' | 'SYSTEM' | 'NONE';
    maskedKey?: string;
}

export interface CategorizeMerchantResponse {
    mapped: TransactionCategoryMapping[];
    newlyMapped: number;
}
