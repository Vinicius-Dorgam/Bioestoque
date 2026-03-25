import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

export default function Top5Chart({ checkouts }) {
  const saidas = checkouts.filter(c => c.type === 'saida');

  const totals = {};
  saidas.forEach(c => {
    const key = c.material_name || 'Sem nome';
    totals[key] = (totals[key] || 0) + (c.quantity || 0);
  });

  const data = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({
      name: name.length > 16 ? name.substring(0, 16) + '…' : name,
      total,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Top 5 Mais Retirados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <TrendingDown className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhuma saída registrada ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-500" />
          Top 5 Mais Retirados
          <span className="ml-auto text-xs font-normal text-muted-foreground">últimos 30 dias</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: 0, right: 10, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
              formatter={val => [val, 'Unidades retiradas']}
            />
            <Bar dataKey="total" name="Saídas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}