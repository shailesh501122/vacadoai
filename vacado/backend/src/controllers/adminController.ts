import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthedRequest } from '../middleware/authMiddleware';
import {
  SETTING_KEYS,
  SettingKey,
  maskedSettings,
  setSettings,
} from '../services/settingsService';

export async function getSettings(
  _req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({ settings: await maskedSettings() });
  } catch (err) {
    next(err);
  }
}

export const updateSettingsSchema = z.object({
  // Each field optional; empty string deletes the DB row (env fallback returns).
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
});

export async function updateSettings(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as z.infer<typeof updateSettingsSchema>;
    // Trim and filter to known keys to be safe.
    const updates: Partial<Record<SettingKey, string>> = {};
    for (const key of SETTING_KEYS) {
      if (key in body) {
        const v = body[key];
        if (v !== undefined) updates[key] = v.trim();
      }
    }
    await setSettings(updates);
    res.json({ settings: await maskedSettings() });
  } catch (err) {
    next(err);
  }
}
