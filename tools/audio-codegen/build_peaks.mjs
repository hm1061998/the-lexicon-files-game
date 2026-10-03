// Waveform peaks for the recorder: 64 RMS columns per WAV, written next to the audio file.
//
//   node tools/audio-codegen/build_peaks.mjs [files...]
//
// With no arguments it covers every `.wav` named by a listening task of any case. Pure Node, no
// dependency; the output is byte-stable for the same input.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BARS = 64;

/** Reads a mono or multi-channel 16-bit PCM WAV and returns 64 values in 0..1 (3 decimals). */
export function computePeaks(buffer) {
  if (
    buffer.length < 44 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WAVE'
  ) {
    throw new Error('not a WAV file (missing RIFF/WAVE header)');
  }
  let format = null;
  let data = null;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      format = {
        audioFormat: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        bits: buffer.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      data = buffer.subarray(body, Math.min(buffer.length, body + size));
    }
    offset = body + size + (size % 2);
  }
  if (!format || !data) throw new Error('not a WAV file (no fmt or data chunk)');
  if (format.audioFormat !== 1 || format.bits !== 16) {
    throw new Error(
      `expected 16-bit PCM, found format ${format.audioFormat} at ${format.bits} bits`,
    );
  }
  const frames = Math.floor(data.length / (2 * format.channels));
  const rms = new Array(BARS).fill(0);
  for (let bar = 0; bar < BARS; bar += 1) {
    const start = Math.floor((bar * frames) / BARS);
    const end = Math.floor(((bar + 1) * frames) / BARS);
    let sum = 0;
    for (let frame = start; frame < end; frame += 1) {
      let mixed = 0;
      for (let channel = 0; channel < format.channels; channel += 1) {
        mixed += data.readInt16LE((frame * format.channels + channel) * 2);
      }
      const sample = mixed / format.channels / 32768;
      sum += sample * sample;
    }
    rms[bar] = end > start ? Math.sqrt(sum / (end - start)) : 0;
  }
  const max = Math.max(...rms);
  return rms.map((value) => (max > 0 ? Math.round((value / max) * 1000) / 1000 : 0));
}

/** The `.wav` files named by the listening tasks of every case. */
export function listeningAudioFiles(root) {
  const cases = join(root, 'packages/game-content/cases');
  const files = [];
  for (const entry of readdirSync(cases, { withFileTypes: true })) {
    const tasks = join(cases, entry.name, 'listening-tasks.json');
    if (!entry.isDirectory() || !existsSync(tasks)) continue;
    for (const task of JSON.parse(readFileSync(tasks, 'utf8')).tasks ?? []) {
      if (typeof task.audioAsset === 'string' && task.audioAsset.endsWith('.wav')) {
        files.push(join(root, 'apps/game-web/public', task.audioAsset));
      }
    }
  }
  return files;
}

function main(args) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const files = args.length > 0 ? args.map((file) => resolve(file)) : listeningAudioFiles(root);
  let failed = false;
  for (const file of files) {
    try {
      const bars = computePeaks(readFileSync(file));
      writeFileSync(`${file}.peaks.json`, `${JSON.stringify({ version: 1, bars })}\n`);
      console.log(`peaks: ${file}.peaks.json`);
    } catch (error) {
      failed = true;
      console.error(`peaks: ${file}: ${error.message}`);
    }
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)));
}
