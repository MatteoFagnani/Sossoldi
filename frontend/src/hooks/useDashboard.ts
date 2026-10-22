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

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [dashRes, accsRes, invsRes, catsRes] = await Promise.allSettled([
                dashboardService.getOverview(month, year),
                accountService.getAll(),
                investmentService.getAll(),
                categoryService.getAll(),
            ]);

            if (dashRes.status === 'fulfilled') {
                setData(dashRes.value);
            } else {
                setError('Errore nel caricamento della dashboard.');
            }

            if (accsRes.status === 'fulfilled') setAccounts(accsRes.value);
            if (invsRes.status === 'fulfilled') setInvestments(invsRes.value);
            if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
        } catch {
            setError('Errore imprevisto nel caricamento dei dati.');
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeAccounts = accounts.filter(a => !a.archived);
    const accountTotal = activeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const investmentTotal = investments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
    const netWorth = accountTotal + investmentTotal;
    const liquidTotal = activeAccounts
        .filter(a => a.type !== 'INVESTMENT')
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    return {
        data,
        accounts,
        activeAccounts,
        investments,
        categories,
        accountTotal,
        investmentTotal,
        netWorth,
        liquidTotal,
        loading,
        error,
        refetch: fetchData,
    };
}
