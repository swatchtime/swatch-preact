import { render } from 'preact'
import { App } from './app.jsx'
import './styles.css'
import { registerServiceWorker } from './utils/notifications';

const appRoot = document.getElementById('app');

// Render the app immediately; load fonts in the background to avoid
// a flashy blocking spinner while fonts download.
render(<App />, appRoot);

async function loadFonts() {
	try {
		const res = await fetch('/google-fonts.json');
		if (res && res.ok) {
			const data = await res.json();
			const families = (data.families || []).map(f => {
				const name = encodeURIComponent(f.family).replace(/%20/g, '+');
				const weights = (f.weights && f.weights.length) ? `:wght@${f.weights.join(';')}` : '';
				return `family=${name}${weights}`;
			}).join('&');
			if (families) {
				const display = (data.families[0] && data.families[0].display) || 'swap';
				const p1 = document.createElement('link');
				p1.rel = 'preconnect';
				p1.href = 'https://fonts.googleapis.com';
				document.head.appendChild(p1);
				const p2 = document.createElement('link');
				p2.rel = 'preconnect';
				p2.href = 'https://fonts.gstatic.com';
				p2.crossOrigin = '';
				document.head.appendChild(p2);

				const href = `https://fonts.googleapis.com/css2?${families}&display=${display}`;
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = href;
				document.head.appendChild(link);
				// Do not await load; let the stylesheet apply when it becomes available.
			}
		}
	} catch (e) {
		// Ignore font-loading errors and continue
	}
}

loadFonts();

// register service worker (best-effort)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
	// register in a short timeout to avoid blocking initial render
	setTimeout(async () => {
		try {
			if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
				const existing = await navigator.serviceWorker.getRegistration();
				if (!existing) {
					await registerServiceWorker();
				}
			} else {
				// Fallback: attempt registration if API isn't available as expected
				await registerServiceWorker();
			}
		} catch (e) {
			// Non-fatal; swallow errors to keep startup smooth
		}
	}, 1000);
}

// register service worker (best-effort)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
	// register in a short timeout to avoid blocking initial render
	setTimeout(async () => {
		try {
			// If there's already a registration, skip calling register again.
			if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
				const existing = await navigator.serviceWorker.getRegistration();
				if (!existing) {
					await registerServiceWorker();
				}
			} else {
				// Fallback: attempt registration if API isn't available as expected
				await registerServiceWorker();
			}
		} catch (e) {
			// Non-fatal; swallow errors to keep startup smooth
		}
	}, 1000);
}
