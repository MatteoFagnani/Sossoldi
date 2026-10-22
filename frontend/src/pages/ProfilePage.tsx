import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as Icons from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { aiService } from '../services/services';
import type { AiStatus } from '../types';

const apiErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : fallback;

export default function ProfilePage() {
    const { user, setAuth, logout } = useAuthStore();

    // Profile Info State
    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        geminiApiKey: user?.geminiApiKey || '',
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // AI Status & Test State
    const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        aiService.getStatus()
            .then(status => setAiStatus(status))
            .catch(err => console.warn('Failed to load AI status:', err));
    }, []);

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
                message: apiErrorMessage(error, 'Errore durante l\'aggiornamento del profilo.')
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
                message: res.message
            });
            if (res.success) {
                const fresh = await aiService.getStatus();
                setAiStatus(fresh);
            }
        } catch (err: unknown) {
            setTestStatus({
                success: false,
                message: apiErrorMessage(err, 'Errore durante il test di connessione con Gemini.')
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
            alert(msg || 'Errore durante l\'eliminazione dell\'account.');
            setDeleteLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all text-sm";
    const labelClass = "block text-xs font-medium text-gray-500 mb-1.5 ml-1";

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informazioni Profilo */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-2xs"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white text-xl font-bold flex items-center justify-center">
                                {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || '?').toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-gray-900 truncate">
                                {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user?.username}
                            </h2>
                            <p className="text-xs text-gray-400 truncate">@{user?.username} • {user?.email}</p>
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
                            <label className={labelClass}>Nome Utente (Username)</label>
                            <input
                                type="text"
                                value={profileForm.username}
                                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email di Riferimento</label>
                            <input
                                type="email"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                className={inputClass}
                                required
                            />
                        </div>

                        {profileStatus && (
                            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${profileStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {profileStatus.type === 'success' ? <Icons.CheckCircle size={16} /> : <Icons.XCircle size={16} />}
                                {profileStatus.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="w-full py-3 bg-gray-900 hover:bg-black text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                            {profileLoading ? 'Aggiornamento...' : 'Salva Modifiche'}
                        </button>
                    </form>
                </section>

                {/* Sicurezza Google */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Icons.ShieldCheck size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">Autenticazione Google</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            L'accesso al tuo profilo è gestito e protetto direttamente tramite <strong>Google Sign-In</strong>. Non sono necessarie password locali né credenziali manuali.
                        </p>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Metodo di accesso:</span>
                                <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Google OAuth
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Email collegata:</span>
                                <span className="font-medium text-gray-900">{user?.email || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                        <Icons.CheckCircle size={14} className="text-green-600" />
                        <span>Autenticazione sicura a 2 fattori gestita da Google</span>
                    </div>
                </section>
            </div>

            {/* Configurazione Gemini AI */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                            <Icons.Sparkles size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-semibold text-gray-900">Intelligenza Artificiale (Google Gemini)</h2>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Piano Free Supportato
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Mappatura automatica dei negozi e causali dell'estratto conto verso le tue categorie personali.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {aiStatus?.configured ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {aiStatus.source === 'USER' ? 'Attivo (Chiave Utente)' : 'Attivo (Configurazione .env)'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
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
                                    placeholder={aiStatus?.maskedKey ? `Attualmente attiva: ${aiStatus.maskedKey}` : 'Incolla la tua chiave API (es. AIzaSy...)'}
                                    className={`${inputClass} pr-20 font-mono text-xs`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200/60 transition-colors"
                                >
                                    {showApiKey ? 'Nascondi' : 'Mostra'}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Inserendo la chiave qui verrà salvata sul tuo profilo. Se il campo è vuoto, verrà utilizzata la chiave globale configurata nel server o nel file <code>.env</code>.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleTestAiConnection}
                                disabled={testLoading}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {testLoading ? <Icons.Loader2 size={14} className="animate-spin" /> : <Icons.Zap size={14} />}
                                Testa Connessione
                            </button>

                            <button
                                type="button"
                                onClick={handleUpdateProfile}
                                disabled={profileLoading}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                {profileLoading ? <Icons.Loader2 size={14} className="animate-spin" /> : <Icons.Save size={14} />}
                                Salva Chiave
                            </button>

                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-purple-200 ml-auto"
                            >
                                <Icons.ExternalLink size={13} />
                                Ottieni chiave API gratuita (Google AI Studio)
                            </a>
                        </div>

                        {testStatus && (
                            <div className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium ${testStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                {testStatus.success ? <Icons.CheckCircle size={16} className="shrink-0 text-emerald-600 mt-0.5" /> : <Icons.AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />}
                                <div className="leading-relaxed">{testStatus.message}</div>
                            </div>
                        )}
                    </div>

                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 text-xs space-y-2.5 flex flex-col justify-between">
                        <div>
                            <span className="font-semibold text-purple-950 flex items-center gap-1.5 mb-2">
                                <Icons.Info size={14} className="text-purple-600" />
                                Come funziona la mappatura AI:
                            </span>
                            <ul className="space-y-2 text-purple-900/90">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-purple-600 font-bold">•</span>
                                    <span><strong>Senza costi:</strong> Il piano free di Google Gemini include fino a 15 richieste al minuto senza richiedere carte di credito.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-purple-600 font-bold">•</span>
                                    <span><strong>Pulizia automatica:</strong> Rimuove importi, valute (€, EUR), date e codici terminale dalle descrizioni dell'estratto conto.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-purple-600 font-bold">•</span>
                                    <span><strong>Auto-apprendimento:</strong> Ciascun nuovo negozio viene salvato tra le tue mappature, così al prossimo estratto conto è riconosciuto all'istante senza consumare richieste AI.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Zona Pericolosa */}
            <div className="pt-8 border-t border-gray-100 mt-12">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <Icons.Trash2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Zona Pericolosa</h2>
                                <p className="text-gray-500 text-sm">Questa azione è irreversibile e cancellerà tutti i tuoi dati.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl transition-colors"
                        >
                            Elimina Account
                        </button>
                    </div>
                </section>
            </div>

            {/* Modal di Conferma Eliminazione */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Icons.AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Eliminare definitivamente?</h3>
                        <p className="text-gray-500 text-center text-sm mb-6">
                            L'azione cancellerà tutte le tue transazioni, i budget e le categorie personali. Non potrai tornare indietro.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                                {deleteLoading ? 'Eliminazione...' : 'Sì, Elimina'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
