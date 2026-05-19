import axios from 'axios';
import { env } from '../config/env';

// ElevenLabs default multilingual voices.
const VOICE_IDS: Record<string, string> = {
  male: 'TxGEqnHWrfWFTfGW9XjX', // Josh
  female: 'EXAVITQu4vr4xnSDxMaL', // Bella
  clone: 'pNInz6obpgDQGcFmaJgB', // Adam (placeholder for user clone)
};

/** Convert a script to an MP3 buffer via ElevenLabs TTS. */
export async function synthesizeVoiceover(
  script: string,
  voice = 'male',
): Promise<Buffer> {
  const voiceId = VOICE_IDS[voice] ?? VOICE_IDS.male;
  const res = await axios.post<ArrayBuffer>(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    },
    {
      headers: {
        'xi-api-key': env.elevenLabsKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      responseType: 'arraybuffer',
    },
  );
  return Buffer.from(res.data);
}
