import { Router } from 'express';
import * as c from '../controllers/shortsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkSubscriptionLimit } from '../middleware/checkSubscriptionLimit';
import { validateBody } from '../middleware/validate';
import { generateLimiter } from '../middleware/rateLimiter';

const r = Router();
r.use(authMiddleware);

r.post(
  '/generate',
  generateLimiter,
  validateBody(c.generateSchema),
  checkSubscriptionLimit,
  c.generate,
);
// User-uploaded source clip (multipart form, field name: "clip")
r.post('/upload-clip', c.uploadClipMiddleware, c.uploadClip);
r.get('/', c.list);
r.get('/plans', c.plans);
r.get('/:id', c.getOne);
r.get('/:id/download', c.download);
r.delete('/:id', c.remove);

export default r;
