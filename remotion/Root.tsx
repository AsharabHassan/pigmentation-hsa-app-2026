import {Composition, type CalculateMetadataFunction, staticFile} from 'remotion';
import {HsaPigmentationReel, type HsaPigmentationReelProps} from './HsaPigmentationReel';
import {
  HsaPigmentationSlider,
  type HsaPigmentationSliderProps,
} from './HsaPigmentationSlider';
import {getAudioDuration} from './get-audio-duration';
import {HsaPigmentationDoctor60} from './HsaPigmentationDoctor60';
import {HsaPigmentationDoctor60V2} from './HsaPigmentationDoctor60V2';
import {HsaPigmentationDoctor60V3} from './HsaPigmentationDoctor60V3';

import {HsaPigmentationDoctor60V4} from './HsaPigmentationDoctor60V4';

import {HsaPigmentationDoctor60V5} from './HsaPigmentationDoctor60V5';
import {HsaPigmentationDoctor60V6} from './HsaPigmentationDoctor60V6';
import {HsaPigmentationDoctor60V7} from './HsaPigmentationDoctor60V7';
import {HsaPigmentationDoctor60V8} from './HsaPigmentationDoctor60V8';
import {HsaPigmentationDoctor60V9} from './HsaPigmentationDoctor60V9';
import {HsaChairConversation10} from './HsaChairConversation10';
import {HsaConversationAvatarV10} from './HsaConversationAvatarV10';
import {HsaPigmentationReelsV11} from './HsaPigmentationReelsV11';
const FPS = 30;
const BASE_DURATION_SECONDS = 39;

const calculateMetadata: CalculateMetadataFunction<HsaPigmentationReelProps> = async ({
  props,
}) => {
  try {
    const voiceDuration = await getAudioDuration(staticFile(props.voiceoverSrc));
    return {
      durationInFrames: Math.max(
        BASE_DURATION_SECONDS * FPS,
        Math.ceil((voiceDuration + 1.05) * FPS),
      ),
      defaultOutName: 'hsa-pigmentation-cinematic-v2.mp4',
    };
  } catch {
    return {
      durationInFrames: BASE_DURATION_SECONDS * FPS,
      defaultOutName: 'hsa-pigmentation-cinematic-v2.mp4',
    };
  }
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="HsaPigmentation15V11" component={HsaPigmentationReelsV11} durationInFrames={450} fps={30} width={1080} height={1920} defaultProps={{length:15 as const}} />
      <Composition id="HsaPigmentation30V11" component={HsaPigmentationReelsV11} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{length:30 as const}} />
      <Composition id="HsaConversationAvatarV10" component={HsaConversationAvatarV10} durationInFrames={300} fps={30} width={1080} height={1920} />
      <Composition id="HsaChairConversation10" component={HsaChairConversation10} durationInFrames={300} fps={30} width={1080} height={1920} />
      <Composition id="HsaPigmentationDoctor60V9" component={HsaPigmentationDoctor60V9} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60V8" component={HsaPigmentationDoctor60V8} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60V7" component={HsaPigmentationDoctor60V7} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60V6" component={HsaPigmentationDoctor60V6} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60V5" component={HsaPigmentationDoctor60V5} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60V4" component={HsaPigmentationDoctor60V4} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60V3" component={HsaPigmentationDoctor60V3} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60V2" component={HsaPigmentationDoctor60V2} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.7,sfxVolume:1,captionsEnabled:true}} />
      <Composition id="HsaPigmentationDoctor60" component={HsaPigmentationDoctor60} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{musicVolume:0.45,captionsEnabled:true}} />
      <Composition
        id="HsaPigmentationCinematic"
        component={HsaPigmentationReel}
        durationInFrames={BASE_DURATION_SECONDS * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          voiceoverSrc: 'assets/hsa-cinematic/audio/voiceover.mp3',
          scoreSrc: 'assets/hsa-cinematic/audio/hsa-elevenlabs-cinematic-v2.mp3',
        }}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="HsaPigmentationSlider"
        component={HsaPigmentationSlider}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            resultSrc:
              'assets/hsa-cinematic/creative-02/hsa-pigmentation-slider-master.png',
            scoreSrc: 'assets/hsa-cinematic/audio/hsa-elevenlabs-cinematic-v2.mp3',
          } satisfies HsaPigmentationSliderProps
        }
      />
      <Composition
        id="HsaPigmentationSliderGlasgow"
        component={HsaPigmentationSlider}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          resultSrc:
            'assets/hsa-cinematic/creative-02/hsa-pigmentation-slider-master.png',
          scoreSrc: 'assets/hsa-cinematic/audio/hsa-elevenlabs-cinematic-v2.mp3',
          openingLabel: 'HSA GALLERY RESULT · GLASGOW CONSULTATIONS',
          ctaBrand: 'HSA GLASGOW',
          ctaAddress: 'Ingram House · 227 Ingram Street · Glasgow G1 1DA',
        }}
      />
    </>
  );
};


