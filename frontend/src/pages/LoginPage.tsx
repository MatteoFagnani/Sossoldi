import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Info, HelpCircle, ExternalLink, X, Copy, Check } from 'lucide-react';
import { authService } from '../services/services';

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.34 24 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
        </svg>
    );
}

export default function LoginPage() {
    const [searchParams] = useSearchParams();

    const [configured, setConfigured] = useState<boolean | null>(null);
    const [showConfigGuide, setShowConfigGuide] = useState(() => searchParams.get('error') === 'not_configured');
    const [copiedCallback, setCopiedCallback] = useState(false);
    const [copiedOrigin, setCopiedOrigin] = useState(false);

    const errorParam = searchParams.get('error');
    const detailsParam = searchParams.get('details');

    const error = useMemo(() => {
        if (errorParam === 'not_configured') {
            return 'Google OAuth non è ancora configurato nel file .env';
        } else if (errorParam === 'access_denied') {
            return 'Accesso Google annullato o negato dall\'utente.';
        } else if (errorParam === 'auth_failed') {
            return detailsParam ? `Autenticazione fallita: ${detailsParam}` : 'Autenticazione con Google fallita. Riprova.';
        }
        return '';
    }, [errorParam, detailsParam]);

    const callbackUrl = `${window.location.origin}/api/v1/auth/google/callback`;
    const originUrl = window.location.origin;

    useEffect(() => {
        authService.getGoogleConfig()
            .then(cfg => {
                setConfigured(cfg.configured);
            })
            .catch(() => setConfigured(false));
    }, []);

    const handleGoogleRedirect = () => {
        if (configured) {
            window.location.href = '/api/v1/auth/google/login';
        } else {
            setShowConfigGuide(true);
        }
    };

    const handleCopy = (text: string, type: 'callback' | 'origin') => {
        navigator.clipboard.writeText(text);
        if (type === 'callback') {
            setCopiedCallback(true);
            setTimeout(() => setCopiedCallback(false), 2000);
        } else {
            setCopiedOrigin(true);
            setTimeout(() => setCopiedOrigin(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo & Intestazione */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
                        <img 
                            src="/app-icon.svg" 
                            alt="Sossoldi Logo" 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sossoldi</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestione finanziaria personale sul tuo PC</p>
                </div>

                {/* Scheda di Accesso */}
                <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8">

                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Accedi a Sossoldi</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            L'accesso avviene tramite il tuo account Google
                        </p>
                    </div>

                    {/* Unico Pulsante Google */}
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleGoogleRedirect}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-medium text-sm rounded-2xl border border-gray-300 shadow-sm transition-all hover:border-gray-400 hover:shadow"
                        >
                            <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                            <span>Continua con Google (OAuth)</span>
                        </button>

                        {/* Link Guida & Risoluzione */}
                        <div className="text-center pt-1">
                            <button
                                type="button"
                                onClick={() => setShowConfigGuide(true)}
                                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 underline transition-colors"
                            >
                                <HelpCircle size={13} />
                                Configurazione credenziali o risoluzione errori?
                            </button>
                        </div>
                    </div>

                    {/* Vantaggi / Privacy */}
                    <div className="mt-8 pt-6 border-t border-gray-100 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-xs text-gray-600">
                            <ShieldCheck size={16} className="text-blue-600 flex-shrink-0" />
                            <span>I tuoi dati finanziari rimangono archiviati solo sul tuo PC</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-gray-600">
                            <Info size={16} className="text-gray-400 flex-shrink-0" />
                            <span>Nessuna password da ricordare: autenticazione rapida e sicura</span>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-400">
                        Sossoldi • Applicazione Finanziaria Personale
                    </p>
                </div>

            </div>

            {/* Modal / Guida Configurazione OAuth */}
            {showConfigGuide && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setShowConfigGuide(false)}
                            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                                <GoogleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Credenziali Google OAuth2</h3>
                                <p className="text-xs text-gray-500">Impostazioni per Google Cloud Console</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
                            <p>
                                Assicurati che nel tuo ID client su{' '}
                                <a
                                    href="https://console.cloud.google.com/apis/credentials"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                    Google Cloud Console <ExternalLink size={12} />
                                </a>{' '}
                                siano inseriti questi parametri esatti:
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <span className="font-semibold text-gray-900 block mb-1">
                                        1. Origini JavaScript autorizzate:
                                    </span>
                                    <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-800">
                                        <span>{originUrl}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(originUrl, 'origin')}
                                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded font-sans text-[11px] transition-colors"
                                        >
                                            {copiedOrigin ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                            <span>{copiedOrigin ? 'Copiato!' : 'Copia'}</span>
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                                        Senza barre finali. Inserisci anche: <code className="bg-gray-100 px-1 rounded">http://127.0.0.1:10000</code>
                                    </span>
                                </div>

                                <div>
                                    <span className="font-semibold text-gray-900 block mb-1">
                                        2. URI di reindirizzamento autorizzati:
                                    </span>
                                    <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-800">
                                        <span className="truncate">{callbackUrl}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(callbackUrl, 'callback')}
                                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded font-sans text-[11px] transition-colors flex-shrink-0"
                                        >
                                            {copiedCallback ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                            <span>{copiedCallback ? 'Copiato!' : 'Copia'}</span>
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                                        Inserisci anche: <code className="bg-gray-100 px-1 rounded">http://127.0.0.1:10000/api/v1/auth/google/callback</code>
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-800 space-y-1">
                                <p className="font-semibold">Nota di salvataggio:</p>
                                <p>Dopo aver cliccato <strong>Salva</strong> in Google Cloud Console, Google impiega da 30 secondi a 2 minuti per attivare i nuovi URL.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
