import { useCallback, useEffect, useState } from 'react';
import { isConnected, requestAccess } from '@stellar/freighter-api';
import { getNativeBalance } from '../services/stellarClient';

export const useWallet = () => {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadBalance = useCallback(async (publicKey) => {
    try {
      const nextBalance = await getNativeBalance(publicKey);
      setBalance(nextBalance);
    } catch (balanceError) {
      console.warn(balanceError);
      setBalance('');
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const connection = await isConnected();
      if (connection.error) {
        throw new Error(connection.error.message || 'Freighter connection failed.');
      }

      if (!connection.isConnected) {
        throw new Error('Freighter wallet is not installed or unavailable.');
      }

      const access = await requestAccess();
      if (access.error) {
        throw new Error(access.error.message || 'Wallet access was rejected.');
      }

      if (!access.address) {
        throw new Error('Freighter did not return a wallet address.');
      }

      setAddress(access.address);
      await loadBalance(access.address);
      return access.address;
    } catch (connectError) {
      setError(connectError.message || 'Wallet connection failed.');
      throw connectError;
    } finally {
      setLoading(false);
    }
  }, [loadBalance]);

  useEffect(() => {
    isConnected().catch(() => null);
  }, []);

  return {
    address,
    balance,
    loading,
    error,
    connected: Boolean(address),
    connect,
    refreshBalance: () => (address ? loadBalance(address) : Promise.resolve()),
  };
};
