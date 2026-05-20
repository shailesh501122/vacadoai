import { Router } from 'express';
import * as c from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validate';

const r = Router();
r.use(authMiddleware, requireAdmin);

r.get('/settings', c.getSettings);
r.put('/settings', validateBody(c.updateSettingsSchema), c.updateSettings);

export default r;
