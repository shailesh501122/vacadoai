import { spawn } from 'child_process';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Source-clip fetch. In production this calls a licensed movie-clip API;
 * the fallback resolves a public trailer clip URL by movie title.
 */
export async function fetchSourceClip(movieTitle: string): Promise<Buffer> {
  // Placeholder integration point — replace with licensed clip provider.
  const url = `https://storage.googleapis.com/vacado-public/clips/${encodeURIComponent(
    movieTitle.toLowerCase().replace(/\s+/g, '-'),
  )}.mp4`;
  try {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    return Buffer.from(res.data);
  } catch {
    logger.warn(`No source clip for "${movieTitle}", using blank canvas`);
    return Buffer.alloc(0);
  }
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${stderr}`)),
    );
  });
}

/**
 * Compose the final vertical Short: overlay voiceover on the clip,
 * burn in subtitles, normalize to 1080x1920. Returns an MP4 buffer.
 */
export async function composeVideo(opts: {
  clip: Buffer;
  voiceover: Buffer;
  subtitleText: string;
  duration: number;
}): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'vacado-'));
  const clipPath = join(dir, 'clip.mp4');
  const audioPath = join(dir, 'vo.mp3');
  const srtPath = join(dir, 'subs.srt');
  const outPath = join(dir, 'out.mp4');

  try {
    await writeFile(audioPath, opts.voiceover);
    await writeFile(
      srtPath,
      `1\n00:00:00,000 --> 00:00:${String(opts.duration).padStart(2, '0')},000\n${opts.subtitleText.slice(0, 120)}\n`,
    );

    const videoInput = opts.clip.length
      ? (await writeFile(clipPath, opts.clip), ['-i', clipPath])
      : [
          '-f',
          'lavfi',
          '-i',
          `color=c=#1a0606:s=1080x1920:d=${opts.duration}`,
        ];

    await run('ffmpeg', [
      '-y',
      ...videoInput,
      '-i',
      audioPath,
      '-vf',
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,subtitles=${srtPath}:force_style='Fontname=Poppins,FontSize=22,PrimaryColour=&Hffffff&,Outline=2'`,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-shortest',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-c:a',
      'aac',
      '-t',
      String(opts.duration),
      outPath,
    ]);

    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
