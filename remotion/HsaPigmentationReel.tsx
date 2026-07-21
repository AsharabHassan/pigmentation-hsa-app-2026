import type {Caption} from '@remotion/captions';
import {Audio, Video} from '@remotion/media';
import type {ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import captionData from '../public/assets/hsa-cinematic/captions.json';
import {CaptionTrack} from './CaptionTrack';

export type HsaPigmentationReelProps = {
  voiceoverSrc: string;
  scoreSrc: string;
};

const GOLD = '#D4AF37';
const PALE_GOLD = '#F2DEA0';
const INK = '#030506';
const COPY = '#FFF9ED';
const JOURNEY_SRC = 'assets/hsa-cinematic/app-capture/hsa-full-journey-v2.mp4';
const REEL_1 = 'assets/hsa-cinematic/source/hsa-reel-1-DIolH88CMgE.mp4';
const REEL_2 = 'assets/hsa-cinematic/source/hsa-reel-2-C-SycfHt65s.mp4';
const REEL_3 = 'assets/hsa-cinematic/source/hsa-reel-3-C7mSuo9tQpD.mp4';
const REEL_4 = 'assets/hsa-cinematic/source/hsa-reel-4-C4_G-EatMd-.mp4';
const VIRTUERF_SOURCE =
  'assets/hsa-cinematic/source/hsa-youtube-virtuerf-5axZO1h4ciY.mp4';

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const editorialEase = Easing.bezier(0.45, 0, 0.55, 1);
const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const HsaMark = ({compact = false}: {compact?: boolean}) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? 8 : 14,
    }}
  >
    <div
      style={{
        color: GOLD,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: compact ? 48 : 96,
        letterSpacing: compact ? 14 : 26,
        lineHeight: 0.9,
        marginLeft: compact ? 14 : 26,
      }}
    >
      HSA
    </div>
    <div
      style={{
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        height: 1,
        width: compact ? 180 : 320,
      }}
    />
    <div
      style={{
        color: '#F4EAD4',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: compact ? 16 : 23,
        fontWeight: 650,
        letterSpacing: compact ? 4.6 : 8,
      }}
    >
      HARLEY STREET AESTHETICS
    </div>
  </div>
);

const CinematicGrade = ({strong = false}: {strong?: boolean}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill
      style={{
        background: strong
          ? 'linear-gradient(180deg, rgba(2,3,4,0.70) 0%, rgba(2,3,4,0.08) 31%, rgba(2,3,4,0.16) 59%, rgba(2,3,4,0.86) 100%)'
          : 'linear-gradient(180deg, rgba(2,3,4,0.50) 0%, transparent 28%, rgba(2,3,4,0.10) 62%, rgba(2,3,4,0.72) 100%)',
      }}
    />
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 50% 43%, transparent 36%, rgba(1,2,3,0.18) 72%, rgba(1,2,3,0.48) 116%)',
      }}
    />
  </AbsoluteFill>
);

const FilmTexture = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        mixBlendMode: 'soft-light',
        opacity: 0.105,
        pointerEvents: 'none',
      }}
    >
      <svg height="100%" preserveAspectRatio="none" width="100%">
        <filter id="hsa-film-grain">
          <feTurbulence
            baseFrequency="0.78"
            numOctaves={2}
            seed={(frame % 5) + 1}
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect fill="#808080" filter="url(#hsa-film-grain)" height="100%" width="100%" />
      </svg>
    </AbsoluteFill>
  );
};

type ClinicalVisualProps = {
  src: string;
  trimBeforeSeconds: number;
  durationInFrames: number;
  scaleFrom?: number;
  scaleTo?: number;
  objectPosition?: string;
  translateFrom?: string;
  translateTo?: string;
  brightness?: number;
};

const ClinicalVisual = ({
  src,
  trimBeforeSeconds,
  durationInFrames,
  scaleFrom = 1.34,
  scaleTo = 1.39,
  objectPosition = '50% 50%',
  translateFrom = '0px 0px',
  translateTo = '0px -12px',
  brightness = 0.96,
}: ClinicalVisualProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <Video
      src={staticFile(src)}
      objectFit="cover"
      trimBefore={Math.round(trimBeforeSeconds * fps)}
      muted
      style={{
        filter: `saturate(0.96) contrast(1.08) brightness(${brightness})`,
        height: '100%',
        objectPosition,
        scale: interpolate(
          frame,
          [0, Math.max(1, durationInFrames - 1)],
          [scaleFrom, scaleTo],
          {easing: editorialEase, ...clamp},
        ),
        translate: interpolate(
          frame,
          [0, Math.max(1, durationInFrames - 1)],
          [translateFrom, translateTo],
          {easing: editorialEase, ...clamp},
        ),
        width: '100%',
      }}
    />
  );
};

const SceneHeader = ({
  eyebrow,
  children,
  align = 'left',
}: {
  eyebrow: string;
  children: ReactNode;
  align?: 'left' | 'center';
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        alignItems: align === 'center' ? 'center' : 'flex-start',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        left: 80,
        opacity: interpolate(frame, [3, 17], [0, 1], {easing: easeOut, ...clamp}),
        position: 'absolute',
        right: 80,
        textAlign: align,
        top: 104,
        translate: interpolate(frame, [3, 19], ['0px 20px', '0px 0px'], {
          easing: easeOut,
          ...clamp,
        }),
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 14,
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          width: '100%',
        }}
      >
        <div style={{background: GOLD, height: 1, width: 60}} />
        <div
          style={{
            color: PALE_GOLD,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 28,
            fontWeight: 780,
            letterSpacing: 5.4,
            lineHeight: 1.1,
          }}
        >
          {eyebrow}
        </div>
      </div>
      {children}
    </div>
  );
};

const PatternMarkers = ({fadeAt}: {fadeAt: number}) => {
  const frame = useCurrentFrame();
  const points = [
    {left: 72, top: 20, size: 24},
    {left: 76, top: 24, size: 18},
    {left: 68, top: 27, size: 28},
    {left: 74, top: 31, size: 16},
    {left: 66, top: 34, size: 20},
  ];
  const fade = interpolate(frame, [fadeAt - 7, fadeAt], [1, 0], clamp);

  return (
    <AbsoluteFill style={{opacity: fade, pointerEvents: 'none'}}>
      <svg height="100%" viewBox="0 0 1080 1920" width="100%">
        <path
          d="M745 390 C790 440 725 520 755 655"
          fill="none"
          opacity="0.52"
          stroke={GOLD}
          strokeDasharray="7 13"
          strokeWidth="2"
        />
      </svg>
      {points.map((point, index) => {
        const enter = interpolate(frame, [8 + index * 4, 18 + index * 4], [0, 1], {
          easing: easeOut,
          ...clamp,
        });
        return (
          <div
            key={`${point.left}-${point.top}`}
            style={{
              border: `2px solid ${GOLD}`,
              borderRadius: 999,
              boxShadow: '0 0 22px rgba(212,175,55,0.44)',
              height: point.size,
              left: `${point.left}%`,
              opacity: enter,
              position: 'absolute',
              scale: interpolate(enter, [0, 1], [1.8, 1]),
              top: `${point.top}%`,
              width: point.size,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const HookScene = ({durationInFrames}: {durationInFrames: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const split = Math.min(durationInFrames - 1, Math.round(2.35 * fps));

  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <Sequence durationInFrames={split} premountFor={Math.round(0.4 * fps)}>
        <ClinicalVisual
          src={REEL_4}
          trimBeforeSeconds={18.35}
          durationInFrames={split}
          scaleFrom={1.34}
          scaleTo={1.4}
          objectPosition="55% 47%"
          translateFrom="0px -14px"
          translateTo="-14px -28px"
        />
      </Sequence>
      <Sequence
        from={split}
        durationInFrames={Math.max(1, durationInFrames - split)}
        premountFor={Math.round(0.4 * fps)}
      >
        <ClinicalVisual
          src={REEL_4}
          trimBeforeSeconds={10.55}
          durationInFrames={Math.max(1, durationInFrames - split)}
          scaleFrom={1.62}
          scaleTo={1.72}
          objectPosition="57% 43%"
          translateFrom="-74px 150px"
          translateTo="-96px 170px"
        />
      </Sequence>
      <CinematicGrade strong />
      <PatternMarkers fadeAt={split} />
      <SceneHeader eyebrow="DARK SPOTS · UNEVEN TONE">
        <div
          style={{
            color: COPY,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 86,
            letterSpacing: -2,
            lineHeight: 0.99,
            maxWidth: 900,
            textShadow: '0 8px 34px rgba(0,0,0,0.72)',
          }}
        >
          Pigmentation isn&apos;t one mark.
          <br />
          <span style={{color: PALE_GOLD, fontStyle: 'italic'}}>It&apos;s a pattern.</span>
        </div>
      </SceneHeader>
      <div
        style={{
          background: `linear-gradient(90deg, ${GOLD}, transparent)`,
          bottom: 430,
          height: 1,
          left: 80,
          opacity: interpolate(frame, [22, 50], [0, 0.8], {easing: easeOut, ...clamp}),
          position: 'absolute',
          width: interpolate(frame, [22, 50], [0, 520], {easing: easeOut, ...clamp}),
        }}
      />
    </AbsoluteFill>
  );
};

const JourneyBadge = ({children}: {children: ReactNode}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(3,5,6,0.82)',
        border: '1px solid rgba(212,175,55,0.62)',
        borderRadius: 999,
        color: COPY,
        display: 'flex',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 29,
        fontWeight: 800,
        gap: 13,
        left: 80,
        letterSpacing: 3.6,
        opacity: interpolate(frame, [4, 15], [0, 1], {easing: easeOut, ...clamp}),
        padding: '15px 22px 16px',
        position: 'absolute',
        top: 96,
        translate: interpolate(frame, [4, 17], ['0px 16px', '0px 0px'], {
          easing: easeOut,
          ...clamp,
        }),
      }}
    >
      <span style={{background: GOLD, borderRadius: 999, height: 9, width: 9}} />
      {children}
    </div>
  );
};

const JourneyVisual = ({
  trimBeforeSeconds,
  durationInFrames,
  label,
  playbackRate = 1,
  privacyCover = false,
  reportCopyCover = false,
}: {
  trimBeforeSeconds: number;
  durationInFrames: number;
  label: string;
  playbackRate?: number;
  privacyCover?: boolean;
  reportCopyCover?: boolean;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <Video
        src={staticFile(JOURNEY_SRC)}
        objectFit="cover"
        trimBefore={Math.round(trimBeforeSeconds * fps)}
        muted
        playbackRate={playbackRate}
        style={{
          filter: 'saturate(0.97) contrast(1.04) brightness(0.98)',
          height: '100%',
          objectPosition: privacyCover ? '50% 42%' : '50% 50%',
          scale: interpolate(
            frame,
            [0, Math.max(1, durationInFrames - 1)],
            privacyCover ? [1.105, 1.135] : [1.015, 1.045],
            {easing: editorialEase, ...clamp},
          ),
          width: '100%',
        }}
      />
      {privacyCover ? (
        <div
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(3,5,6,0.94) 38%, #030506 72%)',
            bottom: 0,
            height: 370,
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
          }}
        />
      ) : null}
      {reportCopyCover ? (
        <div
          style={{
            background:
              'linear-gradient(180deg, #030506 0%, #030506 86%, transparent 100%)',
            height: 350,
            left: 30,
            pointerEvents: 'none',
            position: 'absolute',
            right: 30,
            top: 144,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(2,3,4,0.36) 0%, transparent 21%, transparent 76%, rgba(2,3,4,0.42) 100%)',
        }}
      />
      <JourneyBadge>{label}</JourneyBadge>
      <div
        style={{
          border: '1px solid rgba(243,223,154,0.32)',
          borderRadius: 42,
          inset: 30,
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
    </AbsoluteFill>
  );
};

const UploadScanReportScene = ({durationInFrames}: {durationInFrames: number}) => {
  const {fps} = useVideoConfig();
  const uploadDuration = Math.min(durationInFrames - 2, Math.round(1.9 * fps));
  const scanDuration = Math.min(
    durationInFrames - uploadDuration - 1,
    Math.round(2.55 * fps),
  );
  const reportFrom = uploadDuration + scanDuration;

  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Sequence durationInFrames={uploadDuration} premountFor={Math.round(0.4 * fps)}>
        <JourneyVisual
          trimBeforeSeconds={4.5}
          durationInFrames={uploadDuration}
          label="STEP 1 · UPLOAD A SELFIE"
        />
      </Sequence>
      <Sequence
        from={uploadDuration}
        durationInFrames={scanDuration}
        premountFor={Math.round(0.4 * fps)}
      >
        <JourneyVisual
          trimBeforeSeconds={8.5}
          durationInFrames={scanDuration}
          label="LIVE PIGMENTATION SCAN"
          playbackRate={1.25}
          privacyCover
        />
      </Sequence>
      <Sequence
        from={reportFrom}
        durationInFrames={Math.max(1, durationInFrames - reportFrom)}
        premountFor={Math.round(0.4 * fps)}
      >
        <JourneyVisual
          trimBeforeSeconds={33}
          durationInFrames={Math.max(1, durationInFrames - reportFrom)}
          label="GET YOUR ON-FACE REPORT"
          reportCopyCover
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const ReportConsultMontage = ({durationInFrames}: {durationInFrames: number}) => {
  const {fps} = useVideoConfig();
  const mapDuration = Math.min(durationInFrames - 2, Math.round(1.18 * fps));
  const protocolDuration = Math.min(
    durationInFrames - mapDuration - 1,
    Math.round(1.05 * fps),
  );
  const bookingFrom = mapDuration + protocolDuration;

  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Sequence durationInFrames={mapDuration} premountFor={Math.round(0.35 * fps)}>
        <JourneyVisual
          trimBeforeSeconds={33}
          durationInFrames={mapDuration}
          label="ON-FACE PIGMENTATION MAP"
          reportCopyCover
        />
      </Sequence>
      <Sequence
        from={mapDuration}
        durationInFrames={protocolDuration}
        premountFor={Math.round(0.35 * fps)}
      >
        <JourneyVisual
          trimBeforeSeconds={38}
          durationInFrames={protocolDuration}
          label="YOUR HSA PROTOCOL OPTIONS"
        />
      </Sequence>
      <Sequence
        from={bookingFrom}
        durationInFrames={Math.max(1, durationInFrames - bookingFrom)}
        premountFor={Math.round(0.35 * fps)}
      >
        <JourneyVisual
          trimBeforeSeconds={40.5}
          durationInFrames={Math.max(1, durationInFrames - bookingFrom)}
          label="BOOK YOUR FREE CONSULTATION"
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const DoctorReviewScene = ({durationInFrames}: {durationInFrames: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const panelMapDuration = Math.round(durationInFrames * 0.37);
  const panelProtocolDuration = Math.round(durationInFrames * 0.30);
  const panelBookingFrom = panelMapDuration + panelProtocolDuration;

  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <ClinicalVisual
        src={REEL_3}
        trimBeforeSeconds={1.15}
        durationInFrames={durationInFrames}
        scaleFrom={1.43}
        scaleTo={1.49}
        objectPosition="28% 45%"
        translateFrom="-86px -8px"
        translateTo="-108px -22px"
        brightness={0.78}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(2,3,4,0.08) 0%, rgba(2,3,4,0.18) 42%, rgba(2,3,4,0.88) 100%)',
        }}
      />
      <CinematicGrade strong />
      <div
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(3,5,6,0.98) 38%, #030506 100%)',
          bottom: 0,
          height: 430,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
        }}
      />
      <SceneHeader eyebrow="STEP 2 · FREE ONLINE CONSULTATION">
        <div
          style={{
            color: COPY,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 62,
            lineHeight: 1.02,
            maxWidth: 780,
            textShadow: '0 6px 30px rgba(0,0,0,0.7)',
          }}
        >
          Doctor-led report review.
        </div>
      </SceneHeader>

      <div
        style={{
          background: '#090C0D',
          border: '1px solid rgba(212,175,55,0.56)',
          borderRadius: 38,
          boxShadow: '0 32px 90px rgba(0,0,0,0.55)',
          height: 720,
          opacity: interpolate(frame, [12, 29], [0, 1], {easing: easeOut, ...clamp}),
          overflow: 'hidden',
          position: 'absolute',
          right: 72,
          top: 520,
          translate: interpolate(frame, [12, 31], ['46px 0px', '0px 0px'], {
            easing: easeOut,
            ...clamp,
          }),
          width: 410,
        }}
      >
        <Sequence durationInFrames={panelMapDuration} premountFor={Math.round(0.3 * fps)}>
          <Video
            src={staticFile(JOURNEY_SRC)}
            objectFit="cover"
            trimBefore={Math.round(33 * fps)}
            muted
            style={{height: '100%', width: '100%'}}
          />
        </Sequence>
        <Sequence
          from={panelMapDuration}
          durationInFrames={panelProtocolDuration}
          premountFor={Math.round(0.3 * fps)}
        >
          <Video
            src={staticFile(JOURNEY_SRC)}
            objectFit="cover"
            trimBefore={Math.round(38 * fps)}
            muted
            style={{height: '100%', width: '100%'}}
          />
        </Sequence>
        <Sequence
          from={panelBookingFrom}
          durationInFrames={Math.max(1, durationInFrames - panelBookingFrom)}
          premountFor={Math.round(0.3 * fps)}
        >
          <Video
            src={staticFile(JOURNEY_SRC)}
            objectFit="cover"
            trimBefore={Math.round(40.5 * fps)}
            muted
            style={{height: '100%', width: '100%'}}
          />
        </Sequence>
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(3,5,6,0.88)',
            bottom: 0,
            color: COPY,
            display: 'flex',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 15,
            fontWeight: 760,
            height: 66,
            justifyContent: 'center',
            letterSpacing: 1.35,
            position: 'absolute',
            whiteSpace: 'nowrap',
            width: '100%',
          }}
        >
          REPORT OPEN · REVIEW IN PROGRESS
        </div>
      </div>

      <div
        style={{
          alignItems: 'center',
          background: 'rgba(3,5,6,0.78)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 999,
          bottom: 430,
          color: PALE_GOLD,
          display: 'flex',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 24,
          fontWeight: 770,
          gap: 11,
          left: 80,
          letterSpacing: 2.5,
          opacity: interpolate(frame, [20, 35], [0, 1], {easing: easeOut, ...clamp}),
          padding: '14px 19px',
          position: 'absolute',
        }}
      >
        <span style={{background: '#52D273', borderRadius: 999, height: 10, width: 10}} />
        HSA ONLINE · EXPERT TEAM
      </div>
    </AbsoluteFill>
  );
};

type ProtocolOptionSceneProps = {
  durationInFrames: number;
  step: string;
  title: string;
  subtitle?: string;
  benefit: string;
  first: {src: string; trimBeforeSeconds: number; objectPosition?: string};
  second: {src: string; trimBeforeSeconds: number; objectPosition?: string};
  cropScale?: number;
};

const ProtocolOptionScene = ({
  durationInFrames,
  step,
  title,
  subtitle,
  benefit,
  first,
  second,
  cropScale = 1.34,
}: ProtocolOptionSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const split = Math.max(1, Math.round(durationInFrames * 0.51));

  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <Sequence durationInFrames={split} premountFor={Math.round(0.35 * fps)}>
        <ClinicalVisual
          src={first.src}
          trimBeforeSeconds={first.trimBeforeSeconds}
          durationInFrames={split}
          scaleFrom={cropScale}
          scaleTo={cropScale + 0.045}
          objectPosition={first.objectPosition ?? '50% 50%'}
          translateFrom="0px -20px"
          translateTo="-10px -34px"
        />
      </Sequence>
      <Sequence
        from={split}
        durationInFrames={Math.max(1, durationInFrames - split)}
        premountFor={Math.round(0.35 * fps)}
      >
        <ClinicalVisual
          src={second.src}
          trimBeforeSeconds={second.trimBeforeSeconds}
          durationInFrames={Math.max(1, durationInFrames - split)}
          scaleFrom={cropScale + 0.015}
          scaleTo={cropScale + 0.06}
          objectPosition={second.objectPosition ?? '50% 50%'}
          translateFrom="8px -18px"
          translateTo="-4px -34px"
        />
      </Sequence>
      <CinematicGrade strong />

      <div
        style={{
          left: 80,
          opacity: interpolate(frame, [3, 15], [0, 1], {easing: easeOut, ...clamp}),
          position: 'absolute',
          right: 80,
          top: 102,
          translate: interpolate(frame, [3, 17], ['0px 20px', '0px 0px'], {
            easing: easeOut,
            ...clamp,
          }),
        }}
      >
        <div
          style={{
            color: PALE_GOLD,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 27,
            fontWeight: 790,
            letterSpacing: 5.2,
          }}
        >
          HSA PROTOCOL OPTION · {step}
        </div>
        <div
          style={{
            color: COPY,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: title.length > 14 ? 70 : 82,
            letterSpacing: -1.5,
            lineHeight: 0.96,
            marginTop: 19,
            maxWidth: 900,
            textShadow: '0 8px 36px rgba(0,0,0,0.82)',
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              color: PALE_GOLD,
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 29,
              fontWeight: 820,
              letterSpacing: 6.5,
              marginTop: 12,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          alignItems: 'center',
          background: 'rgba(3,5,6,0.78)',
          border: '1px solid rgba(212,175,55,0.50)',
          borderRadius: 999,
          bottom: 430,
          color: COPY,
          display: 'flex',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 30,
          fontWeight: 820,
          gap: 14,
          left: 80,
          letterSpacing: 3.2,
          opacity: interpolate(frame, [10, 23], [0, 1], {easing: easeOut, ...clamp}),
          padding: '16px 23px 17px',
          position: 'absolute',
        }}
      >
        <span style={{background: GOLD, borderRadius: 999, height: 10, width: 10}} />
        {benefit}
      </div>
    </AbsoluteFill>
  );
};

const ProtocolPanel = ({
  index,
  src,
  trimBeforeSeconds,
  title,
  action,
}: {
  index: number;
  src: string;
  trimBeforeSeconds: number;
  title: string;
  action: string;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enterAt = 6 + index * 9;
  const opacity = interpolate(frame, [enterAt, enterAt + 10], [0, 1], {
    easing: easeOut,
    ...clamp,
  });

  return (
    <div
      style={{
        background: '#090C0D',
        border: '1px solid rgba(212,175,55,0.42)',
        borderRadius: 24,
        boxShadow: '0 22px 60px rgba(0,0,0,0.38)',
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        height: 258,
        opacity,
        overflow: 'hidden',
        translate: interpolate(opacity, [0, 1], ['44px 0px', '0px 0px']),
        width: 900,
      }}
    >
      <div style={{overflow: 'hidden', position: 'relative'}}>
        <Video
          src={staticFile(src)}
          objectFit="cover"
          trimBefore={Math.round(trimBeforeSeconds * fps)}
          muted
          style={{
            filter: 'saturate(0.92) contrast(1.08) brightness(0.86)',
            height: '100%',
            scale: 1.55,
            width: '100%',
          }}
        />
        <AbsoluteFill
          style={{background: 'linear-gradient(90deg, transparent, rgba(3,5,6,0.48))'}}
        />
      </div>
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 34px',
        }}
      >
        <div
          style={{
            color: PALE_GOLD,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4.5,
          }}
        >
          0{index + 1} · {action}
        </div>
        <div
          style={{
            color: COPY,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 46,
            lineHeight: 1,
            marginTop: 12,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
};

const ProtocolSynergyScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at 50% 42%, rgba(139,94,23,0.24), rgba(4,6,7,0.98) 46%, #020303 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          color: PALE_GOLD,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 27,
          fontWeight: 800,
          left: 80,
          letterSpacing: 5.3,
          opacity: interpolate(frame, [3, 15], [0, 1], {easing: easeOut, ...clamp}),
          position: 'absolute',
          top: 105,
        }}
      >
        WHY THE PROTOCOL WORKS
      </div>
      <div
        style={{
          color: COPY,
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: 68,
          left: 80,
          letterSpacing: -1.4,
          lineHeight: 1,
          opacity: interpolate(frame, [6, 20], [0, 1], {easing: easeOut, ...clamp}),
          position: 'absolute',
          right: 80,
          top: 157,
        }}
      >
        Three steps. One bespoke plan.
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          position: 'absolute',
          top: 338,
        }}
      >
        <ProtocolPanel
          index={0}
          src={VIRTUERF_SOURCE}
          trimBeforeSeconds={61.6}
          title="VirtueRF Pulsed Mode"
          action="TARGET"
        />
        <ProtocolPanel
          index={1}
          src={REEL_1}
          trimBeforeSeconds={16.2}
          title="Exosome Therapy"
          action="RECOVER"
        />
        <ProtocolPanel
          index={2}
          src={REEL_2}
          trimBeforeSeconds={0.65}
          title="Mesotherapy"
          action="BRIGHTEN"
        />
      </div>

      <div
        style={{
          color: PALE_GOLD,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 31,
          fontWeight: 820,
          letterSpacing: 5.6,
          opacity: interpolate(frame, [34, 53], [0, 1], {easing: easeOut, ...clamp}),
          position: 'absolute',
          textAlign: 'center',
          top: 1176,
          width: '100%',
        }}
      >
        TARGET · RECOVER · BRIGHTEN
      </div>
    </AbsoluteFill>
  );
};

const CtaScene = ({durationInFrames}: {durationInFrames: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const brandReveal = interpolate(frame, [48, 82], [0, 1], {
    easing: easeOut,
    ...clamp,
  });

  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <Video
        src={staticFile(JOURNEY_SRC)}
        objectFit="cover"
        trimBefore={Math.round(40.5 * fps)}
        muted
        style={{
          filter: 'saturate(0.9) contrast(1.06) brightness(0.66)',
          height: '100%',
          scale: interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1.02, 1.08], {
            easing: editorialEase,
            ...clamp,
          }),
          width: '100%',
        }}
      />
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(3,5,6,0.96) 0%, rgba(3,5,6,0.90) 78%, transparent 100%)',
          height: 840,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          top: 140,
        }}
      />
      <div
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(3,5,6,0.76) 28%, #030506 100%)',
          bottom: 0,
          height: 790,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 34%, rgba(137,92,23,0.30), rgba(4,6,7,0.97) 48%, #020303 100%)',
          opacity: brandReveal,
        }}
      />

      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 34,
          left: 80,
          opacity: brandReveal,
          position: 'absolute',
          right: 80,
          top: 210,
          translate: interpolate(brandReveal, [0, 1], ['0px 30px', '0px 0px']),
        }}
      >
        <HsaMark compact />
        <div
          style={{
            color: COPY,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 70,
            letterSpacing: -1.3,
            lineHeight: 1.02,
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          Upload your selfie.
          <br />
          Get your report.
          <br />
          <span style={{color: PALE_GOLD}}>Book your free consultation.</span>
        </div>
        <div
          style={{
            border: `1px solid ${GOLD}`,
            borderRadius: 999,
            boxShadow: '0 0 44px rgba(212,175,55,0.16)',
            color: COPY,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 31,
            fontWeight: 820,
            letterSpacing: 3.4,
            marginTop: 18,
            padding: '21px 38px 22px',
          }}
        >
          START YOUR FREE ANALYSIS
        </div>
      </div>

      <div
        style={{
          alignItems: 'center',
          background: 'rgba(3,5,6,0.80)',
          border: '1px solid rgba(212,175,55,0.56)',
          borderRadius: 999,
          color: COPY,
          display: 'flex',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 27,
          fontWeight: 820,
          gap: 12,
          justifyContent: 'center',
          left: '50%',
          letterSpacing: 3.5,
          opacity: interpolate(frame, [5, 18, 43, 53], [0, 1, 1, 0], clamp),
          padding: '16px 24px',
          position: 'absolute',
          top: 100,
          translate: '-50% 0px',
          whiteSpace: 'nowrap',
        }}
      >
        FREE ONLINE CONSULTATION
      </div>
    </AbsoluteFill>
  );
};

const BottomQualification = ({children}: {children: ReactNode}) => (
  <div
    style={{
      background: 'rgba(3,5,6,0.76)',
      border: '1px solid rgba(255,249,237,0.16)',
      borderRadius: 999,
      bottom: 92,
      color: 'rgba(255,249,237,0.82)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 22,
      fontWeight: 650,
      left: '50%',
      letterSpacing: 1.2,
      padding: '10px 17px 11px',
      position: 'absolute',
      textAlign: 'center',
      translate: '-50% 0px',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const CutGlints = ({boundaries}: {boundaries: number[]}) => {
  const frame = useCurrentFrame();
  const opacity = Math.max(
    0,
    ...boundaries.map((boundary) =>
      interpolate(frame, [boundary - 2, boundary, boundary + 5], [0, 0.14, 0], clamp),
    ),
  );

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(112deg, rgba(255,255,255,0.44), rgba(243,223,154,0.34) 38%, rgba(212,175,55,0.05) 74%, transparent)',
        mixBlendMode: 'screen',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const HsaPigmentationReel = ({voiceoverSrc, scoreSrc}: HsaPigmentationReelProps) => {
  const {durationInFrames, fps} = useVideoConfig();
  const captions = captionData as Caption[];
  const premountFor = Math.round(0.5 * fps);
  const atCaption = (index: number) =>
    Math.round((((captions[index]?.startMs ?? 0) as number) / 1000) * fps);

  const journeyFrom = atCaption(1);
  const consultFrom = atCaption(2);
  const virtueFrom = atCaption(3);
  const exosomeFrom = atCaption(4);
  const mesotherapyFrom = atCaption(5);
  const synergyFrom = atCaption(6);
  const ctaFrom = atCaption(7);
  const doctorReviewFrom = Math.min(
    virtueFrom - 1,
    consultFrom + Math.round(3.25 * fps),
  );

  const voiceEnd = Math.round(
    ((((captions.at(-1)?.endMs ?? durationInFrames / fps) as number) / 1000) * fps),
  );
  const protocolGapStart = Math.round(((captions[2]?.endMs ?? 0) / 1000) * fps);

  const scoreVolume = (audioFrame: number) => {
    const fadeIn = interpolate(audioFrame, [0, 8], [0, 1], clamp);
    const protocolGapLift = interpolate(
      audioFrame,
      [protocolGapStart, protocolGapStart + 4, virtueFrom - 4, virtueFrom],
      [0, 0.05, 0.05, 0],
      clamp,
    );
    const finalLift = interpolate(audioFrame, [voiceEnd, voiceEnd + 6], [0, 0.08], clamp);
    const fadeOut = interpolate(
      audioFrame,
      [Math.max(0, durationInFrames - Math.round(0.5 * fps)), durationInFrames - 1],
      [1, 0],
      clamp,
    );
    return (0.1 + protocolGapLift + finalLift) * fadeIn * fadeOut;
  };

  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Sequence from={0} durationInFrames={journeyFrom} premountFor={premountFor}>
        <HookScene durationInFrames={journeyFrom} />
      </Sequence>

      <Sequence
        from={journeyFrom}
        durationInFrames={Math.max(1, consultFrom - journeyFrom)}
        premountFor={premountFor}
      >
        <UploadScanReportScene durationInFrames={Math.max(1, consultFrom - journeyFrom)} />
      </Sequence>

      <Sequence
        from={consultFrom}
        durationInFrames={Math.max(1, doctorReviewFrom - consultFrom)}
        premountFor={premountFor}
      >
        <ReportConsultMontage durationInFrames={Math.max(1, doctorReviewFrom - consultFrom)} />
      </Sequence>

      <Sequence
        from={doctorReviewFrom}
        durationInFrames={Math.max(1, virtueFrom - doctorReviewFrom)}
        premountFor={premountFor}
      >
        <DoctorReviewScene durationInFrames={Math.max(1, virtueFrom - doctorReviewFrom)} />
      </Sequence>

      <Sequence
        from={virtueFrom}
        durationInFrames={Math.max(1, exosomeFrom - virtueFrom)}
        premountFor={premountFor}
      >
        <ProtocolOptionScene
          durationInFrames={Math.max(1, exosomeFrom - virtueFrom)}
          step="01"
          title="VirtueRF"
          subtitle="PULSED MODE"
          benefit="TARGET VISIBLE PIGMENT"
          first={{src: VIRTUERF_SOURCE, trimBeforeSeconds: 61.6, objectPosition: '58% 49%'}}
          second={{src: VIRTUERF_SOURCE, trimBeforeSeconds: 64.35, objectPosition: '58% 49%'}}
          cropScale={1.34}
        />
      </Sequence>

      <Sequence
        from={exosomeFrom}
        durationInFrames={Math.max(1, mesotherapyFrom - exosomeFrom)}
        premountFor={premountFor}
      >
        <ProtocolOptionScene
          durationInFrames={Math.max(1, mesotherapyFrom - exosomeFrom)}
          step="02"
          title="Exosome Therapy"
          benefit="SUPPORT RECOVERY & RENEWAL"
          first={{src: REEL_1, trimBeforeSeconds: 16.2, objectPosition: '52% 50%'}}
          second={{src: REEL_1, trimBeforeSeconds: 19.2, objectPosition: '50% 53%'}}
          cropScale={1.35}
        />
      </Sequence>

      <Sequence
        from={mesotherapyFrom}
        durationInFrames={Math.max(1, synergyFrom - mesotherapyFrom)}
        premountFor={premountFor}
      >
        <ProtocolOptionScene
          durationInFrames={Math.max(1, synergyFrom - mesotherapyFrom)}
          step="03"
          title="Mesotherapy"
          benefit="TAILORED BRIGHTENING INGREDIENTS"
          first={{src: REEL_2, trimBeforeSeconds: 0.65, objectPosition: '52% 48%'}}
          second={{src: REEL_2, trimBeforeSeconds: 6.65, objectPosition: '51% 49%'}}
          cropScale={1.39}
        />
      </Sequence>

      <Sequence
        from={synergyFrom}
        durationInFrames={Math.max(1, ctaFrom - synergyFrom)}
        premountFor={premountFor}
      >
        <ProtocolSynergyScene />
      </Sequence>

      <Sequence
        from={ctaFrom}
        durationInFrames={Math.max(1, durationInFrames - ctaFrom)}
        premountFor={premountFor}
      >
        <CtaScene durationInFrames={Math.max(1, durationInFrames - ctaFrom)} />
      </Sequence>

      <Sequence
        from={journeyFrom}
        durationInFrames={Math.max(1, virtueFrom - journeyFrom)}
        layout="none"
      >
        <BottomQualification>Licensed-model demo · Cosmetic guide · Not a diagnosis</BottomQualification>
      </Sequence>
      <Sequence
        from={virtueFrom}
        durationInFrames={Math.max(1, durationInFrames - virtueFrom)}
        layout="none"
      >
        <BottomQualification>
          Treatment suitability follows consultation · Results vary.
        </BottomQualification>
      </Sequence>

      <CutGlints
        boundaries={[
          journeyFrom,
          consultFrom,
          doctorReviewFrom,
          virtueFrom,
          exosomeFrom,
          mesotherapyFrom,
          synergyFrom,
          ctaFrom,
        ]}
      />
      <FilmTexture />
      <CaptionTrack />
      <Audio src={staticFile(scoreSrc)} volume={scoreVolume} />
      <Audio src={staticFile(voiceoverSrc)} volume={1.3} />
    </AbsoluteFill>
  );
};
