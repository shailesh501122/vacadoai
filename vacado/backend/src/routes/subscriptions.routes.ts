import { Router } from 'express';
import * as c from '../controllers/subscriptionsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';

const r = Router();

r.get('/me', authMiddleware, c.mySubscription);
r.post('/checkout', authMiddleware, validateBody(c.checkoutSchema), c.checkout);
r.post('/portal', authMiddleware, c.portal);
// Webhook body is raw — mounted in app.ts before json parser.
r.post('/webhook', c.webhook);

export default r;
