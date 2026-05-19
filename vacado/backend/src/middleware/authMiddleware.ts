import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { hashApiKey, httpError } from '../utils/helpers';

export interface AuthedRequest extends Request {
  userId?: string;
}

export interface JwtPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

/** Accepts a Bearer JWT, a vacado API key, or the auth cookie. */
export async function authMiddleware(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

    if (apiKeyHeader || header?.startsWith('vcd_')) {
      const raw = apiKeyHeader ?? header!;
      const record = await prisma.apiKey.findUnique({
        where: { keyHash: hashApiKey(raw) },
      });
      if (!record) throw httpError(401, 'Invalid API key');
      await prisma.apiKey.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() },
      });
      req.userId = record.userId;
      return next();
    }

    const token =
      header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
    if (!token) throw httpError(401, 'Authentication required');

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.userId = payload.sub;
    next();
  } catch (err) {
    if (err instanceof Error && err.name === 'JsonWebTokenError') {
      return next(httpError(401, 'Invalid token'));
    }
    next(err);
  }
}
