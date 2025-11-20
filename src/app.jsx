import { useState, useEffect, useRef } from 'preact/hooks';
import { SwatchClock } from './components/SwatchClock';
import { SettingsModal } from './components/SettingsModal';
import { ReminderModal } from './components/ReminderModal';
import { ReminderBell } from './components/ReminderBell';
import { TimeCalculator } from './components/TimeCalculator';
import { Navbar } from './components/Navbar';
import { computeReminderDate } from './utils/reminderTime';
import useBootstrapModal from './hooks/useBootstrapModal';
import { loadSettings, saveSettings, loadReminders, saveReminders, KEYS } from './utils/storage';

export function App() {

  const defaultSettings = {
    fontSize: 100,
    fontColor: '#ffffff',
    fontFamily: 'Roboto, sans-serif',
    showLocalTime: false,
    timeFormat24: true,
    darkTheme: true, // Default to dark theme
    showCentibeats: true, // Show centibeats by default
    colorPreset: 'dark-default',
    customColor: '#663399'
  };

  // Keep track of previous theme to optionally remap default color when theme switches
  const prevDarkRef = useRef(defaultSettings.darkTheme);

  const [settings, setSettings] = useState(() => loadSettings(defaultSettings));

  useEffect(() => {
    const prev = prevDarkRef.current;
    if (prev !== settings.darkTheme) {
      const newDefaultColor = settings.darkTheme ? '#ffffff' : '#000000';
      const newDefaultKey = settings.darkTheme ? 'dark-default' : 'light-default';
      const prevDefaultColor = prev ? '#ffffff' : '#000000';
      const prevDefaultKey = prev ? 'dark-default' : 'light-default';

      // If user was explicitly using the previous default preset, or their fontColor equals the previous default,
      // update to the new default color/preset so the UI remains readable when theme changes.
      if (settings.colorPreset === prevDefaultKey || (settings.fontColor && settings.fontColor.toLowerCase() === prevDefaultColor.toLowerCase())) {
        setSettings(prevS => ({ ...prevS, fontColor: newDefaultColor, colorPreset: newDefaultKey }));
      }

      // Swap the helper default for the custom color so the 'Choose Custom Color' box shows a different value
      // for each theme unless the user has already customized it.
      const darkCustom = '#663399'; // Rebecca Purple
      const lightCustom = '#8B4513'; // SaddleBrown
      if (prev && !settings.customColor) {
        // if we somehow lack a custom color, seed it
        setSettings(prevS => ({ ...prevS, customColor: settings.darkTheme ? darkCustom : lightCustom }));
      } else if (prev && settings.customColor && settings.customColor.toLowerCase() === darkCustom.toLowerCase() && !settings.darkTheme) {
        // switched from dark to light and custom was dark default
        setSettings(prevS => ({ ...prevS, customColor: lightCustom }));
      } else if (!prev && settings.customColor && settings.customColor.toLowerCase() === lightCustom.toLowerCase() && settings.darkTheme) {
        // switched from light to dark and custom was light default
        setSettings(prevS => ({ ...prevS, customColor: darkCustom }));
      }
    }
    prevDarkRef.current = settings.darkTheme;
  }, [settings.darkTheme]);

  // persist settings whenever they change
  useEffect(() => saveSettings(settings), [settings]);

  // sync settings across tabs/windows
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === KEYS.SETTINGS) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          if (parsed) setSettings(prev => ({ ...defaultSettings, ...parsed }));
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [events, setEvents] = useState(() => loadReminders());

  const reminderModalRef = useRef(null);
  const reminderModalApi = useBootstrapModal(reminderModalRef);

  useEffect(() => {
    // Apply theme
    if (settings.darkTheme) {
      document.body.setAttribute('data-bs-theme', 'dark');
      document.body.style.backgroundColor = '#212529';
      document.body.style.color = '#fff';
    } else {
      document.body.removeAttribute('data-bs-theme');
      document.body.style.backgroundColor = '#fff';
      document.body.style.color = '#000';
    }
  }, [settings.darkTheme]);

  const handleEventCreate = (eventData) => {
    // compute reminderTime (ISO) from either standard time or swatchTime
    let reminderDate = null;
    reminderDate = computeReminderDate(eventData);

    const newEvent = {
      ...eventData,
      id: Date.now(),
      dismissed: false,
      reminderTime: reminderDate ? reminderDate.toISOString() : null
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveReminders(updatedEvents);
    // Close modal via ref-based API
    if (reminderModalApi && typeof reminderModalApi.hide === 'function') reminderModalApi.hide();
  };
  // Persist events to localStorage when changed
  useEffect(() => saveReminders(events), [events]);

  return (
    <div className="container-fluid">
      <Navbar 
        settings={settings}
        setSettings={setSettings}
        events={events}
        setEvents={setEvents}
      />
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <SwatchClock 
            fontSize={settings.fontSize}
            fontColor={settings.fontColor}
            fontFamily={settings.fontFamily}
            showLocalTime={settings.showLocalTime}
            timeFormat24={settings.timeFormat24}
            showCentibeats={settings.showCentibeats}
          />
        </div>
      </div>
      <SettingsModal settings={settings} onSettingsChange={setSettings} />
      <ReminderModal onEventCreate={handleEventCreate} modalRef={reminderModalRef} />
      <TimeCalculator settings={settings} />
    </div>
  );
}
