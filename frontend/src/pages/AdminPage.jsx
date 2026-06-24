import { RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import ErrorAlert from '../components/ErrorAlert';
import FeedbackList from '../components/FeedbackList';
import LoadingSpinner from '../components/LoadingSpinner';
import { CONTRACTS } from '../config/contracts';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useFeedbackContract } from '../hooks/useFeedbackContract';
import { shortenAddress } from '../services/stellarClient';

const AdminPage = ({ wallet, isAdmin, refreshToken = 0, onMutation }) => {
  const feedbackContract = useFeedbackContract({
    walletAddress: wallet.address,
    isAdmin,
  });

  useAutoRefresh(feedbackContract.loadFeedback, [feedbackContract.loadFeedback, refreshToken]);

  const handleReview = async (id) => {
    await feedbackContract.reviewFeedback(id);
    onMutation?.();
  };

  const handleResolve = async (id) => {
    await feedbackContract.resolveFeedback(id);
    onMutation?.();
  };

  if (!wallet.connected) {
    return (
      <ErrorAlert
        title="Wallet required"
        message="Connect Freighter with the configured admin wallet before using admin actions."
      />
    );
  }

  if (!isAdmin) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-amber-200" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-white">Admin access required</h2>
            <p className="mt-1 text-sm text-slate-400">
              Connected wallet {shortenAddress(wallet.address)} does not match the configured admin key.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
          Expected admin: {CONTRACTS.adminPublicKey ? shortenAddress(CONTRACTS.adminPublicKey) : 'not configured'}
        </div>
      </section>
    );
  }

  const pendingCount = feedbackContract.feedback.filter((item) => item.status === 'Pending').length;
  const reviewedCount = feedbackContract.feedback.filter((item) => item.status === 'Reviewed').length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.4fr))]">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-300" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-white">Admin console</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Review pending feedback, resolve completed items, and keep the dashboard state synchronized after each on-chain transaction.
          </p>
          {feedbackContract.transaction.error && (
            <div className="mt-4">
              <ErrorAlert title="Admin transaction failed" message={feedbackContract.transaction.error} />
            </div>
          )}
          {feedbackContract.transaction.success && (
            <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {feedbackContract.transaction.success}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-amber-100">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Reviewed</p>
          <p className="mt-2 text-3xl font-semibold text-sky-100">{reviewedCount}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Lifecycle queue</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Feedback administration</h2>
          </div>
          <button
            type="button"
            onClick={feedbackContract.loadFeedback}
            disabled={feedbackContract.loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-white disabled:cursor-not-allowed disabled:text-slate-500"
          >
            {feedbackContract.loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Refresh
          </button>
        </div>

        <FeedbackList
          feedback={feedbackContract.feedback}
          loading={feedbackContract.loading}
          error={feedbackContract.error}
          isAdmin
          selectedFeedback={feedbackContract.selectedFeedback}
          onSelect={feedbackContract.setSelectedFeedback}
          onReview={handleReview}
          onResolve={handleResolve}
          actionPending={feedbackContract.transaction.pending}
        />
      </section>
    </div>
  );
};

export default AdminPage;
