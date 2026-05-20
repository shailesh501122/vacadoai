import { spawn } from 'child_process';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Resolve any clip URL — local /media path (read from disk via the shared
 * mediadata volume), or an absolute http(s) URL — to a buffer.
 */
export async function fetchClipFromUrl(url: string): Promise<Buffer> {
  if (url.startsWith('/media/')) {
    const filePath = join(env.media.dir, url.replace(/^\/media\//, ''));
    return readFile(filePath);
  }
  const resolved = url.startsWith('http') ? url : `${env.internalApiUrl}${url}`;
  const res = await axios.get<ArrayBuffer>(resolved, {
    responseType: 'arraybuffer',
    timeout: 60_000,
  });
  return Buffer.from(res.data);
}

function run(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd });
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}`)),
    );
  });
}

function srtTimestamp(totalSeconds: number): string {
  const s = Math.max(1, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss},000`;
}

/** Chunk the script into ~7-word caption lines spread across the duration. */
function buildSrt(script: string, duration: number): string {
  const words = script.split(/\s+/).filter(Boolean);
  const perLine = 7;
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += perLine) {
    lines.push(words.slice(i, i + perLine).join(' '));
  }
  if (lines.length === 0) return '';
  const slot = duration / lines.length;
  return lines
    .map((text, i) => {
      const start = srtTimestamp(i * slot);
      const end = srtTimestamp(Math.min(duration, (i + 1) * slot));
      return `${i + 1}\n${start} --> ${end}\n${text}\n`;
    })
    .join('\n');
}

/**
 * Compose the final vertical Short: voiceover over the clip (or a branded
 * backdrop), burnt-in captions, normalized to 1080x1920. Robust: if the
 * subtitle/caption pass fails (font/libass edge cases) it retries clean so a
 * deploy without perfect font setup still produces a valid MP4.
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
    await writeFile(srtPath, buildSrt(opts.subtitleText, opts.duration));

    const hasClip = opts.clip.length > 0;
    if (hasClip) await writeFile(clipPath, opts.clip);

    // Default to 1080x1920 (Shorts native, fast on small VMs). Set
    // VIDEO_WIDTH=2160 VIDEO_HEIGHT=3840 in .env to opt into 4K when the
    // host has the RAM/CPU for it.
    const W = Number(process.env.VIDEO_WIDTH ?? 1080);
    const H = Number(process.env.VIDEO_HEIGHT ?? 1920);

    const videoInput = hasClip
      ? ['-i', 'clip.mp4']
      : [
          '-f',
          'lavfi',
          '-i',
          `color=c=0x1a0606:s=${W}x${H}:d=${opts.duration}`,
        ];

    const baseScale = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
    // Caption sizing scales with resolution so it stays readable at 4K.
    const fontSize = Math.round(H * 0.026);
    const marginV = Math.round(H * 0.07);
    // Noto Sans has near-full Unicode coverage so non-Latin scripts
    // (Devanagari/Hindi, Arabic, CJK, etc.) render properly instead of
    // showing as □ boxes.
    const withSubs =
      `${baseScale},subtitles='subs.srt':force_style='FontName=Noto Sans,FontSize=${fontSize},PrimaryColour=&Hffffff&,OutlineColour=&H80000000&,BorderStyle=3,Outline=3,Alignment=2,MarginV=${marginV}'`;

    const buildArgs = (vf: string) => [
      '-y',
      ...videoInput,
      '-i',
      'vo.mp3',
      '-vf',
      vf,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-shortest',
      '-c:v',
      'libx264',
      '-preset',
      H >= 2160 ? 'medium' : 'veryfast',
      '-crf',
      H >= 2160 ? '20' : '22',
      '-profile:v',
      'high',
      '-level',
      '5.1',
      '-movflags',
      '+faststart',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-t',
      String(opts.duration),
      'out.mp4',
    ];

    try {
      await run('ffmpeg', buildArgs(withSubs), dir);
    } catch (err) {
      logger.warn(`Caption pass failed, retrying without subtitles: ${String(err)}`);
      await run('ffmpeg', buildArgs(baseScale), dir);
    }

    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/**
 * Generate a 1080x1920 thumbnail without any paid API: a branded red/black
 * backdrop with the hook text burnt in. Used when DALL·E is not configured.
 */
export async function makeThumbnail(hook: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'vacado-thumb-'));
  const outPath = join(dir, 'thumb.png');
  const safe = hook
    .replace(/[:\\']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  try {
    const drawText =
      `drawtext=font='Noto Sans':` +
      `text='${safe}':fontcolor=white:fontsize=64:box=1:boxcolor=0x000000@0.45:` +
      `boxborderw=24:x=(w-text_w)/2:y=h-360:line_spacing=12`;
    try {
      await run('ffmpeg', [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'color=c=0x1a0606:s=1080x1920',
        '-vf',
        `drawbox=x=0:y=0:w=1080:h=1920:color=0x330000@0.6:t=fill,${drawText}`,
        '-frames:v',
        '1',
        outPath,
      ]);
    } catch {
      // Font missing — fall back to a plain branded backdrop.
      await run('ffmpeg', [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'color=c=0x1a0606:s=1080x1920',
        '-frames:v',
        '1',
        outPath,
      ]);
    }
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
