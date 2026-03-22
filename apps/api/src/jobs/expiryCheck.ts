import { PrismaClient } from '@prisma/client';
import { calculateExpiryStatus, getDaysUntilExpiry } from '../services/expiry.js';

const prisma = new PrismaClient();

/**
 * Daily expiry check job
 * - Updates expiry status for all medicines
 * - Creates alerts for newly expiring medicines
 * - Idempotent: no duplicate alerts
 */
export async function runExpiryCheckJob() {
    console.log('Starting expiry check job...');

    // Get all active medicines
    const medicines = await prisma.medicine.findMany({
        where: { isDeleted: false },
        include: {
            user: { select: { id: true, alertPreferences: true } },
        },
    });

    let updated = 0;
    let alertsCreated = 0;

    for (const medicine of medicines) {
        const newStatus = calculateExpiryStatus(medicine.expiryDate);
        const previousStatus = medicine.expiryStatus;

        // Update status if changed
        if (newStatus !== previousStatus) {
            await prisma.medicine.update({
                where: { id: medicine.id },
                data: { expiryStatus: newStatus },
            });
            updated++;

            // Create alert if medicine is now expiring or expired
            if (
                (newStatus === 'EXPIRING_SOON' || newStatus === 'EXPIRED') &&
                previousStatus === 'SAFE'
            ) {
                // Check if user has expiry alerts enabled
                const prefs = medicine.user.alertPreferences as any;
                if (prefs?.expiry !== false) {
                    // Check if alert already exists for this status change
                    const existingAlert = await prisma.alert.findFirst({
                        where: {
                            userId: medicine.user.id,
                            medicineId: medicine.id,
                            alertType: 'EXPIRY',
                            createdAt: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                            },
                        },
                    });

                    if (!existingAlert) {
                        const daysLeft = getDaysUntilExpiry(medicine.expiryDate);
                        const message =
                            newStatus === 'EXPIRED'
                                ? `${medicine.name} has expired!`
                                : `${medicine.name} expires in ${daysLeft} days`;

                        await prisma.alert.create({
                            data: {
                                userId: medicine.user.id,
                                medicineId: medicine.id,
                                alertType: 'EXPIRY',
                                message,
                                metadata: {
                                    expiryDate: medicine.expiryDate.toISOString(),
                                    daysLeft,
                                    status: newStatus,
                                },
                            },
                        });
                        alertsCreated++;
                    }
                }
            }
        }
    }

    console.log(`Expiry check complete: ${updated} medicines updated, ${alertsCreated} alerts created`);

    return { updated, alertsCreated };
}
