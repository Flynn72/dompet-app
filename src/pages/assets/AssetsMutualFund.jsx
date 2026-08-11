import React from 'react';
import AssetPageShell from './AssetPageShell';

// SKELETON (Task 3.2). Di Task 3.3/3.5 halaman ini akan menampilkan
// daftar akun Reksa Dana milik user + dropdown pilih produk dari
// master data `mutual_funds` (bukan input teks bebas seperti sistem lama).
export default function AssetsMutualFund({ user }) {
  return (
    <AssetPageShell title="Reksa Dana">
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
        Halaman Reksa Dana — konten lengkap menyusul di Task 3.3/3.5.
      </div>
    </AssetPageShell>
  );
}
