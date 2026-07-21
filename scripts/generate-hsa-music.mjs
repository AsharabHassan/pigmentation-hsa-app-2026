import fs from 'node:fs/promises';
import path from 'node:path';

const API_ROOT = 'https://api.elevenlabs.io';
const OUTPUT_FORMAT = 'mp3_48000_320';
const MODEL_ID = 'music_v2';
const DEFAULT_LENGTH_MS = 38_000;

const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
if (!apiKey) {
  throw new Error('Set ELEVENLABS_API_KEY before generating the cinematic score.');
}

const requestedLength = Number(process.env.HSA_MUSIC_LENGTH_MS ?? DEFAULT_LENGTH_MS);
if (!Number.isInteger(requestedLength) || requestedLength < 3_000 || requestedLength > 600_000) {
  throw new Error('HSA_MUSIC_LENGTH_MS must be an integer between 3000 and 600000.');
}

const prompt = `Create an original ${Math.round(requestedLength / 1000)}-second instrumental score for a premium doctor-led pigmentation clinic campaign. Elegant cinematic healthcare technology, never trailer bombast. Begin with an intimate four-second hook using soft felt piano, a subtle low pulse and delicate glass-like texture. From four to eighteen seconds, introduce a precise modern electronic rhythm and restrained arpeggio for selfie upload, facial scan and report reveal. From eighteen to twenty-two seconds, warm the harmony as an expert consultation begins. From twenty-two seconds to the ending, build through three clear but seamless lifts representing target, recover and brighten, using refined low strings, organic percussion and tasteful tonal impacts. Resolve into a confident, elegant HSA logo sting with a clean final note. Approximately 92 BPM. Sophisticated, reassuring, intelligent and cinematic. Keep the vocal frequency range uncluttered for narration. No vocals, no choir, no lyrics, no horror tension, no aggressive drums, no EDM drop and no long reverb tail.`;

const response = await fetch(`${API_ROOT}/v1/music?output_format=${OUTPUT_FORMAT}`, {
  method: 'POST',
  headers: {
    Accept: 'audio/mpeg',
    'Content-Type': 'application/json',
    'xi-api-key': apiKey,
  },
  body: JSON.stringify({
    prompt,
    music_length_ms: requestedLength,
    model_id: MODEL_ID,
    force_instrumental: true,
    sign_with_c2pa: true,
  }),
  signal: AbortSignal.timeout(360_000),
});

if (!response.ok) {
  const body = await response.text();
  const detail = body.slice(0, 500).replaceAll(apiKey, '[redacted]');
  throw new Error(`Generating ElevenLabs music failed with HTTP ${response.status}: ${detail}`);
}

const audio = Buffer.from(await response.arrayBuffer());
const looksLikeMp3 =
  audio.length > 16_384 &&
  (audio.subarray(0, 3).toString('ascii') === 'ID3' ||
    (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0));

if (!looksLikeMp3) {
  throw new Error('ElevenLabs returned invalid MP3 music data.');
}

const outputPath = path.resolve(
  'public/assets/hsa-cinematic/audio/hsa-elevenlabs-cinematic-v2.mp3',
);
const temporaryPath = `${outputPath}.${process.pid}.${Date.now()}.tmp`;

await fs.mkdir(path.dirname(outputPath), {recursive: true});
try {
  await fs.writeFile(temporaryPath, audio);
  await fs.rename(temporaryPath, outputPath);
} catch (error) {
  await fs.rm(temporaryPath, {force: true});
  throw error;
}

console.log(
  `Generated ${path.relative(process.cwd(), outputPath)} (${requestedLength} ms, ElevenLabs ${MODEL_ID}).`,
);
