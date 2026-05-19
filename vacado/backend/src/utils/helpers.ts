import crypto from 'crypto';

export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const httpError = (status: number, message: string) =>
  new AppError(status, message);

/** Generate a Vacado API key + its sha256 hash for storage. */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = crypto.randomBytes(24).toString('hex');
  const key = `vcd_${raw}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, hash, prefix: key.slice(0, 11) };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function paginate(query: { page?: unknown; limit?: unknown }) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(query.limit ?? '10'), 10) || 10),
  );
  return { page, limit, skip: (page - 1) * limit };
}
