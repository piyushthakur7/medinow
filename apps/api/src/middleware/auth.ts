import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { createError } from './errorHandler.js';

export interface AuthRequest extends Request {
    userId?: string;
    user?: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        planType: string;
    };
}

export async function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createError('No token provided', 401, 'NO_TOKEN');
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'default-secret';

        const decoded = jwt.verify(token, secret) as { userId: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                planType: true,
            },
        });

        if (!user) {
            throw createError('User not found', 401, 'USER_NOT_FOUND');
        }

        req.userId = user.id;
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid token', code: 'INVALID_TOKEN' },
            });
        }
        next(error);
    }
}

// Plan-based feature gating
export function requirePlan(...allowedPlans: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authenticated', code: 'NOT_AUTHENTICATED' },
            });
        }

        if (!allowedPlans.includes(req.user.planType)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: `This feature requires ${allowedPlans.join(' or ')} plan`,
                    code: 'PLAN_REQUIRED',
                    requiredPlans: allowedPlans,
                },
            });
        }

        next();
    };
}
