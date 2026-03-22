import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.email || data.phone, {
    message: 'Either email or phone is required',
});

export const loginSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
}).refine(data => data.email || data.phone, {
    message: 'Either email or phone is required',
});

// Medicine schemas
export const createMedicineSchema = z.object({
    name: z.string().min(1, 'Medicine name is required'),
    expiryDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date'),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive').optional(),
    batchNumber: z.string().optional(),
});

export const updateMedicineSchema = z.object({
    name: z.string().min(1).optional(),
    expiryDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date').optional(),
    unitPrice: z.number().positive().optional(),
    batchNumber: z.string().optional(),
});

// Stock schemas
export const stockInSchema = z.object({
    medicineId: z.string().min(1, 'Medicine ID is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.enum(['ADDED', 'RETURNED']).default('ADDED'),
    notes: z.string().optional(),
});

export const stockOutSchema = z.object({
    medicineId: z.string().min(1, 'Medicine ID is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.enum(['SOLD', 'MANUAL_ADJUSTMENT', 'EXPIRED_REMOVAL']).default('SOLD'),
    notes: z.string().optional(),
});

// Validation helper
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
}
