"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { getLeads } from "@/lib/bitrix"

// COMPONENTS
import ThemeToggle from "@/components/toggleTheme";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { theme, resolvedTheme } = useTheme();
  const [leads, setLeadsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch("/api/leads");
        if(!response.ok) throw new Error("Erro ao buscar leads");
        const data = await response.json();
        setLeadsData(data)
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeads()
  }, []);

  if(isLoading) return <p>Carregando...</p>

  const TimeComponent = () => {
    const [time, setTime] = useState('');

    useEffect(() => {
      setTime(new Date().toLocaleString());
    }, []);

    return <span>{time}</span>
  }


  // This would be replaced with actual data from Bitrix24
  const mockData = [
    { date: "2024-03-20", leads: 4 },
    { date: "2024-03-21", leads: 6 },
    { date: "2024-03-22", leads: 8 },
    { date: "2024-03-23", leads: 5 },
    { date: "2024-03-24", leads: 10 },
    { date: "2024-03-25", leads: 3 },
    { date: "2024-03-26", leads: 9 },
    { date: "2024-03-27", leads: 15 },
    { date: "2024-03-28", leads: 0 },
    { date: "2024-03-29", leads: 2 },
    { date: "2024-03-30", leads: 6 },
    { date: "2024-03-31", leads: 8 },
    { date: "2024-04-01", leads: 20 },
    { date: "2024-04-02", leads: 23 },
    { date: "2024-04-03", leads: 25 },
  ];

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
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 10)}% do que ontem</p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas ativas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 terminando essa semana</p>
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
                    <p>Carregando dados...</p>
                  ) : (
                    <LineChart data={mockData}>
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