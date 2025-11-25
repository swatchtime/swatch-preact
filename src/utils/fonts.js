// Utilities for loading Google Fonts on-demand
export async function loadFontByFamilyName(familyName) {
  if (!familyName) return;
  // familyName is expected like 'Roboto' (without fallback)
  try {
    const res = await fetch('/google-fonts.json');
    if (!res.ok) return;
    const data = await res.json();
    const fam = (data.families || []).find(f => String(f.family).toLowerCase() === String(familyName).toLowerCase());
    if (!fam) return;
    const name = encodeURIComponent(fam.family).replace(/%20/g, '+');
    const weights = (fam.weights && fam.weights.length) ? `:wght@${fam.weights.join(';')}` : '';
    const display = fam.display || 'swap';
    const href = `https://fonts.googleapis.com/css2?family=${name}${weights}&display=${display}`;

    // Avoid injecting duplicate links for the same href
    const existingLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][data-google-font]'));
    const exists = existingLinks.some(l => l.href === href);
    // Track concurrent font loads via a counter on the documentElement so the
    // loading class is removed only when all loads finish.
    const docEl = document.documentElement;
    const startLoading = () => {
      const cur = parseInt(docEl.dataset.fontsLoadingCount || '0', 10) || 0;
      docEl.dataset.fontsLoadingCount = String(cur + 1);
      docEl.classList.add('fonts-loading');
    };
    const finishLoading = () => {
      const cur = parseInt(docEl.dataset.fontsLoadingCount || '0', 10) || 0;
      const next = Math.max(0, cur - 1);
      if (next === 0) {
        delete docEl.dataset.fontsLoadingCount;
        docEl.classList.remove('fonts-loading');
      } else {
        docEl.dataset.fontsLoadingCount = String(next);
      }
    };

    // Preconnect (best-effort)
    if (!document.querySelector('link[rel="preconnect"][href="https://fonts.googleapis.com"]')) {
      const p1 = document.createElement('link');
      p1.rel = 'preconnect';
      p1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(p1);
    }
    if (!document.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]')) {
      const p2 = document.createElement('link');
      p2.rel = 'preconnect';
      p2.href = 'https://fonts.gstatic.com';
      p2.crossOrigin = '';
      document.head.appendChild(p2);
    }

    // If the stylesheet already exists, we still want to observe font readiness
    // so the UI transition is applied appropriately.
    if (!exists) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-google-font', fam.family);
      // Mark that a font load started
      startLoading();
      document.head.appendChild(link);
      // Wait for font availability (modern browsers) but guard with a timeout
      try {
        await Promise.race([
          document.fonts.load(`1rem "${fam.family}"`),
          new Promise((resolve) => setTimeout(resolve, 1500))
        ]);
      } catch (e) {
        // ignore
      } finally {
        finishLoading();
      }
    } else {
      // stylesheet already present: still try to wait for the font to be ready
      startLoading();
      try {
        await Promise.race([
          document.fonts.load(`1rem "${fam.family}"`),
          new Promise((resolve) => setTimeout(resolve, 800))
        ]);
      } catch (e) {
        // ignore
      } finally {
        finishLoading();
      }
    }
  } catch (e) {
    // ignore
  }
}

export function familyFromSettingString(settingString) {
  if (!settingString) return '';
  return settingString.split(',')[0].trim();
}
