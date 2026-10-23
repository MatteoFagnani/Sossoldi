import { useEffect, useState, useCallback } from 'react';
import { dashboardService, accountService, investmentService, categoryService } from '../services/services';
import type { DashboardOverview, Account, Investment, Category } from '../types';

export function useDashboard(month?: number, year?: number) {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStaticResources = useCallback(async () => {
        const [accsRes, invsRes, catsRes] = await Promise.allSettled([
            accountService.getAll(),
            investmentService.getAll(),
            categoryService.getAll(),
        ]);
        if (accsRes.status === 'fulfilled') setAccounts(accsRes.value);
        if (invsRes.status === 'fulfilled') setInvestments(invsRes.value);
        if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
    }, []);

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const overview = await dashboardService.getOverview(month, year);
            setData(overview);
        } catch {
            setError('Errore nel caricamento della dashboard.');
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    const refetch = useCallback(async () => {
        await Promise.all([fetchOverview(), fetchStaticResources()]);
    }, [fetchOverview, fetchStaticResources]);

    useEffect(() => {
        fetchStaticResources();
    }, [fetchStaticResources]);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const activeAccounts = accounts.filter(a => !a.archived);
    const accountTotal = activeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const investmentTotal = investments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
    const netWorth = accountTotal + investmentTotal;
    const liquidTotal = activeAccounts
        .filter(a => a.type !== 'INVESTMENT')
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    return {
        data,
        activeAccounts,
        categories,
        investmentTotal,
        netWorth,
        liquidTotal,
        loading,
        error,
        refetch,
    };
}
