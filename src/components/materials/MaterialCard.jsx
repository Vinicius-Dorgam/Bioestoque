import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryLabels = {
  ferramentas: 'Ferramentas', eletricos: 'Elétricos', hidraulicos: 'Hidráulicos',
  construcao: 'Construção', epi: 'EPI', limpeza: 'Limpeza',
  escritorio: 'Escritório', outros: 'Outros'
};

const statusConfig = {
  disponivel: { label: 'Disponível', class: 'bg-green-100 text-green-700 border-green-200' },
  estoque_baixo: { label: 'Estoque Baixo', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  esgotado: { label: 'Esgotado', class: 'bg-red-100 text-red-700 border-red-200' },
};

export default function MaterialCard({ material, onEdit, onDelete }) {
  const status = statusConfig[material.status] || statusConfig.disponivel;

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{material.name}</h3>
              <Badge variant="outline" className="text-xs font-mono">{material.code}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <Badge className={cn("text-xs border", status.class)}>{status.label}</Badge>
              <span className="text-xs text-muted-foreground">{categoryLabels[material.category]}</span>
              {material.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {material.location}
                </span>
              )}
            </div>
            <p className="text-lg font-bold mt-2">
              {material.quantity} <span className="text-sm font-normal text-muted-foreground">{material.unit}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(material)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(material)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}