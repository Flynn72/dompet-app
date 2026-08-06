import React from 'react';

export default function StartupLoading({ message = "Memuat Sistem..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
      {/* Pulse/Glowing Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
        <div className="absolute h-10 w-10 rounded-full bg-blue-500/30 animate-ping"></div>
      </div>
      
      <p className="mt-6 text-sm font-medium tracking-wide text-slate-300 animate-pulse">
        {message}
      </p>
    </div>
  );
}