import * as XLSX from 'xlsx';
import { extractApiError } from './error';
import type { TransactionType } from '../types';

export type SheetRow = unknown[];
export type CategoryMappings = Record<string, number>;

const readText = (value: unknown): string => {
    if (value && typeof value === 'object' && 'v' in value) return String((value as { v?: unknown }).v ?? '').trim();
    return String(value ?? '').trim();
};

export const cleanDescription = (value: unknown): string => {
    const raw = readText(value);
    let text = raw.trim();
    if (!text) return '';

    // 1. If 'PRESSO' exists, capture following merchant
    const pressoMatch = text.match(/\bPRESSO\b\s+(.+)$/i);
    if (pressoMatch) {
        text = pressoMatch[1].trim();
    }
    // 2. Remove C/O prefix
    text = text.replace(/^C\/O\s+/i, '');
    // 3. Remove common banking prefixes
    text = text.replace(/^(PAGAMENTO|PAGAM|DISPOSIZIONE\s+BONIFICO|BONIFICO|ADDEBITO\s+DIRETTO|ADDEBITO|ACCREDITO|PRELIEVO)(\s+(BANCOMAT|POS|SEPA|CARTA|TRAMITE\s+POS|A\s+FAVORE\s+DI))?\s*/i, '');
    text = text.replace(/^A\s+FAVORE\s+DI\s+/i, '');

    // 4. Remove dates
    text = text.replace(/\bDEL\s+\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?\b/gi, ' ');
    text = text.replace(/\b\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?\b/g, ' ');

    // 5. Remove times
    text = text.replace(/\bORE\s+\d{1,2}[:.]\d{2}([:.]\d{2})?\b/gi, ' ');
    text = text.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, ' ');

    // 6. Remove prices and currency
    text = text.replace(/\b(IMPORTO|IMP|TOTALE|TOT)\b[:.\s]*\d+([.,]\d+)?\s*(EUR|EURO|€|E\.)?/gi, ' ');
    text = text.replace(/\b(EUR|EURO|€|E\.)\s*\d+([.,]\d+)?/gi, ' ');
    text = text.replace(/\d+([.,]\d+)?\s*(EUR|EURO|€|E\.)\b/gi, ' ');
    text = text.replace(/\d+([.,]\d+)?\s*€/g, ' ');
    text = text.replace(/\b\d+([.,]\d{2})\b/g, ' ');

    // 7. Remove card tokens / reference numbers / terminal codes
    text = text.replace(/\b(PAN|CARTA|C\.ES|AUT|AUTH|TERMINALE|POS|OPERAZIONE|DIV|REF|ID|TRX|N\.|NUM)\b[:.\s]*\w+/gi, ' ');
    text = text.replace(/[*\d]{6,}/g, ' ');
    text = text.replace(/\*{3,}\d+/g, ' ');
    text = text.replace(/\bN\.\s*\d+/gi, ' ');
    text = text.replace(/\b(EUR|EURO)\b|[€]/gi, ' ');

    // 8. Clean up hyphens and extra whitespace
    text = text.replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ').trim();
    text = text.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();

    return text || raw.split('-')[0].trim();
};

export const similarDescriptionKey = (description: string): string => description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, ' ')
    .replace(/\b[a-z]*\d+[a-z\d]*\b/g, ' ')
    .replace(/\b\d+[a-z]+\b/g, ' ')
    .replace(/x{2,}/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const mappingKey = (type: TransactionType, description: string): string =>
    `${type}:${similarDescriptionKey(description) || description.toLowerCase()}`;

export const transactionImportKey = (accountId: number | string | null | undefined, type: TransactionType, date: string, amount: number, description: string): string =>
    `${accountId ?? ''}:${type}:${date}:${Math.round(amount * 100)}:${similarDescriptionKey(cleanDescription(description))}`;

export const transactionLooseKey = (accountId: number | string | null | undefined, type: TransactionType, date: string, amount: number): string =>
    `${accountId ?? ''}:${type}:${date}:${Math.round(amount * 100)}`;

const legacyMappingKeys = ['transaction-category-mappings', 'transactionCategoryMappings', 'categoryMappings'];

export const readLegacyMappings = (): { key: string; mappings: CategoryMappings } | null => {
    for (const key of legacyMappingKeys) {
        const value = localStorage.getItem(key);
        if (!value) continue;
        try {
            const parsed = JSON.parse(value) as CategoryMappings;
            if (parsed && typeof parsed === 'object') return { key, mappings: parsed };
        } catch {
            // Ignore broken old browser state.
        }
    }
    return null;
};

const normalizeHeader = (value: unknown): string => readText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

export const columnIndex = (headers: SheetRow, ...names: string[]): number => {
    const wanted = names.map(normalizeHeader);
    const normalized = headers.map(normalizeHeader);
    for (const name of wanted) {
        const exactIndex = normalized.findIndex(header => header === name);
        if (exactIndex >= 0) return exactIndex;
    }
    for (const name of wanted) {
        const partialIndex = normalized.findIndex(header => header && name && (header.includes(name) || name.includes(header)));
        if (partialIndex >= 0) return partialIndex;
    }
    throw new Error(`Colonna mancante: ${names[0]}.`);
};

export const optionalColumnIndex = (headers: SheetRow, ...names: string[]): number => {
    try {
        return columnIndex(headers, ...names);
    } catch {
        return -1;
    }
};

export const findHeaderRowIndex = (rows: SheetRow[]): number => rows.findIndex(row => {
    const headers = row.map(normalizeHeader);
    return headers.some(header => ['datavaluta', 'data'].includes(header))
        && headers.some(header => ['descrizioneestesa', 'descrizione', 'dettagli', 'operazione'].includes(header))
        && headers.some(header => ['addebiti', 'accrediti', 'importo'].includes(header));
});

export const parseSignedAmount = (...values: unknown[]): number => {
    for (const value of values) {
        if (typeof value === 'number') return value;
        const text = readText(value);
        const normalized = text
            .replace(/[()]/g, '')
            .replace(/[^\d,.-]/g, '')
            .replace(/\.(?=\d{3}(\D|$))/g, '')
            .replace(',', '.');
        const amount = Number.parseFloat(normalized);
        if (Number.isFinite(amount)) return amount;
    }
    return 0;
};

export const parseAmount = (...values: unknown[]): number => Math.abs(parseSignedAmount(...values));

export const parseExcelDate = (...values: unknown[]): string => {
    for (const value of values) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');
        }
        if (typeof value === 'number') {
            const parsed = XLSX.SSF.parse_date_code(value);
            if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
        const text = readText(value).split(/\s+/)[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
        const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
        if (match) {
            const [, day, month, year] = match;
            return `${year.length === 2 ? `20${year}` : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
    return '';
};

export const apiErrorMessage = (err: unknown): string => extractApiError(err, 'Errore sconosciuto');
