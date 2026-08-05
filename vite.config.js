import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Sourcemap sementara diaktifkan buat debugging — biar error di console browser
    // nunjuk ke file & baris kode ASLI (Dashboard.jsx:1234), bukan index-xxxxx.js:574:8320
    // yang tidak terbaca. Boleh dimatikan lagi (hapus baris ini) setelah bug ketemu,
    // supaya ukuran file yang di-deploy sedikit lebih kecil.
    sourcemap: true,
  },
});
