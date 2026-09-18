import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Loader2, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import * as Sentry from '@sentry/react';

/*
 * ReceiptScannerModal
 * --------------------
 * Fitur "Scanner Struk Otomatis (OCR)".
 *
 * - Tesseract.js di-lazy-load (import dinamis) hanya saat modal ini benar-benar
 *   dipakai untuk scan, supaya tidak membengkakkan bundle utama app (library +
 *   model bahasa lumayan berat, beberapa MB, dan sebagian di-download saat
 *   runtime oleh Tesseract sendiri).
 * - Bahasa OCR: 'eng' saja (bukan 'ind'). Struk Indonesia isinya mayoritas angka
 *   & simbol yang terbaca sama baik pakai model bahasa apapun; model 'eng'
 *   paling stabil & cepat di-download. Kalau nanti akurasi nama merchant/teks
 *   Indonesia perlu ditingkatkan, tinggal ganti ke 'ind+eng'.
 * - Hasil ekstraksi (nominal & tanggal) SENGAJA tidak langsung auto-submit ke
 *   form transaksi. OCR struk foto HP itu gampang meleset (pencahayaan, struk
 *   kusut, font kasir kecil dll), jadi user selalu diminta konfirmasi/koreksi
 *   dulu di field yang bisa diedit sebelum data dipakai.
 *
 * Props:
 *   onClose()               - tutup modal tanpa apply apa-apa
 *   onConfirm({amount,date})- dipanggil saat user klik "Gunakan hasil ini";
 *                             amount = string angka mentah (Rupiah, tanpa titik/koma),
 *                             date   = string 'YYYY-MM-DD' atau '' kalau tidak ketemu
 */

const TOTAL_KEYWORDS = [
  'grand total', 'total bayar', 'total belanja', 'total tagihan',
  'total transaksi', 'jumlah bayar', 'total qty', 'total item',
  'total', 'jumlah', 'jml',
];

// Nama bulan Indonesia (dan singkatannya) -> nomor bulan (01-12)
const MONTHS_ID = {
  jan: '01', januari: '01',
  feb: '02', februari: '02',
  mar: '03', maret: '03',
  apr: '04', april: '04',
  mei: '05',
  jun: '06', juni: '06',
  jul: '07', juli: '07',
  agu: '08', agt: '08', agustus: '08',
  sep: '09', sept: '09', september: '09',
  okt: '10', oktober: '10',
  nov: '11', november: '11',
  des: '12', desember: '12',
};

function extractAmountFromText(rawText) {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const numberPattern = /\d[\d.,]*\d|\d/g;

  // Sebuah angka bisa punya '.' atau ',' sebagai pemisah RIBUAN (mis. "11.000" = 11 ribu)
  // ATAU sebagai pemisah DESIMAL/sen (mis. "150.000,00" — struk transfer bank BCA dkk sering
  // nulis sen meski nilainya 0). Bedanya: kalau tepat 2 digit di belakang tanda baca TERAKHIR,
  // itu desimal/sen dan harus dibuang duluan — bukan dianggap pemisah ribuan biasa (yang selalu 3 digit).
  function parseNumberToken(token) {
    const lastSep = Math.max(token.lastIndexOf('.'), token.lastIndexOf(','));
    let cleaned = token;
    if (lastSep !== -1 && token.length - lastSep - 1 === 2) {
      cleaned = token.slice(0, lastSep); // buang bagian sen/desimalnya
    }
    return parseInt(cleaned.replace(/[.,]/g, ''), 10);
  }

  function numbersInLine(line) {
    const matches = line.match(numberPattern) || [];
    return matches
      .map(parseNumberToken)
      .filter((n) => !Number.isNaN(n) && n >= 100); // buang angka receh (qty, no. struk pendek dll)
  }

  // 1) Cari baris yang mengandung salah satu keyword total, ambil angka TERBESAR di baris itu
  for (const keyword of TOTAL_KEYWORDS) {
    const line = lines.find((l) => l.toLowerCase().includes(keyword));
    if (line) {
      const nums = numbersInLine(line);
      if (nums.length > 0) return String(Math.max(...nums));
    }
  }

  // 2) Fallback: ambil angka terbesar di seluruh teks (biasanya total adalah nominal
  //    terbesar yang tercetak di struk, dibanding harga satuan/qty per item)
  const allNums = numbersInLine(rawText.replace(/\n/g, ' '));
  if (allNums.length > 0) return String(Math.max(...allNums));

  return '';
}

function extractDateFromText(rawText) {
  // Pola numerik: 12/01/2026, 12-01-26, 12.01.2026, dst.
  const numericPattern = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/;
  const numericMatch = rawText.match(numericPattern);
  if (numericMatch) {
    let [, d, m, y] = numericMatch;
    if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
    d = d.padStart(2, '0');
    m = m.padStart(2, '0');
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // Pola nama bulan: 12 Januari 2026 / 12 Jan 2026
  const monthNamesAlt = Object.keys(MONTHS_ID).join('|');
  const namedPattern = new RegExp(`\\b(\\d{1,2})\\s+(${monthNamesAlt})\\s+(\\d{4})\\b`, 'i');
  const namedMatch = rawText.match(namedPattern);
  if (namedMatch) {
    const [, d, monName, y] = namedMatch;
    const m = MONTHS_ID[monName.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, '0')}`;
  }

  return '';
}

export default function ReceiptScannerModal({ onClose, onConfirm }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | scanning | done | error
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function pickFromCamera() {
    cameraInputRef.current?.click();
  }

  function pickFromGallery() {
    galleryInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setStatus('idle');
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function runScan() {
    if (!imageFile) return;
    setStatus('scanning');
    setProgress(0);
    setErrorMsg('');
    try {
      const Tesseract = await import('tesseract.js');
      const { data } = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const text = data.text || '';
      setRawText(text);
      setAmount(extractAmountFromText(text));
      setDate(extractDateFromText(text));
      setStatus('done');
    } catch (err) {
      console.error('OCR error:', err);
      Sentry.captureException(err, { tags: { feature: 'receipt-scanner-ocr' } });
      setErrorMsg('Gagal membaca struk — biasanya ini soal koneksi saat memuat komponen OCR. Coba tekan "Coba lagi" dulu; kalau masih gagal, coba foto ulang dengan pencahayaan lebih terang atau isi manual.');
      setStatus('error');
    }
  }

  function resetScan() {
    setImageFile(null);
    setImagePreview(null);
    setStatus('idle');
    setProgress(0);
    setRawText('');
    setAmount('');
    setDate('');
    setErrorMsg('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  function handleUseResult() {
    onConfirm({ amount, date });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Scan struk</span>
          <button onClick={onClose} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {!imagePreview && (
          <div style={styles.pickRow}>
            <button onClick={pickFromCamera} style={styles.pickBtn}>
              <Camera size={26} color="var(--accent)" />
              <span>Ambil foto</span>
            </button>
            <button onClick={pickFromGallery} style={styles.pickBtn}>
              <ImageIcon size={26} color="var(--accent)" />
              <span>Pilih dari galeri</span>
            </button>
          </div>
        )}

        {imagePreview && (
          <>
            <img src={imagePreview} alt="Preview struk" style={styles.preview} />

            {status === 'idle' && (
              <div style={styles.row}>
                <button onClick={resetScan} style={styles.secondaryBtn}><RotateCcw size={14} />Ganti foto</button>
                <button onClick={runScan} style={styles.primaryBtn}><ImageIcon size={14} />Scan sekarang</button>
              </div>
            )}

            {status === 'scanning' && (
              <div style={styles.scanningBox}>
                <Loader2 size={18} className="spin" color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Membaca struk... {progress}%</span>
              </div>
            )}

            {status === 'error' && (
              <>
                <div style={styles.errorBox}>{errorMsg}</div>
                <div style={styles.row}>
                  <button onClick={resetScan} style={styles.secondaryBtn}><RotateCcw size={14} />Ganti foto</button>
                  <button onClick={runScan} style={styles.primaryBtn}>Coba lagi</button>
                </div>
              </>
            )}

            {status === 'done' && (
              <>
                <div style={styles.hint}>
                  Hasil scan mungkin tidak 100% tepat — cek & koreksi dulu sebelum dipakai.
                </div>
                <label style={styles.formLabel}>Nominal (Rp)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Tidak ditemukan, isi manual"
                  style={styles.input}
                />
                <label style={styles.formLabel}>Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={styles.input}
                />

                <button onClick={() => setShowRawText((v) => !v)} style={styles.rawToggle}>
                  {showRawText ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  Lihat teks mentah hasil scan
                </button>
                {showRawText && <pre style={styles.rawText}>{rawText || '(tidak ada teks terbaca)'}</pre>}

                <div style={styles.row}>
                  <button onClick={resetScan} style={styles.secondaryBtn}><RotateCcw size={14} />Ganti foto</button>
                  <button onClick={handleUseResult} style={styles.primaryBtn}><Check size={14} />Gunakan hasil ini</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 },
  card: { background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(0,0,0,0.4)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 },
  pickRow: { display: 'flex', gap: 10 },
  pickBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '28px 8px', borderRadius: 14, border: '1.5px dashed var(--border2)',
    background: 'var(--bg-card2)', color: 'var(--text-secondary)', fontSize: 12.5, cursor: 'pointer',
  },
  preview: { width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12, background: 'var(--bg-input)', marginBottom: 12 },
  row: { display: 'flex', gap: 10, marginTop: 14 },
  primaryBtn: { flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'var(--accent-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryBtn: { flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  scanningBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', color: 'var(--text-secondary)', fontSize: 13, justifyContent: 'center' },
  errorBox: { background: 'rgba(255,148,102,0.12)', border: '1px solid #5A2020', color: '#FF9466', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, marginTop: 8 },
  hint: { fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 },
  formLabel: { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, marginTop: 14 },
  input: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 4 },
  rawToggle: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, padding: 0 },
  rawText: { fontSize: 10.5, color: 'var(--text-muted)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginTop: 8, whiteSpace: 'pre-wrap', maxHeight: 140, overflowY: 'auto' },
};
