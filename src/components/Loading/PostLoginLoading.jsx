import React from 'react';

export default function PostLoginLoading({ userEmail }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-xl border border-slate-800 text-center">
        {/* Avatar Placeholder */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
          <svg className="h-8 w-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-100">Verifikasi Berhasil</h3>
        {userEmail && <p className="mt-1 text-xs text-slate-400">{userEmail}</p>}
        <p className="mt-2 text-sm text-slate-300">Menyiapkan Dashboard Anda...</p>

        {/* Progress Bar Smooth */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 animate-[pulse_1s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}