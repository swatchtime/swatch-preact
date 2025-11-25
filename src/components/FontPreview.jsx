import { useEffect } from 'preact/hooks';
import { loadFontByFamilyName, familyFromSettingString } from '../utils/fonts';

export function FontPreview({ fontFamily, fontColor, showCentibeats }) {
  useEffect(() => {
    const fam = familyFromSettingString(fontFamily);
    if (fam) {
      // fire-and-forget lazy load the font so preview renders correctly
      loadFontByFamilyName(fam);
    }
  }, [fontFamily]);

  const beatInteger = 9;
  const padded = String(beatInteger).padStart(3, '0');
  const fraction = '.09';
  const integer = padded;
  const fractionPart = showCentibeats ? fraction : '';

  const style = {
    color: fontColor || 'inherit',
    fontFamily: fontFamily || 'inherit',
    fontSize: '2.2rem',
    lineHeight: 1,
  };

  return (
    <div className="font-preview" style={style} aria-hidden>
      <div className="swatch-inline-flex">
        <div className="swatch-at">@</div>
        <div className="swatch-time">{integer}{fractionPart}</div>
      </div>
    </div>
  );
}
