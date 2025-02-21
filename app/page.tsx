"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { format, subDays } from "date-fns";

//UTILS
import { calculatePercentageDifference } from "@/utils/calculatePercentage";

// COMPONENTS
import ThemeToggle from "@/components/toggleTheme";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { theme, resolvedTheme } = useTheme();
  const [LeadsData, setLeadsData] = useState<{ date: string; leads: number } []>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeadsForRange() {
      try {
        setIsLoading(true);
        const daysToFecth = 15;
        const today = new Date();
        const leadsByDate: { [key: string]: number } = {};

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

        setLeadsData(chartData);

      } catch (error) {
        console.error("Erro ao buscar leads:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeadsForRange()
  }, []);

  if(isLoading) return <p>Carregando...</p>

  const TimeComponent = () => {
    const [time, setTime] = useState('');

    useEffect(() => {
      setTime(new Date().toLocaleString());
    }, []);

    return <span>{time}</span>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Ultima atualização: {<TimeComponent/>}</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads Hoje</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : LeadsData[LeadsData.length -1]?.leads || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                { isLoading || LeadsData.length < 2
                  ? 'Sem dados de ontem'
                  : `${calculatePercentageDifference(
                    LeadsData[LeadsData.length - 1].leads,
                    LeadsData[LeadsData.length - 2].leads
                  )}% em relação a ontem`
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.3%</div>
              <p className="text-xs text-muted-foreground">+2.4% do que na ultima semana</p>
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas ativas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 terminando essa semana</p>
            </CardContent>
          </Card> */}
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
                    <p>Carregando dados...</p>
                  ) : (
                    <LineChart data={LeadsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                  )}      
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}