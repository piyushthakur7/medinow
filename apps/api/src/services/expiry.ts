const EXPIRY_WARNING_DAYS = parseInt(process.env.EXPIRY_WARNING_DAYS || '30');

/**
 * Calculate expiry status based on expiry date
 * SAFE: More than 30 days
 * EXPIRING_SOON: 30 days or less
 * EXPIRED: Past expiry date
 */
export function calculateExpiryStatus(expiryDate: Date): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
        return 'EXPIRED';
    } else if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
        return 'EXPIRING_SOON';
    }
    return 'SAFE';
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
