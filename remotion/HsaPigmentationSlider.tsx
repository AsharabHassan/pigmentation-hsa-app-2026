import {Audio} from '@remotion/media';
import {type ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type HsaPigmentationSliderProps = {
  resultSrc: string;
  scoreSrc: string;
};

const GOLD = '#D4AF37';
const PALE_GOLD = '#F2DEA0';
const INK = '#030506';
const COPY = '#FFF9ED';
const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const HsaMark = ({large = false}: {large?: boolean}) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: large ? 13 : 7,
    }}
  >
    <div
      style={{
        color: GOLD,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: large ? 92 : 44,
        letterSpacing: large ? 25 : 13,
        lineHeight: 0.9,
        marginLeft: large ? 25 : 13,
      }}
    >
      HSA
    </div>
    <div
      style={{
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        height: 1,
        width: large ? 320 : 172,
      }}
    />
    <div
      style={{
        color: COPY,
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: large ? 22 : 12,
        fontWeight: 700,
        letterSpacing: large ? 7 : 3.6,
      }}
    >
      HARLEY STREET AESTHETICS
    </div>
  </div>
);

const FilmGrain = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        mixBlendMode: 'soft-light',
        opacity: 0.09,
        pointerEvents: 'none',
      }}
    >
      <svg height="100%" preserveAspectRatio="none" width="100%">
        <filter id="hsa-slider-grain">
          <feTurbulence
            baseFrequency="0.82"
            numOctaves={2}
            seed={(frame % 5) + 1}
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect fill="#808080" filter="url(#hsa-slider-grain)" height="100%" width="100%" />
      </svg>
    </AbsoluteFill>
  );
};

const GalleryCrop = ({resultSrc, side}: {resultSrc: string; side: 'before' | 'after'}) => {
  // The official 3375px HSA gallery master is a branded side-by-side composite.
  // These coordinates display only the untouched clinical photo boxes.
  const displayedSize = 2738;
  const left = side === 'before' ? -371 : -1376;

  return (
    <Img
      src={staticFile(resultSrc)}
      style={{
        height: displayedSize,
        left,
        maxWidth: 'none',
        position: 'absolute',
        top: -770,
        width: displayedSize,
      }}
    />
  );
};

const ResultLabel = ({align, children}: {align: 'left' | 'right'; children: ReactNode}) => (
  <div
    style={{
      background: align === 'left' ? 'rgba(3,5,6,0.82)' : PALE_GOLD,
      border: `1px solid ${align === 'left' ? 'rgba(255,249,237,0.38)' : GOLD}`,
      borderRadius: 999,
      color: align === 'left' ? COPY : INK,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 28,
      fontWeight: 850,
      left: align === 'left' ? 26 : undefined,
      letterSpacing: 4.2,
      padding: '13px 19px 14px',
      position: 'absolute',
      right: align === 'right' ? 26 : undefined,
      top: 24,
      zIndex: 7,
    }}
  >
    {children}
  </div>
);

const ComparisonSlider = ({resultSrc}: {resultSrc: string}) => {
  const frame = useCurrentFrame();
  const divider = interpolate(
    frame,
    [0, 18, 75, 120, 155, 330],
    [0.93, 0.93, 0.09, 0.09, 0.37, 0.37],
    {easing: Easing.bezier(0.65, 0, 0.22, 1), ...clamp},
  );
  const enter = interpolate(frame, [0, 20], [0, 1], {easing: easeOut, ...clamp});
  const exit = interpolate(frame, [300, 334], [1, 0], {easing: Easing.in(Easing.cubic), ...clamp});
  const handlePulse = 1 + 0.035 * Math.sin(frame / 6);

  return (
    <div
      style={{
        border: '1px solid rgba(212,175,55,0.52)',
        borderRadius: 34,
        boxShadow: '0 28px 90px rgba(0,0,0,0.48)',
        height: 930,
        left: 90,
        opacity: enter * exit,
        overflow: 'hidden',
        position: 'absolute',
        scale: interpolate(enter, [0, 1], [0.965, 1]),
        top: 342,
        width: 900,
      }}
    >
      <AbsoluteFill style={{backgroundColor: '#6D4A33'}}>
        <GalleryCrop resultSrc={resultSrc} side="after" />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `inset(0 ${(1 - divider) * 100}% 0 0)`,
        }}
      >
        <GalleryCrop resultSrc={resultSrc} side="before" />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(3,5,6,0.26) 0%, transparent 20%, transparent 73%, rgba(3,5,6,0.48) 100%)',
          pointerEvents: 'none',
        }}
      />
      <ResultLabel align="left">BEFORE</ResultLabel>
      <ResultLabel align="right">AFTER</ResultLabel>

      <div
        style={{
          background: `linear-gradient(180deg, transparent, ${PALE_GOLD} 9%, ${GOLD} 91%, transparent)`,
          bottom: 0,
          boxShadow: '0 0 28px rgba(212,175,55,0.58)',
          left: `${divider * 100}%`,
          position: 'absolute',
          top: 0,
          translate: '-2px 0px',
          width: 4,
          zIndex: 8,
        }}
      />
      <div
        style={{
          alignItems: 'center',
          background: 'rgba(3,5,6,0.88)',
          border: `2px solid ${PALE_GOLD}`,
          borderRadius: 999,
          boxShadow: '0 0 38px rgba(212,175,55,0.44)',
          color: COPY,
          display: 'flex',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 25,
          fontWeight: 900,
          height: 76,
          justifyContent: 'center',
          left: `${divider * 100}%`,
          letterSpacing: 4,
          position: 'absolute',
          scale: handlePulse,
          top: '50%',
          translate: '-50% -50%',
          width: 76,
          zIndex: 9,
        }}
      >
        {'< >'}
      </div>
    </div>
  );
};

const Header = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 294, 324], [0, 1, 1, 0], {
    easing: easeOut,
    ...clamp,
  });

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        left: 80,
        opacity,
        position: 'absolute',
        right: 80,
        top: 70,
      }}
    >
      <HsaMark />
      <div
        style={{
          border: '1px solid rgba(212,175,55,0.48)',
          borderRadius: 999,
          color: PALE_GOLD,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 23,
          fontWeight: 800,
          letterSpacing: 4,
          padding: '12px 18px 13px',
        }}
      >
        OFFICIAL HSA GALLERY RESULT
      </div>
    </div>
  );
};

const HookCopy = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [2, 20, 166, 190], [0, 1, 1, 0], {
    easing: easeOut,
    ...clamp,
  });

  return (
    <>
      <div
        style={{
          color: COPY,
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: 68,
          left: 80,
          letterSpacing: -1.1,
          lineHeight: 0.98,
          opacity,
          position: 'absolute',
          right: 80,
          textAlign: 'center',
          top: 205,
        }}
      >
        Pigmentation,
        <span style={{color: PALE_GOLD, fontStyle: 'italic'}}> visibly faded.</span>
      </div>
      <div
        style={{
          color: COPY,
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: 56,
          left: 80,
          letterSpacing: -0.8,
          lineHeight: 1.02,
          opacity,
          position: 'absolute',
          right: 80,
          textAlign: 'center',
          top: 1340,
        }}
      >
        Real result. Bespoke care.
      </div>
    </>
  );
};

const ProtocolCopy = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [180, 204, 292, 322], [0, 1, 1, 0], {
    easing: easeOut,
    ...clamp,
  });
  const treatments = [
    ['01', 'VirtueRF'],
    ['02', 'Exosomes'],
    ['03', 'Mesotherapy'],
  ];

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        left: 70,
        opacity,
        position: 'absolute',
        right: 70,
        top: 1324,
      }}
    >
      <div
        style={{
          color: PALE_GOLD,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 25,
          fontWeight: 850,
          letterSpacing: 5.4,
        }}
      >
        THE HSA PIGMENTATION PROTOCOL
      </div>
      <div
        style={{
          color: COPY,
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: 53,
          lineHeight: 1,
        }}
      >
        Target. Recover. Brighten.
      </div>
      <div style={{display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)', width: '100%'}}>
        {treatments.map(([number, label]) => (
          <div
            key={number}
            style={{
              background: 'rgba(8,10,11,0.82)',
              border: '1px solid rgba(212,175,55,0.42)',
              borderRadius: 18,
              color: COPY,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 27,
              fontWeight: 800,
              gap: 8,
              padding: '20px 16px 22px',
              textAlign: 'center',
            }}
          >
            <span style={{color: PALE_GOLD, fontSize: 19, letterSpacing: 4}}>{number}</span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

const Qualification = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [10, 24, 294, 320], [0, 1, 1, 0], clamp);

  return (
    <div
      style={{
        bottom: 72,
        color: 'rgba(255,249,237,0.72)',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 20,
        fontWeight: 650,
        left: 76,
        letterSpacing: 1,
        opacity,
        position: 'absolute',
        right: 76,
        textAlign: 'center',
      }}
    >
      HSA gallery result · Individual results vary · Treatment suitability follows consultation
    </div>
  );
};

const CtaScene = ({resultSrc}: {resultSrc: string}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 30], [0, 1], {easing: easeOut, ...clamp});
  const buttonPulse = 1 + 0.025 * Math.sin(Math.max(0, frame - 48) / 7);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background: INK,
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Img
        src={staticFile(resultSrc)}
        style={{
          filter: 'blur(14px) saturate(0.7) brightness(0.38)',
          height: '100%',
          inset: 0,
          objectFit: 'cover',
          opacity: 0.38,
          position: 'absolute',
          scale: 1.16,
          width: '100%',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(121,83,21,0.28), rgba(3,5,6,0.93) 49%, #030506 100%)',
        }}
      />
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
          opacity: enter,
          padding: '0 80px',
          textAlign: 'center',
          translate: interpolate(enter, [0, 1], ['0px 30px', '0px 0px']),
          width: '100%',
        }}
      >
        <HsaMark large />
        <div
          style={{
            color: COPY,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 67,
            letterSpacing: -1.2,
            lineHeight: 1.01,
            marginTop: 28,
          }}
        >
          See where pigmentation
          <br />
          <span style={{color: PALE_GOLD, fontStyle: 'italic'}}>needs attention.</span>
        </div>
        <div
          style={{
            color: COPY,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 33,
            fontWeight: 740,
            lineHeight: 1.35,
            maxWidth: 860,
          }}
        >
          Upload a selfie. Get your report.
          <br />
          Book a free online consultation.
        </div>
        <div
          style={{
            background: PALE_GOLD,
            border: `1px solid ${GOLD}`,
            borderRadius: 999,
            boxShadow: '0 0 44px rgba(212,175,55,0.24)',
            color: INK,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 3.2,
            marginTop: 24,
            padding: '22px 36px 23px',
            scale: buttonPulse,
          }}
        >
          START YOUR FREE ANALYSIS
        </div>
      </div>
      <div
        style={{
          bottom: 82,
          color: 'rgba(255,249,237,0.72)',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 20,
          fontWeight: 650,
          left: 80,
          letterSpacing: 0.9,
          opacity: enter,
          position: 'absolute',
          right: 80,
          textAlign: 'center',
        }}
      >
        HSA gallery result · Individual results vary · Consultation required
      </div>
    </AbsoluteFill>
  );
};

export const HsaPigmentationSlider = ({
  resultSrc,
  scoreSrc,
}: HsaPigmentationSliderProps) => {
  const {durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 50% 42%, #1B1B17 0%, #080A0A 50%, #030506 100%)',
      }}
    >
      <Sequence from={0} durationInFrames={335}>
        <Header />
        <HookCopy />
        <ComparisonSlider resultSrc={resultSrc} />
        <ProtocolCopy />
        <Qualification />
      </Sequence>
      <Sequence from={300} durationInFrames={Math.max(1, durationInFrames - 300)}>
        <CtaScene resultSrc={resultSrc} />
      </Sequence>

      <Audio
        src={staticFile(scoreSrc)}
        volume={(audioFrame) =>
          interpolate(
            audioFrame,
            [0, 14, durationInFrames - 24, durationInFrames - 1],
            [0, 0.42, 0.42, 0],
            clamp,
          )
        }
      />
      <FilmGrain />
    </AbsoluteFill>
  );
};
