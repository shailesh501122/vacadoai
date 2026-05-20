import OpenAI from 'openai';
import axios from 'axios';
import { env, hasOpenAI } from '../config/env';
import { logger } from '../utils/logger';
import { makeThumbnail } from './videoService';

const openai = hasOpenAI()
  ? new OpenAI({ apiKey: env.openaiKey, baseURL: env.openaiBaseUrl })
  : null;
const MODEL = env.openaiModel;

export interface ScriptParams {
  movieTitle: string;
  language: string;
  clipStyle?: string;
  tone?: string;
  duration: number;
}

/** Deterministic, no-API script so the pipeline always completes. */
function templateScript(p: ScriptParams): string {
  const s = `Ever wondered what really happens in ${p.movieTitle}? This ${
    p.clipStyle ?? 'plot-twist'
  } scene changes everything. In a ${
    p.tone ?? 'dramatic'
  } turn, the story flips on its head and the meaning you thought you understood is suddenly something else entirely. Watch closely — every detail here was planted from the very first frame. By the end of these ${
    p.duration
  } seconds you will never see ${p.movieTitle} the same way again. Follow for more breakdowns that decode the films everyone is talking about.`;
  return s.slice(0, 600);
}

/** GPT-4o: 400–600 char movie-explainer script in the target language. */
export async function generateScript(p: ScriptParams): Promise<string> {
  if (!openai) {
    logger.warn('OPENAI_API_KEY not set — using templated script');
    return templateScript(p);
  }
  try {
    const prompt = `Write a punchy YouTube Shorts narration script explaining a ${
      p.clipStyle ?? 'plot-twist'
    } moment from the movie "${p.movieTitle}". Tone: ${
      p.tone ?? 'dramatic'
    }. Spoken in ${p.language}, hook-first, ~${
      p.duration
    } seconds, 400-600 characters. Output only the narration text.`;
    const res = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a viral short-form scriptwriter for movie-explanation channels.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });
    const text = res.choices[0]?.message?.content?.trim();
    return text ? text.slice(0, 600) : templateScript(p);
  } catch (err) {
    logger.warn(`OpenAI script failed, using template: ${String(err)}`);
    return templateScript(p);
  }
}

/** DALL·E thumbnail when configured; otherwise a locally-rendered one. */
export async function generateThumbnail(
  movieTitle: string,
  hook: string,
): Promise<Buffer> {
  if (openai) {
    try {
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `Cinematic YouTube Shorts thumbnail for a movie-explanation video about "${movieTitle}". Bold dramatic lighting, high contrast, vertical 9:16, no watermark.`,
        size: '1024x1792',
        quality: 'standard',
        n: 1,
      });
      const url = res.data?.[0]?.url;
      if (url) {
        const img = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
        return Buffer.from(img.data);
      }
    } catch (err) {
      logger.warn(`DALL·E failed, rendering local thumbnail: ${String(err)}`);
    }
  }
  return makeThumbnail(hook || movieTitle);
}

/** Auto title + hashtags; falls back to a sensible default without a key. */
export async function generateMetadata(
  movieTitle: string,
  language: string,
): Promise<{ title: string; hashtags: string }> {
  const fallback = {
    title: `${movieTitle} — Ending Explained`,
    hashtags: `#${movieTitle.replace(/\s+/g, '').toLowerCase()} #movieexplained #shorts`,
  };
  if (!openai) return fallback;
  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Give a viral YouTube Shorts title (<80 chars) and 6 lowercase hashtags for a ${language} movie-explanation Short about "${movieTitle}". Return JSON: {"title":"...","hashtags":"#a #b ..."}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}');
    return {
      title: parsed.title ?? fallback.title,
      hashtags: parsed.hashtags ?? fallback.hashtags,
    };
  } catch (err) {
    logger.warn(`metadata generation fell back to defaults: ${String(err)}`);
    return fallback;
  }
}
