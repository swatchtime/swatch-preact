import { useState } from 'preact/hooks';
import { calculateSwatchTime, beatsToLocalTime } from '../utils/swatchTime';

export function TimeCalculator() {
  const [swatchValue, setSwatchValue] = useState('');
  const [localHours, setLocalHours] = useState('');
  const [localMinutes, setLocalMinutes] = useState('');
  const [localSeconds, setLocalSeconds] = useState('');

  const handleSwatchChange = (value) => {
    setSwatchValue(value);
    if (value && !isNaN(value)) {
      const beats = parseFloat(value);
      if (beats >= 0 && beats < 1000) {
        const localDate = beatsToLocalTime(beats);
        setLocalHours(String(localDate.getHours()).padStart(2, '0'));
        setLocalMinutes(String(localDate.getMinutes()).padStart(2, '0'));
        setLocalSeconds(String(localDate.getSeconds()).padStart(2, '0'));
      }
    }
  };

  const handleLocalChange = (hours, minutes, seconds) => {
    setLocalHours(hours);
    setLocalMinutes(minutes);
    setLocalSeconds(seconds);
    
    if (hours !== '' && minutes !== '' && seconds !== '') {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      const s = parseInt(seconds) || 0;
      
      if (h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60) {
        const date = new Date();
        date.setHours(h, m, s, 0);
        const beats = calculateSwatchTime(date);
        setSwatchValue(beats);
      }
    }
  };

  return (
    <div className="modal fade" id="calculatorModal" tabIndex="-1" aria-labelledby="calculatorModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="calculatorModalLabel">Time Converter</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <label className="form-label">Swatch Internet Time (@beats)</label>
              <input 
                type="number" 
                className="form-control" 
                placeholder="000.00"
                min="0"
                max="999.99"
                step="0.01"
                value={swatchValue}
                onChange={(e) => handleSwatchChange(e.target.value)}
              />
            </div>
            
            <div className="text-center mb-3">
              <span className="badge bg-secondary">⇅</span>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Local Time (24-hour format)</label>
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
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
