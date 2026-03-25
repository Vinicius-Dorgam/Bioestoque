import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, Search, ShieldCheck, FileDown, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportHistoricoToPDF, exportHistoricoToExcel } from '@/lib/exportReport';

const typeConfig = {
  saida: { label: 'Saída', icon: ArrowDownCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  entrada: { label: 'Entrada', icon: ArrowUpCircle, color: 'bg-green-100 text-green-700 border-green-200' },
  devolucao: { label: 'Devolução', icon: RotateCcw, color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export default function History() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { data: checkouts = [], isLoading } = useQuery({
    queryKey: ['checkouts'],
    queryFn: () => base44.entities.MaterialCheckout.list('-created_date', 100),
  });

  const filtered = checkouts.filter(c => {
    const matchSearch =
      c.material_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.responsible?.toLowerCase().includes(search.toLowerCase()) ||
      c.material_code?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground mt-1">{checkouts.length} movimentações registradas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por material ou responsável..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="devolucao">Devoluções</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl shrink-0" disabled={filtered.length === 0}>
              <FileDown className="h-4 w-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportHistoricoToPDF(filtered, filterType !== 'all' ? filterType : '')}>
              <FileDown className="h-4 w-4 mr-2 text-red-500" /> Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportHistoricoToExcel(filtered)}>
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Exportar Excel (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhuma movimentação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const type = typeConfig[c.type] || typeConfig.saida;
            const TypeIcon = type.icon;
            return (
              <Card key={c.id} className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      c.type === 'saida' ? 'bg-red-100' : c.type === 'entrada' ? 'bg-green-100' : 'bg-blue-100'
                    )}>
                      <TypeIcon className={cn("h-5 w-5",
                        c.type === 'saida' ? 'text-red-600' : c.type === 'entrada' ? 'text-green-600' : 'text-blue-600'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{c.material_name}</h3>
                        <Badge variant="outline" className="text-xs font-mono">{c.material_code}</Badge>
                        <Badge className={cn("text-xs border", type.color)}>{type.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{c.responsible}</span>
                        {c.purpose && <span>• {c.purpose}</span>}
                        {c.biometric_verified && (
                          <span className="flex items-center gap-1 text-green-600">
                            <ShieldCheck className="h-3 w-3" /> Biometria
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={cn("text-lg font-bold",
                        c.type === 'saida' ? 'text-red-600' : 'text-green-600'
                      )}>
                        {c.type === 'saida' ? '-' : '+'}{c.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {c.notes && (
                    <p className="text-xs text-muted-foreground mt-2 pl-14 italic">"{c.notes}"</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}