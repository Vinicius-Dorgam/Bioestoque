import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const now = () => format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

// ─── Helpers PDF ─────────────────────────────────────────────────────────────

function drawHeader(doc, title, subtitle) {
  // Faixa azul no topo
  doc.setFillColor(30, 90, 210);
  doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`BioEstoque  |  ${subtitle}`, 14, 21);

  doc.setTextColor(0, 0, 0);
}

function drawTable(doc, headers, rows, startY, colWidths) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const rowHeight = 8;
  const marginLeft = 14;
  let y = startY;

  // Header row
  const drawHeaderRow = (posY) => {
    doc.setFillColor(30, 90, 210);
    doc.rect(marginLeft, posY, pageWidth - marginLeft * 2, rowHeight, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    let x = marginLeft + 2;
    headers.forEach((h, i) => {
      doc.text(String(h), x, posY + 5.5);
      x += colWidths[i];
    });
    doc.setTextColor(0, 0, 0);
    return posY + rowHeight;
  };

  y = drawHeaderRow(y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  rows.forEach((row, ri) => {
    // Nova página se necessário
    if (y + rowHeight > pageHeight - 14) {
      doc.addPage();
      y = 14;
      y = drawHeaderRow(y);
    }

    // Alternating row bg
    if (ri % 2 === 0) {
      doc.setFillColor(245, 247, 252);
      doc.rect(marginLeft, y, pageWidth - marginLeft * 2, rowHeight, 'F');
    }

    let x = marginLeft + 2;
    row.forEach((cell, ci) => {
      const text = String(cell ?? '');
      const maxW = colWidths[ci] - 3;
      const truncated = doc.getTextWidth(text) > maxW
        ? text.substring(0, Math.floor(text.length * maxW / doc.getTextWidth(text)) - 1) + '…'
        : text;
      doc.text(truncated, x, y + 5.5);
      x += colWidths[ci];
    });

    // linha divisória
    doc.setDrawColor(220, 224, 235);
    doc.line(marginLeft, y + rowHeight, pageWidth - marginLeft, y + rowHeight);

    y += rowHeight;
  });

  return y;
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.width;
    const h = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 6, { align: 'right' });
    doc.text(`Gerado em ${now()}`, 14, h - 6);
    doc.setTextColor(0);
  }
}

// ─── PDF Histórico ───────────────────────────────────────────────────────────

export function exportHistoricoToPDF(rows, filterLabel = '') {
  const doc = new jsPDF({ orientation: 'landscape' });
  const typeLabel = { saida: 'Saída', entrada: 'Entrada', devolucao: 'Devolução' };

  drawHeader(doc, 'Histórico de Movimentações', `${rows.length} registros${filterLabel ? '  |  Filtro: ' + filterLabel : ''}`);

  const headers = ['Data/Hora', 'Tipo', 'Material', 'Código', 'Qtd', 'Responsável', 'Finalidade', 'Biometria'];
  const colWidths = [32, 22, 58, 28, 14, 45, 48, 20];

  const tableRows = rows.map(c => [
    format(new Date(c.created_date), 'dd/MM/yy HH:mm', { locale: ptBR }),
    typeLabel[c.type] || c.type,
    c.material_name || '-',
    c.material_code || '-',
    c.type === 'saida' ? `-${c.quantity}` : `+${c.quantity}`,
    c.responsible || '-',
    c.purpose || '-',
    c.biometric_verified ? 'Sim' : 'Não',
  ]);

  drawTable(doc, headers, tableRows, 36, colWidths);
  addFooter(doc);
  doc.save(`historico-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}

// ─── PDF Inventário ──────────────────────────────────────────────────────────

export function exportInventarioToPDF(rows, filterLabel = '') {
  const doc = new jsPDF();
  const statusLabel = { disponivel: 'OK', estoque_baixo: 'Estoque baixo', esgotado: 'Esgotado' };

  drawHeader(doc, 'Relatório de Inventário', `${rows.length} itens${filterLabel ? '  |  Filtro: ' + filterLabel : ''}`);

  const headers = ['Código', 'Nome', 'Categoria', 'Qtd. Atual', 'Mínimo', 'Unidade', 'Localização', 'Status'];
  const colWidths = [26, 50, 26, 22, 20, 20, 32, 26];

  const tableRows = rows.map(m => [
    m.code || '-',
    m.name || '-',
    m.category || '-',
    m.quantity ?? 0,
    m.min_quantity ?? 0,
    m.unit || '-',
    m.location || '-',
    statusLabel[m.status] || '-',
  ]);

  drawTable(doc, headers, tableRows, 36, colWidths);
  addFooter(doc);
  doc.save(`inventario-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}

// ─── Excel / CSV ─────────────────────────────────────────────────────────────

function toCSV(headers, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '\uFEFF' + [headers, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportHistoricoToExcel(rows) {
  const typeLabel = { saida: 'Saída', entrada: 'Entrada', devolucao: 'Devolução' };
  downloadCSV(toCSV(
    ['Data/Hora', 'Tipo', 'Material', 'Código', 'Quantidade', 'Responsável', 'Finalidade', 'Observações', 'Biometria'],
    rows.map(c => [
      format(new Date(c.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      typeLabel[c.type] || c.type,
      c.material_name || '',
      c.material_code || '',
      c.type === 'saida' ? -c.quantity : c.quantity,
      c.responsible || '',
      c.purpose || '',
      c.notes || '',
      c.biometric_verified ? 'Sim' : 'Não',
    ])
  ), `historico-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`);
}

export function exportInventarioToExcel(rows) {
  const statusLabel = { disponivel: 'OK', estoque_baixo: 'Estoque baixo', esgotado: 'Esgotado' };
  downloadCSV(toCSV(
    ['Código', 'Nome', 'Categoria', 'Qtd. Atual', 'Qtd. Mínima', 'Unidade', 'Localização', 'Descrição', 'Status'],
    rows.map(m => [
      m.code || '',
      m.name || '',
      m.category || '',
      m.quantity ?? 0,
      m.min_quantity ?? 0,
      m.unit || '',
      m.location || '',
      m.description || '',
      statusLabel[m.status] || m.status || '',
    ])
  ), `inventario-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`);
}