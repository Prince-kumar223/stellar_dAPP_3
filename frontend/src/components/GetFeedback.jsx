import { useState } from 'react';
import { AlertCircle, LoaderCircle, Search, Sparkles } from 'lucide-react';
import Loader from './Loader';
import FeedbackDisplay from './FeedbackDisplay';
import { getFeedbackEntry } from '../lib/feedbackStore';

const GetFeedback = () => {
  const [feedbackId, setFeedbackId] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cache, setCache] = useState({});

  const handleFetch = async (e) => {
    e.preventDefault();
    setError('');
    setFeedbackData(null);

    const id = parseInt(feedbackId, 10);
    if (Number.isNaN(id) || id <= 0) {
      setError('Please enter a valid Feedback ID.');
      return;
    }

    if (cache[id]) {
      setFeedbackData({ id, text: cache[id] });
      return;
    }

    setLoading(true);

    try {
      const feedbackText = await getFeedbackEntry(id);

      if (!feedbackText || feedbackText === 'Feedback not found') {
        setError('Feedback not found. Try creating a new entry first.');
        return;
      }

      setFeedbackData({ id, text: feedbackText });
      setCache((prevCache) => ({ ...prevCache, [id]: feedbackText }));
    } catch (err) {
      setError('Failed to fetch feedback or ID not found.');
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            <Search className="h-3.5 w-3.5" />
            Fetch Feedback
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">Look up a feedback entry</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
            Enter a feedback ID to retrieve the stored message. Repeated lookups stay snappy thanks to local caching.
          </p>
        </div>

        <div className="hidden rounded-2xl bg-white/5 p-3 text-cyan-300 shadow-inner shadow-black/20 sm:block">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>

      <form onSubmit={handleFetch} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="number"
          value={feedbackId}
          onChange={(e) => setFeedbackId(e.target.value)}
          placeholder="Enter Feedback ID..."
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/20 outline-none transition duration-200 focus:border-cyan-400/40 focus:bg-black/30 focus:ring-4 focus:ring-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !feedbackId}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-[0_18px_38px_rgba(79,70,229,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(45,212,191,0.28)] active:scale-[0.99] disabled:cursor-not-allowed disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:shadow-none sm:w-auto"
        >
          {loading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Fetch
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="animate-fade-up mb-4 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          <p>{error}</p>
        </div>
      )}

      {loading && <Loader message="Fetching from Soroban testnet..." />}

      {feedbackData && !loading && <FeedbackDisplay id={feedbackData.id} text={feedbackData.text} />}
    </section>
  );
};

export default GetFeedback;
