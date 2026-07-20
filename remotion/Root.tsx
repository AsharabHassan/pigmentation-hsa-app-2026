import {Composition, type CalculateMetadataFunction, staticFile} from 'remotion';
import {HsaPigmentationReel, type HsaPigmentationReelProps} from './HsaPigmentationReel';
import {getAudioDuration} from './get-audio-duration';

const FPS = 30;
const BASE_DURATION_SECONDS = 40;

const calculateMetadata: CalculateMetadataFunction<HsaPigmentationReelProps> = async ({
  props,
}) => {
  try {
    const voiceDuration = await getAudioDuration(staticFile(props.voiceoverSrc));
    return {
      durationInFrames: Math.max(
        BASE_DURATION_SECONDS * FPS,
        Math.ceil((voiceDuration + 0.45) * FPS),
      ),
      defaultOutName: 'hsa-pigmentation-cinematic-v1.mp4',
    };
  } catch {
    return {
      durationInFrames: BASE_DURATION_SECONDS * FPS,
      defaultOutName: 'hsa-pigmentation-cinematic-v1.mp4',
    };
  }
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="HsaPigmentationCinematic"
      component={HsaPigmentationReel}
      durationInFrames={BASE_DURATION_SECONDS * FPS}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        voiceoverSrc: 'assets/hsa-cinematic/audio/voiceover.mp3',
        scoreSrc: 'assets/hsa-cinematic/audio/hsa-original-score.wav',
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
