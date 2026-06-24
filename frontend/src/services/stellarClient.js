import {
  Account,
  Address,
  Contract,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { NETWORK_CONFIG } from '../config/network';

let server;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requireRpcUrl = () => {
  if (!NETWORK_CONFIG.rpcUrl) {
    throw new Error('Missing VITE_RPC_URL. Configure a Soroban RPC URL before using contract calls.');
  }

  return NETWORK_CONFIG.rpcUrl;
};

export const getServer = () => {
  if (!server) {
    server = new rpc.Server(requireRpcUrl());
  }

  return server;
};

export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const addressToScVal = (address) => Address.fromString(address).toScVal();

export const stringToScVal = (value) => xdr.ScVal.scvString(value);

export const u32ToScVal = (value) => xdr.ScVal.scvU32(Number(value));

export const readScVal = (value) => {
  if (!value) return null;
  try {
    return scValToNative(value);
  } catch (error) {
    console.warn('Unable to decode Soroban value', error);
    return null;
  }
};

export const invokeContract = async ({
  contractId,
  method,
  args = [],
  source,
}) => {
  if (!source) {
    throw new Error('Connect a wallet before submitting a transaction.');
  }

  const rpcServer = getServer();
  const account = await rpcServer.getAccount(source);
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(account, {
    fee: NETWORK_CONFIG.baseFee,
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(NETWORK_CONFIG.txTimeoutSeconds)
    .build();

  const prepared = await rpcServer.prepareTransaction(transaction);
  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  });
  const signedXdr = typeof signed === 'string' ? signed : signed.signedTxXdr;
  const signedTx = TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_CONFIG.networkPassphrase,
  );

  const submission = await rpcServer.sendTransaction(signedTx);
  if (submission.status !== 'PENDING') {
    throw new Error(submission.errorResult || 'Transaction was rejected by RPC.');
  }

  return waitForTransaction(submission.hash);
};

export const simulateContract = async ({
  contractId,
  method,
  args = [],
  source,
}) => {
  const rpcServer = getServer();
  const contract = new Contract(contractId);
  const account = source
    ? await rpcServer.getAccount(source)
    : new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');

  const transaction = new TransactionBuilder(account, {
    fee: NETWORK_CONFIG.baseFee,
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(NETWORK_CONFIG.txTimeoutSeconds)
    .build();

  const result = await rpcServer.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(result)) {
    throw new Error(result.error || 'RPC simulation failed.');
  }

  return result.result?.retval || null;
};

export const waitForTransaction = async (hash) => {
  const rpcServer = getServer();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await rpcServer.getTransaction(hash);

    if (result.status === 'SUCCESS') {
      return {
        hash,
        status: result.status,
        returnValue: readScVal(result.returnValue),
        raw: result,
      };
    }

    if (result.status === 'FAILED') {
      throw new Error('Transaction failed on-chain.');
    }

    await sleep(NETWORK_CONFIG.txPollIntervalMs);
  }

  throw new Error('Transaction confirmation timed out.');
};

export const getNativeBalance = async (publicKey) => {
  const response = await fetch(`${NETWORK_CONFIG.horizonUrl}/accounts/${publicKey}`);
  if (!response.ok) {
    throw new Error('Unable to load account balance from Horizon.');
  }

  const account = await response.json();
  const native = account.balances?.find((balance) => balance.asset_type === 'native');
  return native?.balance || '0';
};
