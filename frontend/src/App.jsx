import { useMemo, useState } from 'react';
import { Activity, LayoutDashboard, ShieldCheck, UserPlus, Wallet } from 'lucide-react';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import ErrorAlert from './components/ErrorAlert';
import LoadingSpinner from './components/LoadingSpinner';
import { NETWORK_CONFIG } from './config/network';
import { CONTRACTS } from './config/contracts';
import { useWallet } from './hooks/useWallet';
import { shortenAddress } from './services/stellarClient';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'register', label: 'Register', icon: UserPlus },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshToken, setRefreshToken] = useState(0);
  const wallet = useWallet();

  const isAdmin = useMemo(
    () =>
      Boolean(
        wallet.address &&
          CONTRACTS.adminPublicKey &&
          wallet.address === CONTRACTS.adminPublicKey,
      ),
    [wallet.address],
  );

  const requestRefresh = () => setRefreshToken((value) => value + 1);

  const renderPage = () => {
    if (activeTab === 'register') {
      return (
        <RegisterPage
          wallet={wallet}
          isAdmin={isAdmin}
          onRegistered={requestRefresh}
        />
      );
    }

    if (activeTab === 'admin') {
      return (
        <AdminPage
          wallet={wallet}
          isAdmin={isAdmin}
          refreshToken={refreshToken}
          onMutation={requestRefresh}
        />
      );
    }

    return (
      <DashboardPage
        wallet={wallet}
        isAdmin={isAdmin}
        refreshToken={refreshToken}
        onMutation={requestRefresh}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    Stellar Operations
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Feedback Dashboard
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Monitor registered users, submit feedback, and manage the review lifecycle on Soroban testnet.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Network</p>
                <p className="mt-1 text-sm font-medium text-white">{NETWORK_CONFIG.name}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Wallet</p>
                <p className="mt-1 truncate text-sm font-medium text-white">
                  {wallet.address ? shortenAddress(wallet.address) : 'Not connected'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <nav className="flex overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-w-fit items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={wallet.connect}
              disabled={wallet.loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {wallet.loading ? <LoadingSpinner size="sm" /> : <Wallet className="h-4 w-4" />}
              {wallet.address ? 'Reconnect wallet' : 'Connect Freighter'}
            </button>
          </div>

          {wallet.error && <ErrorAlert title="Wallet error" message={wallet.error} />}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{renderPage()}</main>
    </div>
  );
}

export default App;
