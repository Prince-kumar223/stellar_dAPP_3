import { useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle, ShieldCheck, Wallet } from 'lucide-react';
import { isConnected, requestAccess } from '@stellar/freighter-api';

const WalletConnect = ({ onConnect }) => {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await isConnected();
      } catch (connectionError) {
        console.warn('Unable to check Freighter connection:', connectionError);
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async () => {
    setLoading(true);
    setError('');

    try {
      const connection = await isConnected();

      if (connection.error) {
        setError(connection.error.message);
        return;
      }

      if (connection.isConnected) {
        const access = await requestAccess();

        if (access.error) {
          setError(access.error.message || 'Wallet access was denied.');
          return;
        }

        if (!access.address) {
          setError('Freighter did not return a wallet address.');
          return;
        }

        setAddress(access.address);
        onConnect(access.address);
        await fetchBalance(access.address);
      } else {
        const message = 'Please install Freighter wallet!';
        setError(message);
        alert(message);
      }
    } catch (connectionError) {
      setError('Connection failed. Please try again.');
      console.error('Connection failed', connectionError);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (pubKey) => {
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${pubKey}`);
      if (response.ok) {
        const data = await response.json();
        const xlmBalance = data.balances.find((item) => item.asset_type === 'native');
        if (xlmBalance) {
          setBalance(xlmBalance.balance);
        }
      }
    } catch (fetchError) {
      console.error('Error fetching balance:', fetchError);
    }
  };

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            <Wallet className="h-3.5 w-3.5" />
            Wallet Connection
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">Connect Freighter</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            Authenticate your wallet to create on-chain feedback and view your current testnet balance.
          </p>
        </div>

        <div className="hidden rounded-2xl bg-white/5 p-3 text-cyan-300 shadow-inner shadow-black/20 sm:block">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      {!address ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={connectWallet}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-[0_18px_38px_rgba(79,70,229,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(45,212,191,0.28)] active:scale-[0.99] disabled:cursor-not-allowed disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:shadow-none"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Connect Freighter
              </>
            )}
          </button>

          {error && (
            <div className="animate-fade-up flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 shadow-inner shadow-black/20">
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">Connected Address</span>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <span className="block truncate font-mono text-sm text-slate-100" title={address}>
                {address.substring(0, 6)}...{address.substring(address.length - 6)}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-4 shadow-inner shadow-black/20">
            <span className="text-xs uppercase tracking-[0.22em] text-emerald-200/75">XLM Balance</span>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold text-white">{balance || '0.00'}</span>
              <span className="pb-1 text-sm text-emerald-200">XLM</span>
            </div>
            <p className="mt-2 text-sm text-emerald-100/70">Available on Stellar testnet.</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default WalletConnect;
