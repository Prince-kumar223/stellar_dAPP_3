import { Check, Eye } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const AdminActions = ({ feedback, onReview, onResolve, pending = false }) => {
  const status = feedback?.status || 'Pending';
  const canReview = status === 'Pending';
  const canResolve = status !== 'Resolved';

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onReview?.(feedback.id)}
        disabled={pending || !canReview}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300/25 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-300/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
      >
        {pending && canReview ? <LoadingSpinner size="sm" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        Review
      </button>
      <button
        type="button"
        onClick={() => onResolve?.(feedback.id)}
        disabled={pending || !canResolve}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
      >
        {pending && canResolve ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" aria-hidden="true" />}
        Resolve
      </button>
    </div>
  );
};

export default AdminActions;
