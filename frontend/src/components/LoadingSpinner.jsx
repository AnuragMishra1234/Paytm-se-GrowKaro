import React from "react";

export function LoadingSpinner({ size = "md", message = "Loading..." }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`} />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-20" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="text-4xl">⚠️</div>
      <div className="text-center">
        <p className="text-gray-900 font-medium">Something went wrong</p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = "No data available", icon = "📊" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="text-4xl">{icon}</div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}