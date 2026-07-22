export function ErrorState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm">
      <p className="font-semibold text-coral-400">{title}</p>
      <p className="mt-1 text-slate-400">{message}</p>
    </div>
  );
}
