import React, { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { exportReportToPdf } from '../lib/exportPdf';
import { exportTransactionsToCsv } from '../lib/exportCsv';

/**
 * Props:
 *   chartsRef    - ref ke elemen DOM grafik (pie chart + tren) yang mau di-screenshot ke PDF
 *   monthLabel   - contoh: "September 2026"
 *   totals       - { totalIncome, totalExpense, totalSaving, balance }
 *   transactions - transaksi bulan aktif
 *   categories   - daftar kategori (untuk lookup nama)
 */
export default function ExportReportButtons({ chartsRef, monthLabel, totals, transactions, categories, children }) {
  const [loadingType, setLoadingType] = useState(null); // null | 'pdf' | 'csv'
  const [errorMsg, setErrorMsg] = useState('');

  async function handleExportPdf() {
    setLoadingType('pdf');
    setErrorMsg('');
    try {
      await exportReportToPdf({
        chartsElement: chartsRef?.current || null,
        monthLabel,
        totals,
        transactions,
        categories,
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      setErrorMsg('Gagal membuat PDF. Coba lagi.');
    } finally {
      setLoadingType(null);
    }
  }

  async function handleExportCsv() {
    setLoadingType('csv');
    setErrorMsg('');
    try {
      await exportTransactionsToCsv(transactions, categories, monthLabel);
    } catch (err) {
      console.error('Export CSV error:', err);
      setErrorMsg('Gagal membuat CSV. Coba lagi.');
    } finally {
      setLoadingType(null);
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {children}
        <button onClick={handleExportPdf} disabled={loadingType !== null} style={{ ...styles.btn, opacity: loadingType !== null ? 0.6 : 1 }}>
          {loadingType === 'pdf' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
          Export PDF
        </button>
        <button onClick={handleExportCsv} disabled={loadingType !== null} style={{ ...styles.btn, opacity: loadingType !== null ? 0.6 : 1 }}>
          {loadingType === 'csv' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
          Export CSV
        </button>
      </div>
      {errorMsg && <div style={styles.error}>{errorMsg}</div>}
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
};
