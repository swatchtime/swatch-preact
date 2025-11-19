import { useState, useEffect } from 'preact/hooks';
import { SwatchClock } from './components/SwatchClock';
import { SettingsModal } from './components/SettingsModal';
import { CalendarModal } from './components/CalendarModal';
import { ReminderBell } from './components/ReminderBell';
import { TimeCalculator } from './components/TimeCalculator';

export function App() {
  const [settings, setSettings] = useState({
    fontSize: 80,
    fontColor: '#000000',
    fontFamily: 'Roboto, sans-serif',
    showLocalTime: false,
    timeFormat24: true,
    darkTheme: false
  });

  const [events, setEvents] = useState([]);

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
    const newEvent = {
      ...eventData,
      id: Date.now(),
      dismissed: false
    };
    setEvents([...events, newEvent]);
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('calendarModal'));
    if (modal) modal.hide();
  };

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-expand-lg bg-body-tertiary mb-4">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Swatch Internet Time</span>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary"
              data-bs-toggle="modal"
              data-bs-target="#calculatorModal"
              title="Time Calculator"
            >
              <i className="bi bi-calculator"></i>
            </button>
            <ReminderBell events={events} />
            <button 
              className="btn btn-outline-secondary"
              data-bs-toggle="modal"
              data-bs-target="#calendarModal"
              title="Calendar"
            >
              <i className="bi bi-calendar-plus"></i>
            </button>
            <button 
              className="btn btn-outline-secondary"
              data-bs-toggle="modal"
              data-bs-target="#settingsModal"
              title="Settings"
            >
              <i className="bi bi-gear"></i>
            </button>
          </div>
        </div>
      </nav>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <SwatchClock 
            fontSize={settings.fontSize}
            fontColor={settings.fontColor}
            fontFamily={settings.fontFamily}
            showLocalTime={settings.showLocalTime}
            timeFormat24={settings.timeFormat24}
          />
          
          <div className="text-center mt-4 text-muted">
            <p>
              Swatch Internet Time divides the day into 1000 beats.
              <br />
              Each beat is 1 minute and 26.4 seconds.
            </p>
          </div>
        </div>
      </div>

      <SettingsModal settings={settings} onSettingsChange={setSettings} />
      <CalendarModal onEventCreate={handleEventCreate} />
      <TimeCalculator />
    </div>
  );
}
