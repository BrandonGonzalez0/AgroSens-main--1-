import { useEffect, useState } from 'react';
import { auth } from './utils/auth';

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [warningAck, setWarningAck] = useState(false);

  useEffect(() => { auth.clearGuestOnRestart(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const session = await auth.login(email, password);
      onSuccess?.(session);
    } catch (e) {
      setError(e.message || 'Error de inicio de sesión');
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
    <div style={{ maxWidth: 360, margin: '48px auto', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 16 }}>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
        <label>Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
        <button type="submit" style={{ width: '100%', padding: '8px 12px' }}>Entrar</button>
      </form>
      {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}
      <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
        <strong>Modo Invitado</strong>
        <p style={{ fontSize: 13, color: '#374151' }}>
          Los datos no se guardarán al reiniciar el dispositivo. Use su cuenta para evitar pérdida de información.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={warningAck} onChange={e => setWarningAck(e.target.checked)} />
          He leído y acepto la advertencia
        </label>
        <button 
          onClick={handleGuest} 
          disabled={!warningAck}
          style={{ width: '100%', padding: '8px 12px', marginTop: 8, opacity: warningAck ? 1 : 0.6, cursor: warningAck ? 'pointer' : 'not-allowed' }}
        >
          Entrar como invitado
        </button>
      </div>
    </div>
  );
}
