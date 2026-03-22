
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_USER = {
    id: 'user_123',
    name: 'Test Pharmacist',
    email: 'test@example.com',
    phone: '9876543210',
    planType: 'FREE',
};

const MOCK_MEDICINES = [
    {
        id: 'med_1',
        name: 'Paracetamol 500mg',
        currentStock: 150,
        expiryDate: '2026-12-01T00:00:00.000Z',
        expiryStatus: 'SAFE',
        unitPrice: 2.5,
    },
    {
        id: 'med_2',
        name: 'Amoxicillin 250mg',
        currentStock: 8,
        expiryDate: '2026-04-15T00:00:00.000Z',
        expiryStatus: 'EXPIRING_SOON',
        unitPrice: 12.0,
    },
    {
        id: 'med_3',
        name: 'Cetirizine 10mg',
        currentStock: 45,
        expiryDate: '2025-10-20T00:00:00.000Z',
        expiryStatus: 'EXPIRED',
        unitPrice: 1.5,
    },
    {
        id: 'med_4',
        name: 'Metformin 500mg',
        currentStock: 200,
        expiryDate: '2027-01-10T00:00:00.000Z',
        expiryStatus: 'SAFE',
        unitPrice: 5.0,
    },
];

const MOCK_ALERTS = [
    {
        id: 'alert_1',
        alertType: 'LOW_STOCK',
        status: 'PENDING',
        message: 'Amoxicillin 250mg is low on stock (8 remaining)',
        createdAt: new Date().toISOString(),
        metadata: { medicineName: 'Amoxicillin 250mg', currentStock: 8 },
    },
    {
        id: 'alert_2',
        alertType: 'EXPIRY',
        status: 'PENDING',
        message: 'Cetirizine 10mg has expired on 20 Oct 2025',
        createdAt: new Date().toISOString(),
        metadata: { medicineName: 'Cetirizine 10mg', expiryDate: '2025-10-20' },
    },
];

const MOCK_SAVINGS = {
    monthYear: '2026-03',
    expirySavings: 1250.0,
    overstockSavings: 450.0,
    totalSavings: 1700.0,
    medicinesSaved: 12,
};

export async function mockRequest(endpoint: string, options: any = {}) {
    console.log(`[MOCK API] ${options.method || 'GET'} ${endpoint}`, options.body);
    await sleep(800);

    if (endpoint === '/auth/login' || endpoint === '/auth/signup') {
        return {
            success: true,
            data: {
                user: MOCK_USER,
                token: 'mock_token_abc123',
            },
        };
    }

    if (endpoint === '/auth/me') {
        return {
            success: true,
            data: { user: MOCK_USER },
        };
    }

    if (endpoint === '/medicines') {
        if (options.method === 'POST') {
            const body = JSON.parse(options.body);
            return {
                success: true,
                data: { ...body, id: `med_${Math.random()}`, currentStock: 0, expiryStatus: 'SAFE' },
            };
        }
        return {
            success: true,
            data: { medicines: MOCK_MEDICINES },
        };
    }

    if (endpoint.startsWith('/medicines/')) {
        const id = endpoint.split('/')[2];
        const medicine = MOCK_MEDICINES.find(m => m.id === id) || MOCK_MEDICINES[0];
        
        if (options.method === 'PUT') {
            const body = JSON.parse(options.body);
            return { success: true, data: { ...medicine, ...body } };
        }
        if (options.method === 'DELETE') {
            return { success: true };
        }
        
        return {
            success: true,
            data: { medicine },
        };
    }

    if (endpoint === '/alerts') {
        return {
            success: true,
            data: { alerts: MOCK_ALERTS },
        };
    }

    if (endpoint.startsWith('/savings/summary')) {
        return {
            success: true,
            data: { summary: MOCK_SAVINGS },
        };
    }

    if (endpoint.startsWith('/stock/')) {
        // Mock stock movement
        return { success: true };
    }

    return {
        success: false,
        error: { message: `Mock endpoint ${endpoint} not implemented` },
    };
}
