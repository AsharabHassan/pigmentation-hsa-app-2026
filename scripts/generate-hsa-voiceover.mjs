import fs from 'node:fs/promises';
import path from 'node:path';

const API_ROOT = 'https://api.elevenlabs.io';
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_192';

const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID?.trim();

if (!apiKey) {
  throw new Error('Set ELEVENLABS_API_KEY before generating the final voiceover.');
}

const scriptSegments = [
  {
    spokenText:
      "Pigmentation isn't one mark. It's a pattern — and it can appear differently across the face.",
    captionText:
      "Pigmentation isn't one mark. It's a pattern — and it can appear differently across the face.",
    separatorAfter: ' ',
  },
  {
    spokenText:
      'Upload a clear selfie to H S A. Receive a personalised pigmentation report with an on-face map.',
    captionText:
      'Upload a clear selfie to HSA. Receive a personalised pigmentation report with an on-face map.',
    separatorAfter: ' ',
  },
  {
    spokenText:
      "Then book a free online consultation. Our doctor-led team reviews your report and creates a bespoke plan using H S A's three-step protocol.",
    captionText:
      "Then book a free online consultation. Our doctor-led team reviews your report and creates a bespoke plan using HSA's three-step protocol.",
    separatorAfter: ' ',
  },
  {
    spokenText: 'Virtue R F Pulsed Mode targets visible pigment.',
    captionText: 'VirtueRF Pulsed Mode targets visible pigment.',
    separatorAfter: ' ',
  },
  {
    spokenText: 'Exosome Therapy supports recovery and renewal.',
    captionText: 'Exosome Therapy supports recovery and renewal.',
    separatorAfter: ' ',
  },
  {
    spokenText:
      "And Mesotherapy delivers tailored brightening ingredients where they're needed.",
    captionText:
      "And Mesotherapy delivers tailored brightening ingredients where they're needed.",
    separatorAfter: ' ',
  },
  {
    spokenText:
      'Together, the protocol is designed to help fade visible dark spots and support a brighter, more even-looking tone.',
    captionText:
      'Together, the protocol is designed to help fade visible dark spots and support a brighter, more even-looking tone.',
    separatorAfter: ' ',
  },
  {
    spokenText:
      'H S A. Upload your selfie. Get your report. Book your free consultation.',
    captionText:
      'HSA. Upload your selfie. Get your report. Book your free consultation.',
    separatorAfter: '',
  },
];

const text = scriptSegments
  .map(({spokenText, separatorAfter}) => `${spokenText}${separatorAfter}`)
  .join('');

const requestJson = async (url, options, purpose) => {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    throw new Error(`${purpose} failed with HTTP ${response.status}.`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${purpose} returned an invalid JSON response.`);
  }
};

const normalise = (value) => String(value ?? '').trim().toLowerCase();

const scoreVoice = (voice) => {
  const labels = voice.labels ?? {};
  const name = normalise(voice.name);
  const gender = normalise(labels.gender);
  const accent = normalise(labels.accent);
  const useCase = normalise(labels.use_case);
  const description = normalise(
    [voice.description, labels.description, labels.age].filter(Boolean).join(' '),
  );
  const verifiedLanguages = Array.isArray(voice.verified_languages)
    ? voice.verified_languages
    : [];
  const modelIds = Array.isArray(voice.high_quality_base_model_ids)
    ? voice.high_quality_base_model_ids
    : [];

  let score = 0;

  if (name === 'lily') score += 1_000;
  else if (name.includes('lily')) score += 500;

  if (gender === 'female') score += 180;
  else if (gender === 'male') score -= 500;

  if (/british|english|england|uk|united kingdom/.test(accent)) score += 240;
  if (/american|australian|canadian/.test(accent)) score -= 80;

  if (
    verifiedLanguages.some((language) => {
      const locale = normalise(language.locale);
      const verifiedAccent = normalise(language.accent);
      return locale === 'en-gb' || /british|english|england|uk/.test(verifiedAccent);
    })
  ) {
    score += 260;
  }

  if (/narration|social media|advertisement|commercial/.test(useCase)) score += 90;
  if (/warm|calm|confident|professional|authoritative|clear|smooth/.test(description)) {
    score += 45;
  }
  if (modelIds.includes(MODEL_ID)) score += 60;
  if (voice.category === 'professional') score += 30;
  else if (voice.category === 'premade') score += 20;

  return score;
};

const listAvailableVoices = async () => {
  const voices = [];
  let nextPageToken;

  do {
    const url = new URL(`${API_ROOT}/v2/voices`);
    url.searchParams.set('page_size', '100');
    url.searchParams.set('include_total_count', 'false');
    if (nextPageToken) url.searchParams.set('next_page_token', nextPageToken);

    const payload = await requestJson(
      url,
      {headers: {'xi-api-key': apiKey}},
      'Listing ElevenLabs voices',
    );

    if (!Array.isArray(payload.voices)) {
      throw new Error('Listing ElevenLabs voices returned an invalid payload.');
    }

    voices.push(...payload.voices);
    nextPageToken = payload.has_more ? payload.next_page_token : undefined;
  } while (nextPageToken);

  return voices;
};

const selectVoice = async () => {
  if (configuredVoiceId) {
    console.log('Using the configured ElevenLabs voice.');
    return configuredVoiceId;
  }

  const voices = await listAvailableVoices();
  const selectedVoice = [...voices].sort((left, right) => {
    const scoreDifference = scoreVoice(right) - scoreVoice(left);
    if (scoreDifference !== 0) return scoreDifference;
    return String(left.name ?? '').localeCompare(String(right.name ?? ''));
  })[0];

  if (!selectedVoice?.voice_id || scoreVoice(selectedVoice) < 180) {
    throw new Error(
      'No suitable Lily-style British female voice is available. Set ELEVENLABS_VOICE_ID explicitly.',
    );
  }

  console.log(`Selected ElevenLabs voice: ${selectedVoice.name ?? 'British female voice'}`);
  return selectedVoice.voice_id;
};

const canonicaliseWithMap = (characters) => {
  let canonical = '';
  const sourceIndexes = [];

  characters.forEach((character, sourceIndex) => {
    for (const candidate of String(character).normalize('NFKD').toLowerCase()) {
      if (/^[\p{L}\p{N}]$/u.test(candidate)) {
        canonical += candidate;
        sourceIndexes.push(sourceIndex);
      }
    }
  });

  return {canonical, sourceIndexes};
};

const canonicaliseText = (value) =>
  [...String(value).normalize('NFKD').toLowerCase()]
    .filter((character) => /^[\p{L}\p{N}]$/u.test(character))
    .join('');

const createCaptions = (alignment) => {
  const characters = alignment?.characters;
  const starts = alignment?.character_start_times_seconds;
  const ends = alignment?.character_end_times_seconds;

  if (
    !Array.isArray(characters) ||
    !Array.isArray(starts) ||
    !Array.isArray(ends) ||
    characters.length === 0 ||
    characters.length !== starts.length ||
    characters.length !== ends.length
  ) {
    throw new Error('ElevenLabs returned invalid character alignment data.');
  }

  const {canonical, sourceIndexes} = canonicaliseWithMap(characters);
  let cursor = 0;
  const timedCaptions = [];

  for (const segment of scriptSegments) {
    const target = canonicaliseText(segment.spokenText);
    const matchIndex = canonical.indexOf(target, cursor);

    if (matchIndex === -1) {
      throw new Error(`Unable to align caption text beginning with "${segment.spokenText.slice(0, 32)}".`);
    }

    const sourceStart = sourceIndexes[matchIndex];
    const sourceEnd = sourceIndexes[matchIndex + target.length - 1];
    const startSeconds = Number(starts[sourceStart]);
    const endSeconds = Number(ends[sourceEnd]);

    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
      throw new Error('ElevenLabs returned non-numeric character timestamps.');
    }

    if (segment.captionText) {
      timedCaptions.push({
        text: segment.captionText,
        rawStartMs: Math.round(startSeconds * 1_000),
        rawEndMs: Math.round(endSeconds * 1_000),
      });
    }

    cursor = matchIndex + target.length;
  }

  return timedCaptions.map((caption, index) => {
    const nextCaption = timedCaptions[index + 1];
    const startMs = Math.max(0, caption.rawStartMs - 180);
    const naturalEndMs = caption.rawEndMs + 180;
    const endMs = nextCaption
      ? Math.min(naturalEndMs, Math.max(startMs + 300, nextCaption.rawStartMs - 50))
      : naturalEndMs;

    return {
      text: caption.text,
      startMs,
      endMs,
      timestampMs: null,
      confidence: null,
    };
  });
};

const looksLikeMp3 = (buffer) =>
  buffer.length > 4_096 &&
  (buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0));

const writeAtomically = async (targetPath, contents) => {
  const temporaryPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await fs.writeFile(temporaryPath, contents);
    await fs.rename(temporaryPath, targetPath);
  } catch (error) {
    await fs.rm(temporaryPath, {force: true});
    throw error;
  }
};

const voiceId = await selectVoice();
const speechPayload = await requestJson(
  `${API_ROOT}/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${OUTPUT_FORMAT}`,
  {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      language_code: 'en',
      voice_settings: {
        stability: 0.54,
        similarity_boost: 0.82,
        style: 0.2,
        use_speaker_boost: true,
        speed: 1.2,
      },
      apply_text_normalization: 'auto',
    }),
  },
  'Generating ElevenLabs voiceover',
);

if (typeof speechPayload.audio_base64 !== 'string') {
  throw new Error('ElevenLabs returned no audio data.');
}

const audio = Buffer.from(speechPayload.audio_base64, 'base64');
if (!looksLikeMp3(audio)) {
  throw new Error('ElevenLabs returned invalid MP3 audio.');
}

const captions = createCaptions(speechPayload.alignment ?? speechPayload.normalized_alignment);
const audioPath = path.resolve('public/assets/hsa-cinematic/audio/voiceover.mp3');
const captionsPath = path.resolve('public/assets/hsa-cinematic/captions.json');

await fs.mkdir(path.dirname(audioPath), {recursive: true});
await fs.mkdir(path.dirname(captionsPath), {recursive: true});
await writeAtomically(audioPath, audio);
await writeAtomically(captionsPath, `${JSON.stringify(captions, null, 2)}\n`);

console.log(
  `Generated public/assets/hsa-cinematic/audio/voiceover.mp3 and ${captions.length} synced captions.`,
);
