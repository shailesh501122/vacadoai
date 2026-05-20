import { Router } from 'express';
import authRoutes from './auth.routes';
import shortsRoutes from './shorts.routes';
import subscriptionsRoutes from './subscriptions.routes';
import analyticsRoutes from './analytics.routes';
import apiKeysRoutes from './apiKeys.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/shorts', shortsRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/api-keys', apiKeysRoutes);
router.use('/admin', adminRoutes);

export default router;
