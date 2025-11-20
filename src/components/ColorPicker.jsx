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
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }} className="mb-2">
        <div className="border border-secondary bg-transparent" style={{ padding: '8px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            {list.map(p => {
              const isSelected = selectedPreset === p.key || (selectedPreset !== 'custom' && matchesColor(p));
              return (
                <div key={p.key} style={{ padding: isSelected ? '3px' : 0, borderRadius: '10px', boxSizing: 'border-box', border: isSelected ? `2px solid ${frameBorderColor}` : '2px solid transparent' }}>
                  <button
                    type="button"
                    onClick={handlePresetClick(p)}
                    className="btn p-0"
                    aria-label={p.label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      padding: '6px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', backgroundColor: p.color, borderRadius: '6px' }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-secondary bg-transparent" style={{ padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.8rem', marginBottom: '6px' }} className={darkTheme ? 'text-light' : ''}>Choose Custom Color</div>
          <div style={{ padding: selectedPreset === 'custom' ? '3px' : 0, borderRadius: '10px', boxSizing: 'border-box', border: selectedPreset === 'custom' ? `2px solid ${frameBorderColor}` : '2px solid transparent' }}>
            <input
              type="color"
              className="form-control form-control-color p-0"
              value={customColor || currentColor}
              onInput={handleCustomChange}
              title="Custom color"
              aria-label="Custom color"
              style={{ width: '44px', height: '44px', padding: 0, borderRadius: '8px', border: 'none', background: 'transparent' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
