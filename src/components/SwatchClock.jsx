import { useState, useEffect } from 'preact/hooks';
import { calculateSwatchTime } from '../utils/swatchTime';

// Helper: convert a px value into rem based on current document root font-size
function pxToRem(px) {
  try {
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return px / rootPx;
  } catch (e) {
    return px / 16;
  }
}

export function SwatchClock({ fontSize, fontColor, fontFamily, showLocalTime, timeFormat24, showCentibeats = true }) {
  const [swatchTime, setSwatchTime] = useState('000.00');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      let beats = calculateSwatchTime();
      if (!showCentibeats) {
        beats = beats.split('.')[0];
        beats = beats.padStart(3, '0');
      }
      setSwatchTime(beats);
      if (showLocalTime) {
        const now = new Date();
        const rawHours = now.getHours();
        const hours = timeFormat24 ? rawHours : (rawHours % 12) || 12;
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = timeFormat24 ? '' : (rawHours >= 12 ? ' PM' : ' AM');

        if (showCentibeats) {
          setLocalTime(`${hours}:${minutes}:${seconds}${ampm}`);
        } else {
          setLocalTime(`${hours}:${minutes}${ampm}`);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [showLocalTime, timeFormat24, showCentibeats]);

  // clamp the requested fontSize so it doesn't overflow very small viewports
  const maxAllowedPx = Math.max(100, window.innerWidth * 0.8); // ensure some reasonable minimum
  const finalPx = Math.min(fontSize, maxAllowedPx);

  const clockStyle = {
    fontSize: `${pxToRem(finalPx)}rem`,
    color: fontColor,
    fontFamily: fontFamily,
  };

  return (
    <div className="text-center my-4">
      <div style={{ ...clockStyle }} className="display-1 fw-bold border border-2 border-secondary rounded-5 p-5">
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ paddingBottom: `${pxToRem(Math.round(finalPx * 0.06))}rem`, lineHeight: 1 }} aria-hidden>
            @
          </div>
          <div style={{ lineHeight: 1 }}>
            {swatchTime}
          </div>
        </div>
      </div>
      {showLocalTime && (
        <div style={{ ...clockStyle, fontSize: `${pxToRem(finalPx * 0.4)}rem` }} className="mt-2">
          {localTime}
        </div>
      )}
    </div>
  );
}
