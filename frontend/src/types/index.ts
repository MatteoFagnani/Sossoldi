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
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CARD' | 'INVESTMENT' | 'OTHER';

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
