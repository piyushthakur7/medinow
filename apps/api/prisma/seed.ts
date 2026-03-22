import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common medicine names for autocomplete
const medicineMaster = [
    { name: 'Paracetamol 500mg', category: 'Pain Relief' },
    { name: 'Paracetamol 650mg', category: 'Pain Relief' },
    { name: 'Ibuprofen 400mg', category: 'Pain Relief' },
    { name: 'Aspirin 75mg', category: 'Blood Thinner' },
    { name: 'Aspirin 150mg', category: 'Blood Thinner' },
    { name: 'Amoxicillin 250mg', category: 'Antibiotic' },
    { name: 'Amoxicillin 500mg', category: 'Antibiotic' },
    { name: 'Azithromycin 250mg', category: 'Antibiotic' },
    { name: 'Azithromycin 500mg', category: 'Antibiotic' },
    { name: 'Ciprofloxacin 500mg', category: 'Antibiotic' },
    { name: 'Metformin 500mg', category: 'Diabetes' },
    { name: 'Metformin 850mg', category: 'Diabetes' },
    { name: 'Metformin 1000mg', category: 'Diabetes' },
    { name: 'Glimepiride 1mg', category: 'Diabetes' },
    { name: 'Glimepiride 2mg', category: 'Diabetes' },
    { name: 'Amlodipine 5mg', category: 'Blood Pressure' },
    { name: 'Amlodipine 10mg', category: 'Blood Pressure' },
    { name: 'Losartan 50mg', category: 'Blood Pressure' },
    { name: 'Telmisartan 40mg', category: 'Blood Pressure' },
    { name: 'Atorvastatin 10mg', category: 'Cholesterol' },
    { name: 'Atorvastatin 20mg', category: 'Cholesterol' },
    { name: 'Rosuvastatin 10mg', category: 'Cholesterol' },
    { name: 'Omeprazole 20mg', category: 'Gastric' },
    { name: 'Pantoprazole 40mg', category: 'Gastric' },
    { name: 'Ranitidine 150mg', category: 'Gastric' },
    { name: 'Cetirizine 10mg', category: 'Allergy' },
    { name: 'Loratadine 10mg', category: 'Allergy' },
    { name: 'Montelukast 10mg', category: 'Respiratory' },
    { name: 'Salbutamol Inhaler', category: 'Respiratory' },
    { name: 'Levothyroxine 25mcg', category: 'Thyroid' },
    { name: 'Levothyroxine 50mcg', category: 'Thyroid' },
    { name: 'Clopidogrel 75mg', category: 'Blood Thinner' },
    { name: 'Metoprolol 25mg', category: 'Heart' },
    { name: 'Metoprolol 50mg', category: 'Heart' },
    { name: 'Diclofenac 50mg', category: 'Pain Relief' },
    { name: 'Tramadol 50mg', category: 'Pain Relief' },
    { name: 'Pregabalin 75mg', category: 'Nerve Pain' },
    { name: 'Gabapentin 300mg', category: 'Nerve Pain' },
    { name: 'Vitamin D3 60000 IU', category: 'Vitamin' },
    { name: 'Vitamin B12 1500mcg', category: 'Vitamin' },
    { name: 'Multivitamin Tablet', category: 'Vitamin' },
    { name: 'Calcium + Vitamin D', category: 'Supplement' },
    { name: 'Iron + Folic Acid', category: 'Supplement' },
    { name: 'ORS Powder', category: 'Rehydration' },
    { name: 'Domperidone 10mg', category: 'Gastric' },
    { name: 'Ondansetron 4mg', category: 'Anti-nausea' },
    { name: 'Dexamethasone 0.5mg', category: 'Steroid' },
    { name: 'Prednisolone 5mg', category: 'Steroid' },
];

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing medicine master data
    await prisma.medicineMaster.deleteMany();

    // Seed medicine master
    for (const medicine of medicineMaster) {
        await prisma.medicineMaster.create({
            data: medicine,
        });
    }

    console.log(`✅ Seeded ${medicineMaster.length} medicines to master list`);
    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
