import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Search, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryLabels = {
  ferramentas: 'Ferramentas', eletricos: 'Elétricos', hidraulicos: 'Hidráulicos',
  construcao: 'Construção', epi: 'EPI', limpeza: 'Limpeza', escritorio: 'Escritório', outros: 'Outros',
};

const statusConfig = {
  disponivel: { label: 'OK', icon: CheckCircle2, cls: 'text-green-600 bg-green-50 border-green-200' },
  estoque_baixo: { label: 'Baixo', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  esgotado: { label: 'Esgotado', icon: XCircle, cls: 'text-red-600 bg-red-50 border-red-200' },
};

export default function InventoryCheck({ materials }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = materials.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || m.code?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || m.category === filterCategory;
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const categories = [...new Set(materials.map(m => m.category).filter(Boolean))];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Conferência de Inventário
          <span className="ml-auto text-xs font-normal text-muted-foreground">{filtered.length} / {materials.length} itens</span>
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar material ou código..."
              className="pl-8 h-8 text-xs rounded-lg"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{categoryLabels[c] || c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="disponivel">OK</SelectItem>
              <SelectItem value="estoque_baixo">Estoque baixo</SelectItem>
              <SelectItem value="esgotado">Esgotado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum material encontrado</p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filtered.map(m => {
              const sc = statusConfig[m.status] || statusConfig.disponivel;
              const StatusIcon = sc.icon;
              const pct = m.min_quantity > 0 ? Math.min((m.quantity / m.min_quantity) * 100, 100) : 100;
              return (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                  <StatusIcon className={cn("h-4 w-4 shrink-0", sc.cls.split(' ')[0])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold truncate">{m.name}</p>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{m.code}</span>
                    </div>
                    {m.min_quantity > 0 && (
                      <div className="w-full bg-muted rounded-full h-1 mt-1">
                        <div
                          className={cn("h-1 rounded-full transition-all", m.status === 'esgotado' ? 'bg-red-500' : m.status === 'estoque_baixo' ? 'bg-amber-400' : 'bg-green-500')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold">{m.quantity} <span className="font-normal text-muted-foreground">{m.unit}</span></p>
                    {m.min_quantity > 0 && <p className="text-xs text-muted-foreground">mín: {m.min_quantity}</p>}
                  </div>
                  <Badge variant="outline" className={cn("text-xs border shrink-0", sc.cls)}>{sc.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}