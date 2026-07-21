import type {Caption} from '@remotion/captions';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import captionData from '../public/assets/hsa-cinematic/captions.json';

const MAX_WORDS_PER_CARD = 8;

const paginateCaption = (caption: Caption): Caption[] => {
  const words = caption.text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= MAX_WORDS_PER_CARD) return [caption];

  const pages: string[][] = [];
  let page: string[] = [];

  words.forEach((word, index) => {
    page.push(word);
    const isNaturalBreak = /[.!?;:]$/.test(word);
    const wordsRemaining = words.length - index - 1;
    const shouldBreak =
      page.length >= MAX_WORDS_PER_CARD ||
      (page.length >= 4 && isNaturalBreak && wordsRemaining >= 3);

    if (shouldBreak) {
      pages.push(page);
      page = [];
    }
  });

  if (page.length > 0) pages.push(page);

  if (pages.length > 1 && pages.at(-1)!.length < 3) {
    const trailing = pages.pop()!;
    const previous = pages.at(-1)!;
    while (previous.length > 5 && trailing.length < 4) {
      trailing.unshift(previous.pop()!);
    }
    pages.push(trailing);
  }

  const weights = pages.map((wordsOnPage) =>
    wordsOnPage.reduce((sum, word) => sum + word.length + 1, 0),
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const durationMs = caption.endMs - caption.startMs;
  let elapsedWeight = 0;

  return pages.map((wordsOnPage, index) => {
    const startMs = Math.round(
      caption.startMs + (elapsedWeight / totalWeight) * durationMs,
    );
    elapsedWeight += weights[index];
    const endMs =
      index === pages.length - 1
        ? caption.endMs
        : Math.round(
            caption.startMs + (elapsedWeight / totalWeight) * durationMs,
          );

    return {
      ...caption,
      text: wordsOnPage.join(' '),
      startMs,
      endMs,
    };
  });
};

const paginatedCaptions = (captionData as Caption[]).flatMap(paginateCaption);

const CaptionCard = ({caption}: {caption: Caption}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = Math.max(1, ((caption.endMs - caption.startMs) / 1000) * fps);
  const fadeFrames = Math.min(5, Math.max(2, Math.floor(duration / 4)));

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '0 90px 235px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          border: '1px solid rgba(243, 223, 154, 0.18)',
          borderRadius: 20,
          background: 'rgba(4, 6, 8, 0.74)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 18px 70px rgba(0,0,0,0.35)',
          color: '#F7F2E8',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: caption.text.length > 54 ? 43 : 48,
          fontWeight: 650,
          letterSpacing: -0.4,
          lineHeight: 1.16,
          padding: '18px 26px 20px',
          textAlign: 'center',
          opacity: interpolate(
            frame,
            [0, fadeFrames, duration - fadeFrames, duration],
            [0, 1, 1, 0],
            {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            },
          ),
          translate: interpolate(frame, [0, 7], ['0px 14px', '0px 0px'], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {caption.text.trim()}
      </div>
    </AbsoluteFill>
  );
};

export const CaptionTrack = () => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill>
      {paginatedCaptions.map((caption) => {
        const from = Math.round((caption.startMs / 1000) * fps);
        const durationInFrames = Math.max(
          1,
          Math.round(((caption.endMs - caption.startMs) / 1000) * fps),
        );

        return (
          <Sequence key={`${caption.startMs}-${caption.text}`} from={from} durationInFrames={durationInFrames}>
            <CaptionCard caption={caption} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
