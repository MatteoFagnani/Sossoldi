import React from 'react';

export const StatCard: React.FC<{
    label: string;
    value: string;
    sub: string;
    up?: boolean;
    color: string;
    icon: React.ReactNode;
}> = ({ label, value, sub, up, color, icon }) => (
    <div className="app-card p-5">
        <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{label}</p>
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15`, color }}>
                {icon}
            </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className={`text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>{sub}</p>
    </div>
);
