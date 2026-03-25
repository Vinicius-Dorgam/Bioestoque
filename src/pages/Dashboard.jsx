import React from 'react';
import { entities } from '@/api/biometricClient';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowDownCircle, AlertTriangle, TrendingDown, RefreshCw } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { subDays } from 'date-fns';
import LowStockChart from '../components/dashboard/LowStockChart';
import Top5Chart from '../components/dashboard/Top5Chart';
import VolumeChart from '../components/dashboard/VolumeChart';
import InventoryCheck from '../components/dashboard/InventoryCheck';
import MovimentacoesRecentes from '../components/dashboard/MovimentacoesRecentes';

export default function Dashboard() {
  const { data: materials = [], isLoading: loadingMaterials, refetch: refetchMaterials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
  });

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: checkouts = [], isLoading: loadingCheckouts, refetch: refetchCheckouts } = useQuery({
    queryKey: ['checkouts-dashboard'],
    queryFn: () => base44.entities.MaterialCheckout.list('-created_date', 500),
  });

  const isLoading = loadingMaterials || loadingCheckouts;

  const recent30 = checkouts.filter(c => new Date(c.created_date) >= new Date(thirtyDaysAgo));
  const totalMaterials = materials.length;
  const lowStock = materials.filter(m => m.status === 'estoque_baixo').length;
  const outOfStock = materials.filter(m => m.status === 'esgotado').length;
  const saidasMes = recent30.filter(c => c.type === 'sauce' || c.type === 'saida').reduce((s, c) => s + (c.quantity || 0), 0);

  const handleRefresh = () => {
    refetchMaterials();
    refetchCheckouts();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Visão geral do controle de materiais</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Materiais" value={totalMaterials} icon={Package} />
        <StatCard
          title="Saídas (30 dias)"
          value={recent30.filter(c => c.type === 'saida').reduce((s, c) => s + (c.quantity || 0), 0)}
          icon={ArrowDownCircle}
        />
        <StatCard
          title="Estoque Baixo"
          value={lowStock}
          icon={AlertTriangle}
          trendLabel={lowStock > 0 ? `${lowStock} itens` : undefined}
          trend="down"
        />
        <StatCard
          title="Esgotados"
          value={outOfStock}
          icon={TrendingDown}
          trendLabel={outOfStock > 0 ? 'Atenção' : undefined}
          trend="down"
        />
      </div>

      {/* Gráfico de volume — linha cheia */}
      <VolumeChart checkouts={recent30} />

      {/* Gráficos de estoque e top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockChart materials={materials} />
        <Top5Chart checkouts={recent30} />
      </div>

      {/* Conferência de inventário + movimentações com filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryCheck materials={materials} />
        <MovimentacoesRecentes checkouts={checkouts} />
      </div>
    </div>
  );
}