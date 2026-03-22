import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { signupSchema, loginSchema, validate } from '../utils/validation.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
    try {
        const validation = validate(signupSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: validation.errors },
            });
        }

        const { name, email, phone, password } = validation.data;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    email ? { email } : {},
                    phone ? { phone } : {},
                ].filter(c => Object.keys(c).length > 0),
            },
        });

        if (existingUser) {
            throw createError('User already exists with this email or phone', 400, 'USER_EXISTS');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                planType: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            data: { user, token },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const validation = validate(loginSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: validation.errors },
            });
        }

        const { email, phone, password } = validation.data;

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    email ? { email } : {},
                    phone ? { phone } : {},
                ].filter(c => Object.keys(c).length > 0),
            },
        });

        if (!user) {
            throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    planType: user.planType,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                planType: true,
                alertPreferences: true,
                lowStockThreshold: true,
                createdAt: true,
            },
        });

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/auth/me - Update user profile
router.put('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { name, alertPreferences, lowStockThreshold } = req.body;

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: {
                ...(name && { name }),
                ...(alertPreferences && { alertPreferences }),
                ...(lowStockThreshold && { lowStockThreshold }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                planType: true,
                alertPreferences: true,
                lowStockThreshold: true,
            },
        });

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
