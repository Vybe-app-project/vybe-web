export function LoadingState({ label = 'Loading…' }) {
  return (
    <div role="status" className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#00D4AA]" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, detail }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
    </div>
  );
}
