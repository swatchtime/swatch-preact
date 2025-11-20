#!/usr/bin/env node
// Simple local benchmark to measure average CPU ms and wall ms per invocation
// Usage: node tools/benchmark/benchmark.js [iterations]

const iterations = parseInt(process.argv[2], 10) || 10000;
const warmup = Math.min(1000, Math.floor(iterations * 0.05));

function calculateSwatchTime(date = new Date()) {
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcSeconds = date.getUTCSeconds();
  const utcMilliseconds = date.getUTCMilliseconds();
  const bmtHours = (utcHours + 1) % 24;
  const totalSeconds = (bmtHours * 3600) + (utcMinutes * 60) + utcSeconds + (utcMilliseconds / 1000);
  const beats = (totalSeconds / 86.4) % 1000;
  return Number(beats.toFixed(2));
}

function formatTimes(now = new Date()) {
  const sw = calculateSwatchTime(now);
  const rounded = Math.round(sw).toString();
  const pad = (n) => String(n).padStart(2, '0');
  const time24 = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const time12 = `${pad(hours)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return {
    swatch: sw.toFixed(2),
    rounded,
    time24,
    time12,
    ampm,
    timestamp: now.toISOString()
  };
}

function runOnce() {
  // small work similar to the worker: compute times then pick fields
  const now = new Date();
  const res = formatTimes(now);
  // access a few properties to simulate JSON creation
  return `${res.swatch}|${res.time24}|${res.time12}`;
}

console.log(`Benchmark: ${iterations} iterations (warmup ${warmup})`);

// Warmup
for (let i = 0; i < warmup; i++) runOnce();

// Measure CPU and wall time
const startCpu = process.cpuUsage(); // microseconds
const startWall = process.hrtime.bigint();

for (let i = 0; i < iterations; i++) {
  runOnce();
}

const endCpu = process.cpuUsage(startCpu); // diff
const endWall = process.hrtime.bigint();

const cpuMicros = (endCpu.user + endCpu.system); // microseconds
const wallMs = Number(endWall - startWall) / 1e6;

const avgCpuMs = (cpuMicros / 1000) / iterations;
const avgWallMs = wallMs / iterations;

console.log('\nResults:');
console.log(`  Total wall time: ${wallMs.toFixed(3)} ms`);
console.log(`  Total CPU time: ${(cpuMicros / 1000).toFixed(3)} ms`);
console.log(`  Average wall time per invocation: ${avgWallMs.toFixed(6)} ms`);
console.log(`  Average CPU time per invocation: ${avgCpuMs.toFixed(6)} ms`);
console.log('\nNote: CPU time measured via process.cpuUsage(); wall time via high-res timer.');

process.exit(0);
