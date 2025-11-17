import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { auth } from './utils/auth';

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [warningAck, setWarningAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { auth.clearGuestOnRestart(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = await auth.login(email.trim(), password);
      onSuccess?.(session);
    } catch (e) {
      setError(e.message || 'Error de inicio de sesión');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGuest() {
    setError('');
    try {
      if (!warningAck) {
        setError('Debe aceptar la advertencia para continuar como invitado');
        return;
      }
      const session = await auth.guestEnter(true);
      onSuccess?.(session);
    } catch (e) {
      setError(e.message || 'No se pudo entrar como invitado');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <img src="/logo.svg" alt="AgroSens" className="w-20 h-20 md:w-24 md:h-24 drop-shadow-lg mb-3" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Bienvenido de nuevo</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Inicia sesión para continuar con tus cultivos</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="tucorreo@agrosens.cl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center h-5">
                <input id="guestAck" type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" checked={warningAck} onChange={(e) => setWarningAck(e.target.checked)} />
              </div>
              <label htmlFor="guestAck" className="text-sm text-gray-700 dark:text-gray-300">He leído y acepto que en modo invitado no se guardarán los datos.</label>
            </div>
            <button
              onClick={handleGuest}
              disabled={!warningAck}
              className={`w-full px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${warningAck ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
            >
              Entrar como invitado
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AgroSens — Todos los derechos reservados
        </div>
      </motion.div>
    </div>
  );
}
