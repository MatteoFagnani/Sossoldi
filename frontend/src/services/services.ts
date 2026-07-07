import api from './api';
import type { AuthResponse, Category, Transaction, TransactionCategoryMapping, AutomationRule, Budget, BudgetStatus, DashboardOverview } from '../types';

export const authService = {
    async register(username: string, email: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', { username, email, password });
        return response.data;
    },
    async login(username: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/authenticate', { username, password });
        return response.data;
    },
};

export const categoryService = {
    async getAll(): Promise<Category[]> { return (await api.get('/categories')).data; },
    async getByType(type: string): Promise<Category[]> { return (await api.get(`/categories/type/${type}`)).data; },
    async create(data: object): Promise<Category> { return (await api.post('/categories', data)).data; },
    async update(id: number, data: object): Promise<Category> { return (await api.put(`/categories/${id}`, data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/categories/${id}`)).data; },
};

export const transactionService = {
    async getAll(): Promise<Transaction[]> { return (await api.get('/transactions')).data; },
    async create(data: object): Promise<Transaction> { return (await api.post('/transactions', data)).data; },
    async update(id: number, data: object): Promise<Transaction> { return (await api.put(`/transactions/${id}`, data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/transactions/${id}`)).data; },
};

export const transactionCategoryMappingService = {
    async getAll(): Promise<TransactionCategoryMapping[]> { return (await api.get('/transaction-category-mappings')).data; },
    async save(data: TransactionCategoryMapping): Promise<TransactionCategoryMapping> { return (await api.put('/transaction-category-mappings', data)).data; },
};
export const automationRuleService = {
    async getAll(): Promise<AutomationRule[]> { return (await api.get('/automation-rules')).data; },
    async create(data: object): Promise<AutomationRule> { return (await api.post('/automation-rules', data)).data; },
    async update(id: number, data: object): Promise<AutomationRule> { return (await api.put(`/automation-rules/${id}`, data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/automation-rules/${id}`)).data; },
};

export const budgetService = {
    async getByMonth(month: number, year: number): Promise<BudgetStatus[]> {
        return (await api.get(`/budgets?month=${month}&year=${year}`)).data;
    },
    async create(data: object): Promise<Budget> { return (await api.post('/budgets', data)).data; },
    async update(id: number, data: object): Promise<Budget> { return (await api.put(`/budgets/${id}`, data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/budgets/${id}`)).data; },
};

export const dashboardService = {
    async getOverview(): Promise<DashboardOverview> { return (await api.get('/dashboard')).data; },
};
