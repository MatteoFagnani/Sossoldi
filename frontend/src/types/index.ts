export interface User {
    id: number;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
    token: string;
    user: User;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type MovementType = TransactionType | 'TRANSFER';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CARD' | 'INVESTMENT' | 'OTHER';
export type InvestmentType = 'ETF' | 'STOCK' | 'FUND' | 'CRYPTO' | 'PENSION' | 'BOND' | 'OTHER';

export interface Account {
    id: number;
    name: string;
    type: AccountType;
    initialBalance: number;
    currentBalance: number;
    archived: boolean;
}

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
    stocksPercent?: number | null;
    bondsPercent?: number | null;
    governmentBondsPercent?: number | null;
    cashPercent?: number | null;
    otherPercent?: number | null;
    components?: InvestmentComponent[];
    snapshots?: InvestmentSnapshot[];
    lastUpdateDate?: string;
    gainLoss: number;
    gainLossPercent: number;
    allocationPercent: number;
}

export interface Category {
    id: number;
    name: string;
    type: TransactionType;
    color: string;
    parentId?: number | null;
    parentName?: string | null;
}

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
}

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
    fromAccountId?: number | null;
    fromAccountName?: string | null;
    toAccountId?: number | null;
    toAccountName?: string | null;
    transferDirection?: 'IN' | 'OUT' | 'NEUTRAL' | null;
}

export interface TransactionCategoryMapping {
    id?: number;
    type: TransactionType;
    matchKey: string;
    description: string;
    categoryId: number;
    categoryName?: string;
}


export type { Budget, BudgetStatus, BudgetUpdateRequest } from './budget';
import type { BudgetStatus } from './budget';

export interface ReportDto {
    title: string;
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    dataPoints: Record<string, number>;
    incomeDataPoints: Record<string, number>;
    expenseDataPoints: Record<string, number>;
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
