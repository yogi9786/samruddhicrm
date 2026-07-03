import React from 'react';

// Full-page centered spinner
export const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4">
    <div className="relative w-12 h-12">
      <div
        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(128,0,0,0.15)', borderTopColor: '#800000' }}
      />
    </div>
    <p className="text-sm font-medium text-gray-400">{message}</p>
  </div>
);

// Skeleton shimmer block
export const SkeletonBlock = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`animate-pulse rounded-xl bg-gray-100 ${className}`}
    style={{ backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '400% 100%', animation: 'pulse 1.5s ease-in-out infinite', ...style }}
  />
);

// KPI card skeleton
export const KPICardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
    <div className="flex justify-between">
      <div className="space-y-2 flex-1">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-16" />
        <SkeletonBlock className="h-2.5 w-32" />
      </div>
      <SkeletonBlock className="h-11 w-11 rounded-2xl shrink-0" />
    </div>
  </div>
);

// Generic card skeleton
export const CardSkeleton = ({ lines = 4 }: { lines?: number }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
    <SkeletonBlock className="h-5 w-40" />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBlock key={i} className="h-4" style={{ width: `${70 + (i % 3) * 10}%` } as React.CSSProperties} />
    ))}
  </div>
);
