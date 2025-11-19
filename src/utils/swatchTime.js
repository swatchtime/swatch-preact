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
  const totalSeconds = beats * 86.4;
  
  // Calculate BMT time
  const bmtHours = Math.floor(totalSeconds / 3600);
  const bmtMinutes = Math.floor((totalSeconds % 3600) / 60);
  const bmtSeconds = Math.floor(totalSeconds % 60);
  
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
