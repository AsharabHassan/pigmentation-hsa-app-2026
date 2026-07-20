import fs from 'node:fs/promises';
import path from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;

if (!apiKey || !voiceId) {
  throw new Error(
    'Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env.local before generating the final voiceover.',
  );
}

const text = `The mirror can show a mark. It cannot show the whole pattern.

That is why H S A created the sixty-second Skin-Tone Map.

One clear photo becomes a personalised, six-zone view of visible skin-tone variation.

Not a diagnosis. A clearer starting point for a conversation with an H S A practitioner.

After clinical assessment, the team can discuss a plan shaped around the individual.

Better decisions begin with seeing the whole picture.

Create your free Skin-Tone Map.

H S A. See first. Choose better.`;

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_192`,
  {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.62,
        similarity_boost: 0.78,
        style: 0.12,
        use_speaker_boost: true,
      },
    }),
  },
);

if (!response.ok) {
  const detail = await response.text();
  throw new Error(`ElevenLabs returned ${response.status}: ${detail.slice(0, 400)}`);
}

const outputDir = path.resolve('public/assets/hsa-cinematic/audio');
await fs.mkdir(outputDir, {recursive: true});
await fs.writeFile(path.join(outputDir, 'voiceover.mp3'), Buffer.from(await response.arrayBuffer()));

console.log('Generated public/assets/hsa-cinematic/audio/voiceover.mp3');
