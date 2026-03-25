import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FingerprintCapture — captura simulada de digital para demonstração
 * Props:
 *   onCapture(fir: string, quality: number) — chamado com sucesso
 *   onError(msg: string) — chamado em erro
 *   label — texto do botão
 *   disabled — desabilita o botão
 */
export default function FingerprintCapture({ onCapture, onError, label = 'Capturar Digital', disabled }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [quality, setQuality] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCapture = async () => {
    setStatus('scanning');
    setErrorMsg('');

    // Simula captura de digital com delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simula sucesso com qualidade aleatória
    const simulatedQuality = Math.floor(Math.random() * 30) + 70; // 70-99%
    const simulatedFIR = btoa(`mock_fir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    setQuality(simulatedQuality);
    setStatus('success');
    onCapture?.(simulatedFIR, simulatedQuality);
  };

  const reset = () => {
    setStatus('idle');
    setQuality(null);
    setErrorMsg('');
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
              Modo demonstração: clique para simular captura
            </p>
            <Button onClick={handleCapture} disabled={disabled} size="lg" className="gap-2 rounded-xl px-8">
              <Fingerprint className="h-5 w-5" />
              {label}
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
                className="absolute inset-3 rounded-full border border-primary/50"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
              />
              <Fingerprint className="h-14 w-14 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-primary">Simulando captura...</p>
            </div>
            <p className="text-xs text-muted-foreground">Aguardando simulação</p>
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
              <p className="text-sm font-semibold text-green-700">Digital simulada!</p>
              {quality !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Qualidade simulada: <span className={cn(
                    'font-medium',
                    quality >= 70 ? 'text-green-600' : quality >= 40 ? 'text-amber-600' : 'text-red-600'
                  )}>{quality}%</span>
                </p>
              )}
            </div>
            <Button variant="outline" onClick={reset} size="sm" className="gap-2 rounded-xl">
              <RefreshCw className="h-3.5 w-3.5" /> Simular novamente
            </Button>
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
              <p className="text-sm font-semibold text-red-600">Falha na simulação</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">{errorMsg || 'Erro ao simular captura'}</p>
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