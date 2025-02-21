import { saveLeadsToDatabase } from '@/services/leadService';
import { adjustDateFromRussia } from '@/lib/bitrix';
import { format } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import { Lead } from '@/types/leadSchema';

// Mock do PrismaClient
jest.mock('@prisma/client', () => {
  const mPrisma = {
    $transaction: jest.fn(),
    lead: {
      upsert: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mPrisma),
  };
});

// Mock da função adjustDateFromRussia
jest.mock('@/lib/bitrix', () => ({
  adjustDateFromRussia: jest.fn(),
}));

const prisma = new PrismaClient();

describe('saveLeadsToDatabase', () => {
  const mockLead: Lead = {
    ID: '36090',
    TITLE: 'Wendell Alex Cunha Silva - Aruana Garden - MCMV',
    SOURCE_ID: 'WEBFORM',
    ASSIGNED_BY_ID: '1152',
    STAGE_ID: 'C2:PREPARATION',
    DATE_CREATE: '2025-02-19T15:29:16+03:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve salvar um lead com datas ajustadas corretamente', async () => {
    const localDate = new Date('2025-02-19T12:29:16.000Z');
    (adjustDateFromRussia as jest.Mock).mockReturnValue(localDate);
    (prisma.$transaction as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const expectedLeadData = {
      bitrixId: mockLead.ID,
      title: mockLead.TITLE,
      sourceId: mockLead.SOURCE_ID,
      assignedById: mockLead.ASSIGNED_BY_ID,
      stageId: mockLead.STAGE_ID,
      bitrixCreatedAt: new Date(mockLead.DATE_CREATE),
      localCreatedAt: localDate,
      localDate: format(localDate, 'yyyy-MM-dd'),
      rawData: JSON.stringify(mockLead),
    };

    const result = await saveLeadsToDatabase([mockLead]);

    expect(adjustDateFromRussia).toHaveBeenCalledWith(mockLead.DATE_CREATE);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        where: { bitrixId: mockLead.ID },
        update: expectedLeadData,
        create: expectedLeadData,
      }),
    ]);
    expect(result).toBe(1);
  });

  it('deve lidar com SOURCE_ID como null', async () => {
    const mockLeadNoSource: Lead = { ...mockLead, SOURCE_ID: null };
    const localDate = new Date('2025-02-19T12:29:16.000Z');
    (adjustDateFromRussia as jest.Mock).mockReturnValue(localDate);
    (prisma.$transaction as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const expectedLeadData = {
      bitrixId: mockLeadNoSource.ID,
      title: mockLeadNoSource.TITLE,
      sourceId: null,
      assignedById: mockLeadNoSource.ASSIGNED_BY_ID,
      stageId: mockLeadNoSource.STAGE_ID,
      bitrixCreatedAt: new Date(mockLeadNoSource.DATE_CREATE),
      localCreatedAt: localDate,
      localDate: format(localDate, 'yyyy-MM-dd'),
      rawData: JSON.stringify(mockLeadNoSource),
    };

    const result = await saveLeadsToDatabase([mockLeadNoSource]);

    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        where: { bitrixId: mockLeadNoSource.ID },
        update: expectedLeadData,
        create: expectedLeadData,
      }),
    ]);
    expect(result).toBe(1);
  });

  it('deve retornar 0 se a lista de leads estiver vazia', async () => {
    const result = await saveLeadsToDatabase([]);
    expect(result).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('deve lançar um erro se o salvamento falhar', async () => {
    const localDate = new Date('2025-02-19T12:29:16.000Z');
    (adjustDateFromRussia as jest.Mock).mockReturnValue(localDate);
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Erro no banco de dados'));

    await expect(saveLeadsToDatabase([mockLead])).rejects.toThrow('Erro no banco de dados');
    expect(adjustDateFromRussia).toHaveBeenCalledWith(mockLead.DATE_CREATE);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('deve ajustar corretamente datas em diferentes fusos horários', async () => {
    const lateLead: Lead = {
      ...mockLead,
      DATE_CREATE: '2025-02-19T23:59:59+03:00',
    };
    const localDate = new Date('2025-02-19T20:59:59.000Z');
    (adjustDateFromRussia as jest.Mock).mockReturnValue(localDate);
    (prisma.$transaction as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const expectedLeadData = {
      bitrixId: lateLead.ID,
      title: lateLead.TITLE,
      sourceId: lateLead.SOURCE_ID,
      assignedById: lateLead.ASSIGNED_BY_ID,
      stageId: lateLead.STAGE_ID,
      bitrixCreatedAt: new Date(lateLead.DATE_CREATE),
      localCreatedAt: localDate,
      localDate: format(localDate, 'yyyy-MM-dd'),
      rawData: JSON.stringify(lateLead),
    };

    const result = await saveLeadsToDatabase([lateLead]);

    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        where: { bitrixId: lateLead.ID },
        update: expectedLeadData,
        create: expectedLeadData,
      }),
    ]);
    expect(result).toBe(1);
  });

  it('deve atribuir leads de 0h-6h da Rússia ao dia anterior local', async () => {
    const mockLeadRussiaEarly: Lead = {
      ...mockLead,
      DATE_CREATE: '2025-02-19T02:00:00+03:00',
    };
    const localDate = new Date('2025-02-18T23:00:00Z');
    (adjustDateFromRussia as jest.Mock).mockReturnValue(localDate);
    (prisma.$transaction as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const expectedLeadData = {
      bitrixId: mockLeadRussiaEarly.ID,
      title: mockLeadRussiaEarly.TITLE,
      sourceId: mockLeadRussiaEarly.SOURCE_ID,
      assignedById: mockLeadRussiaEarly.ASSIGNED_BY_ID,
      stageId: mockLeadRussiaEarly.STAGE_ID,
      bitrixCreatedAt: new Date(mockLeadRussiaEarly.DATE_CREATE),
      localCreatedAt: localDate,
      localDate: format(localDate, 'yyyy-MM-dd'), // '2025-02-18'
      rawData: JSON.stringify(mockLeadRussiaEarly),
    };

    const result = await saveLeadsToDatabase([mockLeadRussiaEarly]);

    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        where: { bitrixId: mockLeadRussiaEarly.ID },
        update: expectedLeadData,
        create: expectedLeadData,
      }),
    ]);
    expect(result).toBe(1);
  });
});