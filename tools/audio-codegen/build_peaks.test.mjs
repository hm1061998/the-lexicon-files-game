import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { computePeaks } from './build_peaks.mjs';

const script = fileURLToPath(new URL('./build_peaks.mjs', import.meta.url));

/** A mono PCM WAV: a sine for the first half of the samples, silence for the second half. */
function wav({ bits = 16, samples = 6400, format = 1 } = {}) {
  const bytes = bits / 8;
  const data = Buffer.alloc(samples * bytes);
  for (let i = 0; i < samples / 2; i += 1) {
    if (bits === 16) data.writeInt16LE(Math.round(Math.sin(i / 5) * 12000), i * 2);
    else data.writeUInt8(128 + Math.round(Math.sin(i / 5) * 60), i);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(format, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(24000 * bytes, 28);
  header.writeUInt16LE(bytes, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

test('64 bars in 0..1: loud first half, silent second half, max is 1', () => {
  const bars = computePeaks(wav());
  assert.equal(bars.length, 64);
  assert.equal(Math.max(...bars), 1);
  assert.ok(
    bars.slice(0, 30).every((v) => v > 0.5),
    'first half is loud',
  );
  assert.ok(
    bars.slice(34).every((v) => v === 0),
    'second half is silent',
  );
  assert.ok(bars.every((v) => v >= 0 && v <= 1));
});

test('values are rounded to three decimals', () => {
  for (const v of computePeaks(wav())) assert.equal(v, Math.round(v * 1000) / 1000);
});

test('the same input gives the same output', () => {
  assert.deepEqual(computePeaks(wav()), computePeaks(wav()));
});

test('an all-silent file gives 64 zeros rather than NaN', () => {
  const silent = wav();
  silent.fill(0, 44);
  assert.deepEqual(computePeaks(silent), new Array(64).fill(0));
});

test('rejects a WAV that is not 16-bit PCM', () => {
  assert.throws(() => computePeaks(wav({ bits: 8 })), /16-bit PCM/);
  assert.throws(() => computePeaks(wav({ format: 3 })), /16-bit PCM/);
  assert.throws(() => computePeaks(Buffer.from('not a wav file at all, really')), /WAV/);
});

test('the CLI writes <file>.peaks.json and exits 1 on a bad file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'peaks-'));
  const good = join(dir, 'a.wav');
  writeFileSync(good, wav());
  const ok = spawnSync(process.execPath, [script, good], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  const json = JSON.parse(readFileSync(`${good}.peaks.json`, 'utf8'));
  assert.equal(json.version, 1);
  assert.equal(json.bars.length, 64);

  const bad = join(dir, 'b.wav');
  writeFileSync(bad, wav({ bits: 8 }));
  const failed = spawnSync(process.execPath, [script, bad], { encoding: 'utf8' });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /16-bit PCM/);
});
