import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Monthly savings aggregation job
 * - Calculates savings from medicines used before expiry
 * - Aggregates into MonthlySavings table
 * - Creates "You Saved" notification
 */
export async function runMonthlySavingsJob() {
    console.log('Starting monthly savings aggregation job...');

    // Get previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthYear = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const monthStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const monthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59);

    console.log(`Calculating savings for: ${monthYear}`);

    // Get all users
    const users = await prisma.user.findMany({
        select: { id: true, alertPreferences: true },
    });

    let savingsCreated = 0;

    for (const user of users) {
        // Find medicines that were marked as expiring_soon and had stock OUT before expiry
        const expiringMedicines = await prisma.medicine.findMany({
            where: {
                userId: user.id,
                expiryStatus: { in: ['EXPIRING_SOON', 'EXPIRED'] },
                unitPrice: { not: null },
            },
            include: {
                movements: {
                    where: {
                        type: 'OUT',
                        reason: 'SOLD',
                        timestamp: {
                            gte: monthStart,
                            lte: monthEnd,
                        },
                    },
                },
            },
        });

        let expirySavings = 0;
        let medicinesSaved = 0;

        for (const medicine of expiringMedicines) {
            const unitsSold = medicine.movements.reduce((sum, m) => sum + m.quantity, 0);

            if (unitsSold > 0 && medicine.unitPrice) {
                const savings = unitsSold * Number(medicine.unitPrice);
                expirySavings += savings;
                medicinesSaved++;
            }
        }

        // Only create savings record if there are actual savings
        if (expirySavings > 0) {
            await prisma.monthlySavings.upsert({
                where: {
                    userId_monthYear: {
                        userId: user.id,
                        monthYear,
                    },
                },
                create: {
                    userId: user.id,
                    monthYear,
                    expirySavings,
                    overstockSavings: 0,
                    totalSavings: expirySavings,
                    medicinesSaved,
                },
                update: {
                    expirySavings,
                    totalSavings: expirySavings,
                    medicinesSaved,
                },
            });

            // Create savings notification
            const prefs = user.alertPreferences as any;
            if (prefs?.savings !== false) {
                await prisma.alert.create({
                    data: {
                        userId: user.id,
                        alertType: 'SAVINGS_SUMMARY',
                        message: `🎉 You saved ₹${expirySavings.toLocaleString('en-IN')} in ${monthYear} by preventing ${medicinesSaved} medicine(s) from expiring!`,
                        metadata: {
                            monthYear,
                            expirySavings,
                            medicinesSaved,
                        },
                    },
                });
            }

            savingsCreated++;
        }
    }

    console.log(`Monthly savings complete: ${savingsCreated} savings records created`);

    return { savingsCreated, monthYear };
}
