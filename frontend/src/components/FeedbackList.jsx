import { Inbox } from 'lucide-react';
import ErrorAlert from './ErrorAlert';
import FeedbackCard from './FeedbackCard';
import LoadingSpinner from './LoadingSpinner';

const FeedbackList = ({
  feedback = [],
  loading = false,
  error = '',
  isAdmin = false,
  selectedFeedback,
  onSelect,
  onReview,
  onResolve,
  actionPending = false,
}) => {
  if (loading && feedback.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <LoadingSpinner />
          Loading feedback from Soroban...
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {error && <ErrorAlert title="Feedback error" message={error} />}

      {feedback.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <Inbox className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-200">No feedback found</p>
          <p className="mt-1 text-sm text-slate-500">Submitted entries will appear here after confirmation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              isAdmin={isAdmin}
              selected={selectedFeedback?.id === item.id}
              onSelect={onSelect}
              onReview={onReview}
              onResolve={onResolve}
              actionPending={actionPending}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeedbackList;
