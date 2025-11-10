import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DailyOccupancy } from "@/utils/excelProcessor";

interface OccupancyChartProps {
  data: DailyOccupancy[];
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    Lisboa: item.lisboa,
    Porto: item.porto,
    Évora: item.evora,
    Setúbal: item.setubal,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução da Ocupação por Cidade</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Lisboa" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))" }}
            />
            <Line 
              type="monotone" 
              dataKey="Porto" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-2))" }}
            />
            <Line 
              type="monotone" 
              dataKey="Évora" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-3))" }}
            />
            <Line 
              type="monotone" 
              dataKey="Setúbal" 
              stroke="hsl(var(--chart-4))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-4))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
