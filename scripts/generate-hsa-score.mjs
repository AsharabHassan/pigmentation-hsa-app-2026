import fs from 'node:fs/promises';
import path from 'node:path';

const sampleRate = 48000;
const durationSeconds = 40.4;
const sampleCount = Math.ceil(sampleRate * durationSeconds);
const left = new Float64Array(sampleCount);
const right = new Float64Array(sampleCount);
const tau = Math.PI * 2;

let seed = 0x485341;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
};

const masterEnvelope = (t) => {
  const fadeIn = Math.min(1, t / 1.8);
  const fadeOut = Math.min(1, Math.max(0, (durationSeconds - t) / 0.7));
  return fadeIn * fadeOut;
};

let filteredNoise = 0;
for (let i = 0; i < sampleCount; i += 1) {
  const t = i / sampleRate;
  filteredNoise = filteredNoise * 0.992 + (random() * 2 - 1) * 0.008;
  const air = filteredNoise * 0.045;
  const drone =
    Math.sin(tau * 73.42 * t) * 0.036 +
    Math.sin(tau * 110 * t + 0.4) * 0.018 +
    Math.sin(tau * 146.83 * t + 1.2) * 0.012;
  const beatPhase = ((t - 6.66) % 0.833 + 0.833) % 0.833;
  const pulse = t > 6.66 && t < 33.3 ? Math.sin(tau * 55 * t) * Math.exp(-beatPhase * 7) * 0.022 : 0;
  const energy = t < 6.66 ? 0.45 : t < 23.3 ? 0.72 : t < 33.3 ? 1 : t < 36.6 ? 0.45 : 0.75;
  left[i] += (air + drone * energy + pulse) * masterEnvelope(t);
  right[i] += (air * 0.94 + drone * energy - pulse * 0.55) * masterEnvelope(t);
}

const addTone = ({time, duration, frequency, amplitude, pan = 0, decay = 3.5}) => {
  const start = Math.max(0, Math.floor(time * sampleRate));
  const end = Math.min(sampleCount, Math.ceil((time + duration) * sampleRate));
  const leftGain = Math.sqrt((1 - pan) / 2);
  const rightGain = Math.sqrt((1 + pan) / 2);
  for (let i = start; i < end; i += 1) {
    const local = i / sampleRate - time;
    const attack = Math.min(1, local / 0.018);
    const envelope = attack * Math.exp(-local * decay);
    const tone =
      Math.sin(tau * frequency * local) * 0.72 +
      Math.sin(tau * frequency * 2 * local + 0.18) * 0.2 +
      Math.sin(tau * frequency * 3 * local + 0.44) * 0.08;
    left[i] += tone * amplitude * envelope * leftGain;
    right[i] += tone * amplitude * envelope * rightGain;
  }
};

const addNoiseSweep = ({time, duration, amplitude, rising = true}) => {
  const start = Math.max(0, Math.floor(time * sampleRate));
  const end = Math.min(sampleCount, Math.ceil((time + duration) * sampleRate));
  let smooth = 0;
  for (let i = start; i < end; i += 1) {
    const p = (i - start) / Math.max(1, end - start);
    smooth = smooth * 0.86 + (random() * 2 - 1) * 0.14;
    const curve = rising ? p * p : (1 - p) * (1 - p);
    const value = smooth * curve * amplitude;
    left[i] += value * 0.88;
    right[i] += value;
  }
};

const barNotes = [146.83, 174.61, 220, 196, 146.83, 220, 293.66, 261.63, 220, 174.61];
barNotes.forEach((frequency, index) => {
  addTone({
    time: index * 3.333 + 0.12,
    duration: 2.6,
    frequency,
    amplitude: index < 2 ? 0.075 : 0.09,
    pan: index % 2 === 0 ? -0.18 : 0.18,
    decay: 1.8,
  });
});

[0, 1, 2, 3, 4, 5].forEach((index) => {
  addTone({
    time: 13.38 + index * 0.5,
    duration: 1.2,
    frequency: [587.33, 659.25, 783.99, 659.25, 880, 783.99][index],
    amplitude: 0.055,
    pan: -0.45 + index * 0.18,
    decay: 5.2,
  });
});

addNoiseSweep({time: 2.8, duration: 0.55, amplitude: 0.11, rising: true});
addNoiseSweep({time: 6.2, duration: 0.5, amplitude: 0.12, rising: true});
addNoiseSweep({time: 10.65, duration: 0.32, amplitude: 0.075, rising: false});
addNoiseSweep({time: 16.25, duration: 0.45, amplitude: 0.1, rising: true});
addNoiseSweep({time: 23.0, duration: 0.45, amplitude: 0.09, rising: true});
addNoiseSweep({time: 29.55, duration: 0.45, amplitude: 0.11, rising: true});
addNoiseSweep({time: 36.25, duration: 0.45, amplitude: 0.12, rising: true});

addTone({time: 36.75, duration: 2.8, frequency: 293.66, amplitude: 0.12, pan: -0.25, decay: 1.5});
addTone({time: 37.55, duration: 2.2, frequency: 440, amplitude: 0.11, pan: 0, decay: 1.7});
addTone({time: 38.35, duration: 1.9, frequency: 659.25, amplitude: 0.1, pan: 0.25, decay: 1.9});

let peak = 0;
for (let i = 0; i < sampleCount; i += 1) {
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const gain = peak > 0 ? 0.84 / peak : 1;

const wav = Buffer.alloc(44 + sampleCount * 4);
wav.write('RIFF', 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVE', 8);
wav.write('fmt ', 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(sampleCount * 4, 40);

for (let i = 0; i < sampleCount; i += 1) {
  const l = Math.max(-1, Math.min(1, left[i] * gain));
  const r = Math.max(-1, Math.min(1, right[i] * gain));
  wav.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}

const outputDir = path.resolve('public/assets/hsa-cinematic/audio');
await fs.mkdir(outputDir, {recursive: true});
await fs.writeFile(path.join(outputDir, 'hsa-original-score.wav'), wav);

console.log('Generated original 40-second HSA score.');
