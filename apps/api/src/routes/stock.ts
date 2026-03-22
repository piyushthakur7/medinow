import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { stockInSchema, stockOutSchema, validate } from '../utils/validation.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get current stock for a medicine (calculated from ledger)
 */
async function getCurrentStock(medicineId: string): Promise<number> {
    const movements = await prisma.stockMovement.findMany({
        where: { medicineId },
        select: { type: true, quantity: true },
    });

    const totalIn = movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + m.quantity, 0);

    return totalIn - totalOut;
}

// POST /api/stock/in - Record stock IN
router.post('/in', async (req: AuthRequest, res: Response, next) => {
    try {
        const validation = validate(stockInSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: validation.errors },
            });
        }

        const { medicineId, quantity, reason, notes } = validation.data;

        // Verify medicine ownership
        const medicine = await prisma.medicine.findFirst({
            where: { id: medicineId, userId: req.userId, isDeleted: false },
        });

        if (!medicine) {
            throw createError('Medicine not found', 404, 'NOT_FOUND');
        }

        // Create stock movement
        const movement = await prisma.stockMovement.create({
            data: {
                medicineId,
                type: 'IN',
                quantity,
                reason,
                notes,
            },
        });

        const currentStock = await getCurrentStock(medicineId);

        res.status(201).json({
            success: true,
            data: {
                movement,
                currentStock,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/stock/out - Record stock OUT
router.post('/out', async (req: AuthRequest, res: Response, next) => {
    try {
        const validation = validate(stockOutSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: validation.errors },
            });
        }

        const { medicineId, quantity, reason, notes } = validation.data;

        // Verify medicine ownership
        const medicine = await prisma.medicine.findFirst({
            where: { id: medicineId, userId: req.userId, isDeleted: false },
        });

        if (!medicine) {
            throw createError('Medicine not found', 404, 'NOT_FOUND');
        }

        // Check if we have enough stock
        const currentStock = await getCurrentStock(medicineId);
        if (currentStock < quantity) {
            throw createError(
                `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`,
                400,
                'INSUFFICIENT_STOCK'
            );
        }

        // Create stock movement
        const movement = await prisma.stockMovement.create({
            data: {
                medicineId,
                type: 'OUT',
                quantity,
                reason,
                notes,
            },
        });

        const newStock = currentStock - quantity;

        // Check if low stock alert needed
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { lowStockThreshold: true },
        });

        if (user && newStock <= user.lowStockThreshold) {
            // Check if there's a recent low stock alert
            const recentAlert = await prisma.alert.findFirst({
                where: {
                    userId: req.userId,
                    medicineId,
                    alertType: 'LOW_STOCK',
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                    },
                },
            });

            if (!recentAlert) {
                await prisma.alert.create({
                    data: {
                        userId: req.userId!,
                        medicineId,
                        alertType: 'LOW_STOCK',
                        message: `Low stock alert: ${medicine.name} has only ${newStock} units left`,
                        metadata: { stock: newStock, threshold: user.lowStockThreshold },
                    },
                });
            }
        }

        res.status(201).json({
            success: true,
            data: {
                movement,
                currentStock: newStock,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/stock/history - Get stock movement history
router.get('/history', async (req: AuthRequest, res: Response, next) => {
    try {
        const { medicineId, limit = '50', offset = '0' } = req.query;

        // Build query based on medicine ID or all user's medicines
        let whereClause: any = {};

        if (medicineId) {
            // Verify medicine ownership
            const medicine = await prisma.medicine.findFirst({
                where: { id: medicineId as string, userId: req.userId },
            });

            if (!medicine) {
                throw createError('Medicine not found', 404, 'NOT_FOUND');
            }

            whereClause = { medicineId: medicineId as string };
        } else {
            // Get all movements for user's medicines
            const userMedicines = await prisma.medicine.findMany({
                where: { userId: req.userId },
                select: { id: true },
            });

            whereClause = {
                medicineId: { in: userMedicines.map(m => m.id) },
            };
        }

        const movements = await prisma.stockMovement.findMany({
            where: whereClause,
            include: {
                medicine: {
                    select: { name: true },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });

        const total = await prisma.stockMovement.count({ where: whereClause });

        res.json({
            success: true,
            data: {
                movements,
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
