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

export interface Category {
    id: number;
    name: string;
    type: TransactionType;
    color: string;
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
    automatic: boolean;
}

export interface TransactionCategoryMapping {
    id?: number;
    type: TransactionType;
    matchKey: string;
    description: string;
    categoryId: number;
    categoryName?: string;
}

export interface AutomationRule {
    id: number;
    name: string;
    type: TransactionType;
    categoryId: number;
    categoryName: string;
    executionDay: number;
    monthlyAmount?: number;
    annualAmount?: number;
}

export type { Budget, BudgetStatus, BudgetUpdateRequest } from './budget';
import type { BudgetStatus } from './budget';

export interface ReportDto {
    title: string;
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    dataPoints: Record<string, number>;
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
