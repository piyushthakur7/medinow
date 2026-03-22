import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth.js';
import medicineRoutes from './routes/medicines.js';
import stockRoutes from './routes/stock.js';
import alertRoutes from './routes/alerts.js';
import savingsRoutes from './routes/savings.js';

// Jobs
import { initializeJobs } from './jobs/index.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// CORS Configuration for Railway
const corsOptions = {
    origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3002']
        : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/savings', savingsRoutes);

// Error handler
app.use(errorHandler);

// Start server
async function start() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected');

        // Initialize background jobs
        initializeJobs();
        console.log('✅ Background jobs initialized');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export { prisma };
