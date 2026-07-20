import {Audio, Video} from '@remotion/media';
import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {CaptionTrack} from './CaptionTrack';

export type HsaPigmentationReelProps = {
  voiceoverSrc: string;
  scoreSrc: string;
};

const GOLD = '#D4AF37';
const PALE_GOLD = '#F3DF9A';
const INK = '#06080A';
const BAR = 100;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const FilmTexture = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 45%, transparent 35%, rgba(2,3,4,0.25) 72%, rgba(2,3,4,0.72) 110%)',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 4px)',
          mixBlendMode: 'soft-light',
          opacity: 0.5 + (frame % 3) * 0.035,
        }}
      />
    </AbsoluteFill>
  );
};

const HsaMark = ({small = false}: {small?: boolean}) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: small ? 7 : 14,
    }}
  >
    <div
      style={{
        color: GOLD,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: small ? 44 : 104,
        letterSpacing: small ? 13 : 27,
        lineHeight: 0.9,
        marginLeft: small ? 13 : 27,
      }}
    >
      HSA
    </div>
    <div
      style={{
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        height: 1,
        width: small ? 160 : 320,
      }}
    />
    <div
      style={{
        color: '#F4EAD4',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: small ? 16 : 24,
        fontWeight: 600,
        letterSpacing: small ? 5 : 9,
      }}
    >
      HARLEY STREET AESTHETICS
    </div>
  </div>
);

const EditorialTitle = ({
  eyebrow,
  children,
  align = 'center',
  size = 92,
}: {
  eyebrow?: string;
  children: ReactNode;
  align?: CSSProperties['textAlign'];
  size?: number;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        maxWidth: 900,
        opacity: interpolate(frame, [7, 25], [0, 1], {
          easing: ease,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
        textAlign: align,
        translate: interpolate(frame, [5, 30], ['0 34px', '0 0px'], {
          easing: ease,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      {eyebrow ? (
        <div
          style={{
            color: PALE_GOLD,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 27,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          color: '#FFF9ED',
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: size,
          letterSpacing: -2.2,
          lineHeight: 0.98,
          textShadow: '0 18px 60px rgba(0,0,0,0.62)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const PortraitBackground = ({dim = 0.18}: {dim?: number}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: INK}}>
      <Img
        src={staticFile('assets/meta/hsa-pigmentation-mirror-map-4x5-v1.png')}
        style={{
          height: '100%',
          objectFit: 'cover',
          objectPosition: '50% 46%',
          scale: interpolate(frame, [0, BAR], [1.04, 1.1], {
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          width: '100%',
        }}
      />
      <AbsoluteFill style={{background: `rgba(4, 6, 8, ${dim})`}} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(3,4,5,0.72) 0%, rgba(3,4,5,0.02) 30%, rgba(3,4,5,0.02) 62%, rgba(3,4,5,0.8) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const MirrorScene = () => (
  <AbsoluteFill>
    <PortraitBackground dim={0.06} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 180}}>
      <EditorialTitle eyebrow="A clearer beginning" size={88}>
        The mirror shows<br />the marks.
      </EditorialTitle>
    </AbsoluteFill>
    <FilmTexture />
  </AbsoluteFill>
);

const MapScene = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <PortraitBackground dim={0.14} />
      <div
        style={{
          background: `linear-gradient(90deg, transparent, ${PALE_GOLD}, white, ${PALE_GOLD}, transparent)`,
          boxShadow: `0 0 34px ${GOLD}`,
          height: 3,
          left: 80,
          opacity: interpolate(frame, [0, 10, 82, 96], [0, 0.85, 0.65, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          position: 'absolute',
          right: 80,
          top: interpolate(frame, [0, 94], [310, 1420], {
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 175}}>
        <EditorialTitle eyebrow="HSA Skin-Tone Map" size={88}>
          The map shows<br />the pattern.
        </EditorialTitle>
      </AbsoluteFill>
      <FilmTexture />
    </AbsoluteFill>
  );
};

const BrandRevealScene = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at 50% 44%, rgba(117,82,21,0.26), rgba(6,8,10,0.96) 44%, #030405 78%)',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          opacity: interpolate(frame, [3, 26], [0, 1], {
            easing: ease,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          scale: interpolate(frame, [0, BAR], [0.94, 1.025], {
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <HsaMark />
      </div>
      <div
        style={{
          bottom: 360,
          color: '#F8F1E2',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 35,
          fontWeight: 700,
          letterSpacing: 7,
          opacity: interpolate(frame, [24, 46], [0, 1], {
            easing: ease,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          position: 'absolute',
          textAlign: 'center',
        }}
      >
        THE 60-SECOND<br />SKIN-TONE MAP
      </div>
      <FilmTexture />
    </AbsoluteFill>
  );
};

const PhoneScene = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background: 'linear-gradient(160deg, #0A0C0E 0%, #14100A 50%, #050607 100%)',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: '#050607',
          border: '3px solid rgba(243,223,154,0.55)',
          borderRadius: 72,
          boxShadow: '0 45px 120px rgba(0,0,0,0.7), 0 0 80px rgba(212,175,55,0.12)',
          display: 'flex',
          height: 1260,
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 18,
          scale: interpolate(frame, [0, 38], [0.88, 1], {
            easing: ease,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          width: 710,
        }}
      >
        <Img
          src={staticFile('assets/meta/hsa-pigmentation-mirror-map-4x5-v1.png')}
          style={{
            borderRadius: 52,
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 44%',
            width: '100%',
          }}
        />
        <div
          style={{
            background: '#08090A',
            borderRadius: 20,
            height: 42,
            left: '50%',
            position: 'absolute',
            top: 32,
            translate: '-50% 0',
            width: 168,
          }}
        />
      </div>
      <div style={{position: 'absolute', top: 160}}>
        <EditorialTitle eyebrow="One clear photo" size={74}>
          A clearer starting point.
        </EditorialTitle>
      </div>
      <FilmTexture />
    </AbsoluteFill>
  );
};

const ZoneScene = () => {
  const frame = useCurrentFrame();
  const points = [
    [656, 520],
    [704, 695],
    [674, 862],
    [625, 1030],
    [578, 1180],
    [524, 1325],
  ];
  return (
    <AbsoluteFill>
      <PortraitBackground dim={0.3} />
      {points.map(([left, top], index) => (
        <div
          key={`${left}-${top}`}
          style={{
            alignItems: 'center',
            background: 'rgba(6,8,10,0.75)',
            border: `2px solid ${PALE_GOLD}`,
            borderRadius: '50%',
            boxShadow: `0 0 26px rgba(212,175,55,0.55)`,
            color: '#FFF9ED',
            display: 'flex',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 25,
            fontWeight: 700,
            height: 58,
            justifyContent: 'center',
            left,
            opacity: interpolate(frame, [8 + index * 8, 22 + index * 8], [0, 1], {
              easing: ease,
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            position: 'absolute',
            scale: interpolate(frame, [8 + index * 8, 22 + index * 8], [0.35, 1], {
              easing: ease,
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            top,
            width: 58,
          }}
        >
          {index + 1}
        </div>
      ))}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 160}}>
        <EditorialTitle eyebrow="One personalised view" size={78}>
          Six cosmetic zones.<br />About sixty seconds.
        </EditorialTitle>
      </AbsoluteFill>
      <FilmTexture />
    </AbsoluteFill>
  );
};

type ClinicalClipProps = {
  src: string;
  trimBeforeSeconds: number;
  scaleFrom: number;
  scaleTo: number;
  translateFrom: string;
  translateTo: string;
  label: string;
  title: string;
};

const ClinicalClip = ({
  src,
  trimBeforeSeconds,
  scaleFrom,
  scaleTo,
  translateFrom,
  translateTo,
  label,
  title,
}: ClinicalClipProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <Video
        src={staticFile(src)}
        trimBefore={Math.round(trimBeforeSeconds * fps)}
        muted
        style={{
          filter: 'saturate(0.78) contrast(1.12) brightness(0.9) sepia(0.04)',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, BAR], [scaleFrom, scaleTo], {
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: interpolate(frame, [0, BAR], [translateFrom, translateTo], {
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          width: '100%',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(3,4,5,0.82) 0%, transparent 28%, transparent 60%, rgba(3,4,5,0.8) 100%)',
        }}
      />
      <div style={{left: 82, position: 'absolute', right: 82, top: 150}}>
        <EditorialTitle eyebrow={label} align="left" size={72}>
          {title}
        </EditorialTitle>
      </div>
      <FilmTexture />
    </AbsoluteFill>
  );
};

const WholePictureScene = () => (
  <AbsoluteFill>
    <PortraitBackground dim={0.2} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 180}}>
      <EditorialTitle eyebrow="Better decisions begin here" size={88}>
        See the whole picture.
      </EditorialTitle>
    </AbsoluteFill>
    <FilmTexture />
  </AbsoluteFill>
);

const EndCard = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at 50% 38%, rgba(140,98,26,0.24), rgba(5,7,8,0.98) 48%, #020303 100%)',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 64,
          opacity: interpolate(frame, [0, 22], [0, 1], {
            easing: ease,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          paddingBottom: 120,
          scale: interpolate(frame, [0, 90], [0.95, 1], {
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <HsaMark />
        <div style={{display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center'}}>
          <div
            style={{
              color: '#FFF9ED',
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: 76,
              lineHeight: 1.02,
            }}
          >
            Create your free<br />Skin-Tone Map.
          </div>
          <div
            style={{
              color: PALE_GOLD,
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 7,
            }}
          >
            SEE FIRST. CHOOSE BETTER.
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${GOLD}`,
            borderRadius: 999,
            color: '#FFF9ED',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 31,
            fontWeight: 750,
            letterSpacing: 3,
            padding: '22px 42px',
          }}
        >
          CREATE MY MAP
        </div>
      </div>
      <FilmTexture />
    </AbsoluteFill>
  );
};

const GoldCutFlashes = () => {
  const frame = useCurrentFrame();
  const boundaries = Array.from({length: 11}, (_, index) => (index + 1) * BAR);
  const opacity = Math.max(
    0,
    ...boundaries.map((boundary) =>
      interpolate(frame, [boundary - 3, boundary, boundary + 6], [0, 0.32, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    ),
  );
  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(115deg, rgba(255,255,255,0.75), rgba(243,223,154,0.55) 38%, rgba(212,175,55,0.1) 70%, transparent)',
        mixBlendMode: 'screen',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const HsaPigmentationReel = ({voiceoverSrc, scoreSrc}: HsaPigmentationReelProps) => {
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Sequence from={0} durationInFrames={BAR}>
        <MirrorScene />
      </Sequence>
      <Sequence from={BAR} durationInFrames={BAR}>
        <MapScene />
      </Sequence>
      <Sequence from={BAR * 2} durationInFrames={BAR}>
        <BrandRevealScene />
      </Sequence>
      <Sequence from={BAR * 3} durationInFrames={BAR}>
        <PhoneScene />
      </Sequence>
      <Sequence from={BAR * 4} durationInFrames={BAR}>
        <ZoneScene />
      </Sequence>
      <Sequence from={BAR * 5} durationInFrames={BAR}>
        <ClinicalClip
          src="assets/hsa-cinematic/source/hsa-reel-1-DIolH88CMgE.mp4"
          trimBeforeSeconds={0.25}
          scaleFrom={1.24}
          scaleTo={1.3}
          translateFrom="-26px -50px"
          translateTo="-38px -72px"
          label="Qualified clinical review"
          title="A cosmetic guide."
        />
      </Sequence>
      <Sequence from={BAR * 6} durationInFrames={BAR}>
        <ClinicalClip
          src="assets/hsa-cinematic/source/hsa-reel-1-DIolH88CMgE.mp4"
          trimBeforeSeconds={5.8}
          scaleFrom={1.27}
          scaleTo={1.33}
          translateFrom="-34px -64px"
          translateTo="-48px -82px"
          label="Clarity before treatment"
          title="Not a diagnosis."
        />
      </Sequence>
      <Sequence from={BAR * 7} durationInFrames={BAR}>
        <ClinicalClip
          src="assets/hsa-cinematic/source/hsa-reel-4-C4_G-EatMd-.mp4"
          trimBeforeSeconds={1.6}
          scaleFrom={1.26}
          scaleTo={1.32}
          translateFrom="-54px -50px"
          translateTo="-72px -70px"
          label="The HSA process"
          title="Assessment first."
        />
      </Sequence>
      <Sequence from={BAR * 8} durationInFrames={BAR}>
        <ClinicalClip
          src="assets/hsa-cinematic/source/hsa-reel-4-C4_G-EatMd-.mp4"
          trimBeforeSeconds={7.4}
          scaleFrom={1.28}
          scaleTo={1.35}
          translateFrom="-64px -64px"
          translateTo="-82px -80px"
          label="Options discussed in clinic"
          title="Shaped around the individual."
        />
      </Sequence>
      <Sequence from={BAR * 9} durationInFrames={BAR}>
        <ClinicalClip
          src="assets/hsa-cinematic/source/hsa-reel-1-DIolH88CMgE.mp4"
          trimBeforeSeconds={19.4}
          scaleFrom={1.25}
          scaleTo={1.3}
          translateFrom="-30px -56px"
          translateTo="-42px -72px"
          label="Real clinic. Qualified review."
          title="One clearer next step."
        />
      </Sequence>
      <Sequence from={BAR * 10} durationInFrames={BAR}>
        <WholePictureScene />
      </Sequence>
      <Sequence from={BAR * 11} durationInFrames={Math.max(1, durationInFrames - BAR * 11)}>
        <EndCard />
      </Sequence>

      <GoldCutFlashes />
      <CaptionTrack />
      <Audio src={staticFile(scoreSrc)} volume={0.22} />
      <Audio src={staticFile(voiceoverSrc)} volume={0.96} />
    </AbsoluteFill>
  );
};
