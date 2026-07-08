import { useState, useCallback } from 'react';
import { transactionService, categoryService, accountService } from '../services/services';
import type { Transaction, Category, Account, AccountMovement } from '../types';

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [movements, setMovements] = useState<AccountMovement[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async (accountId?: string) => {
        setLoading(true);
        setError('');
        try {
            const [txs, movementData, cats, accs] = await Promise.all([
                transactionService.getAll(),
                transactionService.getMovements(accountId || undefined),
                categoryService.getAll(),
                accountService.getAll(),
            ]);
            setTransactions([...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setMovements(movementData);
            setCategories(cats);
            setAccounts(accs);
        } catch {
            setError('Errore durante il caricamento dei dati.');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveTransaction = async (
        id: number | null,
        data: { amount: string | number; date: string; description: string; categoryId: string | number; accountId?: string | number },
        accountFilter?: string
    ) => {
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...data,
                amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
                categoryId: typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId,
                accountId: data.accountId ? (typeof data.accountId === 'string' ? parseInt(data.accountId) : data.accountId) : undefined,
            };
            if (id) {
                await transactionService.update(id, payload);
            } else {
                await transactionService.create(payload);
            }
            await loadData(accountFilter);
            return true;
        } catch (err: unknown) {
            const resData = (err as { response?: { data?: Record<string, string> } })?.response?.data;
            setError(resData ? Object.values(resData).join('. ') : 'Errore durante il salvataggio della transazione');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const deleteTransaction = async (id: number, accountFilter?: string) => {
        try {
            await transactionService.remove(id);
            await loadData(accountFilter);
            return true;
        } catch {
            setError('Impossibile eliminare la transazione.');
            return false;
        }
    };

    return {
        transactions,
        movements,
        categories,
        accounts,
        loading,
        saving,
        error,
        setError,
        loadData,
        saveTransaction,
        deleteTransaction,
    };
}
