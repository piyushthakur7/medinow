import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Low stock check job
 * - Calculates current stock from ledger
 * - Creates alerts when stock falls below threshold
 * - Idempotent: one alert per medicine per 24-hour cycle
 */
export async function runLowStockCheckJob() {
    console.log('Starting low stock check job...');

    // Get all users with their medicines
    const users = await prisma.user.findMany({
        include: {
            medicines: {
                where: { isDeleted: false },
                include: {
                    movements: {
                        select: { type: true, quantity: true },
                    },
                },
            },
        },
    });

    let alertsCreated = 0;

    for (const user of users) {
        const prefs = user.alertPreferences as any;
        if (prefs?.lowStock === false) continue;

        for (const medicine of user.medicines) {
            // Calculate current stock from ledger
            const totalIn = medicine.movements
                .filter(m => m.type === 'IN')
                .reduce((sum, m) => sum + m.quantity, 0);
            const totalOut = medicine.movements
                .filter(m => m.type === 'OUT')
                .reduce((sum, m) => sum + m.quantity, 0);
            const currentStock = totalIn - totalOut;

            // Check if below threshold
            if (currentStock <= user.lowStockThreshold && currentStock > 0) {
                // Check for recent alert (within 24 hours)
                const recentAlert = await prisma.alert.findFirst({
                    where: {
                        userId: user.id,
                        medicineId: medicine.id,
                        alertType: 'LOW_STOCK',
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                });

                if (!recentAlert) {
                    await prisma.alert.create({
                        data: {
                            userId: user.id,
                            medicineId: medicine.id,
                            alertType: 'LOW_STOCK',
                            message: `Low stock: ${medicine.name} has only ${currentStock} units`,
                            metadata: {
                                currentStock,
                                threshold: user.lowStockThreshold,
                            },
                        },
                    });
                    alertsCreated++;
                }
            }
        }
    }

    console.log(`Low stock check complete: ${alertsCreated} alerts created`);

    return { alertsCreated };
}
