/**
 * Calculate Swatch Internet Time (.beats)
 * Swatch Internet Time divides the day into 1000 beats
 * Each beat is 1 minute and 26.4 seconds
 * The day starts at midnight BMT (Biel Mean Time, UTC+1)
 */
export function calculateSwatchTime(date = new Date()) {
  // Get time in BMT (UTC+1)
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcSeconds = date.getUTCSeconds();
  const utcMilliseconds = date.getUTCMilliseconds();
  
  // Convert to BMT (UTC+1)
  const bmtHours = (utcHours + 1) % 24;
  
  // Calculate total seconds since midnight BMT
  const totalSeconds = (bmtHours * 3600) + (utcMinutes * 60) + utcSeconds + (utcMilliseconds / 1000);
  
  // Convert to beats (1 day = 86400 seconds = 1000 beats)
  const beats = (totalSeconds / 86.4) % 1000;
  
  return beats.toFixed(2);
}

/**
 * Convert Swatch beats to local time
 */
export function beatsToLocalTime(beats) {
  // Use rounded seconds to avoid losing a second due to floating-point floors
  const totalSeconds = beats * 86.4;
  const rounded = Math.round(totalSeconds);

  // Calculate BMT time from rounded seconds
  const bmtHours = Math.floor(rounded / 3600);
  const bmtMinutes = Math.floor((rounded % 3600) / 60);
  const bmtSeconds = rounded % 60;

  // Convert BMT to UTC (subtract 1 hour)
  const utcDate = new Date();
  utcDate.setUTCHours(bmtHours - 1, bmtMinutes, bmtSeconds, 0);

  return utcDate;
}

/**
 * Convert local time to Swatch beats
 */
export function localTimeToBeats(date) {
  return calculateSwatchTime(date);
}

/**
 * Normalize user-entered beats.
 * Accepts formats: '@123', '@123.45', '123', '123.45'
 * Rounds to 2 decimal places when necessary and clamps to [0, 999.99].
 * Returns a string (without leading '@') or empty string for invalid input.
 */
export function normalizeBeats(input) {
  if (input === null || input === undefined) return '';
  let s = String(input).trim();
  if (s === '') return '';
  if (s.startsWith('@')) s = s.slice(1);
  // keep only digits and dot
  s = s.replace(/[^0-9.]/g, '');
  if (s === '') return '';
  // If there is no decimal point and the integer part is longer than 3 digits,
  // treat the input as the user having typed extra digits and truncate to the
  // first 3 digits (e.g. 1222222 -> 122). If there's a decimal point but the
  // integer portion is longer than 3, truncate the integer portion similarly.
  if (s.indexOf('.') === -1) {
    if (s.length > 3) {
      s = s.slice(0, 3);
    }
  } else {
    const parts = s.split('.');
    if (parts[0].length > 3) parts[0] = parts[0].slice(0, 3);
    s = parts[0] + (parts[1] ? '.' + parts[1] : '');
  }

  const n = parseFloat(s);
  if (Number.isNaN(n)) return '';
  let v = Math.max(0, Math.min(999.99, n));
  v = Math.round(v * 100) / 100;
  // format: drop trailing zeros where possible
  if (Number.isInteger(v)) return String(v);
  if (Math.round(v * 10) === v * 10) return v.toFixed(1);
  return v.toFixed(2);
}
