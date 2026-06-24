import { Account, Contract, TransactionBuilder, rpc, xdr } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { requireFeedbackContractId } from '../config/contracts';
import { NETWORK_CONFIG } from '../config/network';

const server = new rpc.Server(NETWORK_CONFIG.rpcUrl);

export const createFeedbackEntry = async (text, walletAddress) => {
  if (!NETWORK_CONFIG.rpcUrl) {
    throw new Error('Missing VITE_RPC_URL. Configure a Soroban RPC URL before using contract calls.');
  }

  const contract = new Contract(requireFeedbackContractId());
  const account = await server.getAccount(walletAddress);

  const tx = new TransactionBuilder(account, {
    fee: NETWORK_CONFIG.baseFee,
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call('create_feedback', xdr.ScVal.scvString(text)))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signedXdr = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  });
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_CONFIG.networkPassphrase);

  const result = await server.sendTransaction(signedTx);
  if (result.status !== 'PENDING') {
    throw new Error('Transaction failed');
  }

  // Poll for result
  let txResult;
  while (!txResult) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    txResult = await server.getTransaction(result.hash);
  }

  if (txResult.status !== 'SUCCESS') {
    throw new Error('Transaction failed');
  }

  // Extract the returned ID from the result
  const returnValue = txResult.returnValue;
  return returnValue.u32(); // Assuming it returns u32
};

export const getFeedbackEntry = async (id) => {
  if (!NETWORK_CONFIG.rpcUrl) {
    throw new Error('Missing VITE_RPC_URL. Configure a Soroban RPC URL before using contract calls.');
  }

  const contract = new Contract(requireFeedbackContractId());

  const result = await server.simulateTransaction(
    new TransactionBuilder(new Account('GAFSR2WNOGNIFGFPHWAEBZ3VFF5EBB6TU37DU4QJXJ37EFQEGR2HLQGN', '0'), { // Dummy account for read
      fee: NETWORK_CONFIG.baseFee,
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(contract.call('get_feedback', xdr.ScVal.scvU32(id)))
      .build()
  );

  if (result.result.retval.switch() === xdr.ScValType.scvString()) {
    return result.result.retval.str().toString();
  }
  return null;
};
