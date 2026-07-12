import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Trash2, Shield, Users, Clock, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return 'Tidak diketahui';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 30) return `${Math.floor(days / 30)} bulan lalu`;
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  if (mins > 0) return `${mins} menit lalu`;
  return 'Baru saja';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPanel({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortBy, setSortBy] = useState('last_login');
  const [sortDir, setSortDir] = useState('desc');
  const [filterInactive, setFilterInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const isFetchingRef = useRef(false); // guard: cegah loadUsers() tumpang tindih saat interval cepat (500ms)

async function loadUsers() {
  // Kalau masih ada request sebelumnya yang belum selesai, lewati siklus ini
  if (isFetchingRef.current) return;
  isFetchingRef.current = true;

  const { data, error } = await supabase.rpc('admin_get_all_users');

  if (error) {
    setError(error.message);
    setLoading(false);
    isFetchingRef.current = false;
    return;
  }

  setUsers(data || []);
  setLastUpdate(new Date());
  setLoading(false);
  isFetchingRef.current = false;
}
  
useEffect(() => {
  async function init() {
    const { error } = await supabase.rpc(
      "update_last_login",
      { user_id: user.id }
    );

    if (error) {
      console.error('[AdminPanel] Gagal update last_login:', error.message);
    }

    await loadUsers();
  }

  init();

  // Realtime transaksi — auto-refresh instan saat ada user yang input/ubah transaksi
  const transactionChannel = supabase
    .channel("admin-transactions")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "transactions",
      },
      () => {
        loadUsers();
      }
    )
    .subscribe((status) => {
      // Kalau status tidak pernah "SUBSCRIBED", berarti Realtime belum diaktifkan
      // untuk tabel "transactions" di Supabase (Database > Replication).
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('[AdminPanel] Gagal subscribe realtime transactions:', status, '— cek Database > Replication di Supabase.');
      }
    });

  // Realtime kategori
  const categoryChannel = supabase
    .channel("admin-categories")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "categories",
      },
      () => {
        loadUsers();
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('[AdminPanel] Gagal subscribe realtime categories:', status, '— cek Database > Replication di Supabase.');
      }
    });

  // Fallback: kalau tidak ada transaksi berjalan, tetap refresh tiap 500ms
  const interval = setInterval(() => {
    loadUsers();
  }, 500);

  return () => {
    clearInterval(interval);

    supabase.removeChannel(transactionChannel);
    supabase.removeChannel(categoryChannel);
  };
}, []);
  
  async function deleteUser(targetId, username) {
    setDeleting(targetId);
    try {
      const { error: err } = await supabase.rpc('admin_delete_user', { target_user_id: targetId });
      if (err) throw err;
      setUsers((prev) => prev.filter((u) => u.id !== targetId));
      setSuccessMsg(`Akun "${username}" berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError('Gagal hapus user: ' + (e.message || 'Unknown error'));
    }
    setDeleting(null);
    setConfirmDelete(null);
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const inactiveDays = 30;
  const inactiveThreshold = Date.now() - inactiveDays * 86400000;

  const filtered = users
    .filter((u) => {
      const matchSearch = !search ||
        (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase());
      const matchInactive = !filterInactive || new Date(u.last_login).getTime() < inactiveThreshold;
      return matchSearch && matchInactive;
    })
    .sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === 'last_login' || sortBy === 'created_at') {
        va = new Date(va || 0).getTime();
        vb = new Date(vb || 0).getTime();
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const inactiveCount = users.filter((u) => new Date(u.last_login).getTime() < inactiveThreshold).length;

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }

        /* ===== CSS VARIABLES — TEMA NAVY (sama dengan Dashboard) ===== */
        :root {
          --bg-base: #0B0F1A;
          --bg-card: #131929;
          --bg-card2: #1A2238;
          --bg-input: #0B0F1A;
          --border: #1E2D4A;
          --border2: #2A3B5C;
          --text-primary: #E8EDF8;
          --text-secondary: #7A90B8;
          --text-muted: #4A5A7A;
          --accent: #7FE8A4;
          --accent-text: #0B0F1A;
          --scrollbar: #1E2D4A;
        }

        /* Light mode — mengikuti setting sistem/browser user, sama seperti Dashboard */
        @media (prefers-color-scheme: light) {
          :root {
            --bg-base: #EEF2FA;
            --bg-card: #FFFFFF;
            --bg-card2: #F0F4FF;
            --bg-input: #F5F7FF;
            --border: #C8D4EC;
            --border2: #A8BCDC;
            --text-primary: #0D1B3E;
            --text-secondary: #3D5A8A;
            --text-muted: #7A90B8;
            --accent: #1A6B4A;
            --accent-text: #FFFFFF;
            --scrollbar: #C8D4EC;
          }
        }

        body { margin: 0; background: var(--bg-base); font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 3px; }
        input, select, button { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={s.logoMark}><Shield size={18} color="var(--accent-text)" /></div>
          <div>
            <div style={s.logoText}>Admin Panel</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dompet App</div>
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); onLogout(); }} style={s.logoutBtn}><LogOut size={15} color="var(--text-secondary)" /></button>
      </div>

      <div style={s.content}>
        {/* Stats */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <Users size={20} color="var(--accent)" />
            <div style={s.statVal}>{users.length}</div>
            <div style={s.statLabel}>Total User</div>
          </div>
          <div style={s.statCard}>
            <Clock size={20} color="#FF9466" />
            <div style={{ ...s.statVal, color: '#FF9466' }}>{inactiveCount}</div>
            <div style={s.statLabel}>Tidak aktif {inactiveDays}+ hari</div>
          </div>
          <div style={s.statCard}>
            <Shield size={20} color="#C99FE8" />
            <div style={{ ...s.statVal, color: '#C99FE8' }}>{users.filter((u) => u.is_admin).length}</div>
            <div style={s.statLabel}>Admin</div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={s.errorBanner}>
            <AlertTriangle size={14} /><span>{error}</span>
            <button onClick={() => setError('')} style={{ ...s.iconBtn, marginLeft: 'auto' }}><span style={{ fontSize: 16 }}>×</span></button>
          </div>
        )}
        {successMsg && (
          <div style={s.successBanner}><Check size={14} /><span>{successMsg}</span></div>
        )}

        {/* Toolbar */}
        <div style={s.toolbar}>
          <input
            type="text"
            placeholder="Cari username atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterInactive(!filterInactive)}
              style={{ ...s.filterBtn, ...(filterInactive ? s.filterBtnActive : {}) }}
            >
              <Clock size={13} />
              Tidak aktif {inactiveDays}+ hari {inactiveCount > 0 && `(${inactiveCount})`}
            </button>
            <button onClick={loadUsers} style={s.filterBtn}>
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabel */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>Memuat data user...</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {[
                    { key: 'username', label: 'Username' },
                    { key: 'email', label: 'Email' },
                    { key: 'total_transactions', label: 'Transaksi' },
                    { key: 'total_categories', label: 'Kategori' },
                    { key: 'last_login', label: 'Login terakhir' },
                    { key: 'created_at', label: 'Daftar' },
                    { key: null, label: 'Aksi' },
                  ].map((col) => (
                    <th
                      key={col.label}
                      style={{ ...s.th, cursor: col.key ? 'pointer' : 'default' }}
                      onClick={() => col.key && toggleSort(col.key)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {col.label}{col.key && <SortIcon col={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0' }}>
                    {search || filterInactive ? 'Tidak ada user yang cocok.' : 'Belum ada user.'}
                  </td></tr>
                )}
                {filtered.map((u) => {
                  const isInactive = new Date(u.last_login).getTime() < inactiveThreshold;
                  const isConfirming = confirmDelete === u.id;
                  return (
                    <tr key={u.id} style={{ background: isInactive ? '#1A0F0F' : 'transparent' }}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ ...s.avatar, background: u.is_admin ? '#C99FE855' : 'var(--bg-card2)' }}>
                            {u.is_admin ? <Shield size={12} color="#C99FE8" /> : (u.username?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{u.username || '-'}</div>
                            {u.is_admin && <div style={{ fontSize: 10, color: '#C99FE8', fontWeight: 700 }}>ADMIN</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: 'var(--text-secondary)' }}>
                        {(u.email || '').replace('@dompetapp.local', '')}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <span style={{ fontSize: 13, color: u.total_transactions > 0 ? '#7FE8A4' : 'var(--text-secondary)' }}>
                          {u.total_transactions}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <span style={{ fontSize: 13, color: u.total_categories > 0 ? '#6FB7E8' : 'var(--text-secondary)' }}>
                          {u.total_categories}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: 12, color: isInactive ? '#FF9466' : 'var(--text-secondary)' }}>
                          {timeAgo(u.last_login)}
                          {isInactive && <span style={{ marginLeft: 6, fontSize: 10, background: '#FF946622', color: '#FF9466', padding: '1px 6px', borderRadius: 4 }}>Tidak aktif</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{formatDate(u.last_login)}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatDate(u.created_at)}</div>
                      </td>
                      <td style={s.td}>
                        {u.id !== user.id && !u.is_admin && (
                          isConfirming ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: '#FF9466' }}>Yakin hapus?</span>
                              <button
                                onClick={() => deleteUser(u.id, u.username)}
                                disabled={deleting === u.id}
                                style={{ ...s.deleteConfirmBtn, opacity: deleting === u.id ? 0.5 : 1 }}
                              >
                                {deleting === u.id ? '...' : 'Ya, hapus'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)} style={s.cancelBtn}>Batal</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(u.id)} style={s.deleteBtn}>
                              <Trash2 size={14} />
                            </button>
                          )
                        )}
                        {u.id === user.id && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Akun ini</span>}
                        {u.is_admin && u.id !== user.id && <span style={{ fontSize: 11, color: '#C99FE8' }}>Admin</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    fontSize: 12,
    color: "var(--text-secondary)",
  }}
>
  <span>
    Menampilkan {filtered.length} dari {users.length} user
  </span>

  <span>
    Terakhir diperbarui :
    {" "}
    {lastUpdate.toLocaleTimeString("id-ID")}
  </span>
</div>
      </div>
    </div>
  );
}

// Komponen Check icon kecil
function Check({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' },
  logoMark: { width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' },
  logoutBtn: { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  content: { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  statVal: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--accent)' },
  statLabel: { fontSize: 12, color: 'var(--text-secondary)' },
  errorBanner: { background: '#2A1010', border: '1px solid #5A2020', color: '#FF9466', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 },
  successBanner: { background: '#0D2A1A', border: '1px solid #1A5A3A', color: 'var(--accent)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 },
  toolbar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' },
  filterBtnActive: { background: '#FF946622', borderColor: '#FF9466', color: '#FF9466' },
  tableWrap: { overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', color: 'var(--text-primary)' },
  avatar: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, background: '#2A1010', border: '1px solid #5A2020', color: '#FF9466', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  deleteConfirmBtn: { padding: '5px 10px', borderRadius: 7, background: '#FF9466', border: 'none', color: '#0B0F1A', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { padding: '5px 10px', borderRadius: 7, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#FF9466', display: 'flex', padding: 2 },
};
