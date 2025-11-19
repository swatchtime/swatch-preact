import { useState, useEffect } from 'preact/hooks';
import { calculateSwatchTime } from '../utils/swatchTime';

export function SwatchClock({ fontSize, fontColor, fontFamily, showLocalTime, timeFormat24 }) {
  const [swatchTime, setSwatchTime] = useState('000.00');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const beats = calculateSwatchTime();
      setSwatchTime(beats);
      
      if (showLocalTime) {
        const now = new Date();
        const hours = timeFormat24 ? now.getHours() : now.getHours() % 12 || 12;
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = timeFormat24 ? '' : (now.getHours() >= 12 ? ' PM' : ' AM');
        setLocalTime(`${hours}:${minutes}:${seconds}${ampm}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [showLocalTime, timeFormat24]);

  const clockStyle = {
    fontSize: `${fontSize}px`,
    color: fontColor,
    fontFamily: fontFamily,
  };

  return (
    <div className="text-center my-4">
      <div style={clockStyle} className="display-1 fw-bold">
        @{swatchTime}
      </div>
      {showLocalTime && (
        <div style={{ ...clockStyle, fontSize: `${fontSize * 0.4}px` }} className="mt-2">
          {localTime}
        </div>
      )}
    </div>
  );
}
