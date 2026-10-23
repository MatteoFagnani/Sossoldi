import { useState, useCallback } from 'react';
import { budgetService, categoryService } from '../services/services';
import { extractApiError } from '../utils/error';
import type { Category, BudgetStatus } from '../types';

export function useBudgets(month: number, year: number) {
    const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [b, c] = await Promise.all([
                budgetService.getByMonth(month, year),
                categoryService.getAll(),
            ]);
            setBudgets(b);
            setCategories(c.filter(cat => cat.type === 'EXPENSE'));
        } catch {
            setError('Errore durante il caricamento dei budget.');
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    const saveBudget = async (id: number | null, form: { categoryId: string; limitAmount: string; percentageOfIncome?: string; automatic: boolean; type?: 'PERMANENT' | 'TEMPORARY'; month?: string; year?: string }) => {
        setSaving(true);
        setError('');
        try {
            const limit = form.limitAmount ? parseFloat(form.limitAmount) : null;
            const pct = form.percentageOfIncome ? parseFloat(form.percentageOfIncome) : null;

            if (id) {
                const payload = {
                    categoryId: parseInt(form.categoryId),
                    limitAmount: limit,
                    percentageOfIncome: pct,
                    automatic: form.automatic,
                    type: form.type || 'PERMANENT',
                    month: form.type === 'TEMPORARY' ? parseInt(form.month || String(month)) : undefined,
                    year: form.type === 'TEMPORARY' ? parseInt(form.year || String(year)) : undefined
                };
                await budgetService.update(id, payload);
            } else {
                const payload = {
                    categoryId: parseInt(form.categoryId),
                    limitAmount: limit,
                    percentageOfIncome: pct,
                    automatic: form.automatic
                };
                await budgetService.create(payload);
            }
            await loadData();
            return true;
        } catch (err: unknown) {
            setError(extractApiError(err, 'Errore durante il salvataggio del budget'));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const deleteBudget = async (id: number) => {
        try {
            await budgetService.remove(id);
            await loadData();
            return true;
        } catch {
            setError('Impossibile eliminare il budget.');
            return false;
        }
    };

    return {
        budgets,
        categories,
        loading,
        saving,
        error,
        setError,
        loadData,
        saveBudget,
        deleteBudget,
    };
}
