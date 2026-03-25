/**
 * BiometricAgent — cliente simulado para demonstração
 * Simula captura e verificação biométrica sem hardware externo
 */

const SIMULATION_DELAY = 2000; // 2 segundos para simular captura real

/**
 * Verifica se o "agente" está disponível (sempre true para modo standalone)
 * @returns {Promise<{online: boolean, version?: string, device?: string}>}
 */
export async function checkAgentStatus() {
  // Simula verificação com delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { 
    online: true, 
    version: "1.0.0", 
    device: "BioEstoque Simulator" 
  };
}

/**
 * Captura uma digital simulada
 * @param {object} options
 * @param {number} [options.timeout=10000] - Timeout em ms
 * @returns {Promise<{success: boolean, fir?: string, quality?: number, error?: string}>}
 */
export async function captureFingerprint({ timeout = 10000 } = {}) {
  try {
    // Simula tempo de captura
    await new Promise(resolve => setTimeout(resolve, SIMULATION_DELAY));
    
    // Gera FIR simulado com qualidade aleatória
    const quality = Math.floor(Math.random() * 30) + 70; // 70-99%
    const fir = btoa(`BIOESTOQUE_FIR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    return { 
      success: true, 
      fir, 
      quality,
      timestamp: new Date().toISOString()
    };
    
  } catch (err) {
    return { 
      success: false, 
      error: 'Erro na captura simulada' 
    };
  }
}

/**
 * Verificação 1:1 simulada de digitais
 * @param {string} enrolledFir - FIR cadastrado
 * @param {string} capturedFir - FIR capturada
 * @returns {Promise<{success: boolean, matched: boolean, score?: number, error?: string}>}
 */
export async function verifyFingerprint(enrolledFir, capturedFir) {
  if (!enrolledFir || !capturedFir) {
    return { success: false, matched: false, error: 'FIRs inválidos' };
  }
  
  try {
    // Simula tempo de verificação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simula matching baseado em hash (70% de sucesso)
    const hash1 = enrolledFir.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const hash2 = capturedFir.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const matched = Math.abs(hash1 - hash2) < 1000000;
    
    const score = matched 
      ? Math.floor(Math.random() * 20) + 80  // 80-99%
      : Math.floor(Math.random() * 40) + 20; // 20-59%
    
    return { 
      success: true, 
      matched, 
      score 
    };
    
  } catch (err) {
    return { 
      success: false, 
      matched: false, 
      error: 'Erro na verificação' 
    };
  }
}

/**
 * Identificação 1:N simulada
 * @param {string} capturedFir - FIR capturada
 * @param {Array<{id: string, fir: string}>} profiles - Lista de perfis
 * @returns {Promise<{success: boolean, matched_id?: string, score?: number, error?: string}>}
 */
export async function identifyFingerprint(capturedFir, profiles) {
  if (!capturedFir || !profiles || profiles.length === 0) {
    return { success: false, error: 'Dados inválidos ou sem perfis' };
  }
  
  try {
    // Simula tempo de identificação
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simula busca pelo melhor match
    let bestMatch = null;
    let bestScore = 0;
    
    for (const profile of profiles) {
      const result = await verifyFingerprint(profile.fir, capturedFir);
      if (result.success && result.matched && result.score > bestScore) {
        bestMatch = profile.id;
        bestScore = result.score;
      }
    }
    
    // 60% de chance de encontrar match se houver perfis
    const shouldMatch = Math.random() > 0.4;
    
    if (shouldMatch && bestMatch) {
      return {
        success: true,
        matched_id: bestMatch,
        score: bestScore
      };
    } else {
      return {
        success: true,
        matched_id: null,
        score: 0
      };
    }
    
  } catch (err) {
    return { 
      success: false, 
      error: 'Erro na identificação' 
    };
  }
}
