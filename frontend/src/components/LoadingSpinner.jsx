import React from "react";

export function LoadingSpinner({ size = "md", message = "Loading..." }) {
  const sizes = { sm: "h-4 w-4", md: "h-7 w-7", lg: "h-10 w-10" };
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-12">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 border-t-brand-600`} />
      {message && <p className="text-xs font-medium text-slate-500">{message}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse space-y-2.5 bg-slate-50/50">
      <div className="h-3.5 bg-slate-200/80 rounded w-24 mb-2" />
      <div className="h-7 bg-slate-200/80 rounded w-32" />
      <div className="h-3 bg-slate-200/80 rounded w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-md w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">Operation Error</p>
        <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{message || "An unexpected error occurred while processing data."}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs px-3.5 py-1.5 mt-1 font-semibold">
          Retry Operation
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = "No data available", icon = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
      {icon ? (
        <div className="text-slate-400">{icon}</div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <p className="text-xs text-slate-500 font-medium max-w-xs">{message}</p>
    </div>
  );
}