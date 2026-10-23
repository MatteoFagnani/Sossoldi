import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    CheckCircle,
    XCircle,
    ShieldCheck,
    Sparkles,
    Loader2,
    Zap,
    Save,
    ExternalLink,
    AlertCircle,
    Info,
    Trash2,
    AlertTriangle,
    LogOut,
    Mail,
    User as UserIcon,
    Camera,
    RefreshCw,
    GraduationCap,
    Scale,
    Briefcase,
    Rocket,
    Users,
    ShieldAlert,
    CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { aiService } from '../services/services';
import type { AiStatus, FinancialProfileType, User } from '../types';

interface FinancialProfileOption {
    id: FinancialProfileType;
    title: string;
    subtitle: string;
    badge: string;
    icon: typeof GraduationCap;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    split: { needs: number; wants: number; savings: number };
    buffer: string;
}

const FINANCIAL_PROFILES: FinancialProfileOption[] = [
    {
        id: 'STUDENT',
        title: 'Studente / Fuorisede',
        subtitle: 'Sussistenza & Controllo Uscite',
        badge: 'Regola 70 / 15 / 15',
        icon: GraduationCap,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        description: 'Per chi ha entrate minime o assenti (borse di studio, paghette familiari) e deve focalizzarsi sul contenimento del burn rate quotidiano ed evitare debiti.',
        split: { needs: 70, wants: 15, savings: 15 },
        buffer: '2-3 mesi (o 500-1000€)',
    },
    {
        id: 'BALANCED_50_30_20',
        title: 'Lavoratore Standard',
        subtitle: 'Classica Regola 50 / 30 / 20',
        badge: 'Regola 50 / 30 / 20',
        icon: Scale,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        description: 'Ideale per dipendenti con stipendio fisso mensile. Equilibrio perfetto tra 50% bisogni, 30% desideri/svago e 20% risparmio e investimenti.',
        split: { needs: 50, wants: 30, savings: 20 },
        buffer: '3-6 mesi',
    },
    {
        id: 'FREELANCER',
        title: 'Freelance & Partita IVA',
        subtitle: 'Income Smoothing & Buffer Esteso',
        badge: 'Regola 60 / 20 / 20',
        icon: Briefcase,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        description: 'Per entrate fluttuanti e scadenze fiscali periodiche. Richiede un cuscinetto liquidità esteso a 6-12 mesi e isolamento preventivo delle tasse.',
        split: { needs: 60, wants: 20, savings: 20 },
        buffer: '6-12 mesi',
    },
    {
        id: 'FIRE_SEEKER',
        title: 'FIRE Seeker',
        subtitle: 'Risparmio & Investimento Aggressivo',
        badge: 'Savings Rate > 50%',
        icon: Rocket,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        description: 'Orientato all\'indipendenza finanziaria e pensione anticipata. Massimizzazione del PAC in ETF e riduzione consapevole delle spese superflue.',
        split: { needs: 35, wants: 15, savings: 50 },
        buffer: '6-12 mesi',
    },
    {
        id: 'FAMILY',
        title: 'Famiglia & Genitori',
        subtitle: 'Protezione & Spese Strutturate',
        badge: 'Regola 65 / 15 / 20',
        icon: Users,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        description: 'Focalizzato su spese fisse importanti per figli, casa, salute e scuola, abbinato a un fondo imprevisti robusto e tutela del futuro.',
        split: { needs: 65, wants: 15, savings: 20 },
        buffer: '4-6 mesi',
    },
    {
        id: 'DEBT_REPAYMENT',
        title: 'Ripartenza & Debiti',
        subtitle: 'Estinzione Accelerata Passività',
        badge: 'Regola 70 / 10 / 20',
        icon: ShieldAlert,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: 'Priorità ad abbattere finanziamenti e rate con metodo valanga/neve, riducendo lo svago al minimo essenziale fino al pareggio.',
        split: { needs: 70, wants: 10, savings: 20 },
        buffer: '1-2 mesi',
    },
];

const apiErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : fallback;

export default function ProfilePage() {
    const { user, setAuth, logout } = useAuthStore();

    // Financial Profile State
    const [selectedProfile, setSelectedProfile] = useState<FinancialProfileType>(
        user?.financialProfile || 'BALANCED_50_30_20'
    );
    const [savingProfileType, setSavingProfileType] = useState(false);
    const [financialProfileSuccess, setFinancialProfileSuccess] = useState<string | null>(null);

    // Profile Info State
    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        avatarUrl: user?.avatarUrl || '',
        email: user?.email || '',
        geminiApiKey: user?.geminiApiKey || '',
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [refreshingProfile, setRefreshingProfile] = useState(false);
    const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // AI Status & Test State
    const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch fresh profile from backend on mount to ensure avatar and Google data are completely synced
    const fetchFreshProfile = async () => {
        try {
            setRefreshingProfile(true);
            const res = await api.get<User>('/users/me');
            const freshUser = res.data;
            if (freshUser) {
                setAuth(freshUser);
                if (freshUser.financialProfile) {
                    setSelectedProfile(freshUser.financialProfile);
                }
                setProfileForm({
                    username: freshUser.username || '',
                    firstName: freshUser.firstName || '',
                    lastName: freshUser.lastName || '',
                    avatarUrl: freshUser.avatarUrl || '',
                    email: freshUser.email || '',
                    geminiApiKey: freshUser.geminiApiKey || '',
                });
            }
        } catch (err) {
            console.warn('Impossibile aggiornare i dati profilo:', err);
        } finally {
            setRefreshingProfile(false);
        }
    };

    useEffect(() => {
        fetchFreshProfile();
        aiService
            .getStatus()
            .then((status) => setAiStatus(status))
            .catch((err) => console.warn('Failed to load AI status:', err));
    }, []);

    const handleSelectFinancialProfile = async (profileType: FinancialProfileType) => {
        if (selectedProfile === profileType && !savingProfileType) return;
        setSelectedProfile(profileType);
        setSavingProfileType(true);
        setFinancialProfileSuccess(null);
        try {
            const res = await api.put<User>('/users/profile', {
                financialProfile: profileType,
            });
            setAuth(res.data);
            const opt = FINANCIAL_PROFILES.find((p) => p.id === profileType);
            setFinancialProfileSuccess(`Profilo finanziario impostato su: ${opt?.title || profileType}`);
            setTimeout(() => setFinancialProfileSuccess(null), 4000);
        } catch (err: unknown) {
            console.error('Errore durante il salvataggio del profilo finanziario:', err);
        } finally {
            setSavingProfileType(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileStatus(null);
        try {
            const response = await api.put('/users/profile', profileForm);
            const updatedUser = response.data;
            setAuth(updatedUser);
            setProfileStatus({ type: 'success', message: 'Profilo e configurazione aggiornati con successo!' });
            const freshStatus = await aiService.getStatus();
            setAiStatus(freshStatus);
        } catch (error: unknown) {
            setProfileStatus({
                type: 'error',
                message: apiErrorMessage(error, "Errore durante l'aggiornamento del profilo."),
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleTestAiConnection = async () => {
        setTestLoading(true);
        setTestStatus(null);
        try {
            const res = await aiService.testConnection(profileForm.geminiApiKey || undefined);
            setTestStatus({
                success: res.success,
                message: res.message,
            });
            if (res.success) {
                const fresh = await aiService.getStatus();
                setAiStatus(fresh);
            }
        } catch (err: unknown) {
            setTestStatus({
                success: false,
                message: apiErrorMessage(err, 'Errore durante il test di connessione con Gemini.'),
            });
        } finally {
            setTestLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            await api.delete('/users/me');
            await logout();
        } catch (error: unknown) {
            console.error('Delete account error:', error);
            const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            alert(msg || "Errore durante l'eliminazione dell'account.");
            setDeleteLoading(false);
        }
    };

    const inputClass =
        'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all text-xs text-gray-900';
    const labelClass = 'block text-xs font-medium text-gray-700 mb-1.5';

    const displayName = user?.firstName
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
        : user?.username || 'Utente';
    const userInitial = (user?.firstName?.charAt(0) || user?.username?.charAt(0) || '?').toUpperCase();

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-14">
            {/* 1. HERO PROFILE CARD */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {/* Avatar Container with Google badge */}
                        <div className="relative shrink-0">
                            {user?.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={displayName}
                                    className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 shadow-sm"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-900 text-white text-2xl font-bold flex items-center justify-center ring-4 ring-gray-100 shadow-sm">
                                    {userInitial}
                                </div>
                            )}

                            {/* Google Icon Badge */}
                            <div
                                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200"
                                title="Account sincronizzato con Google"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Name and Meta */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
                                    {displayName}
                                </h1>
                            </div>

                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Mail size={12} className="text-gray-400" />
                                    {user?.email}
                                </span>
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                                {user?.avatarUrl && (
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <Camera size={11} />
                                        Avatar da Google
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={fetchFreshProfile}
                            disabled={refreshingProfile}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            title="Ricarica dati da Google"
                        >
                            <RefreshCw size={13} className={refreshingProfile ? 'animate-spin' : ''} />
                            Sincronizza
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-rose-600 border border-gray-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            title="Disconnetti"
                        >
                            <LogOut size={13} />
                            Esci
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. PROFILO FINANZIARIO & FILOSOFIA DI BUDGET */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Scale size={18} />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">
                                Profilo Finanziario & Regola di Budget
                            </h2>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                                Personalizza Analisi & AI
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Seleziona la tua situazione economica attuale: la pagina <strong>Analisi</strong>, le percentuali target e i consigli dell&apos;<strong>AI Coach</strong> si adatteranno al tuo profilo.
                        </p>
                    </div>

                    {financialProfileSuccess && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl animate-in fade-in shrink-0">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>{financialProfileSuccess}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FINANCIAL_PROFILES.map((p) => {
                        const Icon = p.icon;
                        const isSelected = selectedProfile === p.id;
                        return (
                            <div
                                key={p.id}
                                onClick={() => handleSelectFinancialProfile(p.id)}
                                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/15 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.bgColor} ${p.color}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {p.title}
                                                </h3>
                                                <p className="text-[10px] text-gray-500 font-medium">
                                                    {p.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 mt-0.5">
                                            {isSelected ? (
                                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                                    <CheckCircle2 size={13} />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border border-gray-300 group-hover:border-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                        {p.description}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                    <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                        {p.badge}
                                    </span>
                                    <span className="text-gray-500 font-medium">
                                        {p.buffer}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. GRID: PERSONAL DATA & GOOGLE SECURITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dati Personali Form */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
                    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
                            <UserIcon size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Dati Personali</h2>
                            <p className="text-[11px] text-gray-400">Modifica nome, cognome e username</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Nome</label>
                                <input
                                    type="text"
                                    value={profileForm.firstName}
                                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                    className={inputClass}
                                    placeholder="Es. Mario"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Cognome</label>
                                <input
                                    type="text"
                                    value={profileForm.lastName}
                                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                    className={inputClass}
                                    placeholder="Es. Rossi"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Nome Utente (Username) *</label>
                            <input
                                type="text"
                                value={profileForm.username}
                                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                className={inputClass}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Email (Account Google) *</label>
                            <input
                                type="email"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                className={inputClass}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>URL Foto Profilo / Avatar</label>
                            <input
                                type="text"
                                value={profileForm.avatarUrl}
                                onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                                className={inputClass}
                                placeholder="https://lh3.googleusercontent.com/..."
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Inserito in automatico al login con Google. Puoi aggiornarlo o ripristinarlo.
                            </p>
                        </div>

                        {profileStatus && (
                            <div
                                className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                                    profileStatus.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                            >
                                {profileStatus.type === 'success' ? (
                                    <CheckCircle size={15} className="shrink-0 text-emerald-600" />
                                ) : (
                                    <XCircle size={15} className="shrink-0 text-rose-600" />
                                )}
                                <span>{profileStatus.message}</span>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
                            >
                                {profileLoading && <Loader2 size={14} className="animate-spin" />}
                                Salva Modifiche Profilo
                            </button>
                        </div>
                    </form>
                </section>

                {/* Sicurezza e Connessione Google */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Autenticazione Google</h2>
                                <p className="text-[11px] text-gray-400">Protezione e gestione credenziali</p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            L&apos;accesso al tuo account è protetto tramite protocollo <strong>Google OAuth 2.0</strong>.
                            Non conserviamo alcuna password sul server: l&apos;autenticazione è cifrata e gestita direttamente dai server di sicurezza di Google.
                        </p>

                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Metodo di accesso:</span>
                                <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Google OAuth SSO
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Email collegata:</span>
                                <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                                    {user?.email || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Foto Profilo:</span>
                                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    {user?.avatarUrl ? 'Sincronizzata' : 'Predefinita'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Sessione attiva:</span>
                                <span className="font-medium text-gray-700">Cookie JWT HTTP-Only sicuro</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <span>Autenticazione a due fattori (2FA) e protezione avanzata gestita da Google.</span>
                    </div>
                </section>
            </div>

            {/* 3. CONFIGURAZIONE GEMINI AI */}
            <section className="bg-white p-6 rounded-2xl border border-purple-200/80 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Intelligenza Artificiale (Google Gemini)
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Piano Free Supportato
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Mappatura automatica degli esercenti dell&apos;estratto conto verso le tue categorie personali
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {aiStatus?.configured ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {aiStatus.source === 'USER' ? 'Attivo (Chiave Utente)' : 'Attivo (Configurazione Server)'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Non configurato
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className={labelClass}>Chiave API Google Gemini</label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={profileForm.geminiApiKey}
                                    onChange={(e) => setProfileForm({ ...profileForm, geminiApiKey: e.target.value })}
                                    placeholder={
                                        aiStatus?.maskedKey
                                            ? `Attualmente attiva: ${aiStatus.maskedKey}`
                                            : 'Incolla la tua chiave API (es. AIzaSy...)'
                                    }
                                    className={`${inputClass} pr-20 font-mono text-xs`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                                >
                                    {showApiKey ? 'Nascondi' : 'Mostra'}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                La chiave viene salvata nel tuo profilo in modo sicuro. Se il campo è vuoto, viene utilizzata la configurazione globale.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleTestAiConnection}
                                disabled={testLoading}
                                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {testLoading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                                Testa Connessione
                            </button>

                            <button
                                type="button"
                                onClick={handleUpdateProfile}
                                disabled={profileLoading}
                                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                                {profileLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                Salva Chiave
                            </button>

                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-purple-200 ml-auto cursor-pointer"
                            >
                                <ExternalLink size={12} />
                                Ottieni chiave API gratuita
                            </a>
                        </div>

                        {testStatus && (
                            <div
                                className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
                                    testStatus.success
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                            >
                                {testStatus.success ? (
                                    <CheckCircle size={15} className="shrink-0 text-emerald-600 mt-0.5" />
                                ) : (
                                    <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                                )}
                                <div className="leading-relaxed">{testStatus.message}</div>
                            </div>
                        )}
                    </div>

                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 text-xs space-y-2.5 flex flex-col justify-between">
                        <div>
                            <span className="font-semibold text-purple-950 flex items-center gap-1.5 mb-2">
                                <Info size={14} className="text-purple-600" />
                                Come funziona la categorizzazione AI:
                            </span>
                            <ul className="space-y-2 text-purple-900/90 text-[11px]">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-purple-600 font-bold">•</span>
                                    <span>
                                        <strong>100% Gratuito:</strong> Il piano free di Google Gemini include 15 richieste al minuto senza richiedere carte di credito.
                                    </span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-purple-600 font-bold">•</span>
                                    <span>
                                        <strong>Pulizia intelligente:</strong> Riconosce i merchant eliminando codici POS, date e importi dalle descrizioni.
                                    </span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-purple-600 font-bold">•</span>
                                    <span>
                                        <strong>Regole automatiche:</strong> Salva l&apos;abbinamento tra le tue regole personali così da categorizzarlo all&apos;istante in futuro.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. ZONA PERICOLOSA */}
            <div className="pt-4 border-t border-gray-100">
                <section className="bg-white p-6 rounded-2xl border border-rose-200/80 shadow-2xs overflow-hidden relative">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Eliminazione Account</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Azione irreversibile che eliminerà permanentemente transazioni, conti e budget.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
                        >
                            Elimina Account
                        </button>
                    </div>
                </section>
            </div>

            {/* Modal di Conferma Eliminazione */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-gray-200">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 text-center mb-1">
                            Eliminare definitivamente l&apos;account?
                        </h3>
                        <p className="text-gray-500 text-center text-xs mb-6">
                            Questa azione cancellerà permanentemente tutti i tuoi dati finanziari, i conti, i budget e le categorie personali. Non potrai più recuperare queste informazioni.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {deleteLoading ? 'Eliminazione...' : 'Sì, Elimina Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
