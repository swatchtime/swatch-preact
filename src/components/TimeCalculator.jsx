import { useState, useEffect, useRef } from 'preact/hooks';
import { calculateSwatchTime, beatsToLocalTime, normalizeBeats } from '../utils/swatchTime';
import { settingsSignal, setSettings as setSettingsSignal } from '../signals/store';

export function TimeCalculator() {

  const settings = settingsSignal.value || {};
  const [swatchValue, setSwatchValue] = useState('');
  const [localHours, setLocalHours] = useState('');
  const [localMinutes, setLocalMinutes] = useState('');
  const [localSeconds, setLocalSeconds] = useState('');
  const [localAmPm, setLocalAmPm] = useState('AM');
  const prevFormatRef = useRef(undefined);

  // Helpers to convert between 24-hour and 12-hour representations.
  const to12Hour = (hour24Str) => {
    if (!hour24Str && hour24Str !== '0') return null;
    const n = Number(hour24Str);
    if (Number.isNaN(n) || n < 0 || n > 23) return null;
    const ampm = n >= 12 ? 'PM' : 'AM';
    const hour12 = ((n + 11) % 12) + 1; // maps 0->12, 12->12
    return { hour12: String(hour12).padStart(2, '0'), ampm };
  };

  const to24Hour = (hour12Str, ampmStr) => {
    if (!hour12Str) return null;
    const n = Number(hour12Str);
    if (Number.isNaN(n) || n < 1 || n > 12) return null;
    let hh = n % 12; // 12 -> 0
    if ((ampmStr || '').toUpperCase() === 'PM') hh += 12;
    return String(hh).padStart(2, '0');
  };

  function formatBeatsDisplay(s) {
    if (!s) return '';
    const parts = String(s).split('.');
    const intPart = parts[0].padStart(3, '0');
    if (parts.length === 1) return intPart;
    const dec = parts[1];
    return `${intPart}.${(dec + '00').slice(0, 2)}`;
  }

  const handleSwatchChange = (value) => {
    let raw = String(value || '').trim();
    if (raw.startsWith('@')) raw = raw.slice(1);
    raw = raw.replace(/[^0-9.]/g, '');
    if (raw.length > 6) raw = raw.slice(0, 6);
    setSwatchValue(raw);
  };

  const handleSwatchSubmit = () => {
    const normalized = normalizeBeats(swatchValue);
    if (!normalized) {
      setSwatchValue('');
      setLocalHours(''); setLocalMinutes(''); setLocalSeconds('');
      return;
    }
    const display = formatBeatsDisplay(normalized);
    setSwatchValue(display);

    const beats = parseFloat(normalized);
    if (!Number.isNaN(beats) && beats >= 0 && beats < 1000) {
      const localDate = beatsToLocalTime(beats);
      let hh = localDate.getHours();
      let mm = localDate.getMinutes();
      let ss = localDate.getSeconds();
      if (settings && settings.timeFormat24 === false) {
        setLocalAmPm(hh >= 12 ? 'PM' : 'AM');
        hh = ((hh + 11) % 12) + 1; // 1-12
      }
      setLocalHours(String(hh).padStart(2, '0'));
      setLocalMinutes(String(mm).padStart(2, '0'));
      setLocalSeconds(String(ss).padStart(2, '0'));
    }
  };

  const handleLocalChange = (hours, minutes, seconds, ampm, onConvert = false) => {
    setLocalHours(hours);
    setLocalMinutes(minutes);
    setLocalSeconds(seconds);
    if (ampm) setLocalAmPm(ampm);

    if (hours !== '' && minutes !== '') {
      let h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      const s = parseInt(seconds || '0') || 0;

      if (settings && settings.timeFormat24 === false) {
        if ((ampm || localAmPm) === 'PM' && h < 12) h = h + 12;
        if ((ampm || localAmPm) === 'AM' && h === 12) h = 0;
      }

      if (h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60) {
        const date = new Date();
        date.setHours(h, m, s, 0);
        const beats = calculateSwatchTime(date);
        setSwatchValue(formatBeatsDisplay(beats));
      } else if (onConvert) {
        setSwatchValue('');
        setLocalHours('');
        setLocalMinutes('');
        setLocalSeconds('');
        setLocalAmPm('AM');
      }
    }
  };

  const handleConvertClick = (e) => {
    e.preventDefault();
    if (swatchValue && swatchValue.trim() !== '') {
      handleSwatchSubmit();
    } else if (localHours !== '' || localMinutes !== '' || localSeconds !== '') {
      handleLocalChange(localHours, localMinutes, localSeconds, localAmPm, true);
    }
  };

  // When the global timeFormat24 setting toggles, convert the local inputs
  // between 12/24-hour representations where possible. If conversion isn't
  // possible (invalid/partial input), clear the form to avoid impossible values.
  useEffect(() => {
    const currentFormat24 = !!(settings && settings.timeFormat24);
    if (prevFormatRef.current === undefined) {
      prevFormatRef.current = currentFormat24;
      return;
    }
    if (prevFormatRef.current === currentFormat24) return;

    if (currentFormat24) {
      // switching to 24-hour: convert from local 12-hour inputs
      const conv = to24Hour(localHours, localAmPm);
      if (conv !== null) {
        setLocalHours(conv);
      } else {
        // cannot convert safely; clear inputs
        setLocalHours(''); setLocalMinutes(''); setLocalSeconds(''); setLocalAmPm('AM');
      }
    } else {
      // switching to 12-hour: convert from local 24-hour input
      const conv = to12Hour(localHours);
      if (conv !== null) {
        setLocalHours(conv.hour12);
        setLocalAmPm(conv.ampm);
      } else {
        setLocalHours(''); setLocalMinutes(''); setLocalSeconds(''); setLocalAmPm('AM');
      }
    }
    prevFormatRef.current = currentFormat24;
  }, [settings && settings.timeFormat24]);

  return (
    <div className="modal fade" id="calculatorModal" tabIndex="-1" aria-labelledby="calculatorModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg modal-fullscreen-md-down">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="calculatorModalLabel">Time Converter</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleConvertClick}>
            <div className="mb-4">
              <label className="form-label">Swatch Internet Time (@beats)</label>
              <div className="input-group">
                <span className="input-group-text" id="beats-addon">@</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="000.00"
                  aria-describedby="beats-addon"
                  value={swatchValue}
                  maxLength={7}
                  onChange={(e) => handleSwatchChange(e.target.value)}
                />
              </div>
            </div>
            
            <div className="text-center mb-3">
              <button type="submit" className="btn btn-lg bg-secondary-subtle px-5 py-2 fs-2 border border-2 border-secondary shadow" title="Convert selected time"><i class="bi bi-arrow-down-up"></i></button>
            </div>
            
            <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Local Time {(settings && settings.timeFormat24 === false) ? '(12-hour)' : '(24-hour)'}</label>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="timeFormat24_calc"
                      checked={!!(settings && settings.timeFormat24)}
                      onChange={(e) => setSettingsSignal({ ...settings, timeFormat24: e.target.checked })}
                    />
                    <label className="form-check-label ms-2" htmlFor="timeFormat24_calc">24-hour format</label>
                  </div>
                </div>
              <div>
                {settings && settings.timeFormat24 === false ? (
                  <div className="row g-2">
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="HH"
                        min="1"
                        max="12"
                        value={localHours}
                        onChange={(e) => handleLocalChange(e.target.value, localMinutes, localSeconds)}
                      />
                      <small className="text-muted">Hours</small>
                    </div>
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="MM"
                        min="0"
                        max="59"
                        value={localMinutes}
                        onChange={(e) => handleLocalChange(localHours, e.target.value, localSeconds)}
                      />
                      <small className="text-muted">Minutes</small>
                    </div>
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="SS"
                        min="0"
                        max="59"
                        value={localSeconds}
                        onChange={(e) => handleLocalChange(localHours, localMinutes, e.target.value)}
                      />
                      <small className="text-muted">Seconds</small>
                    </div>
                    <div className="col-12 mt-2">
                      <select className="form-select" value={localAmPm} onChange={(e) => { setLocalAmPm(e.target.value); handleLocalChange(localHours, localMinutes, localSeconds, e.target.value); }}>
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>
                    
                  </div>
                ) : (
                  <div className="row g-2">
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="HH"
                        min="0"
                        max="23"
                        value={localHours}
                        onChange={(e) => handleLocalChange(e.target.value, localMinutes, localSeconds)}
                      />
                      <small className="text-muted">Hours (0-23)</small>
                    </div>
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="MM"
                        min="0"
                        max="59"
                        value={localMinutes}
                        onChange={(e) => handleLocalChange(localHours, e.target.value, localSeconds)}
                      />
                      <small className="text-muted">Minutes</small>
                    </div>
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="SS"
                        min="0"
                        max="59"
                        value={localSeconds}
                        onChange={(e) => handleLocalChange(localHours, localMinutes, e.target.value)}
                      />
                      <small className="text-muted">Seconds</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={() => { setSwatchValue(''); setLocalHours(''); setLocalMinutes(''); setLocalSeconds(''); setLocalAmPm('AM'); }}>Clear</button>
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
