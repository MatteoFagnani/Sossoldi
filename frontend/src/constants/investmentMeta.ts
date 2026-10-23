import {
    Bot,
    Wallet,
    Layers,
    BarChart2,
    TrendingUp,
    PieChart,
    Coins,
    ShieldCheck,
    Landmark,
} from 'lucide-react';
import type { InvestmentType } from '../types';

export const typeMetadata: Record<InvestmentType, { label: string; icon: typeof Wallet; color: string; bg: string }> = {
    ROBO_ADVISOR: { label: 'Roboadvisor', icon: Bot, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    ETF: { label: 'ETF', icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    STOCK: { label: 'Azioni', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    FUND: { label: 'Fondi', icon: PieChart, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
    CRYPTO: { label: 'Crypto', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    PENSION: { label: 'Pensione', icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
    BOND: { label: 'Obbligazioni', icon: Landmark, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
    OTHER: { label: 'Altro', icon: Layers, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};

export const investmentTypes: { value: InvestmentType; label: string; icon: typeof Wallet; desc: string }[] = [
    { value: 'ROBO_ADVISOR', label: 'Roboadvisor', icon: Bot, desc: 'Moneyfarm, Tinaba, Euclidea' },
    { value: 'ETF', label: 'ETF', icon: BarChart2, desc: 'Fondi indicizzati (VWCE, SWDA)' },
    { value: 'STOCK', label: 'Azioni', icon: TrendingUp, desc: 'Singoli titoli azionari' },
    { value: 'FUND', label: 'Fondi Comuni', icon: PieChart, desc: 'Gestioni attive e fondi SICAV' },
    { value: 'BOND', label: 'Obbligazioni', icon: Landmark, desc: 'BTP, BOT, titoli governativi' },
    { value: 'PENSION', label: 'Fondo Pensione', icon: ShieldCheck, desc: 'PIP e fondi pensione negoziali' },
    { value: 'CRYPTO', label: 'Crypto', icon: Coins, desc: 'Bitcoin, Ethereum e crypto' },
    { value: 'OTHER', label: 'Altro', icon: Layers, desc: 'Beni rifugio, oro, liquidità' },
];
