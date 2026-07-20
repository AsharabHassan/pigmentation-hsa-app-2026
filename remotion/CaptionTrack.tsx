import type {Caption} from '@remotion/captions';
import {useCallback, useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from 'remotion';

const CaptionCard = ({caption}: {caption: Caption}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = Math.max(1, ((caption.endMs - caption.startMs) / 1000) * fps);

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
          borderRadius: 18,
          background: 'rgba(4, 6, 8, 0.68)',
          boxShadow: '0 18px 70px rgba(0,0,0,0.35)',
          color: '#F7F2E8',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 46,
          fontWeight: 650,
          letterSpacing: -0.4,
          lineHeight: 1.16,
          padding: '18px 26px 20px',
          textAlign: 'center',
          opacity: interpolate(frame, [0, 7, duration - 7, duration], [0, 1, 1, 0], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: interpolate(frame, [0, 8], ['0 18px', '0 0px'], {
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
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender('Loading HSA captions'));
  const {fps} = useVideoConfig();

  const loadCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile('assets/hsa-cinematic/captions.json'));
      if (!response.ok) {
        throw new Error(`Unable to load captions: ${response.status}`);
      }
      setCaptions((await response.json()) as Caption[]);
      continueRender(handle);
    } catch (error) {
      cancelRender(error);
    }
  }, [cancelRender, continueRender, handle]);

  useEffect(() => {
    loadCaptions();
  }, [loadCaptions]);

  if (!captions) {
    return null;
  }

  return (
    <AbsoluteFill>
      {captions.map((caption) => {
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
