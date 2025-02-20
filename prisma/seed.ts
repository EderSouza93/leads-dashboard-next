import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const generateDate = () => {
    const date = faker.date.past({ years: 2 });
    return date;
};

const formatLocalDate = (date: Date): string => {
    return date.toDateString().split('T')[0];
};

const sources = ['web', 'phone', 'referral', 'social', 'fair'];
const stages = ['web', 'contacted', 'negotiaion', 'proposal', 'closed_won', 'closed_lost'];

const generateLead = () => {
    const bitrixCreatedAt = generateDate();
    const localCreatedAt = new Date(bitrixCreatedAt);

    return {
        bitrixId: faker.string.uuid(),
        title: faker.company.name(),
        sourceId: faker.helpers.arrayElement(sources),
        assignedById: faker.string.numeric(5),
        stageId: faker.helpers.arrayElement(stages),
        bitrixCreatedAt,
        localCreatedAt,
        localDate: formatLocalDate(localCreatedAt),
        rawData: {
            contactName: faker.person.fullName(),
            contactEmail: faker.internet.email(),
            contactPhone: faker.phone.number(),
            opportunity: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
            comments: faker.lorem.paragraph(),
            tags: faker.helpers.arrayElements(['hot', 'cold', 'urgent', 'vip', 'follow-up'],
                {min: 1, max: 3 })
        }
    };
};

async function seed() {
    try {
        console.log('Starting seed...');
        await prisma.lead.deleteMany();
        
        const leadsToCreate = Array.from({ length: 50 }, generateLead);
        
        for (const lead of leadsToCreate) {
            await prisma.lead.create({ data: lead });
        }

        console.log('Seed completed successfully!');
    } catch (error) {
        console.error('Error during seed:', error);
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}