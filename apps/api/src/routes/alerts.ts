import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/alerts - Get user's alerts
router.get('/', async (req: AuthRequest, res: Response, next) => {
    try {
        const { status, type, limit = '50', offset = '0' } = req.query;

        const alerts = await prisma.alert.findMany({
            where: {
                userId: req.userId,
                ...(status && { status: status as any }),
                ...(type && { alertType: type as any }),
            },
            include: {
                medicine: {
                    select: { id: true, name: true, expiryDate: true, expiryStatus: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });

        const unreadCount = await prisma.alert.count({
            where: {
                userId: req.userId,
                status: { not: 'READ' },
            },
        });

        res.json({
            success: true,
            data: {
                alerts,
                unreadCount,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/alerts/summary - Get alert summary counts
router.get('/summary', async (req: AuthRequest, res: Response, next) => {
    try {
        const [expiryCount, lowStockCount, unreadCount] = await Promise.all([
            prisma.alert.count({
                where: {
                    userId: req.userId,
                    alertType: 'EXPIRY',
                    status: { not: 'READ' },
                },
            }),
            prisma.alert.count({
                where: {
                    userId: req.userId,
                    alertType: 'LOW_STOCK',
                    status: { not: 'READ' },
                },
            }),
            prisma.alert.count({
                where: {
                    userId: req.userId,
                    status: { not: 'READ' },
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                expiry: expiryCount,
                lowStock: lowStockCount,
                total: unreadCount,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/alerts/mark-read - Mark alerts as read
router.post('/mark-read', async (req: AuthRequest, res: Response, next) => {
    try {
        const { alertIds } = req.body;

        if (!alertIds || !Array.isArray(alertIds)) {
            return res.status(400).json({
                success: false,
                error: { message: 'alertIds array is required' },
            });
        }

        // Mark alerts as read (only user's own alerts)
        await prisma.alert.updateMany({
            where: {
                id: { in: alertIds },
                userId: req.userId,
            },
            data: {
                status: 'READ',
                readAt: new Date(),
            },
        });

        res.json({
            success: true,
            message: `${alertIds.length} alert(s) marked as read`,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/alerts/mark-all-read - Mark all alerts as read
router.post('/mark-all-read', async (req: AuthRequest, res: Response, next) => {
    try {
        const result = await prisma.alert.updateMany({
            where: {
                userId: req.userId,
                status: { not: 'READ' },
            },
            data: {
                status: 'READ',
                readAt: new Date(),
            },
        });

        res.json({
            success: true,
            message: `${result.count} alert(s) marked as read`,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
