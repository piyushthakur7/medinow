import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/savings/monthly - Get monthly savings
router.get('/monthly', async (req: AuthRequest, res: Response, next) => {
    try {
        const { months = '6' } = req.query;

        const savings = await prisma.monthlySavings.findMany({
            where: { userId: req.userId },
            orderBy: { monthYear: 'desc' },
            take: parseInt(months as string),
        });

        // Calculate total savings
        const totalSavings = savings.reduce(
            (sum, s) => sum + Number(s.totalSavings),
            0
        );

        res.json({
            success: true,
            data: {
                monthlySavings: savings,
                totalSavings,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/savings/current - Get current month savings progress
router.get('/current', async (req: AuthRequest, res: Response, next) => {
    try {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        let currentSavings = await prisma.monthlySavings.findUnique({
            where: {
                userId_monthYear: {
                    userId: req.userId!,
                    monthYear,
                },
            },
        });

        if (!currentSavings) {
            // Return empty savings for current month
            currentSavings = {
                id: '',
                userId: req.userId!,
                monthYear,
                expirySavings: new (prisma as any).$Decimal(0),
                overstockSavings: new (prisma as any).$Decimal(0),
                totalSavings: new (prisma as any).$Decimal(0),
                medicinesSaved: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;
        }

        res.json({
            success: true,
            data: { currentSavings },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/savings/details/:monthYear - Get detailed savings breakdown
router.get('/details/:monthYear', async (req: AuthRequest, res: Response, next) => {
    try {
        const { monthYear } = req.params;

        // Validate format
        if (!/^\d{4}-\d{2}$/.test(monthYear)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid month format. Use YYYY-MM' },
            });
        }

        const savings = await prisma.monthlySavings.findUnique({
            where: {
                userId_monthYear: {
                    userId: req.userId!,
                    monthYear,
                },
            },
        });

        if (!savings) {
            return res.json({
                success: true,
                data: {
                    savings: null,
                    message: 'No savings data for this month',
                },
            });
        }

        res.json({
            success: true,
            data: { savings },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
