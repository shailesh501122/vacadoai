import { prisma } from '../config/db';
import { logger } from '../utils/logger';

/**
 * Hot-reloadable app settings, edited from the admin UI.
 *
 * Resolution order per key:
 *   1. `app_settings` row (set via the admin UI)
 *   2. Environment variable of the same name
 *   3. Empty string
 *
 * A short in-memory TTL cache keeps the read cost negligible — the worker
 * picks up new keys within ~30s of an admin save, no restart needed.
 */

export const SETTING_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_MODEL',
  'ELEVENLABS_API_KEY',
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

const TTL_MS = 30_000;
const cache = new Map<string, { value: string; at: number }>();

export async function getSetting(key: SettingKey): Promise<string> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL_MS) return c.value;
  const row = await prisma.appSetting.findUnique({ where: { key } }).catch((e) => {
    logger.warn(`settings lookup failed for ${key}: ${String(e)}`);
    return null;
  });
  const value = row?.value || process.env[key] || '';
  cache.set(key, { value, at: Date.now() });
  return value;
}

export async function setSettings(
  updates: Partial<Record<SettingKey, string>>,
): Promise<void> {
  for (const [k, v] of Object.entries(updates)) {
    const key = k as SettingKey;
    if (!SETTING_KEYS.includes(key)) continue;
    const value = (v ?? '').toString();
    if (value === '') {
      await prisma.appSetting.delete({ where: { key } }).catch(() => undefined);
    } else {
      await prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    cache.delete(key);
  }
}

export interface MaskedSetting {
  key: SettingKey;
  isSet: boolean;
  preview: string; // e.g. "gsk_…6gZI"
  fromDb: boolean;
}

export async function maskedSettings(): Promise<MaskedSetting[]> {
  const out: MaskedSetting[] = [];
  for (const key of SETTING_KEYS) {
    const dbRow = await prisma.appSetting
      .findUnique({ where: { key } })
      .catch(() => null);
    const env = process.env[key] ?? '';
    const value = dbRow?.value || env;
    out.push({
      key,
      isSet: Boolean(value),
      preview: value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '',
      fromDb: Boolean(dbRow?.value),
    });
  }
  return out;
}
