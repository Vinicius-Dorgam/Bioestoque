import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function LowStockChart({ materials }) {
  const lowStockItems = materials
    .filter(m => m.status !== 'disponivel' && m.min_quantity > 0)
    .map(m => ({
      name: m.name.length > 18 ? m.name.substring(0, 18) + '…' : m.name,
      atual: m.quantity,
      minimo: m.min_quantity,
      status: m.status,
    }))
    .slice(0, 10);

  if (lowStockItems.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Materiais Abaixo do Mínimo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <AlertTriangle className="h-8 w-8 text-green-400" />
            <p className="text-sm">Todos os estoques estão adequados!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Materiais Abaixo do Mínimo
          <span className="ml-auto text-xs font-normal text-muted-foreground">{lowStockItems.length} itens</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={lowStockItems} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
              formatter={(val, name) => [val, name === 'atual' ? 'Estoque atual' : 'Mínimo']}
            />
            <Bar dataKey="minimo" name="Mínimo" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
            <Bar dataKey="atual" name="Atual" radius={[0, 4, 4, 0]}>
              {lowStockItems.map((entry, i) => (
                <Cell key={i} fill={entry.status === 'esgotado' ? 'hsl(0 84% 60%)' : 'hsl(38 92% 50%)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Estoque baixo</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Esgotado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted inline-block border" /> Mínimo</span>
        </div>
      </CardContent>
    </Card>
  );
}