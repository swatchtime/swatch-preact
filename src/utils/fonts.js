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
      // enable CORS on the stylesheet link to help with font fetching in some setups
      link.crossOrigin = 'anonymous';
      // Mark that a font load started
      startLoading();
      document.head.appendChild(link);

      // Wait for the stylesheet to be applied (onload) and then wait for
      // the font to be available via the Font Loading API. Use a slightly
      // longer timeout because some fonts (or slow networks) take more time.
      try {
        await Promise.race([
          new Promise((resolve) => {
            // If the browser supports onload for link, wait for it; otherwise
            // fall back to a short delay so we still attempt to load the font.
            if ('onload' in link) {
              link.addEventListener('load', () => resolve());
              link.addEventListener('error', () => resolve());
            } else {
              setTimeout(resolve, 300);
            }
          }),
          new Promise((resolve) => setTimeout(resolve, 2500))
        ]);

        // Attempt to load the font explicitly including weight. Use the first
        // declared weight (or 400) to form a clearer request for the FontFaceSet.
        const weight = (fam.weights && fam.weights[0]) ? fam.weights[0] : '400';
        await Promise.race([
          document.fonts.load(`normal ${weight} 1rem "${fam.family}"`),
          new Promise((resolve) => setTimeout(resolve, 3500))
        ]);
      } catch (e) {
        // ignore errors but leave a debug trace
        // console.debug('loadFontByFamilyName: load error', fam.family, e);
      } finally {
        finishLoading();
      }
    } else {
      // stylesheet already present: still try to wait for the font to be ready
      startLoading();
      try {
        const weight = (fam.weights && fam.weights[0]) ? fam.weights[0] : '400';
        await Promise.race([
          document.fonts.load(`normal ${weight} 1rem "${fam.family}"`),
          new Promise((resolve) => setTimeout(resolve, 2000))
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
