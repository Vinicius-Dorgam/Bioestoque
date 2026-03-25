import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, CheckCircle2, Loader2, Package } from 'lucide-react';
import BiometricAuth from '../components/biometric/BiometricAuth';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

export default function Checkout() {
  const [step, setStep] = useState(1); // 1: form, 2: biometric, 3: success
  const [form, setForm] = useState({
    material_id: '', quantity: 1, purpose: '', notes: '', type: 'saida'
  });
  const queryClient = useQueryClient();

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: biometricProfiles = [] } = useQuery({
    queryKey: ['biometric-profiles'],
    queryFn: () => base44.entities.BiometricProfile.list(),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data) => {
      const material = materials.find(m => m.id === data.material_id);
      if (!material) throw new Error('Material não encontrado');

      const newQty = data.type === 'saida'
        ? material.quantity - data.quantity
        : material.quantity + data.quantity;

      if (newQty < 0) throw new Error('Quantidade insuficiente em estoque');

      await base44.entities.MaterialCheckout.create({
        ...data,
        material_name: material.name,
        material_code: material.code,
        responsible: user?.full_name || 'Usuário',
        responsible_email: user?.email || '',
        biometric_verified: true,
      });

      const status = newQty <= 0 ? 'esgotado' : newQty <= material.min_quantity ? 'estoque_baixo' : 'disponivel';
      await base44.entities.Material.update(material.id, { quantity: newQty, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      setStep(3);
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao processar baixa');
      setStep(1);
    },
  });

  const selectedMaterial = materials.find(m => m.id === form.material_id);

  const handleBiometricSuccess = (matchedProfile) => {
    checkoutMutation.mutate({
      ...form,
      responsible: matchedProfile?.user_name || user?.full_name || 'Usuário',
      responsible_email: matchedProfile?.user_email || user?.email || '',
    });
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!form.material_id) { toast.error('Selecione um material'); return; }
    if (form.quantity <= 0) { toast.error('Quantidade deve ser maior que zero'); return; }
    if (form.type === 'saida' && selectedMaterial && form.quantity > selectedMaterial.quantity) {
      toast.error('Quantidade maior que o estoque disponível'); return;
    }
    setStep(2);
  };

  const reset = () => {
    setForm({ material_id: '', quantity: 1, purpose: '', notes: '', type: 'saida' });
    setStep(1);
  };

  const typeConfig = {
    saida: { label: 'Saída', icon: ArrowDownCircle, color: 'text-red-500' },
    entrada: { label: 'Entrada', icon: ArrowUpCircle, color: 'text-green-500' },
    devolucao: { label: 'Devolução', icon: RotateCcw, color: 'text-blue-500' },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Movimentação de Material</h1>
        <p className="text-muted-foreground mt-1">Registre a saída, entrada ou devolução de materiais</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 justify-center">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {s}
            </div>
            {s < 3 && <div className={cn("w-12 h-0.5 transition-all", step > s ? "bg-primary" : "bg-muted")} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da Movimentação</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitForm} className="space-y-5">
                  {/* Tipo */}
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={form.type === key ? "default" : "outline"}
                        className="flex flex-col items-center gap-1 h-auto py-3 rounded-xl"
                        onClick={() => setForm(p => ({ ...p, type: key }))}
                      >
                        <cfg.icon className={cn("h-5 w-5", form.type === key ? '' : cfg.color)} />
                        <span className="text-xs">{cfg.label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Material */}
                  <div className="space-y-2">
                    <Label>Material *</Label>
                    <Select value={form.material_id} onValueChange={v => setForm(p => ({ ...p, material_id: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o material" /></SelectTrigger>
                      <SelectContent>
                        {materials.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span>{m.name}</span>
                              <span className="text-muted-foreground text-xs">({m.quantity} {m.unit})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantidade */}
                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number" min="1"
                      max={form.type === 'saida' && selectedMaterial ? selectedMaterial.quantity : undefined}
                      value={form.quantity}
                      onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                      className="rounded-xl"
                    />
                    {selectedMaterial && form.type === 'saida' && (
                      <p className="text-xs text-muted-foreground">Disponível: {selectedMaterial.quantity} {selectedMaterial.unit}</p>
                    )}
                  </div>

                  {/* Finalidade */}
                  <div className="space-y-2">
                    <Label>Finalidade</Label>
                    <Input value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="Ex: Manutenção predial" className="rounded-xl" />
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="rounded-xl" placeholder="Observações adicionais" />
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-12 text-base" size="lg">
                    Prosseguir para Verificação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="biometric" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-center">Verificação Biométrica</CardTitle>
              </CardHeader>
              <CardContent className="py-8">
                {checkoutMutation.isPending ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Processando movimentação...</p>
                  </div>
                ) : (
                  <BiometricAuth
                    onSuccess={handleBiometricSuccess}
                    onError={() => toast.error('Falha na verificação biométrica')}
                    profiles={biometricProfiles}
                  />
                )}
                <div className="mt-6 text-center">
                  <Button variant="ghost" onClick={() => setStep(1)} className="text-sm">
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold">Movimentação Registrada!</h2>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    A {typeConfig[form.type]?.label?.toLowerCase()} de <strong>{form.quantity}</strong> unidade(s) de <strong>{selectedMaterial?.name}</strong> foi registrada com sucesso.
                  </p>
                  <Button onClick={reset} className="mt-4 rounded-xl">
                    Nova Movimentação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}