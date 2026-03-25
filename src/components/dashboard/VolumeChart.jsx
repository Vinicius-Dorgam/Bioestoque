import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';
import { subDays, format, eachDayOfInterval, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VolumeChart({ checkouts }) {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 29), end: today });

  const data = days.map(day => {
    const dayCheckouts = checkouts.filter(c => isSameDay(new Date(c.created_date), day));
    const entradas = dayCheckouts.filter(c => c.type === 'entrada' || c.type === 'devolucao')
      .reduce((s, c) => s + (c.quantity || 0), 0);
    const saidas = dayCheckouts.filter(c => c.type === 'saida')
      .reduce((s, c) => s + (c.quantity || 0), 0);
    return {
      dia: format(day, 'dd/MM', { locale: ptBR }),
      Entradas: entradas,
      Saídas: saidas,
    };
  });

  const totalEntradas = data.reduce((s, d) => s + d.Entradas, 0);
  const totalSaidas = data.reduce((s, d) => s + d.Saídas, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          Volume Entradas vs Saídas — últimos 30 dias
        </CardTitle>
        <div className="flex gap-4 text-xs mt-1">
          <span className="text-green-600 font-medium">↑ {totalEntradas} entradas</span>
          <span className="text-red-500 font-medium">↓ {totalSaidas} saídas</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Entradas" stroke="hsl(142 71% 45%)" fill="url(#colorEntradas)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Saídas" stroke="hsl(0 84% 60%)" fill="url(#colorSaidas)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}