import { useState, useEffect, useRef } from 'preact/hooks';
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

  const wrapperRef = useRef(null);
  const [clockWidth, setClockWidth] = useState(() => (typeof window !== 'undefined' ? Math.max(200, Math.floor(window.innerWidth * 0.9)) : 800));

  useEffect(() => {
    function updateWidth() {
      const el = wrapperRef.current;
      const w = el ? Math.max(200, el.clientWidth) : Math.max(200, Math.floor(window.innerWidth * 0.9));
      setClockWidth(w);
    }
    updateWidth();
    const onResize = () => updateWidth();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // compute scale based on whether centibeats are shown (centibeats need smaller scale)
  const scale = showCentibeats ? 0.18 : 0.22;

  // set CSS vars: --clock-width and --clock-user (slider value), and --clock-scale
  // keep only CSS variables inline (dynamic values); static layout moved to CSS
  const wrapperStyle = {
    ['--clock-width']: `${clockWidth}px`,
    ['--clock-user']: `${fontSize}px`,
    ['--clock-scale']: String(scale),
    ['--font-color']: fontColor,
    ['--font-family']: fontFamily,
  };

  return (
    <div ref={wrapperRef} className="swatch-clock-wrap text-center my-4" style={wrapperStyle}>
      <div className="display-1 fw-bold border border-2 border-secondary rounded-5 p-5">
        <div className="swatch-inline-flex">
          <div aria-hidden className="swatch-at">
            @
          </div>
          <div className="swatch-time">
            {swatchTime}
          </div>
        </div>
      </div>
      {showLocalTime && (
        <div className="swatch-localtime mt-2">
          {localTime}
        </div>
      )}
    </div>
  );
}
