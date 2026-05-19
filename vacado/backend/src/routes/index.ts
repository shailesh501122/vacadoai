import { Router } from 'express';
import authRoutes from './auth.routes';
import shortsRoutes from './shorts.routes';
import channelsRoutes from './channels.routes';
import subscriptionsRoutes from './subscriptions.routes';
import analyticsRoutes from './analytics.routes';
import apiKeysRoutes from './apiKeys.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/shorts', shortsRoutes);
router.use('/channels', channelsRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/api-keys', apiKeysRoutes);

export default router;
