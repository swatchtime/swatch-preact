import { ColorPicker } from './ColorPicker';
import { useEffect, useState } from 'preact/hooks';

export function SettingsModal({ settings, onSettingsChange }) {
    const handleCheckboxChange = (key) => (e) => {
      onSettingsChange({ ...settings, [key]: e.target.checked });
    };
    const [sliderMax, setSliderMax] = useState(600);

    useEffect(() => {
      function updateMax() {
          // Prefer the clock wrapper's measured width so slider max matches the frame
          const wrapper = document.querySelector('.swatch-clock-wrap');
          const containerWidth = wrapper ? wrapper.clientWidth : window.innerWidth;
          const scale = settings.showCentibeats ? 0.18 : 0.22;
          // computed max is a fraction of the container width, but clamp to sensible bounds
          const computedMax = Math.max(80, Math.min(Math.floor(containerWidth * scale), 600));
          setSliderMax(computedMax);
          // clamp settings value if it exceeds new max
          if (settings.fontSize > computedMax) {
            onSettingsChange({ ...settings, fontSize: computedMax });
          }
        }
      updateMax();
      window.addEventListener('resize', updateMax);
      return () => window.removeEventListener('resize', updateMax);
    }, [onSettingsChange, settings]);
  const fontFamilies = [
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif'
  ];

  const handleChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="modal fade" id="settingsModal" tabIndex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="settingsModalLabel">Settings</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <ColorPicker
                darkTheme={settings.darkTheme}
                currentColor={settings.fontColor}
                customColor={settings.customColor}
                selectedPreset={settings.colorPreset}
                onChange={({ color, preset, customColor }) => {
                  onSettingsChange({ ...settings, fontColor: color, colorPreset: preset, ...(customColor ? { customColor } : {}) });
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Font Size: {settings.fontSize}px</label>
              <input 
                type="range" 
                className="form-range" 
                min="20" 
                max={sliderMax} 
                value={settings.fontSize}
                onChange={(e) => handleChange('fontSize', Math.min(parseInt(e.target.value), sliderMax))}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Font Family</label>
              <select 
                className="form-select"
                value={settings.fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font.split(',')[0]}</option>
                ))}
              </select>
            </div>
            
            <div className="form-check mb-3">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="showLocalTime"
                checked={settings.showLocalTime}
                onChange={handleCheckboxChange('showLocalTime')}
              />
              <label className="form-check-label" htmlFor="showLocalTime">
                Show Local Time
              </label>
            </div>
            <div className="form-check mb-3">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="showCentibeats"
                checked={settings.showCentibeats}
                onChange={handleCheckboxChange('showCentibeats')}
              />
              <label className="form-check-label" htmlFor="showCentibeats">
                Show centibeats (e.g. @626.43)
              </label>
            </div>
            
            <div className="form-check mb-3">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="timeFormat24"
                checked={settings.timeFormat24}
                onChange={(e) => handleChange('timeFormat24', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="timeFormat24">
                24-Hour Format
              </label>
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
