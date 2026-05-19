import { Router } from 'express';
import * as c from '../controllers/apiKeysController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireApiAccess } from '../middleware/checkSubscriptionLimit';
import { validateBody } from '../middleware/validate';

const r = Router();
r.use(authMiddleware, requireApiAccess);

r.get('/', c.list);
r.post('/', validateBody(c.createKeySchema), c.create);
r.delete('/:id', c.revoke);

export default r;
