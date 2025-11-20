// Centralized storage keys and small helpers for localStorage access
export const KEYS = {
  SETTINGS: 'swatch_settings',
  REMINDERS: 'reminders'
};

export function loadSettings(defaults) {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch (e) {
    return defaults;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    // ignore write errors
  }
}

export function loadReminders() {
  try {
    const raw = localStorage.getItem(KEYS.REMINDERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveReminders(reminders) {
  try {
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    // ignore
  }
}
