import { beatsToLocalTime } from './swatchTime';

/**
 * Compute a JS Date for a reminder given form inputs.
 * Accepts an object with keys: startDate (YYYY-MM-DD), startTime (HH:mm) and/or swatchTime (beats string/number).
 * Returns a Date instance when a valid date/time can be derived, otherwise null.
 */
export function computeReminderDate({ startDate, startTime, swatchTime }) {
  if (!startDate) return null;
  try {
    if (swatchTime) {
      const beats = parseFloat(String(swatchTime).replace(/^@/, ''));
      if (Number.isNaN(beats)) return null;
      const beatDate = beatsToLocalTime(beats); // a Date in UTC context adjusted by util
      const [y, m, d] = String(startDate).split('-').map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d, beatDate.getHours(), beatDate.getMinutes(), beatDate.getSeconds(), 0);
    }

    if (startDate && startTime) {
      const [y, m, d] = String(startDate).split('-').map(Number);
      const [hh, mm] = String(startTime).split(':').map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
    }
  } catch (e) {
    return null;
  }
  return null;
}
