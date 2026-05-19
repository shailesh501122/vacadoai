import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { PLANS } from '../config/plans';
import { signToken, AuthedRequest } from '../middleware/authMiddleware';
import { httpError } from '../utils/helpers';
import { sendEmail, emails } from '../services/emailService';

const googleClient = new OAuth2Client(env.google.clientId);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function createTrialSubscription(userId: string) {
  const def = PLANS.STARTER;
  return prisma.subscription.create({
    data: {
      userId,
      plan: 'STARTER',
      status: 'TRIALING',
      shortsLimit: def.shortsLimit,
      channelLimit: def.channelLimit,
      languageLimit: def.languageLimit,
      apiAccess: def.apiAccess,
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, name } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw httpError(409, 'Email already registered');

    const user = await prisma.user.create({
      data: { email, name, passwordHash: await bcrypt.hash(password, 12) },
    });
    await createTrialSubscription(user.id);
    await sendEmail(email, 'Welcome to Vacado', emails.welcome(name)).catch(
      () => undefined,
    );

    const token = signToken(user.id);
    setCookie(res, token);
    res.status(201).json({ token, user: { id: user.id, email, name } });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw httpError(401, 'Invalid credentials');
    }
    const token = signToken(user.id);
    setCookie(res, token);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) throw httpError(400, 'Missing Google credential');
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.google.clientId,
    });
    const p = ticket.getPayload();
    if (!p?.email) throw httpError(400, 'Google account has no email');

    let user = await prisma.user.findUnique({ where: { email: p.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: p.email,
          name: p.name ?? p.email.split('@')[0],
          googleId: p.sub,
          avatarUrl: p.picture,
        },
      });
      await createTrialSubscription(user.id);
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: p.sub, avatarUrl: p.picture ?? user.avatarUrl },
      });
    }

    const token = signToken(user.id);
    setCookie(res, token);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        subscription: true,
      },
    });
    if (!user) throw httpError(404, 'User not found');
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie('token');
  res.json({ ok: true });
}
