import { getCurrentDateForUrl } from "@/utils/paramDate";

describe('getCurrentDateForUrl', () => {
    const originalDate = global.Date;
    let mockLocalDate: Date;
    let mockMoscowDate: Date;

    // Helper para configurar tanto a data local quanto a de Moscou
    const setupDateMocks = (localISOString: string, moscowISOString: string) => {
        mockLocalDate = new Date(localISOString);
        mockMoscowDate = new Date(moscowISOString);

        // Mock da classe Date
        global.Date = class extends originalDate {
            constructor() {
                super();
                return mockLocalDate;
            }

            // Mock do toLocaleString para simular timezone de Moscou
            toLocaleString(locale?: string | string[], options?: Intl.DateTimeFormatOptions) {
                if (options?.timeZone === 'Europe/Moscow') {
                    return mockMoscowDate.toLocaleString();
                }
                return mockLocalDate.toLocaleString();
            }
        } as DateConstructor;
    };

    afterEach(() => {
        global.Date = originalDate;
    });

    it("não deve incrementar a data durante o dia (antes das 6h em Moscou - meia-noite no Brasil)", () => {
        // Local: 15h (16/02), Moscou: 21h (16/02)
        setupDateMocks(
            '2025-02-16T15:00:00',
            '2025-02-16T21:00:00'
        );

        const result = getCurrentDateForUrl();
        expect(result.BEGINDATE).toBe('2025-02-16');
    });

    it("deve incrementar a data após 6h em Moscou e antes da meia-noite local", () => {
        // Local: 03h (16/02), Moscou: 09h (16/02)
        setupDateMocks(
            '2025-02-16T03:00:00',
            '2025-02-17T09:00:00'
        );

        const result = getCurrentDateForUrl();
        expect(result.BEGINDATE).toBe('2025-02-17');
    });

    it("não deve incrementar a data após a meia-noite local", () => {
        // Local: 00:30h (16/02), Moscou: 06:30h (16/02)
        setupDateMocks(
            '2025-02-16T00:30:00',
            '2025-02-16T06:30:00'
        );

        const result = getCurrentDateForUrl();
        expect(result.BEGINDATE).toBe('2025-02-16');
    });

    // Casos adicionais recomendados
    it("deve lidar corretamente com a mudança de mês", () => {
        // Local: 22h (31/01), Moscou: 04h (01/02)
        setupDateMocks(
            '2025-01-31T22:00:00',
            '2025-02-01T04:00:00'
        );

        const result = getCurrentDateForUrl();
        expect(result.BEGINDATE).toBe('2025-01-31');
    });

    it("deve lidar corretamente com a mudança de ano", () => {
        // Local: 22h (31/12), Moscou: 04h (01/01)
        setupDateMocks(
            '2024-12-31T22:00:00',
            '2025-01-01T04:00:00'
        );

        const result = getCurrentDateForUrl();
        expect(result.BEGINDATE).toBe('2024-12-31');
    });
});