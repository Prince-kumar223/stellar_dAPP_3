import { CalendarClock, Fingerprint, UserRound } from 'lucide-react';
import { shortenAddress } from '../services/stellarClient';
import AdminActions from './AdminActions';
import StatusBadge from './StatusBadge';

const formatDate = (timestamp) => {
  if (!timestamp) return 'Not recorded';
  const value = Number(timestamp);
  const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const FeedbackCard = ({
  feedback,
  isAdmin = false,
  selected = false,
  onSelect,
  onReview,
  onResolve,
  actionPending = false,
}) => {
  if (!feedback) return null;

  return (
    <article
      className={`rounded-lg border bg-slate-900 p-4 transition ${
        selected ? 'border-cyan-300/70 shadow-[0_0_0_1px_rgba(103,232,249,0.35)]' : 'border-slate-800'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => onSelect?.(feedback)}
          className="min-w-0 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
              Feedback #{feedback.id}
            </span>
            <StatusBadge status={feedback.status} />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">{feedback.message}</p>
        </button>

        {isAdmin && (
          <AdminActions
            feedback={feedback}
            onReview={onReview}
            onResolve={onResolve}
            pending={actionPending}
          />
        )}
      </div>

      <dl className="mt-4 grid gap-3 border-t border-slate-800 pt-4 text-xs text-slate-400 sm:grid-cols-3">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          <dd className="truncate" title={feedback.author}>
            {shortenAddress(feedback.author) || 'Unknown author'}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          <dd>{formatDate(feedback.createdAt)}</dd>
        </div>
        <div className="text-slate-500">
          {feedback.resolvedAt ? `Resolved ${formatDate(feedback.resolvedAt)}` : feedback.reviewedAt ? `Reviewed ${formatDate(feedback.reviewedAt)}` : 'Awaiting review'}
        </div>
      </dl>
    </article>
  );
};

export default FeedbackCard;
