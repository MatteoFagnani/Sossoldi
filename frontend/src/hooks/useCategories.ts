import { useState, useCallback } from 'react';
import { categoryService } from '../services/services';
import type { Category, TransactionType } from '../types';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch {
            setError('Errore durante il caricamento delle categorie.');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveCategory = async (id: number | null, data: { name: string; type: TransactionType; color: string; parentId?: number | null }) => {
        setSaving(true);
        setError('');
        try {
            if (id) {
                await categoryService.update(id, data);
            } else {
                await categoryService.create(data);
            }
            await loadCategories();
            return true;
        } catch (err: unknown) {
            const resData = (err as { response?: { data?: Record<string, string> } })?.response?.data;
            setError(resData ? Object.values(resData).join('. ') : 'Errore durante il salvataggio della categoria');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const deleteCategory = async (id: number) => {
        try {
            await categoryService.remove(id);
            await loadCategories();
            return true;
        } catch {
            setError('Impossibile eliminare la categoria. Potrebbe essere in uso.');
            return false;
        }
    };

    return {
        categories,
        loading,
        saving,
        error,
        setError,
        loadCategories,
        saveCategory,
        deleteCategory,
    };
}

