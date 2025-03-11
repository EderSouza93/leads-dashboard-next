"use client";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { format, subDays, parseISO, isToday } from "date-fns";

//UTILS
import { calculatePercentageDifference } from "@/utils/calculatePercentage";

// COMPONENTS
import ThemeToggle from "@/components/toggleTheme";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, TrendingUp } from "lucide-react";
import Loading from "@/components/Loader";

interface LeadsByDate {
  [date: string]: number;
}

interface LeadData {
  date: string;
  count: number;
  cacheable: boolean;
}

export default function Dashboard() {
  const { theme, resolvedTheme } = useTheme();
  const [LeadsData, setLeadsData] = useState<{ date: string; leads: number }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const MAX_LEADS_SIZE = 500;
  const CACHE_DURATION_MINUTES = 1440; // 24 horas

  // Função modificada para carregar dados do localStorage
  const loadFromCache = (date: string): LeadData | null => {
    const cacheKey = `leads-data-${date}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        const timestamp = localStorage.getItem(`${cacheKey}-timestamp`);
        
        // Verificar se os dados são de hoje (não usar cache para hoje)
        const isCurrentDay = isToday(parseISO(date));
        
        // Se for o dia atual, verificar se o cache é recente (menos de 10 minutos)
        // Se for dia passado, podemos usar o cache sem limite de tempo
        if (!isCurrentDay || (timestamp && (Date.now() - parseInt(timestamp)) < 10 * 60 * 1000)) {
          return parsedData;
        }
      } catch (error) {
        console.error("Erro ao analisar dados em cache:", error);
        localStorage.removeItem(cacheKey);
      }
    }
    
    return null;
  };

  // Função para salvar dados no cache
  const saveToCache = (date: string, data: LeadData) => {
    try {
      const cacheKey = `leads-data-${date}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
    } catch (error) {
      console.error("Erro ao salvar dados no cache:", error);
    }
  };

  // Função modificada para buscar dados de uma única data
  const fetchLeadsForDay = useCallback(async (date: string, forceRefresh = false) => {
    // Se não forçar atualização, verifica o cache primeiro
    if (!forceRefresh) {
      const cachedData = loadFromCache(date);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Se chegou aqui, precisamos buscar do servidor
    try {
      const response = await fetch(`/api/leads-from-db?date=${date}`);
      if (!response.ok) throw new Error(`Erro ao buscar leads para ${date}`);
      
      const data = await response.json();
      
      // Determinar se os dados podem ser cacheados (dias passados sim, atual não)
      const isCurrentDay = isToday(parseISO(date));
      const leadData: LeadData = {
        date,
        count: data.count || 0,
        cacheable: !isCurrentDay
      };
      
      // Armazenar no cache apenas se for dias passados ou formos forçados a atualizar
      if (leadData.cacheable || forceRefresh) {
        saveToCache(date, leadData);
      }
      
      return leadData;
    } catch (error) {
      console.error(`Erro ao buscar leads para ${date}:`, error);
      return null;
    }
  }, []);

  // Função para buscar todas as datas necessárias
  const fetchLeadsForRange = useCallback(async (forceFetch = false) => {
    setIsLoading(true);
    try {
      const daysToFetch = 15;
      const today = new Date();
      const leadsByDate: LeadsByDate = {};
      const fetchPromises = [];

      // Criar array de promessas para buscar todos os dias
      for (let i = 0; i < daysToFetch; i++) {
        const date = format(subDays(today, i), "yyyy-MM-dd");
        const shouldForceRefresh = forceFetch || (i === 0); // Forçar refresh para o dia atual
        
        fetchPromises.push(
          fetchLeadsForDay(date, shouldForceRefresh).then(leadData => {
            if (leadData) {
              leadsByDate[date] = leadData.count;
            }
            return leadData;
          })
        );
      }

      // Executar todas as requisições em paralelo
      await Promise.all(fetchPromises);

      // Transformar em array para o gráfico
      const chartData = Object.entries(leadsByDate)
        .map(([date, leads]) => ({ date, leads }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setLeadsData(chartData);
    } catch (error) {
      console.error("Erro ao buscar range de leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeadsForDay]);

  // Função para atualizar apenas os dados do dia atual
  const fetchCurrentDayLeads = useCallback(async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const leadData = await fetchLeadsForDay(today, true); // Forçar refresh
      
      if (leadData) {
        setLeadsData(prevData => {
          const updatedData = [...prevData];
          const todayIndex = updatedData.findIndex(item => item.date === today);
          
          if (todayIndex !== -1) {
            updatedData[todayIndex] = { date: today, leads: leadData.count };
          } else {
            updatedData.push({ date: today, leads: leadData.count });
            updatedData.sort((a, b) => a.date.localeCompare(b.date));
          }
          
          return updatedData;
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar leads do dia atual:", error);
    }
  }, [fetchLeadsForDay]);

  // Efeito de inicialização
  useEffect(() => {
    // Iniciar carregando todos os dados
    fetchLeadsForRange();
    
    // Intervalo para atualizar apenas o dia atual a cada 10 minutos
    const currentDayInterval = setInterval(() => {
      fetchCurrentDayLeads();
    }, 10 * 60 * 1000);
    
    // Intervalo para recarregar todos os dados uma vez por dia
    // (útil para atualizar dias anteriores caso haja correções)
    const fullRangeInterval = setInterval(() => {
      fetchLeadsForRange();
    }, 24 * 60 * 60 * 1000);
    
    return () => {
      clearInterval(currentDayInterval);
      clearInterval(fullRangeInterval);
    };
  }, [fetchLeadsForRange, fetchCurrentDayLeads]);

  // Clock Component
  const ClockComponent = () => {
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
      const updatedTime = () => setCurrentTime(new Date().toLocaleString());
      updatedTime();
      const interval = setInterval(updatedTime, 1000);
      return () => clearInterval(interval);
    }, []);

    if (!currentTime) return null;
    return <span>{currentTime}</span>;
  };

  // Last Sync Component
  const LastSyncComponent = () => {
    const [lastSync, setLastSync] = useState("");

    useEffect(() => {
      const fetchLastSync = async () => {
        try {
          const response = await fetch("/api/last-sync");
          if (!response.ok)
            throw new Error("Erro ao buscar última sincronização");
          const data = await response.json();
          setLastSync(
            data.lastSync
              ? new Date(data.lastSync).toLocaleString()
              : "Nenhuma sincronização ainda"
          );
        } catch (error) {
          console.error("Erro ao buscar última sincronização:", error);
          setLastSync("Erro ao carregar");
        }
      };

      fetchLastSync();
      const interval = setInterval(fetchLastSync, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }, []);

    return <span>{lastSync}</span>;
  };

  if (isLoading && LeadsData.length === 0) return <Loading />;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              <div>
                Horário Atual: <ClockComponent />
              </div>
              <div>
                Última Atualização: <LastSyncComponent />
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Leads Hoje
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {LeadsData.length === 0
                  ? "..."
                  : LeadsData[LeadsData.length - 1]?.leads || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {LeadsData.length < 2
                  ? "Sem dados de ontem"
                  : `${calculatePercentageDifference(
                      LeadsData[LeadsData.length - 1].leads,
                      LeadsData[LeadsData.length - 2].leads
                    )}% em relação a ontem`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Leads convertidos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Em desenvolvimento...</div>
              <p className="text-xs text-muted-foreground">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conversão
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Em desenvolvimento...</div>
              <p className="text-xs text-muted-foreground">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leads Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      {isLoading ? (
                        <Loading />
                      ) : (
                        <AreaChart data={LeadsData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--muted-foreground) / 0.4)" 
                          />
                          <XAxis
                            dataKey="date"
                            stroke="hsl(var(--foreground))"
                            tickLine={false}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                          />
                          <YAxis
                            stroke="hsl(var(--foreground))"
                            tickLine={false}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                              color: "hsl(var(--foreground))",
                              borderRadius: "4px",
                              border: "1px solid",
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="leads"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary) / 0.3)"
                            strokeWidth={2}
                            activeDot={{
                              r: 8,
                              fill: "hsl(var(--primary))",
                              stroke: "hsl(var(--background))",
                            }}
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
        </Tabs>
      </div>
      {isLoading && <Loading />}
    </div>
  );
}
