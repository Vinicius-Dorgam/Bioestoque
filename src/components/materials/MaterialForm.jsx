import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X } from 'lucide-react';

const categories = [
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'eletricos', label: 'Elétricos' },
  { value: 'hidraulicos', label: 'Hidráulicos' },
  { value: 'construcao', label: 'Construção' },
  { value: 'epi', label: 'EPI' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'outros', label: 'Outros' },
];

const units = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'metro', label: 'Metro' },
  { value: 'litro', label: 'Litro' },
  { value: 'kg', label: 'Kg' },
  { value: 'rolo', label: 'Rolo' },
  { value: 'par', label: 'Par' },
];

export default function MaterialForm({ material, open, onClose, onSave }) {
  const [form, setForm] = useState(material || {
    name: '', code: '', category: '', quantity: 0,
    min_quantity: 0, unit: 'unidade', location: '', description: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const status = form.quantity <= 0 ? 'esgotado' : form.quantity <= form.min_quantity ? 'estoque_baixo' : 'disponivel';
    await onSave({ ...form, status, quantity: Number(form.quantity), min_quantity: Number(form.min_quantity) });
    setSaving(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? 'Editar Material' : 'Novo Material'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Nome do material" required />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Código *</Label>
              <Input value={form.code} onChange={e => update('code', e.target.value)} placeholder="MAT-001" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Select value={form.unit} onValueChange={v => update('unit', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="0" value={form.quantity} onChange={e => update('quantity', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Qtd. Mínima</Label>
              <Input type="number" min="0" value={form.min_quantity} onChange={e => update('min_quantity', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Localização</Label>
            <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Ex: Almoxarifado A, Prateleira 3" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Descrição do material" rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}