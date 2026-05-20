import axios from 'axios';
import { spawn } from 'child_process';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { logger } from '../utils/logger';
import { getSetting } from './settingsService';

// ElevenLabs default multilingual voices.
const VOICE_IDS: Record<string, string> = {
  male: 'TxGEqnHWrfWFTfGW9XjX',
  female: 'EXAVITQu4vr4xnSDxMaL',
  clone: 'pNInz6obpgDQGcFmaJgB',
};

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('error', reject);
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(err.slice(-300)))));
  });
}

async function silentTrack(duration: number): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'vacado-vo-'));
  const out = join(dir, 'vo.mp3');
  try {
    await run('ffmpeg', [
      '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
      '-t', String(duration), '-q:a', '9', out,
    ]);
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function synthesizeVoiceover(
  script: string,
  voice = 'male',
  duration = 60,
): Promise<Buffer> {
  const apiKey = await getSetting('ELEVENLABS_API_KEY');
  if (!apiKey) {
    logger.warn('ELEVENLABS_API_KEY not set — using silent voiceover track');
    return silentTrack(duration);
  }
  try {
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
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      },
    );
    return Buffer.from(res.data);
  } catch (err) {
    logger.warn(`ElevenLabs failed, using silent track: ${String(err)}`);
    return silentTrack(duration);
  }
}
