"use client";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { format, subDays } from "date-fns";

//UTILS
import { calculatePercentageDifference } from "@/utils/calculatePercentage";

// COMPONENTS
import ThemeToggle from "@/components/toggleTheme";
import {
  LineChart,
  Line,
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

export default function Dashboard() {
  const { theme, resolvedTheme } = useTheme();
  const [LeadsData, setLeadsData] = useState<{ date: string; leads: number }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const MAX_LEADS_SIZE = 500;
  const CACHE_DURATION_MINUTES = 1440;

  const loadFromCache = (): { date: string; leads: number }[] | null => {
    const cachedData = localStorage.getItem("leadsRawData");
    const cachedTimestamp = localStorage.getItem("leadsDataTimestamp");
    const now = Date.now();
    const cacheAge = cachedTimestamp
      ? (now - parseInt(cachedTimestamp)) / 1000 / 60
      : Infinity;

    if (cachedData && cacheAge < CACHE_DURATION_MINUTES) {
      const rawData: LeadsByDate = JSON.parse(cachedData);
      const chartData = Object.entries(rawData)
        .map(([date, leads]) => ({ date, leads: Number(leads) }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (chartData.length <= MAX_LEADS_SIZE) {
        return chartData;
      } else {
        localStorage.removeItem("leadsRawData");
        localStorage.removeItem("leadsDataTimestamp");
        console.log("Cache do localStorage limpo devido ao excesso de leads");
      }
    }

    return null;
  };

  const fetchLeadsForRange = useCallback(async (forceFetch = false) => {
    const cachedData = loadFromCache();
    if (!forceFetch && cachedData) {
      setLeadsData(cachedData);
      return;
    }

    setIsLoading(true);
    try {
      const daysToFecth = 15;
      const today = new Date();
      const leadsByDate: LeadsByDate = {};

      // Search leads for every day
      for (let i = 0; i < daysToFecth; i++) {
        const date = format(subDays(today, i), "yyyy-MM-dd");
        const response = await fetch(`/api/leads-from-db?date=${date}`);
        if (!response.ok) throw new Error(`Erro ao buscar leads para ${date}`);
        const data = await response.json();
        leadsByDate[date] = data.count || 0;
      }

      // Transform on array for the chart
      const chartData = Object.entries(leadsByDate)
        .map(([date, leads]) => ({ date, leads }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (chartData.length > MAX_LEADS_SIZE) {
        localStorage.removeItem("leadsRawData");
        localStorage.removeItem("leadsDataTimestamp");
        console.log("Cache do localStorage limpo devido ao excesso de leads");
      } else {
        localStorage.setItem("leadsRawData", JSON.stringify(leadsByDate));
        localStorage.setItem("leadsDataTimestamp", Date.now.toString());
      }

      setLeadsData(chartData);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentDayLeads = useCallback(async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(`/api/leads-from-db?date=${today}`);
      if (!response.ok) throw new Error(`Erro ao buscar leads para ${today}`);
      const data = await response.json();

      setLeadsData((prevData) => {
        const updatedData = [...prevData];
        const todayIndex = updatedData.findIndex((item) => item.date === today);
        if (todayIndex !== -1) {
          updatedData[todayIndex] = { date: today, leads: data.count || 0 };
        } else {
          updatedData.push({ date: today, leads: data.count || 0 });
          updatedData.sort((a, b) => a.date.localeCompare(b.date));
        }

        const leadsByDate = updatedData.reduce((acc, { date, leads }) => {
          acc[date] = leads;
          return acc;
        }, {} as LeadsByDate);

        if (updatedData.length > MAX_LEADS_SIZE) {
          localStorage.removeItem("leadsRawData");
          localStorage.removeItem("leadsDataTimestamp");
          console.log("Cache do localStorage limpo devido ao excesso de leads");
        } else {
          localStorage.setItem("leadsRawData", JSON.stringify(leadsByDate));
          localStorage.setItem("leadsDataTimestamp", Date.now.toString());
        }
        return updatedData;
      });
    } catch (error) {
      console.error("Error updating leads for current day:", error);
    }
  }, [MAX_LEADS_SIZE]);

  useEffect(() => {
    const cachedData = loadFromCache();
    if (cachedData) {
      setLeadsData(cachedData);
    } else {
      fetchLeadsForRange(true);
    }

    const currentDayInterval = setInterval(() => {
      fetchCurrentDayLeads();
    }, 10 * 60 * 1000);

    const fullRangeInterval = setInterval(() => {
      fetchLeadsForRange();
    }, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(currentDayInterval);
      clearInterval(fullRangeInterval);
    };
  }, [fetchLeadsForRange, fetchCurrentDayLeads]);

  if (isLoading) return <Loading />;

  // Clock
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

  // Last Sync with database
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
      const interval = setInterval(fetchLastSync, 60 * 1000);
      return () => clearInterval(interval);
    }, []);

    return <span>{lastSync}</span>;
  };

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
