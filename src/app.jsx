import { useEffect, useRef } from 'preact/hooks';
import { SwatchClock } from './components/SwatchClock';
import { SettingsModal } from './components/SettingsModal';
import { ReminderForm } from './components/ReminderForm';
import { ReminderBell } from './components/ReminderBell';
import { RemindersList } from './components/RemindersList';
import { TimeCalculator } from './components/TimeCalculator';
import { Navbar } from './components/Navbar';
import { computeReminderDate } from './utils/reminderTime';
import {
  settingsSignal,
  eventsSignal,
  addOrUpdateEvent,
  muteSignal,
  defaultSettings
} from './signals/store';

export function App() {
  // Use signals for live, importable state
  const settings = settingsSignal.value;
  const events = eventsSignal.value;
  const mute = muteSignal.value;

  // Keep track of previous theme to optionally remap default color when theme switches
  const prevDarkRef = useRef((settings && settings.darkTheme) || defaultSettings.darkTheme);

  // Reminder modal is managed by its own component and Bootstrap attributes

  useEffect(() => {
    // Apply theme
    if (settings && settings.darkTheme) {
      document.body.setAttribute('data-bs-theme', 'dark');
      document.body.style.backgroundColor = '#212529';
      document.body.style.color = '#fff';
    } else {
      document.body.removeAttribute('data-bs-theme');
      document.body.style.backgroundColor = '#fff';
      document.body.style.color = '#000';
    }
  }, [settings && settings.darkTheme]);

  const handleEventSave = (eventData) => {
    // compute reminderTime (ISO) from either standard time or swatchTime
    const reminderDate = computeReminderDate(eventData);

    const base = {
      ...eventData,
      reminderTime: reminderDate ? reminderDate.toISOString() : null,
      dismissed: false
    };

    // Use signal helper to add/update and persist
    addOrUpdateEvent(base);
    // clear shared selected event
    // import available helper to clear selectedEvent if desired
    try { /* no-op: ReminderForm will clear selection */ } catch (e) {}
    // Modal hiding is handled inside ReminderForm component
  };
  // When settings change in the UI we call setSettings (persist is handled in the helper)

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
      <SettingsModal />
      <ReminderForm />
      <RemindersList />
      <TimeCalculator />
    </>
  );
}
