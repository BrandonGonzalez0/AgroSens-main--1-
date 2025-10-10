import React, { useEffect, useState } from 'react';

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}

export default function InstallPromptIOS() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('agrosens_install_dismissed');
    if (dismissed === '1') return; // respect user preference

    const onBefore = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBefore);

    // On iOS, show the banner only if not standalone
    if (isIos() && !isInStandaloneMode()) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
    };
  }, []);

  const onInstallClick = async () => {
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        console.log('PWA install choice', choice);
      } catch (e) {
        console.warn('install prompt error', e);
      }
      setDeferredPrompt(null);
      setVisible(false);
      localStorage.setItem('agrosens_install_dismissed', '1');
    } else {
      // fallback: open modal with instructions (iOS path)
      setShowModal(true);
    }
  };

  const onDismiss = () => {
    setVisible(false);
    localStorage.setItem('agrosens_install_dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col items-center md:items-end">
      <div className="max-w-xl w-full md:w-auto bg-white dark:bg-gray-800 border rounded-xl shadow-lg p-3 flex items-center gap-3">
        <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">Instala AgroSens para acceso rápido y modo offline.</div>
        <div className="flex gap-2">
          <button onClick={onInstallClick} className="px-3 py-1 bg-green-600 text-white rounded">Instalar</button>
          <button onClick={() => setShowModal(true)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">¿Cómo?</button>
          <button onClick={onDismiss} className="px-2 py-1 text-sm text-gray-500">Cerrar</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[95%] max-w-md">
            <h3 className="font-bold mb-3">Instalar AgroSens</h3>
            {isIos() ? (
              <div className="text-sm space-y-3">
                <p>En iPhone (Safari) la instalación es manual. Sigue estos pasos:</p>
                <ol className="list-decimal pl-5 text-sm">
                  <li>Abre esta página en <strong>Safari</strong> (no en una app externa).</li>
                  <li>Toca el botón <strong>Compartir</strong> (ícono ▷ ó cuadrado con flecha).</li>
                  <li>Elige <strong>Agregar a pantalla de inicio</strong> y confirma.</li>
                </ol>
                <p className="text-xs text-gray-500">Nota: iOS no muestra un prompt automático como Android.</p>
              </div>
            ) : (
              <div className="text-sm">
                <p>En Android puedes usar el botón "Instalar" para abrir el prompt nativo. Si no aparece, prueba desde Chrome y asegúrate de usar HTTPS.</p>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); localStorage.setItem('agrosens_install_dismissed', '1'); }} className="px-3 py-1 bg-green-600 text-white rounded">Entendido</button>
              <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
