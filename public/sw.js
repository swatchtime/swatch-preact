self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Simple message handler: main page can postMessage to the SW to request showing a notification
self.addEventListener('message', (event) => {
  try {
    const data = event.data || {};
    if (data.type === 'SHOW_NOTIFICATION') {
      const { title, options } = data;
      let finalTitle = title || '';
      try {
        // compute Swatch beat prefix if reminderTime or swatchTime provided
        if (options) {
          let swatchPrefix = '';
          if (options.swatchTime) {
            swatchPrefix = `@${String(options.swatchTime)}`;
          } else if (options.reminderTime) {
            const d = new Date(options.reminderTime);
            if (!isNaN(d.getTime())) {
              // compute beats: same logic as src/utils/swatchTime.calculateSwatchTime
              const utcHours = d.getUTCHours();
              const utcMinutes = d.getUTCMinutes();
              const utcSeconds = d.getUTCSeconds();
              const utcMilliseconds = d.getUTCMilliseconds();
              const bmtHours = (utcHours + 1) % 24;
              const totalSeconds = (bmtHours * 3600) + (utcMinutes * 60) + utcSeconds + (utcMilliseconds / 1000);
              const beats = (totalSeconds / 86.4) % 1000;
              const beatInt = String(Math.trunc(Number(beats))).padStart(3, '0');
              swatchPrefix = `@${beatInt}`;
            }
          }
          if (swatchPrefix) finalTitle = `${swatchPrefix} - ${finalTitle}`;
        }
      } catch (e) {}

      self.registration.showNotification(finalTitle, options || {});
    }
  } catch (e) {
    // ignore
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ includeUncontrolled: true });
      if (all.length > 0) {
        all[0].focus();
      } else {
        clients.openWindow('/');
      }
    })()
  );
});
