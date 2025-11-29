import { ColorPicker } from './ColorPicker';
import { useEffect, useState } from 'preact/hooks';
import { settingsSignal, setSettings as setSettingsSignal } from '../signals/store';
import { loadFontByFamilyName, familyFromSettingString } from '../utils/fonts';
import { FontPreview } from './FontPreview';

export function SettingsModal() {

    const settings = settingsSignal.value || {};
    const handleCheckboxChange = (key) => (e) => {
      setSettingsSignal({ ...settings, [key]: e.target.checked });
    };
    const [sliderMax, setSliderMax] = useState(600);

    useEffect(() => {
      function updateMax() {
          // Prefer the clock wrapper's measured width so slider max matches the frame
          const wrapper = document.querySelector('.swatch-clock-wrap');
          const containerWidth = wrapper ? wrapper.clientWidth : window.innerWidth;
          // base scale depends on whether centibeats are shown
          const baseScale = settings.showCentibeats ? 0.18 : 0.22;
          // small adjustment for fonts that are monospace/wider than average
          const fam = familyFromSettingString(settings.fontFamily || '');
          const scaleAdjust = fam && /mono/i.test(fam) ? 0.958 : 1;
          const scale = baseScale * scaleAdjust;
          // computed max is a fraction of the container width, but clamp to sensible bounds
          const computedMax = Math.max(80, Math.min(Math.floor(containerWidth * scale), 600));
          setSliderMax(computedMax);
          // clamp settings value if it exceeds new max
          if (settings.fontSize > computedMax) {
            setSettingsSignal({ ...settings, fontSize: computedMax });
          }
        }
      updateMax();
      window.addEventListener('resize', updateMax);
      return () => window.removeEventListener('resize', updateMax);
    }, [settings]);

    // real font list from google-fonts.json will replace these once fetched
    const [fontFamilies, setFontFamilies] = useState([
      'Sans-serif',
      'Serif',
      'Monospace'
    ]);

    useEffect(() => {
      let cancelled = false;
      fetch('/google-fonts.json').then(r => r.ok ? r.json() : null).then(data => {
        if (cancelled || !data || !Array.isArray(data.families)) return;
        const list = data.families.map(f => `${f.family}, ${f.fallback || (f.family.toLowerCase().includes('code') ? 'monospace' : 'sans-serif')}`);
        if (list.length) setFontFamilies(list);
      }).catch(() => {});
      return () => { cancelled = true; };
    }, []);

    const handleChange = (key, value) => {
      // When user changes fontFamily, lazy-load selected Google Font
      if (key === 'fontFamily') {
        const fam = familyFromSettingString(value);
        if (fam) {
          loadFontByFamilyName(fam);
        }
      }
      setSettingsSignal({ ...settings, [key]: value });
    };

    return (
      <div className="modal fade" id="settingsModal" tabIndex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
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
                    setSettingsSignal({ ...settings, fontColor: color, colorPreset: preset, ...(customColor ? { customColor } : {}) });
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Font size: {settings.fontSize}px</label>
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
                <label className="form-label">Font family</label>
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
              <div className="mb-3">
                <label className="form-label">Preview</label>
                <FontPreview fontFamily={settings.fontFamily} fontColor={settings.fontColor} showCentibeats={settings.showCentibeats} />
              </div>

              <div className="form-check mt-5 mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="showLocalTime"
                  checked={settings.showLocalTime}
                  onChange={handleCheckboxChange('showLocalTime')}
                />
                <label className="form-check-label" htmlFor="showLocalTime">
                  Show local time
                </label>
              </div>

              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="showSeconds"
                  checked={settings.showSeconds}
                  onChange={handleCheckboxChange('showSeconds')}
                />
                <label className="form-check-label" htmlFor="showSeconds">
                  Show seconds
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
                  24-hour format
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
              
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
}
