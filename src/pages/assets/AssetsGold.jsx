import React from 'react';
import AssetPageShell from './AssetPageShell';

// SKELETON (Task 3.2). Kartu investasi emas (nilai sekarang, total return,
// form beli/jual) akan DIPINDAH ke sini dari Dashboard.jsx di Task 3.3,
// memakai get_asset_account_stats() dari Phase 2.
export default function AssetsGold({ user }) {
  return (
    <AssetPageShell title="Emas">
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
        Halaman Emas — konten lengkap menyusul di Task 3.3.
      </div>
    </AssetPageShell>
  );
}
