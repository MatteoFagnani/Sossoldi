import React from 'react';

/* ─── UI COMPONENTS ─────────────────────────────────────────── */

export const Card: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
    <div
        className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}
        style={style}
    >
        {children}
    </div>
);

export const Btn: React.FC<{
    children: React.ReactNode;
    variant?: 'primary' | 'ghost' | 'danger';
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}> = ({ children, variant = 'primary', onClick, className = '', style = {}, type = 'button', disabled = false }) => {
    const variants = {
        primary: 'bg-gray-900 hover:bg-black text-white',
        ghost: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
            style={style}
        >
            {children}
        </button>
    );
};

export const Chip: React.FC<{
    children?: React.ReactNode;
    variant?: 'income' | 'expense' | 'auto';
}> = ({ children, variant = 'income' }) => {
    const styles = {
        income: 'text-emerald-700 bg-emerald-50',
        expense: 'text-red-600 bg-red-50',
        auto: 'text-gray-900 bg-gray-100',
    };

    const labels = {
        income: 'Entrata',
        expense: 'Uscita',
        auto: 'Automatico',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
            {children || labels[variant]}
        </span>
    );
};

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
}> = ({ label, value, sub, up, color, icon }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
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
