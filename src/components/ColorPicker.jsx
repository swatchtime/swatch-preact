import { h } from 'preact';
import { useMemo } from 'preact/hooks';

export function ColorPicker({ darkTheme, currentColor, selectedPreset, customColor, onChange }) {
  // Preset lists (default color will be prepended)
  const presets = useMemo(() => ({
    dark: [
      { key: 'dark-lime', label: 'Lime', color: '#00FF00' },
      { key: 'dark-gold', label: 'Gold', color: '#FFD700' },
      { key: 'dark-red', label: 'Red', color: '#FF4136' },
      { key: 'dark-blue', label: 'Blue', color: '#1E90FF' }
    ],
    light: [
      { key: 'light-blue', label: 'Blue', color: '#1E90FF' },
      { key: 'light-red', label: 'Red', color: '#FF4136' },
      { key: 'light-forest', label: 'Forest', color: '#228B22' },
      { key: 'light-purple', label: 'Purple', color: '#800080' }
    ]
  }), []);

  const defaultColor = darkTheme ? '#ffffff' : '#000000';
  const list = (darkTheme ? presets.dark : presets.light).slice();
  // prepend default option
  list.unshift({ key: darkTheme ? 'dark-default' : 'light-default', label: 'Default', color: defaultColor });

  const frameBorderColor = darkTheme ? '#ffffff' : '#000000';

  const handlePresetClick = (preset) => () => {
    if (typeof onChange === 'function') onChange({ color: preset.color, preset: preset.key });
  };

  const handleCustomChange = (e) => {
    const value = e.target.value;
    if (typeof onChange === 'function') onChange({ color: value, preset: 'custom', customColor: value });
  };

  // helper to determine selection
  const matchesColor = (p) => String(currentColor || '').toLowerCase() === String(p.color).toLowerCase();

  return (
    <div>
      <label className="form-label">Color Presets</label>
      <div className="mb-2 colorpicker-row">
        <div className="border border-secondary bg-transparent colorpicker-panel">
          <div className="color-thumb-row">
            {list.map(p => {
              const isSelected = selectedPreset === p.key || (selectedPreset !== 'custom' && matchesColor(p));
              return (
                <div key={p.key} className={`color-thumb ${isSelected ? 'selected' : ''} ${darkTheme ? 'thumb-dark' : 'thumb-light'}`}>
                  <button
                    type="button"
                    onClick={handlePresetClick(p)}
                    className="btn p-0 color-btn"
                    aria-label={p.label}
                  >
                    <div className="color-swatch" style={{ ['--swatch-color']: p.color }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-secondary bg-transparent colorpicker-panel color-custom-panel">
          <div className={darkTheme ? 'text-light color-custom-label' : 'color-custom-label'}>Choose Custom Color</div>
          <div className={`color-input-wrapper ${selectedPreset === 'custom' ? 'selected' : ''} ${darkTheme ? 'thumb-dark' : 'thumb-light'}`}>
            <input
              type="color"
              className="form-control form-control-color p-0 color-input"
              value={customColor || currentColor}
              onInput={handleCustomChange}
              title="Custom color"
              aria-label="Custom color"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
