import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { createMedicineSchema, updateMedicineSchema, validate } from '../utils/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { calculateExpiryStatus } from '../services/expiry.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/medicines - List all medicines for user
router.get('/', async (req: AuthRequest, res: Response, next) => {
    try {
        const { search, status, sortBy = 'expiryDate', order = 'asc' } = req.query;

        const medicines = await prisma.medicine.findMany({
            where: {
                userId: req.userId,
                isDeleted: false,
                ...(search && {
                    name: { contains: search as string, mode: 'insensitive' },
                }),
                ...(status && { expiryStatus: status as any }),
            },
            include: {
                movements: {
                    select: { type: true, quantity: true },
                },
            },
            orderBy: { [sortBy as string]: order },
        });

        // Calculate current stock from ledger
        const medicinesWithStock = medicines.map(med => {
            const totalIn = med.movements
                .filter(m => m.type === 'IN')
                .reduce((sum, m) => sum + m.quantity, 0);
            const totalOut = med.movements
                .filter(m => m.type === 'OUT')
                .reduce((sum, m) => sum + m.quantity, 0);

            const { movements, ...medicineData } = med;
            return {
                ...medicineData,
                currentStock: totalIn - totalOut,
            };
        });

        res.json({
            success: true,
            data: { medicines: medicinesWithStock, count: medicinesWithStock.length },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/medicines/search - Search medicine master for autocomplete
router.get('/search', async (req: AuthRequest, res: Response, next) => {
    try {
        const { q } = req.query;

        if (!q || (q as string).length < 2) {
            return res.json({ success: true, data: { suggestions: [] } });
        }

        const suggestions = await prisma.medicineMaster.findMany({
            where: {
                name: { contains: q as string, mode: 'insensitive' },
            },
            orderBy: { searchCount: 'desc' },
            take: 10,
        });

        res.json({
            success: true,
            data: { suggestions },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/medicines/:id - Get single medicine
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const medicine = await prisma.medicine.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId,
                isDeleted: false,
            },
            include: {
                movements: {
                    orderBy: { timestamp: 'desc' },
                    take: 20,
                },
            },
        });

        if (!medicine) {
            throw createError('Medicine not found', 404, 'NOT_FOUND');
        }

        // Calculate current stock
        const allMovements = await prisma.stockMovement.findMany({
            where: { medicineId: medicine.id },
        });

        const totalIn = allMovements
            .filter(m => m.type === 'IN')
            .reduce((sum, m) => sum + m.quantity, 0);
        const totalOut = allMovements
            .filter(m => m.type === 'OUT')
            .reduce((sum, m) => sum + m.quantity, 0);

        res.json({
            success: true,
            data: {
                medicine: {
                    ...medicine,
                    currentStock: totalIn - totalOut,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/medicines - Add new medicine
router.post('/', async (req: AuthRequest, res: Response, next) => {
    try {
        const validation = validate(createMedicineSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: validation.errors },
            });
        }

        const { name, expiryDate, quantity, unitPrice, batchNumber } = validation.data;
        const expiryStatus = calculateExpiryStatus(new Date(expiryDate));

        // Create medicine with initial stock movement
        const medicine = await prisma.$transaction(async (tx) => {
            const med = await tx.medicine.create({
                data: {
                    userId: req.userId!,
                    name,
                    expiryDate: new Date(expiryDate),
                    unitPrice,
                    batchNumber,
                    expiryStatus,
                },
            });

            // Create initial IN movement
            await tx.stockMovement.create({
                data: {
                    medicineId: med.id,
                    type: 'IN',
                    quantity,
                    reason: 'ADDED',
                },
            });

            // Update medicine master search count
            await tx.medicineMaster.updateMany({
                where: { name: { equals: name, mode: 'insensitive' } },
                data: { searchCount: { increment: 1 } },
            });

            return med;
        });

        res.status(201).json({
            success: true,
            data: {
                medicine: { ...medicine, currentStock: quantity },
            },
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/medicines/:id - Update medicine
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const validation = validate(updateMedicineSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: validation.errors },
            });
        }

        // Verify ownership
        const existing = await prisma.medicine.findFirst({
            where: { id: req.params.id, userId: req.userId, isDeleted: false },
        });

        if (!existing) {
            throw createError('Medicine not found', 404, 'NOT_FOUND');
        }

        const { name, expiryDate, unitPrice, batchNumber } = validation.data;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (expiryDate) {
            updateData.expiryDate = new Date(expiryDate);
            updateData.expiryStatus = calculateExpiryStatus(new Date(expiryDate));
        }
        if (unitPrice !== undefined) updateData.unitPrice = unitPrice;
        if (batchNumber !== undefined) updateData.batchNumber = batchNumber;

        const medicine = await prisma.medicine.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.json({
            success: true,
            data: { medicine },
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/medicines/:id - Soft delete medicine
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        // Verify ownership
        const existing = await prisma.medicine.findFirst({
            where: { id: req.params.id, userId: req.userId, isDeleted: false },
        });

        if (!existing) {
            throw createError('Medicine not found', 404, 'NOT_FOUND');
        }

        // Soft delete
        await prisma.medicine.update({
            where: { id: req.params.id },
            data: { isDeleted: true },
        });

        res.json({
            success: true,
            message: 'Medicine deleted',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
