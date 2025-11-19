export function SettingsModal({ settings, onSettingsChange }) {
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
              <label className="form-label">Font Color</label>
              <input 
                type="color" 
                className="form-control form-control-color" 
                value={settings.fontColor}
                onChange={(e) => handleChange('fontColor', e.target.value)}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Font Size: {settings.fontSize}px</label>
              <input 
                type="range" 
                className="form-range" 
                min="20" 
                max="200" 
                value={settings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
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
                onChange={(e) => handleChange('showLocalTime', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="showLocalTime">
                Show Local Time
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
            
            <div className="form-check mb-3">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="darkTheme"
                checked={settings.darkTheme}
                onChange={(e) => handleChange('darkTheme', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="darkTheme">
                Dark Theme
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
