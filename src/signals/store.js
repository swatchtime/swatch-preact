import { signal } from '@preact/signals';
import { loadSettings, saveSettings, loadReminders, saveReminders, KEYS } from '../utils/storage';

// Default settings (kept in-sync with App defaults)
export const defaultSettings = {
  fontSize: 100,
  fontColor: '#ffffff',
  fontFamily: 'Roboto, sans-serif',
  showLocalTime: false,
  timeFormat24: true,
  darkTheme: true,
  showCentibeats: true,
  colorPreset: 'dark-default',
  customColor: '#ff7800'
};

// Signals: exported so any component may import them directly (no Context needed)
export const settingsSignal = signal(loadSettings(defaultSettings));
export const eventsSignal = signal(loadReminders());
export const muteSignal = signal((() => {
  try { return localStorage.getItem('swatch_mute') === '1'; } catch (e) { return false; }
})());

// Transient UI signal for active reminders / bell state (not persisted)
export const activeRemindersSignal = signal([]);
// Transient selected event (for edit/create flows) - not persisted
export const selectedEventSignal = signal(null);

// Helper setters that persist to localStorage where appropriate
export function setSettings(next) {
  settingsSignal.value = next;
  try { saveSettings(next); } catch (e) {}
}

export function setEvents(nextArray) {
  eventsSignal.value = Array.isArray(nextArray) ? nextArray : [];
  try { saveReminders(eventsSignal.value); } catch (e) {}
}

export function addOrUpdateEvent(ev) {
  const list = Array.isArray(eventsSignal.value) ? [...eventsSignal.value] : [];
  if (ev.id) {
    const idx = list.findIndex(x => x.id === ev.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...ev };
    else list.push(ev);
  } else {
    const newEv = { ...ev, id: Date.now() };
    list.push(newEv);
  }
  eventsSignal.value = list;
  try { saveReminders(list); } catch (e) {}
  return eventsSignal.value;
}

export function removeEvent(id) {
  const list = (eventsSignal.value || []).filter(e => e.id !== id);
  eventsSignal.value = list;
  try { saveReminders(list); } catch (e) {}
  return eventsSignal.value;
}

export function setMute(v) {
  muteSignal.value = !!v;
  try { localStorage.setItem('swatch_mute', v ? '1' : '0'); } catch (e) {}
}

export function setSelectedEvent(ev) {
  selectedEventSignal.value = ev || null;
}

export function clearSelectedEvent() {
  selectedEventSignal.value = null;
}

// Cross-tab sync: listen for storage events and update signals
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    try {
      if (e.key === KEYS.SETTINGS) {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        if (parsed) settingsSignal.value = { ...defaultSettings, ...parsed };
      } else if (e.key === KEYS.REMINDERS) {
        eventsSignal.value = e.newValue ? JSON.parse(e.newValue) : [];
      } else if (e.key === 'swatch_mute') {
        muteSignal.value = localStorage.getItem('swatch_mute') === '1';
      }
    } catch (err) {}
  });
}