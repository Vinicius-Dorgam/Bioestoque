import React, { useState } from 'react';
import { entities } from '@/api/biometricClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Fingerprint, UserPlus, Trash2, CheckCircle2, ShieldCheck,
  AlertTriangle, User, Calendar
} from 'lucide-react';
import FingerprintCapture from '../components/biometric/FingerprintCapture';
import AgentStatusBadge from '../components/biometric/AgentStatusBadge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const FINGERS = [
  { index: 0, label: 'Polegar direito' },
  { index: 1, label: 'Indicador direito' },
  { index: 2, label: 'Médio direito' },
  { index: 3, label: 'Anelar direito' },
  { index: 4, label: 'Mínimo direito' },
  { index: 5, label: 'Polegar esquerdo' },
  { index: 6, label: 'Indicador esquerdo' },
  { index: 7, label: 'Médio esquerdo' },
  { index: 8, label: 'Anelar esquerdo' },
  { index: 9, label: 'Mínimo esquerdo' },
];

export default function BiometricEnrollment() {
  const [agentOnline, setAgentOnline] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteProfile, setDeleteProfile] = useState(null);
  const [capturedFir, setCapturedFir] = useState(null);
  const [form, setForm] = useState({ user_name: '', user_email: '', finger_index: '1', finger_label: 'Indicador direito' });
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['biometric-profiles'],
    queryFn: () => entities.BiometricProfile.list('-created_date'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => Promise.resolve({ full_name: 'Usuário Local', email: 'local@bioestoque.com' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.BiometricProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] });
      toast.success('Biometria cadastrada com sucesso!');
      resetForm();
    },
    onError: () => toast.error('Erro ao salvar biometria'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.BiometricProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] });
      toast.success('Perfil biométrico removido');
      setDeleteProfile(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => entities.BiometricProfile.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setCapturedFir(null);
    setForm({ user_name: '', user_email: '', finger_index: '1', finger_label: 'Indicador direito' });
  };

  const handleSave = () => {
    if (!form.user_name.trim()) { toast.error('Informe o nome do usuário'); return; }
    if (!form.user_email.trim()) { toast.error('Informe o email do usuário'); return; }
    if (!capturedFir) { toast.error('Capture a digital primeiro'); return; }

    createMutation.mutate({
      user_name: form.user_name,
      user_email: form.user_email,
      fir_data: capturedFir,
      finger_index: Number(form.finger_index),
      finger_label: form.finger_label,
      device_model: 'Nitgen Hamster DX',
      active: true,
      enrollment_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleFillCurrentUser = () => {
    if (currentUser) {
      setForm(f => ({ ...f, user_name: currentUser.full_name || '', user_email: currentUser.email || '' }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro Biométrico</h1>
          <p className="text-muted-foreground mt-1">Gerencie os perfis biométricos dos usuários</p>
        </div>
        <div className="flex items-center gap-3">
          <AgentStatusBadge onStatusChange={setAgentOnline} className="" />
          <Button
            onClick={() => setShowForm(true)}
            disabled={!agentOnline}
            className="gap-2 rounded-xl"
            title={!agentOnline ? 'Agente local offline' : ''}
          >
            <UserPlus className="h-4 w-4" /> Nova Biometria
          </Button>
        </div>
      </div>

      {/* Aviso agente offline */}
      <AnimatePresence>
        {!agentOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Agente local não detectado</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Para usar o leitor Nitgen Hamster DX, o agente local precisa estar rodando no computador.
                      Execute <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">python agent.py</code> para iniciar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulário de cadastro */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          >
            <Card className="border-primary/30 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  Cadastrar Nova Biometria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dados do usuário */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Nome *</Label>
                      {currentUser && (
                        <button onClick={handleFillCurrentUser} className="text-xs text-primary hover:underline">
                          Usar meu nome
                        </button>
                      )}
                    </div>
                    <Input
                      value={form.user_name}
                      onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
                      placeholder="Nome completo"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.user_email}
                      onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Dedo */}
                <div className="space-y-2">
                  <Label>Dedo a cadastrar</Label>
                  <Select
                    value={form.finger_index.toString()}
                    onValueChange={v => {
                      const finger = FINGERS.find(f => f.index === Number(v));
                      setForm(f => ({ ...f, finger_index: v, finger_label: finger?.label || '' }));
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINGERS.map(f => (
                        <SelectItem key={f.index} value={f.index.toString()}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Captura */}
                <div className="border rounded-xl p-6 bg-muted/30">
                  <p className="text-sm font-medium text-center mb-6 text-muted-foreground">
                    Capture a digital do <strong className="text-foreground">{form.finger_label}</strong>
                  </p>
                  <FingerprintCapture
                    onCapture={(fir) => setCapturedFir(fir)}
                    onError={() => setCapturedFir(null)}
                    label="Capturar Digital"
                    disabled={createMutation.isPending}
                  />
                </div>

                {/* Ações */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancelar</Button>
                  <Button
                    onClick={handleSave}
                    disabled={!agentOnline || !capturedFir || createMutation.isPending}
                    className="gap-2 rounded-xl"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {createMutation.isPending ? 'Salvando...' : 'Salvar Biometria'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de perfis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Perfis Cadastrados</span>
            <Badge variant="secondary">{profiles.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <Fingerprint className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum perfil biométrico cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map(profile => (
                <motion.div
                  key={profile.id}
                  layout
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border transition-all',
                    profile.active ? 'bg-card' : 'bg-muted/30 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      profile.active ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <User className={cn('h-5 w-5', profile.active ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{profile.user_name}</p>
                        {profile.active ? (
                          <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground">{profile.user_email}</p>
                        <span className="text-muted-foreground/50">·</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Fingerprint className="h-3 w-3" />
                          {profile.finger_label || 'Dedo não especificado'}
                        </p>
                        {profile.enrollment_date && (
                          <>
                            <span className="text-muted-foreground/50">·</span>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(profile.enrollment_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs rounded-lg h-8"
                      onClick={() => toggleMutation.mutate({ id: profile.id, active: !profile.active })}
                    >
                      {profile.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                      onClick={() => setDeleteProfile(profile)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm delete */}
      <AlertDialog open={!!deleteProfile} onOpenChange={() => setDeleteProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover perfil biométrico?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a biometria de <strong>{deleteProfile?.user_name}</strong>?
              Esta pessoa não poderá mais autenticar com digital.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteProfile.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}