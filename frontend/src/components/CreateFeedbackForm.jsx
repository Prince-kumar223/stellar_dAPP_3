import { useState } from 'react';
import { CheckCircle2, MessageSquarePlus } from 'lucide-react';
import ErrorAlert from './ErrorAlert';
import LoadingSpinner from './LoadingSpinner';

const CreateFeedbackForm = ({
  connected = false,
  registered = false,
  pending = false,
  success = '',
  error = '',
  onCreate,
}) => {
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const disabledReason = !connected
    ? 'Connect your wallet before submitting feedback.'
    : !registered
      ? 'Your wallet must be registered before submitting feedback.'
      : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    const trimmed = message.trim();
    if (!trimmed) {
      setLocalError('Feedback cannot be empty.');
      return;
    }

    try {
      await onCreate(trimmed);
      setMessage('');
    } catch (createError) {
      setLocalError(createError.message || 'Unable to create feedback.');
    }
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-cyan-300" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">Create feedback</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          disabled={pending || Boolean(disabledReason)}
          placeholder="Write feedback for the operations team..."
          className="min-h-32 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {disabledReason || `${message.trim().length} characters ready to submit.`}
          </p>
          <button
            type="submit"
            disabled={pending || Boolean(disabledReason) || !message.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {pending ? <LoadingSpinner size="sm" /> : <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />}
            Submit feedback
          </button>
        </div>
      </form>

      {(localError || error) && (
        <div className="mt-4">
          <ErrorAlert title="Create feedback failed" message={localError || error} />
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
          <p>{success}</p>
        </div>
      )}
    </section>
  );
};

export default CreateFeedbackForm;
