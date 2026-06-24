import { RefreshCw, Wallet } from 'lucide-react';
import CreateFeedbackForm from '../components/CreateFeedbackForm';
import ErrorAlert from '../components/ErrorAlert';
import FeedbackList from '../components/FeedbackList';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useFeedbackContract } from '../hooks/useFeedbackContract';
import { useUserRegistry } from '../hooks/useUserRegistry';
import { shortenAddress } from '../services/stellarClient';

const DashboardPage = ({ wallet, isAdmin, refreshToken = 0, onMutation }) => {
  const registry = useUserRegistry({
    walletAddress: wallet.address,
    isAdmin,
    refreshToken,
  });
  const feedbackContract = useFeedbackContract({
    walletAddress: wallet.address,
    isAdmin,
  });

  useAutoRefresh(feedbackContract.loadFeedback, [feedbackContract.loadFeedback, refreshToken]);

  const handleCreate = async (message) => {
    await feedbackContract.createFeedback(message);
    await wallet.refreshBalance();
    onMutation?.();
  };

  const pendingCount = feedbackContract.feedback.filter((item) => item.status === 'Pending').length;
  const resolvedCount = feedbackContract.feedback.filter((item) => item.status === 'Resolved').length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Wallet</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {wallet.address ? shortenAddress(wallet.address) : 'Not connected'}
              </h2>
            </div>
            <Wallet className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <dt className="text-slate-400">XLM balance</dt>
              <dd className="font-medium text-white">{wallet.balance || '0'} XLM</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <dt className="text-slate-400">Registry</dt>
              <dd>
                {registry.loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <StatusBadge status={registry.registered ? 'Resolved' : 'Pending'} />
                )}
              </dd>
            </div>
          </dl>

          {registry.error && (
            <div className="mt-4">
              <ErrorAlert title="Registry error" message={registry.error} />
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-semibold text-white">{feedbackContract.feedback.length}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</p>
            <p className="mt-2 text-2xl font-semibold text-amber-100">{pendingCount}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Resolved</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-100">{resolvedCount}</p>
          </div>
        </section>

        <CreateFeedbackForm
          connected={wallet.connected}
          registered={registry.registered}
          pending={feedbackContract.transaction.pending}
          success={feedbackContract.transaction.success}
          error={feedbackContract.transaction.error}
          onCreate={handleCreate}
        />
      </aside>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Live feedback</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Recent submissions</h2>
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
          selectedFeedback={feedbackContract.selectedFeedback}
          onSelect={feedbackContract.setSelectedFeedback}
        />
      </section>
    </div>
  );
};

export default DashboardPage;
