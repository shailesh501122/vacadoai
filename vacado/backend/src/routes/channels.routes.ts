import { Router } from 'express';
import * as c from '../controllers/channelsController';
import { authMiddleware } from '../middleware/authMiddleware';

const r = Router();

// OAuth callback is hit by Google's redirect (no Bearer token).
r.get('/callback', c.callback);

r.use(authMiddleware);
r.get('/', c.list);
r.post('/connect', c.connect);
r.delete('/:id', c.remove);
r.patch('/:id/toggle', c.toggle);

export default r;
