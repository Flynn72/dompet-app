// Export laporan bulan aktif ke PDF: ringkasan angka + screenshot grafik
// (pie chart Income/Expense/Saving + tren 6 bulan) + tabel rincian transaksi.
//
// jspdf, jspdf-autotable, dan html2canvas di-lazy-load (import dinamis) —
// sama seperti tesseract.js di ReceiptScannerModal — supaya bundle utama app
// tidak membengkak untuk fitur yang cuma dipakai sesekali.

const TYPE_LABEL = { income: 'Income', expense: 'Expense', saving: 'Saving' };

function categoryLabel(tx, categories) {
  if (!tx.category) return 'Tanpa kategori';
  const cat = categories.find((c) => c.id === tx.category);
  return cat ? cat.label : 'Tanpa kategori';
}

function formatRupiahPlain(n) {
  const v = Math.round(Number(n) || 0);
  const abs = Math.abs(v).toLocaleString('id-ID');
  return 'Rp' + (v < 0 ? '-' : '') + abs;
}

/**
 * @param {Object} params
 * @param {HTMLElement} params.chartsElement - elemen DOM berisi grafik yang mau di-screenshot
 * @param {string} params.monthLabel - contoh: "September 2026"
 * @param {Object} params.totals - { totalIncome, totalExpense, totalSaving, balance }
 * @param {Array} params.transactions - transaksi bulan aktif
 * @param {Array} params.categories - untuk lookup nama kategori
 */
export async function exportReportToPdf({ chartsElement, monthLabel, totals, transactions, categories }) {
  const [{ jsPDF }, html2canvasModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
    import('jspdf-autotable'),
  ]);
  const html2canvas = html2canvasModule.default;
  const autoTable = autoTableModule.autoTable;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let cursorY = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Laporan Keuangan — Dompet App', marginX, cursorY);
  cursorY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`Periode: ${monthLabel}`, marginX, cursorY);
  cursorY += 5;
  doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, marginX, cursorY);
  doc.setTextColor(0);
  cursorY += 10;

  // Ringkasan angka
  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [['Ringkasan', 'Nominal']],
    body: [
      ['Income', formatRupiahPlain(totals.totalIncome)],
      ['Expense', formatRupiahPlain(totals.totalExpense)],
      ['Saving', formatRupiahPlain(totals.totalSaving)],
      ['Sisa saldo', formatRupiahPlain(totals.balance)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 20, 16] },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' } },
  });
  cursorY = doc.lastAutoTable.finalY + 10;

  // Screenshot grafik (pie chart + tren 6 bulan)
  if (chartsElement) {
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-base').trim() || '#0B0F1A';
    const canvas = await html2canvas(chartsElement, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - marginX * 2;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    if (cursorY + imgHeight > pageHeight - 15) {
      doc.addPage();
      cursorY = 18;
    }
    doc.addImage(imgData, 'PNG', marginX, cursorY, imgWidth, imgHeight);
    cursorY += imgHeight + 10;
  }

  // Tabel rincian transaksi
  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const body = sorted.map((t) => [
    t.date,
    TYPE_LABEL[t.type] || t.type,
    categoryLabel(t, categories),
    t.note || '-',
    formatRupiahPlain(t.amount),
  ]);

  if (cursorY > pageHeight - 30) {
    doc.addPage();
    cursorY = 18;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Rincian Transaksi', marginX, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [['Tanggal', 'Tipe', 'Kategori', 'Catatan', 'Nominal']],
    body: body.length > 0 ? body : [['-', '-', '-', 'Tidak ada transaksi bulan ini', '-']],
    theme: 'striped',
    headStyles: { fillColor: [15, 20, 16] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 4: { halign: 'right' } },
  });

  const safeMonth = monthLabel.toLowerCase().replace(/\s+/g, '-');
  doc.save(`laporan-dompet-${safeMonth}.pdf`);
}
