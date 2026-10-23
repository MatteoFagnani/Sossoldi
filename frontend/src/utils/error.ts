import axios from 'axios';

export const extractApiError = (err: unknown, fallback = 'Si è verificato un errore.'): string => {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data === 'string' && data.trim()) return data;
        if (data && typeof data === 'object') {
            if ('message' in data && typeof data.message === 'string') return data.message;
            if ('error' in data && typeof data.error === 'string') return data.error;
            const values = Object.values(data).filter((v): v is string => typeof v === 'string');
            if (values.length > 0) return values.join('. ');
        }
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
};
