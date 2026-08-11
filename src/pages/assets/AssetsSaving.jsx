import React from 'react';
import AssetPageShell from './AssetPageShell';

// SKELETON (Task 3.2). Form tambah akun, daftar akun Tabungan, dan
// riwayat transaksi akan diisi di Task 3.3 (memakai asset_accounts /
// asset_transactions / get_asset_account_stats dari Phase 2).
export default function AssetsSaving({ user }) {
  return (
    <AssetPageShell title="Tabungan">
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
        Halaman Tabungan — konten lengkap menyusul di Task 3.3.
      </div>
    </AssetPageShell>
  );
}
