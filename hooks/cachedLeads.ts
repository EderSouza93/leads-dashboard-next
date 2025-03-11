import { useState, useEffect } from 'react';
import { formatISO, isToday, parseISO } from 'date-fns';


interface Lead {
    bitrixId: string;
    title: string;
    sourceId: string;
    assignedById: string;
    stageId: string;
    createdAt: string;
    rawData: any;
}

interface LeadsResponse {
    success: boolean;
    date: string;
    count: number;
    leads: Lead[];
    cacheable: boolean;
}

export function useCachedLeads(date?: string) {
    const [data, setData] = useState<LeadsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const formattedDate = date || formatISO(new Date(), {
                    format: "extended",
                    representation: "complete"
                }) + "Z";

                const cacheKey = `leads-${formattedDate.split('T')[0]}`;

                const isCurrentDay = isToday(parseISO(formattedDate.split('T')[0]));

                if (!isCurrentDay) {
                    const cachedData = sessionStorage.getItem(cacheKey);

                    if (cachedData) {
                        const parseData = JSON.parse(cachedData);
                        setData(parseData);
                        setLoading(false);
                        return;
                    }
                }

                const response = await fetch(`/api/leads?date=${formattedDate}`);

                if (!response.ok) {
                    throw new Error(`Error fetching leads: ${response.statusText}`)
                }

                const responseData: LeadsResponse = await response.json();

                if (responseData.cacheable) {
                    sessionStorage.setItem(cacheKey, JSON.stringify(responseData));
                }

                setData(responseData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [date]);

    return { data, loading, error };
}