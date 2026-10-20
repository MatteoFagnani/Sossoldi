import React, { useState } from 'react';
import axios from 'axios';
import * as Icons from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const apiErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : fallback;

export default function ProfilePage() {
    const { user, setAuth, logout } = useAuthStore();

    // Profile Info State
    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        email: user?.email || '',
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileStatus(null);
        try {
            const response = await api.put('/users/profile', profileForm);
            const updatedUser = response.data;
            setAuth(updatedUser);
            setProfileStatus({ type: 'success', message: 'Profilo aggiornato con successo!' });
        } catch (error: unknown) {
            setProfileStatus({
                type: 'error',
                message: apiErrorMessage(error, 'Errore durante l\'aggiornamento del profilo.')
            });
        } finally {
            setProfileLoading(false);
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
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 text-gray-900 rounded-lg">
                            <Icons.User size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Informazioni Personali</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className={labelClass}>Nome Utente</label>
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

