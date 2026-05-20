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
r.get('/', c.list);
r.get('/plans', c.plans);
r.get('/:id', c.getOne);
r.get('/:id/download', c.download);
r.delete('/:id', c.remove);
r.post('/:id/publish', c.publish);
r.post('/:id/schedule', validateBody(c.scheduleSchema), c.schedule);

export default r;
