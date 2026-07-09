import api from './api';
import type { AuthResponse, Account, AccountMovement, AccountTransfer, Category, Investment, Transaction, TransactionCategoryMapping, Budget, BudgetStatus, DashboardOverview } from '../types';

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

export const accountService = {
    async getAll(): Promise<Account[]> { return (await api.get('/accounts')).data; },
    async create(data: object): Promise<Account> { return (await api.post('/accounts', data)).data; },
    async update(id: number, data: object): Promise<Account> { return (await api.put(`/accounts/${id}`, data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/accounts/${id}`)).data; },
};

export const accountTransferService = {
    async getAll(): Promise<AccountTransfer[]> { return (await api.get('/account-transfers')).data; },
    async create(data: object): Promise<AccountTransfer> { return (await api.post('/account-transfers', data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/account-transfers/${id}`)).data; },
};

export const investmentService = {
    async getAll(): Promise<Investment[]> { return (await api.get('/investments')).data; },
    async create(data: object): Promise<Investment> { return (await api.post('/investments', data)).data; },
    async update(id: number, data: object): Promise<Investment> { return (await api.put(`/investments/${id}`, data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/investments/${id}`)).data; },
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
    async getMovements(accountId?: number | string): Promise<AccountMovement[]> { return (await api.get('/transactions/movements', { params: accountId ? { accountId } : undefined })).data; },
    async create(data: object): Promise<Transaction> { return (await api.post('/transactions', data)).data; },
    async update(id: number, data: object): Promise<Transaction> { return (await api.put(`/transactions/${id}`, data)).data; },
    async remove(id: number): Promise<void> { return (await api.delete(`/transactions/${id}`)).data; },
};

export const transactionCategoryMappingService = {
    async getAll(): Promise<TransactionCategoryMapping[]> { return (await api.get('/transaction-category-mappings')).data; },
    async save(data: TransactionCategoryMapping): Promise<TransactionCategoryMapping> { return (await api.put('/transaction-category-mappings', data)).data; },
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
    async getOverview(month?: number, year?: number): Promise<DashboardOverview> {
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', String(month));
        if (year !== undefined) params.append('year', String(year));
        const query = params.toString();
        return (await api.get(`/dashboard${query ? `?${query}` : ''}`)).data;
    },
};
