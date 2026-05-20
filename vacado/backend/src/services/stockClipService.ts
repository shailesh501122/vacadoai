import axios from 'axios';
import { spawn } from 'child_process';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { logger } from '../utils/logger';
import { getSetting } from './settingsService';

const VIDEO_W = Number(process.env.VIDEO_WIDTH ?? 1080);
const VIDEO_H = Number(process.env.VIDEO_HEIGHT ?? 1920);

function run(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd });
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-400)}`)),
    );
  });
}

interface PexelsVideoFile {
  link: string;
  quality: string;
  width: number;
  height: number;
}
interface PexelsVideo {
  duration: number;
  video_files: PexelsVideoFile[];
}
interface PexelsSearchResponse {
  videos: PexelsVideo[];
}

function pexelsKeywords(movieTitle: string, clipStyle?: string, tone?: string): string {
  const styleMap: Record<string, string> = {
    action: 'action chase cinematic',
    dialogue: 'closeup portrait dramatic',
    'plot-twist': 'mystery dark suspense cinematic',
    ending: 'sunset dramatic cinematic',
  };
  const toneMap: Record<string, string> = {
    dramatic: 'cinematic dark moody',
    casual: 'lifestyle bright',
    educational: 'abstract minimal',
  };
  const parts = [
    styleMap[clipStyle ?? ''] ?? 'cinematic',
    toneMap[tone ?? ''] ?? '',
  ].filter(Boolean);
  return parts.join(' ') || `cinematic ${movieTitle}`;
}

async function searchPexelsVideoUrl(
  query: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const res = await axios.get<PexelsSearchResponse>(
      'https://api.pexels.com/videos/search',
      {
        headers: { Authorization: apiKey },
        params: { query, per_page: 5, orientation: 'portrait', size: 'medium' },
        timeout: 15_000,
      },
    );
    const videos = res.data.videos ?? [];
    if (videos.length === 0) return null;
    // Pick the first video; pick its highest-resolution HD/SD file (mp4).
    const v = videos[0];
    const candidates = v.video_files
      .filter((f) => /\.mp4/i.test(f.link))
      .sort((a, b) => b.height * b.width - a.height * a.width);
    return candidates[0]?.link ?? null;
  } catch (err) {
    logger.warn(`Pexels search failed: ${String(err)}`);
    return null;
  }
}

async function downloadToBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 90_000,
    });
    return Buffer.from(res.data);
  } catch (err) {
    logger.warn(`Download failed (${url}): ${String(err)}`);
    return null;
  }
}

async function fetchTmdbBackdrop(
  movieTitle: string,
  apiKey: string,
): Promise<Buffer | null> {
  try {
    const search = await axios.get<{ results: { backdrop_path?: string; poster_path?: string }[] }>(
      'https://api.themoviedb.org/3/search/movie',
      {
        params: { api_key: apiKey, query: movieTitle, include_adult: false },
        timeout: 15_000,
      },
    );
    const top = search.data.results?.[0];
    const path = top?.backdrop_path ?? top?.poster_path;
    if (!path) return null;
    const imgUrl = `https://image.tmdb.org/t/p/original${path}`;
    return await downloadToBuffer(imgUrl);
  } catch (err) {
    logger.warn(`TMDB lookup failed: ${String(err)}`);
    return null;
  }
}

/**
 * Loop/trim the given source clip to exactly `duration` seconds at 1080x1920,
 * cropping to portrait if needed. Returns mp4 buffer.
 */
async function normalizeClipToDuration(
  clip: Buffer,
  duration: number,
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'vacado-norm-'));
  const inPath = join(dir, 'in.mp4');
  const outPath = join(dir, 'out.mp4');
  try {
    await writeFile(inPath, clip);
    await run('ffmpeg', [
      '-y',
      '-stream_loop', '-1',
      '-i', 'in.mp4',
      '-t', String(duration),
      '-vf', `scale=${VIDEO_W}:${VIDEO_H}:force_original_aspect_ratio=increase,crop=${VIDEO_W}:${VIDEO_H}`,
      '-an',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      'out.mp4',
    ], dir);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/**
 * Animate a still image with Ken Burns (slow zoom-in + slight pan), output
 * 1080x1920 mp4 of the requested duration. Used when Pexels has no result
 * but TMDB has a movie backdrop/poster.
 */
async function kenBurnsFromImage(
  image: Buffer,
  duration: number,
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'vacado-kb-'));
  const inPath = join(dir, 'in.jpg');
  const outPath = join(dir, 'out.mp4');
  try {
    await writeFile(inPath, image);
    const fps = 30;
    const frames = duration * fps;
    // Upscale to 4x portrait so zoompan has plenty of pixels, then animate.
    const scaleW = VIDEO_W * 4;
    const scaleH = VIDEO_H * 4;
    const zoompan = `scale=${scaleW}:${scaleH}:force_original_aspect_ratio=increase,crop=${scaleW}:${scaleH},zoompan=z='min(zoom+0.0008,1.4)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${VIDEO_W}x${VIDEO_H}:fps=${fps}`;
    await run('ffmpeg', [
      '-y',
      '-loop', '1',
      '-i', 'in.jpg',
      '-t', String(duration),
      '-vf', zoompan,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-r', String(fps),
      'out.mp4',
    ], dir);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/**
 * Build an automatic background clip for a Short, with graceful fallbacks:
 *   1. Pexels search by clipStyle/tone keywords (themed stock b-roll)
 *   2. TMDB movie backdrop/poster + Ken Burns animation
 *   3. Empty buffer → composeVideo paints a solid branded backdrop
 *
 * The returned buffer (when non-empty) is already normalized to the target
 * vertical resolution and exact duration, so composeVideo just overlays
 * captions + voiceover on top.
 */
export async function buildAutoBackground(opts: {
  movieTitle: string;
  clipStyle?: string;
  tone?: string;
  duration: number;
}): Promise<Buffer> {
  const pexelsKey = await getSetting('PEXELS_API_KEY');
  if (pexelsKey) {
    const query = pexelsKeywords(opts.movieTitle, opts.clipStyle, opts.tone);
    const url = await searchPexelsVideoUrl(query, pexelsKey);
    if (url) {
      const raw = await downloadToBuffer(url);
      if (raw) {
        try {
          logger.info(`Auto background: Pexels clip used (${query})`);
          return await normalizeClipToDuration(raw, opts.duration);
        } catch (err) {
          logger.warn(`Pexels clip normalize failed: ${String(err)}`);
        }
      }
    }
  }

  const tmdbKey = await getSetting('TMDB_API_KEY');
  if (tmdbKey) {
    const image = await fetchTmdbBackdrop(opts.movieTitle, tmdbKey);
    if (image) {
      try {
        logger.info(`Auto background: TMDB Ken Burns used for "${opts.movieTitle}"`);
        return await kenBurnsFromImage(image, opts.duration);
      } catch (err) {
        logger.warn(`TMDB Ken Burns failed: ${String(err)}`);
      }
    }
  }

  logger.warn(
    `Auto background: no Pexels/TMDB result for "${opts.movieTitle}" — branded backdrop`,
  );
  return Buffer.alloc(0);
}
