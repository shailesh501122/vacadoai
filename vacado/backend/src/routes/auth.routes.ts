import { Router } from 'express';
import * as c from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { authMiddleware } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';

const r = Router();

r.post('/register', authLimiter, validateBody(c.registerSchema), c.register);
r.post('/login', authLimiter, validateBody(c.loginSchema), c.login);
r.post('/google/callback', authLimiter, c.googleCallback);
r.get('/me', authMiddleware, c.me);
r.post('/logout', c.logout);

export default r;
