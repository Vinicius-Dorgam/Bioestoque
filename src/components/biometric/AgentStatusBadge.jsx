import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { checkAgentStatus } from '@/lib/nitgenAgent';
import { cn } from '@/lib/utils';

export default function AgentStatusBadge({ onStatusChange, className }) {
  const [status, setStatus] = useState('checking'); // checking | online | offline
  const [device, setDevice] = useState(null);

  const check = async () => {
    setStatus('checking');
    const result = await checkAgentStatus();
    setStatus(result.online ? 'online' : 'offline');
    setDevice(result.device || null);
    onStatusChange?.(result.online);
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 10000); // re-verifica a cada 10s
    return () => clearInterval(interval);
  }, []);

  const configs = {
    checking: { icon: Loader2, label: 'Verificando...', color: 'text-muted-foreground bg-muted', spin: true },
    online:   { icon: Wifi,    label: device ? `Leitor: ${device}` : 'Leitor conectado', color: 'text-green-700 bg-green-100', spin: false },
    offline:  { icon: WifiOff, label: 'Agente offline', color: 'text-red-700 bg-red-100', spin: false },
  };

  const cfg = configs[status];
  const Icon = cfg.icon;

  return (
    <div
      onClick={status === 'offline' ? check : undefined}
      title={status === 'offline' ? 'Clique para tentar novamente' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
        cfg.color,
        status === 'offline' && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      <Icon className={cn('h-3 w-3', cfg.spin && 'animate-spin')} />
      {cfg.label}
    </div>
  );
}