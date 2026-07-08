import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Tags, ArrowLeftRight, Target, ChevronsLeft, Wallet, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transazioni' },
    { to: '/wealth', icon: Wallet, label: 'Patrimonio' },
    { to: '/investments', icon: TrendingUp, label: 'Investimenti' },
    { to: '/budgets', icon: Target, label: 'Budget' },
    { to: '/categories', icon: Tags, label: 'Categorie' },
];

const pageTitles: Record<string, string> = {
    '/profile': 'Profilo',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const currentPage = navItems.find((i) => i.to === location.pathname)?.label ?? pageTitles[location.pathname] ?? 'Dashboard';
    const userInitial = user?.username?.charAt(0).toUpperCase() ?? '?';

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900">

            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-20' : 'w-64'} flex-shrink-0 flex flex-col bg-white border-r border-gray-200 transition-all duration-200`}>

                {/* Brand */}
                <div className={`flex items-center border-b border-gray-100 ${collapsed ? 'justify-center px-3 py-5' : 'justify-between gap-3 px-4 py-5'}`}>
                    <button
                        onClick={() => collapsed ? setCollapsed(false) : navigate('/')}
                        className="flex items-center gap-3 min-w-0"
                        title={collapsed ? 'Espandi sidebar' : 'Sossoldi'}
                        aria-label={collapsed ? 'Espandi sidebar' : 'Vai alla panoramica'}
                    >
                        <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <img
                                src="/app-icon.svg"
                                alt="Logo"
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </span>
                        {!collapsed && <span className="text-base font-semibold text-gray-900 truncate">Sossoldi</span>}
                    </button>
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Comprimi sidebar"
                            title="Comprimi sidebar"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            title={collapsed ? label : undefined}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`
                            }
                        >
                            <Icon size={17} className="flex-shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <header className="h-14 flex items-center justify-between px-8 bg-white border-b border-gray-200 flex-shrink-0">
                    <h1 className="text-base font-semibold text-gray-900">{currentPage}</h1>
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-9 h-9 rounded-full bg-gray-900 text-white text-sm font-semibold flex items-center justify-center hover:bg-black transition-colors"
                        aria-label="Apri profilo"
                        title={user?.username ?? 'Profilo'}
                    >
                        {userInitial}
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="max-w-screen-xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
