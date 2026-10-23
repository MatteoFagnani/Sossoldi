export const MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export const SHORT_MONTHS = [
    'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
    'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic',
];

export const MONTH_KEYS = [
    'gen', 'feb', 'mar', 'apr', 'mag', 'giu',
    'lug', 'ago', 'set', 'ott', 'nov', 'dic',
];

export const getSelectableYears = (startYear = 2020, futureYears = 0): number[] => {
    const endYear = new Date().getFullYear() + futureYears;
    return Array.from({ length: Math.max(1, endYear - startYear + 1) }, (_, i) => startYear + i);
};
