import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BiometricAuth — verificação simulada de identidade para demonstração
 * Props:
 *   onSuccess(profile) — chamado com o perfil encontrado
 *   onError(msg) — chamado em caso de erro
 *   profiles — lista de BiometricProfile cadastrados (obrigatório)
 *   disabled — desabilita o componente
 */
export default function BiometricAuth({ onSuccess, onError, profiles = [], disabled }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [matchedProfile, setMatchedProfile] = useState(null);

  const handleAuth = async () => {
    if (profiles.length === 0) {
      setErrorMsg('Nenhum perfil biométrico cadastrado. Acesse "Cadastro Biométrico" para registrar.');
      setStatus('error');
      return;
    }

    setStatus('scanning');
    setErrorMsg('');

    // Simula verificação com delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simula sucesso aleatório (70% de chance)
    const isSuccess = Math.random() > 0.3;
    
    if (isSuccess && profiles.length > 0) {
      // Seleciona um perfil aleatório para "autenticar"
      const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
      setMatchedProfile(randomProfile);
      setStatus('success');
      setTimeout(() => onSuccess?.(randomProfile), 800);
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
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="idle"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/40">
              <Fingerprint className="h-14 w-14 text-primary" />
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Modo demonstração: clique para simular verificação
            </p>

            <Button
              onClick={handleAuth}
              disabled={disabled}
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
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-primary">Identificando...</p>
            </div>
            <p className="text-xs text-muted-foreground">Simulando verificação</p>
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