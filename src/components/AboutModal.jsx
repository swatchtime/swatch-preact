
import { useState, useEffect } from 'preact/hooks';

export function AboutModal({ deferredPrompt, onInstall }) {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      // prefer a persisted flag written by the installing context
      try {
        const persisted = localStorage.getItem('swatch_pwa_installed') === '1';
        if (persisted) {
          setIsInstalled(true);
          return;
        }
      } catch (err) {
        // ignore storage errors
      }

      const displayStandalone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = typeof window !== 'undefined' && window.navigator && window.navigator.standalone === true;
      setIsInstalled(!!(displayStandalone || iosStandalone));
    };
    checkInstalled();

    const onAppInstalled = () => {
      setIsInstalled(true);
      try { localStorage.setItem('swatch_pwa_installed', '1'); } catch (err) { /* ignore */ }
    };
    window.addEventListener && window.addEventListener('appinstalled', onAppInstalled);

    const mm = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)');
    const mmChange = (e) => setIsInstalled(!!e.matches);
    if (mm && mm.addEventListener) mm.addEventListener('change', mmChange);
    // @ts-ignore: fallback for older browsers that only implement addListener
    else if (mm && mm.addListener) mm.addListener(mmChange);

    const onStorage = (e) => {
      if (!e) return;
      if (e.key === 'swatch_pwa_installed') {
        setIsInstalled(e.newValue === '1');
      }
    };
    window.addEventListener && window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener && window.removeEventListener('appinstalled', onAppInstalled);
      if (mm && mm.removeEventListener) mm.removeEventListener('change', mmChange);
      // @ts-ignore: fallback for older browsers that only implement removeListener
      else if (mm && mm.removeListener) mm.removeListener(mmChange);
      window.removeEventListener && window.removeEventListener('storage', onStorage);
    };
  }, []);

  const titleText = isInstalled ? 'You have installed this app on your device' : 'Install this app on your device';
  const btnClass = isInstalled ? 'btn btn-lg btn-secondary shadow' : 'btn btn-lg btn-success shadow';
  const btnDisabled = isInstalled || !deferredPrompt;

  return (
    <div className="modal fade" id="aboutModal" tabIndex="-1" aria-labelledby="aboutModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg modal-fullscreen-md-down">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="aboutModalLabel">About Swatch Internet Time</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="mb-5 text-center" title={titleText}>
              <button
                type="button"
                id="pwa-install-btn"
                className={btnClass}
                onClick={onInstall}
                disabled={btnDisabled}
                aria-disabled={btnDisabled}
              >
                <i className="bi bi-pc-display-horizontal me-2 py-2 px-3"></i>
                {isInstalled ? 'Installed' : 'Install This App'}
              </button>
            </div>
            
            <div className="float-end m-2 p-2 bg-light border border-2 border-secondary rounded-3">
                <img src="/swatch_beat_logo.svg" alt="Swatch Beat Logo" title="Swatch Beat Logo" className="swatch-beat-logo" />
            </div>
            

            <p>
              <a href="https://www.swatch.com/en-us/internet-time.html" target="_blank" rel="noopener noreferrer">Swatch Internet Time<i class="bi bi-arrow-up-right-square mx-1 text-decoration-none"></i></a> is a decimal time concept introduced by the Swatch corporation in 1998. It divides the day into 1,000 "beats" instead of hours, minutes, and seconds. Each beat is equivalent to 1 minute and 26.4 seconds.
            </p>

            <p>
              The day starts at midnight BMT (Biel Mean Time, UTC+1) with the number of beats at 000. Twenty three hours and 59 minutes later, the day ends at 999 beats. Beats are written with an @ sign in front of them. So, @567 is 567 beats. Beats can also be subdivided into a 100 centibeats and the time can be displayed as @567.78 for greater precision. After @567.99, the time changes to @568.00.
            </p>

            <p>
              This app is a fan-made revival and is not affiliated with or endorsed by Swatch Group. Swatch® is a registered trademark of The Swatch Group LTD. You can visit the official web site here: <a href="https://www.swatch.com/en-us/" target="_blank" rel="noopener noreferrer">https://www.swatch.com<i class="bi bi-arrow-up-right-square ms-1 text-decoration-none"></i></a>
            </p>

            <p className="my-5"><strong>Version:</strong> 0.2.0-beta</p>

            <p className="mt-5 text-muted small">&copy; Copyright 2025 &ndash; 2026 by Ken Dawson. All rights reserved.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;
