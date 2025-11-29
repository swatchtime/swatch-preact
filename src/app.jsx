import { useState, useEffect } from 'preact/hooks';
import { SwatchClock } from './components/SwatchClock';
import { SettingsModal } from './components/SettingsModal';
import { ReminderForm } from './components/ReminderForm';
import { RemindersList } from './components/RemindersList';
import { TimeCalculator } from './components/TimeCalculator';
import { Navbar } from './components/Navbar';
import { AboutModal } from './components/AboutModal';
import { settingsSignal } from './signals/store';


export function App() {

  const settings = settingsSignal.value;

  useEffect(() => {
    if (settings && settings.darkTheme) {
      document.body.setAttribute('data-bs-theme', 'dark');
    } else {
      document.body.removeAttribute('data-bs-theme');
    }
  }, [settings && settings.darkTheme]);

  // PWA install prompt capture: store the beforeinstallprompt event so the
  // About modal can trigger the native install flow when the user wants it.
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e) {
      try { e.preventDefault(); } catch (err) {}
      setDeferredPrompt(e);
      console.debug('[App] beforeinstallprompt captured');
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  // Persist install state when the PWA is installed so other tabs can be aware.
  useEffect(() => {
    const onAppInstalled = () => {
      try { localStorage.setItem('swatch_pwa_installed', '1'); } catch (err) { /* ignore */ }
      console.debug('[App] appinstalled event - persisted install flag');
    };
    window.addEventListener && window.addEventListener('appinstalled', onAppInstalled);
    return () => window.removeEventListener && window.removeEventListener('appinstalled', onAppInstalled);
  }, []);

  const showInstallPrompt = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.debug('[App] Install prompt choice:', choice && choice.outcome);
      if (choice && choice.outcome === 'accepted') {
        try { localStorage.setItem('swatch_pwa_installed', '1'); } catch (err) { /* ignore */ }
      }
    } catch (err) {
      console.debug('[App] Install prompt error', err);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <SwatchClock />
          </div>
        </div>
      </div>
      <AboutModal deferredPrompt={deferredPrompt} onInstall={showInstallPrompt} />
      <SettingsModal />
      <ReminderForm />
      <RemindersList />
      <TimeCalculator />
    </>
  );
}
