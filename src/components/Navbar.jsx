import { ReminderBell } from './ReminderBell';
import { settingsSignal, setSettings as setSettingsSignal, eventsSignal } from '../signals/store';

export function Navbar() {

  const currentSettings = settingsSignal.value;
  const currentEvents = eventsSignal.value;

  const handleThemeToggle = () => {
    const nextDark = !currentSettings.darkTheme;
    const defaultColor = nextDark ? '#ffffff' : '#000000';
    const preset = nextDark ? 'dark-default' : 'light-default';
    // Keep the user's custom color if present; otherwise fall back to orange for light theme
    const nextCustom = currentSettings && currentSettings.customColor ? currentSettings.customColor : (nextDark ? defaultColor : '#ff7800');
    const next = { ...currentSettings, darkTheme: nextDark, fontColor: defaultColor, colorPreset: preset, customColor: nextCustom };
    setSettingsSignal(next);
  };

  

  const count = currentEvents ? currentEvents.filter(e => !e.dismissed).length : 0;

  return (
    <nav className="navbar navbar-expand-lg bg-secondary-subtle mb-4 px-0 border-2 border-bottom border-secondary">
      <div className="container-fluid px-3 d-flex align-items-center">

        <button
          type="button"
          className="navbar-brand mb-0 h1 d-flex align-items-center btn btn-link p-0"
          data-bs-toggle="modal"
          data-bs-target="#aboutModal"
          aria-haspopup="dialog"
          title="About Swatch Internet Time"
        >
          <img src="/beat-clock.png" alt="Logo" width="30" height="30" />
          <span className="ms-2 d-none d-md-block">Swatch Internet Time</span>
        </button>

        <div className="d-flex align-items-center ms-auto" title="Toggle Theme Color">
          <i className={`bi bi-brightness-high me-2 ${currentSettings.darkTheme ? 'icon-bright-dark' : 'icon-bright-light'}`}></i>
          <div className="form-check form-switch">
            <input
              className="form-check-input cursor-pointer"
              type="checkbox"
              id="themeSwitch"
              checked={currentSettings.darkTheme}
              onChange={handleThemeToggle}
            />
          </div>
          <i className={`bi bi-moon-stars-fill me-2 ${currentSettings.darkTheme ? 'icon-moon-dark' : 'icon-moon-light'}`}></i>
        </div>

        <div className="d-flex ms-4 gap-2 align-items-center">
          <div className="d-flex align-items-center me-3">
            <ReminderBell />
          </div>

          <button 
            className="btn btn-outline-secondary"
            data-bs-toggle="modal"
            data-bs-target="#calculatorModal"
            title="Time Calculator"
          >
            <i className="bi bi-calculator"></i>
          </button>

          <button
            className="btn btn-outline-secondary position-relative"
            data-bs-toggle="modal"
            data-bs-target="#remindersListModal"
            title="View Reminders"
            aria-label="View Reminders"
          >
            <i className="bi bi-envelope"></i>
            {count > 0 ? (
              <span
                className="position-absolute reminder-badge start-100 translate-middle badge rounded-pill bg-danger"
                aria-label={`There are ${count} active reminders`}
              >
                {count}
                <span className="visually-hidden" aria-live="polite">{count} active reminders</span>
              </span>
            ) : null}
          </button>

          <button 
            className="btn btn-outline-secondary ms-3"
            data-bs-toggle="modal"
            data-bs-target="#settingsModal"
            title="Settings"
          >
            <i className="bi bi-gear"></i>
          </button>

        </div>

      </div>

      
    </nav>
  );
}
