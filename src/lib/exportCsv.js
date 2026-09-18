// Export laporan transaksi bulan aktif ke file CSV.
// papaparse di-lazy-load (import dinamis) sama seperti tesseract.js di
// ReceiptScannerModal, supaya tidak menambah ukuran bundle utama.

const TYPE_LABEL = { income: 'Income', expense: 'Expense', saving: 'Saving' };

function categoryLabel(tx, categories) {
  if (!tx.category) return 'Tanpa kategori';
  const cat = categories.find((c) => c.id === tx.category);
  return cat ? cat.label : 'Tanpa kategori';
}

/**
 * @param {Array} transactions - array transaksi bulan aktif (field: type, amount, category, note, date)
 * @param {Array} categories - daftar kategori (untuk lookup nama dari category id)
 * @param {string} monthLabel - contoh: "September 2026", dipakai untuk nama file
 */
export async function exportTransactionsToCsv(transactions, categories, monthLabel) {
  const Papa = await import('papaparse');

  const rows = [...transactions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((t) => ({
      Tanggal: t.date,
      Tipe: TYPE_LABEL[t.type] || t.type,
      Kategori: categoryLabel(t, categories),
      Catatan: t.note || '',
      Nominal: Math.round(Number(t.amount) || 0),
    }));

  const csv = Papa.unparse(rows, { header: true });
  // Tambahkan BOM supaya karakter (termasuk "Rp"/simbol) kebaca benar kalau dibuka di Excel
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeMonth = monthLabel.toLowerCase().replace(/\s+/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-dompet-${safeMonth}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
