import React, { useState } from 'react';
import { entities } from '@/api/biometricClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileDown, FileSpreadsheet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportInventarioToPDF, exportInventarioToExcel } from '@/lib/exportReport';
import { Skeleton } from '@/components/ui/skeleton';
import MaterialCard from '../components/materials/MaterialCard';
import MaterialForm from '../components/materials/MaterialForm';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Materials() {
  const [showForm, setShowForm] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [deleteMaterial, setDeleteMaterial] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Material.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materials'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Material.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materials'] }); setEditMaterial(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Material.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materials'] }); setDeleteMaterial(null); },
  });

  const handleSave = async (data) => {
    if (editMaterial) {
      await updateMutation.mutateAsync({ id: editMaterial.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const filtered = materials.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materiais</h1>
          <p className="text-muted-foreground mt-1">{materials.length} materiais cadastrados</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl" disabled={filtered.length === 0}>
                <FileDown className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportInventarioToPDF(filtered, search || '')}>
                <FileDown className="h-4 w-4 mr-2 text-red-500" /> Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportInventarioToExcel(filtered)}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Exportar Excel (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Novo Material
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum material encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(m => (
            <MaterialCard key={m.id} material={m}
              onEdit={mat => { setEditMaterial(mat); }}
              onDelete={mat => setDeleteMaterial(mat)}
            />
          ))}
        </div>
      )}

      <MaterialForm
        open={showForm || !!editMaterial}
        material={editMaterial}
        onClose={() => { setShowForm(false); setEditMaterial(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteMaterial} onOpenChange={() => setDeleteMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteMaterial?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteMaterial.id)} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}