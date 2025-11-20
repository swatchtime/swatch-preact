export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const { pathname, searchParams } = url;

      if (!pathname.startsWith('/api/v1/current')) {
        return new Response('Not Found', { status: 404 });
      }

      function calculateSwatchTime(date = new Date()) {
        const utcHours = date.getUTCHours();
        const utcMinutes = date.getUTCMinutes();
        const utcSeconds = date.getUTCSeconds();
        const utcMs = date.getUTCMilliseconds();
        const bmtHours = (utcHours + 1) % 24; // Biel Mean Time (UTC+1)
        const totalSeconds = (bmtHours * 3600) + (utcMinutes * 60) + utcSeconds + utcMs / 1000;
        const beats = (totalSeconds / 86.4) % 1000;
        return Number(beats.toFixed(2));
      }

      function formatTimes(now = new Date()) {
        const sw = calculateSwatchTime(now);
        const rounded = Math.round(sw).toString();
        const whole = Math.trunc(sw).toString();
        const pad = (n) => String(n).padStart(2, '0');
        const time24 = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const time12 = `${pad(hours)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        return {
          swatch: sw.toFixed(2),
          rounded,
          whole,
          time24,
          time12,
          ampm,
          timestamp: now.toISOString()
        };
      }

      const all = formatTimes(new Date());

      // fields query param: comma-separated list
      const fieldsParam = searchParams.get('fields');
      let body = {};
      if (!fieldsParam) {
        body = all;
      } else {
        const fields = fieldsParam.split(',').map(s => s.trim()).filter(Boolean);
        fields.forEach(f => {
          const key = f.toLowerCase();
          if (key === 'swatch' || key === 'swatchtime' || key === 'swatch_time') body.swatch = all.swatch;
          else if (key === 'rounded') body.rounded = all.rounded;
          else if (key === 'whole') body.whole = all.whole;
          else if (key === '24hr' || key === 'time24' || key === 'time_24') body.time24 = all.time24;
          else if (key === '12hr' || key === 'time12' || key === 'time_12') { body.time12 = all.time12; body.ampm = all.ampm; }
          else if (key === 'timestamp') body.timestamp = all.timestamp;
        });
      }

      const headers = new Headers();
      headers.set('Content-Type', 'application/json; charset=utf-8');
      // Allow 1 second CDN caching
      headers.set('Cache-Control', 's-maxage=1, max-age=0');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(JSON.stringify(body), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
};
