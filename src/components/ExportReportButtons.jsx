import React, { useState } from 'react';
import { FileText, Download, Loader2, X, Calendar } from 'lucide-react';
import { exportReportToPdf } from '../lib/exportPdf';
import { exportTransactionsToCsv } from '../lib/exportCsv';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7);
}

function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-');
  return `${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
}

function formatDateID(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Sama persis definisinya dengan isOutflowAction di Dashboard.jsx -- sengaja diduplikasi
// di sini (bukan di-share) supaya komponen export tetap berdiri sendiri, konsisten
// dengan pola exportCsv.js/exportPdf.js yang juga punya konstanta kecilnya sendiri.
const isOutflowAction = (action) => action === 'sell' || action === 'withdraw';

/**
 * Props:
 *   pieChartsRef        - ref ke 3 pie chart (Income/Expense/Saving) -- spesifik bulan aktif,
 *                         cuma disertakan di PDF kalau rentang yang dipilih = bulan aktif
 *   trendChartRef       - ref ke grafik tren 6 bulan -- independen dari bulan aktif,
 *                         SELALU disertakan di PDF apapun rentang yang dipilih
 *   allTransactions     - SEMUA transaksi (bukan cuma bulan aktif), dari tabel `transactions`
 *   allAssetTransactions- SEMUA transaksi modul Aset (asset_transactions)
 *   categories          - daftar kategori (buat lookup nama)
 *   activeMonthKey       - 'YYYY-MM' bulan yang lagi aktif di selector atas (default export)
 *   activeMonthLabel     - label bulan aktif, contoh "September 2026"
 */
export default function ExportReportButtons({ pieChartsRef, trendChartRef, allTransactions, allAssetTransactions, categories, activeMonthKey, activeMonthLabel, children }) {
  const [loadingType, setLoadingType] = useState(null); // null | 'pdf' | 'csv'
  const [errorMsg, setErrorMsg] = useState('');
  const [showRangeModal, setShowRangeModal] = useState(null); // null | 'pdf' | 'csv'
  const [rangeMode, setRangeMode] = useState('current'); // 'current' | 'month' | 'custom'
  const [pickedMonth, setPickedMonth] = useState(activeMonthKey);
  const [dateFrom, setDateFrom] = useState(activeMonthKey ? `${activeMonthKey}-01` : '');
  const [dateTo, setDateTo] = useState('');

  function openRangeModal(type) {
    setRangeMode('current');
    setPickedMonth(activeMonthKey);
    setErrorMsg('');
    setShowRangeModal(type);
  }

  // Hitung data (transaksi gabungan + total) untuk rentang yang dipilih. includePieCharts
  // cuma true untuk mode 'current' -- 3 pie chart itu spesifik bulan aktif, jadi cuma
  // relevan kalau rentangnya memang bulan yang lagi ditampilkan. Grafik tren 6 bulan BEDA:
  // itu independen dari bulan aktif (selalu nampilin 6 bulan terakhir), jadi selalu
  // disertakan apapun rentang yang dipilih -- lihat handleConfirmExport.
  function resolveRange() {
    let txInRange, label, includePieCharts;
    if (rangeMode === 'current') {
      txInRange = allTransactions.filter((t) => monthKeyOf(t.date) === activeMonthKey);
      label = activeMonthLabel;
      includePieCharts = true;
    } else if (rangeMode === 'month') {
      txInRange = allTransactions.filter((t) => monthKeyOf(t.date) === pickedMonth);
      label = formatMonthLabel(pickedMonth);
      includePieCharts = false;
    } else {
      txInRange = allTransactions.filter((t) => t.date >= dateFrom && t.date <= dateTo);
      label = `${formatDateID(dateFrom)} - ${formatDateID(dateTo)}`;
      includePieCharts = false;
    }

    const assetTxInRange = rangeMode === 'current'
      ? allAssetTransactions.filter((t) => monthKeyOf(t.date) === activeMonthKey)
      : rangeMode === 'month'
      ? allAssetTransactions.filter((t) => monthKeyOf(t.date) === pickedMonth)
      : allAssetTransactions.filter((t) => t.date >= dateFrom && t.date <= dateTo);

    const totalIncome = txInRange.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = txInRange.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalSaving = assetTxInRange.reduce((s, t) => s + t.amount * (isOutflowAction(t.action) ? -1 : 1), 0);
    const balance = totalIncome - totalExpense - totalSaving;

    // Gabungkan transaksi biasa + aktivitas Aset jadi satu daftar, sama persis pola
    // yang dipakai tab Transaksi (displayedTxList) -- konsisten apa yang user lihat
    // di app dengan apa yang masuk ke laporan.
    const assetRows = assetTxInRange.map((t) => ({
      type: 'saving',
      amount: t.amount,
      category: null,
      note: t.accountName,
      date: t.date,
    }));
    const mergedTransactions = [...txInRange, ...assetRows];

    return { mergedTransactions, label, includePieCharts, totals: { totalIncome, totalExpense, totalSaving, balance } };
  }

  async function handleConfirmExport() {
    if (rangeMode === 'custom' && (!dateFrom || !dateTo || dateFrom > dateTo)) {
      setErrorMsg('Pilih tanggal mulai & akhir yang valid (mulai tidak boleh setelah akhir).');
      return;
    }
    const type = showRangeModal;
    setShowRangeModal(null);
    setLoadingType(type);
    setErrorMsg('');
    try {
      const { mergedTransactions, label, includePieCharts, totals } = resolveRange();
      if (type === 'pdf') {
        // Tren 6 bulan SELALU disertakan (independen dari bulan aktif); pie chart
        // cuma kalau rentangnya memang bulan aktif (lihat komentar di resolveRange).
        const chartElements = [
          includePieCharts ? (pieChartsRef?.current || null) : null,
          trendChartRef?.current || null,
        ];
        await exportReportToPdf({
          chartElements,
          monthLabel: label,
          totals,
          transactions: mergedTransactions,
          categories,
        });
      } else {
        await exportTransactionsToCsv(mergedTransactions, categories, label);
      }
    } catch (err) {
      console.error(`Export ${type} error:`, err);
      setErrorMsg(`Gagal membuat ${type === 'pdf' ? 'PDF' : 'CSV'}. Coba lagi.`);
    } finally {
      setLoadingType(null);
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {children}
        <button onClick={() => openRangeModal('pdf')} disabled={loadingType !== null} style={{ ...styles.btn, opacity: loadingType !== null ? 0.6 : 1 }}>
          {loadingType === 'pdf' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
          Export PDF
        </button>
        <button onClick={() => openRangeModal('csv')} disabled={loadingType !== null} style={{ ...styles.btn, opacity: loadingType !== null ? 0.6 : 1 }}>
          {loadingType === 'csv' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
          Export CSV
        </button>
      </div>
      {errorMsg && !showRangeModal && <div style={styles.error}>{errorMsg}</div>}

      {showRangeModal && (
        <div style={styles.overlay} onClick={() => setShowRangeModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>
                <Calendar size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
                Pilih rentang {showRangeModal === 'pdf' ? 'PDF' : 'CSV'}
              </span>
              <button onClick={() => setShowRangeModal(null)} style={styles.iconBtn}><X size={17} color="#9CA89F" /></button>
            </div>

            <div style={styles.modeRow}>
              <button onClick={() => setRangeMode('current')} style={{ ...styles.modeChip, ...(rangeMode === 'current' ? styles.modeChipActive : {}) }}>
                {activeMonthLabel} (aktif)
              </button>
              <button onClick={() => setRangeMode('month')} style={{ ...styles.modeChip, ...(rangeMode === 'month' ? styles.modeChipActive : {}) }}>
                Bulan lain
              </button>
              <button onClick={() => setRangeMode('custom')} style={{ ...styles.modeChip, ...(rangeMode === 'custom' ? styles.modeChipActive : {}) }}>
                Rentang tanggal
              </button>
            </div>

            {rangeMode === 'month' && (
              <input
                type="month"
                value={pickedMonth}
                onChange={(e) => setPickedMonth(e.target.value)}
                style={styles.input}
              />
            )}

            {rangeMode === 'custom' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.dateLabel}>Dari tanggal</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={styles.input} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.dateLabel}>Sampai tanggal</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={styles.input} />
                </div>
              </div>
            )}

            {rangeMode !== 'current' && (
              <div style={styles.hint}>Pie chart Income/Expense/Saving tidak disertakan di PDF untuk rentang selain bulan aktif (biar tidak menampilkan grafik yang tidak sesuai datanya). Grafik tren 6 bulan tetap disertakan karena sifatnya independen dari bulan yang dipilih.</div>
            )}

            {errorMsg && <div style={styles.error}>{errorMsg}</div>}

            <button onClick={handleConfirmExport} style={styles.confirmBtn}>
              Export {showRangeModal === 'pdf' ? 'PDF' : 'CSV'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  btn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  error: { fontSize: 11.5, color: '#FF9466', marginTop: 6 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 },
  modal: { background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, boxShadow: '0 -8px 30px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 },
  modeRow: { display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  modeChip: { padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  modeChipActive: { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(127,232,164,0.12)' },
  input: { width: '100%', background: 'var(--bg-input, var(--bg-card2))', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 4, boxSizing: 'border-box' },
  dateLabel: { display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 6 },
  hint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 },
  confirmBtn: { width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'var(--accent-text, #0F1410)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
};
