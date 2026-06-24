import { useEffect, useState } from 'react';
import { CheckCircle2, Search, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { CONTRACTS } from '../config/contracts';
import { useUserRegistry } from '../hooks/useUserRegistry';
import { shortenAddress } from '../services/stellarClient';

const RegisterPage = ({ wallet, isAdmin, onRegistered }) => {
  const [targetAddress, setTargetAddress] = useState('');
  const [targetRegistered, setTargetRegistered] = useState(null);
  const [localError, setLocalError] = useState('');
  const registry = useUserRegistry({
    walletAddress: wallet.address,
    isAdmin,
  });

  useEffect(() => {
    if (!targetAddress && wallet.address) {
      setTargetAddress(wallet.address);
    }
  }, [targetAddress, wallet.address]);

  const checkTarget = async () => {
    setLocalError('');
    try {
      const result = await registry.checkRegistration(targetAddress.trim());
      setTargetRegistered(result);
      return result;
    } catch (error) {
      setLocalError(error.message || 'Unable to check this address.');
      return false;
    }
  };

  const handleRegister = async () => {
    setLocalError('');
    try {
      await registry.registerUser(targetAddress.trim());
      setTargetRegistered(true);
      onRegistered?.();
    } catch (error) {
      setLocalError(error.message || 'Unable to register this address.');
    }
  };

  const handleUnregister = async () => {
    setLocalError('');
    try {
      await registry.unregisterUser(targetAddress.trim());
      setTargetRegistered(false);
      onRegistered?.();
    } catch (error) {
      setLocalError(error.message || 'Unable to unregister this address.');
    }
  };

  const disabled = !wallet.connected || registry.transaction.pending || !targetAddress.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">Registration status</h2>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3">
            <dt className="text-slate-500">Connected wallet</dt>
            <dd className="mt-1 truncate font-medium text-white" title={wallet.address}>
              {wallet.address ? shortenAddress(wallet.address) : 'Connect Freighter first'}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3">
            <dt className="text-slate-500">Your registry state</dt>
            <dd className="mt-2">
              {registry.loading ? <LoadingSpinner size="sm" /> : <StatusBadge status={registry.registered ? 'Resolved' : 'Pending'} />}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3">
            <dt className="text-slate-500">Admin contract authority</dt>
            <dd className="mt-1 truncate font-medium text-white" title={CONTRACTS.adminPublicKey}>
              {CONTRACTS.adminPublicKey ? shortenAddress(CONTRACTS.adminPublicKey) : 'VITE_ADMIN_PUBLIC_KEY is not configured'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">Manage user access</h2>
        </div>

        {!isAdmin && (
          <div className="mt-4">
            <ErrorAlert
              title="Admin wallet required"
              message="Only the configured admin wallet can register or unregister users."
            />
          </div>
        )}

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">User public key</span>
            <input
              value={targetAddress}
              onChange={(event) => {
                setTargetAddress(event.target.value);
                setTargetRegistered(null);
              }}
              placeholder="G..."
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={checkTarget}
              disabled={!targetAddress.trim() || registry.loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:text-slate-500"
            >
              {registry.loading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              Check
            </button>
            <button
              type="button"
              onClick={handleRegister}
              disabled={disabled || !isAdmin}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {registry.transaction.pending ? <LoadingSpinner size="sm" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
              Register
            </button>
            <button
              type="button"
              onClick={handleUnregister}
              disabled={disabled || !isAdmin}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300/25 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
            >
              <UserMinus className="h-4 w-4" aria-hidden="true" />
              Unregister
            </button>
          </div>

          {targetRegistered !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              Target is {targetRegistered ? 'registered' : 'not registered'}.
            </div>
          )}

          {(localError || registry.error || registry.transaction.error) && (
            <ErrorAlert
              title="Registry action failed"
              message={localError || registry.error || registry.transaction.error}
            />
          )}

          {registry.transaction.success && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {registry.transaction.success}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
