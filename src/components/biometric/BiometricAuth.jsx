import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, XCircle, Loader2, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { captureFingerprint, identifyFingerprint } from '@/lib/biometricAgent';
import AgentStatusBadge from './AgentStatusBadge';

/**
 * BiometricAuth — verificação simulada de identidade biométrica
 * Realiza identificação 1:N contra todos os perfis ativos no banco
 *
 * Props:
 *   onSuccess(profile) — chamado com o perfil encontrado
 *   onError(msg) — chamado em caso de erro
 *   profiles — lista de BiometricProfile cadastrados (obrigatório)
 *   disabled — desabilita o componente
 */
export default function BiometricAuth({ onSuccess, onError, profiles = [], disabled }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [agentOnline, setAgentOnline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [matchedProfile, setMatchedProfile] = useState(null);

  const handleAuth = async () => {
    if (!agentOnline) {
      setErrorMsg('Simulador offline. Aguarde a inicialização.');
      setStatus('error');
      return;
    }

    if (profiles.length === 0) {
      setErrorMsg('Nenhum perfil biométrico cadastrado. Acesse "Cadastro Biométrico" para registrar.');
      setStatus('error');
      return;
    }

    setStatus('scanning');
    setErrorMsg('');

    // 1. Captura a digital atual
    const capture = await captureFingerprint({ timeout: 10000 });
    if (!capture.success) {
      setErrorMsg(capture.error || 'Falha ao capturar digital');
      setStatus('error');
      onError?.(capture.error);
      return;
    }

    // 2. Identifica 1:N contra todos os perfis ativos
    const activeProfiles = profiles.filter(p => p.active !== false);
    const profilesPayload = activeProfiles.map(p => ({ id: p.id, fir: p.fir_data }));

    const result = await identifyFingerprint(capture.fir, profilesPayload);

    if (result.success && result.matched_id) {
      const found = activeProfiles.find(p => p.id === result.matched_id);
      setMatchedProfile(found || null);
      setStatus('success');
      setTimeout(() => onSuccess?.(found), 800);
    } else {
      setErrorMsg('Digital não reconhecida. Tente novamente ou use outro dedo.');
      setStatus('error');
      onError?.('Digital não reconhecida');
    }
  };

  const reset = () => {
    setStatus('idle');
    setErrorMsg('');
    setMatchedProfile(null);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Status do simulador */}
      <AgentStatusBadge onStatusChange={setAgentOnline} className="" />

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="idle"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center border-2 border-dashed transition-colors",
              agentOnline ? "bg-primary/10 border-primary/40" : "bg-muted border-muted-foreground/30"
            )}>
              <Fingerprint className={cn("h-14 w-14", agentOnline ? "text-primary" : "text-muted-foreground")} />
            </div>

            {!agentOnline ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-xs">Simulador offline — aguarde inicialização</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Clique para simular verificação biométrica
              </p>
            )}

            <Button
              onClick={handleAuth}
              disabled={disabled || !agentOnline}
              size="lg"
              className="gap-2 px-8 rounded-xl"
            >
              <ShieldCheck className="h-5 w-5" />
              Verificar Identidade
            </Button>
          </motion.div>
        )}

        {status === 'scanning' && (
          <motion.div key="scanning"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center relative">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary"
                animate={{ scale: [1, 1.25, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border border-primary/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              />
              <Fingerprint className="h-14 w-14 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm font-medium text-primary">Identificando...</p>
            </div>
            <p className="text-xs text-muted-foreground">Simulando verificação biométrica</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-14 w-14 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-green-700">Identidade verificada!</p>
              {matchedProfile && (
                <p className="text-sm text-muted-foreground mt-1">{matchedProfile.user_name}</p>
              )}
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div key="error"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-28 h-28 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-14 w-14 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-red-600">Verificação falhou</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">{errorMsg}</p>
            </div>
            <Button variant="outline" onClick={reset} className="gap-2 rounded-xl">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}