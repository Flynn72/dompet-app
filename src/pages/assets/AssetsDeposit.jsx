import React from 'react';
import AssetPageShell from './AssetPageShell';

// SKELETON (Task 3.2). Jenis aset BARU yang sebelumnya belum ada sama
// sekali di aplikasi. UI input bunga/tenor/jatuh tempo dikerjakan di
// Task 3.6 sesuai roadmap.
export default function AssetsDeposit({ user }) {
  return (
    <AssetPageShell title="Deposito">
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
        Halaman Deposito — fitur baru, konten lengkap menyusul di Task 3.6.
      </div>
    </AssetPageShell>
  );
}
