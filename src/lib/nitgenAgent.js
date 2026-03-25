/**
 * NitgenAgent — cliente para comunicação com o agente local Nitgen
 * Conecta via HTTP ao serviço rodando em localhost:8080
 * 
 * O agente local deve estar rodando no computador com o leitor USB conectado.
 * Veja /docs/NitgenAgent_Setup.md para instruções de instalação.
 */

const AGENT_BASE_URL = 'http://localhost:8080';
const AGENT_TIMEOUT_MS = 15000;

/**
 * Verifica se o agente local está disponível
 * @returns {Promise<{online: boolean, version?: string, device?: string}>}
 */
export async function checkAgentStatus() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${AGENT_BASE_URL}/status`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, version: data.version, device: data.device };
  } catch {
    return { online: false };
  }
}

/**
 * Captura uma digital do leitor e retorna o FIR (template)
 * @param {object} options
 * @param {number} [options.timeout=10000] - Timeout em ms
 * @returns {Promise<{success: boolean, fir?: string, quality?: number, error?: string}>}
 */
export async function captureFingerprint({ timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    const res = await fetch(`${AGENT_BASE_URL}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeout }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Erro ao capturar digital' };
    return { success: true, fir: data.fir, quality: data.quality };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { success: false, error: 'Timeout: leitor não respondeu' };
    return { success: false, error: 'Agente local não disponível. Verifique se está rodando.' };
  }
}

/**
 * Verifica uma digital capturada contra um FIR cadastrado (1:1)
 * @param {string} enrolledFir - FIR cadastrado no banco
 * @param {string} capturedFir - FIR capturado agora
 * @returns {Promise<{success: boolean, matched: boolean, score?: number, error?: string}>}
 */
export async function verifyFingerprint(enrolledFir, capturedFir) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    const res = await fetch(`${AGENT_BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrolled_fir: enrolledFir, captured_fir: capturedFir }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) return { success: false, matched: false, error: data.error };
    return { success: true, matched: data.matched, score: data.score };
  } catch (err) {
    clearTimeout(timer);
    return { success: false, matched: false, error: 'Agente local não disponível.' };
  }
}

/**
 * Identifica uma digital capturada contra uma lista de FIRs (1:N)
 * @param {string} capturedFir - FIR capturado agora
 * @param {Array<{id: string, fir: string}>} profiles - Lista de perfis para comparar
 * @returns {Promise<{success: boolean, matched_id?: string, score?: number, error?: string}>}
 */
export async function identifyFingerprint(capturedFir, profiles) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    const res = await fetch(`${AGENT_BASE_URL}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captured_fir: capturedFir, profiles }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, matched_id: data.matched_id, score: data.score };
  } catch (err) {
    clearTimeout(timer);
    return { success: false, error: 'Agente local não disponível.' };
  }
}
