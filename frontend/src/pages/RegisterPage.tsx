import { Navigate } from 'react-router-dom';

export default function RegisterPage() {
    // Con l'autenticazione tramite Google, registrazione e login sono unificati
    return <Navigate to="/login" replace />;
}
