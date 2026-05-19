import OpenAI from 'openai';
import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: env.openaiKey });

export interface ScriptParams {
  movieTitle: string;
  language: string;
  clipStyle?: string;
  tone?: string;
  duration: number;
}

/** GPT-4o: generate a 400–600 char movie-explainer script in the target language. */
export async function generateScript(p: ScriptParams): Promise<string> {
  const prompt = `Write a punchy YouTube Shorts narration script explaining a ${
    p.clipStyle ?? 'plot-twist'
  } moment from the movie "${p.movieTitle}". Tone: ${
    p.tone ?? 'dramatic'
  }. It must be spoken in ${p.language}, hook-first, fit ~${
    p.duration
  } seconds of speech, and be between 400 and 600 characters. Output only the narration text, no headings or stage directions.`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a viral short-form scriptwriter for movie-explanation channels.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 400,
  });

  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenAI returned an empty script');
  return text.slice(0, 600);
}

/** DALL·E 3: generate a 9:16 thumbnail; returns a remote image URL. */
export async function generateThumbnail(
  movieTitle: string,
  hook: string,
): Promise<Buffer> {
  const res = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Cinematic YouTube Shorts thumbnail for a movie-explanation video about "${movieTitle}". Bold dramatic lighting, high contrast, space for large overlay text reading "${hook}". Vertical 9:16, no watermark.`,
    size: '1024x1792',
    quality: 'standard',
    n: 1,
  });
  const url = res.data?.[0]?.url;
  if (!url) throw new Error('DALL·E returned no image');
  const img = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
  return Buffer.from(img.data);
}

/** Auto-generate title + hashtags from the movie + hook. */
export async function generateMetadata(
  movieTitle: string,
  language: string,
): Promise<{ title: string; hashtags: string }> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      title: parsed.title ?? `${movieTitle} Explained`,
      hashtags: parsed.hashtags ?? `#${movieTitle.replace(/\s+/g, '').toLowerCase()} #movieexplained`,
    };
  } catch (err) {
    logger.warn(`metadata generation fell back to defaults: ${String(err)}`);
    return {
      title: `${movieTitle} — Ending Explained`,
      hashtags: `#${movieTitle.replace(/\s+/g, '').toLowerCase()} #movieexplained #shorts`,
    };
  }
}
