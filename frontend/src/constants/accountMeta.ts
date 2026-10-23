import { Landmark, Wallet, PiggyBank, Banknote, CreditCard, TrendingUp } from 'lucide-react';
import type { AccountType } from '../types';

export const accountTypes: { value: AccountType; label: string }[] = [
    { value: 'CHECKING', label: 'Conto corrente' },
    { value: 'SAVINGS', label: 'Risparmio' },
    { value: 'CASH', label: 'Contanti' },
    { value: 'CARD', label: 'Carta' },
    { value: 'INVESTMENT', label: 'Investimenti' },
    { value: 'OTHER', label: 'Altro' },
];

export const getAccountIcon = (type: AccountType) => {
    switch (type) {
        case 'CHECKING':
            return Landmark;
        case 'SAVINGS':
            return PiggyBank;
        case 'CASH':
            return Banknote;
        case 'CARD':
            return CreditCard;
        case 'INVESTMENT':
            return TrendingUp;
        default:
            return Wallet;
    }
};

export const getAccountColor = (type: AccountType): string => {
    switch (type) {
        case 'CHECKING':
            return '#111827';
        case 'SAVINGS':
            return '#06b6d4';
        case 'CASH':
            return '#10b981';
        case 'CARD':
            return '#8b5cf6';
        case 'INVESTMENT':
            return '#f59e0b';
        default:
            return '#64748b';
    }
};

