import { Networks } from '@stellar/stellar-sdk';

const stellarNetwork = (import.meta.env.VITE_STELLAR_NETWORK || 'testnet').toLowerCase();
const isMainnet = stellarNetwork === 'mainnet' || stellarNetwork === 'public';

export const NETWORK_CONFIG = {
  name:
    import.meta.env.VITE_STELLAR_NETWORK_NAME ||
    (isMainnet ? 'Stellar Mainnet' : 'Stellar Testnet'),
  horizonUrl:
    import.meta.env.VITE_HORIZON_URL ||
    (isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'),
  rpcUrl: import.meta.env.VITE_RPC_URL || import.meta.env.VITE_SOROBAN_RPC_URL || '',
  networkPassphrase:
    import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE ||
    (isMainnet ? Networks.PUBLIC : Networks.TESTNET),
  baseFee: import.meta.env.VITE_STELLAR_BASE_FEE || '100',
  txTimeoutSeconds: Number(import.meta.env.VITE_STELLAR_TX_TIMEOUT || 30),
  pollIntervalMs: Number(import.meta.env.VITE_REFRESH_INTERVAL_MS || 12000),
  txPollIntervalMs: Number(import.meta.env.VITE_TX_POLL_INTERVAL_MS || 1200),
  maxFeedbackProbeId: Number(import.meta.env.VITE_MAX_FEEDBACK_PROBE_ID || 50),
};
