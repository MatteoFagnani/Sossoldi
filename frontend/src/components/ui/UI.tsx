import React from 'react';

export const ProgressBar: React.FC<{
    pct: number;
    color?: string;
    height?: number;
}> = ({ pct, color = '#111827', height = 6 }) => (
    <div
        className="w-full bg-gray-100 rounded-full overflow-hidden"
        style={{ height }}
    >
        <div
            className="h-full rounded-full transition-all duration-700"
            style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: color,
            }}
        />
    </div>
);

export const StatCard: React.FC<{
    label: string;
    value: string;
    sub: string;
    up?: boolean;
    color: string;
    icon: React.ReactNode;
    onClick?: () => void;
}> = ({ label, value, sub, up, color, icon, onClick }) => (
    <div
        onClick={onClick}
        className={`app-card p-5 ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-xs transition-all' : ''}`}
    >
        <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <div className="p-2 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
                {icon}
            </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{value}</p>
        <p className={`text-xs font-medium ${up === undefined ? 'text-gray-500' : up ? 'text-emerald-600' : 'text-red-500'}`}>
            {sub}
        </p>
    </div>
);
