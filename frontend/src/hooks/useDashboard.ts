import { useEffect, useState } from 'react';
import { dashboardService } from '../services/services';
import type { DashboardOverview } from '../types';

export function useDashboard(month?: number, year?: number) {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await dashboardService.getOverview(month, year);
                if (mounted) setData(res);
            } catch {
                if (mounted) setError('Errore nel caricamento della dashboard.');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();

        return () => { mounted = false; };
    }, [month, year]);

    return { data, loading, error };
}
