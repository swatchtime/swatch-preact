#!/usr/bin/env node
// Simple latency benchmark for a deployed Cloudflare Worker endpoint.
// Usage: node tools/benchmark/benchmark-cloudflare.js <url> [iterations]

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: node tools/benchmark/benchmark-cloudflare.js <url> [iterations]');
  process.exit(2);
}
const url = args[0].replace(/\/$/, '');
const iterations = parseInt(args[1], 10) || 100;

async function fetchWithTiming(u) {
  const start = process.hrtime.bigint();
  const res = await fetch(u, { cache: 'no-store' });
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  const text = await res.text();
  return { ms, status: res.status, body: text };
}

function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

(async () => {
  console.log(`Benchmarking ${url} — ${iterations} requests`);
  const results = [];
  // First request may be a cold-start; record it separately
  console.log('  Running initial (possibly cold-start) request...');
  try {
    const r0 = await fetchWithTiming(url);
    console.log(`    initial: ${r0.ms.toFixed(2)} ms (status ${r0.status})`);
  } catch (e) {
    console.error('Initial request failed:', e.message || e);
    process.exit(1);
  }

  for (let i = 0; i < iterations; i++) {
    try {
      const r = await fetchWithTiming(url + '?_t=' + Date.now());
      results.push(r.ms);
      if ((i + 1) % 20 === 0) process.stdout.write('.');
    } catch (e) {
      console.error('\nRequest failed:', e.message || e);
      process.exit(1);
    }
  }
  process.stdout.write('\n');

  const total = results.reduce((a, b) => a + b, 0);
  const avg = total / results.length;
  console.log('\nResults:');
  console.log(`  Requests: ${results.length}`);
  console.log(`  Average latency: ${avg.toFixed(3)} ms`);
  console.log(`  Median (p50): ${percentile(results, 0.5).toFixed(3)} ms`);
  console.log(`  p90: ${percentile(results, 0.9).toFixed(3)} ms`);
  console.log(`  Min: ${Math.min(...results).toFixed(3)} ms`);
  console.log(`  Max: ${Math.max(...results).toFixed(3)} ms`);
  console.log('\nNote: These are wall-clock latencies from your machine to Cloudflare edge and back.');
})();
