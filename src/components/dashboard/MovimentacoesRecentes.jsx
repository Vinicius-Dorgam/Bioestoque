import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeConfig = {
  saida: { label: 'Saída', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  entrada: { label: 'Entrada', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  devolucao: { label: 'Devolução', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

export default function MovimentacoesRecentes({ checkouts }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = checkouts.filter(c => {
    const matchSearch =
      c.material_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.responsible?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  }).slice(0, 20);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Movimentações Recentes
          <span className="ml-auto text-xs font-normal text-muted-foreground">{checkouts.length} no total</span>
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar material ou responsável..."
              className="pl-8 h-8 text-xs rounded-lg"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="devolucao">Devoluções</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma movimentação encontrada</p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filtered.map(c => {
              const tc = typeConfig[c.type] || typeConfig.saida;
              return (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", tc.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold truncate">{c.material_name}</p>
                      <Badge variant="outline" className={cn("text-xs border py-0", tc.cls)}>{tc.label}</Badge>
                      {c.biometric_verified && (
                        <ShieldCheck className="h-3 w-3 text-green-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.responsible} {c.purpose ? `• ${c.purpose}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-xs font-bold", c.type === 'saida' ? 'text-red-600' : 'text-green-600')}>
                      {c.type === 'saida' ? '-' : '+'}{c.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.created_date), "dd/MM HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}