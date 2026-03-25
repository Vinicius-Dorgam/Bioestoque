import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * AgentStatusBadge — componente simplificado que sempre mostra "online"
 * Para modo demonstração/standalone sem agente externo
 */
export default function AgentStatusBadge({ onStatusChange, className }) {
  // Sempre retorna online para modo demonstração
  React.useEffect(() => {
    onStatusChange?.(true);
  }, [onStatusChange]);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100 ${className || ''}`}>
      <CheckCircle className="h-3 w-3" />
      Modo demonstração
    </div>
  );
}