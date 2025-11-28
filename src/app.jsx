import { useEffect } from 'preact/hooks';
import { SwatchClock } from './components/SwatchClock';
import { SettingsModal } from './components/SettingsModal';
import { ReminderForm } from './components/ReminderForm';
import { RemindersList } from './components/RemindersList';
import { Footer } from './components/Footer';
import { TimeCalculator } from './components/TimeCalculator';
import { Navbar } from './components/Navbar';
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

  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <SwatchClock />
          </div>
          <Footer />
        </div>
      </div>
      <SettingsModal />
      <ReminderForm />
      <RemindersList />
      <TimeCalculator />
    </>
  );
}
