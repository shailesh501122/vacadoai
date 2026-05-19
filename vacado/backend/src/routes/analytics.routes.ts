import { Router } from 'express';
import * as c from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const r = Router();
r.use(authMiddleware);

r.get('/overview', c.overview);
r.get('/performance', c.performance);
r.get('/languages', c.languages);

export default r;
